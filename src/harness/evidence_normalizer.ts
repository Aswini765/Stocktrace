/**
 * StockTrace — Evidence Normalization Layer
 * Normalizes disparate scanner and camera records into a common structure.
 * 
 * Rules:
 * - Missing fields remain missing (undefined/null, never fabricated).
 * - Never invent evidence, timestamps, or locations.
 * - Never treat absence of evidence as evidence of absence.
 * - Never claim that inventory is physically present.
 */

import { NormalizedEvidence, ScannerEvidence, CameraEvidenceEvent } from './types';

export interface RawScannerInput {
  time?: string;
  timestamp?: string;
  sku: string;
  fromLocation?: string;
  toLocation?: string;
  location?: string;
  qty?: number;
  quantity?: number;
  type?: string;
  movement_type?: string;
  scannerId?: string;
  transaction_id?: string;
  status?: string;
}

export interface RawCameraInput {
  camera?: string;
  camera_id?: string;
  exactTime?: string;
  timestamp?: string;
  timeRange?: string;
  statusText?: string;
  eventDescription?: string;
  movement_type?: string;
  fromLocation?: string;
  source_location?: string;
  toLocation?: string;
  destination_location?: string;
  sku?: string;
  worker_id_or_device_id?: string;
  confidence?: number;
  video_reference?: string;
  frameVisualType?: string;
}

/**
 * Normalizes a scanner transaction or raw scanner payload into NormalizedEvidence.
 */
export function normalizeScannerEvidence(raw: RawScannerInput | ScannerEvidence): NormalizedEvidence {
  const destination = 
    ('destination' in raw && raw.destination) ||
    ('toLocation' in raw && raw.toLocation && raw.toLocation !== '—' ? raw.toLocation : undefined) ||
    ('location' in raw && raw.location ? raw.location : undefined);

  const source = 
    ('source' in raw && raw.source && raw.source !== '—' ? raw.source : undefined) ||
    ('fromLocation' in raw && raw.fromLocation && raw.fromLocation !== '—' ? raw.fromLocation : undefined);

  const timestamp = 
    ('timestamp' in raw && raw.timestamp ? raw.timestamp : undefined) ||
    ('time' in raw && raw.time ? raw.time : '');

  const eventType = 
    ('movement_type' in raw && raw.movement_type ? String(raw.movement_type) : undefined) ||
    ('type' in raw && raw.type ? raw.type : 'Movement');

  const sourceId = 
    ('scannerId' in raw && raw.scannerId ? raw.scannerId : undefined) ||
    ('transaction_id' in raw && raw.transaction_id ? raw.transaction_id : 'SCANNER-SYS');

  return {
    source_type: 'scanner',
    sku: raw.sku,
    source_location: source,
    destination_location: destination || 'UNKNOWN',
    timestamp: timestamp,
    event_type: eventType,
    status: 'recorded',
    source_id: sourceId,
    confidence: 1.0, // System recorded transactions have authoritative record confidence
    notes: `Recorded in warehouse system (${eventType})`,
  };
}

/**
 * Normalizes a camera event or raw camera payload into NormalizedEvidence.
 */
export function normalizeCameraEvidence(raw: RawCameraInput | CameraEvidenceEvent): NormalizedEvidence {
  const eventDesc = ('eventDescription' in raw && typeof raw.eventDescription === 'string') ? raw.eventDescription : undefined;
  const statusTxt = ('statusText' in raw && typeof raw.statusText === 'string') ? raw.statusText : undefined;

  // Extract destination if observed
  let destination = 
    ('destination_location' in raw && raw.destination_location ? raw.destination_location : undefined) ||
    ('toLocation' in raw && raw.toLocation ? raw.toLocation : undefined);

  // If destination is not explicit, parse observed description without inventing
  if (!destination && eventDesc) {
    const towardMatch = eventDesc.match(/toward\s+([A-Z0-9]+)/i);
    const nearMatch = eventDesc.match(/near\s+([A-Z0-9]+)/i);
    if (towardMatch) {
      destination = towardMatch[1].toUpperCase();
    } else if (nearMatch) {
      destination = nearMatch[1].toUpperCase();
    }
  }

  // Extract source if observed
  let source = 
    ('source_location' in raw && raw.source_location ? raw.source_location : undefined) ||
    ('fromLocation' in raw && raw.fromLocation ? raw.fromLocation : undefined);

  if (!source && eventDesc) {
    const leavingMatch = eventDesc.match(/leaving\s+([A-Z0-9]+)/i);
    if (leavingMatch) {
      source = leavingMatch[1].toUpperCase();
    }
  }

  const cameraId = 
    ('camera_id' in raw && raw.camera_id ? raw.camera_id : undefined) ||
    ('camera' in raw && raw.camera ? raw.camera : 'CAM-UNKNOWN');

  const timestamp = 
    ('timestamp' in raw && raw.timestamp ? raw.timestamp : undefined) ||
    ('exactTime' in raw && raw.exactTime ? raw.exactTime : undefined) ||
    ('timeRange' in raw && raw.timeRange ? raw.timeRange : '');

  const visualConfidence = 
    typeof raw.confidence === 'number' ? raw.confidence : 0.85;

  const videoRef = 
    ('video_reference' in raw && raw.video_reference ? raw.video_reference : undefined) ||
    ('frameVisualType' in raw && raw.frameVisualType ? raw.frameVisualType : undefined) ||
    ('camera' in raw ? raw.camera : undefined);

  // Worker attribution if present — neutral wording only (Rule 11)
  let workerNote: string | undefined = undefined;
  if (raw.worker_id_or_device_id) {
    workerNote = `Movement is visually associated with Worker ID ${raw.worker_id_or_device_id}.`;
  }

  return {
    source_type: 'camera',
    sku: raw.sku || '',
    source_location: source,
    destination_location: destination || 'OBSERVED_TRANSIT',
    timestamp: timestamp,
    event_type: eventDesc || statusTxt || ('movement_type' in raw ? raw.movement_type : 'Visual observation') || 'Visual observation',
    status: 'observed',
    source_id: cameraId,
    confidence: visualConfidence,
    video_reference: videoRef,
    notes: workerNote,
  };
}

/**
 * Normalizes arrays of scanner and camera inputs.
 */
export function normalizeEvidenceCollection(
  scanners: (RawScannerInput | ScannerEvidence)[],
  cameras: (RawCameraInput | CameraEvidenceEvent)[]
): NormalizedEvidence[] {
  const normalizedScanners = (scanners || []).map(normalizeScannerEvidence);
  const normalizedCameras = (cameras || []).map(normalizeCameraEvidence);
  return [...normalizedScanners, ...normalizedCameras];
}
