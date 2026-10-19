import { RawScannerInput, RawCameraInput } from '../../harness';
import { SCANNER_TRANSACTIONS } from '../../data/mockData';

export interface DispatchOrder {
  orderId: string;
  sku: string;
  itemName: string;
  category?: string;
  requiredQuantity: number;
  expectedBin: string;
  locationDescription: string;
  destinationTote: string;
  itemValue: number;
  scenarioId?: string;
  landmarkHint?: string;
  keywords?: string[];
  isUnidentified?: boolean;
}

export type MatchStatus = 'MATCHED' | 'MULTIPLE_MATCHES' | 'NO_MATCH';

export interface MatchedDispatchResult {
  status: MatchStatus;
  order: DispatchOrder;
  matches: DispatchOrder[];
  confidence: 'HIGH' | 'SCENARIO_CONTEXT' | 'AMBIGUOUS' | 'NONE';
  matchedReason: string;
  reportedQuantity?: number;
  quantityDiscrepancy?: number;
  isDamagedReported?: boolean;
  unidentifiedQuery?: string;
}

export const UNIDENTIFIED_DISPATCH_ORDER: DispatchOrder = {
  orderId: 'ORD-UNIDENTIFIED',
  sku: 'UNIDENTIFIED',
  itemName: 'Unidentified Item',
  requiredQuantity: 1,
  expectedBin: '—',
  locationDescription: 'Location unconfirmed',
  destinationTote: '—',
  itemValue: 0,
  isUnidentified: true,
};

