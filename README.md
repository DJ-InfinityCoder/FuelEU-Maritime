# FuelEU Maritime — Full-Stack Developer Assignment

## Overview

This repository contains a minimal yet structured implementation of a Fuel EU Maritime compliance platform. It implements a frontend dashboard (React + TypeScript + TailwindCSS) and a backend API (Node.js + TypeScript + PostgreSQL) following a hexagonal (ports & adapters) architecture.

The implementation focuses on domain clarity and core features required by the assignment: routes management & comparison, compliance balance (CB) calculation, banking (Article 20), and pooling (Article 21).

## Contents

- frontend/ — React + TypeScript + Vite dashboard
- backend/ — Node.js + TypeScript API with PostgreSQL adapters
- AGENT_WORKFLOW.md — detailed AI agent usage log
- REFLECTION.md — short reflection on AI usage and lessons learned

## Architecture Summary

This project follows the Hexagonal (Ports & Adapters / Clean) architecture:

- core/ — domain entities, application services, and ports (framework-agnostic)
- adapters/ — inbound and outbound adapters. In the backend these include HTTP controllers and PostgreSQL repositories. In the frontend these include UI components/hooks and infrastructure API clients.
- infrastructure/ — framework/integration specifics (Express server, DB connection, Vite config, Tailwind config)

Benefits:
- Clear separation of concerns
- Easier to test domain logic in isolation
- Swappable infrastructure implementations

## Main Concepts

- Target intensity (2025): 89.3368 gCO₂e/MJ
- Energy content used for conversions: 41,000 MJ/tonne
- Compliance Balance (CB) = (Target − Actual) × EnergyInScope
  - Positive CB indicates surplus (creditable)
  - Negative CB indicates deficit (must be mitigated)

## Prerequisites

- Node.js (v18+ recommended)
- npm or yarn/pnpm
- PostgreSQL (12+)
- Optional: Docker if you prefer running Postgres in a container

## Environment & Configuration

Create a `.env` in backend/ with (example):

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=fueleu_dev
PORT=3000

Frontend environment variables (if needed) can be set in `frontend/.env` or via Vite config.

## Setup & Run (Development)

1. Start Postgres
   - Locally: ensure a database with credentials above
   - Or with Docker (example):
     docker run --name fueledu -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=fueleu_dev -p 5432:5432 -d postgres:15

2. Backend

- Install dependencies:
  cd backend
  npm install

- Apply DB schema and seed data (project includes applySchema and seed utilities):
  node ./dist/infrastructure/db/applySchema.js
  node ./dist/infrastructure/db/seed.js

  (During development run `npm run build` first or run TypeScript directly if scripts are available; check backend/package.json)

- Start dev server:
  npm run dev

The backend listens on PORT (default 3000). Confirm endpoints with curl or a browser.

3. Frontend

- Install dependencies:
  cd frontend
  npm install

- Start dev server:
  npm run dev

The frontend runs on Vite default port (5173). The app proxies API requests to the backend (see vite.config).

Open http://localhost:5173 to view the dashboard.

## Running Tests

- Backend unit/integration tests (Jest + Supertest):
  cd backend
  npm run test

- Frontend unit tests (React Testing Library / Vitest):
  cd frontend
  npm run test

Tip: Ensure the database schema and seed data are applied before running integration tests.

## Seed Data (KPIs)

The repository includes seed data for routes (5 rows). Key columns:

| routeId | vesselType | fuelType | year | ghgIntensity | fuelConsumption (t) | distance (km) | totalEmissions (t) |
|--------:|------------|----------|-----:|-------------:|--------------------:|--------------:|-------------------:|
| R001 | Container   | HFO | 2024 | 91.0  | 5000 | 12000 | 4500
| R002 | BulkCarrier | LNG | 2024 | 88.0  | 4800 | 11500 | 4200
| R003 | Tanker      | MGO | 2024 | 93.5  | 5100 | 12500 | 4700
| R004 | RoRo        | HFO | 2025 | 89.2  | 4900 | 11800 | 4300
| R005 | Container   | LNG | 2025 | 90.5  | 4950 | 11900 | 4400

