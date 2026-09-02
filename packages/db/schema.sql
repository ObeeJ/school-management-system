-- ==============================================================================
-- Multi-Tenancy, KYC, Payments, Ledger & AI Engine Schema
-- Supports: Discriminator column + PostgreSQL Row-Level Security (RLS)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types
DO $$ BEGIN
    CREATE TYPE tenant_tier AS ENUM ('STARTER_POOLED_RLS', 'GROWTH_ISOLATED_SCHEMA', 'ENTERPRISE_DEDICATED_DB');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE kyc_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'BYPASSED_DEV');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    tier tenant_tier NOT NULL DEFAULT 'STARTER_POOLED_RLS',
    db_schema VARCHAR(100) DEFAULT 'public',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'STUDENT',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_tenant_email_unique UNIQUE (tenant_id, email)
);
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email);

-- 3. KYC Verifications Table
CREATE TABLE IF NOT EXISTS kyc_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'PREMBLY', 'SMILE_ID', 'STRIPE_IDENTITY'
    document_type VARCHAR(50) NOT NULL, -- 'PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID'
    document_number VARCHAR(100),
    country_code VARCHAR(2) NOT NULL, -- 'GB', 'US', 'NG'
    status kyc_status NOT NULL DEFAULT 'PENDING',
    verified_at TIMESTAMPTZ,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kyc_tenant ON kyc_verifications(tenant_id);

-- 4. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    student_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(20) NOT NULL,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT students_tenant_code_unique UNIQUE (tenant_id, student_code)
);
CREATE INDEX IF NOT EXISTS idx_students_tenant ON students(tenant_id);

-- 5. Payments (Pay-In) & Payouts Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('PAY_IN', 'PAY_OUT')),
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    stripe_intent_id VARCHAR(100),
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status payment_status NOT NULL DEFAULT 'PENDING',
    recipient_email VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);

-- 6. Fintech Double-Entry Ledger Accounts & Entries
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT accounts_tenant_number_unique UNIQUE (tenant_id, account_number)
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    reference VARCHAR(100) NOT NULL,
    description TEXT,
    posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ledger_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id),
    amount_cents BIGINT NOT NULL,
    direction VARCHAR(6) NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AI Datasets & Pattern Configurations
CREATE TABLE IF NOT EXISTS ai_datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dataset_type VARCHAR(50) NOT NULL, -- 'STUDENT_PERFORMANCE', 'FEE_COLLECTION', 'ATTENDANCE'
    record_count INT NOT NULL DEFAULT 0,
    dataset_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pattern_name VARCHAR(255) NOT NULL,
    system_instructions TEXT NOT NULL,
    trigger_rule VARCHAR(100) NOT NULL, -- 'ON_PAYMENT_DEFAULT', 'ON_GRADE_DROP'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_users ON users;
DROP POLICY IF EXISTS tenant_isolation_kyc ON kyc_verifications;
DROP POLICY IF EXISTS tenant_isolation_students ON students;
DROP POLICY IF EXISTS tenant_isolation_payments ON payments;
DROP POLICY IF EXISTS tenant_isolation_accounts ON accounts;
DROP POLICY IF EXISTS tenant_isolation_journal_entries ON journal_entries;
DROP POLICY IF EXISTS tenant_isolation_ledger_lines ON ledger_lines;
DROP POLICY IF EXISTS tenant_isolation_ai_datasets ON ai_datasets;
DROP POLICY IF EXISTS tenant_isolation_ai_patterns ON ai_patterns;

CREATE POLICY tenant_isolation_users ON users USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_kyc ON kyc_verifications USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_students ON students USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_payments ON payments USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_accounts ON accounts USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_journal_entries ON journal_entries USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_ledger_lines ON ledger_lines USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_ai_datasets ON ai_datasets USING (tenant_id = current_setting('app.current_tenant_id', true));
CREATE POLICY tenant_isolation_ai_patterns ON ai_patterns USING (tenant_id = current_setting('app.current_tenant_id', true));
