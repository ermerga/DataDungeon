from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.connection import get_db
from models.project import Project
from schemas.whatif import WhatIfRequest
from schemas.simulation import SimulationResult
from services.simulation_engine import run_simulation

router = APIRouter(prefix="/projects", tags=["What-If"])


@router.patch("/{project_id}/whatif", response_model=SimulationResult)
def whatif(project_id: int, body: WhatIfRequest, db: Session = Depends(get_db)):
    """
    Re-run the simulation with adjusted lever values and return the updated result.

    Unlike /simulate this runs synchronously and returns immediately — no polling needed.
    Results are NOT saved to the database. This endpoint is purely for live what-if exploration.
    The frontend calls this every time a slider changes and updates the chart in real time.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    if project.status not in ("complete", "failed"):
        raise HTTPException(
            status_code=400,
            detail="Simulation must be complete before running what-if scenarios.",
        )

    results = run_simulation(
        unit_count=project.unit_count,
        build_year=project.build_year,
        greywater_recycling=body.greywater_recycling,
        pipeline_added=body.pipeline_added,
        unit_reduction_pct=body.unit_reduction_pct,
        build_delay_years=body.build_delay_years,
    )

    return results
