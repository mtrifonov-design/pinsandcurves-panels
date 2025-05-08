// PreviewFrame.tsx
import React, { useEffect, useRef } from 'react';
import { useResolvedAssets } from './AssetResolver';   // adapt path as needed
import useTimelineRelay from './useTimelineRelay';

const HTMLPreviewContent: React.FC = () => {
  const assets = useResolvedAssets();           // { [name]: EnrichedAsset }
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useTimelineRelay();

  // Resolve the current URL for index.html (may be undefined on first render)
  const indexURL = assets['index.html']?.url;

  /* Push the new URL into the existing <iframe> whenever it changes. */
  useEffect(() => {
    if (!iframeRef.current || !indexURL) return;
    iframeRef.current.src = indexURL;
  }, [indexURL]);

  // While the root isn’t ready, render nothing (or a loader, your choice)
  if (!indexURL) return null;

  return (
    <iframe
      ref={iframeRef}
      title="preview"
      style={{ width: '100vw', height: '100vh', border: 'none' }}
      // Leave src unset here; useEffect sets it so we don’t remount the element
    />
  );
};

export default HTMLPreviewContent;
