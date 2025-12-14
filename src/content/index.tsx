import React from 'react';
import { createRoot } from 'react-dom/client';
import { CatWidget } from '@/components/CatWidget';
import './index.css';

console.log('CAT_CAT Content Script Loaded');

const ROOT_ID = 'cat-cat-extension-root';

// 确保只注入一次
if (!document.getElementById(ROOT_ID)) {
  const container = document.createElement('div');
  container.id = ROOT_ID;
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <div className="cat-cat-widget">
        <CatWidget />
      </div>
    </React.StrictMode>
  );
}
