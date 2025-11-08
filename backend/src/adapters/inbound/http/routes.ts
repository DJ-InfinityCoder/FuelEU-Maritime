import express from "express";

import { RoutesController } from "./controllers/RoutesController";
import { ComplianceController } from "./controllers/ComplianceController";
import { BankingController } from "./controllers/BankingController";
import { PoolsController } from "./controllers/PoolsController";

import { RouteRepositoryDrizzle } from "../../outbound/postgres/RouteRepositoryDrizzle";
import { ShipComplianceRepositoryDrizzle } from "../../outbound/postgres/ShipComplianceRepositoryDrizzle";
import { BankEntryRepositoryDrizzle } from "../../outbound/postgres/BankEntryRepositoryDrizzle";
import { PoolRepositoryDrizzle } from "../../outbound/postgres/PoolRepositoryDrizzle";
import { PoolMemberRepositoryDrizzle } from "../../outbound/postgres/PoolMemberRepositoryDrizzle";

import { RouteService } from "../../../core/application/services/RouteService";
import { ShipComplianceService } from "../../../core/application/services/ShipComplianceService";
import { BankingService } from "../../../core/application/services/BankingService";
import { PoolService } from "../../../core/application/services/PoolService";

const router = express.Router();

// Instantiate repositories
const routeRepo = new RouteRepositoryDrizzle();
const shipComplianceRepo = new ShipComplianceRepositoryDrizzle();
const bankEntryRepo = new BankEntryRepositoryDrizzle();
const poolRepo = new PoolRepositoryDrizzle();
const poolMemberRepo = new PoolMemberRepositoryDrizzle();

// Instantiate services with repositories
const routeService = new RouteService(routeRepo);
const shipComplianceService = new ShipComplianceService(
    shipComplianceRepo,
    routeRepo
);
const bankingService = new BankingService(bankEntryRepo, shipComplianceRepo);
const poolService = new PoolService(poolRepo, poolMemberRepo, shipComplianceRepo);

// Instantiate controllers with services
const routesController = new RoutesController(routeService);
const complianceController = new ComplianceController(shipComplianceService);
const bankingController = new BankingController(bankingService);
const poolsController = new PoolsController(poolService);

// Define API endpoints

// Routes endpoints
router.get("/routes", (req, res) => routesController.getRoutes(req, res));
router.post("/routes/:routeId/baseline", (req, res) =>
    routesController.setBaseline(req, res)
);
router.get("/routes/comparison", (req, res) =>
    routesController.getComparison(req, res)
);

// Compliance endpoints
router.get("/compliance/cb", (req, res) =>
    complianceController.computeAndStoreCB(req, res)
);
router.get("/compliance/adjusted-cb", (req, res) =>
    complianceController.getAdjustedCB(req, res)
);

// Banking endpoints
router.get("/banking/records", (req, res) =>
    bankingController.getBankRecords(req, res)
);
router.post("/banking/bank", (req, res) =>
    bankingController.bankSurplus(req, res)
);
router.post("/banking/apply", (req, res) =>
    bankingController.applyBankedSurplus(req, res)
);

// Pools endpoints
router.post("/pools", (req, res) => poolsController.createPool(req, res));
router.get("/pools", (req, res) => poolsController.getPoolsByQuery(req, res));
router.get("/pools/:poolId", (req, res) => poolsController.getPoolById(req, res));
router.get("/pools/:poolId/members", (req, res) => poolsController.getPoolMembers(req, res));

export default router;