export const WAREHOUSE_DISPATCH_ORDERS: DispatchOrder[] = [
  // --- REALISTIC COMMON WAREHOUSE PRODUCTS (Priority 3) ---
  {
    orderId: 'ORD-88210',
    sku: 'SKU-2045',
    itemName: 'Fast USB-C Phone Charger 65W',
    category: 'Phone Chargers',
    requiredQuantity: 4,
    expectedBin: 'A15',
    locationDescription: 'Near the charging dock aisle, bay A15',
    destinationTote: 'TOTE-22',
    itemValue: 1250,
    landmarkHint: 'Near the charging dock aisle, bay A15',
    keywords: ['fast charger', 'phone charger', 'usb-c charger', '65w charger', 'wall charger', 'charger', 'फास्ट चार्जर', 'फोन चार्जर', 'चार्जर', 'ಫೋನ್ ಚಾರ್ಜರ್', 'ಚಾರ್ಜರ್'],
  },
  {
    orderId: 'ORD-88211',
    sku: 'SKU-2046',
    itemName: 'Multi-Port USB Travel Charger 30W',
    category: 'Phone Chargers',
    requiredQuantity: 2,
    expectedBin: 'A18',
    locationDescription: 'Mobile accessories rack A18',
    destinationTote: 'TOTE-25',
    itemValue: 850,
    landmarkHint: 'Mobile accessories rack A18',
    keywords: ['travel charger', 'multi-port charger', 'usb charger', '30w charger', 'phone charger', 'mobile charger', 'charger', 'चार्जर', 'ಚಾರ್ಜರ್'],
  },
  {
    orderId: 'ORD-88215',
    sku: 'SKU-2101',
    itemName: 'Shockproof Silicone Phone Cover (Clear)',
    category: 'Phone Covers',
    requiredQuantity: 5,
    expectedBin: 'C08',
    locationDescription: 'Mobile accessories aisle, bay C08',
    destinationTote: 'TOTE-40',
    itemValue: 450,
    landmarkHint: 'Mobile accessories aisle, bay C08',
    keywords: ['phone cover', 'silicone cover', 'clear cover', 'phone case', 'cover', 'case', 'फोन कवर', 'कवर', 'ಫೋನ್ ಕವರ್', 'ಕವರ್'],
  },
  {
    orderId: 'ORD-88216',
    sku: 'SKU-2102',
    itemName: 'Heavy-Duty Armor Protective Phone Cover (Black)',
    category: 'Phone Covers',
    requiredQuantity: 3,
    expectedBin: 'C09',
    locationDescription: 'Mobile accessories aisle, bay C09',
    destinationTote: 'TOTE-41',
    itemValue: 650,
    landmarkHint: 'Mobile accessories aisle, bay C09',
    keywords: ['phone cover', 'armor cover', 'protective cover', 'phone case', 'cover', 'case', 'फोन कवर', 'कवर', 'ಫೋನ್ ಕವರ್'],
  },
  {
    orderId: 'ORD-88225',
    sku: 'SKU-2201',
    itemName: 'Braided Fast-Charging USB-C Cable (2m)',
    category: 'USB Cables',
    requiredQuantity: 6,
    expectedBin: 'B09',
    locationDescription: 'Cable accessories bin B09',
    destinationTote: 'TOTE-18',
    itemValue: 350,
    landmarkHint: 'Cable accessories bin B09',
    keywords: ['usb cable', 'charging cable', 'usb-c cable', 'braided cable', 'cable', 'यूएसबी केबल', 'केबल', 'ಯುಎಸ್‌ಬಿ ಕೇಬಲ್', 'ಕೇಬಲ್'],
  },
  {
    orderId: 'ORD-88226',
    sku: 'SKU-2202',
    itemName: 'Lightning to USB-A Charging Cable (1m)',
    category: 'USB Cables',
    requiredQuantity: 4,
    expectedBin: 'B10',
    locationDescription: 'Cable accessories bin B10',
    destinationTote: 'TOTE-21',
    itemValue: 400,
    landmarkHint: 'Cable accessories bin B10',
    keywords: ['lightning cable', 'apple cable', 'usb cable', 'charging cable', 'केबल', 'ಕೇಬಲ್'],
  },
  {
    orderId: 'ORD-88230',
    sku: 'SKU-2301',
    itemName: 'Wireless Bluetooth Noise-Cancelling Earphones',
    category: 'Earphones',
    requiredQuantity: 2,
    expectedBin: 'D02',
    locationDescription: 'High-value consumer audio rack D02',
    destinationTote: 'TOTE-31',
    itemValue: 3500,
    landmarkHint: 'High-value consumer audio rack D02',
    keywords: ['earphones', 'wireless earphones', 'bluetooth earphones', 'earbuds', 'इयरफ़ोन', 'ಇಯರ್‌ಫೋನ್'],
  },
  {
    orderId: 'ORD-88231',
    sku: 'SKU-2302',
    itemName: 'In-Ear Wired USB-C Earbuds with Mic',
    category: 'Earphones',
    requiredQuantity: 5,
    expectedBin: 'D03',
    locationDescription: 'Consumer audio rack D03',
    destinationTote: 'TOTE-32',
    itemValue: 950,
    landmarkHint: 'Consumer audio rack D03',
    keywords: ['earbuds', 'wired earbuds', 'wired earphones', 'earphones', 'इयरफ़ोन', 'ಇಯರ್‌ಫೋನ್'],
  },
  // --- EXISTING CORE WAREHOUSE INVENTORY ---
  {
    orderId: 'ORD-88201',
    sku: 'SKU-1042',
    itemName: 'Wireless Adapter Dual-Band',
    category: 'Wireless Adapters',
    requiredQuantity: 5,
    expectedBin: 'A12',
    locationDescription: 'Near the blue rack, bottom shelf (Level 1)',
    destinationTote: 'TOTE-44',
    itemValue: 1850,
    scenarioId: 'scenario-1',
    landmarkHint: 'Near the blue rack, bottom shelf (Level 1)',
    keywords: ['wireless', 'adapter', 'dual-band', 'wifi', 'वायरलेस', 'अडैप्टर', 'ವೈರ್ಲೆಸ್', 'ಅಡಾಪ್ಟರ್'],
  },
  {
    orderId: 'ORD-88201',
    sku: 'SKU-1042',
    itemName: 'Wireless Adapter Dual-Band',
    category: 'Wireless Adapters',
    requiredQuantity: 5,
    expectedBin: 'A12',
    locationDescription: 'Near the blue rack, bottom shelf (Level 1)',
    destinationTote: 'TOTE-44',
    itemValue: 1850,
    scenarioId: 'scenario-2',
    landmarkHint: 'Near the blue rack, bottom shelf (Level 1)',
    keywords: ['wireless', 'adapter', 'dual-band', 'wifi', 'वायरलेस', 'अडैप्टर', 'ವೈರ್ಲೆಸ್', 'ಅಡಾಪ್ಟರ್'],
  },
  {
    orderId: 'ORD-88204',
    sku: 'SKU-2081',
    itemName: 'Powered 7-Port USB Hub',
    category: 'USB Hubs',
    requiredQuantity: 10,
    expectedBin: 'B07',
    locationDescription: 'Near yellow staging buffer zone',
    destinationTote: 'TOTE-19',
    itemValue: 850,
    scenarioId: 'scenario-3',
    landmarkHint: 'Near yellow staging buffer zone',
    keywords: ['usb hub', '7-port', 'usb', 'powered hub', 'यूएसबी', 'हब', 'ಯುಎಸ್‌ಬಿ'],
  },
  {
    orderId: 'ORD-88209',
    sku: 'SKU-3015',
    itemName: 'Mechanical Gaming Keyboard RGB',
    requiredQuantity: 8,
    expectedBin: 'C03',
    locationDescription: 'Near main packing conveyor belt',
    destinationTote: 'TOTE-33',
    itemValue: 2400,
    scenarioId: 'scenario-4',
    landmarkHint: 'Near main packing conveyor belt',
    keywords: ['keyboard', 'gaming keyboard', 'mechanical', 'rgb', 'कीबोर्ड', 'ಕೀಬೋರ್ಡ್'],
  },
  {
    orderId: 'ORD-88220',
    sku: 'SKU-4099',
    itemName: 'Enterprise NVMe RAID Controller',
    requiredQuantity: 2,
    expectedBin: 'D14',
    locationDescription: 'Secure high-value cage, bay E02, Level 2',
    destinationTote: 'TOTE-88',
    itemValue: 12500,
    landmarkHint: 'Secure high-value cage, bay E02, Level 2',
    keywords: ['raid', 'raid controller', 'nvme', 'enterprise controller', 'controller'],
  },
  {
    orderId: 'ORD-88235',
    sku: 'SKU-5012',
    itemName: 'Barcode Scanner Li-Ion Battery Pack',
    requiredQuantity: 6,
    expectedBin: 'C18',
    locationDescription: 'Near charging dock aisle, bay D04',
    destinationTote: 'TOTE-55',
    itemValue: 950,
    scenarioId: 'scenario-5',
    landmarkHint: 'Near charging dock aisle, bay D04',
    keywords: ['battery pack', 'li-ion', 'scanner battery', 'battery', 'बैटरी', 'ಬ್ಯಾಟರಿ'],
  },
  {
    orderId: 'ORD-88241',
    sku: 'SKU-6023',
    itemName: 'Heavy-Duty Swivel Caster Wheel',
    requiredQuantity: 4,
    expectedBin: 'F04',
    locationDescription: 'Near heavy goods forklift corridor, bay F09',
    destinationTote: 'TOTE-12',
    itemValue: 1100,
    landmarkHint: 'Near heavy goods forklift corridor, bay F09',
    keywords: ['caster', 'wheel', 'swivel caster', 'heavy-duty wheel', 'पहिया', 'ಚಕ್ರ'],
  },
  {
    orderId: 'ORD-88250',
    sku: 'SKU-7011',
    itemName: 'Industrial Touchscreen HMI Panel',
    requiredQuantity: 1,
    expectedBin: 'E05',
    locationDescription: 'Special equipment cabinet, bay E05',
    destinationTote: 'TOTE-02',
    itemValue: 8900,
    scenarioId: 'scenario-7',
    landmarkHint: 'Special equipment cabinet, bay E05',
    keywords: ['touchscreen', 'hmi', 'hmi panel', 'panel', 'टचस्क्रीन', 'स्क्रीन', 'ಪ್ಯಾನೆಲ್'],
  },
  {
    orderId: 'ORD-88265',
    sku: 'SKU-8055',
    itemName: '2D Wireless Rugged Barcode Reader',
    requiredQuantity: 3,
    expectedBin: 'A04',
    locationDescription: 'Upper shelf, bay A04',
    destinationTote: 'TOTE-71',
    itemValue: 3200,
    landmarkHint: 'Upper shelf, bay A04',
    keywords: ['barcode reader', '2d reader', 'rugged reader', 'scanner gun', 'बारकोड स्कैनर'],
  },
  {
    orderId: 'ORD-88277',
    sku: 'SKU-9014',
    itemName: 'Industrial Shielded Cable Harness',
    requiredQuantity: 10,
    expectedBin: 'B11',
    locationDescription: 'Near cable spool carousel B11',
    destinationTote: 'TOTE-29',
    itemValue: 450,
    scenarioId: 'scenario-6',
    landmarkHint: 'Near cable spool carousel B11',
    keywords: ['cable', 'harness', 'cable harness', 'shielded cable', 'केबल', 'ಕೇಬಲ್'],
  },
  {
    orderId: 'ORD-88288',
    sku: 'SKU-9520',
    itemName: 'Thermal Transfer Label Rolls (Box of 12)',
    requiredQuantity: 4,
    expectedBin: 'D08',
    locationDescription: 'Label storage rack D08',
    destinationTote: 'TOTE-90',
    itemValue: 750,
    landmarkHint: 'Label storage rack D08',
    keywords: ['label rolls', 'thermal transfer label', 'label roll', 'rolls', 'लेबल'],
  },
  {
    orderId: 'ORD-88295',
    sku: 'SKU-9800',
    itemName: 'Programmable Logic Controller (PLC) Module',
    requiredQuantity: 1,
    expectedBin: 'E10',
    locationDescription: 'Automation engineering bay E14, locked cage',
    destinationTote: 'TOTE-04',
    itemValue: 18000,
    scenarioId: 'scenario-8',
    landmarkHint: 'Automation engineering bay E14, locked cage',
    keywords: ['plc', 'plc module', 'programmable logic', 'controller module', 'controller', 'पीएलसी', 'ಪಿಎಲ್ಸಿ'],
  },
  {
    orderId: 'ORD-88301',
    sku: 'SKU-9950',
    itemName: 'Direct Thermal Industrial Barcode Printer',
    requiredQuantity: 1,
    expectedBin: 'B02',
    locationDescription: 'Equipment staging bay B02',
    destinationTote: 'TOTE-15',
    itemValue: 24000,
    landmarkHint: 'Equipment staging bay B02',
    keywords: ['printer', 'barcode printer', 'thermal printer', 'प्रिंटर', 'ಪ್ರಿಂಟರ್'],
  },
];

