// Demo data standing in for what StockTrace would read from TallyPrime
// (items, godowns, book stock, stock journals, parties, orders, invoices).
// All names, GSTINs and rates are fictional demo values.

export const COMPANY = {
  name: 'Kaveri Electricals',
  city: 'Mysuru',
  state: 'Karnataka',
  gstin: '29AAAAA0000A1Z5',
};

export const ITEMS = {
  'EL-901': { code: 'EL-901', name: 'LED Bulb 9W (box of 10)', unit: 'box', hsn: '8539', rate: 650, gst: 18 },
  'EL-214': { code: 'EL-214', name: 'Modular Switch 6A', unit: 'pc', hsn: '8536', rate: 38, gst: 18 },
  'EL-330': { code: 'EL-330', name: 'MCB 32A Single Pole', unit: 'pc', hsn: '8536', rate: 210, gst: 18 },
  'EL-512': { code: 'EL-512', name: 'FR Wire 1.5 sq mm, 90 m coil', unit: 'coil', hsn: '8544', rate: 1450, gst: 18 },
  'EL-707': { code: 'EL-707', name: 'Ceiling Fan Regulator', unit: 'pc', hsn: '8536', rate: 320, gst: 18 },
  'EL-118': { code: 'EL-118', name: 'Extension Board, 4 socket', unit: 'pc', hsn: '8536', rate: 275, gst: 18 },
};

export const PARTIES = {
  sharma: { id: 'sharma', name: 'Sharma Traders', city: 'Mysuru', state: 'Karnataka', gstin: '29BBBBB1111B1Z2' },
  vinayaka: { id: 'vinayaka', name: 'Vinayaka Electricals', city: 'Mandya', state: 'Karnataka', gstin: '29CCCCC2222C1Z9' },
  coastal: { id: 'coastal', name: 'Coastal Agencies', city: 'Kasaragod', state: 'Kerala', gstin: '32DDDDD3333D1Z4' },
};

// Book stock per godown / shelf, as Tally's stock summary would show it
export const STOCK = [
  { item: 'EL-901', godown: 'Main Godown', shelf: 'R2-B', qty: 140 },
  { item: 'EL-901', godown: 'Back Store', shelf: 'BS-1', qty: 12 },
  { item: 'EL-214', godown: 'Main Godown', shelf: 'R1-A', qty: 300 },
  { item: 'EL-330', godown: 'Main Godown', shelf: 'R3-C', qty: 40 },
  { item: 'EL-330', godown: 'Back Store', shelf: 'BS-2', qty: 10 },
  { item: 'EL-330', godown: 'Returns Area', shelf: 'RT-1', qty: 5 },
  { item: 'EL-118', godown: 'Back Store', shelf: 'BS-3', qty: 6 },
  { item: 'EL-512', godown: 'Main Godown', shelf: 'R4-A', qty: 18 },
  { item: 'EL-707', godown: 'Main Godown', shelf: 'R5-B', qty: 25 },
  { item: 'EL-707', godown: 'Returns Area', shelf: 'RT-1', qty: 3 },
  { item: 'EL-118', godown: 'Main Godown', shelf: 'R1-D', qty: 30 },
];

const day = (offset, h = 10, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

// Recent stock journals (transfers) recorded in Tally
export const MOVEMENTS = [
  { no: 'SJ-0412', at: day(-4, 16, 20), item: 'EL-901', qty: 4, from: 'Main Godown / R2-B', to: 'Back Store / BS-1' },
  { no: 'SJ-0418', at: day(-2, 11, 5), item: 'EL-330', qty: 5, from: 'Main Godown / R3-C', to: 'Returns Area / RT-1' },
  { no: 'SJ-0421', at: day(-1, 15, 40), item: 'EL-118', qty: 6, from: 'Main Godown / R1-D', to: 'Back Store / BS-3' },
];

export const ORDERS = [
  {
    id: 'ORD-1031', party: 'sharma', placedAt: day(0, 9, 10), dispatchBy: day(0, 17, 0),
    invoice: { no: 'INV-2611', date: day(0, 9, 30) },
    lines: [
      { item: 'EL-901', qty: 100, godown: 'Main Godown', shelf: 'R2-B' },
      { item: 'EL-214', qty: 50, godown: 'Main Godown', shelf: 'R1-A' },
    ],
  },
  {
    id: 'ORD-1032', party: 'vinayaka', placedAt: day(0, 9, 45), dispatchBy: day(0, 18, 0),
    invoice: null,
    lines: [
      { item: 'EL-330', qty: 20, godown: 'Main Godown', shelf: 'R3-C' },
      { item: 'EL-512', qty: 6, godown: 'Main Godown', shelf: 'R4-A' },
    ],
  },
  {
    id: 'ORD-1033', party: 'coastal', placedAt: day(0, 10, 15), dispatchBy: day(1, 11, 0),
    invoice: { no: 'INV-2612', date: day(0, 10, 30) },
    lines: [
      { item: 'EL-707', qty: 10, godown: 'Main Godown', shelf: 'R5-B' },
      { item: 'EL-118', qty: 12, godown: 'Main Godown', shelf: 'R1-D' },
    ],
  },
  // Earlier orders used by the scripted sample cases
  {
    id: 'ORD-1027', party: 'coastal', placedAt: day(-1, 10, 0), dispatchBy: day(-1, 17, 0),
    invoice: { no: 'INV-2598', date: day(-1, 10, 20) },
    lines: [{ item: 'EL-214', qty: 100, godown: 'Main Godown', shelf: 'R1-A' }],
  },
  {
    id: 'ORD-1029', party: 'vinayaka', placedAt: day(0, 8, 30), dispatchBy: day(0, 16, 0),
    invoice: null,
    lines: [{ item: 'EL-118', qty: 12, godown: 'Main Godown', shelf: 'R1-D' }],
  },
];

// Scripted history so the Owner and Accountant screens are not empty on first open.
// They run through the same reducer as live actions, so their numbers obey the same rules.
export const SCRIPT = [
  { type: 'REPORT_SHORT', orderId: 'ORD-1027', lineIdx: 0, found: 90, reason: 'not_found', at: day(-1, 11, 2) },
  { type: 'SEARCH_RESULT', caseId: 'CASE-0001', locKey: '__all__', result: 'not_here', at: day(-1, 11, 9) },
  { type: 'DECIDE', caseId: 'CASE-0001', outcome: 'partial', at: day(-1, 11, 25), actor: 'Owner' },
  { type: 'MESSAGE_SENT', caseId: 'CASE-0001', at: day(-1, 11, 27), actor: 'Owner' },
  { type: 'REPORT_SHORT', orderId: 'ORD-1029', lineIdx: 0, found: 8, reason: 'damaged', at: day(0, 9, 5) },
  { type: 'SEARCH_RESULT', caseId: 'CASE-0002', locKey: '__all__', result: 'not_here', at: day(0, 9, 14) },
];

export const DEFAULT_SETTINGS = {
  searchMinutes: 10,
  eInvoicing: true,
  languages: { en: true, hi: true, kn: true },
};
