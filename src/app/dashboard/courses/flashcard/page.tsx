'use client';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Flashcard from './_components/Flashcard';

interface FlashcardType {
  id: number;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaningEn: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
  category: string;
  difficulty: string;
}

export default function FlashcardPage() {
  const [cards, setCards] = useState<FlashcardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isHolding = useRef(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/flashcards/animal.json');
        const data = await res.json();
        setCards(data.flashcards || []);
      } catch (error) {
        console.error('Error loading flashcards:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currentCard = useMemo(() => cards[currentIndex], [cards, currentIndex]);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }, []);

  const nextCard = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 150);
    }
  }, [currentIndex, cards.length]);

  const prevCard = useCallback(() => {
    if (currentIndex > 0) {
      setFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev - 1);
      }, 150);
    }
  }, [currentIndex]);

  // Xử lý sự kiện nhấn giữ (Hold) để lật thẻ
  const handlePressStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    isHolding.current = false;
    pressTimer.current = setTimeout(() => {
      isHolding.current = true;
      setFlipped((prev) => !prev);
    }, 300);
  }, []);

  const handlePressEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    if (!isHolding.current && e.type !== 'mouseleave') {
      setFlipped((prev) => !prev);
    }
  }, []);

  // Lắng nghe phím mũi tên và dấu cách trên bàn phím
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        prevCard();
      } else if (event.key === 'ArrowRight') {
        nextCard();
      } else if (event.key === ' ' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault(); // Ngăn cuộn trang ngoài ý muốn
        setFlipped((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCard, prevCard]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#f7f9f8] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#FF3399]/20 border-t-[#FF3399] animate-spin" />
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="fixed inset-0 bg-[#f7f9f8] flex items-center justify-center p-4">
        <p className="text-gray-500 font-medium">Không tìm thấy thẻ ghi nhớ nào.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#f7f9f8] text-[#2d3436] font-sans antialiased flex items-center justify-center p-4 select-none overflow-hidden">
      
    </div>
  );
}