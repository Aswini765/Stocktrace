/**
 * StockTrace — External Inventory & Ingestion Adapter
 * Input boundary for WMS, ERP, and CSV/Excel tabular data.
 * 
 * Converts raw enterprise records into normalized StockTrace case and evidence models.
 */

import { HarnessCaseModel } from './types';
import { RawScannerInput } from './evidence_normalizer';

export interface ExternalWmsRecord {
  order_id: string;
  sku: string;
  item_name?: string;
  assigned_bin: string;
  quantity_required: number;
  pick_status: 'OPEN' | 'FAILED' | 'SHORT' | 'COMPLETED';
  last_wms_scan_time?: string;
  scanner_device_id?: string;
  destination_zone?: string;
}

export interface ExternalErpItem {
  part_number: string;
  description: string;
  primary_bin: string;
  on_hand_units: number;
  allocated_units: number;
  last_cycle_count?: string;
}

export interface ExternalCsvRow {
  case_id?: string;
  sku: string;
  item_name?: string;
  expected_location: string;
  quantity?: number | string;
  reported_at?: string;
}

/**
 * Adapts an external WMS picking exception into a normalized StockTrace case.
 */
export function adaptWmsRecordToCase(wms: ExternalWmsRecord): HarnessCaseModel {
  const now = new Date().toISOString();
  return {
    case_id: `CASE-WMS-${wms.order_id}`,
    sku: wms.sku,
    item_name: wms.item_name || `WMS Item ${wms.sku}`,
    expected_location: wms.assigned_bin,
    expected_quantity: wms.quantity_required,
    failed_at: wms.last_wms_scan_time || now,
    status: 'FAILED_PICK',
    scanner_evidence: [],
    camera_evidence: [],
    candidate_locations: [],
    created_at: now,
    updated_at: now,
  };
}

/**
 * Extracts raw scanner transaction inputs from a WMS event.
 */
export function adaptWmsToScannerInput(wms: ExternalWmsRecord): RawScannerInput | null {
  if (!wms.last_wms_scan_time) return null;
  return {
    sku: wms.sku,
    time: wms.last_wms_scan_time,
    location: wms.assigned_bin,
    fromLocation: wms.assigned_bin,
    toLocation: wms.destination_zone || '—',
    qty: wms.quantity_required,
    type: 'WMS_PICK_ATTEMPT',
    scannerId: wms.scanner_device_id || 'WMS-RF-GUN',
  };
}

/**
 * Adapts an ERP item catalog row into a StockTrace case model.
 */
export function adaptErpRecordToCase(erp: ExternalErpItem, caseId?: string): HarnessCaseModel {
  const now = new Date().toISOString();
  return {
    case_id: caseId || `CASE-ERP-${erp.part_number}`,
    sku: erp.part_number,
    item_name: erp.description,
    expected_location: erp.primary_bin,
    expected_quantity: Math.max(1, erp.allocated_units || 1),
    failed_at: erp.last_cycle_count || now,
    status: 'FAILED_PICK',
    scanner_evidence: [],
    camera_evidence: [],
    candidate_locations: [],
    created_at: now,
    updated_at: now,
  };
}

/**
 * Adapts a tabular CSV row into a StockTrace case model.
 */
export function adaptCsvRowToCase(row: ExternalCsvRow, fallbackId?: string): HarnessCaseModel {
  const now = new Date().toISOString();
  const parsedQty = typeof row.quantity === 'number' ? row.quantity : parseInt(String(row.quantity || '1'), 10) || 1;
  return {
    case_id: row.case_id || fallbackId || `CASE-CSV-${row.sku}-${Date.now()}`,
    sku: row.sku,
    item_name: row.item_name || `Inventory Item ${row.sku}`,
    expected_location: row.expected_location,
    expected_quantity: parsedQty,
    failed_at: row.reported_at || now,
    status: 'FAILED_PICK',
    scanner_evidence: [],
    camera_evidence: [],
    candidate_locations: [],
    created_at: now,
    updated_at: now,
  };
}
