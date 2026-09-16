import {
  FailedPickCase,
  ScannerTransaction,
  CameraEvent,
  InvestigationRecord,
  DiscrepancyRecord,
  DataSourceItem,
} from '../types';

export const INITIAL_FAILED_CASES: FailedPickCase[] = [
  {
    id: 'CASE-1042',
    sku: 'SKU-1042',
    item: 'Wireless Adapter',
    qty: 5,
    expectedLocation: 'A12',
    status: 'ITEM_NOT_FOUND',
    destinationBin: 'TOTE-44',
    orderNumber: 'ORD-88201',
    reportedAt: '14:34',
    reportedBy: 'Picker #12 (WMS Pick Task #9041)',
    recommendedLocation: 'B07',
    movementPath: 'A12 → Aisle 3 → B07',
  },
  {
    id: 'CASE-2081',
    sku: 'SKU-2081',
    item: 'USB Hub',
    qty: 10,
    expectedLocation: 'B07',
    status: 'ITEM_NOT_FOUND',
    destinationBin: 'TOTE-19',
    orderNumber: 'ORD-88204',
    reportedAt: '13:15',
    reportedBy: 'Picker #08 (WMS Pick Task #9038)',
  },
  {
    id: 'CASE-3015',
    sku: 'SKU-3015',
    item: 'Keyboard',
    qty: 8,
    expectedLocation: 'C03',
    status: 'ITEM_NOT_FOUND',
    destinationBin: 'TOTE-33',
    orderNumber: 'ORD-88209',
    reportedAt: '11:40',
    reportedBy: 'Picker #14 (WMS Pick Task #9035)',
  },
];

// Backward compatibility alias
export const INITIAL_PICK_TASKS = INITIAL_FAILED_CASES;


export const SCANNER_TRANSACTIONS: Record<string, ScannerTransaction[]> = {
  'SKU-1042': [
    {
      time: '14:32',
      sku: 'SKU-1042',
      fromLocation: 'Receiving',
      toLocation: 'A12',
      qty: 5,
      type: 'Put-away',
      scannerId: 'Scanner 07',
    },
    {
      time: '14:34',
      sku: 'SKU-1042',
      fromLocation: 'A12',
      toLocation: '—',
      qty: 5,
      type: 'Movement',
      scannerId: 'Scanner 07',
    },
    {
      time: '14:35',
      sku: 'SKU-1042',
      fromLocation: '—',
      toLocation: 'B07',
      qty: 5,
      type: 'Movement',
      scannerId: 'Scanner 07',
    },
  ],
};

export const CAMERA_EVENTS: Record<string, CameraEvent[]> = {
  'SKU-1042': [
    {
      camera: 'A12-CAM',
      date: '16 Sep 2026',
      timeRange: '2:32 PM – 2:34 PM',
      exactTime: '2:32 PM',
      statusText: 'Movement detected',
      eventDescription: 'Possible movement leaving A12',
      frameVisualType: 'a12',
      sourceLocation: 'A12',
      destinationLocation: 'Aisle 3',
    },
    {
      camera: 'AISLE-3-CAM',
      date: '16 Sep 2026',
      timeRange: '2:32 PM – 2:35 PM',
      exactTime: '2:34 PM',
      statusText: 'Movement detected',
      eventDescription: 'Movement observed toward B07',
      frameVisualType: 'aisle3',
      sourceLocation: 'A12',
      destinationLocation: 'B07',
    },
    {
      camera: 'B07-CAM',
      date: '16 Sep 2026',
      timeRange: '2:35 PM – 2:37 PM',
      exactTime: '2:35 PM',
      statusText: 'Activity detected',
      eventDescription: 'Activity observed near B07',
      frameVisualType: 'b07',
      sourceLocation: 'Aisle 3',
      destinationLocation: 'B07',
    },
  ],
  'SKU-3015': [
    {
      camera: 'AISLE-3-CAM',
      date: '16 Sep 2026',
      timeRange: '11:38 AM – 11:41 AM',
      exactTime: '11:40 AM',
      statusText: 'Movement detected',
      eventDescription: 'Movement appears toward C03',
      frameVisualType: 'c03',
      sourceLocation: 'Aisle 3',
      destinationLocation: 'C03',
    },
  ],
};

export const INITIAL_INVESTIGATIONS: InvestigationRecord[] = [
  {
    id: 'INV-1038',
    taskId: 'TASK-9038',
    sku: 'SKU-2081',
    expectedLocation: 'B07',
    recommendedLocation: '—',
    evidence: 'Insufficient Evidence',
    status: 'Escalated',
    resolutionTime: '08:31',
    timestamp: 'Today, 13:15',
    reason: 'Camera blindspot between aisle 4 and packing station; escalated for warehouse review',
  },
  {
    id: 'INV-1035',
    taskId: 'TASK-9035',
    sku: 'SKU-3015',
    expectedLocation: 'C03',
    recommendedLocation: 'D04',
    evidence: 'Conflicting Evidence',
    status: 'Escalated',
    resolutionTime: '06:14',
    timestamp: 'Today, 11:42',
    reason: 'Scanner showed movement to B07, camera tracked bin toward C03; halted to prevent wrong pick',
  },
];

export const INITIAL_DISCREPANCIES: DiscrepancyRecord[] = [
  {
    id: 'DISC-879',
    taskId: 'TASK-9038',
    sku: 'SKU-2081',
    itemName: 'USB Hub',
    expectedLocation: 'B07',
    foundLocation: 'Pending Physical Audit',
    reason: 'Item missing from bin; no camera trail found',
    time: '13:20',
    evidence: 'Scanner Only (No Camera)',
    status: 'Pending Review',
    resolvedBy: 'Warehouse Review Queue',
  },
];

export const DATA_SOURCES: DataSourceItem[] = [
  {
    id: 'ds-wms',
    name: 'Inventory Data',
    status: 'Connected',
    source: 'Warehouse Inventory System',
    details: 'Where items are expected to be stored.',
    lastSync: '12 seconds ago',
    recordCount: '14,820 SKUs listed',
  },
  {
    id: 'ds-scanners',
    name: 'Scanner Transactions',
    status: 'Connected',
    source: 'Warehouse Scanners',
    details: 'Recent item movements recorded by warehouse scanners.',
    lastSync: 'Real-time',
    recordCount: '12 active scanners online',
  },
  {
    id: 'ds-cctv',
    name: 'Camera Sources',
    status: 'Connected',
    source: 'Fixed Overhead Warehouse Cameras',
    details: 'Camera footage from areas where items may have moved.',
    lastSync: 'Real-time',
    recordCount: '3 cameras available (A12-CAM, AISLE-3-CAM, B07-CAM)',
  },
];
