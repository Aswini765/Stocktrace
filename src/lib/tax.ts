import { COMPANY } from '../data/seed.ts';

const round2 = (n) => Math.round(n * 100) / 100;

// GST split: same state -> CGST + SGST, different state -> IGST
export function taxLines(lines, party) {
  const intra = party.state === COMPANY.state;
  let taxable = 0, cgst = 0, sgst = 0, igst = 0;
  const rows = lines.map((l) => {
    const value = round2(l.qty * l.rate);
    const tax = round2((value * l.gst) / 100);
    taxable += value;
    if (intra) { cgst += tax / 2; sgst += tax / 2; } else { igst += tax; }
    return { ...l, value };
  });
  cgst = round2(cgst); sgst = round2(sgst); igst = round2(igst); taxable = round2(taxable);
  return { rows, intra, taxable, cgst, sgst, igst, total: round2(taxable + cgst + sgst + igst) };
}

// CGST s.34(2): a credit note must be declared by 30 November after the end of the
// financial year of the original supply, or the annual return date, whichever is earlier.
export function creditNoteDeadline(invoiceDateMs) {
  const d = new Date(invoiceDateMs);
  const fyEndYear = d.getMonth() >= 3 ? d.getFullYear() + 1 : d.getFullYear();
  return new Date(fyEndYear, 10, 30, 23, 59).getTime();
}

export const daysLeft = (deadlineMs, now = Date.now()) => Math.ceil((deadlineMs - now) / 86400000);
