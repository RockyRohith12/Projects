MODEL = "qwen2.5:1.5b"

FAULT_RATES = [0.00, 0.05, 0.10, 0.20, 0.40]

POLICIES = [
    "never_verify",
    "always_verify",
    "selective_verify"
]

MAX_RETRIES = 1

RANDOM_SEED = 42

UNIT_CONVERSION_TASKS = [
    {
        "value": 10,
        "from_unit": "kg",
        "to_unit": "lb"
    },
    {
        "value": 5,
        "from_unit": "km",
        "to_unit": "miles"
    },
    {
        "value": 20,
        "from_unit": "lb",
        "to_unit": "kg"
    }
]