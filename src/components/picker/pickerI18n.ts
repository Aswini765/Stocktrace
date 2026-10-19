export type PickerLang = 'en' | 'hi' | 'kn';

export interface LocalizedString {
  en: string;
  hi: string;
  kn: string;
}

export const PICKER_I18N = {
  header: {
    terminalTitle: {
      en: 'StockTrace Assistant',
      hi: 'स्टॉकट्रेस सहायक',
      kn: 'ಸ್ಟಾಕ್‌ಟ್ರೇಸ್ ಸಹಾಯಕ',
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
      en: 'Expected Shelf Location',
      hi: 'अपेक्षित शेल्फ़ स्थान',
      kn: 'ನಿರೀಕ್ಷಿತ ಶೆಲ್ಫ್ ಸ್ಥಳ',
    },
    qtyToPick: {
      en: 'Qty to Pick:',
      hi: 'लेने की मात्रा:',
      kn: 'ತೆಗೆದುಕೊಳ್ಳಬೇಕಾದ ಪ್ರಮಾಣ:',
    },
  },

  voiceStatus: {
    speaking: {
      en: 'Speaking...',
      hi: 'बोल रहा है...',
      kn: 'ಮಾತನಾಡುತ್ತಿದೆ...',
    },
    listening: {
      en: 'Listening... speak now',
      hi: 'सुन रहा है... अब बोलें',
      kn: 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದೆ... ಈಗ ಮಾತನಾಡಿ',
    },
    ready: {
      en: 'Voice Ready',
      hi: 'आवाज़ तैयार है',
      kn: 'ಧ್ವನಿ ಸಿದ್ಧವಾಗಿದೆ',
    },
    replayBtn: {
      en: 'Replay audio',
      hi: 'ऑडियो दोबारा सुनें',
      kn: 'ಆಡಿಯೋ ಮರುಪ್ಲೇ ಮಾಡಿ',
    },
    micDenied: {
      en: 'Microphone access denied. You can tap buttons or type below.',
      hi: 'माइक्रोफ़ोन अनुमति अस्वीकृत। आप नीचे बटन दबा सकते हैं या लिख सकते हैं।',
      kn: 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ನೀವು ಕೆಳಗಿನ ಬಟನ್‌ಗಳನ್ನು ಒತ್ತಬಹುದು.',
    },
  },

  // -------------------------------------------------------------------------
  // SIMPLIFIED 5-STEP WORKFLOW STRINGS (Strict Section 4 Compliance)
  // -------------------------------------------------------------------------
  steps: {
    // Step 1: Ask what is missing
    step1AskMissing: {
      en: 'Hello! Which item can you not find?',
      hi: 'नमस्ते! आपको कौन-सा सामान नहीं मिल रहा है?',
      kn: 'ನಮಸ್ಕಾರ! ನಿಮಗೆ ಯಾವ ವಸ್ತು ಸಿಗುತ್ತಿಲ್ಲ?',
    },
    step1InputPlaceholder: {
      en: 'Type the item name or shelf number...',
      hi: 'सामान का नाम या शेल्फ़ नंबर लिखें...',
      kn: 'ವಸ್ತುವಿನ ಹೆಸರು ಅಥವಾ ಶೆಲ್ಫ್ ಸಂಖ್ಯೆ ಬರೆಯಿರಿ...',
    },
    step1Send: {
      en: 'Check Item',
      hi: 'सामान जांचें',
      kn: 'ವಸ್ತು ಪರಿಶೀಲಿಸಿ',
    },

    // Step 2: Confirm correct item
    step2ItemFound: (item: string): LocalizedString => ({
      en: `I found your item: "${item}". Is this the correct one?`,
      hi: `मुझे आपका सामान मिला: "${item}"। क्या यह सही है?`,
      kn: `ನನಗೆ ನಿಮ್ಮ ವಸ್ತು ಸಿಕ್ಕಿದೆ: "${item}". ಇದು ಸರಿಯೇ?`,
    }),
    step2ConfirmYes: {
      en: 'Yes, this is it',
      hi: 'हाँ, यही है',
      kn: 'ಹೌದು, ಇದೇ ಸರಿ',
    },
    step2ConfirmNo: {
      en: 'No, try another item',
      hi: 'नहीं, दूसरा खोजें',
      kn: 'ಇಲ್ಲ, ಮತ್ತೊಂದು ಹುಡುಕಿ',
    },
    step2MultipleMatches: {
      en: 'I found more than one item with a similar name. Please choose yours:',
      hi: 'मुझे इस नाम से मिलते-जुलते एक से अधिक सामान मिले। कृपया अपना सामान चुनें:',
      kn: 'ಇದೇ ಹೆಸರಿನ ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ವಸ್ತುಗಳು ಕಂಡುಬಂದಿವೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮದನ್ನು ಆಯ್ಕೆಮಾಡಿ:',
    },
    step2NoMatch: {
      en: 'I could not find this item in the list. Please try another name or ask your supervisor for help.',
      hi: 'मुझे सूची में यह सामान नहीं मिला। कृपया दूसरा नाम आज़माएं या अपने सुपरवाइज़र से मदद लें।',
      kn: 'ಪಟ್ಟಿಯಲ್ಲಿ ಈ ವಸ್ತು ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಇನ್ನೊಂದು ಹೆಸರನ್ನು ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ನಿಮ್ಮ ಮೇಲ್ವಿಚಾರಕರ ಸಹಾಯ ಕೇಳಿ.',
    },
    step2TryAgain: {
      en: 'Try Another Name',
      hi: 'दूसरा नाम आज़माएं',
      kn: 'ಇನ್ನೊಂದು ಹೆಸರನ್ನು ಪ್ರಯತ್ನಿಸಿ',
    },
    step2AskSupervisor: {
      en: 'Ask Supervisor for Help',
      hi: 'सुपरवाइज़र से मदद मांगें',
      kn: 'ಮೇಲ್ವಿಚಾರಕರ ಸಹಾಯ ಕೇಳಿ',
    },

    // Step 3: Explain where to look
    step3ExplainLocation: (bin: string, landmark?: string): LocalizedString => ({
      en: `Please check shelf ${bin}.${landmark ? ' ' + landmark : ''}`,
      hi: `कृपया शेल्फ़ ${bin} देखें।${landmark ? ' ' + landmark : ''}`,
      kn: `ದಯವಿಟ್ಟು ಶೆಲ್ಫ್ ${bin} ಪರಿಶೀಲಿಸಿ.${landmark ? ' ' + landmark : ''}`,
    }),
    step3CannotConfirm: {
      en: 'I could not confirm where the item is. I am asking your supervisor to help.',
      hi: 'मैं यह पुष्टि नहीं कर सका कि सामान कहाँ है। मैं आपके सुपरवाइज़र से मदद माँग रहा हूँ।',
      kn: 'ವಸ್ತು ಎಲ್ಲಿದೆ ಎಂದು ಖಚಿತಪಡಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ನಾನು ನಿಮ್ಮ ಮೇಲ್ವಿಚಾರಕರ ಸಹಾಯ ಕೇಳುತ್ತಿದ್ದೇನೆ.',
    },
    step3LookingPrompt: {
      en: 'Please check the shelf. What happened?',
      hi: 'कृपया शेल्फ़ की जांच करें। क्या हुआ?',
      kn: 'ದಯವಿಟ್ಟು ಶೆಲ್ಫ್ ಪರಿಶೀಲಿಸಿ. ಏನಾಯಿತು?',
    },

    // Step 4: Ask what happened (4 large high-contrast buttons)
    step4ActionFound: {
      en: 'I found it.',
      hi: 'मिल गया।',
      kn: 'ಸಿಕ್ಕಿದೆ.',
    },
    step4ActionNotFound: {
      en: 'It is not here.',
      hi: 'यहाँ नहीं है।',
      kn: 'ಇಲ್ಲಿಲ್ಲ.',
    },
    step4ActionFewer: {
      en: 'I found fewer items.',
      hi: 'कम सामान मिला।',
      kn: 'ಕಡಿಮೆ ವಸ್ತುಗಳು ಸಿಕ್ಕಿವೆ.',
    },
    step4ActionDamaged: {
      en: 'The item is damaged.',
      hi: 'सामान टूटा या खराब है।',
      kn: 'ವಸ್ತು ಹಾಳಾಗಿದೆ.',
    },
    step4VoiceCommandHint: {
      en: "Tip: Say 'Found it' or 'Still missing', or tap a button below.",
      hi: "सुझाव: 'मिल गया' या 'यहाँ नहीं है' बोलें, या नीचे बटन दबाएं।",
      kn: "ಸಲಹೆ: 'ಸಿಕ್ಕಿದೆ' ಅಥವಾ 'ಇಲ್ಲಿಲ್ಲ' ಎಂದು ಹೇಳಿ, ಅಥವಾ ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿರಿ.",
    },
    voiceStatus: {
      speaking: {
        en: 'Speaking...',
        hi: 'बोल रहा है...',
        kn: 'ಮಾತನಾಡುತ್ತಿದೆ...',
      },
      listening: {
        en: 'Listening... speak now',
        hi: 'सुन रहा है... अब बोलें',
        kn: 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದೆ... ಈಗ ಮಾತನಾಡಿ',
      },
      ready: {
        en: 'Voice Ready',
        hi: 'आवाज़ तैयार है',
        kn: 'ಧ್ವನಿ ಸಿದ್ಧವಾಗಿದೆ',
      },
      replayBtn: {
        en: 'Replay audio',
        hi: 'ऑडियो दोबारा सुनें',
        kn: 'ಆಡಿಯೋ ಮರುಪ್ಲೇ ಮಾಡಿ',
      },
      micDenied: {
        en: 'Microphone access denied. You can tap buttons or type below.',
        hi: 'माइक्रोफ़ोन अनुमति अस्वीकृत। आप नीचे बटन दबा सकते हैं या लिख सकते हैं।',
        kn: 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ನೀವು ಕೆಳಗಿನ ಬಟನ್‌ಗಳನ್ನು ಒತ್ತಬಹುದು.',
      },
    },

    // Step 5: Explain what happens next
    step5ThankYouFound: {
      en: 'Thank you! I have recorded that you found it.',
      hi: 'धन्यवाद! मैंने दर्ज कर लिया है कि आपको सामान मिल गया है।',
      kn: 'ಧನ್ಯವಾದಗಳು! ನಿಮಗೆ ವಸ್ತು ಸಿಕ್ಕಿದೆ ಎಂದು ನಾನು ದಾಖಲಿಸಿದ್ದೇನೆ.',
    },
    step5ThankYouNotFound: {
      en: 'Thank you for checking. I am sending this case to your supervisor.',
      hi: 'जांच करने के लिए धन्यवाद। मैं यह केस आपके सुपरवाइज़र को भेज रहा हूँ।',
      kn: 'ಪರಿಶೀಲಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಾನು ಈ ಪ್ರಕರಣವನ್ನು ನಿಮ್ಮ ಮೇಲ್ವಿಚಾರಕರಿಗೆ ಕಳುಹಿಸುತ್ತಿದ್ದೇನೆ.',
    },
    step5ShortageLogged: (found: number, expected: number): LocalizedString => ({
      en: `Thank you for checking. I have recorded that you found ${found} of ${expected} items and reported the shortage to your supervisor.`,
      hi: `जांच करने के लिए धन्यवाद। मैंने दर्ज कर लिया है कि आपको ${expected} में से ${found} सामान मिला और कमी की जानकारी सुपरवाइज़र को भेज दी है।`,
      kn: `ಪರಿಶೀಲಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನೀವು ${expected} ರಲ್ಲಿ ${found} ವಸ್ತುಗಳನ್ನು ಕಂಡುಕೊಂಡಿದ್ದೀರಿ ಎಂದು ದಾಖಲಿಸಿದ್ದೇನೆ ಮತ್ತು ಕೊರತೆಯನ್ನು ನಿಮ್ಮ ಮೇಲ್ವಿಚಾರಕರಿಗೆ ವರದಿ ಮಾಡಿದ್ದೇನೆ.`,
    }),
    step5DamageLogged: (reason: string): LocalizedString => ({
      en: `Thank you for reporting. I have recorded the damage (${reason}) and sent this case to your supervisor.`,
      hi: `रिपोर्ट करने के लिए धन्यवाद। मैंने क्षति (${reason}) दर्ज कर ली है और यह केस आपके सुपरवाइज़र को भेज दिया है।`,
      kn: `ವರದಿ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಾನು ಹಾನಿಯನ್ನು (${reason}) ದಾಖಲಿಸಿದ್ದೇನೆ ಮತ್ತು ಈ ಪ್ರಕರಣವನ್ನು ನಿಮ್ಮ ಮೇಲ್ವಿಚಾರಕರಿಗೆ ಕಳುಹಿಸಿದ್ದೇನೆ.`,
    }),
    step5UnidentifiedSupervisorHelp: {
      en: 'Thank you. I have notified your supervisor about this missing item.',
      hi: 'धन्यवाद। मैंने आपके सुपरवाइज़र को इस गुम सामान के बारे में सूचित कर दिया है।',
      kn: 'ಧನ್ಯವಾದಗಳು. ಈ ಕಾಣೆಯಾದ ವಸ್ತುವಿನ ಬಗ್ಗೆ ನಾನು ನಿಮ್ಮ ಮೇಲ್ವಿಚಾರಕರಿಗೆ ತಿಳಿಸಿದ್ದೇನೆ.',
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
      en: 'Ask Supervisor for Help',
      hi: 'सुपरवाइज़र से मदद मांगें',
      kn: 'ಮೇಲ್ವಿಚಾರಕರ ಸಹಾಯ ಕೇಳಿ',
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
      en: 'Checking inventory records and recent movement activity…',
      hi: 'इन्वेंटरी रिकॉर्ड और हाल की मूवमेंट गतिविधि की जांच की जा रही है…',
      kn: 'ದಾಸ್ತಾನು ದಾಖಲೆಗಳು ಮತ್ತು ಇತ್ತೀಚಿನ ಚಲನೆಯ ಚಟುವಟಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…',
    },

    recommendationSupported: (
      fromBin: string,
      toBin: string,
      time: string,
      landmark?: string
    ): LocalizedString => ({
      en: `Please check shelf ${toBin}.${landmark ? ' ' + landmark : ''}`,
      hi: `कृपया शेल्फ़ ${toBin} देखें।${landmark ? ' ' + landmark : ''}`,
      kn: `ದಯವಿಟ್ಟು ಶೆಲ್ಫ್ ${toBin} ಪರಿಶೀಲಿಸಿ.${landmark ? ' ' + landmark : ''}`,
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

    recommendationFoundExpected: (bin: string): LocalizedString => ({
      en: `Please check shelf ${bin}. Look carefully around the assigned shelf.`,
      hi: `कृपया शेल्फ़ ${bin} देखें। शेल्फ़ पर ध्यान से खोजें।`,
      kn: `ದಯವಿಟ್ಟು ಶೆಲ್ಫ್ ${bin} ಪರಿಶೀಲಿಸಿ. ನಿಗದಿಪಡಿಸಿದ ಶೆಲ್ಫ್‌ನಲ್ಲಿ ಎಚ್ಚರಿಕೆಯಿಂದ ನೋಡಿ.`,
    }),

    recommendationInsufficient: {
      en: 'I could not confirm where the item is. I am asking your supervisor to help.',
      hi: 'मैं यह पुष्टि नहीं कर सका कि सामान कहाँ है। मैं आपके सुपरवाइज़र से मदद माँग रहा हूँ।',
      kn: 'ವಸ್ತು ಎಲ್ಲಿದೆ ಎಂದು ಖಚಿತಪಡಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ನಾನು ನಿಮ್ಮ ಮೇಲ್ವಿಚಾರಕರ ಸಹಾಯ ಕೇಳುತ್ತಿದ್ದೇನೆ.',
    },

    recommendationConflicting: (
      scannerLoc: string,
      scannerTime: string,
      cameraLoc: string,
      cameraTime: string
    ): LocalizedString => ({
      en: 'I could not confirm where the item is due to conflicting records. I am asking your supervisor to help.',
      hi: 'परस्पर विरोधी रिकॉर्ड के कारण सामान का स्थान तय नहीं हो सका। मैं आपके सुपरवाइज़र से मदद माँग रहा हूँ।',
      kn: 'ವಿರೋಧಾತ್ಮಕ ದಾಖಲೆಗಳ ಕಾರಣ ವಸ್ತು ಎಲ್ಲಿದೆ ಎಂದು ಖಚಿತಪಡಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ನಾನು ನಿಮ್ಮ ಮೇಲ್ವಿಚಾರಕರ ಸಹಾಯ ಕೇಳುತ್ತಿದ್ದೇನೆ.',
    }),

    recommendationStale: (staleLoc: string, hoursOld: number = 28): LocalizedString => ({
      en: `Older records suggest shelf ${staleLoc}. Please check there carefully, or ask your supervisor for help.`,
      hi: `पुराने रिकॉर्ड शेल्फ़ ${staleLoc} सुझाते हैं। कृपया वहाँ ध्यान से देखें या सुपरवाइज़र से मदद लें।`,
      kn: `ಹಳೆಯ ದಾಖಲೆಗಳು ಶೆಲ್ಫ್ ${staleLoc} ಅನ್ನು ಸೂಚಿಸುತ್ತವೆ. ದಯವಿಟ್ಟು ಅಲ್ಲಿ ಎಚ್ಚರಿಕೆಯಿಂದ ಪರಿಶೀಲಿಸಿ.`,
    }),

    recommendationCamera: (
      cameraName: string,
      time: string,
      toBin: string,
      observation: string
    ): LocalizedString => ({
      en: `Please check shelf ${toBin}. Camera records show item moved toward this bay.`,
      hi: `कृपया शेल्फ़ ${toBin} देखें। कैमरा रिकॉर्ड सामान यहाँ जाने का संकेत देते हैं।`,
      kn: `ದಯವಿಟ್ಟು ಶೆಲ್ಫ್ ${toBin} ಪರಿಶೀಲಿಸಿ. ಕ್ಯಾಮೆರಾ ದಾಖಲೆಗಳು ವಸ್ತು ಇಲ್ಲಿಗೆ ಹೋಗಿರುವುದನ್ನು ತೋರಿಸುತ್ತವೆ.`,
    }),

    pickerFound: (loc: string): LocalizedString => ({
      en: `I found the item at ${loc}.`,
      hi: `मुझे ${loc} पर सामान मिल गया।`,
      kn: `ನನಗೆ ${loc} ನಲ್ಲಿ ವಸ್ತು ಸಿಕ್ಕಿದೆ.`,
    }),

    pickerNotFoundRecommended: (loc: string): LocalizedString => ({
      en: `I checked ${loc}, but the item is not there either.`,
      hi: `मैंने ${loc} देखा, लेकिन सामान वहाँ भी नहीं है।`,
      kn: `ನಾನು ${loc} ಪರಿಶೀಲಿಸಿದೆ, ಆದರೆ ವಸ್ತು ಅಲ್ಲಿಯೂ ಇಲ್ಲ.`,
    }),

    pickerReportedLessQty: (found: number, expected: number): LocalizedString => ({
      en: `I only found ${found} of ${expected} units.`,
      hi: `मुझे ${expected} में से केवल ${found} सामान ही मिले।`,
      kn: `ಕೇಳಲಾದ ${expected} ರಲ್ಲಿ ನನಗೆ ${found} ವಸ್ತುಗಳು ಮಾತ್ರ ಸಿಕ್ಕಿವೆ.`,
    }),

    pickerReportedDamaged: (reason: string): LocalizedString => ({
      en: `The item is damaged: ${reason}.`,
      hi: `सामान टूटा या खराब है: ${reason}।`,
      kn: `ವಸ್ತು ಹಾಳಾಗಿದೆ: ${reason}.`,
    }),

    caseResolvedMessage: (loc: string): LocalizedString => ({
      en: 'Thank you! I have recorded that you found it.',
      hi: 'धन्यवाद! मैंने दर्ज कर लिया है कि आपको सामान मिल गया है।',
      kn: 'ಧನ್ಯವಾದಗಳು! ನಿಮಗೆ ವಸ್ತು ಸಿಕ್ಕಿದೆ ಎಂದು ನಾನು ದಾಖಲಿಸಿದ್ದೇನೆ.',
    }),

    caseEscalatedMessage: (reason: string): LocalizedString => ({
      en: 'Thank you for checking. I am sending this case to your supervisor.',
      hi: 'जांच करने के लिए धन्यवाद। मैं यह केस आपके सुपरवाइज़र को भेज रहा हूँ।',
      kn: 'ಪರಿಶೀಲಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಾನು ಈ ಪ್ರಕರಣವನ್ನು ನಿಮ್ಮ ಮೇಲ್ವಿಚಾರಕರಿಗೆ ಕಳುಹಿಸುತ್ತಿದ್ದೇನೆ.',
    }),
  },

  drawers: {
    lessQtyTitle: {
      en: 'How many items did you find?',
      hi: 'आपको कितने सामान मिले?',
      kn: 'ನಿಮಗೆ ಎಷ್ಟು ವಸ್ತುಗಳು ಸಿಕ್ಕಿವೆ?',
    },
    lessQtyPrompt: (expected: number): LocalizedString => ({
      en: `Enter the number of items you found (expected: ${expected}):`,
      hi: `आपको मिले सामान की संख्या लिखें (अपेक्षित: ${expected}):`,
      kn: `ನಿಮಗೆ ಸಿಕ್ಕ ವಸ್ತುಗಳ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ (ನಿರೀಕ್ಷಿತ: ${expected}):`,
    }),
    damageTitle: {
      en: 'What is wrong with the item?',
      hi: 'सामान में क्या खराबी है?',
      kn: 'ವಸ್ತುವಿನಲ್ಲಿ ಏನು ಹಾನಿಯಾಗಿದೆ?',
    },
    damagePrompt: {
      en: 'Select the damage condition:',
      hi: 'क्षति की स्थिति चुनें:',
      kn: 'ಹಾನಿಯ ಸ್ಥಿತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:',
    },
    damageOptions: [
      {
        id: 'BROKEN_GLASS',
        label: {
          en: 'Broken glass / Cracked screen',
          hi: 'टूटा हुआ कांच / स्क्रीन टूटी',
          kn: 'ಒಡೆದ ಗಾಜು / ಬಿರುಕು ಬಿಟ್ಟ ಪರದೆ',
        },
      },
      {
        id: 'CRUSHED_BOX',
        label: {
          en: 'Crushed box / packaging',
          hi: 'दबा हुआ कार्टन / टूटी पैकेजिंग',
          kn: 'ಜಜ್ಜಿದ ಕಾರ್ಟನ್ / ಒಡೆದ ಪ್ಯಾಕಿಂಗ್',
        },
      },
      {
        id: 'WATER_DAMAGE',
        label: {
          en: 'Water / moisture damage',
          hi: 'पानी या नमी से खराब',
          kn: 'ನೀರು ಅಥವಾ ತೇವಾಂಶದಿಂದ ಹಾನಿ',
        },
      },
      {
        id: 'CRACKED_SEAL',
        label: {
          en: 'Broken seal / open package',
          hi: 'टूटी हुई सील / खुला पैकेट',
          kn: 'ಮುರಿದ ಸೀಲ್ / ತೆರೆದ ಪ್ಯಾಕೆಟ್',
        },
      },
    ],
  },
};
