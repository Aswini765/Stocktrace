// Voice input for the picker's phone: speech recognition with visible errors, and a parser that
// understands numbers and commands in English, Hindi and Kannada (digits in any script, or number words).
import { useCallback, useRef, useState } from 'react';

const SPEECH: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };

export const speechSupported = () =>
  typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

// ---------- numbers ----------
// Devanagari ०-९ and Kannada ೦-೯ digits -> 0-9
export function normalizeDigits(s: string) {
  return s.replace(/[०-९]/g, (d) => String(d.charCodeAt(0) - 0x0966)).replace(/[೦-೯]/g, (d) => String(d.charCodeAt(0) - 0x0CE6));
}

const HI = 'शून्य एक दो तीन चार पाँच छह सात आठ नौ दस ग्यारह बारह तेरह चौदह पंद्रह सोलह सत्रह अठारह उन्नीस बीस इक्कीस बाईस तेईस चौबीस पच्चीस छब्बीस सत्ताईस अट्ठाईस उनतीस तीस इकतीस बत्तीस तैंतीस चौंतीस पैंतीस छत्तीस सैंतीस अड़तीस उनतालीस चालीस इकतालीस बयालीस तैंतालीस चवालीस पैंतालीस छियालीस सैंतालीस अड़तालीस उनचास पचास इक्यावन बावन तिरपन चौवन पचपन छप्पन सत्तावन अट्ठावन उनसठ साठ इकसठ बासठ तिरसठ चौंसठ पैंसठ छियासठ सड़सठ अड़सठ उनहत्तर सत्तर इकहत्तर बहत्तर तिहत्तर चौहत्तर पचहत्तर छिहत्तर सतहत्तर अठहत्तर उन्यासी अस्सी इक्यासी बयासी तिरासी चौरासी पचासी छियासी सत्तासी अट्ठासी नवासी नब्बे इक्यानवे बानवे तिरानवे चौरानवे पंचानवे छियानवे सत्तानवे अट्ठानवे निन्यानवे सौ'.split(' ');
const HI_EXTRA: Record<string, number> = { 'पांच': 5, 'छः': 6, 'छे': 6, 'नो': 9, 'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5, 'panch': 5, 'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10, 'bees': 20, 'tees': 30, 'chalis': 40, 'pachas': 50, 'saath': 60, 'sattar': 70, 'assi': 80, 'nabbe': 90, 'sau': 100 };
const EN_UNITS = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' ');
const EN_TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const KN_UNITS: Record<string, number> = { 'ಸೊನ್ನೆ': 0, 'ಒಂದು': 1, 'ಎರಡು': 2, 'ಮೂರು': 3, 'ನಾಲ್ಕು': 4, 'ಐದು': 5, 'ಆರು': 6, 'ಏಳು': 7, 'ಎಂಟು': 8, 'ಒಂಬತ್ತು': 9, 'ಹತ್ತು': 10, 'ಹನ್ನೊಂದು': 11, 'ಹನ್ನೆರಡು': 12, 'ಹದಿಮೂರು': 13, 'ಹದಿನಾಲ್ಕು': 14, 'ಹದಿನೈದು': 15, 'ಹದಿನಾರು': 16, 'ಹದಿನೇಳು': 17, 'ಹದಿನೆಂಟು': 18, 'ಹತ್ತೊಂಬತ್ತು': 19, 'ondu': 1, 'eradu': 2, 'mooru': 3, 'naalku': 4, 'aidu': 5, 'aaru': 6, 'elu': 7, 'entu': 8, 'ombattu': 9, 'hattu': 10 };
const KN_TENS: Record<string, number> = { 'ಇಪ್ಪತ್ತು': 20, 'ಮೂವತ್ತು': 30, 'ನಲವತ್ತು': 40, 'ಐವತ್ತು': 50, 'ಅರವತ್ತು': 60, 'ಎಪ್ಪತ್ತು': 70, 'ಎಂಬತ್ತು': 80, 'ತೊಂಬತ್ತು': 90, 'ನೂರು': 100 };
// Kannada fuses tens and units ("ಇಪ್ಪತ್ತೈದು" = 25): the units' fused endings after a tens stem
const KN_FUSED: Record<string, number> = { 'ಒಂದು': 1, 'ೆರಡು': 2, 'ಮೂರು': 3, 'ನಾಲ್ಕು': 4, 'ೈದು': 5, 'ಾರು': 6, 'ೇಳು': 7, 'ೆಂಟು': 8, 'ೊಂಬತ್ತು': 9, 'ೊಂದು': 1 };

const WORDS: Record<string, number> = { ...Object.fromEntries(HI.map((w, i) => [w, i])), ...HI_EXTRA, ...Object.fromEntries(EN_UNITS.map((w, i) => [w, i])), ...EN_TENS, hundred: 100, ...KN_UNITS, ...KN_TENS };

