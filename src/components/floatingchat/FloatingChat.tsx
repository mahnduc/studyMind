'use client';

import React, { useRef, useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { TrendingUpDown, Users } from 'lucide-react'; 
import ChatWindow from './ChatWindow'; 

export default function FloatingChat() {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInitialPos({
        x: window.innerWidth - 80,
        y: window.innerHeight - 80,
      });
    }
  }, []);

  const handleStart = () => {
    isDraggingRef.current = false;
  };

  const handleDrag = () => {
    isDraggingRef.current = true;
  };

  const handleStop = () => {
    if (!isDraggingRef.current) {
      setIsOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-9999">
      {initialPos.x !== 0 && (
        <Draggable
          nodeRef={nodeRef}
          bounds="body"
          onStart={handleStart}
          onDrag={handleDrag}
          onStop={handleStop}
          defaultPosition={initialPos}
          handle=".drag-handle"
        >
          <div
            ref={nodeRef}
            className="pointer-events-auto fixed select-none"
            style={{ touchAction: 'none' }}
          >
            {isOpen ? (
              <ChatWindow onClose={() => setIsOpen(false)} />
            ) : (
              <div className="drag-handle w-12 h-12 cursor-grab active:cursor-grabbing">
                <div className="w-full h-full bg-linear-to-tr from-emerald-500 via-teal-600 to-cyan-600 rounded-full shadow-xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform duration-200 ease-out">
                  <TrendingUpDown size={20} className="stroke-[2.2]" />
                </div>
              </div>
            )}
          </div>
        </Draggable>
      )}
    </div>
  );
}