One route should be seeded as baseline. These rows are used for comparisons, CB calculations, banking and pooling demonstrations.

## API Endpoints (Overview)

Routes:
- GET /routes
  - Returns list of routes and metadata
- POST /routes/:id/baseline
  - Sets specified route as baseline
- GET /routes/comparison
  - Returns baseline vs other routes with percentDiff and compliant flag

Compliance:
- GET /compliance/cb?shipId=<id>&year=<year>
  - Calculates and returns the compliance balance snapshot for a ship/year
- GET /compliance/adjusted-cb?year=<year>
  - Returns per-ship adjusted CB after banking/pooling

Banking:
- GET /banking/records?shipId&year
- POST /banking/bank
  - Banks a positive CB amount (creates bank entry)
- POST /banking/apply
  - Applies banked surplus to a deficit (validates available banked amount)

Pooling:
- POST /pools
  - Create a pool with members { shipId, cbBefore } and returns cbAfter allocations
  - Rules enforced: sum(cbBefore) >= 0; deficits not worsened; surplus not negative after allocation

## Sample Requests & Responses

1) GET /routes
Response: 200
{
  "routes": [
    { "routeId": "R001", "vesselType": "Container", "fuelType": "HFO", "year": 2024, "ghgIntensity": 91.0, "fuelConsumption": 5000, "distance": 12000, "totalEmissions": 4500, "isBaseline": true }
  ]
}

2) POST /routes/R002/baseline
Response: 200
{ "message": "Route R002 set as baseline" }

3) GET /routes/comparison
Response: 200
{
  "comparisons": [
    { "routeId": "R002", "baseline": 91.0, "comparison": 88.0, "percentDiff": -3.2967, "compliant": true }
  ]
}

4) POST /banking/bank
Request body:
{ "shipId": "SHIP_A", "year": 2024, "amount": 1200000 }  // amount in gCO2e or defined units

Response 201
{ "message": "Bank entry created", "cb_before": 1200000, "cb_after": 0 }

5) POST /pools
Request body:
{
  "year": 2024,
  "members": [
    { "shipId": "S1", "cbBefore": 500000 },
    { "shipId": "S2", "cbBefore": -300000 },
    { "shipId": "S3", "cbBefore": -200000 }
  ]
}

Response 200
{
  "poolId": "POOL_001",
  "cbAfter": [
    { "shipId": "S1", "cbBefore": 500000, "cbAfter": 0 },
    { "shipId": "S2", "cbBefore": -300000, "cbAfter": 0 },
    { "shipId": "S3", "cbBefore": -200000, "cbAfter": 0 }
  ],
  "valid": true
}

> Note: Units used by endpoints should be confirmed in code (gCO2e vs tCO2). The backend implements conversions where appropriate.

## Development Notes & Testing Tips

- Business logic is implemented in core/application services and unit tested. Look for services such as RouteService, ShipComplianceService, BankingService and PoolService.
- Use `npm run test` in each package to run unit and integration tests.
- When adding features, prefer editing core services and adding adapters rather than coupling domain logic to Express or React.

## Troubleshooting

- If the frontend cannot reach the backend, verify Vite proxy config and backend PORT
- If database migrations fail, confirm Postgres credentials and that the DB exists
- If TypeScript errors block compilation, run `npm run lint` / `npm run build` to inspect

## Screenshots

Run the app locally and capture screenshots of the following pages for a submission README:
- Routes tab showing table and filters
- Compare tab with chart and compliance table
- Banking tab with CB KPIs
- Pooling tab showing allocation result

Files in this repo include utilities to seed the DB and start the servers for local development. See backend/README.md and frontend/README.md for package-specific scripts and more granular instructions.

---

If anything in this README is out of sync with the code in the repository, please refer to the specific package README under frontend/ or backend/ for exact npm script names and commands.

# FuelEU Maritime Compliance Dashboard - Frontend

A modern React + TypeScript dashboard for managing FuelEU Maritime compliance, implementing Regulation (EU) 2023/1805.

## 🚀 Features

