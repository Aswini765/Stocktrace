import { COMPANY, ITEMS, PARTIES } from '../data/seed.ts';
import { taxLines } from './tax.ts';
import { tallyDate } from './format.ts';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const amt = (n) => Number(n).toFixed(2);

// Draft Tally XML for a posted voucher. Ledger names (Sales, Output CGST, ...) must match the
// company's own ledgers: import into a test company first. This is a starting point, not a certified integration.
export function voucherXml(d) {
  const date = tallyDate(d.postedAt || d.createdAt);
  let body = '';
  if (d.type === 'credit_note' || d.type === 'sales_invoice') {
    const p = PARTIES[d.party];
    const t = taxLines(d.lines, p);
    const isCN = d.type === 'credit_note';
    const partySign = isCN ? '' : '-';
    const inv = t.rows.map((r) => {
      const it = ITEMS[r.item];
      return `
        <ALLINVENTORYENTRIES.LIST>
          <STOCKITEMNAME>${esc(it.name)}</STOCKITEMNAME>
          <ISDEEMEDPOSITIVE>${isCN ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
          <RATE>${amt(r.rate)}/${esc(it.unit)}</RATE>
          <AMOUNT>${isCN ? '-' : ''}${amt(r.value)}</AMOUNT>
          <ACTUALQTY> ${r.qty} ${esc(it.unit)}</ACTUALQTY>
          <BILLEDQTY> ${r.qty} ${esc(it.unit)}</BILLEDQTY>
          <ACCOUNTINGALLOCATIONS.LIST>
            <LEDGERNAME>Sales</LEDGERNAME>
            <ISDEEMEDPOSITIVE>${isCN ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
            <AMOUNT>${isCN ? '-' : ''}${amt(r.value)}</AMOUNT>
          </ACCOUNTINGALLOCATIONS.LIST>
        </ALLINVENTORYENTRIES.LIST>`;
    }).join('');
    const taxLedger = (name, v) => v ? `
        <LEDGERENTRIES.LIST>
          <LEDGERNAME>${name}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>${isCN ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
          <AMOUNT>${isCN ? '-' : ''}${amt(v)}</AMOUNT>
        </LEDGERENTRIES.LIST>` : '';
    body = `
      <VOUCHER VCHTYPE="${isCN ? 'Credit Note' : 'Sales'}" ACTION="Create" OBJVIEW="Invoice Voucher View">
        <DATE>${date}</DATE>
        <VOUCHERTYPENAME>${isCN ? 'Credit Note' : 'Sales'}</VOUCHERTYPENAME>
        <VOUCHERNUMBER>${esc(d.voucherNo || d.id)}</VOUCHERNUMBER>
        <PARTYLEDGERNAME>${esc(p.name)}</PARTYLEDGERNAME>
        <PARTYGSTIN>${esc(p.gstin)}</PARTYGSTIN>
        <PLACEOFSUPPLY>${esc(p.state)}</PLACEOFSUPPLY>
        <ISINVOICE>Yes</ISINVOICE>${isCN ? `
        <REFERENCE>${esc(d.original.no)}</REFERENCE>
        <REFERENCEDATE>${tallyDate(d.original.date)}</REFERENCEDATE>` : ''}
        <NARRATION>${esc(d.narration)}</NARRATION>
        <LEDGERENTRIES.LIST>
          <LEDGERNAME>${esc(p.name)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>${isCN ? 'No' : 'Yes'}</ISDEEMEDPOSITIVE>
          <AMOUNT>${partySign}${amt(t.total)}</AMOUNT>
        </LEDGERENTRIES.LIST>${taxLedger('Output CGST', t.cgst)}${taxLedger('Output SGST', t.sgst)}${taxLedger('Output IGST', t.igst)}${inv}
      </VOUCHER>`;
  } else if (d.type === 'stock_journal') {
    const it = ITEMS[d.item];
    const [g] = d.from.split(' / ');
    body = `
      <VOUCHER VCHTYPE="Stock Journal" ACTION="Create">
        <DATE>${date}</DATE>
        <VOUCHERTYPENAME>Stock Journal</VOUCHERTYPENAME>
        <VOUCHERNUMBER>${esc(d.voucherNo || d.id)}</VOUCHERNUMBER>
        <NARRATION>${esc(d.narration)}</NARRATION>
        <INVENTORYENTRIESOUT.LIST>
          <STOCKITEMNAME>${esc(it.name)}</STOCKITEMNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <ACTUALQTY> ${d.qty} ${esc(it.unit)}</ACTUALQTY>
          <BATCHALLOCATIONS.LIST><GODOWNNAME>${esc(g)}</GODOWNNAME><ACTUALQTY> ${d.qty} ${esc(it.unit)}</ACTUALQTY></BATCHALLOCATIONS.LIST>
        </INVENTORYENTRIESOUT.LIST>
        <INVENTORYENTRIESIN.LIST>
          <STOCKITEMNAME>${esc(it.name)}</STOCKITEMNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <ACTUALQTY> ${d.qty} ${esc(it.unit)}</ACTUALQTY>
          <BATCHALLOCATIONS.LIST><GODOWNNAME>${esc(d.to)}</GODOWNNAME><ACTUALQTY> ${d.qty} ${esc(it.unit)}</ACTUALQTY></BATCHALLOCATIONS.LIST>
        </INVENTORYENTRIESIN.LIST>
      </VOUCHER>`;
  } else if (d.type === 'physical_stock') {
    const it = ITEMS[d.item];
    body = `
      <VOUCHER VCHTYPE="Physical Stock" ACTION="Create">
        <DATE>${date}</DATE>
        <VOUCHERTYPENAME>Physical Stock</VOUCHERTYPENAME>
        <VOUCHERNUMBER>${esc(d.voucherNo || d.id)}</VOUCHERNUMBER>
        <NARRATION>${esc(d.narration)}</NARRATION>
        <INVENTORYENTRIESIN.LIST>
          <STOCKITEMNAME>${esc(it.name)}</STOCKITEMNAME>
          <ACTUALQTY> ${d.counted} ${esc(it.unit)}</ACTUALQTY>
          <BATCHALLOCATIONS.LIST><GODOWNNAME>${esc(d.godown)}</GODOWNNAME><ACTUALQTY> ${d.counted} ${esc(it.unit)}</ACTUALQTY></BATCHALLOCATIONS.LIST>
        </INVENTORYENTRIESIN.LIST>
      </VOUCHER>`;
  }
  return `<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES><SVCURRENTCOMPANY>${esc(COMPANY.name)}</SVCURRENTCOMPANY></STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">${body}
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
`;
}

export async function download(filename, text, type = 'application/xml') {
  // Inside a claude.ai artifact preview, files go through the viewer's downloads capability.
  const host = (window as any).claude;
  if (host?.use) {
    try {
      const dl = await host.use('downloads');
      if (dl) { await dl.save({ filename, data: text }); return; }
    } catch { /* declined or unavailable: fall back below */ }
  }
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
