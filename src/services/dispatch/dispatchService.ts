import { RawScannerInput, RawCameraInput } from '../../harness';
import { SCANNER_TRANSACTIONS } from '../../data/mockData';

export interface DispatchOrder {
  orderId: string;
  sku: string;
  itemName: string;
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
  {
    orderId: 'ORD-88201',
    sku: 'SKU-1042',
    itemName: 'Wireless Adapter Dual-Band',
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

  // 3. Product Title and Semantic Keywords match
  const keywordMatches: DispatchOrder[] = [];
  for (const order of WAREHOUSE_DISPATCH_ORDERS) {
    const itemNameLower = order.itemName.toLowerCase();
    const keywords = order.keywords || [];

    // Check full or significant sub-phrase match in item name
    const hasNameMatch =
      lower.includes(itemNameLower) ||
      (itemNameLower.includes('wireless adapter') && (lower.includes('wireless adapter') || lower.includes('adapter') || lower.includes('वायलेस') || lower.includes('ವೈರ್ಲೆಸ್'))) ||
      (itemNameLower.includes('usb hub') && (lower.includes('usb hub') || lower.includes('usb') || lower.includes('7-port'))) ||
      (itemNameLower.includes('gaming keyboard') && (lower.includes('gaming keyboard') || lower.includes('keyboard') || lower.includes('कीबोर्ड') || lower.includes('ಕೀಬೋರ್ಡ್'))) ||
      (itemNameLower.includes('battery pack') && (lower.includes('battery') || lower.includes('scanner battery') || lower.includes('बैटरी') || lower.includes('ಬ್ಯಾಟರಿ'))) ||
      (itemNameLower.includes('cable harness') && (lower.includes('cable') || lower.includes('harness') || lower.includes('cable harness') || lower.includes('केबल') || lower.includes('ಕೇಬಲ್'))) ||
      (itemNameLower.includes('touchscreen') && (lower.includes('touchscreen') || lower.includes('hmi') || lower.includes('panel') || lower.includes('स्क्रीन'))) ||
      (itemNameLower.includes('barcode reader') && (lower.includes('barcode reader') || lower.includes('rugged reader') || (lower.includes('scanner') && !lower.includes('battery')))) ||
      (itemNameLower.includes('plc') && (lower.includes('plc') || lower.includes('programmable logic') || lower.includes('controller'))) ||
      (itemNameLower.includes('barcode printer') && (lower.includes('printer') || lower.includes('barcode printer'))) ||
      (itemNameLower.includes('caster wheel') && (lower.includes('caster') || lower.includes('swivel caster') || lower.includes('wheel'))) ||
      (itemNameLower.includes('raid controller') && (lower.includes('raid') || lower.includes('nvme') || lower.includes('controller')));

    const hasKeywordMatch = keywords.some((kw) => {
      const kwRegex = new RegExp(`\\b${kw.toLowerCase()}\\b`, 'i');
      return kwRegex.test(lower);
    });

    if (hasNameMatch || hasKeywordMatch) {
      if (!keywordMatches.some((m) => m.sku === order.sku)) {
        keywordMatches.push(order);
      }
    }
  }

  if (keywordMatches.length === 1) {
    const order = keywordMatches[0];
    const qtyInfo = extractReportedQuantity(message, order.requiredQuantity);
    return {
      status: 'MATCHED',
      order,
      matches: [order],
      confidence: 'HIGH',
      matchedReason: `Matched catalog item: ${order.itemName}`,
      reportedQuantity: qtyInfo.reportedQty,
      quantityDiscrepancy: qtyInfo.discrepancy,
      isDamagedReported: isDamaged,
    };
  } else if (keywordMatches.length > 1) {
    // If multiple products match (e.g., 'controller' matches RAID & PLC, 'scanner' matches reader & battery)
    return {
      status: 'MULTIPLE_MATCHES',
      order: keywordMatches[0],
      matches: keywordMatches,
      confidence: 'AMBIGUOUS',
      matchedReason: `Found multiple matching items: ${keywordMatches.map((k) => k.itemName).join(', ')}`,
      isDamagedReported: isDamaged,
    };
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
