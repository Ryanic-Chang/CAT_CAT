import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Folder, Plus, Check, Loader2, Bookmark, RefreshCw, AlertCircle } from 'lucide-react';

interface BookmarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (parentId: string, title: string) => void;
}

interface FlattenedFolder {
  id: string;
  title: string;
  depth: number;
}

export const BookmarkDialog: React.FC<BookmarkDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [folders, setFolders] = useState<FlattenedFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('1'); // Default to Bookmarks Bar
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [pageTitle, setPageTitle] = useState('');

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setPageTitle(document.title);
      fetchFolders();
    } else {
      // Clean up when closed
      setFolders([]);
      setLoading(false);
      setError(null);
      setNewFolderMode(false);
      setNewFolderName('');
    }
  }, [isOpen]);

  const fetchFolders = () => {
    setLoading(true);
    setError(null);
    setFolders([]); // Clear previous data

    // Timeout fallback
    const timeoutId = setTimeout(() => {
      setLoading(false);
      if (folders.length === 0) {
        setError("Loading timeout. Please retry.");
        // Fallback: Add basic folders if nothing loaded
        setFolders([
          { id: '1', title: 'Bookmarks Bar', depth: 0 },
          { id: '2', title: 'Other Bookmarks', depth: 0 }
        ]);
        setSelectedFolderId('1');
      }
    }, 5000);

    try {
      chrome.runtime.sendMessage({ type: 'BOOKMARK_GET_FOLDERS' }, (response) => {
        clearTimeout(timeoutId);
        setLoading(false);
        
        if (chrome.runtime.lastError) {
          setError(chrome.runtime.lastError.message || "Communication error");
          return;
        }

        if (response && response.data) {
          setFolders(response.data);
          
          // Smart default selection
          const bar = response.data.find((f: any) => f.id === '1');
          if (bar) setSelectedFolderId('1');
          else if (response.data.length > 0) setSelectedFolderId(response.data[0].id);
        } else {
           setError("No folder data received.");
        }
      });
    } catch (e: any) {
      clearTimeout(timeoutId);
      setLoading(false);
      setError(e.message || "Failed to send message");
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    setLoading(true);
    
    try {
      chrome.runtime.sendMessage({ 
        type: 'BOOKMARK_CREATE_FOLDER', 
        payload: { parentId: selectedFolderId, title: newFolderName } 
      }, (response) => {
        if (chrome.runtime.lastError) {
          setLoading(false);
          alert("Error creating folder: " + chrome.runtime.lastError.message);
          return;
        }

        if (response && response.success) {
          setNewFolderName('');
          setNewFolderMode(false);
          // Refresh list
          fetchFolders();
          // Select the new folder (assuming we find it in refresh, or just set it)
          if (response.data && response.data.id) {
             setSelectedFolderId(response.data.id);
          }
        } else {
          setLoading(false);
        }
      });
    } catch (e) {
      setLoading(false);
      alert("Error: " + e);
    }
  };

  const renderFolderList = () => {
    if (loading && folders.length === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
          <Loader2 className="animate-spin" style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: '13px' }}>Loading folders...</div>
        </div>
      );
    }

    if (error && folders.length === 0) {
      return (
        <div style={{ padding: '30px', textAlign: 'center', color: '#F44336' }}>
          <AlertCircle style={{ margin: '0 auto 10px' }} />
          <div style={{ fontSize: '13px', marginBottom: '10px' }}>{error}</div>
          <button 
            onClick={fetchFolders}
            style={{ padding: '6px 12px', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '4px', cursor: 'pointer', color: '#D32F2F', fontSize: '12px' }}
          >
            Retry
          </button>
        </div>
      );
    }

    return folders.map(folder => {
      const isSelected = selectedFolderId === folder.id;
      return (
        <div 
          key={folder.id}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedFolderId(folder.id);
          }}
          style={{
            padding: '8px 12px',
            paddingLeft: `${folder.depth * 20 + 12}px`,
            cursor: 'pointer',
            background: isSelected ? '#e3f2fd' : 'transparent',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: isSelected ? '#1565C0' : '#444',
            transition: 'background 0.2s',
            marginBottom: '2px'
          }}
        >
          <Folder size={16} fill={isSelected ? '#1976d2' : '#FFD700'} color={isSelected ? '#1565C0' : '#F57C00'} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {folder.title}
          </span>
          {isSelected && <Check size={14} style={{ marginLeft: 'auto', color: '#1976d2' }} />}
        </div>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000000
    }}>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', pointerEvents: 'auto', zIndex: 10000001
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{
          width: '380px', maxWidth: '90vw', maxHeight: '85vh',
          background: 'white', borderRadius: '16px', padding: '0',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column',
          pointerEvents: 'auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          overflow: 'hidden', zIndex: 10000002
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bookmark size={18} color="#FF8C42" fill="#FF8C42" /> Add Bookmark
          </h2>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '4px', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px', marginLeft: '2px' }}>NAME</label>
            <input 
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '14px', outline: 'none' }}
              placeholder="Bookmark Name"
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '200px', overflow: 'hidden' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 2px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#666' }}>FOLDER</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); fetchFolders(); }}
                        title="Refresh Folders"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '2px', display: 'flex' }}
                    >
                        <RefreshCw size={14} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setNewFolderMode(!newFolderMode); }}
                        style={{ background: 'none', border: 'none', color: '#2196F3', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500 }}
                    >
                        <Plus size={14} /> New Folder
                    </button>
                </div>
            </div>

            {newFolderMode && (
                <div style={{ marginBottom: '10px', padding: '10px', background: '#F3F9FE', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center', border: '1px solid #E1F5FE' }}>
                <input 
                    placeholder="New Folder Name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #B3E5FC', fontSize: '13px', outline: 'none' }}
                    autoFocus
                />
                <button 
                    onClick={(e) => { e.stopPropagation(); handleCreateFolder(); }}
                    disabled={loading}
                    style={{ background: '#2196F3', color: 'white', border: 'none', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                </button>
                </div>
            )}

            <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                border: '1px solid #eee', 
                borderRadius: '8px', 
                padding: '6px',
                background: '#fafafa'
            }}>
                {renderFolderList()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'white' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }} 
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#555' }}
          >
            Cancel
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onSave(selectedFolderId, pageTitle); }}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#FF8C42', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, boxShadow: '0 2px 5px rgba(255, 140, 66, 0.3)' }}
          >
            Save Bookmark
          </button>
        </div>
      </motion.div>
    </div>
  );
};
