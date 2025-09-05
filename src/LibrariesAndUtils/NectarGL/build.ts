// dslBuilder.ts
// Build-time preprocessor + expander for your DSL.
// - Does NOT modify your parser. It imports it and feeds it processed text.
// - Namespaces top-level IDs (e.g., "blur1.out3").
// - Rewrites resource references in JSON bodies from <id> / <?slot> to JSON strings.
// - Recursively expands `use` entries.
//
// Usage:
//   const entries = await buildDsl("https://example.com/scene.dsl");
//
// Notes:
//   • `use` entry format (example):
//       blur1 : use {
//         path: "./blur.dsl",
//         // optional; any key among: bind | inputs | vars | params
//         bind: { input: "out1" }
//       };
//
//   • Inside imported module bodies, use <localId> or <?slotName>.
//     References with dots are treated as absolute: <ns.someId> (no extra prefix).

import parseScript from "./altParse";
import type { ParsedEntry } from "./altParse";

export type BuildOptions = {
  /** Custom fetch (Node <18, testing, etc.). Must return file contents as string. */
  fetchText?: (absPath: string) => Promise<string>;
  base?: string;
};

export default async function build(entryPath: string, opts: BuildOptions = {}): Promise<ParsedEntry[]> {
  const ctx: BuildContext = {
    fetchText: opts.fetchText ?? defaultFetchText,
    // memoize raw file text by absolute URL/path
    textCache: new Map<string, string>(),
  };
  // start with root: no namespace, no slots
  const result = await buildFrom(entryPath, "", {}, ctx, /*stack*/ opts.base ? [opts.base] : [], opts.base);
  return result;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Internals                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

type BuildContext = {
  fetchText: (absPath: string) => Promise<string>;
  textCache: Map<string, string>;
};

async function buildFrom(
  path: string,
  namespace: string,
  slots: Record<string, string>,
  ctx: BuildContext,
  stack: string[],
  base?: string
): Promise<ParsedEntry[]> {
  const abs = toAbsolute(path, stack[stack.length - 1]);
  if (stack.includes(abs)) {
    throw new Error(`Cyclic dependency detected:\n${[...stack, abs].join(" -> ")}`);
  }
  const raw = await loadText(abs, ctx);
  const pre = preprocessText(raw, namespace, slots);

  // Parse (using your unchanged parser)
  const parsed = await parseScript(pre, base);

  // Expand uses recursively
  const out: ParsedEntry[] = [];
  for (const e of parsed) {
    const kind = e.type.toLowerCase();
    if (kind !== "use") {
      out.push(e);
      continue;
    }

    // Use this entry's ID as the namespace for its module
    const childNs = e.id; // already namespaced by preprocessText for this file
    const usePath = getUsePath(e);
    const bindings = getUseBindings(e); // slots mapping

    const childEntries = await buildFrom(
      toAbsolute(usePath, abs),
      childNs,
      bindings,
      ctx,
      [...stack, abs],
      base
    );

    // Merge child entries (the `use` entry itself is dropped)
    out.push(...childEntries);
  }

  return out;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Preprocessing (no parser changes)                                        */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Preprocess raw DSL text:
 *  1) Extract top-level sections → SECTION#id placeholders (like parser does).
 *  2) Read top-level declarations from simplified text.
 *  3) Apply namespace (if non-empty) to ALL top-level IDs.
 *  4) In each section body:
 *      - Replace `<?slot>` with bound ID (no extra prefix).
 *      - Replace `<localId>` with `"namespace.localId"` (or keep absolute `<ns.id>`).
 *      - Leave `<<<glsl ... >>>` intact.
 *  5) Reconstruct a single DSL text the parser can consume.
 */
export function preprocessText(
  raw: string,
  namespace: string,
  slots: Record<string, string>
): string {
    const step1 = stripCommentsTrimAndDropEmpties(raw);
  const { simplified, sections } = extractTopSections(step1);

  // Split simplified string into decl parts (like parser)
  const parts = simplified.split(";").map((s) => s.trim()).filter(Boolean);

  type Decl = { name: string; kind: string; secKey: string };
  const decls: Decl[] = parts.map((part) => {
    const m = /^([A-Za-z_]\w*)\s*:\s*([A-Za-z_]\w*)\s*SECTION#(SECTION_\d+)\s*$/.exec(part);
    if (!m) {
      throw new Error(`Malformed declaration in preprocessing: "${part}"`);
    }
    return { name: m[1], kind: m[2], secKey: m[3] };
  });

  // Rebuild with namespacing + angle-ref replacement
  const chunks: string[] = [];
  for (const d of decls) {
    const newName = namespace ? `${namespace}_${d.name}` : d.name;
    const bodyRaw = sections[d.secKey] ?? "";
    const bodyProcessed = rewriteBodyRefs(bodyRaw, namespace, slots);
    chunks.push(`${newName} : ${d.kind} {`);
    chunks.push(bodyProcessed);
    chunks.push(`};\n`);
  }

  return chunks.join("\n");
}

