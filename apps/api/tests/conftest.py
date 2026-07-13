import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app
import os

# Create an SQLite database file for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Remove existing test DB if any
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except:
            pass
            
    # Create all tables in SQLite
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    
    # Clean up test DB file
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except:
            pass

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Apply dependency override to FastAPI app
app.dependency_overrides[get_db] = override_get_db
