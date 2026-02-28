from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from db.connection import get_db
from models.project import Project
from services.report_generator import generate_report
from services.simulation_engine import run_simulation

router = APIRouter(prefix="/projects", tags=["Report"])


@router.get("/{project_id}/report")
def download_report(
    project_id: int,
    db: Session = Depends(get_db),
    unit_reduction_pct: float = Query(default=0.0, ge=0.0, le=1.0),
    greywater_recycling: bool = Query(default=False),
    pipeline_added: bool = Query(default=False),
    build_delay_years: int = Query(default=0, ge=0, le=20),
):
    """
    Generate and download a PDF report for a completed project.
    Available for both PASS and FAIL verdicts.

    Optional lever query params can be passed to generate the PDF with
    what-if adjustments applied (mirrors the live slider state in the UI).
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    if project.status != "complete":
        raise HTTPException(
            status_code=400,
            detail="Simulation must be complete before generating a report.",
        )

    if not project.simulation_results:
        raise HTTPException(
            status_code=400,
            detail="No simulation results found for this project.",
        )

    # If any lever differs from default, re-run simulation with adjustments
    has_levers = (
        unit_reduction_pct > 0
        or greywater_recycling
        or pipeline_added
        or build_delay_years > 0
    )

    if has_levers:
        sim_results = run_simulation(
            unit_count=project.unit_count,
            build_year=project.build_year,
            greywater_recycling=greywater_recycling,
            pipeline_added=pipeline_added,
            unit_reduction_pct=unit_reduction_pct,
            build_delay_years=build_delay_years,
            parcel_geojson=project.parcel_geojson,
        )
        levers = {
            "unit_reduction_pct": unit_reduction_pct,
            "greywater_recycling": greywater_recycling,
            "pipeline_added": pipeline_added,
            "build_delay_years": build_delay_years,
        }
    else:
        sim_results = project.simulation_results
        levers = None

    pdf_bytes = generate_report(project, sim_results, levers=levers)

    filename = f"thallo-report-{project.project_name.lower().replace(' ', '-')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
