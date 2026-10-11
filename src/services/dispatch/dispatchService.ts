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
}

export interface MatchedDispatchResult {
  order: DispatchOrder;
  confidence: 'HIGH' | 'SCENARIO_CONTEXT' | 'AMBIGUOUS';
  matchedReason: string;
  reportedQuantity?: number;
  quantityDiscrepancy?: number;
  isDamagedReported?: boolean;
}

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
    scenarioId: 'scenario-2',
    landmarkHint: 'Near the blue rack, bottom shelf (Level 1)',
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
  },
];

/**
 * Cache for active investigation task IDs to prevent duplicate tasks if repeated reports are submitted.
 */
const taskCacheByOrder = new Map<string, string>();

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
 */
export function matchDispatchOrder(
  message: string,
  activeScenarioId?: string
): MatchedDispatchResult {
  const text = message.trim();
  const lower = text.toLowerCase();

  // 1. Direct SKU match
  for (const order of WAREHOUSE_DISPATCH_ORDERS) {
    if (lower.includes(order.sku.toLowerCase()) || lower.includes(order.sku.replace('SKU-', '').toLowerCase())) {
      const qtyInfo = extractReportedQuantity(message, order.requiredQuantity);
      return {
        order,
        confidence: 'HIGH',
        matchedReason: `Exact SKU match: ${order.sku}`,
        reportedQuantity: qtyInfo.reportedQty,
        quantityDiscrepancy: qtyInfo.discrepancy,
        isDamagedReported: lower.includes('damage') || lower.includes('broken') || lower.includes('cracked'),
      };
    }
  }

  // 2. Direct Expected Bin match
  for (const order of WAREHOUSE_DISPATCH_ORDERS) {
    // Word boundary check for bin e.g. "A12", "B07"
    const binRegex = new RegExp(`\\b${order.expectedBin.toLowerCase()}\\b`, 'i');
    if (binRegex.test(lower)) {
      const qtyInfo = extractReportedQuantity(message, order.requiredQuantity);
      return {
        order,
        confidence: 'HIGH',
        matchedReason: `Matched assigned bin ${order.expectedBin}`,
        reportedQuantity: qtyInfo.reportedQty,
        quantityDiscrepancy: qtyInfo.discrepancy,
        isDamagedReported: lower.includes('damage') || lower.includes('broken') || lower.includes('cracked'),
      };
    }
  }

  // 3. Product Name / Keywords match
  const keywordMap: Array<{ keywords: string[]; orderId: string }> = [
    { keywords: ['wireless', 'adapter', 'dual-band'], orderId: 'ORD-88201' },
    { keywords: ['usb', 'hub', 'powered 7-port', '7-port'], orderId: 'ORD-88204' },
    { keywords: ['keyboard', 'gaming', 'rgb', 'mechanical'], orderId: 'ORD-88209' },
    { keywords: ['battery', 'barcode scanner battery', 'li-ion'], orderId: 'ORD-88235' },
    { keywords: ['cable', 'harness', 'shielded'], orderId: 'ORD-88277' },
    { keywords: ['touchscreen', 'hmi', 'panel'], orderId: 'ORD-88250' },
    { keywords: ['plc', 'programmable logic', 'controller'], orderId: 'ORD-88295' },
  ];

  for (const item of keywordMap) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      const order = WAREHOUSE_DISPATCH_ORDERS.find((o) => o.orderId === item.orderId)!;
      const qtyInfo = extractReportedQuantity(message, order.requiredQuantity);
      return {
        order,
        confidence: 'HIGH',
        matchedReason: `Matched item keywords: ${order.itemName}`,
        reportedQuantity: qtyInfo.reportedQty,
        quantityDiscrepancy: qtyInfo.discrepancy,
        isDamagedReported: lower.includes('damage') || lower.includes('broken') || lower.includes('cracked'),
      };
    }
  }

  // 4. Fallback to active demo scenario if available
  if (activeScenarioId) {
    const orderForScenario =
      WAREHOUSE_DISPATCH_ORDERS.find((o) => o.scenarioId === activeScenarioId) ||
      WAREHOUSE_DISPATCH_ORDERS[0];

    const qtyInfo = extractReportedQuantity(message, orderForScenario.requiredQuantity);
    return {
      order: orderForScenario,
      confidence: 'SCENARIO_CONTEXT',
      matchedReason: `Correlated via active demo scenario (${activeScenarioId})`,
      reportedQuantity: qtyInfo.reportedQty,
      quantityDiscrepancy: qtyInfo.discrepancy,
      isDamagedReported: lower.includes('damage') || lower.includes('broken') || lower.includes('cracked'),
    };
  }

  // 5. Default fallback to first order with AMBIGUOUS confidence
  const defaultOrder = WAREHOUSE_DISPATCH_ORDERS[0];
  return {
    order: defaultOrder,
    confidence: 'AMBIGUOUS',
    matchedReason: 'General inquiry; default dispatch order correlated',
  };
}
