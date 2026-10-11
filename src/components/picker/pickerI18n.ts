export type PickerLang = 'en' | 'hi' | 'kn';

export interface LocalizedString {
  en: string;
  hi: string;
  kn: string;
}

export const PICKER_I18N = {
  header: {
    terminalTitle: {
      en: 'StockTrace Terminal',
      hi: 'स्टॉकट्रेस टर्मिनल',
      kn: 'ಸ್ಟಾಕ್‌ಟ್ರೇಸ್ ಟರ್ಮಿನಲ್',
    },
    demoSelectorLabel: {
      en: 'Demo Scenario:',
      hi: 'डेमो परिदृश्य:',
      kn: 'ಡೆಮೊ ಸನ್ನಿವೇಶ:',
    },
    simulatedBadge: {
      en: 'Simulated Demo Data',
      hi: 'सिमुलेटेड डेमो डेटा',
      kn: 'ಸಿಮ್ಯುಲೇಟೆಡ್ ಡೆಮೊ ಡೇಟಾ',
    },
    expectedBinLabel: {
      en: 'Expected Bin Location',
      hi: 'अपेक्षित बिन स्थान',
      kn: 'ನಿರೀಕ್ಷಿತ ಬಿನ್ ಸ್ಥಳ',
    },
    qtyToPick: {
      en: 'Qty to Pick:',
      hi: 'लेने की मात्रा:',
      kn: 'ತೆಗೆದುಕೊಳ್ಳಬೇಕಾದ ಪ್ರಮಾಣ:',
    },
  },

  welcome: {
    openingMessage: {
      en: 'Hello! Tell me what item you cannot find, or describe the problem you are facing.',
      hi: 'नमस्ते! बताइए कि आपको कौन-सा सामान नहीं मिल रहा है या क्या समस्या आ रही है।',
      kn: 'ನಮಸ್ಕಾರ! ನಿಮಗೆ ಯಾವ ವಸ್ತು ಸಿಗುತ್ತಿಲ್ಲ ಅಥವಾ ಯಾವ ಸಮಸ್ಯೆ ಎದುರಾಗಿದೆ ಎಂದು ತಿಳಿಸಿ.',
    },
    reportMissingBtn: {
      en: 'Report a Missing Item',
      hi: 'गुम सामान की रिपोर्ट करें',
      kn: 'ಕಾಣೆಯಾದ ವಸ್ತುವನ್ನು ವರದಿ ಮಾಡಿ',
    },
    textFallbackPlaceholder: {
      en: 'Type what item you cannot find, or describe the problem...',
      hi: 'लिखें कि आपको कौन-सा सामान नहीं मिल रहा है, या समस्या का वर्णन करें...',
      kn: 'ನಿಮಗೆ ಯಾವ ವಸ್ತು ಸಿಗುತ್ತಿಲ್ಲ ಎಂದು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ...',
    },
    sendButton: {
      en: 'Send Report',
      hi: 'रिपोर्ट भेजें',
      kn: 'ವರದಿ ಕಳುಹಿಸಿ',
    },
    quickExamplesLabel: {
      en: 'Or choose a common report example:',
      hi: 'या सामान्य रिपोर्ट उदाहरण चुनें:',
      kn: 'ಅಥವಾ ಸಾಮಾನ್ಯ ವರದಿ ಉದಾಹರಣೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:',
    },
    examples: [
      {
        id: 'ex-wireless-adapter',
        text: {
          en: 'I cannot find the wireless adapter.',
          hi: 'मुझे वायरलेस अडैप्टर नहीं मिल रहा है।',
          kn: 'ನನಗೆ ವೈರ್ಲೆಸ್ ಅಡಾಪ್ಟರ್ ಸಿಗುತ್ತಿಲ್ಲ.',
        },
      },
      {
        id: 'ex-bin-a12',
        text: {
          en: 'I cannot find the item in bin A12.',
          hi: 'मुझे A12 बिन में यह सामान नहीं मिल रहा है।',
          kn: 'ನನಗೆ A12 ಬಿನ್ನಲ್ಲಿ ವಸ್ತು ಸಿಗುತ್ತಿಲ್ಲ.',
        },
      },
      {
        id: 'ex-cable-shortage',
        text: {
          en: 'The dispatch order asks me to pick 10 cable harnesses, but I can find only 6.',
          hi: 'डिस्पैच ऑर्डर 10 केबल हार्नेस लेने को कहता है, लेकिन मुझे केवल 6 ही मिल रहे हैं।',
          kn: 'ರವಾನೆ ಆದೇಶವು 10 ಕೇಬಲ್ ಹಾರ್ನೆಸ್‌ಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಲು ಕೇಳುತ್ತದೆ, ಆದರೆ ನನಗೆ ಕೇವಲ 6 ಮಾತ್ರ ಸಿಕ್ಕಿವೆ.',
        },
      },
      {
        id: 'ex-bin-empty',
        text: {
          en: 'The bin is empty.',
          hi: 'बिन पूरी तरह खाली है।',
          kn: 'ಬಿನ್ ಖಾಲಿಯಾಗಿದೆ.',
        },
      },
      {
        id: 'ex-item-damaged',
        text: {
          en: 'I found the item, but it is damaged.',
          hi: 'मुझे सामान मिल गया, लेकिन यह क्षतिग्रस्त है।',
          kn: 'ನನಗೆ ವಸ್ತು ಸಿಕ್ಕಿದೆ, ಆದರೆ ಅದು ಹಾನಿಗೊಳಗಾಗಿದೆ.',
        },
      },
    ],
  },

  dispatch: {
    orderMatchedConfirmation: {
      en: 'I found a dispatch order that matches your report. Let me check the item and inventory movement records.',
      hi: 'मुझे आपकी रिपोर्ट से मेल खाने वाला एक डिस्पैच ऑर्डर मिला है। मैं सामान और इन्वेंटरी मूवमेंट रिकॉर्ड की जांच करता हूँ।',
      kn: 'ನಿಮ್ಮ ವರದಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ರವಾನೆ ಆದೇಶವನ್ನು ನಾನು ಕಂಡುಕೊಂಡಿದ್ದೇನೆ. ಐಟಂ ಮತ್ತು ದಾಸ್ತಾನು ಚಲನೆಯ ದಾಖಲೆಗಳನ್ನು ನಾನು ಪರಿಶೀಲಿಸುತ್ತೇನೆ.',
    },
    taskAssignedProgress: {
      en: 'Task assigned. Checking inventory records and recent movement activity…',
      hi: 'टास्क असाइन हो गया। इन्वेंटरी रिकॉर्ड और हाल की मूवमेंट गतिविधि की जांच की जा रही है…',
      kn: 'ಕಾರ್ಯ ನಿಯೋಜಿಸಲಾಗಿದೆ. ದಾಸ್ತಾನು ದಾಖಲೆಗಳು ಮತ್ತು ಇತ್ತೀಚಿನ ಚಲನೆಯ ಚಟುವಟಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…',
    },
    taskCardTitle: {
      en: 'Matched Dispatch Order & Assigned Task',
      hi: 'मैच हुआ डिस्पैच ऑर्डर और असाइन किया गया टास्क',
      kn: 'ಹೊಂದಿಕೆಯಾದ ರವಾನೆ ಆದೇಶ ಮತ್ತು ನಿಯೋಜಿಸಲಾದ ಕಾರ್ಯ',
    },
    taskIdLabel: {
      en: 'Task ID:',
      hi: 'टास्क आईडी:',
      kn: 'ಕಾರ್ಯ ಐಡಿ:',
    },
    orderIdLabel: {
      en: 'Dispatch Order ID:',
      hi: 'डिस्पैच ऑर्डर आईडी:',
      kn: 'ರವಾನೆ ಆದೇಶ ಐಡಿ:',
    },
    skuLabel: {
      en: 'SKU:',
      hi: 'एसकेयू:',
      kn: 'ಎಸ್‌ಕೆಯು:',
    },
    requiredQtyLabel: {
      en: 'Required by Order:',
      hi: 'ऑर्डर अनुसार आवश्यक:',
      kn: 'ಆದೇಶದ ಪ್ರಕಾರ ಅಗತ್ಯವಿದೆ:',
    },
    expectedBinLabel: {
      en: 'Expected Bin:',
      hi: 'अपेक्षित बिन:',
      kn: 'ನಿರೀಕ್ಷಿತ ಬಿನ್:',
    },
    statusLabel: {
      en: 'Status:',
      hi: 'स्थिति:',
      kn: 'ಸ್ಥಿತಿ:',
    },
    reportedQtyLabel: {
      en: 'Picker Reported Available:',
      hi: 'पिकर द्वारा उपलब्ध सूचित:',
      kn: 'ಪಿಕರ್ ಲಭ್ಯವಿದೆ ಎಂದು ವರದಿ ಮಾಡಿದ್ದು:',
    },
    discrepancyLabel: {
      en: 'Calculated Discrepancy:',
      hi: 'गणना की गई विसंगति:',
      kn: 'ಲೆಕ್ಕಹಾಕಿದ ವ್ಯತ್ಯಾಸ:',
    },
  },

  initialActions: {
    reportMissing: {
      en: 'Report Missing Item',
      hi: 'गुम सामान की रिपोर्ट करें',
      kn: 'ಕಾಣೆಯಾದ ವಸ್ತುವನ್ನು ವರದಿ ಮಾಡಿ',
    },
    reportMissingSubtitle: {
      en: 'Tap to speak or type if item is not found at expected bin',
      hi: 'यदि सामान अपेक्षित बिन में नहीं है तो बोलने या लिखने के लिए टैप करें',
      kn: 'ನಿರೀಕ್ಷಿತ ಬಿನ್‌ನಲ್ಲಿ ವಸ್ತು ಸಿಗದಿದ್ದರೆ ಮಾತನಾಡಲು ಅಥವಾ ಟೈಪ್ ಮಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
    },
    confirmFoundAtExpected: {
      en: 'Found at Assigned Bin (Confirm Pick)',
      hi: 'निर्धारित बिन में मिल गया (पिक पुष्टि करें)',
      kn: 'ನಿಗದಿಪಡಿಸಿದ ಬಿನ್‌ನಲ್ಲಿ ಸಿಕ್ಕಿದೆ (ಪಿಕ್ ದೃಢೀಕರಿಸಿ)',
    },
    quickTextOption: {
      en: 'Text / Quick Options',
      hi: 'टेक्स्ट / त्वरित विकल्प',
      kn: 'ಪಠ್ಯ / ತ್ವರಿತ ಆಯ್ಕೆಗಳು',
    },
  },

  voiceModal: {
    title: {
      en: 'Report Missing Item',
      hi: 'गुम सामान की रिपोर्ट करें',
      kn: 'ಕಾಣೆಯಾದ ವಸ್ತುವನ್ನು ವರದಿ ಮಾಡಿ',
    },
    prompt: {
      en: 'Tell StockTrace what you cannot find.',
      hi: 'StockTrace को बताएं कि आपको कौन-सा सामान नहीं मिल रहा है।',
      kn: 'ನಿಮಗೆ ಯಾವ ವಸ್ತು ಸಿಗುತ್ತಿಲ್ಲ ಎಂಬುದನ್ನು StockTrace ಗೆ ತಿಳಿಸಿ.',
    },
    tapToSpeak: {
      en: 'Tap microphone to speak',
      hi: 'बोलने के लिए माइक्रोफ़ोन टैप करें',
      kn: 'ಮಾತನಾಡಲು ಮೈಕ್ರೊಫೋನ್ ಟ್ಯಾಪ್ ಮಾಡಿ',
    },
    listeningNow: {
      en: 'Listening... Speak clearly now',
      hi: 'सुन रहा है... अब स्पष्ट बोलें',
      kn: 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದೆ... ಈಗ ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ',
    },
    stopListening: {
      en: 'Stop Recording',
      hi: 'रिकॉर्डिंग रोकें',
      kn: 'ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಿ',
    },
    speechNotSupported: {
      en: 'Speech recognition not supported in this browser. Please type or select a quick report below.',
      hi: 'इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है। कृपया नीचे टाइप करें या त्वरित विकल्प चुनें।',
      kn: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಗುರುತಿಸುವಿಕೆ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೆಳಗೆ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ತ್ವರಿತ ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ.',
    },
    editReviewHint: {
      en: 'Review or edit your message before sending:',
      hi: 'भेजने से पहले अपने संदेश की समीक्षा या संपादन करें:',
      kn: 'ಕಳುಹಿಸುವ ಮೊದಲು ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಸಂಪಾದಿಸಿ:',
    },
    quickOptionsLabel: {
      en: 'Quick Report Options:',
      hi: 'त्वरित रिपोर्ट विकल्प:',
      kn: 'ತ್ವರಿತ ವರದಿ ಆಯ್ಕೆಗಳು:',
    },
    quickOptions: (item: string, bin: string): Array<{ id: string; text: LocalizedString }> => [
      {
        id: 'cannot-find',
        text: {
          en: `I cannot find this ${item} in bin ${bin}.`,
          hi: `मुझे ${bin} बिन में यह ${item} नहीं मिल रहा है।`,
          kn: `ನನಗೆ ${bin} ಬಿನ್ನಲ್ಲಿ ಈ ${item} ಸಿಗುತ್ತಿಲ್ಲ.`,
        },
      },
      {
        id: 'bin-empty',
        text: {
          en: `Bin ${bin} is completely empty.`,
          hi: `बिन ${bin} पूरी तरह से खाली है।`,
          kn: `ಬಿನ್ ${bin} ಸಂಪೂರ್ಣವಾಗಿ ಖಾಲಿಯಾಗಿದೆ.`,
        },
      },
      {
        id: 'partial-qty',
        text: {
          en: `Only some of the required quantity is available in bin ${bin}.`,
          hi: `बिन ${bin} में केवल कुछ ही मात्रा उपलब्ध है।`,
          kn: `ಬಿನ್ ${bin} ನಲ್ಲಿ ಅಗತ್ಯವಿರುವ ಪ್ರಮಾಣದ ಕೆಲವು ಮಾತ್ರ ಲಭ್ಯವಿದೆ.`,
        },
      },
      {
        id: 'item-damaged',
        text: {
          en: `The item in bin ${bin} is damaged.`,
          hi: `बिन ${bin} में रखा सामान क्षतिग्रस्त है।`,
          kn: `ಬಿನ್ ${bin} ನಲ್ಲಿರುವ ವಸ್ತು ಹಾನಿಗೊಳಗಾಗಿದೆ.`,
        },
      },
    ],
    sendReportButton: {
      en: 'Send Report',
      hi: 'रिपोर्ट भेजें',
      kn: 'ವರದಿ ಕಳುಹಿಸಿ',
    },
    cancelButton: {
      en: 'Cancel',
      hi: 'रद्द करें',
      kn: 'ರದ್ದುಮಾಡಿ',
    },
  },

  verificationButtons: {
    foundHere: {
      en: 'Found Here',
      hi: 'यहाँ मिल गया',
      kn: 'ಇಲ್ಲಿ ಸಿಕ್ಕಿದೆ',
    },
    stillNotFound: {
      en: 'Still Not Found',
      hi: 'अभी भी नहीं मिला',
      kn: 'ಇನ್ನೂ ಸಿಗಲಿಲ್ಲ',
    },
    lessQty: {
      en: 'Less Quantity',
      hi: 'कम मात्रा',
      kn: 'ಕಡಿಮೆ ಪ್ರಮಾಣ',
    },
    damaged: {
      en: 'Damaged',
      hi: 'क्षतिग्रस्त',
      kn: 'ಹಾನಿಗೊಳಗಾಗಿದೆ',
    },
    listenInstruction: {
      en: 'Listen to instruction',
      hi: 'निर्देश सुनें',
      kn: 'ಸೂಚನೆ ಕೇಳಿ',
    },
    listening: {
      en: 'Speaking instruction...',
      hi: 'निर्देश बोल रहा है...',
      kn: 'ಸೂಚನೆ ಹೇಳಲಾಗುತ್ತಿದೆ...',
    },
    escalateSupervisor: {
      en: 'Escalate to Supervisor',
      hi: 'सुपरवाइजर को भेजें',
      kn: 'ಮೇಲ್ವಿಚಾರಕರಿಗೆ ಕಳುಹಿಸಿ',
    },
    runTier3Ai: {
      en: 'Run Simulated Tier 3 AI Video Analysis (~₹120)',
      hi: 'सिमुलेटेड टियर 3 AI वीडियो विश्लेषण चलाएं (~₹120)',
      kn: 'ಸಿಮ್ಯುಲೇಟೆಡ್ ಶ್ರೇಣಿ 3 AI ವೀಡಿಯೊ ವಿಶ್ಲೇಷಣೆ ಚಲಾಯಿಸಿ (~₹120)',
    },
    runningTier3: {
      en: 'Processing CCTV Video Frames...',
      hi: 'सीसीटीवी वीडियो फ्रेम प्रोसेस हो रहे हैं...',
      kn: 'ಸಿಸಿಟಿವಿ ವೀಡಿಯೊ ಫ್ರೇಮ್‌ಗಳನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...',
    },
    reset: {
      en: 'Reset',
      hi: 'रीसेट',
      kn: 'ಮರುಹೊಂದಿಸಿ',
    },
    submitDiscrepancy: {
      en: 'Submit Discrepancy & Escalate',
      hi: 'विसंगति दर्ज करें और आगे भेजें',
      kn: 'ವ್ಯತ್ಯಾಸವನ್ನು ಸಲ್ಲಿಸಿ ಮತ್ತು ಕಳುಹಿಸಿ',
    },
    submitDamage: {
      en: 'Submit Damage & Escalate',
      hi: 'क्षति रिपोर्ट करें और आगे भेजें',
      kn: 'ಹಾನಿ ವರದಿ ಸಲ್ಲಿಸಿ ಮತ್ತು ಕಳುಹಿಸಿ',
    },
    cancel: {
      en: 'Cancel',
      hi: 'रद्द करें',
      kn: 'ರದ್ದುಮಾಡಿ',
    },
  },

  // Backward compatibility alias
  buttons: {
    found: {
      en: 'FOUND',
      hi: 'मिल गया',
      kn: 'ಸಿಕ್ಕಿದೆ',
    },
    notFound: {
      en: 'NOT FOUND',
      hi: 'नहीं मिला',
      kn: 'ಸಿಗಲಿಲ್ಲ',
    },
  },

  messages: {
    initialGreeting: (qty: number, item: string, expectedBin: string): LocalizedString => ({
      en: `Hi! You need to pick ${qty} ${item} items from bin ${expectedBin}. Were you able to find them?`,
      hi: `नमस्ते! आपको बिन ${expectedBin} से ${qty} ${item} आइटम लेने हैं। क्या आपको ये आइटम मिले?`,
      kn: `ನಮಸ್ಕಾರ! ನೀವು ${expectedBin} ಬಿನ್ನಿಂದ ${qty} ${item} ವಸ್ತುಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಬೇಕು. ಅವು ನಿಮಗೆ ಸಿಕ್ಕಿವೆಯೇ?`,
    }),

    pickerNotFoundExpected: (expectedBin: string): LocalizedString => ({
      en: `I cannot find this item in bin ${expectedBin}.`,
      hi: `मुझे ${expectedBin} बिन में यह आइटम नहीं मिल रहा है।`,
      kn: `ನನಗೆ ${expectedBin} ಬಿನ್ನಲ್ಲಿ ಈ ವಸ್ತು ಸಿಗುತ್ತಿಲ್ಲ।`,
    }),

    investigationProgress: {
      en: 'Task assigned. Checking inventory records and recent movement activity…',
      hi: 'टास्क असाइन हो गया। इन्वेंटरी रिकॉर्ड और हाल की मूवमेंट गतिविधि की जांच की जा रही है…',
      kn: 'ಕಾರ್ಯ ನಿಯೋಜಿಸಲಾಗಿದೆ. ದಾಸ್ತಾನು ದಾಖಲೆಗಳು ಮತ್ತು ಇತ್ತೀಚಿನ ಚಲನೆಯ ಚಟುವಟಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…',
    },

    recommendationSupported: (
      fromBin: string,
      toBin: string,
      time: string,
      landmark?: string
    ): LocalizedString => ({
      en: `I found a scanner record indicating that this item may have moved from ${fromBin || 'the expected bin'} to ${toBin}. Please check ${toBin}${landmark ? ' ' + landmark : ''}. The item's presence has not yet been physically verified.`,
      hi: `मुझे एक स्कैनर रिकॉर्ड मिला जिससे पता चलता है कि यह सामान ${fromBin || 'अपेक्षित बिन'} से ${toBin} में चला गया हो सकता है। कृपया ${toBin}${landmark ? ' ' + landmark : ''} चेक करें। सामान की मौजूदगी की अभी भौतिक पुष्टि नहीं हुई है।`,
      kn: `ಈ ವಸ್ತು ${fromBin || 'ನಿರೀಕ್ಷಿತ ಬಿನ್'} ನಿಂದ ${toBin} ಗೆ ಚಲಿಸಿರಬಹುದು ಎಂದು ಸ್ಕ್ಯಾನರ್ ದಾಖಲೆ ಸೂಚಿಸುತ್ತದೆ. ದಯವಿಟ್ಟು ${toBin}${landmark ? ' ' + landmark : ''} ಪರಿಶೀಲಿಸಿ. ವಸ್ತುವಿನ ಉಪಸ್ಥಿತಿಯನ್ನು ಇನ್ನೂ ಭೌತಿಕವಾಗಿ ದೃಢೀಕರಿಸಲಾಗಿಲ್ಲ.`,
    }),

    verificationPrompt: (recBin: string): LocalizedString => ({
      en: `Please check ${recBin}. Did you find the item?`,
      hi: `कृपया ${recBin} चेक करें। क्या आपको आइटम मिला?`,
      kn: `ದಯವಿಟ್ಟು ${recBin} ಪರಿಶೀಲಿಸಿ. ನಿಮಗೆ ವಸ್ತು ಸಿಕ್ಕಿತೇ?`,
    }),

    verificationPromptGeneric: {
      en: 'Please check the suggested bin. Did you find the item?',
      hi: 'कृपया सुझाए गए बिन की जांच करें। क्या आपको सामान मिला?',
      kn: 'ದಯವಿಟ್ಟು ಸೂಚಿಸಲಾದ ಬಿನ್ ಪರಿಶೀಲಿಸಿ. ನಿಮಗೆ ವಸ್ತು ಸಿಕ್ಕಿತೇ?',
    },

    recommendationInsufficient: {
      en: "I couldn't find enough reliable evidence to recommend another location. I'll send this case to your supervisor for help.",
      hi: 'मुझे किसी अन्य स्थान की सिफारिश करने के लिए पर्याप्त विश्वसनीय सबूत नहीं मिले। मैं मदद के लिए यह केस आपके सुपरवाइजर को भेजूंगा।',
      kn: 'ಮತ್ತೊಂದು ಸ್ಥಳವನ್ನು ಶಿಫಾರಸು ಮಾಡಲು ಸಾಕಷ್ಟು ವಿಶ್ವಾಸಾರ್ಹ ಪುರಾವೆಗಳು ಸಿಗಲಿಲ್ಲ. ಸಹಾಯಕ್ಕಾಗಿ ಈ ಪ್ರಕರಣವನ್ನು ನಿಮ್ಮ ಮೇಲ್ವಿಚಾರಕರಿಗೆ ಕಳುಹಿಸುತ್ತೇನೆ.',
    },

    recommendationConflicting: (
      scannerLoc: string,
      scannerTime: string,
      cameraLoc: string,
      cameraTime: string
    ): LocalizedString => ({
      en: `Conflicting movement signals detected. Scanner records show transfer toward ${scannerLoc} at ${scannerTime}, but conveyor camera footage shows movement toward ${cameraLoc} at ${cameraTime}. No single location can be reliably recommended. Case must be escalated to the supervisor.`,
      hi: `परस्पर विरोधी मूवमेंट संकेत मिले हैं। स्कैनर रिकॉर्ड ${scannerTime} पर ${scannerLoc} दिखाता है, लेकिन कन्वेयर कैमरा ${cameraTime} पर ${cameraLoc} की ओर दिखाता है। कोई स्थान अनुशंसित नहीं किया जा सकता। केस सुपरवाइजर को भेजा जा रहा है।`,
      kn: `ಪರಸ್ಪರ ವಿರೋಧಾತ್ಮಕ ಚಲನೆ ಸಂಕೇತಗಳು ಪತ್ತೆಯಾಗಿವೆ. ಸ್ಕ್ಯಾನರ್ ${scannerTime} ಕ್ಕೆ ${scannerLoc} ತೋರಿಸಿದರೆ, ಕ್ಯಾಮೆರಾ ${cameraTime} ಕ್ಕೆ ${cameraLoc} ತೋರಿಸುತ್ತದೆ. ಯಾವುದೇ ನಿರ್ದಿಷ್ಟ ಸ್ಥಳವನ್ನು ಶಿಫಾರಸು ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ. ಪ್ರಕರಣವನ್ನು ಮೇಲ್ವಿಚಾರಕರಿಗೆ ಕಳುಹಿಸಬೇಕು.`,
    }),

    recommendationStale: (staleLoc: string, hoursOld: number = 28): LocalizedString => ({
      en: `Movement record pointing to ${staleLoc} was found, but the record is ${hoursOld} hours old (exceeds the 2-hour freshness limit). This is stale evidence and cannot be verified as current proof. Please escalate to your supervisor or proceed with caution.`,
      hi: `${staleLoc} का रिकॉर्ड मिला, लेकिन यह ${hoursOld} घंटे पुराना है (2 घंटे की सीमा से अधिक)। यह पुराना डेटा है और वर्तमान स्थिति की पुष्टि नहीं करता। कृपया सुपरवाइजर को भेजें।`,
      kn: `${staleLoc} ಗೆ ಚಲನೆಯ ದಾಖಲೆ ಲಭ್ಯವಿದೆ, ಆದರೆ ಇದು ${hoursOld} ಗಂಟೆಗಳಷ್ಟು ಹಳೆಯದಾಗಿದೆ (2 ಗಂಟೆಗಳ ಮಿತಿಗಿಂತ ಹೆಚ್ಚು). ಇದು ಹಳೆಯ ಪುರಾವೆಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಮೇಲ್ವಿಚಾರಕರಿಗೆ ಕಳುಹಿಸಿ.`,
    }),

    recommendationHighValue: (itemValue: number, costInr: number = 120): LocalizedString => ({
      en: `High-value inventory item (₹${itemValue.toLocaleString('en-IN')} exceeds the ₹5,000 threshold). Tier 1 scanner evidence is inconclusive. Eligible for simulated Tier 3 AI video-analysis workflow (~₹${costInr} illustrative cost).`,
      hi: `उच्च मूल्य वाली वस्तु (₹${itemValue.toLocaleString('en-IN')} ₹5,000 की सीमा से अधिक)। टियर 1 स्कैनर डेटा अनिर्णायक है। सिमुलेटेड टियर 3 AI वीडियो विश्लेषण (~₹${costInr} अनुमानित लागत) के लिए पात्र है।`,
      kn: `ಹೆಚ್ಚಿನ ಮೌಲ್ಯದ ದಾಸ್ತಾನು ವಸ್ತು (₹${itemValue.toLocaleString('en-IN')} ₹5,000 ಮಿತಿಯನ್ನು ಮೀರಿದೆ). ಶ್ರೇಣಿ 1 ಸ್ಕ್ಯಾನರ್ ಡೇಟಾ ಅನಿರ್ಣಾಯಕವಾಗಿದೆ. ಸಿಮ್ಯುಲೇಟೆಡ್ ಶ್ರೇಣಿ 3 AI ವೀಡಿಯೊ ವಿಶ್ಲೇಷಣೆಗೆ (~₹${costInr} ಅಂದಾಜು ವೆಚ್ಚ) ಅರ್ಹವಾಗಿದೆ.`,
    }),

    tier3AnalysisCompleted: (detectedLoc: string): LocalizedString => ({
      en: `Simulated Tier 3 AI video analysis completed: Multi-frame visual recognition confirmed manufacturer packaging placed into Bay ${detectedLoc}. Illustrative compute cost ₹120 logged.`,
      hi: `सिमुलेटेड टियर 3 AI वीडियो विश्लेषण पूर्ण: मल्टी-फ्रेम विजुअल पहचान ने बे ${detectedLoc} में रखे गए पैकेजिंग की पुष्टि की। ₹120 लागत दर्ज की गई।`,
      kn: `ಸಿಮ್ಯುಲೇಟೆಡ್ ಶ್ರೇಣಿ 3 AI ವೀಡಿಯೊ ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ: ಬೇ ${detectedLoc} ನಲ್ಲಿ ಪ್ಯಾಕೇಜಿಂಗ್ ಇರುವುದನ್ನು ದೃಢೀಕರಿಸಲಾಗಿದೆ. ₹120 ವೆಚ್ಚ ದಾಖಲಾಗಿದೆ.`,
    }),

    pickerFound: (loc: string): LocalizedString => ({
      en: `I found the item at ${loc}.`,
      hi: `मुझे ${loc} पर आइटम मिल गया।`,
      kn: `ನನಗೆ ${loc} ನಲ್ಲಿ ವಸ್ತು ಸಿಕ್ಕಿದೆ.`,
    }),

    pickerNotFoundRecommended: (loc: string): LocalizedString => ({
      en: `I checked ${loc}, but the item is not there either.`,
      hi: `मैंने ${loc} चेक किया, लेकिन आइटम वहां भी नहीं है।`,
      kn: `ನಾನು ${loc} ಪರಿಶೀಲಿಸಿದೆ, ಆದರೆ ವಸ್ತು ಅಲ್ಲಿಯೂ ಇಲ್ಲ.`,
    }),

    pickerReportedLessQty: (found: number, expected: number): LocalizedString => ({
      en: `I only found ${found} of ${expected} units requested.`,
      hi: `मुझे अपेक्षित ${expected} में से केवल ${found} यूनिट ही मिले।`,
      kn: `ಕೇಳಲಾದ ${expected} ರಲ್ಲಿ ನನಗೆ ${found} ಯೂನಿಟ್‌ಗಳು ಮಾತ್ರ ಸಿಕ್ಕಿವೆ.`,
    }),

    pickerReportedDamaged: (reason: string): LocalizedString => ({
      en: `The item is damaged: ${reason}.`,
      hi: `आइटम क्षतिग्रस्त है: ${reason}।`,
      kn: `ವಸ್ತು ಹಾನಿಗೊಳಗಾಗಿದೆ: ${reason}.`,
    }),

    caseResolvedMessage: (loc: string): LocalizedString => ({
      en: `Great! Physical presence verified and pick completed at ${loc}. Case marked RESOLVED in supervisor console.`,
      hi: `बहुत बढ़िया! ${loc} पर भौतिक सत्यापन और पिक पूरा हुआ। सुपरवाइजर कंसोल में केस हल (RESOLVED) के रूप में दर्ज हुआ।`,
      kn: `ಉತ್ತಮ! ${loc} ನಲ್ಲಿ ಭೌತಿಕ ಪರಿಶೀಲನೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ಮೇಲ್ವಿಚಾರಕರ ಕನ್ಸೋಲ್‌ನಲ್ಲಿ ಪ್ರಕರಣವನ್ನು ಪರಿಹರಿಸಲಾಗಿದೆ (RESOLVED) ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ.`,
    }),

    caseEscalatedMessage: (reason: string): LocalizedString => ({
      en: `Case escalated to warehouse supervisor: ${reason}. Discrepancy logged for physical audit.`,
      hi: `केस सुपरवाइजर को भेजा गया: ${reason}। भौतिक ऑडिट के लिए विसंगति दर्ज की गई।`,
      kn: `ಪ್ರಕರಣವನ್ನು ಮೇಲ್ವಿಚಾರಕರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ: ${reason}. ಆಡಿಟ್‌ಗಾಗಿ ವ್ಯತ್ಯಾಸವನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ.`,
    }),
  },

  drawers: {
    lessQtyTitle: {
      en: 'Report Partial Quantity',
      hi: 'कम मात्रा की रिपोर्ट करें',
      kn: 'ಭಾಗಶಃ ಪ್ರಮಾಣವನ್ನು ವರದಿ ಮಾಡಿ',
    },
    lessQtyPrompt: (expected: number): LocalizedString => ({
      en: `Enter actual quantity physically found (out of ${expected} expected):`,
      hi: `वास्तव में मिली मात्रा दर्ज करें (अपेक्षित ${expected} में से):`,
      kn: `ನಿಜವಾಗಿ ಸಿಕ್ಕಿದ ಪ್ರಮಾಣವನ್ನು ನಮೂದಿಸಿ (${expected} ನಿರೀಕ್ಷಿತದಲ್ಲಿ):`,
    }),
    damageTitle: {
      en: 'Report Damaged Inventory',
      hi: 'क्षतिग्रस्त स्टॉक की रिपोर्ट करें',
      kn: 'ಹಾನಿಗೊಳಗಾದ ದಾಸ್ತಾನು ವರದಿ ಮಾಡಿ',
    },
    damagePrompt: {
      en: 'Select damage condition:',
      hi: 'क्षति की स्थिति चुनें:',
      kn: 'ಹಾನಿಯ ಸ್ಥಿತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:',
    },
    damageOptions: [
      {
        id: 'CRACKED_SEAL',
        label: {
          en: 'Cracked packaging / Broken seal',
          hi: 'टूटी हुई पैकेजिंग / टूटी सील',
          kn: 'ಒಡೆದ ಪ್ಯಾಕೇಜಿಂಗ್ / ಮುರಿದ ಸೀಲ್',
        },
      },
      {
        id: 'CRUSHED_BOX',
        label: {
          en: 'Crushed carton / Structural dent',
          hi: 'दबा हुआ कार्टन / ढांचागत क्षति',
          kn: 'ಜಜ್ಜಿದ ಕಾರ್ಟನ್ / ರಚನಾತ್ಮಕ ಹಾನಿ',
        },
      },
      {
        id: 'BROKEN_GLASS',
        label: {
          en: 'Broken glass / Cracked screen',
          hi: 'टूटा हुआ कांच / स्क्रीन टूटी',
          kn: 'ಒಡೆದ ಗಾಜು / ಬಿರುಕು ಬಿಟ್ಟ ಪರದೆ',
        },
      },
      {
        id: 'WATER_DAMAGE',
        label: {
          en: 'Water / Moisture contamination',
          hi: 'पानी / नमी से संदूषण',
          kn: 'ನೀರು / ತೇವಾಂಶದಿಂದ ಹಾನಿ',
        },
      },
    ],
  },
};
