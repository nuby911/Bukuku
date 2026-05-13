-- PostgreSQL Schema for SaaS Pembukuan Keuangan (Multi-Tenant)

DROP TABLE IF EXISTS transaksi CASCADE;
DROP TABLE IF EXISTS kategori_transaksi CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS tipe_transaksi CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create ENUM types
CREATE TYPE tipe_transaksi AS ENUM ('masuk', 'keluar');
CREATE TYPE user_role AS ENUM ('user', 'super_admin');

-- 1. Table users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_lengkap VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_expires TIMESTAMP WITH TIME ZONE,
    reset_code VARCHAR(6),
    reset_expires TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table kategori_transaksi
CREATE TABLE kategori_transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    nama_kategori VARCHAR(100) NOT NULL,
    tipe tipe_transaksi NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_kategori_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexing for kategori_transaksi specifically for multi-tenant isolation
CREATE INDEX idx_kategori_userid ON kategori_transaksi(user_id);

-- 3. Table transaksi
CREATE TABLE transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    kategori_id UUID NOT NULL,
    tanggal DATE NOT NULL,
    nominal DECIMAL(15, 2) NOT NULL CHECK (nominal > 0),
    keterangan TEXT,
    tipe tipe_transaksi NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Foreign key to isolate transactions per user
    CONSTRAINT fk_transaksi_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- Restrict deletion of category if it's used in transactions
    CONSTRAINT fk_transaksi_kategori FOREIGN KEY (kategori_id) REFERENCES kategori_transaksi(id) ON DELETE RESTRICT
);

-- Single-column indices
CREATE INDEX idx_transaksi_userid ON transaksi(user_id);
CREATE INDEX idx_transaksi_tanggal ON transaksi(tanggal);

-- Composite index to heavily optimize monthly reporting per-user
CREATE INDEX idx_transaksi_userid_tanggal ON transaksi(user_id, tanggal);