function kannadaFused(tok: string) {
  for (const [w, tens] of Object.entries(KN_TENS)) {
    const stem = w.slice(0, -1); // drop the final vowel sign
    if (tok.startsWith(stem) && tok !== w) {
      const rest = tok.slice(stem.length);
      if (KN_FUSED[rest] != null) return tens + KN_FUSED[rest];
    }
  }
  return null;
}

// First number in the text: digits in any script, or number words ("forty two", "बयालीस", "ನಲವತ್ತು ಎರಡು")
export function findNumber(text: string): number | null {
  const s = normalizeDigits(text.toLowerCase());
  const d = s.match(/\d+/);
  if (d) return Number(d[0]);
  const toks = s.split(/[\s,.-]+/).filter(Boolean);
  for (let i = 0; i < toks.length; i++) {
    let v = WORDS[toks[i]] ?? kannadaFused(toks[i]);
    if (v == null) continue;
    // "forty two", "ನಲವತ್ತು ಎರಡು", "two hundred"
    const next = toks[i + 1] != null ? (WORDS[toks[i + 1]] ?? null) : null;
    if (next != null) {
      if (v >= 20 && v % 10 === 0 && v < 100 && next < 10) v += next;
      else if (next === 100 && v < 10) v *= 100;
    }
    return v;
  }
  return null;
}

// ---------- commands ----------
const has = (s: string, re: RegExp) => re.test(s);
const NEG = /not here|nahi|nahin|नहीं|ನಹಿ|ಇಲ್ಲ|illa|missing/;

export type VoiceParse = { qty: number | null; reason: string | null; found: boolean; notHere: boolean; send: boolean; owner: boolean; text: string };

export function parseVoice(text: string): VoiceParse {
  const s = text.toLowerCase();
  let reason: string | null = null;
  if (has(s, /damag|broken|खराब|टूट|ಹಾಳ|kharab|haala/)) reason = 'damaged';
  else if (has(s, /wrong|गलत|ತಪ್ಪು|galat|tappu/)) reason = 'wrong_item';
  else if (has(s, /fewer|less|short|not found|not on|missing|कम|नहीं मिला|नहीं है|ಕಡಿಮೆ|ಸಿಗಲಿಲ್ಲ|ಇಲ್ಲ|kam|kadime|nahi mila|sigalilla/)) reason = 'not_found';
  const notHere = has(s, NEG);
  const found = !notHere && has(s, /found|here|got|yes|mila|मिला|मिले|मिल गया|हाँ|हां|ಸಿಕ್ಕ|ಇದೆ|ಹೌದು|sikkide|haan/);
  return {
    qty: findNumber(s), reason, found, notHere, text,
    send: has(s, /send|submit|report|save|भेज|सेव|ಕಳುಹಿಸ|ಉಳಿಸ|bhej|kalisi/),
    owner: has(s, /owner|boss|malik|मालिक|सेठ|ಮಾಲೀಕ|maalika/),
  };
}

// ---------- recognition ----------
const ERRORS: Record<string, string> = {
  'not-allowed': 'mic_blocked',
  'service-not-allowed': 'mic_blocked',
  'no-speech': 'no_speech',
  'audio-capture': 'no_mic',
  network: 'voice_network',
  'language-not-supported': 'lang_fallback',
};

// One utterance at a time. Tries the picker's language first; if the phone cannot recognise it
// (common for Kannada), it retries in Indian English and says so.
export function useVoice(lang: string, onText: (alternatives: string[]) => void) {
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<any>(null);

  const start = useCallback((tryLang = SPEECH[lang] || 'en-IN') => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError('voice_unsupported'); return; }
    try {
      rec.current?.abort?.();
      const r = new SR();
      r.lang = tryLang;
      r.continuous = false;
      r.interimResults = false;
      r.maxAlternatives = 3;
      r.onresult = (e: any) => {
        const alts = Array.from(e.results[0] || []).map((a: any) => a.transcript as string);
        setHeard(alts[0] || '');
        onText(alts);
      };
      r.onerror = (e: any) => {
        const code = ERRORS[e.error] || 'voice_failed';
        if (code === 'lang_fallback' && tryLang !== 'en-IN') { setError('lang_fallback'); setTimeout(() => start('en-IN'), 50); return; }
        setError(code);
        setListening(false);
      };
      r.onend = () => setListening(false);
      setError((x) => (x === 'lang_fallback' ? x : null));
      setHeard('');
      setListening(true);
      rec.current = r;
      r.start();
    } catch {
      setError('voice_failed');
      setListening(false);
    }
  }, [lang, onText]);

  const stop = useCallback(() => { try { rec.current?.stop?.(); } catch { /* ignore */ } setListening(false); }, []);
  return { listening, heard, error, start: () => start(), stop, supported: speechSupported() };
}
