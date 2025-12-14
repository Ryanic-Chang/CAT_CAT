import React, { useState, useEffect } from 'react';
import './App.css';
import { Cat, Move, Eye, Bookmark, Bot } from 'lucide-react';

function App() {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    // Check if chrome API is available
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.get(['apiKey'], (result) => {
        if (result.apiKey) setApiKey(result.apiKey as string);
      });
    }
  }, []);

  const handleSave = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ 
        apiKey
      }, () => {
        alert('API Key saved! Meow~');
      });
    } else {
      alert('Dev mode: Settings saved!');
    }
  };

  return (
    <div className="popup-container" style={{ width: '300px', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#FF8C42', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Cat size={24} /> CAT_CAT Settings
      </h1>
      
      <div className="card" style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Qwen API Key</label>
          <input 
            type="password" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)} 
            placeholder="sk-..."
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ddd',
              boxSizing: 'border-box' 
            }}
          />
        </div>

        <button 
          onClick={handleSave} 
          style={{ 
            marginTop: '15px', 
            width: '100%', 
            padding: '8px', 
            background: '#FF8C42', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Save API Key
        </button>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Quick Guide:</p>
        <ul style={{ paddingLeft: '20px', margin: 0, listStyle: 'none' }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Move size={14} /> Drag to move the cat
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Eye size={14} /> Hover for menu
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Bookmark size={14} /> Quick bookmark
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Bot size={14} /> AI page summary
          </li>
        </ul>
      </div>
    </div>
  );
}

export default App;
