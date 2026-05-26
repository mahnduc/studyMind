'use client';

import React from 'react';
import { Layers, AlignLeft, Quote, MoveRight, Volume2 } from 'lucide-react';
import { CustomDictionaryEntry } from '../useDictionary';

interface DictionaryResultProps {
  entry: CustomDictionaryEntry;
  playAudio: (textToSpeak: string) => void;
}

export default function DictionaryResult({ entry, playAudio }: DictionaryResultProps) {
  console.log('[Component Result] Nhận entry dữ liệu:', entry);

  if (!entry?.ai?.partsOfSpeech) {
    console.warn('[Component Result] Không tìm thấy mảng partsOfSpeech hợp lệ trong entry.ai');
    return null;
  }

  return (
    <div className="w-full max-w-180 mx-auto space-y-4 font-['DM_Sans'] antialiased selection:bg-[#FF339920]">
      <div className="bg-[#2d3436] text-[#f7f9f8] px-6 py-4 flex items-center justify-between rounded-full">
        <div className="flex items-center gap-2 text-[#00cec9] font-['Nunito'] font-black text-sm uppercase tracking-wider pl-1">
          {entry.word}
        </div>
      </div>

      <div className="space-y-4">
        {entry.ai.partsOfSpeech.map((posGroup, posIdx) => {
          console.log(`[Component Result] Đang xử lý khối từ loại thứ ${posIdx + 1}:`, posGroup.partOfSpeech);
          return (
            <div key={posIdx} className="bg-white p-6 sm:p-8 rounded-3xl space-y-5 shadow-xs">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2d3436] text-[#f7f9f8] font-['Nunito'] font-extrabold text-xs uppercase tracking-widest">
                <Layers size={14} className="text-[#00cec9]" strokeWidth={2.5} />
                {posGroup.partOfSpeech}
              </div>

              <div className="space-y-4 bg-[#f7f9f8] p-5 rounded-[20px]">
                <div className="flex gap-4 items-start px-1">
                  <div className="w-8 h-8 rounded-full bg-[#00cec920] flex items-center justify-center shrink-0 text-[#00cec9]">
                    <AlignLeft size={16} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1.5 pt-0.5">
                    <p className="text-base text-[#2d3436] font-extrabold leading-snug">
                      {posGroup.definitionEn}
                    </p>
                    <p className="text-sm text-[#FF3399] font-extrabold tracking-wide">
                      {posGroup.definitionVi}
                    </p>
                  </div>
                </div>

                {posGroup.examples && posGroup.examples.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-[#e9eceb]">
                    {posGroup.examples.map((example, exIdx) => (
                      <div key={exIdx} className="bg-white p-4 rounded-2xl flex gap-3 items-start shadow-xs group relative justify-between">
                        <div className="flex gap-3 items-start w-full pr-8">
                          <div className="w-7 h-7 rounded-full bg-[#FF339915] flex items-center justify-center shrink-0 text-[#FF3399]">
                            <Quote size={12} strokeWidth={2.5} className="fill-[#FF3399]" />
                          </div>
                          <div className="space-y-1 w-full">
                            <p className="text-sm text-[#2d3436] font-medium italic leading-relaxed">
                              "{example.en}"
                            </p>
                            <p className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                              <MoveRight size={10} strokeWidth={3} className="text-[#00cec9]" />
                              {example.vi}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            console.log(`[Component Result] Kích hoạt loa phát âm câu ví dụ: "${example.en}"`);
                            playAudio(example.en); 
                          }}
                          title="Nghe câu ví dụ"
                          className="absolute right-4 top-4 w-7 h-7 rounded-full bg-[#f7f9f8] text-[#2d3436]/40 hover:text-[#00cec9] hover:bg-[#00cec910] flex items-center justify-center cursor-pointer transition-all shadow-xs"
                        >
                          <Volume2 size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}