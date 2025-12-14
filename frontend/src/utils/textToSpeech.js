/**
 * Text-to-Speech utility using Web Speech API
 */

let currentUtterance = null;

export const textToSpeech = {
  /**
   * Speak text using browser's Web Speech API
   */
  speak: (text, options = {}) => {
    const {
      rate = 1,
      pitch = 1,
      volume = 1,
      lang = 'en-US'
    } = options;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    utterance.lang = lang;

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);

    return utterance;
  },

  /**
   * Stop speaking
   */
  stop: () => {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  },

  /**
   * Pause speech
   */
  pause: () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  },

  /**
   * Resume speech
   */
  resume: () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  },

  /**
   * Check if currently speaking
   */
  isSpeaking: () => {
    return window.speechSynthesis.speaking;
  },

  /**
   * Get available voices
   */
  getVoices: () => {
    return window.speechSynthesis.getVoices();
  },

  /**
   * Check if Web Speech API is supported
   */
  isSupported: () => {
    return !!(window.speechSynthesis);
  }
};
