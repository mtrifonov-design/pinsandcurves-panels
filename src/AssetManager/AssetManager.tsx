import React, { useState, useCallback } from 'react';

const FileUploader = (p: { ready : boolean, onAssetUpload : Function, assets : any[], setAssets: Function }) => {
  const { ready, onAssetUpload, assets, setAssets } = p;
  const handleFiles = useCallback(async (fileList) => {
    const fileObjs = await Promise.all(
      Array.from(fileList).map(
        file =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target.result;
              if (file.type.startsWith('image/')) {
                const img = new Image();
                img.onload = () => {
                  resolve({
                    asset_name: file.name,
                    asset_type: file.type,
                    asset_id : crypto.randomUUID(),
                    width: img.width,
                    height: img.height,
                    dataUrl,
                  });
                };
                img.onerror = reject;
                img.src = dataUrl;
              } else {
                resolve({
                  asset_name: file.name,
                  asset_id : crypto.randomUUID(),
                  asset_type: file.type,
                  dataUrl,
                });
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    );

    setAssets(prev => [...prev, ...fileObjs]);
    fileObjs.forEach(obj => onAssetUpload?.(obj));
  }, [onAssetUpload, setAssets]);

  const onDragOver = e => e.preventDefault();
  const onDrop = e => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  if (!ready) {
    return <div>Loading…</div>;
  }

  return (
    <div>
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '4px',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        Drag & drop files here (or paste) to upload
      </div>
      <ul>
        {assets.map((asset, i) => (
          <li key={i}>
            {asset.asset_name} — {asset.asset_type}
            {asset.width && ` (${asset.width}×${asset.height})`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileUploader;
