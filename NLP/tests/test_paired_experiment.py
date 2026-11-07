import unittest
from experiments.paired_experiment import (
    build_manifest, policy_decision, structural_gate, is_correct
)


class PairedExperimentTests(unittest.TestCase):
    def test_manifest_is_reproducible(self):
        self.assertEqual(build_manifest(2, 123), build_manifest(2, 123))

    def test_all_policies_share_same_initial_and_retry_scenarios(self):
        rows = build_manifest(2, 123)
        by_id = {row["case_id"]: row for row in rows}
        self.assertEqual(len(by_id), len(rows))
        for row in rows:
            self.assertIn("initial_fault", row)
            self.assertIn("retry_fault", row)
            self.assertEqual(
                row["initial_output"]["from_unit"],
                row["task"]["from_unit"]
            )

    def test_structural_gate_does_not_flag_valid_schema(self):
        task = {"value": 10, "from_unit": "kg", "to_unit": "lb"}
        observed = {"value": 22.0462, "from_unit": "kg", "to_unit": "lb"}
        self.assertFalse(structural_gate(task, observed))

    def test_structural_gate_flags_invalid_unit_or_schema(self):
        task = {"value": 10, "from_unit": "kg", "to_unit": "lb"}
        self.assertTrue(structural_gate(task, {"value": 2.0, "from_unit": "kg", "to_unit": "kg"}))
        self.assertTrue(structural_gate(task, {"value": float("nan"), "from_unit": "kg", "to_unit": "lb"}))
        self.assertTrue(structural_gate(task, {"value": 2.0}))

    def test_policy_decision_signature_has_no_ground_truth_argument(self):
        import inspect
        self.assertEqual(
            list(inspect.signature(policy_decision).parameters),
            ["task", "observed", "policy"]
        )

    def test_correctness_scorer_checks_value_and_units(self):
        truth = {"value": 22.0462, "from_unit": "kg", "to_unit": "lb"}
        self.assertTrue(is_correct(truth.copy(), truth))
        wrong_units = {"value": 22.0462, "from_unit": "kg", "to_unit": "kg"}
        self.assertFalse(is_correct(wrong_units, truth))


if __name__ == "__main__":
    unittest.main()
