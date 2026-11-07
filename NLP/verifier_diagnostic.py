"""LLM verifier diagnostic. Uses the same verifier client as the experiment."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
from main import convert_units
from experiments.verifier_client import MODEL, ask_verifier, VerifierError

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
CORRUPTION_LEVELS = [0.00, 0.02, 0.10, 0.25]


def build_cases():
    cases = []
    for task_id, task in enumerate(TASKS, 1):
        correct = convert_units(**task)
        for level in CORRUPTION_LEVELS:
            observed = correct.copy()
            if level:
                observed["value"] = round(correct["value"] * (1 - level), 4)
            cases.append({"task_id": task_id, "corruption_level": level,
                          "actual_fault": level > 0, "task": task,
                          "observed": observed})
    return cases


def rate(num, den):
    return num / den if den else None


def main():
    cases = build_cases()
    tp = fp = tn = fn = errors = 0
    records = []
    print(f"Model: {MODEL} | Diagnostic cases: {len(cases)}")
    for i, case in enumerate(cases, 1):
        try:
            prediction = ask_verifier(case["task"], case["observed"])
            error = None
        except VerifierError as exc:
            prediction, error = None, str(exc)
            errors += 1
        actual = case["actual_fault"]
        if prediction is not None:
            if actual and prediction: tp += 1
            elif not actual and prediction: fp += 1
            elif not actual and not prediction: tn += 1
            else: fn += 1
        records.append({"task_id": case["task_id"],
                        "corruption_level": case["corruption_level"],
                        "actual_fault": actual, "verifier_flag": prediction,
                        "error": error})
        print(f"{i:02d}/{len(cases)} | corruption={case['corruption_level']:.0%} | prediction={prediction} | error={error}")

    metrics = {
        "model": MODEL, "n_cases": len(cases),
        "n_valid_predictions": tp + fp + tn + fn, "n_errors": errors,
        "TP": tp, "FP": fp, "TN": tn, "FN": fn,
        "detection_rate": rate(tp, tp + fn),
        "false_positive_rate": rate(fp, fp + tn),
        "specificity": rate(tn, tn + fp),
        "precision": rate(tp, tp + fp),
        "accuracy": rate(tp + tn, tp + fp + tn + fn),
        "note": "Exploratory diagnostic: 8 tasks x 4 corruption levels; not a held-out benchmark."
    }
    out = ROOT / "results" / "verifier_diagnostic_v2.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps({"metrics": metrics, "records": records}, indent=2), encoding="utf-8")
    print("\nMETRICS\n" + json.dumps(metrics, indent=2))
    print(f"Saved: {out}")


if __name__ == "__main__":
    main()
