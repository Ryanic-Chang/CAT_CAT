import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cat, X, Clock } from 'lucide-react';
import { FunctionMenu } from './FunctionMenu';
import { AISummaryDialog } from './AISummaryDialog';
import { BookmarkDialog } from './BookmarkDialog';

export const CatWidget: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // AI Summary State
  const [showSummary, setShowSummary] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiData, setAiData] = useState<{ summary?: string; associations?: any[] } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Bookmark State
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);

  // Interaction State
  const [isInteracting, setIsInteracting] = useState(false);

  // Reminder State
  const [showReminder, setShowReminder] = useState(false);
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [reminderIntervalInput, setReminderIntervalInput] = useState(30);
  const [autoTalkEnabled] = useState(true);

  useEffect(() => {
    let mounted = true;
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const schedule = () => {
      const nextIn = 25000 + Math.floor(Math.random() * 35000);
      setTimeout(() => {
        if (!mounted) return;
        if (!autoTalkEnabled) { schedule(); return; }
        if (isHovered || showReminder || showBookmarkDialog || showSummary || message) { schedule(); return; }
        const lines = [
          "I'm here if you need me!",
          "Meow~ Need a quick bookmark?",
          "Want a summary of this page?",
          "Stretch time? I can remind you!",
          "Drag me anywhere you like~",
          "I can save this page for you!",
        ];
        const text = pick(lines);
        setMessage(text);
        setTimeout(() => setMessage(null), 4000);
        schedule();
      }, nextIn);
    };
    schedule();
    return () => { mounted = false; };
  }, [autoTalkEnabled, isHovered, showReminder, showBookmarkDialog, showSummary, message]);

  useEffect(() => {
    // Check initial reminder state
    if (chrome && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['reminderEnabled', 'reminderInterval'], (result) => {
            if (result.reminderEnabled !== undefined) {
                setIsReminderEnabled(result.reminderEnabled as boolean);
            }
            if (result.reminderInterval) {
                setReminderIntervalInput(result.reminderInterval as number);
            }
        });
    }

    // Listen for health reminders from background
    const handleMessage = (msg: any) => {
      if (msg.type === 'SHOW_HEALTH_REMINDER') {
        setShowReminder(true);
        setMessage("Time to rest, human! Meow~ ?");
      }
    };
    
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const handleMenuSelect = (action: string) => {
    console.log('Selected action:', action);
    if (action === 'bookmark') {
        setShowBookmarkDialog(true);
        setMessage("Which folder? Meow?");
        setTimeout(() => setMessage(null), 2000);
    } else if (action === 'ai') {
        setMessage("Thinking...");
        setShowSummary(true);
        setIsAiLoading(true);
        setAiError(null);
        setAiData(null);
        
        // Extract content
        const content = document.body.innerText.slice(0, 5000); // Limit to 5000 chars

        chrome.runtime.sendMessage({ 
          type: 'AI_SUMMARIZE', 
          payload: { content, url: window.location.href } 
        }, (response) => {
          setIsAiLoading(false);
          if (chrome.runtime.lastError) {
            setAiError(chrome.runtime.lastError.message || "Unknown error");
            setMessage("Oops! Something went wrong.");
          } else if (response.error) {
            setAiError(response.error);
            setMessage("Meow? I couldn't understand that.");
          } else {
            setAiData(response);
            setMessage("Here is what I found! Meow~");
          }
          setTimeout(() => setMessage(null), 3000);
        });
    } else if (action === 'toggle_reminder') {
        if (isReminderEnabled) {
             // Disable reminder
             setIsReminderEnabled(false);
             chrome.storage.sync.set({ reminderEnabled: false }, () => {
                 chrome.runtime.sendMessage({ type: 'UPDATE_REMINDER_SETTINGS' });
             });
             setMessage("Reminder disabled. Zzz...");
             setTimeout(() => setMessage(null), 2000);
        } else {
             // Show settings to enable
             setShowReminderSettings(true);
        }
    } else {
        setMessage("Don't forget to rest!");
        setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleEnableReminder = () => {
      setIsReminderEnabled(true);
      setShowReminderSettings(false);
      
      chrome.storage.sync.set({ 
          reminderEnabled: true,
          reminderInterval: Number(reminderIntervalInput)
      }, () => {
          chrome.runtime.sendMessage({ type: 'UPDATE_REMINDER_SETTINGS' });
      });

      setMessage(`Reminder set every ${reminderIntervalInput} mins! Meow~`);
      setTimeout(() => setMessage(null), 3000);
  };

  const handleBookmarkSave = (parentId: string, title: string) => {
    setShowBookmarkDialog(false);
    setMessage("Saving bookmark...");
    chrome.runtime.sendMessage({ 
      type: 'BOOKMARK_SAVE', 
      payload: { preferredFolderId: parentId, title, url: window.location.href } 
    }, (response) => {
      if (chrome.runtime.lastError) {
         setMessage("Error: " + chrome.runtime.lastError.message);
      } else {
         if (response && response.success) {
           setMessage("Saved! Meow~");
         } else {
           setMessage("Error: " + (response?.error || 'Unknown'));
         }
      }
      setTimeout(() => setMessage(null), 3000);
    });
  };

  const handleClick = () => {
    // Trigger Flip Animation
    setIsInteracting(true);
    setTimeout(() => setIsInteracting(false), 500); // Reset after animation

    if (Math.random() < 0.1) {
      setMessage("I'm busy, leave me alone~");
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setMessage("Meow~ How can I help?");
    setTimeout(() => setMessage(null), 2000);
  };

  return (
    <>
      <motion.div
        drag
        dragMomentum={false}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        className="cat-widget-container"
        style={{
          position: 'fixed',
          left: 50,
          bottom: 50,
          zIndex: 999999,
          cursor: 'grab',
          background: '#FF8C42',
          borderRadius: '50%',
          padding: '8px', // Smaller padding for smaller background
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px', // Smaller width
          height: '48px', // Smaller height
        }}
      >
        <motion.div
            animate={isInteracting ? { rotateY: 360 } : { y: [0, -3, 0], rotate: [0, -5, 5, 0] }}
            transition={isInteracting ? { duration: 0.5 } : { 
                y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
        >
            <Cat size={36} color="#FFF8F3" /> {/* Larger icon */}
        </motion.div>
        
        <AnimatePresence>
          {isHovered && <FunctionMenu onSelect={handleMenuSelect} isReminderEnabled={isReminderEnabled} />}
        </AnimatePresence>

        {/* Dialog Box */}
        <AnimatePresence>
          {(isHovered || message) && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 12px)',
                background: 'white',
                padding: '8px 16px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                whiteSpace: 'nowrap',
                fontSize: '14px',
                fontWeight: 500,
                color: '#4A4A4A',
                pointerEvents: 'none',
                fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                zIndex: 1000000,
              }}
            >
              {message || "Meow~ At your service!"}
              <div style={{
                position: 'absolute',
                bottom: '-6px',
                left: '50%',
                transform: 'translateX(-50%)',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid white',
              }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Reminder Settings Dialog */}
      <AnimatePresence>
        {showReminderSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 10000000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto'
            }}
          >
             <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                width: '300px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                position: 'relative',
                fontFamily: 'sans-serif'
              }}
            >
               <button 
                onClick={() => setShowReminderSettings(false)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}
               >
                 <X size={20} />
               </button>

               <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#333' }}>
                 <Clock size={20} color="#FF8C42" /> Set Reminder
               </h3>

               <div style={{ marginBottom: '20px' }}>
                 <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#666' }}>
                   Remind me every (minutes):
                 </label>
                 <input 
                   type="number" 
                   min="1"
                   value={reminderIntervalInput}
                   onChange={(e) => setReminderIntervalInput(Number(e.target.value))}
                   style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' }}
                 />
               </div>

               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                 <button
                   onClick={() => setShowReminderSettings(false)}
                   style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleEnableReminder}
                   style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#FF8C42', color: 'white', cursor: 'pointer', fontWeight: 600 }}
                 >
                   Enable
                 </button>
               </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminder Alert Overlay */}
      <AnimatePresence>
        {showReminder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 10000000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto'
            }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              style={{
                background: 'white',
                padding: '30px',
                borderRadius: '20px',
                textAlign: 'center',
                maxWidth: '400px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
              }}
            >
              <div style={{ background: '#FF8C42', padding: '16px', borderRadius: '50%', marginBottom: '10px' }}>
                <Cat size={48} color="white" />
              </div>
              <h2 style={{ margin: 0, fontSize: '24px', color: '#333' }}>Time to Rest!</h2>
              <p style={{ margin: 0, color: '#666', lineHeight: '1.5' }}>
                You've been working hard. Take a break, stretch your legs, or drink some water! Meow~
              </p>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  onClick={() => {
                    setShowReminder(false);
                    setMessage("Good human! Rest well.");
                    setTimeout(() => setMessage(null), 3000);
                  }}
                  style={{
                    padding: '10px 24px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Okay, I'll rest
                </button>
                <button
                  onClick={() => {
                    setShowReminder(false);
                    setMessage("Don't push yourself too hard!");
                    setTimeout(() => setMessage(null), 3000);
                  }}
                  style={{
                    padding: '10px 24px',
                    background: '#f5f5f5',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AISummaryDialog 
        isOpen={showSummary} 
        onClose={() => setShowSummary(false)} 
        isLoading={isAiLoading}
        data={aiData}
        error={aiError}
      />

      <BookmarkDialog
        isOpen={showBookmarkDialog}
        onClose={() => setShowBookmarkDialog(false)}
        onSave={handleBookmarkSave}
      />
    </>
  );
};
