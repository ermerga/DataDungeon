from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.connection import engine, Base
import models.project  # noqa: F401 — must import so SQLAlchemy registers the table
from routers import projects, simulation, whatif, agent, report


# lifespan runs once when the app starts and once when it shuts down.
# Base.metadata.create_all() looks at every model that inherits from Base
# and creates its table in Postgres if it doesn't already exist.
# This means the first time the app boots, the "projects" table is created automatically —
# no manual SQL needed.
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="DataDungeon API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(simulation.router)
app.include_router(whatif.router)
app.include_router(agent.router)
app.include_router(report.router)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
