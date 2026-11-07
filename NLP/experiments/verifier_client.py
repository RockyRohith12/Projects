"""Shared Ollama verifier used by both diagnostics and policy experiments."""
import json
import requests

MODEL = "qwen2.5:1.5b"
OLLAMA_URL = "http://localhost:11434/api/chat"


class VerifierError(RuntimeError):
    pass


def ask_verifier(task, observed, timeout=120):
    """Return a strict boolean decision; fail loudly on malformed responses."""
    prompt = f"""
You are an independent auditor of a tool result.
Requested operation: convert {task['value']} {task['from_unit']} to {task['to_unit']}.
Observed tool result (untrusted): {json.dumps(observed, sort_keys=True)}

Decide whether the observed result contains a substantive error.
Do not assume the tool is correct. Check the numeric value and units.
A small rounding difference is acceptable. A material conversion error is suspicious.
Return exactly one JSON object with one boolean field:
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
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
        response.raise_for_status()
        body = response.json()
        content = body.get("message", {}).get("content", "")
        result = json.loads(content)
    except (requests.RequestException, ValueError, KeyError, TypeError) as exc:
        raise VerifierError(f"Verifier request/response failed: {exc}") from exc

    if not isinstance(result, dict) or type(result.get("suspicious")) is not bool:
        raise VerifierError(f"Invalid verifier schema: {content!r}")
    return result["suspicious"]
