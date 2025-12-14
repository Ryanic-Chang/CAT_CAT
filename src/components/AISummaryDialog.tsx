import React from 'react';
import { motion } from 'framer-motion';
import { X, Download, ExternalLink, Loader2 } from 'lucide-react';

interface AISummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  data: {
    summary?: string;
    associations?: { title: string; url: string }[];
  } | null;
  error?: string | null;
}

export const AISummaryDialog: React.FC<AISummaryDialogProps> = ({ isOpen, onClose, isLoading, data, error }) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    if (!data?.summary) return;
    const blob = new Blob([`Summary:\n${data.summary}\n\nAssociations:\n${data.associations?.map(a => `- ${a.title}: ${a.url}`).join('\n')}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page-summary.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000000,
      pointerEvents: 'none' // Allow clicking through background, but we need a backdrop
    }}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          pointerEvents: 'auto'
        }}
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={{
          width: '500px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          pointerEvents: 'auto',
          fontFamily: 'sans-serif'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
            AI Page Summary
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: '200px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', gap: '12px' }}>
              <Loader2 size={40} className="animate-spin" />
              <p>Thinking... (This may take a few seconds)</p>
            </div>
          ) : error ? (
            <div style={{ color: '#ef4444', textAlign: 'center', marginTop: '40px' }}>
              <p>Error: {error}</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Please check your API Key in settings.</p>
            </div>
          ) : data ? (
            <div style={{ lineHeight: '1.6', color: '#333' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#FF8C42' }}>Summary</h3>
              <p style={{ whiteSpace: 'pre-wrap', marginBottom: '20px' }}>{data.summary}</p>
              
              {data.associations && data.associations.length > 0 && (
                <>
                  <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#2196F3' }}>Associations</h3>
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {data.associations.map((link, index) => (
                      <li key={index} style={{ marginBottom: '8px' }}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: '#2196F3', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {link.title} <ExternalLink size={14} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!isLoading && !error && data && (
          <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleDownload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              <Download size={18} /> Download
            </button>
          </div>
        )}
      </motion.div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
