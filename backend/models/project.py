from sqlalchemy import Boolean, Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from db.connection import Base


class Project(Base):
    # __tablename__ tells SQLAlchemy what to call this table in Postgres.
    __tablename__ = "projects"

    # Integer primary key — Postgres auto-increments this. Every new project gets
    # the next available number. index=True makes lookups by id fast.
    id = Column(Integer, primary_key=True, index=True)

    # The human-readable name the developer gives the project.
    project_name = Column(String, nullable=False)

    # Number of homes. Drives all demand calculations in the simulation.
    unit_count = Column(Integer, nullable=False)

    # The year the development comes online — when demand starts in the simulation.
    build_year = Column(Integer, nullable=False)

    # The GeoJSON polygon the user drew on the map. Stored as JSON so we can
    # send it straight back to Mapbox on the frontend without any transformation.
    parcel_geojson = Column(JSON, nullable=False)

    # Whether the developer is including greywater recycling (reduces demand 28%)
    # or an additional pipeline/water-rights purchase (adds 500 AF/yr to supply).
    # Set at project creation and used as the baseline for the initial simulation.
    greywater_recycling = Column(Boolean, default=False, nullable=False)
    pipeline_added = Column(Boolean, default=False, nullable=False)

    # Tracks where this project is in its lifecycle.
    # Flow: "pending" → "running" → "complete" (or "failed" if something breaks)
    status = Column(String, default="pending", nullable=False)

    # Null until the simulation finishes. Then stores the full SimulationResult
    # as JSON so we don't have to rerun it every time the user comes back.
    simulation_results = Column(JSON, nullable=True)

    # Set automatically by the database when the row is first inserted.
    # server_default=func.now() means Postgres sets this, not Python —
    # so it's always accurate regardless of server timezone settings.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
