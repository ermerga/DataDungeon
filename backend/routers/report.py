from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from db.connection import get_db
from models.project import Project
from services.report_generator import generate_report

router = APIRouter(prefix="/projects", tags=["Report"])


@router.get("/{project_id}/report")
def download_report(project_id: int, db: Session = Depends(get_db)):
    """
    Generate and download a PDF report for a completed project.
    Available for both PASS and FAIL verdicts.
    Simulation must be complete before calling this endpoint.
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

    pdf_bytes = generate_report(project, project.simulation_results)

    filename = f"datadungeon-report-{project.project_name.lower().replace(' ', '-')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
