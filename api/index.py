import os
import time
import threading
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text

# ⚡ ה-URL המדויק שלך
DB_URL = "postgresql://neondb_owner:npg_HPEtW5GAu0gh@ep-damp-waterfall-agn3hn0j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# יצירת מנוע יציב עם Pool מותאם
engine = create_engine(
    DB_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

app = FastAPI()

# ⚡ קריטי: הגדרת CORS - בלעדיה הדפדפן יחסום את ה-Fetch
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CACHE LOGIC ---
CACHE_TTL = 60  # רענון פעם בדקה
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
        print(f"❌ שגיאת בסיס נתונים: {e}")
        return []

@app.get("/optimize-routes")
def optimize_routes(budget: float = Query(40000), teams: int = Query(3)):
    global cached_tasks, last_fetch_time
    
    with cache_lock:
        now = time.time()
        # רענון הקאש רק אם עבר הזמן או שהוא ריק
        if now - last_fetch_time > CACHE_TTL or not cached_tasks:
            print("DEBUG: מושך נתונים טריים מ-Neon...")
            fresh_data = fetch_tasks_from_db()
            if fresh_data:
                cached_tasks = fresh_data
                last_fetch_time = now

    # סינון תקציב בזיכרון (RAM) - מהירות שיא
    selected = []
    current_cost = 0
    for task in cached_tasks:
        if current_cost + task["cost"] > budget:
            break
        current_cost += task["cost"]
        selected.append(task)

    # חלוקת Round Robin לצוותים
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

@app.get("/health")
def health():
    return {"status": "ok", "cached_items": len(cached_tasks)}

if __name__ == "__main__":
    import uvicorn
    print("🚀 שרת ה-Backend מופעל בכתובת: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)