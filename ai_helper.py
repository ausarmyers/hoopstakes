import os, requests

QWEN_BASE_URL = os.getenv("QWEN_BASE_URL", "http://127.0.0.1:8000")


def ask_qwen(prompt: str, max_tokens: int = 256) -> str:
    """Call your local Qwen-Coder service."""
    try:
        res = requests.post(f"{QWEN_BASE_URL}/generate", json={"prompt": prompt, "max_tokens": max_tokens}, timeout=120)
        res.raise_for_status()
        return res.json()["response"]
    except requests.exceptions.ConnectionError:
        return "❌ AI service not running. Start with: nssm start qwen-ai"
    except Exception as e:
        return f"⚠️ {e}"