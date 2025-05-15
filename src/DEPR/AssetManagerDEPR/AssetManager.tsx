import React, { useState, useCallback } from 'react';

const FileUploader = ({ ready, onAssetUpload, assets, setAssets }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  // Determine emoji for non-image files
  const getEmoji = (type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type === 'application/pdf') return '📄';
    return '📎';
  };

  // Read and process dropped files
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
                    asset_id: crypto.randomUUID(),
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
                  asset_id: crypto.randomUUID(),
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

  // Drag event handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  if (!ready) return <div>Loading…</div>;

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDragActive ? 'rgba(0,0,0,0.1)' : 'transparent',
        transition: 'background-color 0.2s ease',
        zIndex: 999,
      }}
    >
      <div
        style={{
          border: isDragActive ? '3px dashed #3f51b5' : '2px dashed #ccc',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#fff',
          boxShadow: isDragActive ? '0 0 20px rgba(63,81,181,0.4)' : 'none',
          pointerEvents: 'none',
        }}
      >
        {isDragActive ? 'Release to upload files' : 'Drag & drop files here (or paste) to upload'}
      </div>

      {/* Previews */}
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          justifyContent: 'center',
        }}
      >
        {assets.map((asset) => (
          <div
            key={asset.asset_id}
            style={{
              width: '100px',
              textAlign: 'center',
              pointerEvents: 'auto',
            }}
          >
            {asset.asset_type.startsWith('image/') ? (
              <img
                src={asset.dataUrl}
                alt={asset.asset_name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80px',
                  borderRadius: '4px',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{ fontSize: '48px' }}>{getEmoji(asset.asset_type)}</div>
            )}
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {asset.asset_name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileUploader;
