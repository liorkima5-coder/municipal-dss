import os
import time
import threading
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text

# שימוש במשתנה סביבה או בכתובת ישירה
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_HPEtW5GAu0gh@ep-damp-waterfall-agn3hn0j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require")

engine = create_engine(DATABASE_URL, pool_size=1, max_overflow=0, pool_pre_ping=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# מטמון בסיסי
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
        return [{"id": r.id, "category": r.category, "cost": float(r.cost or 0), "lat": float(r.lat), "lon": float(r.lon)} for r in rows]
    except Exception as e:
        return []

# ⚡ שים לב: הורדתי את ה-/api מהנתיב כאן
@app.get("/optimize-routes")
def optimize_routes(budget: float = Query(40000), teams: int = Query(3)):
    global cached_tasks, last_fetch_time
    with cache_lock:
        if time.time() - last_fetch_time > 60 or not cached_tasks:
            fresh_data = fetch_tasks_from_db()
            if fresh_data:
                cached_tasks = fresh_data
                last_fetch_time = time.time()

    selected = []
    current_cost = 0
    for task in cached_tasks:
        if current_cost + task["cost"] > budget: break
        current_cost += task["cost"]
        selected.append(task)

    teams_data = [{"team_id": i + 1, "route_steps": []} for i in range(teams)]
    for idx, task in enumerate(selected):
        teams_data[idx % teams]["route_steps"].append(task)

    return {"summary": {"total_cost": current_cost, "selected_count": len(selected)}, "data": teams_data}

@app.get("/health")
def health():
    return {"status": "ok"}
