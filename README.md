# SMARTROUTE RETURNS
### Combined Forward Delivery and Return/Warranty Pickup Planner for Electronics Retail
**Academic Capstone Project — Review 1 Stage (~35% Completion)**

---

## 1. Problem Statement & Business Context
An electronics retailer currently plans forward deliveries and customer returns/warranty collections independently. 

```
CURRENT INEFFICIENT PROCESS:
Forward Deliveries  ──► Delivery Route Planning ──► Customer Deliveries
Returns/Warranty    ──► Separate Pickup Planning ──► Customer Pickups
```

This separate planning strategy leads to:
- Duplicate vehicle travel in identical geographic sectors
- High incremental return pickup kilometres
- Suboptimal vehicle weight and volume capacity utilization
- Increased logistics costs and driver time conflicts

### Core Objective (Review 1)
**SmartRoute Returns** integrates return/warranty pickups into existing forward delivery routes wherever feasible, respecting vehicle weight/volume constraints and time windows while drastically reducing incremental return collection kilometres.

**Primary KPI:** **INCREMENTAL KILOMETRES REQUIRED FOR RETURN COLLECTION**

---

## 2. System Architecture

```
                DELIVERY DATA (200 Records)
                     |
                RETURN DATA (30 Requests)
                     |
                VEHICLE DATA (10 Vehicles)
                     |
                     ↓
              DATA VALIDATION
                     |
                     ↓
              BASELINE ENGINE (Separate Trips)
                     |
                     ↓
          COMBINED ROUTE PLANNER (Insertion Engine)
                     |
            ┌────────┴────────┐
            ↓                 ↓
       CAPACITY CHECK    TIME WINDOW
    (Weight & Volume)    (Sequence Traversal)
            ↓                 ↓
            └────────┬────────┘
                     ↓
              DISTANCE ENGINE (Haversine Matrix)
                     |
                     ↓
             KPI CALCULATION (KM Saved & % Imp.)
                     |
                     ↓
                DASHBOARD (React + Recharts UI)
```

---

## 3. Dataset Specifications

The prototype uses a realistic, deterministic synthetic dataset located in `dataset/`:

- **200 Delivery Records (`deliveries.csv`)**: 10 routes (R01–R10), 20 deliveries per route.
- **30 Return Requests (`returns.csv`)**: Warranty returns, customer returns, repair pickups, damaged item collections.
- **10 Vehicles (`vehicles.csv`)**: Weight capacity = 500.0 kg, Volume capacity = 10.0 m³, Working hours = 8.0 hrs.
- **1 Central Depot**: Located in Chennai Electronics Logistics Hub (Lat: `13.0827`, Lng: `80.2707`).

### Electronics Catalog & Volume Model
| Item Type | Size | Weight Range (kg) | Volume ($m^3$) |
| :--- | :--- | :--- | :--- |
| **Smartphone / Laptop** | Small | 0.5 – 4.0 kg | 0.02 $m^3$ |
| **Printer / Monitor / Microwave** | Medium | 5.0 – 16.0 kg | 0.08 $m^3$ |
| **Television / Air Conditioner** | Large | 15.0 – 40.0 kg | 0.30 $m^3$ |
| **Washing Machine / Refrigerator** | Extra Large | 45.0 – 65.0 kg | 0.60 $m^3$ |

---

## 4. Optimization Engine & Key Formulas

### Baseline Method
Calculates the current separate process:
$$\text{Baseline Total KM} = \text{Forward Delivery KM} + \text{Separate Return Collection KM}$$

### Combined Planner Insertion Heuristic
For each return request, the engine evaluates insertion into existing forward routes, enforcing:
1. **Vehicle Weight Capacity**: $\sum \text{Weights} \le \text{Weight Capacity}$ (500 kg)
2. **Vehicle Volume Capacity**: $\sum \text{Volumes} \le \text{Volume Capacity}$ (10.0 $m^3$)
3. **Time Window Feasibility**: Route timeline traversal from 08:00 AM ensuring arrival $\le$ pickup time window end.
4. **Vehicle Availability**: Unavailable vehicles are excluded.

