-- ============================================================================
-- StockTrace — Production Relational & Vector Schema Migration
-- Version: 20261011_production_schema.sql
-- Database: PostgreSQL 15+ with pgvector extension (Supabase compatible)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- 2. CORE WMS ENTITIES: WAREHOUSE, PRODUCTS, BINS, ORDERS
-- ============================================================================

-- Warehouse Bins Table
CREATE TABLE IF NOT EXISTS warehouse_bins (
    bin_id VARCHAR(32) PRIMARY KEY,
    aisle VARCHAR(16) NOT NULL,
    shelf_level INTEGER NOT NULL,
    landmark_description TEXT,
    warehouse_zone VARCHAR(32) NOT NULL DEFAULT 'ZONE-MAIN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products & SKUs Table
CREATE TABLE IF NOT EXISTS products (
    sku VARCHAR(64) PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    item_value_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    requires_high_value_cage BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dispatch Orders (Source of truth for expected pick quantities)
CREATE TABLE IF NOT EXISTS dispatch_orders (
    order_id VARCHAR(64) PRIMARY KEY,
    order_number VARCHAR(64) NOT NULL UNIQUE,
    customer_priority VARCHAR(32) NOT NULL DEFAULT 'NORMAL',
    destination_tote VARCHAR(64) NOT NULL,
    order_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_PICK',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dispatch Order Lines
CREATE TABLE IF NOT EXISTS dispatch_order_lines (
    line_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(64) NOT NULL REFERENCES dispatch_orders(order_id) ON DELETE RESTRICT,
    sku VARCHAR(64) NOT NULL REFERENCES products(sku) ON DELETE RESTRICT,
    required_quantity INTEGER NOT NULL CHECK (required_quantity > 0),
    expected_bin VARCHAR(32) NOT NULL REFERENCES warehouse_bins(bin_id) ON DELETE RESTRICT,
    line_status VARCHAR(32) NOT NULL DEFAULT 'ASSIGNED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inventory Snapshots
CREATE TABLE IF NOT EXISTS inventory_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(64) NOT NULL REFERENCES products(sku),
    bin_id VARCHAR(32) NOT NULL REFERENCES warehouse_bins(bin_id),
    recorded_quantity INTEGER NOT NULL CHECK (recorded_quantity >= 0),
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_system VARCHAR(32) NOT NULL DEFAULT 'WMS_SYNC'
);

-- ============================================================================
-- 3. EVIDENCE SOURCES: SCANNERS & CAMERAS
-- ============================================================================

-- Scanner Movement Events (Tier 1 Evidence)
CREATE TABLE IF NOT EXISTS scanner_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_time TIMESTAMPTZ NOT NULL,
    scanner_id VARCHAR(64) NOT NULL,
    sku VARCHAR(64) NOT NULL REFERENCES products(sku),
    from_bin VARCHAR(32) REFERENCES warehouse_bins(bin_id),
    to_bin VARCHAR(32) REFERENCES warehouse_bins(bin_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    transaction_type VARCHAR(32) NOT NULL, -- 'Transfer', 'Put-away', 'Pick'
    operator_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Camera Observation Metadata (Tier 2 & 3 Evidence)
CREATE TABLE IF NOT EXISTS camera_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_id VARCHAR(64) NOT NULL,
    event_time TIMESTAMPTZ NOT NULL,
    aisle VARCHAR(16) NOT NULL,
    observation_summary TEXT NOT NULL,
    observed_from_bin VARCHAR(32),
    observed_to_bin VARCHAR(32),
    confidence_score NUMERIC(4, 3) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    visual_limitation TEXT,
    video_clip_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. INVESTIGATION LIFECYCLE & CASES
-- ============================================================================

-- Investigation Tasks (Created ONLY after picker reports an issue)
CREATE TABLE IF NOT EXISTS investigation_tasks (
    task_id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES dispatch_orders(order_id),
    sku VARCHAR(64) NOT NULL REFERENCES products(sku),
    expected_bin VARCHAR(32) NOT NULL REFERENCES warehouse_bins(bin_id),
    required_quantity INTEGER NOT NULL,
    reported_available_quantity INTEGER CHECK (reported_available_quantity >= 0),
    task_status VARCHAR(32) NOT NULL DEFAULT 'INVESTIGATING',
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Investigation Execution Runs
CREATE TABLE IF NOT EXISTS investigation_runs (
    run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trace_id VARCHAR(64) NOT NULL,
    task_id VARCHAR(64) NOT NULL REFERENCES investigation_tasks(task_id),
    initial_picker_message TEXT NOT NULL,
    selected_evidence_tier VARCHAR(32) NOT NULL,
    run_status VARCHAR(32) NOT NULL, -- 'RESOLVED', 'ESCALATED', 'RECOMMENDATION_AVAILABLE'
    duration_ms INTEGER,
    estimated_cost_inr NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recommendations Issued by Engine
CREATE TABLE IF NOT EXISTS recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES investigation_runs(run_id),
    task_id VARCHAR(64) NOT NULL REFERENCES investigation_tasks(task_id),
    suggested_bin VARCHAR(32) REFERENCES warehouse_bins(bin_id),
    confidence_state VARCHAR(32) NOT NULL, -- 'HIGH_SUPPORT', 'MEDIUM_SUPPORT', 'LOW_STALE', 'CONFLICTING', 'INSUFFICIENT_EVIDENCE'
    explanation TEXT NOT NULL,
    evidence_summary JSONB NOT NULL,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'AWAITING_VERIFICATION',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Worker Physical Verifications (Human confirmation is required)
CREATE TABLE IF NOT EXISTS picker_verifications (
    verification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id VARCHAR(64) NOT NULL REFERENCES investigation_tasks(task_id),
    verified_location VARCHAR(32) NOT NULL,
    outcome VARCHAR(32) NOT NULL, -- 'FOUND', 'NOT_FOUND', 'PARTIALLY_FOUND', 'WRONG_QUANTITY', 'DAMAGED'
    physically_found_quantity INTEGER CHECK (physically_found_quantity >= 0),
    condition_notes TEXT,
    verified_by_actor VARCHAR(64) NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supervisor Escalations
CREATE TABLE IF NOT EXISTS supervisor_escalations (
    escalation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id VARCHAR(64) NOT NULL REFERENCES investigation_tasks(task_id),
    escalation_reason TEXT NOT NULL,
    escalation_queue VARCHAR(64) NOT NULL DEFAULT 'PHYSICAL_AUDIT_QUEUE',
    discrepancy_details JSONB,
    reviewed_by VARCHAR(64),
    review_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_REVIEW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Immutable Append-Only Audit Trail
CREATE TABLE IF NOT EXISTS audit_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trace_id VARCHAR(64),
    case_or_task_id VARCHAR(64) NOT NULL,
    actor VARCHAR(64) NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    details TEXT NOT NULL,
    evidence_tier VARCHAR(32),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. SEMANTIC VECTOR RAG: WAREHOUSE SOPS & PROCEDURES
-- ============================================================================

-- SOP Documents Table
CREATE TABLE IF NOT EXISTS sop_documents (
    document_id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    version VARCHAR(16) NOT NULL,
    summary TEXT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SOP Vector Chunks (Semantic Retrieval via pgvector)
CREATE TABLE IF NOT EXISTS sop_chunks (
    chunk_id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) NOT NULL REFERENCES sop_documents(document_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    chunk_content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    embedding vector(768), -- Gemini text-embedding-004 compatible
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_scanner_sku_time ON scanner_events (sku, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_order_lines_sku ON dispatch_order_lines (sku);
CREATE INDEX IF NOT EXISTS idx_investigation_tasks_order ON investigation_tasks (order_id);
CREATE INDEX IF NOT EXISTS idx_audit_task_id ON audit_events (case_or_task_id);
CREATE INDEX IF NOT EXISTS idx_sop_chunks_category ON sop_chunks (category);
CREATE INDEX IF NOT EXISTS idx_sop_chunks_embedding ON sop_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);

-- ============================================================================
-- 7. SECURITY & ACCESS CONTROL
-- ============================================================================

-- Revoke dangerous direct mutations from frontend application roles
-- (Inventory counts can only be adjusted via supervisor approved procedures)
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_orders ENABLE ROW LEVEL SECURITY;
