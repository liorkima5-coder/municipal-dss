import pandas as pd
from sqlalchemy import create_engine
from ortools.linear_solver import pywraplp

# חיבור ל-DB
DB_URL = "postgresql://neondb_owner:npg_HPEtW5GAu0gh@ep-damp-waterfall-agn3hn0j-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
engine = create_engine(DB_URL)

def run_optimization(daily_budget=15000, total_hours=24):
    # 1. משיכת נתונים
    df = pd.read_sql("SELECT * FROM issues WHERE status = 'OPEN'", engine)
    
    # 2. חישוב ציון עדיפות (Heuristic Score)
    # נוסחה: (חומרה * 0.4) + (סיכון בטיחותי * 0.6) + בונוס על דחיפות SLA
    df['priority_score'] = (df['severity'] * 0.4) + (df['safety_risk'] * 0.6)
    
    # 3. הגדרת ה-Solver (Integer Programming)
    solver = pywraplp.Solver.CreateSolver('SCIP')
    
    # משתני החלטה: האם לתקן תקלה i? (0 או 1)
    x = {}
    for i in df.index:
        x[i] = solver.IntVar(0, 1, f'x_{i}')
    
    # 4. אילוצים (Constraints)
    # אילוץ תקציב
    solver.Add(sum(x[i] * df.loc[i, 'estimated_cost'] for i in df.index) <= daily_budget)
    
    # אילוץ שעות עבודה
    solver.Add(sum(x[i] * df.loc[i, 'estimated_duration_hours'] for i in df.index) <= total_hours)
    
    # 5. פונקציית מטרה (Objective): מקסום ציון העדיפות הכולל
    objective = solver.Objective()
    for i in df.index:
        objective.SetCoefficient(x[i], df.loc[i, 'priority_score'])
    objective.SetMaximization()
    
    # הרצה
    status = solver.Solve()
    
    if status == pywraplp.Solver.OPTIMAL:
        selected_indices = [i for i in df.index if x[i].solution_value() > 0.5]
        selected_issues = df.loc[selected_indices]
        
        print(f"--- תוצאות אופטימיזציה ---")
        print(f"נבחרו {len(selected_issues)} משימות מתוך {len(df)}")
        print(f"ניצול תקציב: {selected_issues['estimated_cost'].sum():.2f} / {daily_budget}")
        print(f"ניצול שעות: {selected_issues['estimated_duration_hours'].sum():.2f} / {total_hours}")
        print(f"\nמשימות נבחרות:")
        print(selected_issues[['id', 'category', 'severity', 'estimated_cost']])
        return selected_issues
    else:
        print("לא נמצא פתרון אופטימלי.")
        return None

if __name__ == "__main__":
    run_optimization()