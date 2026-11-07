# Reproducible experiment run guide

Run from the `NLP/` directory.

## 1. Environment
```bash
pip install -r requirements.txt
ollama pull qwen2.5:1.5b
```

Make sure the Ollama service is running and reachable at `http://localhost:11434`.

## 2. Validate the experiment code
```bash
python -m unittest discover -s tests -v
```

All tests should pass before running any model calls.

## 3. Run the verifier diagnostic
```bash
python verifier_diagnostic.py
```

This makes 32 LLM calls (8 tasks x 4 corruption levels) and writes `results/verifier_diagnostic_v2.json`. Review false positives on clean cases and detection by corruption level.

## 4. Run the paired policy experiment
Start with a small smoke run:
```bash
python experiments/paired_experiment.py --repeats 1 --seed 42
```

If the smoke run completes and outputs look valid, run the larger same-day run:
```bash
python experiments/paired_experiment.py --repeats 5 --seed 42
```

This creates 200 shared scenarios (8 tasks x 5 rates x 5 repeats) and evaluates all three policies on the exact same initial fault and retry manifest. The always-verify arm makes up to 200 verifier calls; the schema-selective baseline may make none for numerical-only corruptions because its observable schema is valid.

Results are saved separately as:
- `results/paired_manifest_v1.json`
- `results/paired_policy_results_v1.json`

## Interpretation cautions
- The current injected fault is a 10% numerical under-reporting. This tests one corruption family, not all tool errors.
- `selective_verify` is currently a schema/unit sanity baseline, not a trained risk predictor. It cannot identify a numerically wrong but schema-valid value.
- The diagnostic is exploratory and small. Do not present it as a broad benchmark or claim general verifier capability from it.
- The simulation estimates policy behavior under the specified synthetic fault/retry process; it is not evidence about real-world tool failure rates.
- Keep the original pilot JSON files unchanged. These new outputs use distinct filenames.