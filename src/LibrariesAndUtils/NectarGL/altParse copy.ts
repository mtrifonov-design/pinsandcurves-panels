// dslParser.ts
// A simple, maintainable parser that follows your specified pipeline.
// Dependencies: json5 (npm i json5)

import JSON5 from "json5";

export type ParsedEntry = {
  id: string;   // e.g. "p_bg"
  type: string;   // e.g. "Program"
  data: any;      // JSON5-parsed object with GLSL fences restored
};

export default function parseScript(raw: string): ParsedEntry[] {
  // 1) Strip trailing // comments, trim lines, drop empties, then rejoin
  const step1 = stripCommentsTrimAndDropEmpties(raw);

  // 2) Extract GLSL fences <<<glsl ... >>> into a dict; replace with "GLSL;ID"
  const { srcOut: step2, glslMap } = extractGlslFences(step1);

  // 3) Extract top-level { ... } sections into a dict; replace with SECTION#ID
  const { srcOut: step3, sectionMap } = extractTopLevelSections(step2);

  // 4) Parse declarations "name : Kind SECTION#ID;" and JSON5-parse their bodies
  const entries = parseDeclarations(step3, sectionMap, glslMap);

  return entries;
}

/* =========================
 * 1) Comments / trimming
 * ========================= */
function stripCommentsTrimAndDropEmpties(src: string): string {
  // NOTE: This will remove // comments even if they appear inside GLSL fences.
  // That’s per the instruction order: comments pass happens before fence extraction.
  const lines = src.split(/\r?\n/);
  const cleaned: string[] = [];

  for (let line of lines) {
    const idx = line.indexOf("//");
    if (idx !== -1) {
      line = line.slice(0, idx);
    }
    const t = line.trim();
    if (t.length > 0) cleaned.push(t);
  }

  return cleaned.join("\n");
}

/* =========================
 * 2) GLSL fences
 * ========================= */
type GLSLMap = Record<string, string>;

function extractGlslFences(src: string): { srcOut: string; glslMap: GLSLMap } {
  const glslMap: GLSLMap = {};
  let glslCounter = 0;

  // Pattern: <<<glsl\n ... \n>>> (non-greedy across lines)
  // Allows whitespace around "glsl".
  const fence = /<<<\s*glsl\s*\n([\s\S]*?)\n>>>/g;

  const srcOut = src.replace(fence, (_m, code: string) => {
    const id = `GLSL_${++glslCounter}`;
    glslMap[id] = code;
    // Replace with JSON5 string so the body remains valid JSON5 later.
    return JSON.stringify(`GLSL;${id}`);
  });

  return { srcOut, glslMap };
}

/* =========================
 * 3) Top-level { ... } sections
 * ========================= */
type SectionMap = Record<string, string>;

function extractTopLevelSections(src: string): { srcOut: string; sectionMap: SectionMap } {
  const sectionMap: SectionMap = {};
  let sectionCounter = 0;

  let out = "";
  let lastFlush = 0;

  let depth = 0;
  let startIdx = -1;

  // simple string-state to ignore braces inside ' " ` strings
  let inStr: '"' | "'" | "`" | null = null;
  let esc = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];

    if (inStr) {
      if (esc) {
        esc = false;
      } else if (ch === "\\") {
        esc = true;
      } else if (ch === inStr) {
        inStr = null;
      }
      continue;
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      inStr = ch as '"' | "'" | "`";
      continue;
    }

    if (ch === "{") {
      depth++;
      if (depth === 1) {
        // entering a top-level section: flush up to before '{'
        out += src.slice(lastFlush, i);
        startIdx = i;
      }
      continue;
    }

    if (ch === "}") {
      if (depth === 0) {
        const { line, col } = posToLineCol(src, i);
        throw new Error(`Unmatched closing brace at ${line}:${col}`);
      }
      depth--;
      if (depth === 0) {
        // closing a top-level section
        const inner = src.slice(startIdx + 1, i);
        const id = `SECTION_${++sectionCounter}`;
        sectionMap[id] = inner;
        out += ` SECTION#${id} `;
        lastFlush = i + 1;
      }
      continue;
    }
  }

  if (depth !== 0) {
    const { line, col } = posToLineCol(src, startIdx >= 0 ? startIdx : 0);
    throw new Error(`Unclosed top-level section starting at ${line}:${col}`);
  }

  out += src.slice(lastFlush);
  return { srcOut: out, sectionMap };
}

/* =========================
 * 4) Declarations + JSON5
 * ========================= */
function parseDeclarations(
  src: string,
  sectionMap: SectionMap,
  glslMap: GLSLMap
): ParsedEntry[] {
  // Now we expect a sequence like:
  // name : Kind SECTION#SECTION_1;
  // name2 : Kind2 SECTION#SECTION_2;
  //
  // Split by semicolons; ignore empty parts.
  const parts = src.split(";").map((s) => s.trim()).filter(Boolean);

  const entries: ParsedEntry[] = [];

  for (const part of parts) {
    // Extract name, kind, section id
    const m = /^([A-Za-z_]\w*)\s*:\s*([A-Za-z_]\w*)\s*SECTION#(SECTION_\d+)\s*$/.exec(part);
    if (!m) {
      throw new Error(
        `Malformed declaration (expected \`name : Kind SECTION#SECTION_n\`): "${part}"`
      );
    }
    const [, name, kind, secId] = m;

    const body = sectionMap[secId];
    if (body == null) {
      throw new Error(`Unknown ${secId} referenced by declaration "${name} : ${kind}"`);
    }

    let data: any;
    try {
      // Body was captured without the outer braces, so wrap it back
      // JSON5 allows comments, trailing commas, unquoted keys, single quotes, etc.
      data = JSON5.parse(`{${body}}`);
    } catch (e: any) {
      throw new Error(
        `JSON5 parse error in ${name}:${kind} (${secId}): ${e?.message ?? String(e)}`
      );
    }

    // Replace "GLSL;ID" strings deeply with original GLSL code
    const resolved = deepReplaceGlslPlaceholders(data, glslMap, `${name}:${kind}`);

    entries.push({ id: name, type: kind, data: resolved });
  }

  return entries;
}

function deepReplaceGlslPlaceholders(value: any, glslMap: GLSLMap, ctx: string): any {
  if (typeof value === "string") {
    const m = /^GLSL;([A-Za-z0-9_]+)$/.exec(value);
    if (!m) return value;
    const id = m[1];
    const code = glslMap[id];
    if (code == null) {
      throw new Error(`Missing GLSL block "${id}" referenced in ${ctx}`);
    }
    return code;
  }
  if (Array.isArray(value)) {
    return value.map((v) => deepReplaceGlslPlaceholders(v, glslMap, ctx));
  }
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = deepReplaceGlslPlaceholders(v, glslMap, ctx);
    }
    return out;
  }
  return value;
}

/* =========================
 * Utilities
 * ========================= */
function posToLineCol(s: string, idx: number) {
  const upTo = s.slice(0, Math.max(0, idx));
  const lines = upTo.split(/\r?\n/);
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  return { line, col };
}

/* =========================
 * Example usage (remove or adapt in your codebase)
 * =========================
import fs from "node:fs";
const raw = fs.readFileSync("script.dsl", "utf8");
const entries = parseScript(raw);
console.log(entries);
*/
