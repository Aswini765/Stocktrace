import React from 'react';

interface CameraFrameGraphicProps {
  type: 'a12' | 'aisle3' | 'b07' | 'c03' | 'empty';
  cameraName: string;
  timestamp: string;
  date?: string;
  eventNote: string;
  isInspecting?: boolean;
  playProgress?: number; // 0 to 100
  isPlaying?: boolean;
  sourceLocation?: string;
  targetLocation?: string;
  sku?: string;
}

export const CameraFrameGraphic: React.FC<CameraFrameGraphicProps> = ({
  type,
  cameraName,
  timestamp,
  date = '16 Sep 2026',
  eventNote,
  playProgress = 25,
  isPlaying = false,
  sourceLocation = 'A12',
  targetLocation = 'B07',
  sku = 'SKU-1042',
}) => {
  const progressRatio = Math.max(0, Math.min(100, playProgress)) / 100;

  // Calculate dynamic second & millisecond counter for realistic CCTV OSD
  // Assuming a clip span from e.g. 14:32:00 to 14:35:00 or current timestamp
  const baseSeconds = Math.floor(progressRatio * 180); // 3-minute simulated window (180s)
  const clipMins = Math.floor(baseSeconds / 60);
  const clipSecs = baseSeconds % 60;
  const milli = Math.floor((progressRatio * 1000) % 100);
  const formattedMilli = milli < 10 ? `0${milli}` : `${milli}`;

  // Time format for CCTV OSD (e.g., "16-SEP-2026 14:34:28.45")
  const parseBaseTime = () => {
    // If timestamp is like "2:35 PM" or "14:35", calculate start time 2:32 PM
    let h = 14;
    let m = 32;
    const match = timestamp.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      let parsedH = parseInt(match[1], 10);
      const parsedM = parseInt(match[2], 10);
      if (timestamp.toLowerCase().includes('pm') && parsedH < 12) parsedH += 12;
      h = parsedH;
      m = Math.max(0, parsedM - 3); // 3 mins earlier for start
    }
    const totalSecs = (h * 3600) + (m * 60) + baseSeconds;
    const curH = Math.floor(totalSecs / 3600) % 24;
    const curM = Math.floor((totalSecs % 3600) / 60);
    const curS = totalSecs % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(curH)}:${pad(curM)}:${pad(curS)}.${formattedMilli}`;
  };

  const cctvClock = parseBaseTime();
  const dateFormatted = date.toUpperCase();

  // Perspective calculation for moving picker cart & carton in the warehouse aisle
  // Coordinate space: 1000 x 562.5 (16:9)
  // Vanishing point: (500, 210)
  // A12 starts at bottom-left foreground (x: 290, y: 440, scale: 1.0)
  // Moves down the aisle toward B07 at mid-right (x: 580, y: 280, scale: 0.68)
  const startX = type === 'b07' ? 520 : (type === 'a12' ? 260 : 310);
  const endX = type === 'b07' ? 620 : (type === 'a12' ? 390 : 590);
  const startY = type === 'b07' ? 330 : (type === 'a12' ? 440 : 420);
  const endY = type === 'b07' ? 300 : (type === 'a12' ? 380 : 275);
  const startScale = type === 'b07' ? 0.78 : (type === 'a12' ? 1.05 : 0.98);
  const endScale = type === 'b07' ? 0.70 : (type === 'a12' ? 0.90 : 0.65);

  const currentX = startX + (endX - startX) * progressRatio;
  const currentY = startY + (endY - startY) * progressRatio;
  const currentScale = startScale + (endScale - startScale) * progressRatio;

  return (
    <div
      id={`cctv-viewer-${cameraName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      className="relative w-full aspect-video bg-neutral-950 overflow-hidden select-none font-mono"
      style={{
        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.85)',
      }}
    >
      {/* ========================================================================= */}
      {/* REALISTIC WAREHOUSE CCTV SCENE (High-Detail SVG Vector Environment) */}
      {/* ========================================================================= */}
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1000 562.5"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Concrete floor gradient with high-bay lighting reflection */}
          <linearGradient id="floorGrad" x1="500" y1="210" x2="500" y2="562.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#181b1f" />
            <stop offset="40%" stopColor="#252a30" />
            <stop offset="70%" stopColor="#2d333a" />
            <stop offset="100%" stopColor="#1f2328" />
          </linearGradient>

          {/* Polished aisle center light reflection */}
          <radialGradient id="aisleSheen" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.09" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.03" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* High-bay warehouse ceiling */}
          <linearGradient id="ceilingGrad" x1="0" y1="0" x2="0" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0d0f12" />
            <stop offset="100%" stopColor="#17191d" />
          </linearGradient>

          {/* Pallet Rack Steel Upright Blue */}
          <linearGradient id="uprightBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="50%" stopColor="#2b5282" />
            <stop offset="100%" stopColor="#162c47" />
          </linearGradient>

          {/* Pallet Rack Safety Orange Beam */}
          <linearGradient id="orangeBeam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="40%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </linearGradient>

          {/* Cardboard Kraft Box Colors */}
          <linearGradient id="boxKraft1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c59b6d" />
            <stop offset="100%" stopColor="#9a7147" />
          </linearGradient>
          <linearGradient id="boxKraft2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b48858" />
            <stop offset="100%" stopColor="#875e35" />
          </linearGradient>

          {/* Wood Pallet Planks */}
          <linearGradient id="woodPallet" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a37e55" />
            <stop offset="50%" stopColor="#82623e" />
            <stop offset="100%" stopColor="#5c4327" />
          </linearGradient>

          {/* High-Bay Light Beam Glow */}
          <linearGradient id="lightCone" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="30%" stopColor="#f8fafc" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
          </linearGradient>

          {/* CCTV Scanline Pattern */}
          <pattern id="scanlines" width="100" height="4" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="100" y2="0" stroke="#000000" strokeWidth="1" opacity="0.35" />
          </pattern>
        </defs>

        {/* 1. Ceiling & Structure */}
        <rect x="0" y="0" width="1000" height="210" fill="url(#ceilingGrad)" />
        {/* Steel roof trusses & conduits */}
        <line x1="0" y1="40" x2="1000" y2="40" stroke="#262a30" strokeWidth="2" />
        <line x1="0" y1="90" x2="1000" y2="90" stroke="#1f2327" strokeWidth="3" />
        <line x1="0" y1="140" x2="1000" y2="140" stroke="#1b1e22" strokeWidth="1.5" />
        {/* Diagonal roof braces */}
        <line x1="120" y1="0" x2="500" y2="210" stroke="#22262c" strokeWidth="1.5" strokeDasharray="8 6" />
        <line x1="880" y1="0" x2="500" y2="210" stroke="#22262c" strokeWidth="1.5" strokeDasharray="8 6" />

        {/* 2. High-Bay Warehouse LED Luminaires */}
        {/* Far Light (at vanishing point) */}
        <polygon points="485,170 515,170 528,215 472,215" fill="url(#lightCone)" />
        <rect x="490" y="165" width="20" height="5" fill="#f8fafc" rx="1" />
        {/* Mid-Distance Light */}
        <polygon points="475,115 525,115 560,250 440,250" fill="url(#lightCone)" />
        <rect x="480" y="110" width="40" height="7" fill="#ffffff" rx="1.5" />
        {/* Foreground High-Bay Light */}
        <polygon points="460,40 540,40 620,380 380,380" fill="url(#lightCone)" />
        <rect x="465" y="32" width="70" height="10" fill="#ffffff" rx="2" />

        {/* 3. Polished Industrial Concrete Floor */}
        <polygon points="0,562.5 1000,562.5 530,210 470,210" fill="url(#floorGrad)" />
        {/* Surface light sheen pool */}
        <polygon points="340,562.5 660,562.5 515,210 485,210" fill="url(#aisleSheen)" />

        {/* Concrete Expansion Floor Joints */}
        <line x1="180" y1="562.5" x2="480" y2="210" stroke="#15171a" strokeWidth="1.5" />
        <line x1="820" y1="562.5" x2="520" y2="210" stroke="#15171a" strokeWidth="1.5" />
        <line x1="0" y1="460" x2="1000" y2="460" stroke="#191c20" strokeWidth="1" />
        <line x1="120" y1="350" x2="880" y2="350" stroke="#191c20" strokeWidth="0.8" />
        <line x1="280" y1="270" x2="720" y2="270" stroke="#191c20" strokeWidth="0.5" />

        {/* Yellow Epoxy Safety Lane Guide Markings */}
        {/* Left aisle edge line */}
        <line x1="280" y1="562.5" x2="475" y2="210" stroke="#ca8a04" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
        <line x1="310" y1="562.5" x2="480" y2="210" stroke="#ca8a04" strokeWidth="2.5" strokeDasharray="14 10" opacity="0.65" />
        {/* Right aisle edge line */}
        <line x1="720" y1="562.5" x2="525" y2="210" stroke="#ca8a04" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
        <line x1="690" y1="562.5" x2="520" y2="210" stroke="#ca8a04" strokeWidth="2.5" strokeDasharray="14 10" opacity="0.65" />

        {/* Floor Stencil: "AISLE 03" */}
        <g transform="translate(435, 390) skewX(-24) scale(1, 0.45)" opacity="0.45">
          <text x="0" y="0" fill="#ca8a04" fontSize="32" fontWeight="900" letterSpacing="4">
            AISLE 03
          </text>
        </g>
        {/* Floor Stencil: Speed Limit / Walkway */}
        <g transform="translate(460, 480) skewX(-16) scale(1, 0.4)" opacity="0.35">
          <text x="0" y="0" fill="#94a3b8" fontSize="28" fontWeight="800" letterSpacing="3">
            SLOW / PEDESTRIAN LANE
          </text>
        </g>

        {/* 4. LEFT PALLET RACKING STRUCTURE (Bay A12, A11, A10) */}
        {/* Rack Backdrop */}
        <polygon points="0,0 240,140 240,240 0,562.5" fill="#0f141a" opacity="0.9" />

        {/* Left Pallet Rack Uprights (Vertical Industrial Columns) */}
        {/* Upright 1 (Foreground Left) */}
        <rect x="20" y="10" width="22" height="552" fill="url(#uprightBlue)" stroke="#0f243d" strokeWidth="1" />
        <rect x="42" y="10" width="8" height="552" fill="#13273e" />
        {/* Upright 2 (Mid-Left - Bay A12) */}
        <rect x="140" y="90" width="16" height="420" fill="url(#uprightBlue)" stroke="#0f243d" strokeWidth="1" />
        {/* Upright 3 (Far-Left) */}
        <rect x="250" y="145" width="12" height="310" fill="url(#uprightBlue)" stroke="#0f243d" strokeWidth="0.8" />
        {/* Upright 4 (Deep corridor) */}
        <rect x="340" y="180" width="9" height="200" fill="url(#uprightBlue)" opacity="0.75" />
        <rect x="410" y="198" width="6" height="110" fill="url(#uprightBlue)" opacity="0.55" />

        {/* Left Pallet Rack Crossbeams (Safety Orange Heavy Steel) */}
        {/* Tier 1 (Lowest beam) */}
        <polygon points="0,485 150,440 260,395 348,348 415,285 415,277 348,340 260,387 150,432 0,477" fill="url(#orangeBeam)" stroke="#7c2d12" strokeWidth="1" />
        {/* Tier 2 (Middle beam) */}
        <polygon points="0,350 150,310 260,275 348,245 415,225 415,218 348,238 260,268 150,303 0,343" fill="url(#orangeBeam)" stroke="#7c2d12" strokeWidth="1" />
        {/* Tier 3 (High beam) */}
        <polygon points="0,210 150,185 260,165 348,150 415,140 415,134 348,144 260,159 150,179 0,204" fill="url(#orangeBeam)" stroke="#7c2d12" strokeWidth="1" />
        {/* Tier 4 (Top beam) */}
        <polygon points="0,85 150,75 260,70 348,68 415,68 415,62 348,62 260,64 150,69 0,79" fill="url(#orangeBeam)" stroke="#7c2d12" strokeWidth="1" />

        {/* GOODS STORED ON LEFT RACKS (Wooden Pallets + Stacked Boxes) */}
        {/* Bay A12 - Tier 1 (Near Ground - Source Location) */}
        {/* Wooden Pallet Base */}
        <rect x="30" y="468" width="95" height="12" fill="url(#woodPallet)" rx="1" />
        <rect x="36" y="474" width="10" height="6" fill="#1c1917" />
        <rect x="72" y="474" width="10" height="6" fill="#1c1917" />
        <rect x="108" y="474" width="10" height="6" fill="#1c1917" />
        {/* Stacked Kraft Cartons in A12 */}
        <rect x="35" y="405" width="48" height="63" fill="url(#boxKraft1)" stroke="#573a1d" strokeWidth="0.8" />
        <rect x="85" y="395" width="42" height="73" fill="url(#boxKraft2)" stroke="#573a1d" strokeWidth="0.8" />
        {/* Shipping labels on boxes */}
        <rect x="42" y="418" width="20" height="12" fill="#f8fafc" rx="1" />
        <line x1="45" y1="422" x2="58" y2="422" stroke="#0f172a" strokeWidth="1" />
        <line x1="45" y1="425" x2="55" y2="425" stroke="#0f172a" strokeWidth="1" />
        <line x1="45" y1="427" x2="59" y2="427" stroke="#0f172a" strokeWidth="1" />
        <rect x="92" y="410" width="18" height="10" fill="#f8fafc" rx="1" />

        {/* Bay A12 - Tier 2 (Eye level) */}
        <rect x="30" y="335" width="95" height="10" fill="url(#woodPallet)" />
        <rect x="32" y="275" width="44" height="60" fill="url(#boxKraft2)" stroke="#573a1d" strokeWidth="0.8" />
        <rect x="78" y="260" width="48" height="75" fill="url(#boxKraft1)" stroke="#573a1d" strokeWidth="0.8" />
        <rect x="38" y="285" width="16" height="9" fill="#f8fafc" rx="1" />
        <rect x="86" y="275" width="16" height="9" fill="#f8fafc" rx="1" />

        {/* Bay A11 / Mid-Left Goods */}
        <rect x="155" y="300" width="75" height="9" fill="url(#woodPallet)" />
        <rect x="158" y="250" width="34" height="50" fill="url(#boxKraft1)" stroke="#573a1d" strokeWidth="0.5" />
        <rect x="194" y="240" width="36" height="60" fill="url(#boxKraft2)" stroke="#573a1d" strokeWidth="0.5" />

        {/* BAY A12 HIGH-VISIBILITY RACK SIGN (Industrial Warehouse Plate) */}
        <g transform="translate(130, 205)">
          {/* Mounting bracket */}
          <rect x="8" y="-12" width="4" height="14" fill="#64748b" />
          {/* High-visibility yellow rack placard */}
          <rect x="-10" y="2" width="72" height="34" fill="#facc15" stroke="#000000" strokeWidth="2.5" rx="3" />
          <rect x="-8" y="4" width="68" height="30" fill="none" stroke="#000000" strokeWidth="0.8" />
          <text x="26" y="23" fill="#000000" fontSize="15" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
            BAY A12
          </text>
          <text x="26" y="31" fill="#422006" fontSize="7" fontWeight="800" textAnchor="middle">
            AISLE 3 · ZONE 1
          </text>
        </g>


        {/* 5. RIGHT PALLET RACKING STRUCTURE (Bay B06, B07, B08) */}
        {/* Rack Backdrop */}
        <polygon points="1000,0 760,140 760,240 1000,562.5" fill="#0f141a" opacity="0.9" />

        {/* Right Pallet Rack Uprights */}
        {/* Upright 1 (Foreground Right) */}
        <rect x="955" y="10" width="24" height="552" fill="url(#uprightBlue)" stroke="#0f243d" strokeWidth="1" />
        <rect x="950" y="10" width="8" height="552" fill="#13273e" />
        {/* Upright 2 (Mid-Right - Bay B07 area) */}
        <rect x="840" y="90" width="17" height="420" fill="url(#uprightBlue)" stroke="#0f243d" strokeWidth="1" />
        {/* Upright 3 (Mid-Deep Right) */}
        <rect x="735" y="145" width="13" height="310" fill="url(#uprightBlue)" stroke="#0f243d" strokeWidth="0.8" />
        {/* Upright 4 (Deep corridor) */}
        <rect x="645" y="180" width="9" height="200" fill="url(#uprightBlue)" opacity="0.75" />
        <rect x="580" y="198" width="6" height="110" fill="url(#uprightBlue)" opacity="0.55" />

        {/* Right Pallet Rack Crossbeams (Safety Orange) */}
        {/* Tier 1 (Lowest beam) */}
        <polygon points="1000,485 850,440 740,395 652,348 585,285 585,277 652,340 740,387 850,432 1000,477" fill="url(#orangeBeam)" stroke="#7c2d12" strokeWidth="1" />
        {/* Tier 2 (Middle beam) */}
        <polygon points="1000,350 850,310 740,275 652,245 585,225 585,218 652,238 740,268 850,303 1000,343" fill="url(#orangeBeam)" stroke="#7c2d12" strokeWidth="1" />
        {/* Tier 3 (High beam) */}
        <polygon points="1000,210 850,185 740,165 652,150 585,140 585,134 652,144 740,159 850,179 1000,204" fill="url(#orangeBeam)" stroke="#7c2d12" strokeWidth="1" />
        {/* Tier 4 (Top beam) */}
        <polygon points="1000,85 850,75 740,70 652,68 585,68 585,62 652,62 740,64 850,69 1000,79" fill="url(#orangeBeam)" stroke="#7c2d12" strokeWidth="1" />

        {/* GOODS STORED ON RIGHT RACKS */}
        {/* Bay B06 (Foreground right) */}
        <rect x="875" y="468" width="80" height="12" fill="url(#woodPallet)" />
        <rect x="880" y="395" width="40" height="73" fill="url(#boxKraft2)" stroke="#573a1d" strokeWidth="0.8" />
        <rect x="922" y="415" width="38" height="53" fill="url(#boxKraft1)" stroke="#573a1d" strokeWidth="0.8" />
        <rect x="886" y="410" width="18" height="10" fill="#f8fafc" rx="1" />

        {/* Bay B07 (Destination Bay - Mid-Right) */}
        <rect x="750" y="390" width="85" height="10" fill="url(#woodPallet)" />
        <rect x="755" y="335" width="42" height="55" fill="url(#boxKraft1)" stroke="#573a1d" strokeWidth="0.6" />
        <rect x="800" y="345" width="36" height="45" fill="url(#boxKraft2)" stroke="#573a1d" strokeWidth="0.6" />
        <rect x="762" y="350" width="16" height="8" fill="#f8fafc" rx="1" />

        {/* BAY B07 HIGH-VISIBILITY RACK SIGN */}
        <g transform="translate(745, 230)">
          <rect x="18" y="-12" width="4" height="14" fill="#64748b" />
          <rect x="0" y="2" width="72" height="34" fill="#facc15" stroke="#000000" strokeWidth="2.5" rx="3" />
          <rect x="2" y="4" width="68" height="30" fill="none" stroke="#000000" strokeWidth="0.8" />
          <text x="36" y="23" fill="#000000" fontSize="15" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
            BAY B07
          </text>
          <text x="36" y="31" fill="#422006" fontSize="7" fontWeight="800" textAnchor="middle">
            AISLE 3 · ZONE 2
          </text>
        </g>

        {/* 6. CORRIDOR DEPTH: End-of-Aisle Wall & Fire Exit Sign in the far distance */}
        <rect x="470" y="200" width="60" height="25" fill="#14171a" />
        <rect x="495" y="204" width="10" height="6" fill="#15803d" opacity="0.8" rx="0.5" />
        <text x="500" y="209" fill="#ffffff" fontSize="4" fontWeight="bold" textAnchor="middle">EXIT</text>

        {/* ========================================================================= */}
        {/* 7. MOVING INDUSTRIAL PICKING CART & CARTON (SKU-1042 MOVEMENT SEQUENCE) */}
        {/* ========================================================================= */}
        <g
          transform={`translate(${currentX}, ${currentY}) scale(${currentScale})`}
          style={{
            transition: isPlaying ? 'transform 0.06s linear' : 'transform 0.2s ease-out',
          }}
        >
          {/* Shadow beneath picking cart on polished concrete */}
          <ellipse cx="0" cy="48" rx="65" ry="16" fill="#000000" opacity="0.6" />

          {/* Industrial Tubular Steel Picking Cart / Order Trolley */}
          {/* Wheels / Heavy duty casters */}
          <rect x="-48" y="40" width="10" height="12" fill="#1e293b" rx="2" />
          <rect x="-24" y="42" width="8" height="10" fill="#0f172a" rx="1.5" />
          <rect x="36" y="40" width="10" height="12" fill="#1e293b" rx="2" />
          <rect x="18" y="42" width="8" height="10" fill="#0f172a" rx="1.5" />

          {/* Cart Base Frame (Safety Blue Heavy Gauge Tubular Steel) */}
          <rect x="-56" y="32" width="112" height="10" fill="#1d4ed8" stroke="#172554" strokeWidth="1" rx="2" />
          {/* Vertical Handles / Upright Bars */}
          <line x1="-50" y1="32" x2="-50" y2="-45" stroke="#1d4ed8" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="-46" y1="-45" x2="-28" y2="-45" stroke="#1d4ed8" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="50" y1="32" x2="50" y2="-20" stroke="#1d4ed8" strokeWidth="4.5" strokeLinecap="round" />

          {/* Cart Lower Deck Mesh */}
          <line x1="-50" y1="36" x2="48" y2="36" stroke="#93c5fd" strokeWidth="1.5" />

          {/* Lower Tote Box / Staged Items on Cart */}
          <rect x="-44" y="16" width="38" height="18" fill="#0284c7" rx="2" stroke="#0369a1" strokeWidth="0.8" />
          <rect x="-4" y="18" width="46" height="16" fill="#0369a1" rx="2" stroke="#075985" strokeWidth="0.8" />

          {/* Cart Upper Shelf (Carrying target carton) */}
          <rect x="-54" y="4" width="104" height="6" fill="#1d4ed8" rx="1" />

          {/* TARGET CARTON REPRESENTING SKU-1042 */}
          {/* Main Cardboard Shipping Box */}
          <rect
            x="-32"
            y="-38"
            width="58"
            height="42"
            fill="url(#boxKraft1)"
            stroke="#78350f"
            strokeWidth="1.5"
            rx="2"
          />
          {/* Box Seam Tape (Brown packing tape down center) */}
          <line x1="-3" y1="-38" x2="-3" y2="4" stroke="#92400e" strokeWidth="5" opacity="0.8" />

          {/* Prominent White Barcode Shipping Label */}
          <rect x="-26" y="-30" width="32" height="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" rx="1" />
          {/* Barcode bars */}
          <line x1="-22" y1="-26" x2="-22" y2="-17" stroke="#0f172a" strokeWidth="2" />
          <line x1="-18" y1="-26" x2="-18" y2="-17" stroke="#0f172a" strokeWidth="1" />
          <line x1="-15" y1="-26" x2="-15" y2="-17" stroke="#0f172a" strokeWidth="2.5" />
          <line x1="-11" y1="-26" x2="-11" y2="-17" stroke="#0f172a" strokeWidth="1" />
          <line x1="-7" y1="-26" x2="-7" y2="-17" stroke="#0f172a" strokeWidth="2" />
          <line x1="-3" y1="-26" x2="-3" y2="-17" stroke="#0f172a" strokeWidth="1" />
          <text x="-10" y="-13" fill="#0f172a" fontSize="5" fontWeight="900" textAnchor="middle" letterSpacing="0.3">
            {sku}
          </text>

          {/* Warehouse Worker silhouette associated with cart movement (neutral attribution) */}
          <g opacity="0.7">
            {/* Hi-Vis safety vest worker pushing cart */}
            <circle cx="-62" cy="-40" r="9" fill="#1e293b" />
            <path d="M-72,-30 L-52,-30 L-50,8 L-74,8 Z" fill="#eab308" />
            <line x1="-66" y1="-28" x2="-66" y2="8" stroke="#f8fafc" strokeWidth="2.5" />
            <line x1="-58" y1="-28" x2="-58" y2="8" stroke="#f8fafc" strokeWidth="2.5" />
            {/* Arm pushing cart handle */}
            <line x1="-55" y1="-25" x2="-46" y2="-44" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* ===================================================================== */}
          {/* CCTV SECURITY VMS MOTION-DETECTION RETICLE (Genetec/Milestone Style) */}
          {/* ===================================================================== */}
          <g transform="translate(0, -5)">
            {/* Bounding Box Brackets */}
            <path
              d="M -72,-52 L -60,-52 M -72,-52 L -72,-40"
              stroke="#22c55e"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 52,-52 L 40,-52 M 52,-52 L 52,-40"
              stroke="#22c55e"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M -72,48 L -60,48 M -72,48 L -72,36"
              stroke="#22c55e"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M 52,48 L 40,48 M 52,48 L 52,36"
              stroke="#22c55e"
              strokeWidth="2"
              fill="none"
            />

            {/* Motion Detection Tag Header */}
            <rect x="-72" y="-68" width="124" height="15" fill="#14532d" fillOpacity="0.9" rx="2" stroke="#22c55e" strokeWidth="1" />
            <text x="-67" y="-57" fill="#86efac" fontSize="9" fontWeight="900" letterSpacing="0.5">
              OBJ: {sku} [IN-TRANSIT]
            </text>

            {/* Sub-tag tracking path */}
            <rect x="-72" y="52" width="124" height="13" fill="#000000" fillOpacity="0.85" rx="1.5" stroke="#22c55e" strokeWidth="0.7" />
            <text x="-67" y="62" fill="#ffffff" fontSize="8" fontWeight="700" letterSpacing="0.4">
              LOC: {sourceLocation} ➔ {targetLocation}
            </text>
          </g>
        </g>

        {/* 8. Scanline overlay */}
        <rect width="1000" height="562.5" fill="url(#scanlines)" pointerEvents="none" />
      </svg>

      {/* ========================================================================= */}
      {/* CCTV ON-SCREEN DISPLAY (Surveillance Camera OSD HUD) */}
      {/* ========================================================================= */}
      {/* Top Bar OSD */}
      <div className="absolute top-0 inset-x-0 p-3.5 flex items-start justify-between pointer-events-none text-white/95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
        {/* Top Left: Camera ID & Channel info */}
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-wider">
            <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-red-600/90 text-white text-[10px] font-black">
              <span className={`w-2 h-2 rounded-full bg-white ${isPlaying ? 'animate-ping' : ''}`} />
              <span>REC</span>
            </span>
            <span className="text-amber-300 font-black">{cameraName}</span>
            <span className="text-white/60">|</span>
            <span className="text-slate-300 text-[11px]">CH-03 WAREHOUSE SOUTH</span>
          </div>
          <div className="text-[11px] text-slate-300 font-mono">
            ELEVATION: 6.8M &bull; ANGLE: 38&deg; OVERHEAD
          </div>
        </div>

        {/* Top Right: Date & Precision Live CCTV Timestamp */}
        <div className="text-right space-y-0.5">
          <div className="text-sm sm:text-base font-mono font-black tracking-widest text-emerald-400">
            {cctvClock}
          </div>
          <div className="text-xs font-mono font-bold tracking-wider text-slate-200">
            {dateFormatted}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            1080P &bull; 30 FPS &bull; H.265 NVR-FEED
          </div>
        </div>
      </div>

      {/* Optical Alignment Crosshairs in Center */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
        <div className="w-16 h-16 border border-white/40 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white/60 rounded-full" />
        </div>
      </div>

      {/* Bottom Bar OSD: Movement Summary & Neutral Attribution */}
      <div className="absolute bottom-0 inset-x-0 p-3.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-wrap items-end justify-between gap-2 pointer-events-none text-white/95">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
              VISUAL EVIDENCE
            </span>
            <span className="text-xs font-bold font-mono text-white">
              MOVEMENT EVENT: {sourceLocation} &rarr; {targetLocation}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-mono max-w-lg leading-tight">
            {eventNote} &bull; Worker/device associated with movement (requires physical verification at {targetLocation})
          </p>
        </div>

        <div className="text-right font-mono text-[10px] text-slate-400">
          STATUS: {isPlaying ? 'PLAYING [30 FPS]' : 'FRAME PAUSED'}
        </div>
      </div>

      {/* CCTV Screen Edge Vignette & Corner Reticles */}
      <div className="absolute inset-0 pointer-events-none border border-white/10 shadow-[inset_0_0_90px_rgba(0,0,0,0.85)]" />
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/60 pointer-events-none" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/60 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/60 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/60 pointer-events-none" />
    </div>
  );
};
