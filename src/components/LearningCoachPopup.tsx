'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { appEmitter } from '@/utils/eventEmitter';

export default function LearningCoachPopup() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [isImgLoaded, setIsImgLoaded] = useState(false);

  useEffect(() => {
    const showHandler = (content: string) => {
      setMessage(content);
      setIsImgLoaded(false);

      const img = new Image();
      img.src = '/mascot.png';
      img.onload = () => {
        setIsImgLoaded(true);
        setVisible(true);
      };
    };

    appEmitter.on('SHOW_LEARNING_COACH', showHandler);

    return () => {
      appEmitter.off('SHOW_LEARNING_COACH', showHandler);
    };
  }, []);

  if (!visible || !isImgLoaded) return null;

  return (
    <div className="fixed inset-0 z-[999999]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setVisible(false)}
      />

      <div className="absolute bottom-8 right-8 flex items-end gap-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="relative max-w-md rounded-2xl bg-white p-5 shadow-2xl">
          <button
            onClick={() => setVisible(false)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="mb-2 text-lg font-bold text-indigo-600">
            🎓 Learning Coach
          </div>

          <div className="whitespace-pre-wrap leading-relaxed text-gray-700">
            {message}
          </div>

          <div className="absolute bottom-5 -right-2 h-4 w-4 rotate-45 bg-white" />
        </div>

        <img
          src="/mascot.png"
          alt="Learning Coach"
          className="h-64 w-auto select-none drop-shadow-2xl"
        />
      </div>
    </div>
  );
}