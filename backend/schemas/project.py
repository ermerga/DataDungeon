from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    unit_count: int = Field(gt=0, description="Number of homes in the development")
    build_year: int = Field(ge=2025, le=2075, description="Year the development comes online")
    parcel_geojson: Dict[str, Any] = Field(
        description="GeoJSON Feature object with a Polygon geometry representing the parcel"
    )
    greywater_recycling: bool = False
    pipeline_added: bool = False


class ProjectResponse(BaseModel):
    id: int
    project_name: str
    unit_count: int
    build_year: int
    parcel_geojson: Dict[str, Any]
    greywater_recycling: bool
    pipeline_added: bool
    status: str  # "pending" | "running" | "complete" | "failed"
    created_at: datetime

    model_config = {"from_attributes": True}
