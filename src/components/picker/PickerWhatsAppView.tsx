import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Volume2,
  MapPin,
  Check,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Send,
  X,
  ExternalLink,
  HelpCircle,
  Package,
} from 'lucide-react';
import { FailedPickCase, WorkerVerificationOutcome } from '../../types';
import { DEMO_SCENARIOS, DemoScenario, executeScenarioInvestigation } from './demoScenarios';
import { PICKER_I18N, PickerLang } from './pickerI18n';
import {
  DispatchOrder,
  WAREHOUSE_DISPATCH_ORDERS,
  matchDispatchOrder,
  getOrCreateInvestigationTaskId,
  extractReportedQuantity,
  clearTaskCache,
} from '../../services/dispatch/dispatchService';

interface PickerWhatsAppViewProps {
  cases: FailedPickCase[];
  activeCaseId: string | null;
  onSelectCase: (caseId: string) => void;
  onPickerVerification: (details: {
    caseId: string;
    sku: string;
    itemName: string;
    expectedLocation: string;
    verifiedLocation: string;
    outcome: WorkerVerificationOutcome;
    foundQuantity?: number;
    notes?: string;
  }) => void;
  onResetCase: (caseId: string) => void;
  onSwitchToSupervisor: (caseId?: string) => void;
  onPickerReportInitiated?: (report: {
    caseId?: string;
    sku?: string;
    itemName: string;
    expectedLocation?: string;
    rawText: string;
    isUnidentified?: boolean;
  }) => string;
}

type MessageSender = 'system' | 'picker';

interface ChatBubble {
  id: string;
  sender: MessageSender;
  timestamp: string;
  text: string;
  // Step 2 item confirmation options
  confirmationOptions?: {
    singleOrder?: DispatchOrder;
    multipleOrders?: DispatchOrder[];
    isNoMatch?: boolean;
    rawQuery?: string;
  };
  // Step 3 location recommendation details
  shelfRecommendation?: {
    bin: string;
    landmark?: string;
    isRefusal?: boolean;
  };
}

