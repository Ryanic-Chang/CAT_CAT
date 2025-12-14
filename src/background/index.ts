console.log('CAT_CAT Background Service Worker Running');

chrome.runtime.onInstalled.addListener(() => {
  console.log('CAT_CAT Extension Installed');
});

// Alarm Listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'health-reminder') {
    // Send message to all active tabs
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0 && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_HEALTH_REMINDER' })
          .catch(err => console.log('Tab not ready or content script missing:', err));
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  if (message.type === 'UPDATE_REMINDER_SETTINGS') {
    chrome.storage.sync.get(['reminderEnabled', 'reminderInterval'], (result) => {
      // Clear existing alarm
      chrome.alarms.clear('health-reminder', () => {
        if (result.reminderEnabled) {
          // Create new alarm
          const interval = (result.reminderInterval as number) || 30;
          chrome.alarms.create('health-reminder', {
            periodInMinutes: interval
          });
          console.log(`Reminder scheduled every ${interval} minutes.`);
        } else {
          console.log('Reminder disabled.');
        }
      });
    });
    return true;
  }

  // NEW: Get Folders Only (Flattened)
  if (message.type === 'BOOKMARK_GET_FOLDERS') {
    chrome.bookmarks.getTree((tree) => {
      const folders: { id: string, title: string, depth: number }[] = [];
      
      function traverse(nodes: chrome.bookmarks.BookmarkTreeNode[], depth: number) {
        for (const node of nodes) {
          // Check if it's a folder (no url property means folder usually)
          if (!node.url) {
            folders.push({
              id: node.id,
              title: node.title || (node.id === '0' ? 'Root' : 'Unnamed Folder'),
              depth: depth
            });
            if (node.children) {
              traverse(node.children, depth + 1);
            }
          }
        }
      }

      if (tree) {
        traverse(tree, 0);
      }
      
      console.log('Flattened folders:', folders);
      sendResponse({ success: true, data: folders });
    });
    return true;
  }

  // Deprecated: Old get tree
  if (message.type === 'BOOKMARK_GET_TREE') {
    chrome.bookmarks.getTree((tree) => {
      sendResponse({ success: true, data: tree });
    });
    return true;
  }

  if (message.type === 'BOOKMARK_CREATE_FOLDER') {
    const { parentId, title } = message.payload;
    chrome.bookmarks.create({ parentId, title }, (newFolder) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, data: newFolder });
      }
    });
    return true;
  }

  if (message.type === 'BOOKMARK_ADD') {
    const { parentId, title, url } = message.payload;
    chrome.bookmarks.create({ parentId, title, url }, (newBookmark) => {
      if (chrome.runtime.lastError) {
        console.error('Bookmark creation failed:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Bookmark created:', newBookmark);
        sendResponse({ success: true, data: newBookmark });
      }
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'BOOKMARK_SAVE') {
    const { preferredFolderId, title, url } = message.payload as { preferredFolderId?: string; title: string; url: string };

    const bookmarksGet = (id: string) => new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve) => {
      chrome.bookmarks.get(id, (nodes) => resolve(nodes || []));
    });
    const bookmarksGetTree = () => new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve) => {
      chrome.bookmarks.getTree((nodes) => resolve(nodes || []));
    });

    (async () => {
      try {
        let targetId: string | undefined = undefined;
        if (preferredFolderId) {
          const nodes = await bookmarksGet(preferredFolderId);
          if (nodes && nodes.length && !nodes[0].url) {
            targetId = preferredFolderId;
          }
        }
        if (!targetId) {
          const tree = await bookmarksGetTree();
          const root = tree[0];
          if (root && root.children && root.children.length) {
            const firstFolder = root.children.find((n) => !n.url) || root.children[0];
            targetId = firstFolder?.id || root.id;
          } else {
            targetId = root?.id || '1';
          }
        }

        chrome.bookmarks.create({ parentId: String(targetId), title, url }, (created) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true, data: created });
          }
        });
      } catch (err: any) {
        sendResponse({ success: false, error: err?.message || 'Unknown error' });
      }
    })();
    return true;
  }

  if (message.type === 'AI_SUMMARIZE') {
    handleAISummary(message.payload, sendResponse);
    return true; // Keep channel open
  }
});

async function handleAISummary(payload: { content: string; url: string }, sendResponse: (response: any) => void) {
  try {
    // Get API Key
    const { apiKey } = await chrome.storage.sync.get(['apiKey']);
    
    if (!apiKey) {
      sendResponse({ error: "API Key is missing. Please set it in the extension popup." });
      return;
    }

    const prompt = `
You are a helpful assistant.
Summarize the following web page content in English.
Also provide 3 related association links (title and url) that might be useful for further reading.
Return ONLY valid JSON in the following format (no markdown code blocks):
{
  "summary": "The summary text...",
  "associations": [
    { "title": "Link Title 1", "url": "https://..." },
    { "title": "Link Title 2", "url": "https://..." }
  ]
}

Content:
${payload.content}
    `.trim();

    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant that summarizes web pages.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" } // Force JSON if supported, or rely on prompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from AI");
    }

    try {
      // Parse JSON from content (handle potential markdown code blocks if API ignores instruction)
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      sendResponse(parsed);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      // Fallback if not JSON
      sendResponse({ 
        summary: content, 
        associations: [] 
      });
    }

  } catch (error: any) {
    console.error('AI Summary failed:', error);
    sendResponse({ error: error.message });
  }
}
