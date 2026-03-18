"""Database initialization script."""
from database import init_db, engine, Base
from models import User, Report, Marker, Deficiency, Warning, Suggestion

def create_tables():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    create_tables()
