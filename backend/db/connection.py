import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

# The DATABASE_URL comes from backend/.env
# Format: postgresql://user:password@host:port/dbname
# Inside Docker, "postgres" is the hostname because that's the service name in docker-compose.yml
DATABASE_URL = os.getenv("DATABASE_URL")

# The engine is the single connection to Postgres for the entire app.
# pool_pre_ping=True means SQLAlchemy will test the connection before using it —
# important because the backend might start before Postgres is fully ready.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# SessionLocal is a factory. Calling SessionLocal() gives you one session (one "conversation"
# with the database). autocommit=False means changes don't save until you explicitly commit.
# autoflush=False means SQLAlchemy won't automatically write pending changes mid-request.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Base is the class all models inherit from.
# SQLAlchemy uses it to track which Python classes map to which database tables.
class Base(DeclarativeBase):
    pass


# get_db is a FastAPI dependency. Any route that needs the database declares it as a parameter
# and FastAPI calls this function automatically. The "yield" means FastAPI will:
#   1. Open a session before the route runs
#   2. Pass it to the route
#   3. Close it when the route finishes — even if an error occurs
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
