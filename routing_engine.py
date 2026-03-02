import numpy as np
from ortools.constraint_solver import routing_enums_pb2, pywrapcp
from math import radians, cos, sin, asin, sqrt

def haversine(lon1, lat1, lon2, lat2):
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    return 2 * asin(sqrt(sin((lat2-lat1)/2)**2 + cos(lat1)*cos(lat2)*sin((lon2-lon1)/2)**2)) * 6371

def solve_vrp(selected_issues, num_vehicles=3):
    if selected_issues.empty: return []
    
    issue_list = selected_issues.to_dict('records')
    depot = (35.21, 31.76) # נקודת מוצא ירושלים
    locs = [depot] + [(iss['location_lon'], iss['location_lat']) for iss in issue_list]
    dist_matrix = [[int(haversine(a[0], a[1], b[0], b[1]) * 1000) for b in locs] for a in locs]
    
    manager = pywrapcp.RoutingIndexManager(len(dist_matrix), num_vehicles, 0)
    routing = pywrapcp.RoutingModel(manager)
    transit_idx = routing.RegisterTransitCallback(lambda f, t: dist_matrix[manager.IndexToNode(f)][manager.IndexToNode(t)])
    routing.SetArcCostEvaluatorOfAllVehicles(transit_idx)
    
    # אילוץ זמן: 180 דקות לצוות
    demands = [0] + [int(iss.get('estimated_duration_hours', 1) * 60) for iss in issue_list]
    demand_idx = routing.RegisterUnaryTransitCallback(lambda i: demands[manager.IndexToNode(i)])
    routing.AddDimensionWithVehicleCapacity(demand_idx, 0, [180]*num_vehicles, True, 'Capacity')

    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    solution = routing.SolveWithParameters(search_params)
    
    output = []
    if solution:
        for v_id in range(num_vehicles):
            route = {"team_id": v_id + 1, "route_steps": [], "total_distance_meters": 0}
            idx = routing.Start(v_id)
            while not routing.IsEnd(idx):
                node = manager.IndexToNode(idx)
                if node > 0:
                    iss = issue_list[node-1]
                    route["route_steps"].append({
                        "id": int(iss['id']), "category": str(iss['category']),
                        "lat": float(iss['location_lat']), "lon": float(iss['location_lon']),
                        "cost": float(iss['estimated_cost'])
                    })
                prev = idx
                idx = solution.Value(routing.NextVar(idx))
                route["total_distance_meters"] += routing.GetArcCostForVehicle(prev, idx, v_id)
            output.append(route)
    else:
        # Fallback לוגיקה למקרה שהאלגוריתם נכשל - חלוקה ידנית
        output = [{"team_id": i + 1, "route_steps": [], "total_distance_meters": 0} for i in range(num_vehicles)]
        for i, iss in enumerate(issue_list):
            v_idx = i % num_vehicles
            output[v_idx]["route_steps"].append({
                "id": int(iss['id']), "category": str(iss['category']),
                "lat": float(iss['location_lat']), "lon": float(iss['location_lon']),
                "cost": float(iss['estimated_cost'])
            })
    return output