### Primary KPI Formulas
$$\text{Incremental KM} = \text{Combined Route KM} - \text{Original Forward Delivery KM}$$
$$\text{KM Saved} = \text{Baseline Return Collection KM} - \text{Combined Incremental KM}$$
$$\text{Percentage Improvement (\%)} = \left(\frac{\text{KM Saved}}{\text{Baseline Return Collection KM}}\right) \times 100$$

---

## 5. Review 1 Scope (~35% Completion)

| Status | Feature Requirement | Notes |
| :---: | :--- | :--- |
| [✓] | Synthetic Demo Dataset | 200 deliveries, 30 returns, 10 vehicles, 1 depot |
| [✓] | Baseline Distance Engine | Dynamic separate return collection calculation |
| [✓] | Combined Route Planner | Insertion heuristic with distance minimization |
| [✓] | Hard Constraints | Weight capacity, volume capacity, time windows, vehicle availability |
| [✓] | Soft Preference | Minimum incremental distance selection |
| [✓] | Workload Indicator | Basic route duration monitoring (Normal / Elevated / Risk) |
| [✓] | Interactive Map Canvas | Simulated SVG/Canvas route visualizer with stop details |
| [✓] | Dashboard & Benchmark | Baseline vs Combined comparison, target setting, error analysis |
| [✓] | CSV Export | Routes plan, return assignments, benchmark report exports |
| [✓] | Unit Testing | Pytest test suite for hard constraint violations |

---

## 6. How to Run the Application

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend Setup (FastAPI)
```bash
# Navigate to workspace root
cd "c:\Users\ABINESH R\OneDrive\Desktop\coe project"

# Install Python dependencies
pip install -r requirements.txt

# Generate CSV datasets (if not generated)
python backend/data/dataset_generator.py

# Run FastAPI backend server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation available at: `http://127.0.0.1:8000/docs`

### Frontend Setup (React + Vite + TypeScript + Tailwind)
```bash
# Navigate to frontend folder
cd frontend

# Install Node modules
npm install

# Run Vite dev server
npm run dev
```
Open browser at: `http://localhost:3000`

---

## 7. Demonstration Workflow for Evaluator

1. **Step 1:** Open `http://localhost:3000`.
2. **Step 2:** Click **LOAD DEMO DATA** (Displays 200 Deliveries, 30 Returns, 10 Vehicles).
3. **Step 3:** Click **RUN BASELINE** (Calculates separate return collection kilometres).
4. **Step 4:** Click **RUN COMBINED PLANNER** (Integrates return pickups into delivery routes).
5. **Step 5:** Review Dashboard KPIs: Baseline Return KM, Combined Incremental KM, KM Saved, % Improvement.
6. **Step 6:** Navigate to **Route Planner** tab to inspect individual route sequences (R01–R10) and interactive map canvas.
7. **Step 7:** Navigate to **Return Requests** tab to filter return requests (Assigned vs Blocked) and check blockage reasons (e.g. Capacity or Time Window conflicts).
8. **Step 8:** Navigate to **Benchmark** tab to review Scenario A/B/C scaling experiments and download CSV reports.

---

## 8. Future Development (Planned for Review 2 & Final Review)

> [!NOTE]
> Review 1 represents approximately **35% completion**. Advanced features are deliberately reserved for subsequent development phases.

### Planned for Review 2
- Multiple competing optimization objectives (Pareto frontier)
- Advanced worker workload protection and ergonomic rest break modeling
- Authorized override workflow for operational dispatchers
- Dynamic disruption simulation (vehicle breakdown, traffic delay, urgent pickup injection)

### Planned for Final Review
- ML prediction model for return volume forecasting
- Stakeholder validation & ethics evaluation module
- Full production deployment checklist and auditing system
