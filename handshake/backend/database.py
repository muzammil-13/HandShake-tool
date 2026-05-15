from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
#from models import Base

# Database configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./handshake.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base should be defined here!
Base = declarative_base() 

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
