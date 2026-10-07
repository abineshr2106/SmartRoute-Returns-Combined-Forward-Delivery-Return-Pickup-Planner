# SMARTROUTE RETURNS
### Combined Forward Delivery and Return/Warranty Pickup Planner for Electronics Retail
**Academic Capstone Project — Final Version (Complete Academic/Demo Prototype)**

---

## 1. Problem Statement & Business Context
An electronics retailer currently plans forward deliveries and customer returns/warranty collections independently. 

```text
CURRENT INEFFICIENT PROCESS:
Forward Deliveries  ──► Delivery Route Planning ──► Customer Deliveries
Returns/Warranty    ──► Separate Pickup Planning ──► Customer Pickups
```

This separate planning strategy leads to duplicate vehicle travel, high incremental return pickup kilometres, suboptimal vehicle capacity utilization, increased logistics costs, and driver time conflicts.

**Core Objective**
SmartRoute Returns integrates return/warranty pickups into existing forward delivery routes wherever feasible. It uses a **multi-objective greedy insertion heuristic** to minimize incremental distance while strictly respecting vehicle capacity, time windows, and actively protecting driver workload.

---

## 2. System Architecture

The system is built as a React/Vite frontend powered by a FastAPI Python backend. 

```text
                DELIVERY, RETURN, VEHICLE DATA
                              ↓
              COMBINED ROUTE PLANNER (Heuristic Engine)
                              ↓
             ┌────────────────┴────────────────┐
             ↓                                 ↓
      HARD CONSTRAINTS                 MULTI-OBJECTIVE SCORING
    - Weight Capacity                  - Incremental KM Penalty
    - Volume Capacity                  - Driver Workload Penalty
    - Time Windows
                              ↓
                      DISRUPTION ENGINE
         (Simulates Traffic, Breakdowns, Urgent Pickups)
                              ↓
                      DASHBOARD UI
         (Stakeholder Validation Instrument)
```

**Stakeholder Validation Instrument:** The frontend dashboard serves primarily as a validation instrument. It allows non-technical managers, dispatchers, and external reviewers to inspect algorithmic routing decisions, explore disruption scenarios, and analyze multi-objective trade-offs without requiring coding knowledge. The accompanying stakeholder questionnaire is provided for structured evaluation; external stakeholder sign-off is not claimed unless completed separately.

---

## 3. Dataset Specifications
- **200 Delivery Records**: 10 routes (R01–R10), 20 deliveries per route.
- **50 Return Requests**: Warranty returns, damaged item collections.
- **10 Vehicles**: 500 kg weight capacity, 10.0 m³ volume, 8.0 hr shifts.
- **Central Depot**: Chennai Electronics Logistics Hub (13.0827, 80.2707).

---

## 4. Optimization Engine & Key Formulas

**Disclaimer:** The optimization engine utilizes a **Multi-Objective Greedy Insertion Heuristic**. It is *not* a Mixed Integer Linear Programming (MILP) exact solver. It approximates the optimal route by dynamically evaluating the best insertion points.

### Combined Planner Insertion Heuristic
For each return request, the engine evaluates insertion into existing forward routes by finding the position that minimizes a multi-objective cost function:

$$\text{Cost} = (\alpha \times \text{Normalized } \Delta KM) + (\beta \times \text{Normalized Workload Penalty})$$

Where $\Delta KM$ is the greedy insertion formula:
$$\Delta_d(i, r, j) = d(i, r) + d(r, j) - d(i, j)$$
- $r$ is the return location.
- $i$ and $j$ are adjacent nodes in the existing route.

### Hard Constraints
1. **Weight Capacity**: $\sum \text{Weights} \le \text{Weight Capacity}$ (500 kg)
2. **Volume Capacity**: $\sum \text{Volumes} \le \text{Volume Capacity}$ (10.0 $m^3$)
3. **Time Windows**: Arrival $\le$ pickup time window end.
4. **Max Workload limits**: Maximum stops per route and maximum shift hours.

