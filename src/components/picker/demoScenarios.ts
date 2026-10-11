import { ScannerTransaction, FailedPickCase } from '../../types';
import { SCANNER_TRANSACTIONS } from '../../data/mockData';
import { stockTraceEngine, RawScannerInput, RawCameraInput, InvestigationExecutionResult } from '../../harness';

export interface DemoScenario {
  id: string;
  scenarioNumber: number;
  label: string;
  shortTag: string;
  title: string;
  description: string;
  caseId: string;
  sku: string;
  item: string;
  qty: number;
  expectedLocation: string;
  landmarkHint: string;
  itemValue?: number;
  orderNumber: string;
  destinationBin: string;
  scannerRecords: RawScannerInput[];
  cameraRecords: RawCameraInput[];
  engineOptions?: {
    forceScenario?: 'happy-path' | 'conflict' | 'no-camera';
    isStale?: boolean;
    referenceNow?: string;
  };
  expectedOutcomeType:
    | 'FOUND_EXPECTED'
    | 'RECOMMEND_B07'
    | 'INSUFFICIENT'
    | 'CONFLICTING'
    | 'STALE'
    | 'LESS_QUANTITY'
    | 'DAMAGED'
    | 'HIGH_VALUE_TIER3';
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'scenario-1',
    scenarioNumber: 1,
    label: '1 · Found at Bin',
    shortTag: '1042',
    title: 'Scenario 1 — Item Found at Expected Bin',
    description: 'Item is present at expected bin A12. Picker confirms Found directly. No alternate location recommended.',
    caseId: 'CASE-1042',
    sku: 'SKU-1042',
    item: 'Wireless Adapter Dual-Band',
    qty: 5,
    expectedLocation: 'A12',
    landmarkHint: 'Near the blue rack, bottom shelf (Level 1)',
    itemValue: 1850,
    orderNumber: 'ORD-88201',
    destinationBin: 'TOTE-44',
    scannerRecords: [],
    cameraRecords: [],
    expectedOutcomeType: 'FOUND_EXPECTED',
  },
  {
    id: 'scenario-2',
    scenarioNumber: 2,
    label: '2 · Missing → B07',
    shortTag: '1042',
    title: 'Scenario 2 — Item Missing, Alternate Location Supported',
    description: 'Picker cannot find item at A12. Scanner movement evidence at 14:35 supports checking B07.',
    caseId: 'CASE-1042',
    sku: 'SKU-1042',
    item: 'Wireless Adapter Dual-Band',
    qty: 5,
    expectedLocation: 'A12',
    landmarkHint: 'Near the blue rack, bottom shelf (Level 1)',
    itemValue: 1850,
    orderNumber: 'ORD-88201',
    destinationBin: 'TOTE-44',
    scannerRecords: (SCANNER_TRANSACTIONS['SKU-1042'] || []).map((t) => ({
      time: t.time,
      sku: t.sku,
      fromLocation: t.fromLocation,
      toLocation: t.toLocation,
      qty: t.qty,
      type: t.type,
      scannerId: t.scannerId,
    })),
    cameraRecords: [
      {
        exactTime: '14:34',
        camera: 'CAM-04-AISLE-3',
        eventDescription: 'Floor associate cart observed departing A12 toward Bin B07',
        fromLocation: 'A12',
        toLocation: 'B07',
      },
    ],
    engineOptions: {
      referenceNow: '14:40',
    },
    expectedOutcomeType: 'RECOMMEND_B07',
  },
  {
    id: 'scenario-3',
    scenarioNumber: 3,
    label: '3 · Insufficient',
    shortTag: '2081',
    title: 'Scenario 3 — Insufficient Evidence',
    description: 'Item missing at B07. No subsequent scanner or camera movement recorded. Refuses to invent location.',
    caseId: 'CASE-2081',
    sku: 'SKU-2081',
    item: 'Powered 7-Port USB Hub',
    qty: 10,
    expectedLocation: 'B07',
    landmarkHint: 'Near yellow staging buffer zone',
    itemValue: 850,
    orderNumber: 'ORD-88204',
    destinationBin: 'TOTE-19',
    scannerRecords: [],
    cameraRecords: [],
    engineOptions: {
      referenceNow: '13:20',
    },
    expectedOutcomeType: 'INSUFFICIENT',
  },
  {
    id: 'scenario-4',
    scenarioNumber: 4,
    label: '4 · Conflicting',
    shortTag: '3015',
    title: 'Scenario 4 — Conflicting Evidence',
    description: 'Scanner record logged transfer toward B07, while conveyor camera observed movement toward C19. Halts recommendation.',
    caseId: 'CASE-3015',
    sku: 'SKU-3015',
    item: 'Mechanical Gaming Keyboard RGB',
    qty: 8,
    expectedLocation: 'C03',
    landmarkHint: 'Near main packing conveyor belt',
    itemValue: 2400,
    orderNumber: 'ORD-88209',
    destinationBin: 'TOTE-33',
    scannerRecords: [
      {
        time: '11:35',
        sku: 'SKU-3015',
        fromLocation: 'C03',
        toLocation: 'B07',
        qty: 8,
        type: 'Transfer',
        scannerId: 'Scanner 03',
      },
    ],
    cameraRecords: [
      {
        exactTime: '11:38',
        camera: 'CAM-07-CONVEYOR',
        eventDescription: 'Tote marked with SKU batch was visually seen moving toward Aisle 5 (C19)',
        fromLocation: 'C03',
        toLocation: 'C19',
      },
    ],
    engineOptions: {
      forceScenario: 'conflict',
      referenceNow: '11:45',
    },
    expectedOutcomeType: 'CONFLICTING',
  },
  {
    id: 'scenario-5',
    scenarioNumber: 5,
    label: '5 · Stale Record',
    shortTag: '5012',
    title: 'Scenario 5 — Stale Evidence',
    description: 'Movement record to D04 exists but is 28 hours old (> 2h limit). Flagged as stale; not verified as current.',
    caseId: 'CASE-5012',
    sku: 'SKU-5012',
    item: 'Barcode Scanner Li-Ion Battery Pack',
    qty: 6,
    expectedLocation: 'C18',
    landmarkHint: 'Near charging dock aisle, bay D04',
    itemValue: 950,
    orderNumber: 'ORD-88235',
    destinationBin: 'TOTE-55',
    scannerRecords: (SCANNER_TRANSACTIONS['SKU-5012'] || []).map((t) => ({
      time: t.time,
      sku: t.sku,
      fromLocation: t.fromLocation,
      toLocation: t.toLocation,
      qty: t.qty,
      type: t.type,
      scannerId: t.scannerId,
    })),
    cameraRecords: [],
    engineOptions: {
      isStale: true,
      referenceNow: '09:30',
    },
    expectedOutcomeType: 'STALE',
  },
  {
    id: 'scenario-6',
    scenarioNumber: 6,
    label: '6 · Less Qty',
    shortTag: '9014',
    title: 'Scenario 6 — Less Quantity Discrepancy',
    description: 'Picker finds fewer items than the requested quantity (e.g. 3 of 10). Shortage discrepancy logged for supervisor review.',
    caseId: 'CASE-9014',
    sku: 'SKU-9014',
    item: 'Industrial Shielded Cable Harness',
    qty: 10,
    expectedLocation: 'B11',
    landmarkHint: 'Near cable spool carousel B11',
    itemValue: 450,
    orderNumber: 'ORD-88277',
    destinationBin: 'TOTE-29',
    scannerRecords: [],
    cameraRecords: [],
    expectedOutcomeType: 'LESS_QUANTITY',
  },
  {
    id: 'scenario-7',
    scenarioNumber: 7,
    label: '7 · Damaged',
    shortTag: '7011',
    title: 'Scenario 7 — Damaged Item',
    description: 'Picker reports damaged stock (crushed packaging or broken glass). Escalate for supervisor quarantine inspection.',
    caseId: 'CASE-7011',
    sku: 'SKU-7011',
    item: 'Industrial Touchscreen HMI Panel',
    qty: 1,
    expectedLocation: 'E05',
    landmarkHint: 'Special equipment cabinet, bay E05',
    itemValue: 8900,
    orderNumber: 'ORD-88250',
    destinationBin: 'TOTE-02',
    scannerRecords: [],
    cameraRecords: [],
    expectedOutcomeType: 'DAMAGED',
  },
  {
    id: 'scenario-8',
    scenarioNumber: 8,
    label: '8 · High-Value (AI)',
    shortTag: '9800',
    title: 'Scenario 8 — High-Value Item (Simulated Tier 3 AI)',
    description: 'Item value ₹18,000 exceeds ₹5,000 threshold. Inconclusive Tier 1 allows prototype AI video analysis (~₹120 cost).',
    caseId: 'CASE-9800',
    sku: 'SKU-9800',
    item: 'Programmable Logic Controller (PLC) Module',
    qty: 1,
    expectedLocation: 'E10',
    landmarkHint: 'Automation engineering bay E14, locked cage',
    itemValue: 18000,
    orderNumber: 'ORD-88295',
    destinationBin: 'TOTE-04',
    scannerRecords: (SCANNER_TRANSACTIONS['SKU-9800'] || []).map((t) => ({
      time: t.time,
      sku: t.sku,
      fromLocation: t.fromLocation,
      toLocation: t.toLocation,
      qty: t.qty,
      type: t.type,
      scannerId: t.scannerId,
    })),
    cameraRecords: [
      {
        exactTime: '05:58',
        camera: 'CAM-PLC-09',
        eventDescription: 'Trolley moving PLC carton toward Bay E14',
        fromLocation: 'E10',
        toLocation: 'E14',
      },
    ],
    engineOptions: {
      referenceNow: '06:05',
    },
    expectedOutcomeType: 'HIGH_VALUE_TIER3',
  },
];

/**
 * Executes the real StockTrace evidence engine for a given scenario.
 * Returns the candidate evaluation, fused report, and grounded explanation.
 */
export function executeScenarioInvestigation(scenario: DemoScenario): InvestigationExecutionResult {
  // Ensure the case is registered in the engine
  stockTraceEngine.registerCase({
    case_id: scenario.caseId,
    sku: scenario.sku,
    item_name: scenario.item,
    expected_location: scenario.expectedLocation,
    expected_quantity: scenario.qty,
  });

  return stockTraceEngine.runInvestigation(
    scenario.caseId,
    scenario.scannerRecords,
    scenario.cameraRecords,
    scenario.engineOptions
  );
}