/**
 * Cache for active investigation task IDs to prevent duplicate tasks if repeated reports are submitted.
 */
const taskCacheByOrder = new Map<string, string>();

/**
 * Clears the cached task IDs, used during scenario resets.
 */
export function clearTaskCache(): void {
  taskCacheByOrder.clear();
}

/**
 * Generates or retrieves an existing unique investigation task ID.
 */
export function getOrCreateInvestigationTaskId(orderId: string): string {
  const existing = taskCacheByOrder.get(orderId);
  if (existing) {
    return existing;
  }
  const cleanId = orderId.replace(/^ORD-|^DO-/, '');
  const taskId = `TSK-INV-${cleanId}`;
  taskCacheByOrder.set(orderId, taskId);
  return taskId;
}

/**
 * Parses reported quantities from natural language picker messages (e.g., "pick 10 cable harnesses, but I can find only 6").
 */
export function extractReportedQuantity(message: string, requiredQty: number): {
  reportedQty?: number;
  discrepancy?: number;
  isPartial: boolean;
} {
  const lower = message.toLowerCase();

  // Pattern like: "find only 6", "found only 6", "only 6", "found 6 of 10"
  const onlyMatch = lower.match(/(?:only|found|have)\s+(\d+)/);
  const ofMatch = lower.match(/(\d+)\s+(?:of|out of)\s+(\d+)/);

  if (ofMatch) {
    const found = parseInt(ofMatch[1], 10);
    const expected = parseInt(ofMatch[2], 10) || requiredQty;
    if (found < expected) {
      return {
        reportedQty: found,
        discrepancy: expected - found,
        isPartial: true,
      };
    }
  } else if (onlyMatch) {
    const found = parseInt(onlyMatch[1], 10);
    if (found < requiredQty) {
      return {
        reportedQty: found,
        discrepancy: requiredQty - found,
        isPartial: true,
      };
    }
  }

  return { isPartial: false };
}

