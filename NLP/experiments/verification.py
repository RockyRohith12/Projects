
import requests
import json
import random
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from main import convert_units

MODEL = "qwen2.5:1.5b"
OLLAMA_URL = "http://localhost:11434/api/chat"

FAULT_RATES = [0.00, 0.05, 0.10, 0.20, 0.40]

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


def tool_call(task, fault_rate, rng):
    """One tool call. Faults are transient and independently sampled."""

    correct = convert_units(**task)

    faulty = rng.random() < fault_rate

    observed = correct.copy()

    if faulty:
        observed["value"] = round(correct["value"] * 0.90, 4)

    return correct, observed, faulty


def ask_verifier(task, observed):
    """Ask the local LLM whether the output appears suspicious."""

    prompt = f"""
You are checking a tool output.

Task: Convert {task['value']} {task['from_unit']} to {task['to_unit']}.
Tool output: {json.dumps(observed)}

Check whether the numerical result is plausible and consistent
with the requested conversion.

Return only JSON:
{{"suspicious": true}}
or
{{"suspicious": false}}
"""

    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "format": "json",
        "options": {"temperature": 0}
    }

    response = requests.post(
        OLLAMA_URL,
        json=payload,
        timeout=120
    )
    response.raise_for_status()

    content = response.json()["message"]["content"]
    result = json.loads(content)

    return bool(result["suspicious"])


def selective_risk_rule(task, observed):
    """
    Initial transparent heuristic.
    Flags values that differ from a simple independently
    calculated conversion expectation by more than 2%.
    """

    expected = convert_units(**task)["value"]
    actual = observed["value"]

    relative_difference = abs(actual - expected) / max(abs(expected), 1e-9)

    return relative_difference > 0.02


def run_experiment():

    policies = [
        "never_verify",
        "always_verify",
        "selective_verify"
    ]

    records = []

    for rate_index, fault_rate in enumerate(FAULT_RATES):

        for policy_index, policy in enumerate(policies):

            # Independent, reproducible random stream per condition
            rng = random.Random(
                1000 + rate_index * 100 + policy_index
            )

            print(f"\nRate: {fault_rate:.0%} | Policy: {policy}")

            for task_id, task in enumerate(TASKS, start=1):

                ground_truth, observed, first_fault = tool_call(
                    task, fault_rate, rng
                )

                if policy == "never_verify":
                    checked = False

                elif policy == "always_verify":
                    checked = True

                else:
                    checked = selective_risk_rule(task, observed)

                verifier_flag = None
                retry_used = False
                retry_fault = None
                final_output = observed

                if checked:
                    # The LLM verifier makes the decision
                    verifier_flag = ask_verifier(task, observed)

                    if verifier_flag:
                        retry_used = True

                        # Retry is a new tool call. It can also fail.
                        _, retry_output, retry_fault = tool_call(
                            task, fault_rate, rng
                        )

                        final_output = retry_output

                correct = (
                    abs(
                        final_output["value"] -
                        ground_truth["value"]
                    ) < 0.0001
                )

                records.append({
                    "task_id": task_id,
                    "fault_rate": fault_rate,
                    "policy": policy,
                    "ground_truth": ground_truth,
                    "initial_output": observed,
                    "initial_fault": first_fault,
                    "verification_triggered": checked,
                    "verifier_flag": verifier_flag,
                    "retry_used": retry_used,
                    "retry_fault": retry_fault,
                    "final_output": final_output,
                    "final_correct": correct
                })

                print(
                    f"Task {task_id}: "
                    f"initial_fault={first_fault}, "
                    f"checked={checked}, "
                    f"retry={retry_used}, "
                    f"correct={correct}"
                )

    output_path = (
        Path(__file__).resolve().parent.parent
        / "results"
        / "verification_results.json"
    )

    output_path.parent.mkdir(exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=4)

    print("\nExperiment finished.")
    print("Total records:", len(records))
    print("Saved to:", output_path)


if __name__ == "__main__":
    run_experiment()
