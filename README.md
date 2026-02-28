# Thallo

**1st Place — USU Sandbox Hackathon 2026**

Thallo is a 50-year water viability tool for residential developers in Cache County, Utah. A developer draws a parcel on a map, enters a unit count and build year, and gets back a Monte Carlo simulation across 1,000 independent climate futures — with a clear PASS or FAIL verdict, live what-if sliders, AI-powered intervention recommendations, and a downloadable PDF report.

---

## The Problem

Cache County is one of the fastest-growing counties in Utah. Every new housing development has to compete for a fixed pool of water rights — and that pool is shrinking. Snowpack is declining, the Bear River is already over-allocated, and CMIP6 climate projections show a -0.4% annual supply trend through 2074.

Right now, developers have no fast, quantitative way to know whether a proposed project is water-viable before they spend months on permitting. Thallo changes that.

---

## What Thallo Does

### Simulation Engine
At its core, Thallo runs a **Monte Carlo water simulation** — 1,000 independent 50-year futures for every project. Each run samples:

- **Annual supply shocks** from a log-normal distribution calibrated to 50 years of USGS Logan River gauge data, capturing real year-to-year variability in Bear River flows
- **Demand growth rates** from a normal distribution anchored to Cache County's historical 1.9% annual growth rate
- A **long-term supply trend** of -0.4% per year from CMIP6 climate projections, accumulating from 2026 regardless of build year

In parallel, four **fixed climate scenarios** (baseline, moderate drought, severe drought, and reduced snowpack) are run deterministically using CMIP6 SSP2-4.5 and SSP5-8.5 modifiers.

A project **passes** if fewer than 15% of the 1,000 simulated futures result in a water deficit. If more than 150 of those futures run dry, it fails.

### Parcel-Aware Demand Modeling
Thallo uses the actual drawn parcel to estimate **outdoor irrigation demand** — not just indoor use. The parcel area is calculated from the GeoJSON polygon using the Shoelace formula with a latitude correction for Cache County (~41.75°N). Lot size per unit then drives irrigated area, capped at 0.25 acres per unit. A 500-unit apartment complex on 5 acres produces almost no irrigation demand. The same 500 units spread across 100 acres adds over 100 acre-feet per year on top of indoor use — a distinction that was invisible in previous approaches.

### Live What-If Analysis
If a project fails, developers can adjust four intervention levers directly on the results page:

- **Unit reduction** — fewer homes, less demand
- **Greywater recycling** — cuts indoor municipal demand by 28% (EPA WaterSense standard). Does not affect outdoor irrigation, which is the physically correct behavior.
- **Pipeline / water rights purchase** — adds 500 acre-feet per year to the development's supply allocation
- **Build delay** — shifts when demand starts, giving supply infrastructure time to catch up

Every slider change reruns all 1,000 Monte Carlo simulations plus the four fixed scenarios in real time. This is possible because the simulation is purely in-memory NumPy — no database writes, no approximations.

### AI Recommendations
For failing projects, Thallo can generate ranked intervention recommendations using **GPT-OSS 120B running on Cerebras wafer-scale hardware**. Critically, the model's job is only to suggest which levers to pull — it does not compute projected outcomes. Every suggestion the model makes is run through the real simulation engine before being shown to the user. The failure probabilities on the recommendation cards are honest simulation results, not model estimates. Cerebras's inference speed makes this fast enough to feel instant.

### PDF Reports
Projects can export a full PDF report suitable for submission to water authorities. The report includes the parcel center coordinate, verdict, chance of water shortage framed as "X of 1,000 simulated futures ran short," all four climate scenario outcomes, the failure probability curve by year, and full data source citations. If what-if levers were adjusted, the PDF reflects those adjusted results — not the original failing run.

---

## How It Works

1. **Draw a parcel** on the interactive map and fill in your project details
2. **Run the simulation** — 1,000 independent 50-year scenarios run in under a second
3. **Read the results** — verdict, chance of water shortage, failure curve, and 4 fixed climate scenarios
4. **Adjust the levers** — reduce units, add greywater recycling, add a pipeline, or delay construction; all 1,000 scenarios recompute live
5. **Get AI recommendations** — GPT-OSS 120B on Cerebras suggests ranked intervention combinations, each validated by the real simulation
6. **Download the report** — a branded PDF suitable for water authority submissions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + SQLAlchemy + PostgreSQL |
| Simulation | NumPy (Monte Carlo), custom water demand model |
| AI | GPT-OSS 120B via Cerebras inference API |
| Frontend | React + Vite + Recharts + Mapbox GL |
| Infrastructure | Docker Compose |
| PDF | fpdf2 |

---

## Running Locally

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A [Mapbox](https://account.mapbox.com/) account (free tier works)
- A [Cerebras](https://cloud.cerebras.ai/) API key

### 1. Clone the repo

```bash
git clone https://github.com/ermerga/DataDungeon.git
cd DataDungeon
```

### 2. Set up environment variables

**Backend** — create `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Then open `backend/.env` and fill in:

```
CEREBRAS_API_KEY=your-cerebras-api-key-here
DATABASE_URL=postgresql://datadungeon:datadungeon@postgres:5432/datadungeon
```

**Frontend** — create `frontend/.env`:

```bash
touch frontend/.env
```

Add your Mapbox token:

```
VITE_MAPBOX_TOKEN=your-mapbox-public-token-here
```

### 3. Start the application

```bash
docker compose up --build
```

This starts three services:
- **PostgreSQL** on port `5432`
- **FastAPI backend** on port `8000`
- **React frontend** on port `5173`

The database schema is created automatically on first boot.

### 4. Open the app

Visit [http://localhost:5173](http://localhost:5173)

---

## API

The backend exposes a REST API at `http://localhost:8000`. Interactive docs are available at [http://localhost:8000/docs](http://localhost:8000/docs).

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/projects` | Create a new project |
| `POST` | `/projects/{id}/simulate` | Start the simulation (async) |
| `GET` | `/projects/{id}/results` | Poll for simulation results |
| `PATCH` | `/projects/{id}/whatif` | Re-run simulation with adjusted levers (sync) |
| `POST` | `/projects/{id}/recommend` | Get AI-powered intervention recommendations |
| `GET` | `/projects/{id}/report` | Download PDF report (pass lever params for adjusted results) |

---

## Data Sources

- **USGS** National Water Information System — Logan River gauge 10109000 (1970–2023)
- **Utah Division of Water Resources** — Bear River Basin Study 2021
- **Cache County General Plan 2023** — Water Resources Element
- **CMIP6 Projections** via Utah Climate Center, Utah State University (SSP2-4.5 and SSP5-8.5)

---

## Project Structure

```
DataDungeon/
├── backend/
│   ├── data/               # Cache County water data (JSON)
│   ├── models/             # SQLAlchemy models
│   ├── routers/            # FastAPI route handlers
│   ├── schemas/            # Pydantic request/response schemas
│   ├── services/
│   │   ├── simulation_engine.py   # Monte Carlo + fixed scenario simulation
│   │   ├── water_demand.py        # Indoor + irrigation demand calculations
│   │   ├── ai_agent.py            # Cerebras tool-use recommendation engine
│   │   └── report_generator.py   # fpdf2 PDF generation
│   └── main.py
└── frontend/
    ├── src/
    │   ├── pages/          # NewProject, Results
    │   └── components/     # Map, chart, lever panel, verdict badge, AI cards
    └── index.html
```

---

*Built in 24 hours at the USU Sandbox Hackathon 2026.*