/**
 * Inspects available dispatch order and inventory records to match a picker's natural-language report.
 *
 * Core Principles:
 * 1. Never invent a product, SKU, order, or bin.
 * 2. If the user reports "charger", never silently substitute Wireless Adapter Dual-Band.
 * 3. If multiple products match, return MULTIPLE_MATCHES so the picker can choose.
 * 4. If no reliable match exists, return NO_MATCH with confidence NONE.
 * 5. Preset scenario context is only applied when the report actually establishes that item,
 *    or when the demo scenario is explicitly selected.
 */
export function matchDispatchOrder(
  message: string,
  activeScenarioId?: string,
  isExplicitScenarioSelection?: boolean
): MatchedDispatchResult {
  const text = (message || '').trim();
  const lower = text.toLowerCase();
  const isDamaged =
    lower.includes('damage') ||
    lower.includes('broken') ||
    lower.includes('cracked') ||
    lower.includes('खराब') ||
    lower.includes('टूटा') ||
    lower.includes('हानी');

  // Handle explicit scenario selection trigger (e.g., clicking a scenario pill in the demo toolbar)
  if (isExplicitScenarioSelection && activeScenarioId) {
    const scenarioOrder = WAREHOUSE_DISPATCH_ORDERS.find((o) => o.scenarioId === activeScenarioId);
    if (scenarioOrder) {
      const qtyInfo = extractReportedQuantity(message, scenarioOrder.requiredQuantity);
      return {
        status: 'MATCHED',
        order: scenarioOrder,
        matches: [scenarioOrder],
        confidence: 'SCENARIO_CONTEXT',
        matchedReason: `Explicitly activated via demo scenario (${activeScenarioId})`,
        reportedQuantity: qtyInfo.reportedQty,
        quantityDiscrepancy: qtyInfo.discrepancy,
        isDamagedReported: isDamaged,
      };
    }
  }

  // If text is completely empty
  if (!text) {
    if (activeScenarioId) {
      const scenarioOrder = WAREHOUSE_DISPATCH_ORDERS.find((o) => o.scenarioId === activeScenarioId);
      if (scenarioOrder) {
        return {
          status: 'MATCHED',
          order: scenarioOrder,
          matches: [scenarioOrder],
          confidence: 'SCENARIO_CONTEXT',
          matchedReason: `Default prompt from active scenario (${activeScenarioId})`,
          isDamagedReported: false,
        };
      }
    }
    return {
      status: 'NO_MATCH',
      order: UNIDENTIFIED_DISPATCH_ORDER,
      matches: [],
      confidence: 'NONE',
      matchedReason: 'Empty search query',
      unidentifiedQuery: '',
    };
  }

  // 1. Direct Exact SKU Match
  const skuMatches: DispatchOrder[] = [];
  for (const order of WAREHOUSE_DISPATCH_ORDERS) {
    const rawSku = order.sku.toLowerCase();
    const cleanNum = rawSku.replace('sku-', '');
    const skuRegex = new RegExp(`\\b${rawSku}\\b|\\bsku[\\s-]+${cleanNum}\\b|\\b${cleanNum}\\b`, 'i');
    if (skuRegex.test(lower)) {
      if (!skuMatches.some((m) => m.sku === order.sku)) {
        skuMatches.push(order);
      }
    }
  }

  if (skuMatches.length === 1) {
    const order = skuMatches[0];
    const qtyInfo = extractReportedQuantity(message, order.requiredQuantity);
    return {
      status: 'MATCHED',
      order,
      matches: [order],
      confidence: 'HIGH',
      matchedReason: `Exact SKU match: ${order.sku}`,
      reportedQuantity: qtyInfo.reportedQty,
      quantityDiscrepancy: qtyInfo.discrepancy,
      isDamagedReported: isDamaged,
    };
  } else if (skuMatches.length > 1) {
    return {
      status: 'MULTIPLE_MATCHES',
      order: skuMatches[0],
      matches: skuMatches,
      confidence: 'AMBIGUOUS',
      matchedReason: `Multiple SKUs matched query`,
      isDamagedReported: isDamaged,
    };
  }

  // 2. Direct Assigned Bin match across orders
  const binMatches: DispatchOrder[] = [];
  for (const order of WAREHOUSE_DISPATCH_ORDERS) {
    // Word boundary check for bin e.g. "A12", "B07", "bin A12"
    const binRegex = new RegExp(`\\b(bin\\s+)?${order.expectedBin.toLowerCase()}\\b`, 'i');
    if (binRegex.test(lower)) {
      if (!binMatches.some((m) => m.sku === order.sku)) {
        binMatches.push(order);
      }
    }
  }

  // If text mentions an explicit bin (e.g. "I cannot find the item in bin A12"):
  if (binMatches.length === 1) {
    const order = binMatches[0];
    const qtyInfo = extractReportedQuantity(message, order.requiredQuantity);
    return {
      status: 'MATCHED',
      order,
      matches: [order],
      confidence: 'HIGH',
      matchedReason: `Matched assigned bin location: ${order.expectedBin}`,
      reportedQuantity: qtyInfo.reportedQty,
      quantityDiscrepancy: qtyInfo.discrepancy,
      isDamagedReported: isDamaged,
    };
  } else if (binMatches.length > 1) {
    return {
      status: 'MULTIPLE_MATCHES',
      order: binMatches[0],
      matches: binMatches,
      confidence: 'AMBIGUOUS',
      matchedReason: `Multiple orders found for bin location`,
      isDamagedReported: isDamaged,
    };
  }

  // 3. Product Title and Semantic Keywords match with relevance scoring
  interface CandidateMatch {
    order: DispatchOrder;
    score: number;
    isSpecific: boolean;
  }

  // If query explicitly mentions unstocked items (e.g. laptop charger or hydraulic jack)
  const isUnstockedSpecific = lower.includes('laptop') || lower.includes('hydraulic');

  const candidates: CandidateMatch[] = [];

  if (!isUnstockedSpecific) {
    for (const order of WAREHOUSE_DISPATCH_ORDERS) {
      const itemNameLower = order.itemName.toLowerCase();
      const keywords = order.keywords || [];
      let score = 0;
      let isSpecific = false;

      // Full exact item title match
      if (lower.includes(itemNameLower)) {
        score += 100;
        isSpecific = true;
      }

      // Category / multi-word phrase matching
      if (itemNameLower.includes('cable harness') && (lower.includes('cable harness') || lower.includes('harness') || lower.includes('shielded cable'))) {
        score += 70;
        isSpecific = true;
      } else if (itemNameLower.includes('charging cable') && !lower.includes('harness')) {
        if (lower.includes('braided') && order.sku === 'SKU-2201') {
          score += 85;
          isSpecific = true;
        } else if (lower.includes('lightning') && order.sku === 'SKU-2202') {
          score += 85;
          isSpecific = true;
        } else if (!lower.includes('braided') && !lower.includes('lightning') && (lower.includes('charging cable') || lower.includes('usb cable') || lower.includes('cable') || lower.includes('केबल') || lower.includes('ಕೇಬಲ್'))) {
          score += 50;
        }
      } else if (itemNameLower.includes('charger')) {
        if (lower.includes('fast') && order.sku === 'SKU-2045') {
          score += 80;
          isSpecific = true;
        } else if ((lower.includes('travel') || lower.includes('multi-port')) && order.sku === 'SKU-2046') {
          score += 80;
          isSpecific = true;
        } else if (lower.includes('charger') || lower.includes('चार्जर') || lower.includes('ಚಾರ್ಜರ್')) {
          score += 50;
        }
      } else if (itemNameLower.includes('phone cover')) {
        if ((lower.includes('silicone') || lower.includes('shockproof') || lower.includes('clear')) && order.sku === 'SKU-2101') {
          score += 80;
          isSpecific = true;
        } else if ((lower.includes('armor') || lower.includes('heavy-duty') || lower.includes('black')) && order.sku === 'SKU-2102') {
          score += 80;
          isSpecific = true;
        } else if (lower.includes('phone cover') || lower.includes('cover') || lower.includes('case') || lower.includes('कवर') || lower.includes('ಕವರ್')) {
          score += 50;
        }
      } else if (itemNameLower.includes('earphone') || itemNameLower.includes('earbud')) {
        if ((lower.includes('wireless') || lower.includes('bluetooth') || lower.includes('noise')) && order.sku === 'SKU-2301') {
          score += 80;
          isSpecific = true;
        } else if ((lower.includes('wired') || lower.includes('in-ear')) && order.sku === 'SKU-2302') {
          score += 80;
          isSpecific = true;
        } else if (lower.includes('earphone') || lower.includes('earbud') || lower.includes('इयरफ़ोन') || lower.includes('ಇಯರ್‌ಫೋನ್')) {
          score += 50;
        }
      } else if (itemNameLower.includes('wireless adapter') && (lower.includes('wireless adapter') || lower.includes('adapter') || lower.includes('wifi') || lower.includes('वायलेस') || lower.includes('ವೈರ್ಲೆಸ್'))) {
        score += 65;
        isSpecific = true;
      } else if (itemNameLower.includes('usb hub') && (lower.includes('usb hub') || lower.includes('7-port') || lower.includes('powered hub') || lower.includes('हब'))) {
        score += 65;
        isSpecific = true;
      } else if (itemNameLower.includes('gaming keyboard') && (lower.includes('gaming keyboard') || lower.includes('keyboard') || lower.includes('mechanical') || lower.includes('कीबोर्ड') || lower.includes('ಕೀಬೋರ್ಡ್'))) {
        score += 65;
        isSpecific = true;
      } else if (itemNameLower.includes('battery pack') && (lower.includes('battery pack') || lower.includes('scanner battery') || lower.includes('li-ion') || lower.includes('battery') || lower.includes('बैटरी') || lower.includes('ಬ್ಯಾಟರಿ'))) {
        score += 65;
        isSpecific = true;
      } else if (itemNameLower.includes('caster wheel') && (lower.includes('caster') || lower.includes('swivel caster') || lower.includes('wheel') || lower.includes('पहिया') || lower.includes('ಚಕ್ರ'))) {
        score += 65;
        isSpecific = true;
      } else if (itemNameLower.includes('touchscreen') && (lower.includes('touchscreen') || lower.includes('hmi') || lower.includes('panel') || lower.includes('स्क्रीन') || lower.includes('ಪ್ಯಾನೆಲ್'))) {
        score += 65;
        isSpecific = true;
      } else if (itemNameLower.includes('barcode reader') && (lower.includes('barcode reader') || lower.includes('rugged reader') || lower.includes('scanner gun') || lower.includes('बारकोड स्कैनर'))) {
        score += 65;
        isSpecific = true;
      } else if (itemNameLower.includes('barcode printer') && (lower.includes('barcode printer') || lower.includes('thermal printer') || lower.includes('printer') || lower.includes('प्रिंटर') || lower.includes('ಪ್ರಿಂಟರ್'))) {
        score += 65;
        isSpecific = true;
      } else if (itemNameLower.includes('raid controller') && (/\braid\b/i.test(lower) || /\bnvme\b/i.test(lower) || (/\bcontroller\b/i.test(lower) && !/\bplc\b/i.test(lower)))) {
        score += 50;
        if (/\braid\b/i.test(lower) || /\bnvme\b/i.test(lower)) {
          score += 30;
          isSpecific = true;
        }
      } else if (itemNameLower.includes('plc') && (/\bplc\b/i.test(lower) || lower.includes('programmable logic') || (/\bcontroller\b/i.test(lower) && !/\braid\b/i.test(lower)))) {
        score += 50;
        if (/\bplc\b/i.test(lower) || lower.includes('programmable logic')) {
          score += 30;
          isSpecific = true;
        }
      }

      // Keyword array matches
      for (const kw of keywords) {
        const kwLower = kw.toLowerCase();
        // Skip generic 'cable' keyword if user specifically asked for 'harness'
        if (kwLower === 'cable' && lower.includes('harness')) continue;
        // Skip generic 'cable' keyword if user asked for 'charger'
        if (kwLower === 'cable' && lower.includes('charger')) continue;
        // Skip generic 'cable' keyword if user asked for specific cable model
        if (kwLower === 'cable' && lower.includes('braided') && order.sku !== 'SKU-2201') continue;
        if (kwLower === 'cable' && lower.includes('lightning') && order.sku !== 'SKU-2202') continue;

        const kwRegex = new RegExp(`\\b${kwLower}\\b`, 'i');
        if (kwRegex.test(lower)) {
          score += kwLower.includes(' ') ? 40 : 25;
        }
      }

      // Active scenario alignment bonus
      if (activeScenarioId && order.scenarioId === activeScenarioId) {
        score += 15;
      }

      if (score >= 40) {
        if (!candidates.some((c) => c.order.sku === order.sku)) {
          candidates.push({ order, score, isSpecific });
        }
      }
    }
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
    const highestScore = candidates[0].score;
    // Keep only candidates within 15 points of top score to eliminate low-relevance false positives
    const topCandidates = candidates.filter((c) => c.score >= highestScore - 15);

    if (topCandidates.length === 1 || (topCandidates[0].score >= (topCandidates[1]?.score ?? 0) + 20)) {
      const winner = topCandidates[0].order;
      const qtyInfo = extractReportedQuantity(message, winner.requiredQuantity);
      return {
        status: 'MATCHED',
        order: winner,
        matches: [winner],
        confidence: 'HIGH',
        matchedReason: `Matched catalog item: ${winner.itemName}`,
        reportedQuantity: qtyInfo.reportedQty,
        quantityDiscrepancy: qtyInfo.discrepancy,
        isDamagedReported: isDamaged,
      };
    } else {
      // Multiple items tie or have comparable high scores
      const matchedOrders = topCandidates.map((c) => c.order);
      return {
        status: 'MULTIPLE_MATCHES',
        order: matchedOrders[0],
        matches: matchedOrders,
        confidence: 'AMBIGUOUS',
        matchedReason: `Found multiple matching items: ${matchedOrders.map((k) => k.itemName).join(', ')}`,
        isDamagedReported: isDamaged,
      };
    }
  }

  // 4. Check if the message matches the active scenario's default prompt exactly
  if (activeScenarioId) {
    const scenarioOrder = WAREHOUSE_DISPATCH_ORDERS.find((o) => o.scenarioId === activeScenarioId);
    if (scenarioOrder) {
      // Check if message actually refers to this scenario's expected bin or item
      const binRegex = new RegExp(`\\b${scenarioOrder.expectedBin.toLowerCase()}\\b`, 'i');
      if (binRegex.test(lower)) {
        const qtyInfo = extractReportedQuantity(message, scenarioOrder.requiredQuantity);
        return {
          status: 'MATCHED',
          order: scenarioOrder,
          matches: [scenarioOrder],
          confidence: 'SCENARIO_CONTEXT',
          matchedReason: `Correlated via active scenario (${activeScenarioId}) at bin ${scenarioOrder.expectedBin}`,
          reportedQuantity: qtyInfo.reportedQty,
          quantityDiscrepancy: qtyInfo.discrepancy,
          isDamagedReported: isDamaged,
        };
      }
    }
  }

  // 5. NO RELIABLE MATCH FOUND.
  // CRITICAL REQUIREMENT:
  // If the picker enters "I cannot find charger", do NOT return Wireless Adapter Dual-Band!
  // Return NO_MATCH safely. StockTrace will inform the picker and offer supervisor assistance.
  return {
    status: 'NO_MATCH',
    order: UNIDENTIFIED_DISPATCH_ORDER,
    matches: [],
    confidence: 'NONE',
    matchedReason: 'No matching item found in warehouse catalog, SKU list, or dispatch records',
    unidentifiedQuery: message,
    isDamagedReported: isDamaged,
  };
}
