# When Should Small Tool-Calling Agents Verify?

**Research Project | Natural Language Processing**

## Overview

This project investigates when tool-calling language agents should verify their tool outputs before accepting them.

While self-verification can help agents detect and recover from faulty tool outputs, unnecessary verification can also damage answers that were initially correct.

The project studies both benefits and risks of verification, with particular attention to:

- Recovery from faulty tool outputs.
- Overcorrection of initially correct outputs.
- Verification policies under different tool fault rates.
- Selective verification strategies.

## Research Objective

To investigate when self-verification improves task success and identify the conditions under which verification becomes counterproductive.

## Project Structure

- `main.py` — Main experiment entry point.
- `verifier_diagnostic.py` — Verifier diagnostic experiments.
- `experiments/` — Experiment configuration, execution engine and verification logic.
- `results/` — Experimental result files.
- `requirements.txt` — Python dependencies.

## Experimental Results

The `results/` directory contains JSON outputs from fault-injection, verification and verifier-diagnostic experiments.

## Setup

Clone the repository and navigate to this project folder:

```bash
cd NLP
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the experiment using the appropriate entry point and configuration.

## Research Status

This is an ongoing research project. Experimental findings are preliminary and will be updated as the methodology and evaluation are refined.
