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

**2. Create your `.env` file**
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and fill in your `ANTHROPIC_API_KEY`. Ask the team lead for the shared key if you do not have one.

**3. Start everything**
```bash
docker compose up --build
```

The first run takes a few minutes — Docker is downloading the base images and installing all dependencies. Every run after that is fast.

**4. Open the app**
| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API docs | http://localhost:8000/docs |
| Postgres | localhost:5432 (user: `datadungeon`, pass: `datadungeon`, db: `datadungeon`) |

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

> If you change a `.py` or `.tsx` file, the app auto-reloads. You do not need to restart Docker.

---

## What Every File Does

### Root level

| File | Purpose |
|---|---|
| `docker-compose.yml` | Defines the three services (postgres, backend, frontend) and how they connect. This is what `docker compose up` reads. |
| `.gitignore` | Tells Git what to never commit — most importantly `backend/.env` which contains your API keys. |
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
| `backend/.env.example` | A template showing what environment variables are needed. Copy this to `.env` and fill it in. Never commit `.env`. |
| `backend/.env` | Your local secrets (API keys, database URL). This file is gitignored and never shared via Git. |

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
| `simulation.py` | `POST /projects/{id}/simulate` — kick off the 50-year simulation. `GET /projects/{id}/results` — poll until results are ready. |
| `whatif.py` | `PATCH /projects/{id}/whatif` — adjust levers (fewer units, recycling, pipeline, delay) and get an updated score. |
| `agent.py` | `POST /projects/{id}/recommend` — send the simulation failure to Claude and get ranked intervention recommendations back. |

#### `backend/services/`
Business logic lives here — no HTTP stuff, just pure Python functions.

| File | Purpose |
|---|---|
| `simulation_engine.py` | The most important file in the project. Compares water supply to water demand across 50 years and 4 climate scenarios (Baseline, Moderate Drought, Severe Drought, Reduced Snowpack). Returns PASS or FAIL with the year of first failure and the deficit. |
| `water_demand.py` | Calculates how much water a development will need based on unit count and gallons-per-day (GPD) standard. |
| `ai_agent.py` | Calls the Claude API with simulation failure data. Asks Claude to return 2-3 ranked intervention paths in JSON — each path says which levers to pull and what the projected outcome is. |

#### `backend/data/`
Stores the pre-loaded Washington County, Utah water data as a JSON file. The simulation engine reads from this — it does not call any live data APIs during the hackathon.

---

### Frontend

The frontend is a React app built with Vite and TypeScript. It runs on port 5173 inside Docker.

| File / Folder | Purpose |
|---|---|
| `frontend/Dockerfile` | Tells Docker how to build the frontend container — installs Node, runs `npm install`, starts the Vite dev server. |
| `frontend/package.json` | Lists every JavaScript package the frontend needs (React, Mapbox, Recharts, Axios, etc.). If you add a package, add it here and run `docker compose up --build`. |
| `frontend/vite.config.ts` | Vite configuration — sets the dev server to listen on all network interfaces so Docker can expose it on port 5173. |
| `frontend/tsconfig.json` | TypeScript configuration — tells the compiler how strict to be and what syntax to support. |
| `frontend/index.html` | The single HTML file the browser loads. It contains the `<div id="root">` that React mounts into. |

#### `frontend/src/`

| File | Purpose |
|---|---|
| `main.tsx` | The React entry point. Mounts the `<App />` component into the HTML root. |
| `App.tsx` | Sets up React Router with the three routes: `/` (new project), `/projects/:id/results`, `/projects/:id/whatif`. |

#### `frontend/src/pages/`
Full-screen views. Each page corresponds to a step in the demo flow.

| File | Purpose |
|---|---|
| `NewProject.tsx` | The first screen. Contains the Mapbox map where users draw a parcel, plus a form to enter unit count and project specs. Submits to `POST /projects` and then kicks off the simulation. |
| `Results.tsx` | The second screen. Shows the supply vs. demand chart, the PASS or FAIL verdict, and the year of first failure if applicable. Polls `GET /projects/{id}/results` until the simulation is done. |
| `WhatIf.tsx` | The third screen. Shows adjustment sliders (reduce units, add recycling, add pipeline, delay build). Each change hits `PATCH /projects/{id}/whatif` and updates the score live. Also shows the AI recommendation cards. |

#### `frontend/src/components/`
Reusable UI pieces used inside the pages.

| File | Purpose |
|---|---|
| `ParcelMap.tsx` | The Mapbox GL JS widget that lets users draw a polygon on the map to define their parcel. |
| `SupplyDemandChart.tsx` | A Recharts line chart showing projected water supply vs. demand over 50 years across the climate scenarios. |
| `VerdictBadge.tsx` | The large PASS (green) or FAIL (red) badge displayed on the Results screen. |
| `LeverPanel.tsx` | The panel of sliders on the WhatIf screen — reduce unit count, enable greywater recycling, add a pipeline, delay build phase. |
| `AgentCard.tsx` | Displays a single AI recommendation returned by Claude — which levers to pull, projected outcome, and a plain-English explanation. |

#### `frontend/src/lib/`

| File | Purpose |
|---|---|
| `api.ts` | The Axios client configured to point at `http://localhost:8000`. Every backend call in the app goes through this — no other file should use `fetch` or `axios` directly. |
| `types.ts` | Shared TypeScript types used across the app — `Project`, `SimulationResult`, `WhatIfResponse`, `Recommendation`, etc. If a type is used in more than one place, it belongs here. |

---

## Key Rules

- Never commit `backend/.env` — it contains real API keys.
- Each person works on their own Git branch and opens a pull request to merge into `main`.
- If you break something, say so immediately. Do not spend two hours debugging alone.
- The simulation only needs to work for Washington County, Utah. Do not add other regions.
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

---

*DataDungeon — USU Sandbox Hackathon 2026*
