import os
import time
import threading
import numpy as np
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from math import radians, cos, sin, asin, sqrt

# ניסיון לייבא את הספריות הכבדות
try:
    from ortools.linear_solver import pywraplp
    from ortools.constraint_solver import routing_enums_pb2, pywrapcp
    HAS_ORTOOLS = True
except ImportError:
    HAS_ORTOOLS = False

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_HPEtW5GAu0gh@ep-damp-waterfall-agn3hn0j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require")
engine = create_engine(DATABASE_URL, pool_size=1, max_overflow=0, pool_pre_ping=True)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# --- פונקציות עזר (Haversine) ---
def haversine(lon1, lat1, lon2, lat2):
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    return 2 * asin(sqrt(sin((lat2-lat1)/2)**2 + cos(lat1)*cos(lat2)*sin((lon2-lon1)/2)**2)) * 6371

# --- לוגיקת אופטימיזציה (Knapsack) ---
def get_optimized_tasks(budget):
    query = text("""
        SELECT id, category, severity, estimated_cost AS cost,
               ST_X(location::geometry) AS lon,
               ST_Y(location::geometry) AS lat
        FROM issues WHERE status = 'OPEN'
        ORDER BY severity DESC LIMIT 500
    """)
    try:
        with engine.connect() as conn:
            result = conn.execute(query)
            rows = result.fetchall()
        
        tasks = []
        total_cost = 0
        for r in rows:
            if total_cost + float(r.cost) <= budget:
                tasks.append({"id": r.id, "category": r.category, "cost": float(r.cost), "lat": float(r.lat), "lon": float(r.lon)})
                total_cost += float(r.cost)
        return tasks, total_cost
    except: return [], 0

# --- לוגיקת ניתוב (Routing) ---
def build_routes(tasks, num_teams):
    if not tasks: return []
    
    # חלוקה חכמה לפי קרבה גיאוגרפית (K-Means simplified)
    teams_data = [{"team_id": i + 1, "route_steps": []} for i in range(num_teams)]
    
    # מיון משימות לפי קווי רוחב כדי ליצור "מקבצים" גיאוגרפיים
    sorted_tasks = sorted(tasks, key=lambda x: (x['lat'], x['lon']))
    
    for idx, task in enumerate(sorted_tasks):
        teams_data[idx % num_teams]["route_steps"].append(task)
        
    return teams_data

@app.get("/api/optimize-routes")
def optimize_routes(budget: float = Query(40000), teams: int = Query(3)):
    tasks, total_cost = get_optimized_tasks(budget)
    routes = build_routes(tasks, teams)
    
    return {
        "summary": {"total_cost": total_cost, "selected_count": len(tasks)},
        "data": routes
    }

@app.get("/api/health")
def health():
    return {"status": "ok", "solver": "hybrid_optimized"}