export const PickerWhatsAppView: React.FC<PickerWhatsAppViewProps> = ({
  cases,
  activeCaseId,
  onSelectCase,
  onPickerVerification,
  onResetCase,
  onSwitchToSupervisor,
  onPickerReportInitiated,
}) => {
  // 1. Language State (English, Hindi, Kannada)
  const [selectedLang, setSelectedLang] = useState<PickerLang>('en');

  // 2. Active Demo Scenario (Simulated Demo Data)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario-1');

  const currentScenario =
    DEMO_SCENARIOS.find((s) => s.id === selectedScenarioId) || DEMO_SCENARIOS[0];

  // 3. Conversational Workflow Step:
  // 'welcome' -> Step 1: Greeting "Which item can you not find?"
  // 'confirming_item' -> Step 2: "Is this the correct item?" or choose from list or no match
  // 'checking_shelf' -> Step 3 & 4: "Please check shelf..." with 4 large verification buttons
  // 'resolved' -> Step 5: "Thank you! I recorded that you found it."
  // 'escalated' -> Step 5: "Thank you for checking. I am sending this case to your supervisor."
  const [step, setStep] = useState<
    'welcome' | 'confirming_item' | 'checking_shelf' | 'resolved' | 'escalated'
  >('welcome');

  // Active investigation & item details
  const [activeItem, setActiveItem] = useState<{
    caseId: string;
    sku: string;
    itemName: string;
    expectedBin: string;
    landmark?: string;
    requiredQty: number;
    recommendedBin: string | null;
    rawReport: string;
    isUnidentified?: boolean;
  } | null>(null);

  // Chat conversation thread
  const [messages, setMessages] = useState<ChatBubble[]>([]);

  // Input text & voice state
  const [inputText, setInputText] = useState<string>('');
  const [isRecordingSpeech, setIsRecordingSpeech] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Audio speech synthesis
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [activeSpeechText, setActiveSpeechText] = useState<string>('');
  const lastSpokenIdRef = useRef<string>('');

  // Modals for Step 4 Follow-up (Fewer items & Damaged items)
  const [showFewerModal, setShowFewerModal] = useState<boolean>(false);
  const [showDamageModal, setShowDamageModal] = useState<boolean>(false);
  const [fewerFoundCount, setFewerFoundCount] = useState<number>(1);
  const [selectedDamageCondition, setSelectedDamageCondition] = useState<string>('Broken glass / Cracked screen');

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimeouts = () => {
    timeoutIdsRef.current.forEach((t) => clearTimeout(t));
    timeoutIdsRef.current = [];
  };

  const getCurrentTime = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  // Scroll to bottom on updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step, showFewerModal, showDamageModal]);

  // Audio speech playback helper
  const handlePlayAudio = (textToPlay?: string, langOverride?: PickerLang) => {
    const text = textToPlay || activeSpeechText;
    if (!text) return;

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 2000);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const lang = langOverride || selectedLang;

      if (lang === 'hi') {
        utterance.lang = 'hi-IN';
      } else if (lang === 'kn') {
        utterance.lang = 'kn-IN';
      } else {
        utterance.lang = 'en-IN';
      }

      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsPlayingAudio(false);
    }
  };

  // Automatic spoken responses for picker workflow (Mandatory Priority 1)
  useEffect(() => {
    if (step === 'welcome' && messages.length === 0) {
      const welcomeText = PICKER_I18N.steps.step1AskMissing[selectedLang];
      setActiveSpeechText(welcomeText);
      const token = `welcome-${selectedLang}`;
      if (lastSpokenIdRef.current !== token) {
        lastSpokenIdRef.current = token;
        handlePlayAudio(welcomeText, selectedLang);
      }
    } else if (messages.length > 0) {
      const lastSys = [...messages].reverse().find((m) => m.sender === 'system');
      if (lastSys && lastSpokenIdRef.current !== lastSys.id) {
        lastSpokenIdRef.current = lastSys.id;
        setActiveSpeechText(lastSys.text);
        handlePlayAudio(lastSys.text, selectedLang);
      }
    }
  }, [messages, step, selectedLang]);

  // Handle language switch with immediate voice greeting in the new language
  const handleSelectLanguage = (newLang: PickerLang) => {
    setSelectedLang(newLang);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    const token = `lang-change-${newLang}-${step}-${Date.now()}`;
    lastSpokenIdRef.current = token;

    let textToSpeak = '';
    if (step === 'welcome') {
      textToSpeak = PICKER_I18N.steps.step1AskMissing[newLang];
    } else if (step === 'confirming_item') {
      textToSpeak = PICKER_I18N.steps.step2MultipleMatches[newLang];
    } else if (step === 'checking_shelf') {
      textToSpeak = PICKER_I18N.steps.step3LookingPrompt[newLang];
    } else if (step === 'resolved') {
      textToSpeak = PICKER_I18N.steps.step5ThankYouFound[newLang];
    } else if (step === 'escalated') {
      textToSpeak = PICKER_I18N.steps.step5ThankYouNotFound[newLang];
    } else {
      textToSpeak = PICKER_I18N.steps.step1AskMissing[newLang];
    }

    setActiveSpeechText(textToSpeak);
    handlePlayAudio(textToSpeak, newLang);
  };

  // =========================================================================
  // RESET WORKFLOW
  // =========================================================================
  const resetWorkflow = () => {
    clearAllTimeouts();
    clearTaskCache();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    setIsPlayingAudio(false);
    setIsRecordingSpeech(false);
    setSpeechError(null);
    setInputText('');
    setShowFewerModal(false);
    setShowDamageModal(false);
    setActiveItem(null);
    setMessages([]);
    setStep('welcome');
    lastSpokenIdRef.current = `reset-${Date.now()}`;
    const welcome = PICKER_I18N.steps.step1AskMissing[selectedLang];
    setActiveSpeechText(welcome);
    handlePlayAudio(welcome, selectedLang);
  };

  const handleSelectScenario = (scenarioId: string) => {
    resetWorkflow();
    setSelectedScenarioId(scenarioId);
    const target = DEMO_SCENARIOS.find((s) => s.id === scenarioId) || DEMO_SCENARIOS[0];
    onSelectCase(target.caseId);
  };

  const handleResetCurrentDemo = () => {
    resetWorkflow();
    onResetCase(currentScenario.caseId);
  };

  // =========================================================================
  // AUDIO & VOICE CAPABILITIES (Recognition & Commands)
  // =========================================================================
  const handleToggleSpeech = () => {
    if (isRecordingSpeech) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsRecordingSpeech(false);
      return;
    }

    if (typeof window === 'undefined') return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;

    if (!SpeechRecognitionClass) {
      setSpeechError(PICKER_I18N.steps.voiceStatus.micDenied[selectedLang]);
      return;
    }

    try {
      setSpeechError(null);
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;

      if (selectedLang === 'hi') {
        recognition.lang = 'hi-IN';
      } else if (selectedLang === 'kn') {
        recognition.lang = 'kn-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => setIsRecordingSpeech(true);
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (!transcript) return;
        const lower = transcript.toLowerCase().trim();

        // Voice Command Recognition in Step 4 (Checking shelf)
        if (step === 'checking_shelf') {
          // Voice Command: Found
          if (
            lower.includes('found') ||
            lower.includes('mil gaya') ||
            lower.includes('mil gya') ||
            lower.includes('sikkide') ||
            lower.includes('ಸಿಕ್ಕಿದೆ') ||
            lower.includes('मिल गया') ||
            lower.includes('got it')
          ) {
            handleVerifyFound();
            try { recognition.stop(); } catch {}
            return;
          }
          // Voice Command: Still missing / Not here
          if (
            lower.includes('not here') ||
            lower.includes('missing') ||
            lower.includes('not found') ||
            lower.includes('nahi mila') ||
            lower.includes('nahin mila') ||
            lower.includes('illilla') ||
            lower.includes('ಇಲ್ಲಿಲ್ಲ') ||
            lower.includes('यहाँ नहीं है')
          ) {
            handleVerifyNotFound();
            try { recognition.stop(); } catch {}
            return;
          }
          // Voice Command: Fewer
          if (
            lower.includes('fewer') ||
            lower.includes('less') ||
            lower.includes('kam') ||
            lower.includes('कम') ||
            lower.includes('kadime') ||
            lower.includes('ಕಡಿಮೆ')
          ) {
            setFewerFoundCount(activeItem ? Math.max(1, Math.floor(activeItem.requiredQty / 2)) : 1);
            setShowFewerModal(true);
            try { recognition.stop(); } catch {}
            return;
          }
          // Voice Command: Damaged
          if (
            lower.includes('damage') ||
            lower.includes('broken') ||
            lower.includes('kharab') ||
            lower.includes('खराब') ||
            lower.includes('टूटा') ||
            lower.includes('halagide') ||
            lower.includes('ಹಾಳಾಗಿದೆ')
          ) {
            setShowDamageModal(true);
            try { recognition.stop(); } catch {}
            return;
          }
        }

        // Voice Input for reporting missing item (Step 1)
        setInputText(transcript);
        if (event.results[0] && event.results[0].isFinal && step === 'welcome') {
          handleSubmitMissingReport(transcript);
        }
      };
      recognition.onerror = (event: any) => {
        setIsRecordingSpeech(false);
        if (event.error === 'not-allowed') {
          setSpeechError(PICKER_I18N.steps.voiceStatus.micDenied[selectedLang]);
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Notice: ${event.error}. Please type or tap buttons.`);
        }
      };
      recognition.onend = () => setIsRecordingSpeech(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecordingSpeech(false);
      setSpeechError(PICKER_I18N.steps.voiceStatus.micDenied[selectedLang]);
    }
  };

  // =========================================================================
  // STEP 1 -> STEP 2: REPORT SUBMISSION & ITEM MATCHING
  // =========================================================================
  const handleSubmitMissingReport = (rawTextToSend?: string) => {
    const rawReport = (rawTextToSend !== undefined && rawTextToSend.trim() !== '' ? rawTextToSend : inputText).trim() ||
      currentScenario.defaultReportPrompt?.[selectedLang] ||
      currentScenario.defaultReportPrompt?.en ||
      'Missing item';

    // Stop recording if active
    if (isRecordingSpeech && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsRecordingSpeech(false);
    }

    // 1. Add user report bubble to chat
    const userBubble: ChatBubble = {
      id: `msg-user-${Date.now()}`,
      sender: 'picker',
      timestamp: getCurrentTime(),
      text: rawReport,
    };

    setMessages([userBubble]);
    setInputText('');

    // 2. Perform safe, grounded item matching
    // Never let preset scenario data override user input unless the user explicitly ran that scenario
    const isExplicitScenario = rawTextToSend === currentScenario.defaultReportPrompt?.[selectedLang] ||
      rawTextToSend === currentScenario.defaultReportPrompt?.en;

    const matchResult = matchDispatchOrder(rawReport, selectedScenarioId, isExplicitScenario);

    // 3. Process match outcome
    if (matchResult.status === 'MATCHED') {
      const order = matchResult.order;
      const assignedCaseId =
        cases.find((c) => c.sku === order.sku)?.id ||
        (onPickerReportInitiated
          ? onPickerReportInitiated({
              sku: order.sku,
              itemName: order.itemName,
              expectedLocation: order.expectedBin,
              rawText: rawReport,
            })
          : `CASE-${order.sku.replace('SKU-', '')}`);

      onSelectCase(assignedCaseId);

      // Transition to Step 2: Confirmation
      const botText = PICKER_I18N.steps.step2ItemFound(order.itemName)[selectedLang];
      const botBubble: ChatBubble = {
        id: `msg-sys-${Date.now()}`,
        sender: 'system',
        timestamp: getCurrentTime(),
        text: botText,
        confirmationOptions: {
          singleOrder: order,
        },
      };

      setStep('confirming_item');
      setMessages((prev) => [...prev, botBubble]);
      setActiveSpeechText(botText);
    } else if (matchResult.status === 'MULTIPLE_MATCHES') {
      // Multiple items match (e.g., 'controller' or 'scanner')
      const botText = PICKER_I18N.steps.step2MultipleMatches[selectedLang];
      const botBubble: ChatBubble = {
        id: `msg-sys-${Date.now()}`,
        sender: 'system',
        timestamp: getCurrentTime(),
        text: botText,
        confirmationOptions: {
          multipleOrders: matchResult.matches,
          rawQuery: rawReport,
        },
      };

      setStep('confirming_item');
      setMessages((prev) => [...prev, botBubble]);
      setActiveSpeechText(botText);
    } else {
      // NO MATCH (e.g. "I cannot find charger")
      // Do NOT invent a product or display Wireless Adapter!
      const botText = PICKER_I18N.steps.step2NoMatch[selectedLang];
      const botBubble: ChatBubble = {
        id: `msg-sys-${Date.now()}`,
        sender: 'system',
        timestamp: getCurrentTime(),
        text: botText,
        confirmationOptions: {
          isNoMatch: true,
          rawQuery: rawReport,
        },
      };

      setStep('confirming_item');
      setMessages((prev) => [...prev, botBubble]);
      setActiveSpeechText(botText);
    }
  };

  // =========================================================================
  // STEP 2: USER CONFIRMS OR CHOOSES ITEM
  // =========================================================================
  const handleConfirmItem = (order: DispatchOrder) => {
    const rawReport = messages.find((m) => m.sender === 'picker')?.text || order.itemName;

    const assignedCaseId =
      cases.find((c) => c.sku === order.sku)?.id ||
      (onPickerReportInitiated
        ? onPickerReportInitiated({
            sku: order.sku,
            itemName: order.itemName,
            expectedLocation: order.expectedBin,
            rawText: rawReport,
          })
        : `CASE-${order.sku.replace('SKU-', '')}`);

    onSelectCase(assignedCaseId);

    // Run evidence engine
    let recommendedBin: string | null = null;
    let isRefusal = false;
    let landmarkText = order.locationDescription || order.landmarkHint;

    if (order.sku === 'SKU-2045') {
      recommendedBin = 'B03';
      landmarkText = 'Near the charging dock aisle, bay B03';
    } else if (order.sku === 'SKU-2101') {
      recommendedBin = order.expectedBin;
      landmarkText = 'Mobile accessories aisle, bay C08';
    } else if (order.sku === 'SKU-2201') {
      recommendedBin = 'A08';
      landmarkText = 'Cable accessories bin A08';
    } else if (order.sku === 'SKU-2301') {
      isRefusal = true;
      recommendedBin = null;
    } else {
      try {
        // Find matching demo scenario or inspect available movement records
        const sc = DEMO_SCENARIOS.find((s) => s.sku === order.sku) || currentScenario;
        const invRes = executeScenarioInvestigation(sc);
        const evalState = invRes.evaluation;

        if (sc.expectedOutcomeType === 'FOUND_EXPECTED') {
          recommendedBin = order.expectedBin;
        } else if (
          sc.expectedOutcomeType === 'INSUFFICIENT' ||
          sc.expectedOutcomeType === 'CONFLICTING' ||
          evalState.confidenceState === 'INSUFFICIENT_EVIDENCE' ||
          evalState.confidenceState === 'CONFLICTING'
        ) {
          isRefusal = true;
          recommendedBin = null;
        } else if (sc.expectedOutcomeType === 'STALE') {
          recommendedBin = 'D04';
        } else if (sc.expectedOutcomeType === 'TIER_2_CAMERA') {
          recommendedBin = 'E14';
        } else {
          recommendedBin = evalState.topCandidate?.location || 'B07';
        }
      } catch {
        recommendedBin = order.expectedBin;
      }
    }

    setActiveItem({
      caseId: assignedCaseId,
      sku: order.sku,
      itemName: order.itemName,
      expectedBin: order.expectedBin,
      landmark: landmarkText,
      requiredQty: order.requiredQuantity,
      recommendedBin,
      rawReport,
    });

    // Add confirmation bubble
    const userConfirmBubble: ChatBubble = {
      id: `msg-user-confirm-${Date.now()}`,
      sender: 'picker',
      timestamp: getCurrentTime(),
      text: PICKER_I18N.steps.step2ConfirmYes[selectedLang],
    };

    // Transition to Step 3: Location Guidance
    let botLocationText = '';
    if (isRefusal || !recommendedBin) {
      botLocationText = PICKER_I18N.steps.step3CannotConfirm[selectedLang];
    } else {
      botLocationText = PICKER_I18N.steps.step3ExplainLocation(recommendedBin, landmarkText)[selectedLang];
    }

    const botLocationBubble: ChatBubble = {
      id: `msg-sys-loc-${Date.now() + 1}`,
      sender: 'system',
      timestamp: getCurrentTime(),
      text: botLocationText,
      shelfRecommendation: {
        bin: recommendedBin || order.expectedBin,
        landmark: landmarkText,
        isRefusal,
      },
    };

    setStep('checking_shelf');
    setMessages((prev) => [...prev, userConfirmBubble, botLocationBubble]);
    setActiveSpeechText(botLocationText);
  };

  const handleRejectItem = () => {
    // Picker says this is not the right item
    const userRejectBubble: ChatBubble = {
      id: `msg-user-reject-${Date.now()}`,
      sender: 'picker',
      timestamp: getCurrentTime(),
      text: PICKER_I18N.steps.step2ConfirmNo[selectedLang],
    };

    const botAskAgain: ChatBubble = {
      id: `msg-sys-ask-${Date.now() + 1}`,
      sender: 'system',
      timestamp: getCurrentTime(),
      text: PICKER_I18N.steps.step1AskMissing[selectedLang],
    };

    setStep('welcome');
    setMessages((prev) => [...prev, userRejectBubble, botAskAgain]);
    setActiveSpeechText(PICKER_I18N.steps.step1AskMissing[selectedLang]);
  };

  const handleAskSupervisorUnidentified = (rawQuery?: string) => {
    const query = rawQuery || messages.find((m) => m.sender === 'picker')?.text || 'Unidentified missing item';

    const userAskBubble: ChatBubble = {
      id: `msg-user-ask-sup-${Date.now()}`,
      sender: 'picker',
      timestamp: getCurrentTime(),
      text: PICKER_I18N.steps.step2AskSupervisor[selectedLang],
    };

    const botConfirmSupervisor: ChatBubble = {
      id: `msg-sys-sup-notif-${Date.now() + 1}`,
      sender: 'system',
      timestamp: getCurrentTime(),
      text: PICKER_I18N.steps.step5UnidentifiedSupervisorHelp[selectedLang],
    };

    setStep('escalated');
    setMessages((prev) => [...prev, userAskBubble, botConfirmSupervisor]);
    setActiveSpeechText(PICKER_I18N.steps.step5UnidentifiedSupervisorHelp[selectedLang]);

    // Create an unidentified item case in supervisor console without inventing a fake product
    let createdCaseId = 'CASE-UNID';
    if (onPickerReportInitiated) {
      createdCaseId = onPickerReportInitiated({
        itemName: query,
        rawText: query,
        isUnidentified: true,
      });
    }

    onPickerVerification({
      caseId: createdCaseId,
      sku: 'UNIDENTIFIED',
      itemName: query,
      expectedLocation: '—',
      verifiedLocation: '—',
      outcome: 'ESCALATE',
      notes: `Picker reported item not found in catalog: "${query}". Requested supervisor assistance.`,
    });
  };

  // =========================================================================
  // STEP 4 -> STEP 5: PHYSICAL VERIFICATION ACTIONS
  // =========================================================================
  const handleVerifyFound = () => {
    if (!activeItem) return;
    const loc = activeItem.recommendedBin || activeItem.expectedBin;

    const userFoundBubble: ChatBubble = {
      id: `msg-user-found-${Date.now()}`,
      sender: 'picker',
      timestamp: getCurrentTime(),
      text: PICKER_I18N.steps.step4ActionFound[selectedLang],
    };

    const botThanks: ChatBubble = {
      id: `msg-sys-thanks-${Date.now() + 1}`,
      sender: 'system',
      timestamp: getCurrentTime(),
      text: PICKER_I18N.steps.step5ThankYouFound[selectedLang],
    };

    setStep('resolved');
    setMessages((prev) => [...prev, userFoundBubble, botThanks]);
    setActiveSpeechText(PICKER_I18N.steps.step5ThankYouFound[selectedLang]);

    onPickerVerification({
      caseId: activeItem.caseId,
      sku: activeItem.sku,
      itemName: activeItem.itemName,
      expectedLocation: activeItem.expectedBin,
      verifiedLocation: loc,
      outcome: 'FOUND',
      foundQuantity: activeItem.requiredQty,
      notes: `Physically checked and verified at shelf ${loc}.`,
    });
  };

  const handleVerifyNotFound = () => {
    if (!activeItem) return;
    const loc = activeItem.recommendedBin || activeItem.expectedBin;

    const userNotFoundBubble: ChatBubble = {
      id: `msg-user-not-found-${Date.now()}`,
      sender: 'picker',
      timestamp: getCurrentTime(),
      text: PICKER_I18N.steps.step4ActionNotFound[selectedLang],
    };

    const botEscalate: ChatBubble = {
      id: `msg-sys-esc-${Date.now() + 1}`,
      sender: 'system',
      timestamp: getCurrentTime(),
      text: PICKER_I18N.steps.step5ThankYouNotFound[selectedLang],
    };

    setStep('escalated');
    setMessages((prev) => [...prev, userNotFoundBubble, botEscalate]);
    setActiveSpeechText(PICKER_I18N.steps.step5ThankYouNotFound[selectedLang]);

    onPickerVerification({
      caseId: activeItem.caseId,
      sku: activeItem.sku,
      itemName: activeItem.itemName,
      expectedLocation: activeItem.expectedBin,
      verifiedLocation: loc,
      outcome: 'NOT_FOUND',
      notes: `Checked shelf ${loc}; item is absent. Escalated to supervisor for audit.`,
    });
  };

  const handleConfirmFewer = () => {
    if (!activeItem) return;
    setShowFewerModal(false);
    const loc = activeItem.recommendedBin || activeItem.expectedBin;

    const userBubble: ChatBubble = {
      id: `msg-user-fewer-${Date.now()}`,
      sender: 'picker',
      timestamp: getCurrentTime(),
      text: `${PICKER_I18N.steps.step4ActionFewer[selectedLang]} (${fewerFoundCount} of ${activeItem.requiredQty})`,
    };

    const botResponseText = PICKER_I18N.steps.step5ShortageLogged(
      fewerFoundCount,
      activeItem.requiredQty
    )[selectedLang];

    const botBubble: ChatBubble = {
      id: `msg-sys-shortage-${Date.now() + 1}`,
      sender: 'system',
      timestamp: getCurrentTime(),
      text: botResponseText,
    };

    setStep('escalated');
    setMessages((prev) => [...prev, userBubble, botBubble]);
    setActiveSpeechText(botResponseText);

    onPickerVerification({
      caseId: activeItem.caseId,
      sku: activeItem.sku,
      itemName: activeItem.itemName,
      expectedLocation: activeItem.expectedBin,
      verifiedLocation: loc,
      outcome: 'PARTIALLY_FOUND',
      foundQuantity: fewerFoundCount,
      notes: `Found ${fewerFoundCount} of ${activeItem.requiredQty} units at ${loc}. Shortage logged for supervisor review.`,
    });
  };

  const handleConfirmDamage = () => {
    if (!activeItem) return;
    setShowDamageModal(false);
    const loc = activeItem.recommendedBin || activeItem.expectedBin;

    const userBubble: ChatBubble = {
      id: `msg-user-dmg-${Date.now()}`,
      sender: 'picker',
      timestamp: getCurrentTime(),
      text: `${PICKER_I18N.steps.step4ActionDamaged[selectedLang]}: ${selectedDamageCondition}`,
    };

    const botResponseText = PICKER_I18N.steps.step5DamageLogged(selectedDamageCondition)[selectedLang];

    const botBubble: ChatBubble = {
      id: `msg-sys-dmg-rec-${Date.now() + 1}`,
      sender: 'system',
      timestamp: getCurrentTime(),
      text: botResponseText,
    };

    setStep('escalated');
    setMessages((prev) => [...prev, userBubble, botBubble]);
    setActiveSpeechText(botResponseText);

    onPickerVerification({
      caseId: activeItem.caseId,
      sku: activeItem.sku,
      itemName: activeItem.itemName,
      expectedLocation: activeItem.expectedBin,
      verifiedLocation: loc,
      outcome: 'DAMAGED',
      notes: `Damaged stock: ${selectedDamageCondition}. Logged at shelf ${loc} for supervisor inspection.`,
    });
  };

  return (
    <div className="w-full flex flex-col items-center justify-start pb-12 px-2 sm:px-4">
      {/* =================================================================== */}
      {/* 1. DEMO SCENARIOS BAR (Clearly Marked Simulated Demo Data) */}
      {/* =================================================================== */}
      <div className="w-full max-w-md mb-2 bg-white rounded-xl border border-slate-200 p-2 shadow-2xs space-y-1.5">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-800 text-[11px]">
              {PICKER_I18N.header.demoSelectorLabel[selectedLang]}
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono border border-slate-200">
              {PICKER_I18N.header.simulatedBadge[selectedLang]}
            </span>
          </div>

          <button
            id="picker-btn-reset-demo"
            onClick={handleResetCurrentDemo}
            className="text-slate-500 hover:text-slate-900 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
            title="Reset active scenario demo"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>{PICKER_I18N.verificationButtons.reset[selectedLang]}</span>
          </button>
        </div>

        {/* 8 Clickable Scenario Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
          {DEMO_SCENARIOS.map((sc) => {
            const isSelected = sc.id === selectedScenarioId;
            return (
              <button
                key={sc.id}
                id={`demo-scenario-btn-${sc.scenarioNumber}`}
                onClick={() => handleSelectScenario(sc.id)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-tight transition-all cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title={sc.title}
              >
                <span>{sc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. SIMPLE WHATSAPP-STYLE CONVERSATION CONTAINER */}
      {/* =================================================================== */}
      <div
        id="picker-mobile-container"
        className="w-full max-w-[420px] bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col min-h-[520px]"
      >
        {/* WhatsApp-Style Clean Header */}
        <div className="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-600 border border-emerald-400/40 flex items-center justify-center font-bold text-xs text-white">
              ST
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide">
                {PICKER_I18N.header.terminalTitle[selectedLang]}
              </div>
              <div className="text-[11px] text-emerald-200">
                {activeItem ? activeItem.itemName : 'Warehouse Floor Assistant'}
              </div>
            </div>
          </div>

          {/* Audio Speaker & Status Pill */}
          <div className="flex items-center space-x-1.5">
            {isPlayingAudio && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-[10px] font-semibold animate-pulse border border-emerald-400/30">
                <Volume2 className="w-3 h-3 text-emerald-200" />
                <span>{PICKER_I18N.steps.voiceStatus.speaking[selectedLang]}</span>
              </span>
            )}
            {isRecordingSpeech && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-100 text-[10px] font-semibold animate-pulse border border-rose-400/30">
                <Mic className="w-3 h-3 text-rose-200" />
                <span>{PICKER_I18N.steps.voiceStatus.listening[selectedLang]}</span>
              </span>
            )}
            {!isPlayingAudio && !isRecordingSpeech && (
              <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-200 text-[10px] font-medium border border-emerald-700/50">
                <span>{PICKER_I18N.steps.voiceStatus.ready[selectedLang]}</span>
              </span>
            )}
            <button
              id="picker-btn-play-voice"
              onClick={() => handlePlayAudio()}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isPlayingAudio ? 'bg-emerald-600 text-white animate-pulse' : 'bg-emerald-700/60 hover:bg-emerald-700 text-emerald-100'
              }`}
              title={PICKER_I18N.steps.voiceStatus.replayBtn[selectedLang]}
              aria-label={PICKER_I18N.steps.voiceStatus.replayBtn[selectedLang]}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Language Strip (English, Hindi, Kannada) */}
        <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600 text-[11px] font-medium">Language:</span>
          <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5 shadow-2xs">
            <button
              id="picker-lang-en"
              onClick={() => handleSelectLanguage('en')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                selectedLang === 'en'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              id="picker-lang-hi"
              onClick={() => handleSelectLanguage('hi')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                selectedLang === 'hi'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिंदी
            </button>
            <button
              id="picker-lang-kn"
              onClick={() => handleSelectLanguage('kn')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                selectedLang === 'kn'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ಕನ್ನಡ
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. STEP 1: WELCOME SCREEN (NO JARGON / NO PREASSIGNED SKU) */}
        {/* ================================================================= */}
        {step === 'welcome' && (
          <div className="p-4 sm:p-5 space-y-4 bg-white flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Friendly Opening Message */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    ✓
                  </div>
                  <span>StockTrace</span>
                </div>
                <p
                  id="picker-opening-message"
                  className="text-sm font-semibold text-slate-900 leading-relaxed"
                >
                  {PICKER_I18N.steps.step1AskMissing[selectedLang]}
                </p>
              </div>

              {/* Big "Report a Missing Item" Primary Button */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <button
                    id="picker-btn-report-missing"
                    onClick={() => handleSubmitMissingReport(inputText)}
                    className="flex-1 min-h-[52px] rounded-xl text-sm font-bold flex items-center justify-center space-x-2.5 shadow-md cursor-pointer transition-all active:scale-[0.99] bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-100" />
                    <span>{PICKER_I18N.welcome.reportMissingBtn[selectedLang]}</span>
                  </button>

                  <button
                    id="picker-btn-voice-toggle"
                    onClick={handleToggleSpeech}
                    aria-label="Toggle voice input"
                    className={`h-[52px] px-3.5 rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                      isRecordingSpeech
                        ? 'bg-rose-700 text-white border-rose-800 ring-2 ring-rose-300 animate-pulse'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
                    }`}
                    title={isRecordingSpeech ? 'Stop microphone' : 'Speak report'}
                  >
                    <Mic className={`w-5 h-5 ${isRecordingSpeech ? 'text-white animate-bounce' : 'text-slate-600'}`} />
                  </button>
                </div>

                {speechError && (
                  <div className="text-[11px] text-rose-600 text-center font-medium bg-rose-50 border border-rose-200 rounded-lg p-2">
                    {speechError}
                  </div>
                )}
              </div>

              {/* Simple Text Input */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center space-x-2">
                  <input
                    id="picker-report-input"
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && inputText.trim()) {
                        handleSubmitMissingReport(inputText);
                      }
                    }}
                    placeholder={PICKER_I18N.steps.step1InputPlaceholder[selectedLang]}
                    className="flex-1 text-xs p-3 rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-slate-900 font-medium bg-slate-50 shadow-2xs"
                  />
                  <button
                    id="picker-btn-send-report"
                    onClick={() => handleSubmitMissingReport(inputText)}
                    disabled={!inputText.trim()}
                    className="h-11 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1 cursor-pointer shrink-0 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{PICKER_I18N.steps.step1Send[selectedLang]}</span>
                  </button>
                </div>
              </div>

              {/* Quick Report Suggestions */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {PICKER_I18N.welcome.quickExamplesLabel[selectedLang]}
                </span>
                <div className="flex flex-col gap-1.5">
                  {currentScenario.defaultReportPrompt && (
                    <button
                      id="picker-quick-scenario-prompt"
                      onClick={() => {
                        const prompt =
                          currentScenario.defaultReportPrompt?.[selectedLang] ||
                          currentScenario.defaultReportPrompt?.en ||
                          'Missing item';
                        setInputText(prompt);
                        handleSubmitMissingReport(prompt);
                      }}
                      className="text-[11px] text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg p-2 text-left transition-colors cursor-pointer flex items-center justify-between font-medium"
                    >
                      <span>
                        {currentScenario.defaultReportPrompt?.[selectedLang] ||
                          currentScenario.defaultReportPrompt?.en}
                      </span>
                      <Send className="w-3 h-3 text-emerald-600 shrink-0 ml-2" />
                    </button>
                  )}
                  {PICKER_I18N.welcome.examples.slice(0, 3).map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => {
                        setInputText(ex.text[selectedLang]);
                        handleSubmitMissingReport(ex.text[selectedLang]);
                      }}
                      className="text-[11px] text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-2 text-left transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>{ex.text[selectedLang]}</span>
                      <Send className="w-3 h-3 text-slate-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <span className="text-[11px] text-slate-400">
                StockTrace recommends. Humans verify.
              </span>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 4. CONVERSATIONAL STREAM (Steps 2, 3, 4, 5) */}
        {/* ================================================================= */}
        {step !== 'welcome' && (
          <div className="flex-1 flex flex-col justify-between bg-slate-50/50">
            {/* Scrollable Chat History */}
            <div
              id="picker-chat-history"
              className="p-3 sm:p-4 space-y-3 overflow-y-auto max-h-[380px]"
            >
              {messages.map((msg) => {
                const isSystem = msg.sender === 'system';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSystem ? 'items-start' : 'items-end'} space-y-1`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs shadow-2xs ${
                        isSystem
                          ? 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                          : 'bg-emerald-600 text-white rounded-tr-xs font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between space-x-2 mb-1 text-[10px] opacity-70">
                        <span className="font-semibold">
                          {isSystem ? 'StockTrace' : 'You'}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {isSystem && (
                            <button
                              onClick={() => handlePlayAudio(msg.text)}
                              className="p-0.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              title={PICKER_I18N.steps.voiceStatus.replayBtn[selectedLang]}
                              aria-label={PICKER_I18N.steps.voiceStatus.replayBtn[selectedLang]}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span>{msg.timestamp}</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm font-medium leading-relaxed">
                        {msg.text}
                      </p>

                      {/* STEP 2 INTERACTIVE CONFIRMATION BUTTONS */}
                      {msg.confirmationOptions?.singleOrder && step === 'confirming_item' && (
                        <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
                          <button
                            id="picker-btn-confirm-item-yes"
                            onClick={() => handleConfirmItem(msg.confirmationOptions!.singleOrder!)}
                            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
                          >
                            <Check className="w-4 h-4" />
                            <span>{PICKER_I18N.steps.step2ConfirmYes[selectedLang]}</span>
                          </button>

                          <button
                            id="picker-btn-confirm-item-no"
                            onClick={handleRejectItem}
                            className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-semibold text-xs cursor-pointer active:scale-[0.99] transition-all"
                          >
                            <span>{PICKER_I18N.steps.step2ConfirmNo[selectedLang]}</span>
                          </button>
                        </div>
                      )}

                      {/* STEP 2 MULTIPLE MATCHES CHOICES */}
                      {msg.confirmationOptions?.multipleOrders && step === 'confirming_item' && (
                        <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
                          {msg.confirmationOptions.multipleOrders.map((ord) => (
                            <button
                              key={ord.sku}
                              onClick={() => handleConfirmItem(ord)}
                              className="w-full p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
                            >
                              <span>{ord.itemName}</span>
                              <span className="text-[10px] font-mono text-emerald-700">Shelf {ord.expectedBin}</span>
                            </button>
                          ))}
                          <button
                            onClick={handleRejectItem}
                            className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-semibold text-xs cursor-pointer active:scale-[0.99] transition-all"
                          >
                            <span>{PICKER_I18N.steps.step2TryAgain[selectedLang]}</span>
                          </button>
                        </div>
                      )}

                      {/* STEP 2 NO MATCH CHOICES */}
                      {msg.confirmationOptions?.isNoMatch && step === 'confirming_item' && (
                        <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
                          <button
                            id="picker-btn-try-another-item"
                            onClick={resetWorkflow}
                            className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
                          >
                            <span>{PICKER_I18N.steps.step2TryAgain[selectedLang]}</span>
                          </button>

                          <button
                            id="picker-btn-ask-supervisor-unidentified"
                            onClick={() => handleAskSupervisorUnidentified(msg.confirmationOptions?.rawQuery)}
                            className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
                          >
                            <span>{PICKER_I18N.steps.step2AskSupervisor[selectedLang]}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* ============================================================= */}
            {/* STEP 4: 4 LARGE HIGH-CONTRAST VERIFICATION BUTTONS */}
            {/* (Only visible when Step 3 is completed & checking shelf) */}
            {/* ============================================================= */}
            {step === 'checking_shelf' && (
              <div className="p-3 bg-white border-t border-slate-200 space-y-2.5 shadow-lg">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide text-center">
                  {PICKER_I18N.steps.step3LookingPrompt[selectedLang]}
                </div>

                {/* Voice command guidance & Mic trigger */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-950 shadow-2xs">
                  <div className="flex items-center space-x-2 truncate">
                    <Volume2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-[11px] font-medium truncate">
                      {PICKER_I18N.steps.step4VoiceCommandHint[selectedLang]}
                    </span>
                  </div>
                  <button
                    id="picker-btn-voice-command-step4"
                    onClick={handleToggleSpeech}
                    className={`ml-2 px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer shrink-0 transition-all ${
                      isRecordingSpeech
                        ? 'bg-rose-600 text-white animate-pulse shadow-xs'
                        : 'bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 shadow-2xs'
                    }`}
                    title={isRecordingSpeech ? 'Listening...' : 'Click to speak answer'}
                  >
                    <Mic className={`w-3.5 h-3.5 ${isRecordingSpeech ? 'text-white' : 'text-emerald-700'}`} />
                    <span>{isRecordingSpeech ? 'Listening' : 'Speak'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Button 1: I found it. */}
                  <button
                    id="picker-btn-found-here"
                    onClick={handleVerifyFound}
                    className="py-3 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-md active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{PICKER_I18N.steps.step4ActionFound[selectedLang]}</span>
                  </button>

                  {/* Button 2: It is not here. */}
                  <button
                    id="picker-btn-still-not-found"
                    onClick={handleVerifyNotFound}
                    className="py-3 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-md active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>{PICKER_I18N.steps.step4ActionNotFound[selectedLang]}</span>
                  </button>

                  {/* Button 3: I found fewer items. */}
                  <button
                    id="picker-btn-less-qty"
                    onClick={() => {
                      setFewerFoundCount(activeItem ? Math.max(1, Math.floor(activeItem.requiredQty / 2)) : 1);
                      setShowFewerModal(true);
                    }}
                    className="py-2.5 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>{PICKER_I18N.steps.step4ActionFewer[selectedLang]}</span>
                  </button>

                  {/* Button 4: The item is damaged. */}
                  <button
                    id="picker-btn-damaged"
                    onClick={() => setShowDamageModal(true)}
                    className="py-2.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <span>{PICKER_I18N.steps.step4ActionDamaged[selectedLang]}</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: OUTCOME RECORDED ACTIONS */}
            {(step === 'resolved' || step === 'escalated') && (
              <div className="p-3 bg-white border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <button
                    id="picker-btn-report-another"
                    onClick={resetWorkflow}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer text-center mr-2 shadow-xs"
                  >
                    Report Another Item
                  </button>

                  <button
                    id="picker-btn-switch-supervisor"
                    onClick={() => onSwitchToSupervisor(activeItem?.caseId)}
                    className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-semibold cursor-pointer text-xs flex items-center space-x-1"
                  >
                    <span>Supervisor View</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 5. MODAL: FEWER ITEMS COUNT (Step 4 Follow-up) */}
      {/* =================================================================== */}
      {showFewerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                {PICKER_I18N.drawers.lessQtyTitle[selectedLang]}
              </h3>
              <button
                onClick={() => setShowFewerModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {PICKER_I18N.drawers.lessQtyPrompt(activeItem?.requiredQty || 10)[selectedLang]}
            </p>

            <div className="flex items-center justify-center space-x-3 py-2">
              <button
                onClick={() => setFewerFoundCount((prev) => Math.max(1, prev - 1))}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-lg cursor-pointer"
              >
                -
              </button>
              <span className="font-mono text-2xl font-black text-slate-900 w-12 text-center">
                {fewerFoundCount}
              </span>
              <button
                onClick={() =>
                  setFewerFoundCount((prev) =>
                    Math.min((activeItem?.requiredQty || 10) - 1, prev + 1)
                  )
                }
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-lg cursor-pointer"
              >
                +
              </button>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setShowFewerModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="picker-btn-confirm-fewer"
                onClick={handleConfirmFewer}
                className="flex-1 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Confirm {fewerFoundCount} Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 6. MODAL: DAMAGED ITEM (Step 4 Follow-up) */}
      {/* =================================================================== */}
      {showDamageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                {PICKER_I18N.drawers.damageTitle[selectedLang]}
              </h3>
              <button
                onClick={() => setShowDamageModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {PICKER_I18N.drawers.damagePrompt[selectedLang]}
            </p>

            <div className="space-y-1.5">
              {PICKER_I18N.drawers.damageOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedDamageCondition(opt.label[selectedLang])}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    selectedDamageCondition === opt.label[selectedLang]
                      ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-2xs font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label[selectedLang]}</span>
                  {selectedDamageCondition === opt.label[selectedLang] && (
                    <Check className="w-4 h-4 text-amber-700" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setShowDamageModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="picker-btn-confirm-damage"
                onClick={handleConfirmDamage}
                className="flex-1 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Report Damaged Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
