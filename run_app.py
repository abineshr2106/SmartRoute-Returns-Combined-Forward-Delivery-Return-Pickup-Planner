import subprocess
import sys
import time
import os

def main():
    print("=" * 60)
    print("SMARTROUTE RETURNS — Combined Forward Delivery & Return Planner")
    print("REVIEW 1 DEMO LAUNCHER (~35% COMPLETION STAGE)")
    print("=" * 60)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. Generate Dataset
    print("\n[1/3] Verifying synthetic logistics dataset...")
    gen_script = os.path.join(base_dir, "backend", "data", "dataset_generator.py")
    subprocess.run([sys.executable, gen_script], check=True)

    # 2. Start FastAPI Backend Server
    print("\n[2/3] Starting FastAPI Backend API on http://127.0.0.1:8000 ...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.main:"
    "", "--host", "127.0.0.1", "--port", "8000"]
    backend_process = subprocess.Popen(backend_cmd, cwd=base_dir)

    time.sleep(2)

    # 3. Start Frontend Vite Server
    print("\n[3/3] Starting React Frontend on http://localhost:3000 ...")
    node_npm = r"C:\Users\ABINESH R\node-v20\npm.cmd"
    if not os.path.exists(node_npm):
        node_npm = "npm"

    frontend_dir = os.path.join(base_dir, "frontend")
    frontend_process = subprocess.Popen([node_npm, "run", "dev"], cwd=frontend_dir, shell=True)

    print("\n" + "=" * 60)
    print("Application successfully launched!")
    print("Backend API:  http://127.0.0.1:8000/docs")
    print("Frontend UI:  http://localhost:3000")
    print("=" * 60 + "\n")

    try:
        backend_process.wait()
    except KeyboardInterrupt:
        print("\nStopping servers...")
        backend_process.terminate()
        frontend_process.terminate()

if __name__ == "__main__":
    main()
