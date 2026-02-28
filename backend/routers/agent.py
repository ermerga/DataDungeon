from fastapi import APIRouter
from schemas.agent import RecommendationResponse

router = APIRouter(prefix="/projects", tags=["AI Agent"])


@router.post("/{project_id}/recommend", response_model=RecommendationResponse)
def recommend(project_id: int):
    # TODO: load simulation results for this project, call Claude API, return recommendations
    # Only call this endpoint after simulation returns verdict == "FAIL"
    raise NotImplementedError
