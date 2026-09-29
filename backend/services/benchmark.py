import time
from typing import List, Dict
from backend.services.baseline import calculate_baseline
from backend.services.optimizer import run_combined_optimization

def run_performance_experiments(deliveries: List[Dict], returns: List[Dict], vehicles: List[Dict]) -> List[Dict]:
    """
    Run performance benchmark experiments across 3 scenarios:
    - Scenario A: 200 deliveries, 10 returns
    - Scenario B: 200 deliveries, 20 returns
    - Scenario C: 200 deliveries, 30 returns
    Measures Baseline KM, Combined Incremental KM, KM Saved, Assignment Rate %, and Planning Runtime (ms).
    """
    scenarios = [
        {"name": "Scenario A (10 Returns)", "count": 10},
        {"name": "Scenario B (20 Returns)", "count": 20},
        {"name": "Scenario C (30 Returns)", "count": 30},
        {"name": "Scenario D (40 Returns)", "count": 40},
        {"name": "Scenario E (50 Returns)", "count": 50},
    ]
    
    results = []
    for sc in scenarios:
        count = min(sc["count"], len(returns))
        sub_returns = returns[:count]
        
        start_time = time.time()
        
        # Calculate baseline
        base_res = calculate_baseline(deliveries, sub_returns, vehicles)
        
        # Run optimization
        fmt_routes, proc_returns, _ = run_combined_optimization(deliveries, sub_returns, vehicles)
        
        elapsed_ms = round((time.time() - start_time) * 1000.0, 2)
        
        baseline_ret_km = base_res["separate_return_km"]
        comb_inc_km = sum(r["incremental_km"] for r in fmt_routes)
        km_saved = round(max(0.0, baseline_ret_km - comb_inc_km), 2)
        improvement_pct = round((km_saved / baseline_ret_km * 100.0) if baseline_ret_km > 0 else 0.0, 1)
        
        assigned_count = sum(1 for ret in proc_returns if ret["status"] == "Assigned")
        assign_rate = round((assigned_count / count * 100.0) if count > 0 else 0.0, 1)
        
        results.append({
            "scenario": sc["name"],
            "total_deliveries": len(deliveries),
            "returns_count": count,
            "baseline_return_km": baseline_ret_km,
            "combined_incremental_km": round(comb_inc_km, 2),
            "km_saved": km_saved,
            "improvement_pct": improvement_pct,
            "assignment_rate_pct": assign_rate,
            "runtime_ms": elapsed_ms
        })
        
    return results
