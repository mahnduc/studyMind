'use client';

import React from 'react';
import { motion } from 'framer-motion';

import {
  Volume2,
  RotateCcw,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface FlashcardData {
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

interface FlashcardProps {
  card: FlashcardData;
  currentIndex: number;
  totalCards: number;
  flipped: boolean;
  onFlip: () => void;
}

export default function Flashcard({
  card,
  currentIndex,
  totalCards,
  flipped,
  onFlip,
}: FlashcardProps) {
  return (
    <div className="w-[400px] h-[550px] max-w-full max-h-[90vh] shrink-0 mx-auto">

      <div
        className="relative w-full h-full cursor-pointer"
        style={{ perspective: 1200 }}
        onClick={onFlip}
      >

        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{
            type: 'spring',
            stiffness: 150,
            damping: 22,
          }}
        >

          {/* ================================================= */}
          {/* FRONT */}
          {/* ================================================= */}
          <div
            className="
              absolute inset-0
              overflow-hidden
              rounded-[28px]
              bg-[#FF3399]
              text-white
              shadow-[0_16px_32px_rgba(255,51,153,0.15)]
              p-6
              flex
              flex-col
              justify-between
              select-none
            "
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >

            {/* HEADER */}
            <div className="flex items-center justify-between">

              <span
                className="
                  px-2.5
                  py-0.5
                  rounded-full
                  bg-white/20
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wider
                  font-mono
                "
              >
                {card.partOfSpeech}
              </span>

              <div className="flex items-center gap-1 text-white/60 text-xs font-medium font-mono uppercase tracking-wider">

                <RotateCcw size={12} />

                <span>Chạm để lật</span>
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 flex flex-col items-center justify-center text-center overflow-hidden">

              <h1
                className="
                  text-4xl
                  font-black
                  tracking-tight
                  mb-3
                  break-words
                  max-w-full
                  px-2
                "
              >
                {card.word}
              </h1>

              {/* PHONETIC */}
              <div
                className="
                  flex
                  items-center
                  gap-2
                  bg-white/15
                  px-3
                  py-1.5
                  rounded-full
                  backdrop-blur-sm
                "
              >

                <span className="font-mono text-white/90 text-xs font-bold">
                  /{card.phonetic}/
                </span>

                <button
                  className="
                    w-7
                    h-7
                    rounded-full
                    bg-white
                    text-[#FF3399]
                    flex
                    items-center
                    justify-center
                    shadow-md
                  "
                >
                  <Volume2 size={12} fill="currentColor" />
                </button>
              </div>

              {/* DIFFICULTY */}
              <div
                className="
                  mt-4
                  flex
                  items-center
                  gap-1
                  px-2
                  py-0.5
                  rounded-full
                  bg-white/20
                  text-white
                "
              >

                <Sparkles size={10} className="fill-current" />

                <span className="text-[9px] font-bold uppercase tracking-wider font-mono">
                  {card.difficulty}
                </span>
              </div>
            </div>

            {/* FOOTER */}
            <div className="text-center text-[10px] font-bold text-white/40 font-mono tracking-wider">
              THẺ: {currentIndex + 1} / {totalCards}
            </div>
          </div>

          {/* ================================================= */}
          {/* BACK */}
          {/* ================================================= */}
          <div
            className="
              absolute inset-0
              overflow-hidden
              rounded-[28px]
              bg-[#00cec9]
              shadow-[0_16px_32px_rgba(0,206,201,0.15)]
              p-5
              flex
              flex-col
              justify-between
            "
            style={{
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >

            {/* HEADER */}
            <div className="shrink-0 pb-2 border-b border-black/10 flex items-center justify-between">

              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2d3436] font-mono">
                Chi tiết từ vựng
              </span>

              <button
                className="
                  w-7
                  h-7
                  rounded-full
                  bg-white
                  text-[#FF3399]
                  flex
                  items-center
                  justify-center
                  shadow-sm
                "
              >
                <Volume2 size={12} />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-3.5">

              {/* MEANING */}
              <div>

                <h2 className="text-2xl font-black text-[#FF3399] leading-tight mb-0.5">
                  {card.word}
                </h2>

                <p className="text-lg font-bold text-white leading-tight">
                  {card.meaningVi}
                </p>

                <p className="text-xs font-semibold text-[#2d3436]/90 mt-1 leading-relaxed">
                  {card.meaningEn}
                </p>
              </div>

              {/* EXAMPLE */}
              <div className="p-3 rounded-xl bg-white/30 border border-white/10 space-y-1">

                <div className="flex items-center gap-1 text-[#2d3436]/60">

                  <BookOpen size={10} />

                  <span className="text-[9px] font-bold uppercase font-mono">
                    Ví dụ
                  </span>
                </div>

                <p className="text-xs font-bold text-[#2d3436] leading-relaxed">
                  {card.exampleEn}
                </p>

                <p className="text-[11px] text-[#2d3436]/80 font-medium leading-normal">
                  {card.exampleVi}
                </p>
              </div>

              {/* COLLOCATIONS */}
              {card.collocations?.length > 0 && (
                <div>

                  <p className="text-[9px] uppercase font-bold text-[#2d3436]/60 font-mono mb-1.5">
                    Cụm từ đi kèm
                  </p>

                  <div className="flex flex-wrap gap-1.5">

                    {card.collocations.map((item, idx) => (
                      <span
                        key={idx}
                        className="
                          px-2.5
                          py-1
                          rounded-lg
                          bg-white/80
                          text-[#2d3436]
                          text-[10px]
                          font-bold
                          shadow-sm
                          whitespace-nowrap
                        "
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* SYNONYMS + ANTONYMS */}
              <div className="grid grid-cols-2 gap-3 pt-1">

                {card.synonyms?.length > 0 && (
                  <div className="bg-white/15 p-2 rounded-xl border border-white/5">

                    <p className="text-[9px] uppercase font-bold text-[#2d3436]/60 font-mono mb-1">
                      Đồng nghĩa
                    </p>

                    <p className="text-[11px] font-bold text-[#2d3436] break-words leading-tight">
                      {card.synonyms.slice(0, 3).join(', ')}
                    </p>
                  </div>
                )}

                {card.antonyms?.length > 0 && (
                  <div className="bg-white/15 p-2 rounded-xl border border-white/5">

                    <p className="text-[9px] uppercase font-bold text-[#2d3436]/60 font-mono mb-1">
                      Trái nghĩa
                    </p>

                    <p className="text-[11px] font-bold text-[#FF3399] break-words leading-tight">
                      {card.antonyms.slice(0, 3).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="shrink-0 text-center text-[10px] font-medium text-black/30 font-mono pt-2 border-t border-black/5">
              Chạm để lật lại
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}