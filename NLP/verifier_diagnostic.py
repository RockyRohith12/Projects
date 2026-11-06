import json
import requests
from pathlib import Path

from main import convert_units, MODEL, OLLAMA_URL

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

CORRUPTION_MULTIPLIER = 0.90


def ask_verifier(task, observed):

    conversion_factors = {
        ("kg", "lb"): 2.20462,
        ("lb", "kg"): 1 / 2.20462,
        ("km", "miles"): 0.621371,
        ("miles", "km"): 1 / 0.621371
    }

    key = (
        task["from_unit"].lower(),
        task["to_unit"].lower()
    )

    factor = conversion_factors[key]

    expected = round(task["value"] * factor, 4)
    actual = observed["value"]

    relative_error = (
        abs(actual - expected) / abs(expected)
    )

    return relative_error > 0.02

def create_test_cases():

    cases = []

    for task_id, task in enumerate(TASKS, start=1):

        correct = convert_units(**task)

        cases.append({
            "task_id": task_id,
            "fault_label": False,
            "condition": "correct",
            "task": task,
            "observed": correct
        })

        faulty = correct.copy()

        faulty["value"] = round(
            correct["value"] * CORRUPTION_MULTIPLIER,
            4
        )

        cases.append({
            "task_id": task_id,
            "fault_label": True,
            "condition": "faulty",
            "task": task,
            "observed": faulty
        })

    return cases


def main():

    cases = create_test_cases()

    TP = 0
    FP = 0
    TN = 0
    FN = 0

    records = []

    print("MODEL:", MODEL)
    print("TOTAL TEST CASES:", len(cases))
    print("\nStarting verifier diagnostic...\n")

    for index, case in enumerate(cases, start=1):

        prediction = ask_verifier(
            case["task"],
            case["observed"]
        )

        actual = case["fault_label"]

        if actual and prediction:
            TP += 1

        elif not actual and prediction:
            FP += 1

        elif not actual and not prediction:
            TN += 1

        else:
            FN += 1

        records.append({
            "task_id": case["task_id"],
            "condition": case["condition"],
            "actual_fault": actual,
            "verifier_flag": prediction,
            "observed": case["observed"]
        })

        print(
            f"{index}/{len(cases)} | "
            f"{case['condition']} | "
            f"Detected: {prediction}"
        )

    recall = TP / (TP + FN) if TP + FN else 0
    fpr = FP / (FP + TN) if FP + TN else 0
    specificity = TN / (TN + FP) if TN + FP else 0
    precision = TP / (TP + FP) if TP + FP else 0
    accuracy = (TP + TN) / len(cases)

    metrics = {
        "TP": TP,
        "FP": FP,
        "TN": TN,
        "FN": FN,
        "detection_rate": recall,
        "false_positive_rate": fpr,
        "specificity": specificity,
        "precision": precision,
        "accuracy": accuracy
    }

    output_dir = Path(__file__).resolve().parent / "results"
    output_dir.mkdir(exist_ok=True)

    output_path = output_dir / "verifier_diagnostic.json"

    with open(output_path, "w", encoding="utf-8") as file:
        json.dump({
            "metrics": metrics,
            "records": records
        }, file, indent=4)

    print("\n========== RESULTS ==========")

    for key, value in metrics.items():
        print(f"{key}: {value}")

    print("\nResults saved to:", output_path)


if __name__ == "__main__":
    main()