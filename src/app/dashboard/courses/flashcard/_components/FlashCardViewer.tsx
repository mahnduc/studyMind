'use client';

interface PartOfSpeech {
  partOfSpeech: string;
  definitionEn: string;
  definitionVi: string;
}

interface FlashCardItem {
  word: string;
  phonetics: string[];
  partsOfSpeech: PartOfSpeech[];
}

interface FlashCardViewerProps {
  cards: FlashCardItem[];
  currentIndex: number;
  isFlipped: boolean;
  setIsFlipped: (value: boolean) => void;
  nextCard: () => void;
  prevCard: () => void;
}

export default function FlashCardViewer({
  cards,
  currentIndex,
  isFlipped,
  setIsFlipped,
  nextCard,
  prevCard,
}: FlashCardViewerProps) {
  const currentCard = cards[currentIndex];

  if (!currentCard) return null;

  return (
    <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center min-h-[380px]">

      {/* Chỉ số thẻ */}
      <div className="text-slate-400 text-xs font-black tracking-widest mb-2 bg-slate-200/60 px-3 py-1 rounded-full">
        {currentIndex + 1} / {cards.length}
      </div>

      {/* Flashcard */}
      <div
        className="w-full aspect-[4/3] min-h-[260px] cursor-pointer group [perspective:1000px] mb-6"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full rounded-3xl shadow-lg border border-slate-100 bg-white transition-transform duration-500 [transform-style:preserve-3d] ${
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* FRONT */}
          <div className="absolute inset-0 p-6 flex flex-col justify-between [backface-visibility:hidden] bg-slate-50/60 border border-slate-100 rounded-3xl">
            <div className="flex justify-between items-center w-full">
              <span className="px-2.5 py-0.5 bg-slate-200/60 text-slate-700 rounded-lg text-[11px] font-extrabold uppercase tracking-wider">
                English
              </span>
            </div>

            <div className="text-center my-auto">
              <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2.5">
                {currentCard.word}
              </h2>

              {currentCard.phonetics?.[0] && (
                <p className="text-teal-600 font-mono text-base bg-teal-50 inline-block px-3 py-0.5 rounded-md border border-teal-100/50 font-semibold">
                  {currentCard.phonetics[0]}
                </p>
              )}
            </div>
          </div>

          {/* BACK */}
          <div
            className="absolute inset-0 p-6 flex flex-col justify-between text-white rounded-3xl [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-inner"
            style={{ backgroundColor: '#2D3748' }}
          >
            <div className="flex justify-between items-center w-full">
              <span className="px-2.5 py-0.5 bg-white/20 text-teal-100 rounded-lg text-[11px] font-extrabold uppercase tracking-wider">
                Tiếng Việt
              </span>
            </div>

            <div className="my-auto overflow-y-auto max-h-[150px] pr-1 text-left w-full scrollbar-thin">
              {currentCard.partsOfSpeech?.map((pos, idx) => (
                <div key={idx} className="mb-3 last:mb-0">
                  <div className="inline-block px-2 py-0.5 bg-teal-600 text-slate-100 rounded text-[10px] font-black uppercase mb-1">
                    {pos.partOfSpeech}
                  </div>

                  <p className="text-base font-bold text-teal-100 leading-snug">
                    {pos.definitionVi}
                  </p>

                  <p className="text-xs text-slate-400 mt-0.5 italic font-light opacity-90">
                    En: {pos.definitionEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Điều hướng */}
      <div className="flex items-center gap-4">
        <button
          onClick={prevCard}
          className="p-3 bg-white hover:bg-slate-100 text-slate-600 rounded-2xl shadow-sm active:scale-95 transition-all border border-slate-200/60"
          title="Từ trước đó"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={3}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </button>

        <button
          onClick={nextCard}
          className="p-3 bg-white hover:bg-slate-100 text-slate-600 rounded-2xl shadow-sm active:scale-95 transition-all border border-slate-200/60"
          title="Từ tiếp theo"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={3}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}