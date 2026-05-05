import * as Speech from 'expo-speech';

/**
 * Speaks advisory text using Expo Speech (local TTS, no network required).
 * Supports English (en) and Telugu (te).
 * Call Speech.stop() before speaking again to prevent overlapping audio.
 */
export function playVoiceAdvisory(text: string, language: string): void {
  if (!text || text.trim() === '') {
    console.log('[Speech] No text to speak');
    return;
  }

  Speech.stop();

  // English -> "en-IN", Telugu -> "te-IN" (supports both "te" and "telugu")
  const langCode =
    language === 'telugu' || language === 'te' ? 'te-IN' : 'en-IN';

  console.log('Voice advisory text:', text.length > 80 ? text.substring(0, 80) + '...' : text);
  console.log('Language:', language, '->', langCode);

  try {
    Speech.speak(text, {
      language: langCode,
      rate: 0.9,
      pitch: 1.0,
    });
  } catch (err) {
    console.error('[Speech] expo-speech error:', err);
  }
}

/** @deprecated Use playVoiceAdvisory instead */
export function speakAdvisory(text: string, language: 'en' | 'te' = 'en'): void {
  playVoiceAdvisory(text, language);
}

export function stopAdvisorySpeech(): void {
  Speech.stop();
}
