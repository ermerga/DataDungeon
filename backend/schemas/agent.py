from pydantic import BaseModel
from typing import List, Optional


class LeverSet(BaseModel):
    unit_reduction_pct: Optional[float] = None
    greywater_recycling: Optional[bool] = None
    pipeline_added: Optional[bool] = None
    build_delay_years: Optional[int] = None


class Recommendation(BaseModel):
    rank: int                       # 1 = best option
    levers: LeverSet                # which levers to pull
    projected_verdict: str          # "PASS" | "FAIL"
    projected_p_failure: float      # 0.0 – 1.0 after applying levers
    explanation: str                # plain-English explanation for the developer


class RecommendationResponse(BaseModel):
    recommendations: List[Recommendation]
    unfixable: bool = False         # True if Claude determines no combination of levers can fix it
    unfixable_reason: Optional[str] = None
