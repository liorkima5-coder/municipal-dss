import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base
from geoalchemy2 import Geometry

# מחרוזת ההתחברות שלך מ-Neon
DB_URL = "postgresql://neondb_owner:npg_HPEtW5GAu0gh@ep-damp-waterfall-agn3hn0j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# הגדרת המודלים (Tables)
class Issue(Base):
    __tablename__ = "issues"
    id = Column(Integer, primary_key=True)
    category = Column(String(50))
    severity = Column(Integer) 
    safety_risk = Column(Integer) 
    estimated_cost = Column(Float)
    estimated_duration_hours = Column(Float)
    location = Column(Geometry('POINT', srid=4326))
    opened_at = Column(DateTime, default=datetime.utcnow)
    sla_deadline = Column(DateTime)
    status = Column(String(20), default="OPEN")

class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    capacity_hours = Column(Float, default=8.0)

# פקודה ליצירת הטבלאות ב-Neon
Base.metadata.create_all(engine)

def seed_data():
    session = SessionLocal()
    
    # ניקוי נתונים קודמים (אופציונלי, כדי שלא יהיו כפילויות)
    session.query(Issue).delete()
    session.query(Team).delete()
    
    # 1. יצירת צוותים
    teams = [
        Team(name="צוות כבישים א", capacity_hours=9.0),
        Team(name="צוות תאורה ב", capacity_hours=8.0),
        Team(name="צוות גינון ג", capacity_hours=8.5)
    ]
    session.add_all(teams)
    
    # 2. יצירת 20 תקלות דמו בירושלים
    categories = ["כבישים", "תאורה", "תברואה", "ניקוז", "מבנים"]
    for i in range(20):
        lat = random.uniform(31.75, 31.80)
        lon = random.uniform(35.18, 35.23)
        
        issue = Issue(
            category=random.choice(categories),
            severity=random.randint(1, 5),
            safety_risk=random.randint(1, 5),
            estimated_cost=random.uniform(500, 5000),
            estimated_duration_hours=random.uniform(1, 6),
            location=f'SRID=4326;POINT({lon} {lat})',
            sla_deadline=datetime.utcnow() + timedelta(days=random.randint(1, 7))
        )
        session.add(issue)
    
    session.commit()
    print("✅ הנתונים הוזרקו בהצלחה ל-Neon!")
    session.close()

if __name__ == "__main__":
    seed_data()