'use client';

import { useState, useEffect } from 'react';
import { keyApi } from '../../settings/api-key/_api/key.api';
import { GROQ_API_URL, GROQ_DEFAULT_MODEL } from '@/utils/constant';
import { DICTIONARY_SYSTEM_PROMPT } from '@/prompts/dictionary.prompt';

export interface ExampleItem {
  en: string;
  vi: string;
}

export interface PartOfSpeechGroup {
  partOfSpeech: 'noun' | 'pronoun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'interjection' | 'unsupported' | 'error';
  definitionEn: string;
  definitionVi: string;
  examples: ExampleItem[];
}

export interface GroqAiResponse {
  word: string;
  phonetic?: string;
  refused?: boolean;
  reason?: string;
  partsOfSpeech: PartOfSpeechGroup[];
}

export interface CustomDictionaryEntry {
  word: string;
  phonetics: Array<{
    text?: string;
    audio?: string;
  }>;
  ai: GroqAiResponse;
}

export async function fetchDictionaryInsightFromGroq(
  word: string,
  apiKey: string
): Promise<GroqAiResponse> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_DEFAULT_MODEL,
        messages: [
          { role: 'system', content: DICTIONARY_SYSTEM_PROMPT },
          { role: 'user', content: `Analyze the word: "${word}"` },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.15,
      }),
    });

    if (!response.ok) {
      console.error(`[Groq Fetch] Lỗi mạng hoặc Gateway: Status ${response.status}`);
      throw new Error(`Groq Gateway Error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    const parsedData = JSON.parse(rawContent);
    return parsedData;
  } catch (err) {
    console.error('[Groq Fetch] Lỗi trong quá trình gọi hoặc parse dữ liệu:', err);
    return {
      word,
      partsOfSpeech: [
        {
          partOfSpeech: 'error',
          definitionEn: 'Failed to generate dictionary data.',
          definitionVi: 'Không thể tạo dữ liệu từ điển.',
          examples: [],
        },
      ],
    };
  }
}

export function useDictionary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeWord, setActiveWord] = useState('');
  const [results, setResults] = useState<CustomDictionaryEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [allPhonetics, setAllPhonetics] = useState<Array<{ text?: string; audio?: string }>>([]);

  useEffect(() => {
    console.log(`[Pipeline Effect] activeWord thay đổi: "${activeWord}"`);
    if (!activeWord.trim()) {
      setResults(null);
      setError(false);
      setAllPhonetics([]);
      return;
    }

    const startDictionaryPipeline = async () => {
      setLoading(true);
      setError(false);
      setIsSaved(false);
      setAllPhonetics([]);
      const cleanWord = activeWord.trim().toLowerCase();

      try {
        const resolvedApiKey = await keyApi.getRandomKey('groq');
        if (!resolvedApiKey) {
          throw new Error('Không thể lấy API key Groq hợp lệ.');
        }

        const aiInsightData = await fetchDictionaryInsightFromGroq(cleanWord, resolvedApiKey);

        const generatedPhonetics = [
          {
            text: aiInsightData?.phonetic || undefined,
            audio: '',
          }
        ];

        if (aiInsightData?.refused) {
          console.warn(`[Pipeline] Từ bị từ chối dịch do thuộc bộ lọc học thuật. Lý do: ${aiInsightData.reason}`);
          const refusedResult: CustomDictionaryEntry = {
            word: cleanWord,
            phonetics: generatedPhonetics,
            ai: {
              word: cleanWord,
              refused: true,
              reason: aiInsightData.reason || 'academic_or_specialized_word',
              partsOfSpeech: [
                {
                  partOfSpeech: 'unsupported',
                  definitionEn: 'This word is too academic, scientific, or specialized.',
                  definitionVi: 'Từ này quá học thuật, chuyên ngành hoặc mang tính kỹ thuật.',
                  examples: [],
                },
              ],
            },
          };

          setResults([refusedResult]);
          setAllPhonetics(generatedPhonetics);
          return;
        }

        const finalResult: CustomDictionaryEntry = {
          word: aiInsightData.word || cleanWord,
          phonetics: generatedPhonetics,
          ai: aiInsightData,
        };
        
        console.log('[Pipeline] Cấu trúc CustomDictionaryEntry cuối cùng:', finalResult);
        setResults([finalResult]);
        setAllPhonetics(generatedPhonetics);
      } catch (err) {
        console.error('[Pipeline] Gặp lỗi nghiêm trọng trong chuỗi xử lý:', err);
        setResults(null);
        setError(true);
      } finally {
        setLoading(false);
        console.log('[Pipeline] Đã hoàn thành tác vụ.');
      }
    };

    startDictionaryPipeline();
  }, [activeWord]);

  const playAudio = (textToSpeak: string) => {
    
    if (!textToSpeak) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'en-US'; 
        utterance.rate = 0.95; 
        utterance.volume = 1.0;

        utterance.onstart = () => {
          console.log('[Audio API] Trình duyệt bắt đầu phát âm thanh.');
        };

        utterance.onerror = (event) => {
          if (event.error === 'interrupted') {
            console.log('[Audio API] Luồng âm thanh cũ đã được ngắt tự động để nhường cho luồng mới.');
          } else {
            console.error('[Audio API] Lỗi Web Speech API phát sinh:', event.error);
          }
        };

        window.speechSynthesis.speak(utterance);
      }, 50);

    } else {
      console.error('[Audio API] Hệ thống trình duyệt này không hỗ trợ Web Speech API.');
    }
  };

  const goToWord = (word: string) => {
    console.log(`[Navigation] Chuyển tới từ: "${word}"`);
    const cleanWord = word.trim();
    setSearchTerm(cleanWord);
    setActiveWord(cleanWord);
  };

  return {
    searchTerm,
    setSearchTerm,
    activeWord,
    setActiveWord,
    results,
    loading,
    error,
    isModelLoading: false,
    isSaved,
    setIsSaved,
    goToWord,
    playAudio,
    allPhonetics,
  };
}