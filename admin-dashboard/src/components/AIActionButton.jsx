import React from 'react';

export default function AIActionButton({ label = 'اسأل MYBRAND AI', prompt = '' }) {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('mybrand-ai-open', { detail: { prompt } }));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={prompt}
      style={{
        border: '1px solid #D8B866',
        borderRadius: 10,
        padding: '10px 14px',
        background: '#111827',
        color: '#D8B866',
        fontWeight: 800,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      ✨ {label}
    </button>
  );
}
