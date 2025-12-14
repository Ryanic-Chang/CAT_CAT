import React from 'react';
import { motion } from 'framer-motion';
import { BookMarked, Bot, Clock, BellOff } from 'lucide-react';

interface FunctionMenuProps {
  onSelect: (action: string) => void;
  isReminderEnabled: boolean;
}

export const FunctionMenu: React.FC<FunctionMenuProps> = ({ onSelect, isReminderEnabled }) => {
  const menuItems = [
    { id: 'bookmark', icon: BookMarked, label: 'Bookmark', color: '#4CAF50' },
    { id: 'ai', icon: Bot, label: 'AI Summary', color: '#2196F3' },
    { 
      id: 'toggle_reminder', 
      icon: isReminderEnabled ? Clock : BellOff, 
      label: isReminderEnabled ? 'Disable Reminder' : 'Enable Reminder', 
      color: isReminderEnabled ? '#9C27B0' : '#9E9E9E' 
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        position: 'absolute',
        top: '100%', // Move menu to bottom
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: '12px', // Space between cat and menu
        display: 'flex',
        gap: '10px',
        pointerEvents: 'auto',
      }}
    >
      {menuItems.map((item) => (
        <motion.button
          key={item.id}
          whileHover={{ scale: 1.1, y: 2 }} // Bounce down
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering cat click
            onSelect(item.id);
          }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'white',
            border: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: item.color,
            padding: 0,
          }}
          title={item.label}
        >
          <item.icon size={20} />
        </motion.button>
      ))}
    </motion.div>
  );
};
