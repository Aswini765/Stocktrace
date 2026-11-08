// Picker-facing strings in English, Hindi and Kannada (FR-2.4).
// Record citations (Tally voucher numbers, shelf codes) stay as they appear in Tally.
export const LANGS = {
  en: { label: 'English', speech: 'en-IN' },
  hi: { label: 'हिंदी', speech: 'hi-IN' },
  kn: { label: 'ಕನ್ನಡ', speech: 'kn-IN' },
};

const T = {
  greeting: {
    en: 'Pick your orders. Tap Short if you cannot find the full quantity.',
    hi: 'अपने ऑर्डर पिक करें। पूरी मात्रा न मिले तो "कम है" दबाएँ।',
    kn: 'ನಿಮ್ಮ ಆರ್ಡರ್‌ಗಳನ್ನು ಪಿಕ್ ಮಾಡಿ. ಪೂರ್ಣ ಪ್ರಮಾಣ ಸಿಗದಿದ್ದರೆ "ಕಡಿಮೆ ಇದೆ" ಒತ್ತಿ.',
  },
  orders: { en: 'Orders', hi: 'ऑर्डर', kn: 'ಆರ್ಡರ್‌ಗಳು' },
  recounts: { en: 'Recounts', hi: 'गिनती', kn: 'ಮರು ಎಣಿಕೆ' },
  picked: { en: 'Picked', hi: 'पिक हो गया', kn: 'ಪಿಕ್ ಆಯಿತು' },
  short: { en: 'Short', hi: 'कम है', kn: 'ಕಡಿಮೆ ಇದೆ' },
  back: { en: 'Back', hi: 'वापस', kn: 'ಹಿಂದೆ' },
  shelf: { en: 'Shelf', hi: 'शेल्फ', kn: 'ಶೆಲ್ಫ್' },
  ordered: { en: 'Ordered', hi: 'ऑर्डर', kn: 'ಆರ್ಡರ್' },
  howMany: { en: 'How many did you find?', hi: 'आपको कितने मिले?', kn: 'ನಿಮಗೆ ಎಷ್ಟು ಸಿಕ್ಕಿತು?' },
  what: { en: 'What happened?', hi: 'क्या हुआ?', kn: 'ಏನಾಯಿತು?' },
  not_found: { en: 'Not found', hi: 'नहीं मिला', kn: 'ಸಿಗಲಿಲ್ಲ' },
  fewer: { en: 'Fewer found', hi: 'कम मिले', kn: 'ಕಡಿಮೆ ಸಿಕ್ಕಿತು' },
  damaged: { en: 'Damaged', hi: 'खराब है', kn: 'ಹಾಳಾಗಿದೆ' },
  wrong_item: { en: 'Wrong item', hi: 'गलत सामान', kn: 'ತಪ್ಪು ವಸ್ತು' },
  send: { en: 'Send report', hi: 'रिपोर्ट भेजें', kn: 'ವರದಿ ಕಳುಹಿಸಿ' },
  cancel: { en: 'Cancel', hi: 'रद्द करें', kn: 'ರದ್ದುಮಾಡಿ' },
  checkThese: { en: 'Check these places', hi: 'इन जगहों पर देखें', kn: 'ಈ ಸ್ಥಳಗಳಲ್ಲಿ ನೋಡಿ' },
  record: { en: 'Record', hi: 'रिकॉर्ड', kn: 'ದಾಖಲೆ' },
  foundHere: { en: 'Found here', hi: 'यहाँ मिला', kn: 'ಇಲ್ಲಿ ಸಿಕ್ಕಿತು' },
  notHere: { en: 'Not here', hi: 'यहाँ नहीं है', kn: 'ಇಲ್ಲಿ ಇಲ್ಲ' },
  howManyHere: { en: 'How many here?', hi: 'यहाँ कितने?', kn: 'ಇಲ್ಲಿ ಎಷ್ಟು?' },
  ok: { en: 'OK', hi: 'ठीक है', kn: 'ಸರಿ' },
  noRecords: {
    en: 'No record shows this item anywhere else. Sent to the owner. Carry on with other lines.',
    hi: 'इस सामान का कहीं और कोई रिकॉर्ड नहीं है। मालिक को भेज दिया गया। बाकी लाइनें पिक करते रहें।',
    kn: 'ಈ ವಸ್ತು ಬೇರೆಲ್ಲೂ ಇರುವ ದಾಖಲೆ ಇಲ್ಲ. ಮಾಲೀಕರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ಉಳಿದ ಸಾಲುಗಳನ್ನು ಮುಂದುವರಿಸಿ.',
  },
  damagedSent: {
    en: 'Damaged stock reported. Sent to the owner. Keep the damaged units aside.',
    hi: 'खराब माल की रिपोर्ट हो गई। मालिक को भेज दिया। खराब यूनिट अलग रखें।',
    kn: 'ಹಾಳಾದ ಸ್ಟಾಕ್ ವರದಿ ಮಾಡಲಾಗಿದೆ. ಮಾಲೀಕರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ಹಾಳಾದ ಘಟಕಗಳನ್ನು ಪಕ್ಕಕ್ಕೆ ಇಡಿ.',
  },
  sentToOwner: {
    en: 'Sent to the owner. Carry on with other lines.',
    hi: 'मालिक को भेज दिया। बाकी लाइनें पिक करते रहें।',
    kn: 'ಮಾಲೀಕರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ಉಳಿದ ಸಾಲುಗಳನ್ನು ಮುಂದುವರಿಸಿ.',
  },
  allFound: {
    en: 'Full quantity found. Pick it and carry on.',
    hi: 'पूरी मात्रा मिल गई। पिक करें और आगे बढ़ें।',
    kn: 'ಪೂರ್ಣ ಪ್ರಮಾಣ ಸಿಕ್ಕಿತು. ಪಿಕ್ ಮಾಡಿ ಮುಂದುವರಿಸಿ.',
  },
  sendNow: { en: 'Send to owner now', hi: 'अभी मालिक को भेजें', kn: 'ಈಗಲೇ ಮಾಲೀಕರಿಗೆ ಕಳುಹಿಸಿ' },
  timeLeft: { en: 'Search time left', hi: 'खोज का समय बाकी', kn: 'ಹುಡುಕಾಟಕ್ಕೆ ಉಳಿದ ಸಮಯ' },
  held: { en: 'Held at packing', hi: 'पैकिंग पर रोका गया', kn: 'ಪ್ಯಾಕಿಂಗ್‌ನಲ್ಲಿ ತಡೆಹಿಡಿಯಲಾಗಿದೆ' },
  ready: { en: 'Ready to pack', hi: 'पैकिंग के लिए तैयार', kn: 'ಪ್ಯಾಕಿಂಗ್‌ಗೆ ಸಿದ್ಧ' },
  picking: { en: 'Picking', hi: 'पिकिंग चल रही है', kn: 'ಪಿಕಿಂಗ್ ನಡೆಯುತ್ತಿದೆ' },
  countNow: {
    en: 'Count every unit on this shelf now and enter the number.',
    hi: 'इस शेल्फ पर अभी सारे यूनिट गिनें और संख्या डालें।',
    kn: 'ಈ ಶೆಲ್ಫ್‌ನಲ್ಲಿರುವ ಎಲ್ಲಾ ಘಟಕಗಳನ್ನು ಈಗ ಎಣಿಸಿ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.',
  },
  saveCount: { en: 'Save count', hi: 'गिनती सेव करें', kn: 'ಎಣಿಕೆ ಉಳಿಸಿ' },
  noTasks: { en: 'No recount tasks right now.', hi: 'अभी कोई गिनती बाकी नहीं।', kn: 'ಈಗ ಯಾವುದೇ ಮರು ಎಣಿಕೆ ಇಲ್ಲ.' },
  countSaved: { en: 'Count saved.', hi: 'गिनती सेव हो गई।', kn: 'ಎಣಿಕೆ ಉಳಿಸಲಾಗಿದೆ.' },
  offline: {
    en: 'Offline: reports are saved on this phone and sync when you reconnect.',
    hi: 'ऑफ़लाइन: रिपोर्ट इस फ़ोन में सेव हैं, नेटवर्क आने पर भेज दी जाएँगी।',
    kn: 'ಆಫ್‌ಲೈನ್: ವರದಿಗಳನ್ನು ಈ ಫೋನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ, ನೆಟ್‌ವರ್ಕ್ ಬಂದಾಗ ಕಳುಹಿಸಲಾಗುತ್ತದೆ.',
  },
  speakHint: {
    en: 'Say the number found, then a reason: "not found", "damaged".',
    hi: 'मिली संख्या बोलें, फिर कारण: "नहीं मिला", "खराब"।',
    kn: 'ಸಿಕ್ಕ ಸಂಖ್ಯೆ ಹೇಳಿ, ನಂತರ ಕಾರಣ: "ಸಿಗಲಿಲ್ಲ", "ಹಾಳಾಗಿದೆ".',
  },
  speak: { en: 'Speak', hi: 'बोलें', kn: 'ಮಾತನಾಡಿ' },
  listening: { en: 'Listening…', hi: 'सुन रहा है…', kn: 'ಕೇಳುತ್ತಿದೆ…' },
  done: { en: 'Done', hi: 'पूरा', kn: 'ಮುಗಿದಿದೆ' },
};

export const t = (key, lang) => T[key]?.[lang] || T[key]?.en || key;

// Very small voice parser: a number and a reason keyword (English, Hindi, Kannada, and common romanised forms).
export function parseVoice(text) {
  const s = text.toLowerCase();
  const num = s.match(/\d+/);
  let reason = null;
  if (/damag|broken|खराब|टूट|ಹಾಳ|kharab|haala/.test(s)) reason = 'damaged';
  else if (/wrong|गलत|ತಪ್ಪು|galat|tappu/.test(s)) reason = 'wrong_item';
  else if (/fewer|less|कम|ಕಡಿಮೆ|kam|kadime/.test(s)) reason = 'fewer';
  else if (/not found|missing|नहीं मिला|ಸಿಗಲಿಲ್ಲ|nahi mila|sigalilla/.test(s)) reason = 'not_found';
  return { qty: num ? Number(num[0]) : null, reason };
}
