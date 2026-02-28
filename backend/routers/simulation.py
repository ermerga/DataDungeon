from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from db.connection import get_db, SessionLocal
from models.project import Project
from schemas.simulation import SimulationStatusResponse
from services.simulation_engine import run_simulation

router = APIRouter(prefix="/projects", tags=["Simulation"])


# ---------------------------------------------------------------------------
# Background task — runs after the route has already returned 202
# ---------------------------------------------------------------------------

def _run_simulation_task(
    project_id: int,
    unit_count: int,
    build_year: int,
    greywater_recycling: bool,
    pipeline_added: bool,
):
    """
    Runs in the background after POST /simulate returns.
    Opens its own database session — the request session is already closed by the time
    this function executes, so we can't reuse it.
    """
    db = SessionLocal()
    try:
        results = run_simulation(
            unit_count=unit_count,
            build_year=build_year,
            greywater_recycling=greywater_recycling,
            pipeline_added=pipeline_added,
        )

        project = db.query(Project).filter(Project.id == project_id).first()
        project.simulation_results = results
        project.status = "complete"
        db.commit()

    except Exception as e:
        # If anything goes wrong, mark the project as failed so the frontend
        # doesn't poll forever waiting for a result that will never come.
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            project.status = "failed"
            db.commit()
        raise e

    finally:
        db.close()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/{project_id}/simulate", status_code=202)
def start_simulation(
    project_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Kick off the 50-year water simulation for a project.
    Returns 202 immediately — simulation runs in the background.
    Poll GET /projects/{id}/results until status == "complete".
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Mark as running before returning so the frontend knows it started
    project.status = "running"
    db.commit()

    # Schedule the simulation to run after this response is sent
    background_tasks.add_task(
        _run_simulation_task,
        project_id,
        project.unit_count,
        project.build_year,
        project.greywater_recycling,
        project.pipeline_added,
    )

    return {"message": "Simulation started", "project_id": project_id}


@router.get("/{project_id}/results", response_model=SimulationStatusResponse)
def get_results(project_id: int, db: Session = Depends(get_db)):
    """
    Poll this endpoint every 2 seconds after calling POST /simulate.
    Returns the current status and results once the simulation is complete.

    Status values:
      "pending"  — simulation hasn't been started yet
      "running"  — simulation is in progress
      "complete" — results are ready, check the results field
      "failed"   — something went wrong, try again
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    return {
        "status": project.status,
        "results": project.simulation_results,
    }
