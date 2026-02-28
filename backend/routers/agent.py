from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.connection import get_db
from models.project import Project
from schemas.agent import RecommendationResponse
from services.ai_agent import get_recommendations

router = APIRouter(prefix="/projects", tags=["AI Agent"])


@router.post("/{project_id}/recommend", response_model=RecommendationResponse)
def recommend(project_id: int, db: Session = Depends(get_db)):
    """
    Ask the AI agent for ranked intervention recommendations.

    Rules:
      - Simulation must be complete (status == "complete")
      - Verdict must be "FAIL" — recommendations are only useful for failed projects
      - Returns 2–3 ranked lever combinations with real simulated outcomes
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    if project.status != "complete":
        raise HTTPException(
            status_code=400,
            detail="Simulation must be complete before requesting recommendations.",
        )

    results = project.simulation_results
    if not results:
        raise HTTPException(
            status_code=400,
            detail="No simulation results found for this project.",
        )

    if results.get("verdict") != "FAIL":
        raise HTTPException(
            status_code=400,
            detail="Recommendations are only generated for projects that failed the simulation.",
        )

    return get_recommendations(
        unit_count=project.unit_count,
        build_year=project.build_year,
        simulation_result=results,
    )
