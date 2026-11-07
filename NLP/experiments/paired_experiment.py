"""Paired policy experiment with fixed initial-fault and retry manifests.

Ground truth is used only by the manifest generator and outcome scorer.
Policies receive only the task and observed tool result. The selective policy
is a structural sanity baseline, not a trained risk model.
"""
import argparse
import json
import math
import random
import sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
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
FAULT_RATES = [0.00, 0.05, 0.10, 0.20, 0.40]
POLICIES = ["never_verify", "always_verify", "selective_verify"]


def corrupt(output):
    result = output.copy()
    result["value"] = round(float(result["value"]) * 0.90, 4)
    return result


def build_manifest(repeats, seed):
    """Create one immutable scenario set shared by every policy."""
    rng = random.Random(seed)
    manifest = []
    for rate in FAULT_RATES:
        for rep in range(repeats):
            for task_id, task in enumerate(TASKS, 1):
                truth = convert_units(**task)
                first_fault = rng.random() < rate
                retry_fault = rng.random() < rate
                manifest.append({
                    "case_id": f"r{rate:.2f}-rep{rep}-task{task_id}",
                    "fault_rate": rate, "replicate": rep, "task_id": task_id,
                    "task": task, "ground_truth": truth,
                    "initial_fault": first_fault,
                    "initial_output": corrupt(truth) if first_fault else truth.copy(),
                    "retry_fault": retry_fault,
                    "retry_output": corrupt(truth) if retry_fault else truth.copy()
                })
    return manifest


def structural_gate(task, observed):
    """Observable-only schema/unit sanity check; never computes true answer."""
    if not isinstance(observed, dict):
        return True
    if not {"value", "from_unit", "to_unit"}.issubset(observed):
        return True
    try:
        if not math.isfinite(float(observed["value"])):
            return True
    except (TypeError, ValueError):
        return True
    return (observed["from_unit"] != task["from_unit"]
            or observed["to_unit"] != task["to_unit"])


def is_correct(output, truth):
    try:
        return (isinstance(output, dict)
                and abs(float(output["value"]) - float(truth["value"])) < 0.0001
                and output.get("from_unit") == truth["from_unit"]
                and output.get("to_unit") == truth["to_unit"])
    except (KeyError, TypeError, ValueError):
        return False


def policy_decision(task, observed, policy):
    """Policy boundary: deliberately accepts no labels or ground truth."""
    if policy == "never_verify":
        return False, False, None
    checked = policy == "always_verify" or structural_gate(task, observed)
    if not checked:
        return False, False, None
    try:
        return True, ask_verifier(task, observed), None
    except VerifierError as exc:
        return True, False, str(exc)  # fail closed on verifier errors


def evaluate_case(row, policy):
    # Decision stage sees only public task and observed tool result.
    task, observed = row["task"], row["initial_output"]
    checked, flagged, error = policy_decision(task, observed, policy)

    # Outcome stage alone accesses hidden labels and pre-generated retry.
    truth = row["ground_truth"]
    retry_used = bool(checked and flagged)
    final_output = row["retry_output"] if retry_used else observed
    initial_correct = is_correct(observed, truth)
    final_correct = is_correct(final_output, truth)
    return {
        "case_id": row["case_id"], "fault_rate": row["fault_rate"],
        "replicate": row["replicate"], "task_id": row["task_id"],
        "policy": policy, "initial_fault": row["initial_fault"],
        "retry_fault": row["retry_fault"] if retry_used else None,
        "verification_triggered": checked,
        "verifier_flag": flagged if checked else None,
        "verifier_error": error, "retry_used": retry_used,
        "initial_correct": initial_correct, "final_correct": final_correct,
        "overcorrection": bool(initial_correct and not final_correct),
        "recovery": bool(not initial_correct and final_correct),
        "final_output": final_output
    }


def summarize(records):
    groups = defaultdict(list)
    for row in records:
        groups[(row["fault_rate"], row["policy"])].append(row)
    summary = []
    for (rate, policy), rows in sorted(groups.items()):
        n = len(rows)
        summary.append({
            "fault_rate": rate, "policy": policy, "n": n,
            "initial_accuracy": sum(x["initial_correct"] for x in rows) / n,
            "final_accuracy": sum(x["final_correct"] for x in rows) / n,
            "verification_rate": sum(x["verification_triggered"] for x in rows) / n,
            "retry_rate": sum(x["retry_used"] for x in rows) / n,
            "overcorrection_rate": sum(x["overcorrection"] for x in rows) / n,
            "recovery_rate": sum(x["recovery"] for x in rows) / n,
            "verifier_errors": sum(x["verifier_error"] is not None for x in rows)
        })
    return summary


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repeats", type=int, default=3,
                        help="Replicates per task/rate (default 3)")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    if args.repeats < 1:
        parser.error("--repeats must be >= 1")

    manifest = build_manifest(args.repeats, args.seed)
    records = []
    for policy in POLICIES:
        print(f"\n{policy}: {len(manifest)} paired cases")
        for i, row in enumerate(manifest, 1):
            records.append(evaluate_case(row, policy))
            if i % 20 == 0:
                print(f"  {i}/{len(manifest)}")

    summary = summarize(records)
    out_dir = ROOT / "results"
    out_dir.mkdir(exist_ok=True)
    (out_dir / "paired_manifest_v1.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8")
    (out_dir / "paired_policy_results_v1.json").write_text(
        json.dumps({"model": MODEL, "seed": args.seed, "repeats": args.repeats,
                    "records": records, "summary": summary}, indent=2),
        encoding="utf-8")
    print("\nrate | policy | n | initial_acc | final_acc | verify | retry | overcorrect | recover")
    for x in summary:
        print(f"{x['fault_rate']:.0%} | {x['policy']} | {x['n']} | "
              f"{x['initial_accuracy']:.3f} | {x['final_accuracy']:.3f} | "
              f"{x['verification_rate']:.3f} | {x['retry_rate']:.3f} | "
              f"{x['overcorrection_rate']:.3f} | {x['recovery_rate']:.3f}")
    print(f"\nSaved results in {out_dir}")


if __name__ == "__main__":
    main()