/** Replace <id> and <?slot> tokens inside a section body (string), preserving GLSL fences. */
function rewriteBodyRefs(
  body: string,
  namespace: string,
  slots: Record<string, string>
): string {
  // Temporarily protect GLSL fences so angle-ref regex doesn't touch inside them.
  const fences: string[] = [];
  let fencedBody = body.replace(/<<<\s*glsl\s*\n([\s\S]*?)\n>>>/g, (_m, code: string) => {
    fences.push(code);
    return `__GLSL_FENCE_${fences.length - 1}__`;
  });

  // 1) Variables: <?slotName>
  fencedBody = fencedBody.replace(/<\s*\?([A-Za-z_]\w*)\s*>/g, (_m, slotName: string) => {
    const bound = slots[slotName];
    if (!bound) {
      throw new Error(`Unbound slot "<?${slotName}>". Provide a mapping in 'use'.`);
    }
    // Use bound value verbatim; DO NOT prefix with this module's namespace.
    return JSON.stringify(bound);
  });

  // 2) Resource refs: <id> or <ns.id> (dot means absolute; don't prefix)
  fencedBody = fencedBody.replace(/<\s*([A-Za-z_][\w.]*?)\s*>/g, (_m, ref: string) => {
    const isAbsolute = ref.includes(".");
    const resolved = isAbsolute ? ref : (namespace ? `${namespace}_${ref}` : ref);
    return JSON.stringify(resolved);
  });

  // Restore GLSL fences
  fencedBody = fencedBody.replace(/__GLSL_FENCE_(\d+)__/g, (_m, idx: string) => {
    const i = Number(idx);
    return `<<<glsl\n${fences[i]}\n>>>`;
  });

  return fencedBody;
}

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

/**
 * Extract top-level sections (like your parser), but returns both:
 *  - a simplified string with SECTION#tokens in place of bodies
 *  - a map id -> body content (WITHOUT outer braces)
 */
function extractTopSections(src: string): { simplified: string; sections: Record<string, string> } {
  const sections: Record<string, string> = {};
  let counter = 0;

  let out = "";
  let lastFlush = 0;
  let depth = 0;
  let startIdx = -1;

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
      inStr = ch as any;
      continue;
    }

    if (ch === "{") {
      depth++;
      if (depth === 1) {
        out += src.slice(lastFlush, i);
        startIdx = i;
      }
      continue;
    }

    if (ch === "}") {
      if (depth === 0) {
        throw new Error(`Unmatched '}' at index ${i}`);
      }
      depth--;
      if (depth === 0) {
        const inner = src.slice(startIdx + 1, i);
        const id = `SECTION_${++counter}`;
        sections[id] = inner;
        out += ` SECTION#${id} `;
        lastFlush = i + 1;
      }
      continue;
    }
  }
  if (depth !== 0) {
    throw new Error(`Unclosed top-level section detected.`);
  }
  out += src.slice(lastFlush);
  return { simplified: out, sections };
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function getUsePath(e: ParsedEntry): string {
  const p = e.data?.path;
  if (typeof p !== "string" || !p.trim()) {
    throw new Error(`'use' entry "${e.id}" is missing a valid 'path' string.`);
  }
  return p.trim();
}

function getUseBindings(e: ParsedEntry): Record<string, string> {
  const src =
    e.data?.bind ??
    e.data?.inputs ??
    e.data?.vars ??
    e.data?.params ??
    {};
  if (src && typeof src === "object") return { ...src };
  return {};
}

async function loadText(absPath: string, ctx: BuildContext): Promise<string> {
  if (ctx.textCache.has(absPath)) return ctx.textCache.get(absPath)!;
  const text = await ctx.fetchText(absPath);
  ctx.textCache.set(absPath, text);
  return text;
}

async function defaultFetchText(absPath: string): Promise<string> {
  const res = await fetch(absPath);
  if (!res.ok) throw new Error(`Failed to fetch "${absPath}": ${res.status} ${res.statusText}`);
  return await res.text();
}

function toAbsolute(path: string, base?: string): string {
  try {
    // If already absolute URL:
    return new URL(path, base ?? (typeof window !== "undefined" ? window.location.href : "file:///")).toString();
  } catch {
    // Fallback: return as-is
    return path;
  }
}
