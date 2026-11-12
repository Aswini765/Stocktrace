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
  donePicking: { en: 'Order picked: send to packing', hi: 'ऑर्डर पिक हो गया: पैकिंग पर भेजें', kn: 'ಆರ್ಡರ್ ಪಿಕ್ ಆಯಿತು: ಪ್ಯಾಕಿಂಗ್‌ಗೆ ಕಳುಹಿಸಿ' },
  defaultPicked: {
    en: 'Pick from your slip as usual. Tap Short only if a quantity is missing.',
    hi: 'हमेशा की तरह पर्ची से पिक करें। मात्रा कम हो तभी "कम है" दबाएँ।',
    kn: 'ಎಂದಿನಂತೆ ಚೀಟಿಯಿಂದ ಪಿಕ್ ಮಾಡಿ. ಪ್ರಮಾಣ ಕಡಿಮೆ ಇದ್ದರೆ ಮಾತ್ರ "ಕಡಿಮೆ ಇದೆ" ಒತ್ತಿ.',
  },
  countPending: { en: 'Count pending on this shelf: check carefully', hi: 'इस शेल्फ की गिनती बाकी है: ध्यान से देखें', kn: 'ಈ ಶೆಲ್ಫ್ ಎಣಿಕೆ ಬಾಕಿ ಇದೆ: ಎಚ್ಚರಿಕೆಯಿಂದ ನೋಡಿ' },
  rolePicker: { en: 'Picker', hi: 'पिकर', kn: 'ಪಿಕರ್' },
  roleIncharge: { en: 'Godown in-charge', hi: 'गोदाम इंचार्ज', kn: 'ಗೋದಾಮು ಇನ್‌ಚಾರ್ಜ್' },
  matchesBook: { en: 'Count matches the book.', hi: 'गिनती रिकॉर्ड से मेल खाती है।', kn: 'ಎಣಿಕೆ ದಾಖಲೆಗೆ ಹೊಂದುತ್ತದೆ.' },
  differs: { en: 'Count differs from the book by', hi: 'गिनती रिकॉर्ड से इतनी अलग है:', kn: 'ಎಣಿಕೆ ದಾಖಲೆಗಿಂತ ಇಷ್ಟು ಭಿನ್ನ:' },
  whyDifferent: { en: 'What is the most likely reason?', hi: 'सबसे संभावित कारण क्या है?', kn: 'ಹೆಚ್ಚು ಸಂಭವನೀಯ ಕಾರಣ ಯಾವುದು?' },
  afterPicking: { en: 'Count after this order is picked', hi: 'यह ऑर्डर पिक होने के बाद गिनें', kn: 'ಈ ಆರ್ಡರ್ ಪಿಕ್ ಆದ ನಂತರ ಎಣಿಸಿ' },
  pickedDone: { en: 'Sent to packing.', hi: 'पैकिंग पर भेज दिया।', kn: 'ಪ್ಯಾಕಿಂಗ್‌ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.' },
  waitOwner: { en: 'Wait: owner is deciding the short items', hi: 'रुकें: मालिक कम सामान पर फैसला कर रहे हैं', kn: 'ನಿಲ್ಲಿ: ಕಡಿಮೆ ವಸ್ತುಗಳ ಬಗ್ಗೆ ಮಾಲೀಕರು ನಿರ್ಧರಿಸುತ್ತಿದ್ದಾರೆ' },
  canDispatch: { en: 'Ready to pack and dispatch', hi: 'पैक और डिस्पैच के लिए तैयार', kn: 'ಪ್ಯಾಕ್ ಮತ್ತು ರವಾನೆಗೆ ಸಿದ್ಧ' },
  not_found: { en: 'Not on the shelf', hi: 'शेल्फ पर नहीं', kn: 'ಶೆಲ್ಫ್‌ನಲ್ಲಿ ಇಲ್ಲ' },
  today: { en: 'today', hi: 'आज', kn: 'ಇಂದು' },
  tomorrow: { en: 'tomorrow', hi: 'कल', kn: 'ನಾಳೆ' },
  lines: { en: 'lines', hi: 'लाइन', kn: 'ಸಾಲುಗಳು' },
  found: { en: 'Found', hi: 'मिला', kn: 'ಸಿಕ್ಕಿತು' },
  undo: { en: 'Undo', hi: 'वापस लें', kn: 'ರದ್ದುಮಾಡಿ' },
  confirmPicked: {
    en: 'Lines not marked short go to packing in full and come off the shelf stock.',
    hi: 'जो लाइन "कम है" नहीं हैं, वे पूरी पैकिंग पर जाएँगी और शेल्फ के स्टॉक से घटेंगी।',
    kn: '"ಕಡಿಮೆ ಇದೆ" ಎಂದು ಗುರುತಿಸದ ಸಾಲುಗಳು ಪೂರ್ಣವಾಗಿ ಪ್ಯಾಕಿಂಗ್‌ಗೆ ಹೋಗುತ್ತವೆ ಮತ್ತು ಶೆಲ್ಫ್ ಸ್ಟಾಕ್‌ನಿಂದ ಕಡಿಮೆಯಾಗುತ್ತವೆ.',
  },
  full: { en: 'full', hi: 'पूरी', kn: 'ಪೂರ್ಣ' },
  yesPicked: { en: 'Yes, order picked', hi: 'हाँ, ऑर्डर पिक हो गया', kn: 'ಹೌದು, ಆರ್ಡರ್ ಪಿಕ್ ಆಯಿತು' },
  goBack: { en: 'Go back', hi: 'वापस जाएँ', kn: 'ಹಿಂದೆ ಹೋಗಿ' },
  hintPurchase: { en: '{qty} came in at {time}, may not be on a shelf yet', hi: '{qty} {time} बजे आए, शायद अभी शेल्फ पर नहीं रखे', kn: '{qty} {time}ಕ್ಕೆ ಬಂದಿವೆ, ಇನ್ನೂ ಶೆಲ್ಫ್‌ಗೆ ಇಟ್ಟಿಲ್ಲದಿರಬಹುದು' },
  hintStock: { en: 'Records say {qty} should be here', hi: 'रिकॉर्ड के हिसाब से यहाँ {qty} होने चाहिए', kn: 'ದಾಖಲೆಯ ಪ್ರಕಾರ ಇಲ್ಲಿ {qty} ಇರಬೇಕು' },
  hintMovement: { en: '{qty} moved here on {date}', hi: '{date} को {qty} यहाँ रखे गए', kn: '{date} ರಂದು {qty} ಇಲ್ಲಿಗೆ ಸ್ಥಳಾಂತರಿಸಲಾಗಿದೆ' },
  returnsWarn: { en: 'Returned goods: check the condition before picking', hi: 'लौटा हुआ माल: पिक करने से पहले हालत जाँचें', kn: 'ಹಿಂತಿರುಗಿದ ಸರಕು: ಪಿಕ್ ಮಾಡುವ ಮೊದಲು ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ' },
  showRecord: { en: 'Tally record', hi: 'टैली रिकॉर्ड', kn: 'ಟ್ಯಾಲಿ ದಾಖಲೆ' },
  addToOrder: { en: 'Add to this order', hi: 'इस ऑर्डर में जोड़ें', kn: 'ಈ ಆರ್ಡರ್‌ಗೆ ಸೇರಿಸಿ' },
  substituteFor: { en: 'in place of', hi: 'के बदले', kn: 'ಬದಲಿಗೆ' },
  arrived: { en: 'bought in, in the receiving area', hi: 'बाहर से मँगाया, रिसीविंग एरिया में', kn: 'ಹೊರಗಿನಿಂದ ತರಿಸಲಾಗಿದೆ, ಸ್ವೀಕರಿಸುವ ಸ್ಥಳದಲ್ಲಿ' },
  pickedBtn: { en: 'Picked', hi: 'पिक किया', kn: 'ಪಿಕ್ ಮಾಡಿದೆ' },
  packList: { en: 'Pack list', hi: 'पैकिंग सूची', kn: 'ಪ್ಯಾಕಿಂಗ್ ಪಟ್ಟಿ' },
  blockDecision: { en: 'Wait: the owner is deciding the short items. Do not load.', hi: 'रुकें: मालिक कम सामान पर फैसला कर रहे हैं। लोड न करें।', kn: 'ನಿಲ್ಲಿ: ಮಾಲೀಕರು ಕಡಿಮೆ ವಸ್ತುಗಳ ಬಗ್ಗೆ ನಿರ್ಧರಿಸುತ್ತಿದ್ದಾರೆ. ಲೋಡ್ ಮಾಡಬೇಡಿ.' },
  blockStock: { en: 'Wait: stock is being arranged from outside. Do not load.', hi: 'रुकें: माल बाहर से मँगाया जा रहा है। लोड न करें।', kn: 'ನಿಲ್ಲಿ: ಸ್ಟಾಕ್ ಹೊರಗಿನಿಂದ ತರಿಸಲಾಗುತ್ತಿದೆ. ಲೋಡ್ ಮಾಡಬೇಡಿ.' },
  blockExtra: { en: 'Pick the items below and add them to this order.', hi: 'नीचे दिया सामान पिक करके इस ऑर्डर में जोड़ें।', kn: 'ಕೆಳಗಿನ ವಸ್ತುಗಳನ್ನು ಪಿಕ್ ಮಾಡಿ ಈ ಆರ್ಡರ್‌ಗೆ ಸೇರಿಸಿ.' },
  blockInvoice: { en: 'Wait: the new invoice is not approved yet. Do not load.', hi: 'रुकें: नया बिल अभी मंज़ूर नहीं हुआ। लोड न करें।', kn: 'ನಿಲ್ಲಿ: ಹೊಸ ಬಿಲ್ ಇನ್ನೂ ಅನುಮೋದನೆ ಆಗಿಲ್ಲ. ಲೋಡ್ ಮಾಡಬೇಡಿ.' },
  readyLoad: { en: 'Ready. Pack exactly the list below, then load.', hi: 'तैयार। नीचे की सूची जितना ही पैक करें, फिर लोड करें।', kn: 'ಸಿದ್ಧ. ಕೆಳಗಿನ ಪಟ್ಟಿಯಷ್ಟೇ ಪ್ಯಾಕ್ ಮಾಡಿ, ನಂತರ ಲೋಡ್ ಮಾಡಿ.' },
  markDispatched: { en: 'Truck loaded: mark dispatched', hi: 'गाड़ी लोड हो गई: डिस्पैच करें', kn: 'ವಾಹನ ಲೋಡ್ ಆಯಿತು: ರವಾನೆ ಗುರುತಿಸಿ' },
  dispatched: { en: 'Dispatched', hi: 'डिस्पैच हो गया', kn: 'ರವಾನೆಯಾಗಿದೆ' },
  countGood: {
    en: 'Count only good units on this shelf. Damaged units kept aside are not counted.',
    hi: 'इस शेल्फ पर केवल अच्छे यूनिट गिनें। अलग रखे खराब यूनिट न गिनें।',
    kn: 'ಈ ಶೆಲ್ಫ್‌ನಲ್ಲಿ ಉತ್ತಮ ಘಟಕಗಳನ್ನು ಮಾತ್ರ ಎಣಿಸಿ. ಪಕ್ಕಕ್ಕೆ ಇಟ್ಟ ಹಾಳಾದ ಘಟಕಗಳನ್ನು ಎಣಿಸಬೇಡಿ.',
  },
  whereFound: { en: 'Where are they?', hi: 'वे कहाँ हैं?', kn: 'ಅವು ಎಲ್ಲಿವೆ?' },
  howManyThere: { en: 'How many there?', hi: 'वहाँ कितने?', kn: 'ಅಲ್ಲಿ ಎಷ್ಟು?' },
  save: { en: 'Save', hi: 'सेव करें', kn: 'ಉಳಿಸಿ' },
  missingN: { en: '{n} missing', hi: '{n} कम', kn: '{n} ಕಡಿಮೆ' },
  extraN: { en: '{n} more than expected', hi: '{n} ज़्यादा', kn: '{n} ಹೆಚ್ಚು' },
  wasShort: { en: 'Short', hi: 'कम', kn: 'ಕಡಿಮೆ' },
  pickedOf: { en: 'picked', hi: 'पिक', kn: 'ಪಿಕ್' },
  decided: { en: 'owner decided', hi: 'मालिक ने तय किया', kn: 'ಮಾಲೀಕರು ನಿರ್ಧರಿಸಿದ್ದಾರೆ' },
  searchStill: { en: 'Still short', hi: 'अभी भी कम', kn: 'ಇನ್ನೂ ಕಡಿಮೆ' },
  cause_wrong_shelf: { en: 'Found on another shelf', hi: 'दूसरे शेल्फ पर मिला', kn: 'ಬೇರೆ ಶೆಲ್ಫ್‌ನಲ್ಲಿ ಸಿಕ್ಕಿತು' },
  cause_return_not_entered: { en: 'Customer return not entered', hi: 'ग्राहक की वापसी दर्ज नहीं हुई', kn: 'ಗ್ರಾಹಕ ಹಿಂತಿರುಗಿಸಿದ್ದು ದಾಖಲಾಗಿಲ್ಲ' },
  cause_sample_not_entered: { en: 'Sample / display not entered', hi: 'सैंपल / डिस्प्ले दर्ज नहीं हुआ', kn: 'ಮಾದರಿ / ಪ್ರದರ್ಶನ ದಾಖಲಾಗಿಲ್ಲ' },
  cause_damaged: { en: 'Damaged, not written off', hi: 'खराब, खाते से नहीं हटाया', kn: 'ಹಾಳಾಗಿದೆ, ಖಾತೆಯಿಂದ ತೆಗೆದಿಲ್ಲ' },
  cause_entry_error: { en: 'Tally entry error', hi: 'टैली एंट्री में गलती', kn: 'ಟ್ಯಾಲಿ ನಮೂದು ತಪ್ಪು' },
  cause_missed_on_shelf: { en: 'Was on the shelf (missed while picking)', hi: 'शेल्फ पर था (पिक करते समय छूट गया)', kn: 'ಶೆಲ್ಫ್‌ನಲ್ಲಿತ್ತು (ಪಿಕ್ ಮಾಡುವಾಗ ತಪ್ಪಿತು)' },
  cause_unexplained: { en: 'Unexplained', hi: 'कारण पता नहीं', kn: 'ಕಾರಣ ತಿಳಿದಿಲ್ಲ' },
};

