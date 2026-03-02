import os
import time
import threading
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text

# ⚡ ב-Vercel, אנחנו משתמשים במשתנה הסביבה שהגדרת בפאנל הניהול.
# אם הוא לא קיים, הוא ישתמש בכתובת הישירה כברירת מחדל.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_HPEtW5GAu0gh@ep-damp-waterfall-agn3hn0j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require")

# יצירת מנוע יציב. ב-Serverless מומלץ pool_size קטן יותר כי השרת "קם ונופל"
engine = create_engine(
    DATABASE_URL,
    pool_size=1,
    max_overflow=0,
    pool_pre_ping=True
)

app = FastAPI()

# ⚡ הגדרת CORS פתוחה כדי שהדפדפן ב-Vercel לא יחסום את הבקשה
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CACHE LOGIC ---
# הערה: ב-Vercel Serverless, ה-Cache הזה יעבוד רק "פר הפעלה".
CACHE_TTL = 60 
cached_tasks = []
last_fetch_time = 0
cache_lock = threading.Lock()

def fetch_tasks_from_db():
    query = text("""
        SELECT id, category, severity, estimated_cost AS cost,
               ST_X(location::geometry) AS lon,
               ST_Y(location::geometry) AS lat
        FROM issues
        WHERE status = 'OPEN'
        ORDER BY severity DESC
        LIMIT 500
    """)
    try:
        with engine.connect() as conn:
            result = conn.execute(query)
            rows = result.fetchall()
            
        return [{
            "id": r.id,
            "category": r.category,
            "cost": float(r.cost or 0),
            "lat": float(r.lat),
            "lon": float(r.lon)
        } for r in rows]
    except Exception as e:
        print(f"❌ DATABASE ERROR: {e}")
        return []

@app.get("/api/optimize-routes") # הוספנו /api לנתיב כדי להתאים ל-Vercel
def optimize_routes(budget: float = Query(40000), teams: int = Query(3)):
    global cached_tasks, last_fetch_time
    
    with cache_lock:
        now = time.time()
        if now - last_fetch_time > CACHE_TTL or not cached_tasks:
            fresh_data = fetch_tasks_from_db()
            if fresh_data:
                cached_tasks = fresh_data
                last_fetch_time = now

    selected = []
    current_cost = 0
    for task in cached_tasks:
        if current_cost + task["cost"] > budget:
            break
        current_cost += task["cost"]
        selected.append(task)

    teams_data = [{"team_id": i + 1, "route_steps": []} for i in range(teams)]
    for idx, task in enumerate(selected):
        teams_data[idx % teams]["route_steps"].append(task)

    return {
        "summary": {
            "total_cost": current_cost,
            "selected_count": len(selected)
        },
        "data": teams_data
    }

@app.get("/api/health")
def health():
    return {"status": "ok", "env": "production"}
