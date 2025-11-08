// src/infrastructure/db/schema.ts
import {
    pgTable,
    serial,
    text,
    integer,
    boolean,
    decimal,
    timestamp,
} from "drizzle-orm/pg-core";

// Routes table: stores shipping routes and their emission data
export const routes = pgTable("routes", {
    id: serial("id").primaryKey(),
    route_id: text("route_id").notNull(),
    vessel_type: text("vessel_type").notNull(),
    fuel_type: text("fuel_type").notNull(),
    year: integer("year").notNull(),
    ghg_intensity: decimal("ghg_intensity", {
        precision: 5,
        scale: 2,
    }).notNull(),
    fuel_consumption: decimal("fuel_consumption", {
        precision: 10,
        scale: 2,
    }).notNull(),
    distance: decimal("distance", { precision: 10, scale: 2 }).notNull(),
    total_emissions: decimal("total_emissions", {
        precision: 10,
        scale: 2,
    }).notNull(),
    is_baseline: boolean("is_baseline").default(false).notNull(),
});

// Ship compliance table: stores yearly compliance balance for ships
export const shipCompliance = pgTable("ship_compliance", {
    id: serial("id").primaryKey(),
    ship_id: text("ship_id").notNull(),
    year: integer("year").notNull(),
    cb_gco2eq: decimal("cb_gco2eq", { precision: 15, scale: 2 }).notNull(),
});

// Bank entries table: stores banked surplus emission credits with CB tracking
export const bankEntries = pgTable("bank_entries", {
    id: serial("id").primaryKey(),
    ship_id: text("ship_id").notNull(),
    year: integer("year").notNull(),
    amount_gco2eq: decimal("amount_gco2eq", {
        precision: 15,
        scale: 2,
    }).notNull(),
    cb_before: decimal("cb_before", { precision: 15, scale: 2 }),
    cb_after: decimal("cb_after", { precision: 15, scale: 2 }),
    transaction_type: text("transaction_type"),
    created_at: timestamp("created_at").defaultNow(),
});

// Pools table: tracks pooling groups for ships
export const pools = pgTable("pools", {
    id: serial("id").primaryKey(),
    year: integer("year").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
});

// Pool members table: stores CB allocations of ships before and after pooling
export const poolMembers = pgTable("pool_members", {
    pool_id: integer("pool_id").notNull(),
    ship_id: text("ship_id").notNull(),
    cb_before: decimal("cb_before", { precision: 15, scale: 2 }).notNull(),
    cb_after: decimal("cb_after", { precision: 15, scale: 2 }).notNull(),
});