---

## 5. Advanced System Features

### Authorized Override System
Dispatchers can manually force a return insertion into a specific route, bypassing algorithmic capacity and time-window constraints.
- **Audit Trail:** All overrides require a dispatcher ID and justification and are recorded in the application audit log for traceability during the active application session.
- **Constraint Warnings:** Routes forced into violation are flagged with a `WARNING` status rather than failing silently.

### Disruption Simulation Engine
Tests operational resilience by injecting real-world chaos:
1. **Traffic Delay**: Increases all service times by 5 minutes.
2. **Vehicle Capacity Loss**: Reduces total vehicle capacity by 25%.
3. **Vehicle Breakdown**: Marks a specific vehicle (V01) as completely unavailable.
4. **Urgent Return Request**: Injects an unexpected extra-large, urgent warranty pickup.

### Pareto / Trade-off Analysis
The system runs multiple algorithmic passes ($\alpha$ vs $\beta$) to generate a Pareto frontier, allowing management to visualize the trade-off between absolute minimal driving distance and equitable driver workload distribution.

### Forecasting Module
A lightweight predictive analytics module utilizing a 7-Day Moving Average and Exponential Smoothing ($\alpha=0.3$) to project next-day return volumes, enabling proactive fleet capacity allocation.

---

## 6. Reproducible Results Table

*Benchmark results based on the standard 50-Return dataset evaluation (Distance Focus Mode).*

| Scenario | Deliveries | Returns | Baseline Return KM | Combined Incremental KM | KM Saved | % Improvement | Assignment Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Scenario A** | 200 | 10 | 196.4 km | 8.2 km | 188.2 km | 95.8% | 100.0% |
| **Scenario B** | 200 | 20 | 389.2 km | 15.5 km | 373.7 km | 96.0% | 100.0% |
| **Scenario C** | 200 | 30 | 582.5 km | 21.0 km | 561.5 km | 96.4% | 96.7% |
| **Scenario D** | 200 | 40 | 785.1 km | 30.2 km | 754.9 km | 96.2% | 95.0% |
| **Scenario E** | 200 | 50 | 974.8 km | 42.1 km | 932.7 km | 95.7% | 94.0% |

> *Note: "Percentage Improvement" measures the reduction in strictly Return-associated travel kilometres compared to a separate fleet baseline. It does not mean the entire forward delivery network was reduced by 95%.*

---

## 7. Ethics & Responsible Operations
- **Driver Burnout Prevention:** The multi-objective cost function heavily penalizes routes approaching maximum shift hours or exceeding 25 stops, preventing the algorithm from dangerously overloading drivers in pursuit of pure distance efficiency.
- **Transparent Logging:** The Authorized Override system prevents management from silently bypassing safety constraints without accountability. All forced assignments are permanently recorded with timestamps and dispatcher IDs.
- **Equitable Workload:** The `Balanced` optimization mode ensures that returns are distributed evenly across the fleet, rather than dumping all returns onto the geographically closest driver.

---

## 8. Future Production Enhancements (Out of Academic Scope)
While this prototype is complete for its defined academic and demonstration objectives, real-world deployment would require the following production-only enhancements:

- **Database Persistence:** Move from in-memory JSON to a persistent SQL database (e.g., PostgreSQL). In the current prototype, datasets and audit-log state reset when the server restarts.
- **Authentication:** Implement Role-Based Access Control (RBAC) for Dispatchers to secure the Authorized Override system.
- **External Routing API:** Distances currently use the Haversine formula. A production environment must integrate an external routing API (OSRM, Google Maps) for actual road-network driving times.
- **Production Deployment:** Standardize deployment via Docker, CI/CD pipelines, and cloud hosting infrastructure.

---

## 9. Academic Validation Status

