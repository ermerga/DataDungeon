from pydantic import BaseModel, Field


class WhatIfRequest(BaseModel):
    unit_reduction_pct: float = Field(
        default=0.0, ge=0.0, le=1.0,
        description="Fraction to reduce unit count by. 0.2 means 20% fewer homes."
    )
    greywater_recycling: bool = Field(
        default=False,
        description="If true, reduces municipal demand by 28% (EPA WaterSense standard)."
    )
    pipeline_added: bool = Field(
        default=False,
        description="If true, adds 5,000 acre-feet per year to supply."
    )
    build_delay_years: int = Field(
        default=0, ge=0, le=20,
        description="Number of years to delay the build phase start date."
    )
