# DataDungeon — Team Hackathon Guide
**Water Viability AI Platform** | React + FastAPI + Docker | USU Sandbox Hackathon 2026

---

## 1. What We Are Building

DataDungeon is a web app for real estate developers. They draw a parcel on a map, enter how many homes they want to build, and our platform tells them whether there will be enough water for the next 50 years.

If the answer is no, an AI agent tells them exactly what to change — fewer homes, a pipeline, water recycling — and shows them in real time how each change affects the outcome.

> **The demo flow:** Draw parcel on map → Enter project specs → Run simulation → Get PASS or FAIL → Adjust levers → See AI recommendations

---

## 2. The Stack

- **Frontend:** React (Vite)
- **Backend API:** FastAPI (Python)
- **Database:** PostgreSQL + PostGIS
- **Local dev:** Docker Compose
- **AI layer:** Claude API (Anthropic)
- **Map:** Mapbox GL JS
- **Charts:** Recharts

---

## 3. Running It Locally

Everyone on the team runs the project the same way using Docker. You do not need to install Python, Node, or Postgres separately.

### What you need installed
- Docker Desktop — download at [docker.com/products/docker-desktop](https://docker.com/products/docker-desktop)
- Git
- A code editor (VS Code recommended)

### How to start the project

**1. Clone the repo and go into the folder**
```bash
git clone <repo-url>
cd datadungeon
```

**2. Copy the example env file and add your API keys**
```bash
cp backend/.env.example backend/.env
```
Then open `backend/.env` and fill in your `ANTHROPIC_API_KEY`. Ask the team lead for the shared key.

**3. Start everything**
```bash
docker compose up --build
```

**4. Open the app**
- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs

> **Note:** The first `docker compose up --build` takes a few minutes while it downloads and builds images. Every run after that is fast. If you change a Python or React file, the app auto-reloads without restarting Docker.

---

## 4. Repo Structure

The repo has two main folders. Keep everything inside them.

```
datadungeon/
  frontend/          <- Everything React
  backend/           <- Everything Python / FastAPI
  docker-compose.yml
  README.md
```

### Backend folder
```
backend/
  main.py                  <- App entry point, start here
  requirements.txt         <- Python packages
  .env                     <- Your API keys (never commit this)
  .env.example             <- Template for the .env file

  routers/                 <- URL endpoints (one file per feature)
    projects.py            <- /projects endpoints
    simulation.py          <- /simulate endpoints
    whatif.py              <- /whatif endpoints
    agent.py               <- /recommend endpoint

  services/                <- Business logic
    simulation_engine.py   <- The water model (most important file)
    water_demand.py        <- Calculates demand from project specs
    ai_agent.py            <- Calls Claude API

  models/                  <- Database table definitions
  schemas/                 <- What goes in and out of the API
  db/                      <- Database connection setup
  data/                    <- Pre-loaded Cache County water data
```

### Frontend folder
```
frontend/
  src/
    pages/                 <- Full screens
      NewProject.jsx       <- Map + project form
      Results.jsx          <- PASS / FAIL screen
      WhatIf.jsx           <- Adjustment levers + AI cards

    components/            <- Reusable UI pieces
      ParcelMap.jsx        <- The Mapbox draw widget
      SupplyDemandChart.jsx <- The main chart
      VerdictBadge.jsx     <- PASS / FAIL display
      LeverPanel.jsx       <- The adjustment sliders
      AgentCard.jsx        <- AI recommendation cards

    lib/
      api.js               <- All backend calls go through here
      types.js             <- Shared data types
```

---

## 5. Team Roles

| Role | Owns | Focus for Hackathon |
|---|---|---|
| Frontend | React pages and components | NewProject page, Results page, WhatIf page, charts, map |
| Backend | FastAPI routes and simulation logic | All routers, simulation_engine.py, water_demand.py |
| AI + Data | Claude API and demo data | ai_agent.py, cache_county.json dataset, agent.py router |

> **If you are a team of 3:** Backend person also handles the data prep (it is a one-time task). Frontend person owns all React components. AI person owns the agent and can help glue things together.

---

## 6. The API Endpoints

These are the only endpoints we need to build. The FastAPI docs at `localhost:8000/docs` let you test them directly in the browser without a frontend.

| Method | Endpoint | Does What |
|---|---|---|
| POST | `/projects` | Save a new project (parcel + specs) |
| GET | `/projects/{id}` | Load a saved project |
| POST | `/projects/{id}/simulate` | Run the 50-year water simulation |
| GET | `/projects/{id}/results` | Get simulation results (poll until done) |
| PATCH | `/projects/{id}/whatif` | Adjust levers, get updated score |
| POST | `/projects/{id}/recommend` | Get AI recommendations on failure |

---

## 7. Build Order

Follow this sequence. Do not move to the next step until the current one works.

### Backend — do these first
1. Get Postgres running via Docker and connect to it from FastAPI
2. Create the Project database model and `POST /projects` endpoint
3. Build `water_demand.py` to calculate demand from unit count and GPD
4. Build `simulation_engine.py` using hardcoded Washington County data
5. Wire up `POST /simulate` and `GET /results`
6. Build the whatif delta logic in `whatif.py`
7. Build `ai_agent.py` and the `POST /recommend` endpoint

### Frontend — start once backend step 3 is done
1. Set up `api.js` with the Axios client pointing at `localhost:8000`
2. Build `NewProject.jsx` with the Mapbox map and project form
3. Build the `useSimulation` hook that polls for results
4. Build `Results.jsx` with the supply/demand chart and PASS/FAIL badge
5. Build `WhatIf.jsx` with the lever sliders wired to the whatif endpoint
6. Build `AgentCard.jsx` to display AI recommendations

> **The most important milestone:** Backend step 4 — `simulation_engine.py` returning a real FAIL result with a real fail year on hardcoded data. Once you have that, the rest of the demo builds around it quickly.

---

## 8. How the Simulation Works (Simple Version)

The simulation engine compares water supply to water demand over 50 years across four future climate scenarios. It does not connect to live data during the hackathon — it uses a pre-loaded JSON file with Cache County, Utah water data that we prepare once.

### The four scenarios
- **Baseline:** normal climate conditions extended forward
- **Moderate Drought:** supply reduced by around 22%
- **Severe Drought:** supply reduced by around 42%
- **Reduced Snowpack:** spring runoff arrives earlier and lower, reducing annual supply by around 28%

### Pass or Fail
If supply exceeds demand in all 50 years across all scenarios, it is a **PASS**. If demand exceeds supply in any scenario in any year, it is a **FAIL**. We record the year it first fails and by how much.

### The what-if levers
- **Reduce unit count:** directly reduces demand proportionally
- **Greywater recycling:** reduces demand by 28% (EPA standard)
- **Add pipeline:** increases supply by a fixed 5,000 acre-feet per year
- **Delay build phase:** shifts when peak demand hits, buying time

---

## 9. How the AI Agent Works

When a simulation fails, we call the Claude API with the simulation results and ask it to recommend what the developer should do. We tell Claude to respond only in JSON so we can parse it and display it cleanly in the UI.

The agent returns two or three ranked intervention paths. Each path includes which levers to pull, what the projected outcome would be, and a plain-English explanation. If the project is truly unfixable, the agent flags that and suggests looking at nearby parcels with better water availability.

> **Key rule:** The AI never decides the pass or fail verdict. That always comes from the simulation engine. The AI only recommends what to do about a failure. This keeps the core output scientifically grounded.

---

## 10. Team Ground Rules

- Never commit your `.env` file. It is in `.gitignore` for a reason.
- Each person works in their own Git branch and opens a pull request to merge.
- If you break something, say so immediately. Do not spend two hours debugging alone.
- The demo only needs to work for Cache County, Utah. Do not scope creep.
- Auth is optional. If you run out of time, hardcode a user and skip login.
- Style last. Get it working first, make it look good second.

---

## Quick Reference

| Thing | Command / URL |
|---|---|
| Start the project | `docker compose up --build` |
| Frontend | http://localhost:5173 |
| Backend API docs | http://localhost:8000/docs |
| Stop everything | `docker compose down` |
| Rebuild after package changes | `docker compose up --build` |
| See backend logs | `docker compose logs backend` |
| See frontend logs | `docker compose logs frontend` |
| Anthropic API docs | docs.anthropic.com |
| Mapbox docs | docs.mapbox.com |
| FastAPI docs | fastapi.tiangolo.com |

---

*DataDungeon — USU Sandbox Hackathon — 2026*
