from pydantic import BaseModel
from typing import List, Optional


class FailurePoint(BaseModel):
    year: int
    p_failure: float


class ScenarioResults(BaseModel):
    baseline: str           # "PASS" | "FAIL"
    moderate_drought: str   # "PASS" | "FAIL"
    severe_drought: str     # "PASS" | "FAIL"
    reduced_snowpack: str   # "PASS" | "FAIL"


class SimulationResult(BaseModel):
    verdict: str                              # "PASS" | "FAIL"
    p_failure_by_2074: float                  # 0.0 – 1.0
    first_failure_year: Optional[int]         # None if PASS
    median_deficit_acre_feet: Optional[float] # None if PASS
    failure_curve: List[FailurePoint]         # one entry per year, 2025–2074
    scenario_results: ScenarioResults


class SimulationStatusResponse(BaseModel):
    status: str                              # "pending" | "running" | "complete" | "failed"
    results: Optional[SimulationResult]      # None until status is "complete"
