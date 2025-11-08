-- FuelEU Maritime Database Schema
-- Run this file to create all necessary tables

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS pool_members CASCADE;
DROP TABLE IF EXISTS pools CASCADE;
DROP TABLE IF EXISTS bank_entries CASCADE;
DROP TABLE IF EXISTS ship_compliance CASCADE;
DROP TABLE IF EXISTS routes CASCADE;

-- Routes table: stores shipping routes and their emission data
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    route_id TEXT NOT NULL UNIQUE,
    vessel_type TEXT NOT NULL,
    fuel_type TEXT NOT NULL,
    year INTEGER NOT NULL,
    ghg_intensity DECIMAL(5, 2) NOT NULL,
    fuel_consumption DECIMAL(10, 2) NOT NULL,
    distance DECIMAL(10, 2) NOT NULL,
    total_emissions DECIMAL(10, 2) NOT NULL,
    is_baseline BOOLEAN DEFAULT FALSE NOT NULL
);

-- Ship compliance table: stores yearly compliance balance for ships
CREATE TABLE ship_compliance (
    id SERIAL PRIMARY KEY,
    ship_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    cb_gco2eq DECIMAL(15, 2) NOT NULL,
    UNIQUE(ship_id, year)
);

-- Bank entries table: stores banked surplus emission credits
CREATE TABLE bank_entries (
    id SERIAL PRIMARY KEY,
    ship_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    amount_gco2eq DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pools table: tracks pooling groups for ships
CREATE TABLE pools (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Pool members table: stores CB allocations of ships before and after pooling
CREATE TABLE pool_members (
    pool_id INTEGER NOT NULL,
    ship_id TEXT NOT NULL,
    cb_before DECIMAL(15, 2) NOT NULL,
    cb_after DECIMAL(15, 2) NOT NULL,
    PRIMARY KEY (pool_id, ship_id),
    FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_routes_year ON routes(year);
CREATE INDEX idx_routes_baseline ON routes(is_baseline);
CREATE INDEX idx_compliance_ship_year ON ship_compliance(ship_id, year);
CREATE INDEX idx_bank_entries_ship ON bank_entries(ship_id);
CREATE INDEX idx_pools_year ON pools(year);

-- Verify tables created
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
