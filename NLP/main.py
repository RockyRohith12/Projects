
import requests
import json

# ==========================================
# CONFIGURATION
# ==========================================

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "qwen2.5:1.5b"


# ==========================================
# TOOL 1: UNIT CONVERSION
# ==========================================

def convert_units(value, from_unit, to_unit):

    conversions = {
        ("kg", "lb"): 2.20462,
        ("lb", "kg"): 1 / 2.20462,
        ("km", "miles"): 0.621371,
        ("miles", "km"): 1 / 0.621371,
    }

    key = (from_unit.lower(), to_unit.lower())

    if key not in conversions:
        return {"error": "Unsupported conversion"}

    result = float(value) * conversions[key]

    return {
        "value": round(result, 4),
        "from_unit": from_unit,
        "to_unit": to_unit
    }


# ==========================================
# TOOL DEFINITION FOR THE LLM
# ==========================================

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "convert_units",
            "description": "Convert a numerical value between supported units.",
            "parameters": {
                "type": "object",
                "properties": {
                    "value": {
                        "type": "number",
                        "description": "Value to convert"
                    },
                    "from_unit": {
                        "type": "string",
                        "description": "Original unit"
                    },
                    "to_unit": {
                        "type": "string",
                        "description": "Target unit"
                    }
                },
                "required": [
                    "value",
                    "from_unit",
                    "to_unit"
                ]
            }
        }
    }
]


# ==========================================
# OLLAMA API
# ==========================================

def chat(messages, tools=None):

    payload = {
        "model": MODEL,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": 0
        }
    }

    if tools:
        payload["tools"] = tools

    response = requests.post(
        OLLAMA_URL,
        json=payload,
        timeout=120
    )

    response.raise_for_status()

    return response.json()["message"]


# ==========================================
# AGENT EXECUTION
# ==========================================

def run_agent(user_task):

    print("\nUSER:", user_task)

    messages = [
        {
            "role": "system",
            "content": (
                "You are a tool-using assistant. "
                "Use the convert_units tool for unit conversions. "
                "Do not calculate conversions yourself. "
                "Use the tool when the user requests a supported conversion."
            )
        },
        {
            "role": "user",
            "content": user_task
        }
    ]

    print("\n[1] Asking model to select a tool...")

    try:
        message = chat(messages, TOOLS)

    except requests.RequestException as error:
        print("Ollama connection error:", error)
        return

    messages.append(message)

    tool_calls = message.get("tool_calls", [])

    if not tool_calls:
        print("\nMODEL DID NOT CALL A TOOL.")
        print("Model response:", message.get("content", ""))
        return

    # Execute requested tools
    for call in tool_calls:

        function = call["function"]

        name = function["name"]
        arguments = function["arguments"]

        print("\n[2] TOOL SELECTED:", name)
        print("[3] TOOL ARGUMENTS:", arguments)

        if name != "convert_units":
            print("Unknown tool:", name)
            return

        try:
            result = convert_units(**arguments)

        except (TypeError, ValueError) as error:
            print("Invalid tool arguments:", error)
            return

        print("[4] TOOL OUTPUT:", result)

        messages.append({
            "role": "tool",
            "content": json.dumps(result)
        })

    # Ask model to formulate final answer
    print("\n[5] Generating final answer...")

    try:
        final_message = chat(messages)

    except requests.RequestException as error:
        print("Final response error:", error)
        return

    print("\nFINAL ANSWER:")
    print(final_message.get("content", ""))


# ==========================================
# MAIN PROGRAM
# ==========================================

if __name__ == "__main__":

    print("=" * 50)
    print("WHEN SHOULD AGENTS VERIFY?")
    print("Initial Tool-Calling Agent")
    print("=" * 50)

    task = input("\nEnter your task: ")

    run_agent(task)