The project is considered **complete for its defined academic/demo scope** based on the implemented modules, documented benchmark scenarios, and reported automated test results. The stakeholder questionnaire is a structured validation instrument and should not be interpreted as completed external stakeholder approval unless signed responses are collected. The reported benchmark percentages describe reductions in **return-associated travel kilometres** relative to the separate-return baseline; they do not represent a 95% reduction in total forward-delivery network distance.

## 10. API Endpoints & Data Model

### Data Entities
- **Delivery**: Represents a forward logistics task (`delivery_id`, `route_id`, `latitude`, `longitude`, `weight_kg`, `volume_m3`, `time_window`).
- **Return**: Represents a reverse logistics request (`return_id`, `latitude`, `longitude`, `item_type`, `item_weight_kg`, `item_size`, `pickup_time_start/end`, `priority`).
- **Vehicle**: Represents fleet capacity (`vehicle_id`, `weight_capacity_kg`, `volume_capacity_m3`, `working_hours`).

### Key REST Endpoints
- `GET /api/dataset`: Returns a summary of the current loaded mock dataset.
- `GET /api/deliveries`, `GET /api/returns`, `GET /api/vehicles`: Retrieves raw collections.
- `POST /api/run-baseline`: Calculates separate-fleet distance purely for benchmark comparisons.
- `POST /api/run-combined`: Core optimization engine. Accepts optional `OptimizationRequest` payload (e.g., disruption scenarios, dynamic weights). Returns combined routes, updated return statuses, and quantitative summaries.
- `POST /api/override`: Allows dispatchers to forcibly assign a blocked return to a route.
- `GET /api/export/...`: Triggers CSV payload generation for audits.

---

## 11. Error Handling Approach
The system employs a strict, layered error-handling approach:
1. **API Validation (Pydantic)**: FastAPI automatically validates all incoming requests against defined Pydantic schemas, returning precise `422 Unprocessable Entity` errors rather than crashing with `500 Internal Server Errors`.
2. **Defensive UI Rendering**: The React frontend uses optional chaining (`?.`) and explicit empty-state fallbacks for undefined data arrays, preventing blank-screen crashes during network delays or absent data.
3. **Graceful Degradation**: When a return insertion fails a constraint check (capacity, time), the backend engine safely catches the failure and explicitly flags the return as `BLOCKED` with a localized reason (e.g., "Capacity conflict") rather than failing the entire route sequence.

---

## 12. Testing Methodology & Results

The backend contains a rigorous, 25-case Pytest suite designed to validate the mathematical boundaries and logical constraints of the routing heuristic. 
**Current Result: 25 / 25 Tests Passed (reported project test run).**

### Test Categories
- **Capacity Constraints**: Verifies that routes strictly reject items exceeding maximum weight limits (`test_weight_overflow`) or volumetric boundaries (`test_volume_overflow`).
- **Route & Incremental KM Calculations**: Ensures the greedy insertion correctly computes spatial changes without altering fixed delivery nodes (`test_7_incremental_km_calculation`, `test_8_baseline_vs_combined_comparison`).
- **Return Assignment**: Tests valid single and sequential insertions to ensure returns are properly embedded into the `assigned_route_id` (`test_feasible_return`, `test_multiple_returns`).
- **Workload/Time Constraints**: Validates that vehicles do not exceed shift capacities or violate specific hour windows (`test_time_window_violation`, `test_6_time_window_feasibility`).
- **Edge Cases**: Includes scenarios where fleet capacity vanishes (`test_vehicle_unavailable`), mathematically impossible time windows are requested (`test_return_impossible_time_window_blocked`), or absolutely no feasible route exists (`test_no_feasible_route`).

---

## 13. How to Run the Application & Tests

### Backend Setup (FastAPI)
```bash
pip install -r requirements.txt
python backend/data/dataset_generator.py
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation available at: `http://127.0.0.1:8000/docs`

### Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open browser at: `http://localhost:3000`

### Running the Test Suite
The automated test suite evaluates the backend algorithms independently.
```bash
python -m pytest -v tests/
```
