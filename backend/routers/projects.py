from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.connection import get_db
from models.project import Project
from schemas.project import ProjectCreate, ProjectResponse

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(body: ProjectCreate, db: Session = Depends(get_db)):
    # Create a Python object from the request body.
    # At this point it exists in memory only — nothing has been written to the database yet.
    project = Project(
        project_name=body.project_name,
        unit_count=body.unit_count,
        build_year=body.build_year,
        parcel_geojson=body.parcel_geojson,
        status="pending",
    )

    # Stage the object — SQLAlchemy now knows this needs to go to the database.
    db.add(project)

    # Write to the database. Postgres generates the id and created_at here.
    db.commit()

    # Re-read the row from the database so our Python object has the generated id and created_at.
    # Without this, project.id would still be None.
    db.refresh(project)

    # FastAPI sees response_model=ProjectResponse and uses it to serialize the
    # SQLAlchemy model into JSON. This works because we set model_config = {"from_attributes": True}
    # in ProjectResponse — it tells Pydantic to read from object attributes, not a dict.
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db)):
    # Query the projects table for a row where id matches.
    # .first() returns the object if found, or None if not.
    project = db.query(Project).filter(Project.id == project_id).first()

    # If nothing came back, return a 404. FastAPI turns this into a proper JSON error response.
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    return project