- **Routes Management**: View, filter, and set baseline routes
- **Comparison Analysis**: Compare routes against baseline with visual charts
- **Banking System**: Implement Article 20 - bank surplus and apply to deficits
- **Pooling System**: Implement Article 21 - combine compliance balances across ships
- **Hexagonal Architecture**: Clean separation of concerns (Core → Ports → Adapters)
- **Modern UI**: Responsive design with TailwindCSS

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on `http://localhost:3001`

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Run tests
npm test
```

## 🏗️ Architecture

The project follows **Hexagonal Architecture (Ports & Adapters)**:

```
src/
├── core/
│   ├── domain/          # Domain entities (Route, BankEntry, Pool, etc.)
│   ├── application/     # Use cases (not used in this simple app)
│   └── ports/           # Interface definitions for adapters
├── adapters/
│   ├── ui/              # React components, hooks
│   │   ├── components/  # UI components (tabs, common)
│   │   └── hooks/       # React hooks for data fetching
│   └── infrastructure/  # API clients, HTTP adapters
│       └── api/         # Backend API communication
└── shared/              # Constants, utilities
```

### Layer Responsibilities

- **Core/Domain**: Pure TypeScript entities and types, no framework dependencies
- **Core/Ports**: Interface contracts that adapters must implement
- **Adapters/UI**: React components implementing the user interface
- **Adapters/Infrastructure**: HTTP clients implementing outbound ports
- **Shared**: Constants and utilities used across layers

## 📊 Tabs & Features

### 1. Routes Tab
- Display all routes with filtering (vessel type, fuel type, year)
- Set baseline route for comparisons
- View GHG intensity, fuel consumption, distance, emissions

### 2. Compare Tab
- Compare all routes against the baseline
- Display % difference and compliance status
- Visual chart showing baseline vs comparison
- Target intensity: 89.3368 gCO₂e/MJ (2% below 91.16)

### 3. Banking Tab
- Fetch compliance balance for a ship
- Bank positive CB for future use
- Apply banked surplus to offset deficits
- KPIs: CB Before, Applied, CB After

### 4. Pooling Tab
- Add multiple ships to a pool
- Fetch adjusted CB for each ship
- Validate pool (total CB ≥ 0)
- Create pool and view allocation results

## 🔌 API Integration

The frontend connects to the backend via `/api` proxy:

```typescript
// Configured in vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

### API Endpoints Used

- `GET /routes` - Fetch all routes
- `POST /routes/:id/baseline` - Set baseline route
- `GET /routes/comparison` - Get comparison data
- `GET /compliance/cb?shipId&year` - Get compliance balance
- `GET /compliance/adjusted-cb?shipId&year` - Get adjusted CB
- `POST /banking/bank` - Bank surplus
- `POST /banking/apply` - Apply banked surplus
- `POST /pools` - Create pool

## 🎨 UI Components

### Common Components
- **Button**: Multi-variant button with loading states
- **Card**: Container with optional title and actions
- **Badge**: Status indicators (success, danger, warning, info)
- **LoadingSpinner**: Loading indicator
- **ErrorMessage**: Error display with retry option

### Tab Components
- **RoutesTab**: Routes management interface
- **CompareTab**: Comparison and chart visualization
- **BankingTab**: Banking operations interface
- **PoolingTab**: Pool creation and management

## 📱 Responsive Design

The dashboard is fully responsive:
- **Desktop**: Full multi-column layouts
- **Tablet**: 2-column grid layouts
- **Mobile**: Single column with stacked elements

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3001
```

### TailwindCSS Customization

Customize colors and theme in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Custom color palette
      },
    },
  },
}
```

## 📝 Code Quality

- **TypeScript Strict Mode**: Full type safety
- **ESLint**: Code linting with React hooks rules
- **Prettier**: Code formatting (optional)
- **Clean Code**: Following SOLID principles

## 🚦 Development Workflow

1. Start backend server (port 3001)
2. Run `npm run dev` (frontend on port 3000)
3. Access dashboard at `http://localhost:3000`
4. Make changes with hot reload enabled

## 📚 Key Technologies

- **React 18**: UI library
- **TypeScript 5**: Type-safe development
- **Vite**: Fast build tool and dev server
- **TailwindCSS 3**: Utility-first CSS framework
- **Recharts**: Chart visualization
- **Axios**: HTTP client

