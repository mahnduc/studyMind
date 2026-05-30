'use client';

import { useState, useEffect } from 'react';
import { keyApi } from '../app/dashboard/settings/api-key/_api/key.api';
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

    if (!response.ok) throw new Error(`Groq Gateway Error: ${response.status}`);

    const data = await response.json();
    return JSON.parse(data?.choices?.[0]?.message?.content || '{}');
  } catch (err) {
    console.error('[Groq Fetch] Lỗi gọi API hoặc parse dữ liệu:', err);
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

  useEffect(() => {
    if (!activeWord.trim()) {
      setResults(null);
      setError(false);
      return;
    }

    const startDictionaryPipeline = async () => {
      setLoading(true);
      setError(false);
      setIsSaved(false);
      const cleanWord = activeWord.trim().toLowerCase();

      try {
        const resolvedApiKey = await keyApi.getRandomKey('groq');
        if (!resolvedApiKey) throw new Error('Không thể lấy API key Groq hợp lệ.');

        const aiInsightData = await fetchDictionaryInsightFromGroq(cleanWord, resolvedApiKey);

        const finalResult: CustomDictionaryEntry = {
          word: aiInsightData.word || cleanWord,
          phonetics: [{ text: aiInsightData?.phonetic, audio: '' }],
          ai: aiInsightData,
        };

        setResults([finalResult]);
      } catch (err) {
        console.error('[Pipeline] Lỗi chuỗi xử lý:', err);
        setResults(null);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    startDictionaryPipeline();
  }, [activeWord]);

  const playAudio = (textToSpeak: string) => {
    if (!textToSpeak || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }, 50);
  };

  const goToWord = (word: string) => {
    const cleanWord = word.trim();
    setSearchTerm(cleanWord);
    setActiveWord(cleanWord);
  };

  const allPhonetics = results?.[0]?.phonetics || [];

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