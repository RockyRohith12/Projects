
import random
import json
from pathlib import Path
from datetime import datetime

# Import our existing conversion tool
import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))

from main import convert_units


# ==========================================
# EXPERIMENT CONFIGURATION
# ==========================================

FAULT_RATES = [0.00, 0.05, 0.10, 0.20, 0.40]

RANDOM_SEED = 42

RESULTS_DIR = Path(__file__).resolve().parent.parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)


# ==========================================
# FAULT INJECTION
# ==========================================

def inject_fault(correct_output, fault_probability, rng):
    """
    Inject a silent numerical fault with a given probability.

    Returns:
        observed_output
        fault_injected
    """

    if rng.random() < fault_probability:

        faulty_output = correct_output.copy()

        # Introduce a plausible numerical error
        faulty_output["value"] = round(
            correct_output["value"] * 0.90, 4
        )

        return faulty_output, True

    return correct_output.copy(), False


# ==========================================
# EXPERIMENT TASKS
# ==========================================

TASKS = [
    {"value": 10, "from_unit": "kg", "to_unit": "lb"},
    {"value": 5, "from_unit": "km", "to_unit": "miles"},
    {"value": 20, "from_unit": "lb", "to_unit": "kg"},
    {"value": 12, "from_unit": "miles", "to_unit": "km"},
    {"value": 25, "from_unit": "kg", "to_unit": "lb"},
    {"value": 8, "from_unit": "km", "to_unit": "miles"},
    {"value": 15, "from_unit": "lb", "to_unit": "kg"},
    {"value": 30, "from_unit": "miles", "to_unit": "km"},
]


# ==========================================
# RUN FAULT INJECTION EXPERIMENT
# ==========================================

def run_fault_experiment():

    rng = random.Random(RANDOM_SEED)

    records = []

    for fault_rate in FAULT_RATES:

        print(f"\nTesting fault rate: {fault_rate:.0%}")

        for task_id, task in enumerate(TASKS, start=1):

            # Calculate correct answer
            ground_truth = convert_units(**task)

            # Inject controlled fault
            observed_output, fault_injected = inject_fault(
                ground_truth,
                fault_rate,
                rng
            )

            record = {
                "timestamp": datetime.now().isoformat(),
                "task_id": task_id,
                "task": task,
                "fault_rate": fault_rate,
                "ground_truth": ground_truth,
                "observed_output": observed_output,
                "fault_injected": fault_injected,
            }

            records.append(record)

            print(
                f"Task {task_id}: "
                f"Fault injected = {fault_injected}"
            )

    output_file = RESULTS_DIR / "fault_injection.json"

    with open(output_file, "w", encoding="utf-8") as file:
        json.dump(records, file, indent=4)

    print("\nExperiment completed.")
    print("Records generated:", len(records))
    print("Saved to:", output_file)


if __name__ == "__main__":
    run_fault_experiment()