## 🎯 FuelEU Maritime Compliance

This dashboard implements:

- **Article 20 - Banking**: Ships can bank positive CB for future use
- **Article 21 - Pooling**: Ships can pool their CB together
- **Target Intensity**: 89.3368 gCO₂e/MJ for 2025 (2% reduction)
- **CB Calculation**: (Target - Actual) × Energy in scope

## 📖 References

- [FuelEU Maritime Regulation (EU) 2023/1805](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1805)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [TailwindCSS Documentation](https://tailwindcss.com/)

## 👨‍💻 Development Notes

### AI Agent Usage
See `AGENT_WORKFLOW.md` for detailed documentation on how AI agents were used in this project.

### Architecture Decisions
See `REFLECTION.md` for insights on architectural choices and lessons learned.

## 📄 License

This project is part of the FuelEU Maritime compliance assignment.

## 🤝 Contributing

This is an assignment project. See instructor guidelines for contribution rules.

---

Built with ❤️ using AI-assisted development (GitHub Copilot)

# BACKEND

# FuelEU Maritime Backend

Backend API for the FuelEU Maritime compliance platform, implementing routes management, compliance balance calculation, banking, and pooling functionality according to EU Regulation 2023/1805.

## 🏗️ Architecture

This project follows **Hexagonal Architecture** (Ports & Adapters / Clean Architecture):

```
src/
├── core/                           # Business logic (framework-agnostic)
│   ├── domain/                     # Entities
│   │   ├── entities/
│   │   │   ├── Route.ts
│   │   │   ├── ShipCompliance.ts
│   │   │   ├── BankEntry.ts
│   │   │   ├── Pool.ts
│   │   │   └── PoolMember.ts
│   ├── application/                # Use cases & services
│   │   └── services/
│   │       ├── RouteService.ts
│   │       ├── ShipComplianceService.ts
│   │       ├── BankingService.ts
│   │       └── PoolService.ts
│   └── ports/                      # Interfaces
│       └── outbound.ts             # Repository interfaces
│
├── adapters/                       # Framework implementations
│   ├── inbound/                    # API controllers
│   │   └── http/
│   │       ├── routes.ts
│   │       └── controllers/
│   └── outbound/                   # Database implementations
│       └── postgres/
│           └── *RepositoryDrizzle.ts
│
├── infrastructure/                 # External concerns
│   ├── db/
│   │   ├── connection.ts          # Database connection
│   │   ├── schema.ts              # Drizzle ORM schema
│   │   └── seed.ts                # Seed data
│   └── server/
│       ├── expressApp.ts          # Express setup
│       └── index.ts               # Server entry point
│
└── shared/                        # Shared utilities
    └── constants.ts               # Business constants & formulas
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Fuel_EU
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/fueleu
   PORT=3000
   TARGET_INTENSITY_2025=89.3368
   ENERGY_FACTOR_MJ_PER_TON=41000
   ```

4. **Create the database**
   ```bash
   # Using psql
   createdb fueleu
   
   # Or using PostgreSQL command line
   psql -U postgres -c "CREATE DATABASE fueleu;"
   ```

5. **Run database schema**
   
   Execute the SQL file in your PostgreSQL database:
   ```bash
   psql -U postgres -d fueleu -f database/schema.sql
   ```

6. **Seed the database**
   ```bash
   npm run seed
   ```

7. **Start the server**
   ```bash
   # Development mode (with hot reload)
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:3000`

---

## 📡 API Endpoints Documentation

### Base URL
```
http://localhost:3000/api
```

---

## 🛣️ Routes Endpoints

### 1. Get All Routes

**GET** `/api/routes`

Retrieves all routes from the database.

**Query Parameters:** None

**Request Body:** None

**Response:**
```typescript
Status: 200 OK
Content-Type: application/json

[
  {
    "id": 1,
    "route_id": "R001",
    "vessel_type": "Container",
    "fuel_type": "HFO",
    "year": 2024,
    "ghg_intensity": "91.0",
    "fuel_consumption": "5000",
    "distance": "12000",
    "total_emissions": "4500",
    "is_baseline": true
  },
  {
    "id": 2,
    "route_id": "R002",
    "vessel_type": "BulkCarrier",
    "fuel_type": "LNG",
    "year": 2024,
    "ghg_intensity": "88.0",
    "fuel_consumption": "4800",
    "distance": "11500",
    "total_emissions": "4200",
    "is_baseline": false
  }
]
```

**Example:**
```bash
curl http://localhost:3000/api/routes
```

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/routes"
```

---

### 2. Set Route as Baseline

**POST** `/api/routes/:routeId/baseline`

Sets a specific route as the baseline for comparison.

**URL Parameters:**
- `routeId` (string, required) - The route ID (e.g., "R001")

**Query Parameters:** None

**Request Body:** None

**Response:**
```typescript
Status: 200 OK
Content-Type: application/json

{
  "message": "Baseline set to R001"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/routes/R001/baseline
```

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/routes/R001/baseline" -Method POST
```

---

### 3. Get Route Comparison

**GET** `/api/routes/comparison`

Compares all routes against the baseline route, calculating percent difference and compliance status.

**Query Parameters:** None

**Request Body:** None

**Response:**
```typescript
Status: 200 OK
Content-Type: application/json

{
  "baseline": {
    "route_id": "R001",
    "ghg_intensity": "91.0",
    "vessel_type": "Container",
    "fuel_type": "HFO"
  },
  "comparisons": [
    {
      "route_id": "R002",
      "ghg_intensity": "88.0",
      "vessel_type": "BulkCarrier",
      "fuel_type": "LNG",
      "percentDiff": -3.2967,
      "compliant": true
    },
    {
      "route_id": "R003",
      "ghg_intensity": "93.5",
      "vessel_type": "Tanker",
      "fuel_type": "MGO",
      "percentDiff": 2.7473,
      "compliant": false
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3000/api/routes/comparison
```

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/routes/comparison"
```

---

## ⚖️ Compliance Endpoints

### 4. Compute and Store Compliance Balance

**GET** `/api/compliance/cb`

Computes Compliance Balance (CB) for ships and stores in database. 

**Formula:** `CB = (89.3368 - actualIntensity) × fuelConsumption × 41000`

**Query Parameters (Optional):**
- `shipId` (string) - Filter by specific ship ID
- `year` (number) - Filter by specific year

**Request Body:** None

**Response (All Records):**
```typescript
Status: 200 OK
Content-Type: application/json

[
  {
    "id": 1,
    "shipId": "R001",
    "year": 2024,
    "cbGco2eq": -3415200.00
  },
  {
    "id": 2,
    "shipId": "R002",
    "year": 2024,
    "cbGco2eq": 2640576.00
  }
]
```

**Response (Filtered by shipId and year):**
```typescript
Status: 200 OK
Content-Type: application/json

{
  "id": 1,
  "shipId": "R001",
  "year": 2024,
  "cbGco2eq": -3415200.00
}
```

**Examples:**
```bash
# Get all CB records
curl http://localhost:3000/api/compliance/cb

# Get CB for specific ship and year
curl "http://localhost:3000/api/compliance/cb?shipId=R001&year=2024"

# Get CB for specific ship (all years)
curl "http://localhost:3000/api/compliance/cb?shipId=R001"
```

```powershell
# Get all CB records
Invoke-RestMethod -Uri "http://localhost:3000/api/compliance/cb"

# Get CB for specific ship and year (must quote URL)
Invoke-RestMethod -Uri "http://localhost:3000/api/compliance/cb?shipId=R001&year=2024"
```

---

### 5. Get Adjusted Compliance Balance

**GET** `/api/compliance/adjusted-cb`

Retrieves adjusted CB after banking/pooling operations have been applied.

**Query Parameters (Optional):**
- `shipId` (string) - Filter by specific ship ID
- `year` (number) - Filter by specific year

**Request Body:** None

**Response:**
```typescript
Status: 200 OK
Content-Type: application/json

[
  {
    "id": 1,
    "shipId": "R001",
    "year": 2024,
    "cbGco2eq": 0.00
  }
]
```

**Examples:**
```bash
# Get all adjusted CB
curl http://localhost:3000/api/compliance/adjusted-cb

# Get adjusted CB for specific ship
curl "http://localhost:3000/api/compliance/adjusted-cb?shipId=R001&year=2024"
```

---

## 🏦 Banking Endpoints

### 6. Get Banking Records

**GET** `/api/banking/records`

Retrieves banking transaction records.

**Query Parameters (Optional):**
- `shipId` (string) - Filter by specific ship ID
- `year` (number) - Filter by specific year (requires shipId)

**Request Body:** None

**Response:**
```typescript
Status: 200 OK
Content-Type: application/json

[
  {
    "id": 1,
    "shipId": "R002",
    "year": 2024,
    "amountGco2eq": 2000000.00
  },
  {
    "id": 2,
    "shipId": "R002",
    "year": 2025,
    "amountGco2eq": -1500000.00
  }
]
```

**Examples:**
```bash
# Get all banking records
curl http://localhost:3000/api/banking/records

# Get records for specific ship
curl "http://localhost:3000/api/banking/records?shipId=R002"

# Get records for specific ship and year
curl "http://localhost:3000/api/banking/records?shipId=R002&year=2024"
```

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/banking/records?shipId=R002&year=2024"
```

---

### 7. Bank Surplus Emissions

**POST** `/api/banking/bank`

Banks surplus compliance balance for future use (Article 20).

**Query Parameters:** None

**Request Body:**
```typescript
Content-Type: application/json

{
  "shipId": "R002",      // required: Ship ID
  "year": 2024,          // required: Year
  "amount": 2000000.50   // required: Amount in gCO₂eq (must be > 0)
}
```

**Validations:**
1. ✅ Amount must be positive
2. ✅ Ship must have compliance record for that year
3. ✅ Ship must have positive CB (surplus)
4. ✅ Amount cannot exceed actual CB
5. ✅ Ship's CB is reduced by banked amount

**Response (Success):**
```typescript
Status: 201 Created
Content-Type: application/json

{
  "message": "Surplus banked successfully",
  "bankedEntry": {
    "shipId": "R002",
    "year": 2024,
    "amountGco2eq": 2000000.50
  },
  "originalCB": 2640576.00,
  "amountBanked": 2000000.50,
  "newCB": 640575.50
}
```

**Response (Error - Ship has deficit):**
```typescript
Status: 400 Bad Request
Content-Type: application/json

{
  "error": "Ship R003 has a deficit CB of -3000.00 gCO₂eq in 2024. Only ships with positive CB (surplus) can bank emissions."
}
```

**Response (Error - Amount exceeds CB):**
```typescript
Status: 400 Bad Request

{
  "error": "Cannot bank 5000000 gCO₂eq. Ship R002 only has 2640576.00 gCO₂eq surplus in 2024."
}
```

**Examples:**
```bash
curl -X POST http://localhost:3000/api/banking/bank \
  -H "Content-Type: application/json" \
  -d '{
    "shipId": "R002",
    "year": 2024,
    "amount": 2000000
  }'
```

```powershell
$body = @{
    shipId = "R002"
    year = 2024
    amount = 2000000
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/banking/bank" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

### 8. Apply Banked Surplus

**POST** `/api/banking/apply`

Applies previously banked surplus to cover a compliance deficit.

**Query Parameters:** None

**Request Body:**
```typescript
Content-Type: application/json

{
  "shipId": "R002",        // required: Ship ID
  "year": 2025,            // required: Year to apply to
  "amountToApply": 1500000 // required: Amount to apply (must be > 0)
}
```

**Validations:**
1. ✅ Amount must be positive
2. ✅ Ship must have compliance record for that year
3. ✅ Ship must have negative CB (deficit)
4. ✅ Ship must have banked surplus available
5. ✅ Amount cannot exceed available banked surplus
6. ✅ Amount cannot exceed deficit amount
7. ✅ Ship's CB is improved (becomes less negative)

**Response (Success):**
```typescript
Status: 200 OK
Content-Type: application/json

{
  "message": "Banked surplus applied successfully",
  "appliedAmount": 1500000,
  "originalCB": -3000000,
  "newCB": -1500000,
  "remainingBanked": 500000,
  "isFullyCovered": false
}
```

**Response (Error - Ship has surplus, not deficit):**
```typescript
Status: 400 Bad Request

{
  "error": "Ship R002 has a surplus CB of 500.00 gCO₂eq in 2025. Banked surplus can only be applied to cover deficits (negative CB)."
}
```

**Response (Error - Insufficient banked surplus):**
```typescript
Status: 400 Bad Request

{
  "error": "Insufficient banked surplus. Available: 500000.00 gCO₂eq, Requested: 2000000 gCO₂eq"
}
```

**Response (Error - Amount exceeds deficit):**
```typescript
Status: 400 Bad Request

{
  "error": "Cannot apply 5000000 gCO₂eq. Ship R002 only has a deficit of 3000000.00 gCO₂eq in 2025. You can only apply up to the deficit amount."
}
```

**Examples:**
```bash
curl -X POST http://localhost:3000/api/banking/apply \
  -H "Content-Type: application/json" \
  -d '{
    "shipId": "R002",
    "year": 2025,
    "amountToApply": 1500000
  }'
```

```powershell
$body = @{
    shipId = "R002"
    year = 2025
    amountToApply = 1500000
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/banking/apply" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## 🏊 Pooling Endpoints

### 9. Create Pool

**POST** `/api/pools`

Creates a compliance pool with multiple ships, performing greedy allocation (Article 21).

**Query Parameters:** None

**Request Body:**
```typescript
Content-Type: application/json

{
  "year": 2024,                    // required: Compliance year
  "shipIds": ["R001", "R002", "R003"]  // required: Array of ship IDs (min 2)
}
```

**Validations:**
1. ✅ At least 2 ships required
2. ✅ No duplicate ships
3. ✅ All ships must have CB computed for the same year
4. ✅ Total CB must be ≥ 0
5. ✅ Must have at least one surplus ship (CB > 0)
6. ✅ Must have at least one deficit ship (CB < 0)
7. ✅ Deficit ships cannot exit worse than entry
8. ✅ Surplus ships cannot exit with negative CB
9. ✅ All ships' CB updated in database

**Response (Success):**
```typescript
Status: 201 Created
Content-Type: application/json

{
  "pool": {
    "id": 1,
    "year": 2024
  },
  "members": [
    {
      "poolId": 1,
      "shipId": "R001",
      "cbBefore": 5000000,
      "cbAfter": 0
    },
    {
      "poolId": 1,
      "shipId": "R002",
      "cbBefore": -2000000,
      "cbAfter": 0
    },
    {
      "poolId": 1,
      "shipId": "R003",
      "cbBefore": -3000000,
      "cbAfter": 0
    }
  ],
  "totalCBBefore": 0,
  "totalCBAfter": 0,
  "surplusShipsCount": 1,
  "deficitShipsCount": 2
}
```

**Response (Error - Total CB negative):**
```typescript
Status: 400 Bad Request

{
  "error": "Pool total CB must be ≥ 0. Current total: -5000000.00 gCO₂eq. Cannot create pool with net deficit."
}
```

**Response (Error - Missing compliance record):**
```typescript
Status: 400 Bad Request

{
  "error": "The following ships do not have compliance records for year 2024: R002, R003. All ships in a pool must have CB computed for the same year. Please compute CB first using /api/compliance/cb"
}
```

**Response (Error - No deficit ships):**
```typescript
Status: 400 Bad Request

{
  "error": "Pool must have at least one ship with deficit (negative CB) to assist. If all ships have surplus, pooling is unnecessary."
}
```

**Response (Error - Duplicate ships):**
```typescript
Status: 400 Bad Request

{
  "error": "Duplicate ships detected. Each ship can only join a pool once."
}
```

**Examples:**
```bash
curl -X POST http://localhost:3000/api/pools \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2024,
    "shipIds": ["R001", "R002", "R003"]
  }'
```

```powershell
$body = @{
    year = 2024
    shipIds = @("R001", "R002", "R003")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/pools" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## 🧮 Core Formulas

### Compliance Balance (CB)
```
CB = (Target Intensity - Actual Intensity) × Energy in Scope
```

Where:
- **Target Intensity (2025)**: 89.3368 gCO₂e/MJ
- **Energy in Scope**: Fuel Consumption (t) × 41,000 MJ/t
- **Positive CB**: Surplus (can be banked)
- **Negative CB**: Deficit (needs compliance action)

### Route Comparison
```
Percent Difference = ((Comparison Intensity / Baseline Intensity) - 1) × 100
Compliant = Actual Intensity ≤ Target Intensity (89.3368)
```

### Banking Rules (Article 20)
1. Only ships with **positive CB** can bank surplus
2. Banked surplus can only be applied to **deficit (negative CB)**
3. Application amount **cannot exceed available banked surplus**
4. Application amount **cannot exceed deficit amount**
5. Ship's CB is **updated in database** after banking/applying

### Pooling Rules (Article 21)
1. **Total CB ≥ 0**: Sum of all members' CB must be non-negative
2. **Same Year**: All ships must have CB for the same compliance year
3. **Deficit Protection**: Deficit ships cannot exit worse than entry
4. **Surplus Protection**: Surplus ships cannot exit with negative CB
5. **Greedy Allocation**: Transfers surplus from positive CB ships to negative CB ships
6. **At least one surplus and one deficit ship** required

---

## 📊 Seed Data

The database is seeded with 5 routes from the assignment KPIs:

| routeId | vesselType | fuelType | year | ghgIntensity | fuelConsumption | distance | totalEmissions | isBaseline |
|---------|------------|----------|------|--------------|-----------------|----------|----------------|------------|
| R001 | Container | HFO | 2024 | 91.0 | 5000 | 12000 | 4500 | ✅ true |
| R002 | BulkCarrier | LNG | 2024 | 88.0 | 4800 | 11500 | 4200 | false |
| R003 | Tanker | MGO | 2024 | 93.5 | 5100 | 12500 | 4700 | false |
| R004 | RoRo | HFO | 2025 | 89.2 | 4900 | 11800 | 4300 | false |
| R005 | Container | LNG | 2025 | 90.5 | 4950 | 11900 | 4400 | false |

Route **R001** is set as the baseline.

---

## 🔍 Error Handling

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/POST operation |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error, invalid input |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Unexpected server error |

### Common Error Responses

**Validation Error (400):**
```json
{
  "error": "Detailed error message explaining the validation failure"
}
```

**Server Error (500):**
```json
{
  "error": "Failed to perform operation"
}
```

---

## 📚 Technology Stack

- **Runtime**: Node.js 18+ with TypeScript 5.9.3
- **Framework**: Express.js 5.1.0
- **Database**: PostgreSQL 14+
- **ORM**: Drizzle ORM 0.44.7
- **Architecture**: Hexagonal (Ports & Adapters / Clean Architecture)
- **Environment**: dotenv 17.2.3
- **Development**: tsx 4.20.6 (TypeScript execution with hot reload)
- **CORS**: cors 2.8.5

---

## 📖 Reference

Implementation follows **FuelEU Maritime Regulation (EU) 2023/1805**, specifically:
- **Annex IV**: GHG intensity calculation methodologies
- **Article 20**: Banking of surplus compliance balance
- **Article 21**: Pooling of ships

---

## 🧪 Scripts

```bash
# Start server (production)
npm start

# Start server (development with hot reload)
npm run dev

# Seed database
npm run seed

# Run tests
npm test
```

---

## 🤝 Contributing

This is an assignment project for FuelEU Maritime compliance platform. For production deployment, consider adding:

- ✅ Unit tests (Jest/Vitest)
- ✅ Integration tests (Supertest)
- ✅ Database migrations (Drizzle Kit)
- ✅ API documentation (Swagger/OpenAPI)
- ✅ Input validation (Zod)
- ✅ Authentication & Authorization
- ✅ Rate limiting
- ✅ Logging (Winston/Pino)
- ✅ Advanced error handling middleware
- ✅ Docker containerization
- ✅ CI/CD pipeline

---

## 📄 License

ISC

