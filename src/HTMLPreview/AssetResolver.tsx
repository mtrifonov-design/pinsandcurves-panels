// AssetResolver.tsx
import React, { useEffect, useRef, useState } from 'react';

type AssetType = 'html' | 'js' | 'css';

export interface RawAsset {
  content: string;
  type: AssetType;
}

export interface EnrichedAsset extends RawAsset {
  /** Direct dependencies (filenames extracted from {{ … }}). */
  dependencies: string[];
  /** Filled in once its content has been converted to a blob URL. */
  url?: string;
}

interface ResolverProps {
  /** Input set of loose files keyed by filename. */
  assets: Record<string, RawAsset>;
  /** Optional callback that receives the fully-resolved object. */
  onResolved?: (resolved: Record<string, EnrichedAsset>) => void;
  children?: React.ReactNode;
}

const ResolvedAssetContext = React.createContext<Record<string, EnrichedAsset> | null>(null);
const useResolvedAssets = () => {
  const context = React.useContext(ResolvedAssetContext);
  if (!context) {
    throw new Error('useResolvedAssets must be used within an AssetResolver');
  }
  return context;
}

/**
 * React wrapper: converts the incoming `assets` object into a fully-resolved
 * structure (with dependencies, blob URLs and cycle checks) and cleans up all
 * blob URLs when the prop changes or the component unmounts.
 */
const AssetResolver: React.FC<ResolverProps> = ({ assets, children }) => {
  const [resolved, setResolved] = useState<Record<string, EnrichedAsset>>({});
  /** Registry of filename → blob URL for later revocation. */
  const urlRegistry = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    // revoke any URLs left from the previous run
    for (const url of urlRegistry.current.values()) URL.revokeObjectURL(url);
    urlRegistry.current.clear();

    try {
      const out = processAssets(assets, urlRegistry.current);
      setResolved(out);
    } catch (err) {
      console.error('[AssetResolver]', err);
    }

    // final cleanup on unmount
    return () => {
      for (const url of urlRegistry.current.values()) URL.revokeObjectURL(url);
      urlRegistry.current.clear();
    };
  }, [assets]);

  // render nothing — the caller gets results via the callback
  return <>
    <ResolvedAssetContext.Provider value={resolved}>
      {children}
    </ResolvedAssetContext.Provider>
  </>;
};



/* -------------------------------------------------------------------------- */
/* ---------------------------  Pure TypeScript  ---------------------------- */
/* -------------------------------------------------------------------------- */

const PLACEHOLDER_RE = /\{\{([^{}]+)\}\}/g;

/** Extracts the `{{file}}` markers from a string. */
function extractPlaceholders(source: string): string[] {
  const deps: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = PLACEHOLDER_RE.exec(source))) deps.push(m[1].trim());
  return deps;
}

/** MIME types for each asset category. */
const MIME_MAP: Record<AssetType, string> = {
  html: 'text/html',
  js:   'application/javascript',
  css:  'text/css',
};

/** Creates a Blob URL for a given asset. */
function createBlobURL(asset: RawAsset): string {
  const blob = new Blob([asset.content], { type: MIME_MAP[asset.type] ?? 'text/plain' });
  return URL.createObjectURL(blob);
}

/**
 * Core algorithm – returns a *new* object whose values are fully-enriched
 * `EnrichedAsset`s. Throws on missing root, unknown references or cycles.
 */
function processAssets(
  raw: Record<string, RawAsset>,
  registry: Map<string, string>,
): Record<string, EnrichedAsset> {
  if (!raw['index.html']) throw new Error('Root asset "index.html" not found');

  // clone input into mutable enriched objects
  const enriched: Record<string, EnrichedAsset> = {};
  for (const [name, asset] of Object.entries(raw))
    enriched[name] = { ...asset, dependencies: [] };

  /* ---------- 1. Build dependency graph & detect cycles (DFS) ---------- */

  const visiting = new Set<string>();
  const visited  = new Set<string>();

  function dfs(name: string, stack: string[]) {
    if (!enriched[name]) throw new Error(`Referenced asset "${name}" does not exist`);
    if (visiting.has(name))
      throw new Error(`Cycle detected: ${[...stack, name].join(' → ')}`);
    if (visited.has(name)) return; // already processed elsewhere

    visiting.add(name);

    const deps = extractPlaceholders(enriched[name].content);
    enriched[name].dependencies = deps;

    for (const dep of deps) dfs(dep, [...stack, name]);

    visiting.delete(name);
    visited.add(name);
  }
  dfs('index.html', []);

  /* ---------------------- 2. Prune unreachable nodes -------------------- */

  for (const name of Object.keys(enriched))
    if (!visited.has(name)) delete enriched[name];

  /* ---------------- 3. Bottom-up URL propagation loop ------------------ */

  const unresolved = new Set(Object.keys(enriched));

  while (unresolved.size) {
    const leaf = [...unresolved].find(f => enriched[f].dependencies.length === 0);
    if (!leaf) throw new Error('Unresolvable dependencies (cycle or missing reference)');

    // ensure this leaf already has its Blob URL
    if (!enriched[leaf].url) {
      const url = createBlobURL(enriched[leaf]);
      enriched[leaf].url = url;
      registry.set(leaf, url);
    }

    // replace its placeholders in every parent and update their dependency lists
    for (const name of unresolved) {
      const idx = enriched[name].dependencies.indexOf(leaf);
      if (idx !== -1) {
        const ph = `{{${leaf}}}`;
        enriched[name].content = enriched[name].content.split(ph).join(enriched[leaf].url!);
        enriched[name].dependencies.splice(idx, 1);
      }
    }

    unresolved.delete(leaf);       // this file is now fully resolved
  }

  return enriched;
}

export default AssetResolver;
export {useResolvedAssets};