// Units in the picker's language (numbers stay as digits)
const UNITS = {
  pc: { en: ['pc', 'pcs'], hi: ['पीस', 'पीस'], kn: ['ಪೀಸ್', 'ಪೀಸ್'] },
  box: { en: ['box', 'boxes'], hi: ['डिब्बा', 'डिब्बे'], kn: ['ಡಬ್ಬಿ', 'ಡಬ್ಬಿಗಳು'] },
  coil: { en: ['coil', 'coils'], hi: ['कॉइल', 'कॉइल'], kn: ['ಕಾಯಿಲ್', 'ಕಾಯಿಲ್‌ಗಳು'] },
};
export const unitWord = (unit, q, lang) => { const u = UNITS[unit]?.[lang] || UNITS[unit]?.en; return u ? u[q === 1 ? 0 : 1] : unit; };
export const fill = (str, vars) => str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

export const t = (key, lang) => T[key]?.[lang] || T[key]?.en || key;

// Very small voice parser: a number and a reason keyword (English, Hindi, Kannada, and common romanised forms).
export function parseVoice(text) {
  const s = text.toLowerCase();
  const num = s.match(/\d+/);
  let reason = null;
  if (/damag|broken|खराब|टूट|ಹಾಳ|kharab|haala/.test(s)) reason = 'damaged';
  else if (/wrong|गलत|ತಪ್ಪು|galat|tappu/.test(s)) reason = 'wrong_item';
  else if (/fewer|less|not found|missing|कम|नहीं मिला|ಕಡಿಮೆ|ಸಿಗಲಿಲ್ಲ|kam|kadime|nahi mila|sigalilla/.test(s)) reason = 'not_found';
  return { qty: num ? Number(num[0]) : null, reason };
}
