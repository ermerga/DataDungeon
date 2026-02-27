# DataDungeon — Team Notes

This file is the single source of truth for the team. If you have a question about how something works, how to run the project, or what a file does — start here.

---

## Running the Project on Your Machine

### What you need installed (and nothing else)
- **Docker Desktop** — [docker.com/products/docker-desktop](https://docker.com/products/docker-desktop)
- **Git**
- **VS Code** (recommended)

You do not need to install Python, Node, or Postgres. Docker handles all of that.

---

### First-time setup

**1. Clone the repo**
```bash
git clone <repo-url>
cd DataDungeon
```

**2. Create your backend `.env` file**
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and fill in your `ANTHROPIC_API_KEY`. Ask the team lead for the shared key if you do not have one.

**3. Create your frontend `.env` file**
```bash
cp frontend/.env.example frontend/.env
```
Open `frontend/.env` and fill in your `VITE_MAPBOX_TOKEN`. Get a free token at [mapbox.com](https://mapbox.com) — create an account, go to your account page, and copy your default public token.

**4. Start everything**
```bash
docker compose up --build
```

The first run takes a few minutes — Docker is downloading the base images and installing all dependencies. Every run after that is fast.

**5. Open the app**
| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API docs | http://localhost:8000/docs |
| Postgres | localhost:5432 (user: `datadungeon`, pass: `datadungeon`, db: `datadungeon`) |

---

### API Keys You Need

| Key | Where to get it | Which file |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com | `backend/.env` |
| `VITE_MAPBOX_TOKEN` | mapbox.com (free account) | `frontend/.env` |

Neither `.env` file is ever committed to Git. They are both in `.gitignore`.

---

### Daily workflow

```bash
# Start everything
docker compose up

# Stop everything
docker compose down

# Rebuild after changing requirements.txt or package.json
docker compose up --build

# See backend logs
docker compose logs backend

# See frontend logs
docker compose logs frontend
```

> If you change a `.py` or `.jsx` file, the app auto-reloads. You do not need to restart Docker.

---

## What Every File Does

### Root level

| File | Purpose |
|---|---|
| `docker-compose.yml` | Defines the three services (postgres, backend, frontend) and how they connect. This is what `docker compose up` reads. |
| `.gitignore` | Tells Git what to never commit — most importantly both `.env` files which contain your API keys. |
| `datadungeon-team-guide.md` | The original hackathon guide — roles, build order, API endpoints, and demo flow. |
| `notes.md` | This file. Team reference for running the project and understanding the codebase. |

---

### Backend

The backend is a Python API built with FastAPI. It runs on port 8000 inside Docker.

| File / Folder | Purpose |
|---|---|
| `backend/Dockerfile` | Tells Docker how to build the backend container — installs Python, installs packages from `requirements.txt`, starts the server. |
| `backend/main.py` | The entry point for the entire API. FastAPI app is created here. All routers will be registered here. |
| `backend/requirements.txt` | Every Python package the backend needs. If you add a new package, add it here and run `docker compose up --build`. |
| `backend/.env.example` | Template showing what environment variables are needed. Copy this to `.env` and fill it in. Never commit `.env`. |
| `backend/.env` | Your local secrets (API keys, database URL). Gitignored — never shared via Git. |

#### `backend/db/`
| File | Purpose |
|---|---|
| `connection.py` | Sets up the SQLAlchemy database engine and session. Everything that talks to Postgres goes through this. |

#### `backend/models/`
SQLAlchemy table definitions — each file represents a database table.

| File | Purpose |
|---|---|
| *(to be created)* | `project.py` will define the Project table — parcel geometry, unit count, simulation status, results. |

#### `backend/schemas/`
Pydantic schemas — they define the shape of data going in and out of the API (request bodies and response objects).

| File | Purpose |
|---|---|
| *(to be created)* | `project.py` will define `ProjectCreate`, `ProjectResponse`, `SimulationResult`, etc. |

#### `backend/routers/`
One file per feature area. Each router defines a set of URL endpoints.

| File | Endpoints it owns |
|---|---|
| `projects.py` | `POST /projects` — save a new project. `GET /projects/{id}` — load a saved project. |
| `simulation.py` | `POST /projects/{id}/simulate` — kick off the simulation. `GET /projects/{id}/results` — poll until results are ready. |
| `whatif.py` | `PATCH /projects/{id}/whatif` — adjust levers and get an updated score instantly. |
| `agent.py` | `POST /projects/{id}/recommend` — send simulation failure data to Claude and get ranked recommendations back. |

#### `backend/services/`
Business logic lives here — no HTTP stuff, just pure Python functions.

| File | Purpose |
|---|---|
| `simulation_engine.py` | The most important file in the project. Runs the Monte Carlo water simulation. See the **How the Simulation Works** section below for full detail. |
| `water_demand.py` | Calculates how much water a development needs based on unit count and gallons-per-day standard. |
| `ai_agent.py` | Calls the Claude API with simulation failure data. Asks Claude to return 2–3 ranked intervention paths as JSON. |

#### `backend/data/`
Pre-loaded water data for Cache County, Utah. The simulation reads from this JSON file — it does not call any live data APIs during the hackathon.

| File | Purpose |
|---|---|
| `cache_county.json` | Water supply by source (Bear River, Logan River, groundwater), demand baselines, climate scenario modifiers, and Monte Carlo distribution parameters. All figures sourced from USGS, Utah DWR, and CMIP6 projections. |

---

### Frontend

The frontend is a React app built with Vite (JavaScript). It runs on port 5173 inside Docker.

| File / Folder | Purpose |
|---|---|
| `frontend/Dockerfile` | Tells Docker how to build the frontend container — installs Node, runs `npm install`, starts the Vite dev server. |
| `frontend/package.json` | Lists every JavaScript package the frontend needs (React, Mapbox, Recharts, Axios, etc.). If you add a package, add it here and run `docker compose up --build`. |
| `frontend/vite.config.js` | Vite configuration — sets the dev server to listen on all network interfaces so Docker can expose it on port 5173. |
| `frontend/index.html` | The single HTML file the browser loads. Contains the `<div id="root">` that React mounts into. |
| `frontend/.env.example` | Template for the Mapbox token. Copy to `frontend/.env` and fill it in. |
| `frontend/.env` | Your Mapbox token. Gitignored — never committed. |

#### `frontend/src/`

| File | Purpose |
|---|---|
| `main.jsx` | The React entry point. Mounts the `<App />` component into the HTML root. |
| `App.jsx` | Sets up React Router with the three routes: `/` (new project), `/projects/:id/results`, `/projects/:id/whatif`. |

#### `frontend/src/pages/`
Full-screen views. Each page corresponds to a step in the demo flow.

| File | Purpose |
|---|---|
| `NewProject.jsx` | First screen. Mapbox map where users draw a parcel, plus a form for unit count and project specs. Submits to `POST /projects` then kicks off the simulation. |
| `Results.jsx` | Second screen. Supply vs. demand chart, PASS/FAIL verdict, probability of failure, and first failure year if applicable. Polls `GET /projects/{id}/results` until done. |
| `WhatIf.jsx` | Third screen. Adjustment sliders (reduce units, add recycling, add pipeline, delay build). Each change hits `PATCH /projects/{id}/whatif` and updates the score live. Also shows AI recommendation cards. |

#### `frontend/src/components/`
Reusable UI pieces used inside the pages.

| File | Purpose |
|---|---|
| `ParcelMap.jsx` | Mapbox GL JS widget. Users draw a polygon on the map to define their parcel. Token comes from `VITE_MAPBOX_TOKEN`. |
| `SupplyDemandChart.jsx` | Recharts line chart showing projected supply vs. demand over 50 years. Can display the median simulation line plus a shaded confidence band. |
| `VerdictBadge.jsx` | The large PASS (green) or FAIL (red) badge on the Results screen. |
| `LeverPanel.jsx` | Sliders on the WhatIf screen — reduce unit count, enable greywater recycling, add a pipeline, delay build phase. |
| `AgentCard.jsx` | Displays a single AI recommendation from Claude — which levers to pull, projected outcome, and a plain-English explanation. |

#### `frontend/src/lib/`

| File | Purpose |
|---|---|
| `api.js` | The Axios client configured to point at `http://localhost:8000`. Every backend call goes through this — no other file should call the backend directly. |
| `types.js` | Shared data shape documentation as JSDoc comments — `Project`, `SimulationResult`, `WhatIfResponse`, `Recommendation`. Useful for understanding what the API returns. |

---

## How the Simulation Works

This is the core of the product. Understanding this section will help every person on the team build their piece correctly.

### The Goal

Given a parcel and a number of homes, determine whether Cache County has enough water to support that development for the next 50 years — and how confident we are in that answer.

### Mode 1 — Four Fixed Scenarios (simpler, build this first)

Run the simulation four times, once per climate scenario, each with a fixed supply modifier:

| Scenario | Supply Modifier | What it models |
|---|---|---|
| Baseline | 1.0x | Historical average conditions projected forward |
| Moderate Drought | 0.79x | CMIP6 SSP2-4.5 mid-century projections for northern Utah |
| Severe Drought | 0.57x | CMIP6 SSP5-8.5 prolonged drought with early snowmelt |
| Reduced Snowpack | 0.71x | Peak runoff shifts 3–5 weeks earlier, ~29% less snowpack |

For each scenario, at each of 50 years:
- Calculate supply = `baseline_supply × scenario_modifier × (1 + annual_trend)^year`
- Calculate demand = `base_demand × (1 + demand_growth_rate)^year`
- If `demand > supply` → record as failure year

**Verdict:** FAIL if any scenario fails in any year. PASS if all 50 years across all scenarios are clean.

### Mode 2 — Monte Carlo (build this second, it makes the demo much more impressive)

Instead of four fixed scenarios, run 1,000 independent simulations. Each simulation is slightly different because key variables are sampled randomly from probability distributions defined in `cache_county.json`.

**What gets sampled each simulation run:**

| Variable | Distribution | Parameters | Why |
|---|---|---|---|
| Annual supply | Lognormal | mean=1.0, σ=0.11 | Reflects real year-to-year variability in Bear River flows (USGS 1970–2023) |
| Annual demand growth rate | Normal | mean=1.9%, std=0.5% | Reflects uncertainty in population growth forecasts |
| Long-term supply trend | Applied cumulatively | mean=-0.8%/yr | Slow drying trend from climate change |

**Python library to use: `numpy`**

```python
import numpy as np

# Sample supply for one simulation, one year
supply_shock = np.random.lognormal(mean=0, sigma=0.11)
annual_supply = baseline_supply * supply_shock * cumulative_trend

# Sample demand growth for one simulation
growth_rate = np.random.normal(loc=0.019, scale=0.005)
growth_rate = np.clip(growth_rate, 0.005, 0.04)  # clamp to sane range
```

**What the output looks like:**

After 1,000 runs, for each of the 50 years you count how many simulations failed by that year. This gives you a failure probability curve:

```
Year 2035:  4% probability of deficit
Year 2042: 23% probability of deficit
Year 2055: 61% probability of deficit
Year 2074: 87% probability of deficit
```

**Verdict:** The project is flagged FAIL if `P(failure by 2074) > 15%`. The threshold is defined in `cache_county.json` and can be adjusted.

### What the Simulation Needs as Input

The simulation engine receives these parameters from the API:

| Parameter | Source | Description |
|---|---|---|
| `unit_count` | User input | Number of homes in the development |
| `gpd_per_unit` | `cache_county.json` (185 GPD/capita × avg household size) | Gallons per day per unit |
| `build_year` | User input | Year the development comes online (demand starts) |
| `greywater_recycling` | What-if lever | Boolean — reduces demand by 28% if true |
| `pipeline_added` | What-if lever | Boolean — adds 5,000 acre-feet/year to supply if true |
| `unit_reduction_pct` | What-if lever | 0–1 — percentage reduction in unit count |
| `build_delay_years` | What-if lever | Integer — how many years to push back the start date |
| `n_simulations` | Config | Default 1,000 for Monte Carlo mode |
| `county_data` | `cache_county.json` | All supply, demand, and distribution parameters |

### What the Simulation Returns

```json
{
  "verdict": "FAIL",
  "p_failure_by_2074": 0.72,
  "first_failure_year": 2049,
  "median_deficit_acre_feet": 14200,
  "failure_curve": [
    { "year": 2025, "p_failure": 0.0 },
    { "year": 2030, "p_failure": 0.02 },
    ...
    { "year": 2074, "p_failure": 0.72 }
  ],
  "scenario_results": {
    "baseline": "PASS",
    "moderate_drought": "FAIL",
    "severe_drought": "FAIL",
    "reduced_snowpack": "FAIL"
  }
}
```

### Python Libraries Used in the Simulation

| Library | Already in `requirements.txt`? | Purpose |
|---|---|---|
| `numpy` | No — **add it** | Monte Carlo sampling (`np.random.lognormal`, `np.random.normal`, `np.clip`) |
| `sqlalchemy` | Yes | Reading/writing simulation results to Postgres |
| `pydantic` | Yes | Validating input parameters before the simulation runs |
| `anthropic` | Yes | Calling Claude when the simulation returns FAIL |

> **Action item for backend:** Add `numpy==1.26.4` to `requirements.txt` before the hackathon starts.

### The What-If Levers — How They Modify the Simulation

The what-if levers do not rerun the full simulation from scratch. They adjust the input parameters and re-run quickly:

| Lever | Effect on simulation |
|---|---|
| Reduce unit count | Scales `base_demand` down proportionally before running |
| Greywater recycling | Multiplies `base_demand` by 0.72 (removes 28% of municipal indoor demand) |
| Add pipeline | Adds 5,000 acre-feet/year to `baseline_supply` before running |
| Delay build phase | Shifts the year demand starts accruing, giving supply infrastructure time to catch up |

### The AI Agent's Role

The AI agent is called **only when the simulation returns FAIL**. It receives the full simulation output and returns 2–3 ranked intervention paths. Each path specifies which levers to pull and what the new projected outcome would be.

**Key rule:** Claude never decides pass or fail. The simulation engine does that. Claude only interprets what to do about a failure.

---

## Key Rules

- Never commit `backend/.env` or `frontend/.env` — they contain real API keys.
- Each person works on their own Git branch and opens a pull request to merge into `main`.
- If you break something, say so immediately. Do not spend two hours debugging alone.
- The simulation only needs to work for Cache County, Utah. Do not add other counties.
- Auth is optional. If time runs short, hardcode a user and skip login.
- Get it working first. Make it look good second.

---

## Quick Reference

| Task | Command |
|---|---|
| Start the project | `docker compose up --build` |
| Stop the project | `docker compose down` |
| Rebuild after package changes | `docker compose up --build` |
| View backend logs | `docker compose logs backend` |
| View frontend logs | `docker compose logs frontend` |
| Frontend URL | http://localhost:5173 |
| Backend API docs | http://localhost:8000/docs |

| Resource | Link |
|---|---|
| Anthropic / Claude API | https://docs.anthropic.com |
| Mapbox GL JS | https://docs.mapbox.com/mapbox-gl-js |
| FastAPI | https://fastapi.tiangolo.com |
| Recharts | https://recharts.org |
| React Router | https://reactrouter.com |
| NumPy random distributions | https://numpy.org/doc/stable/reference/random |

---

*DataDungeon — USU Sandbox Hackathon 2026*
