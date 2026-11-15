import json
import logging
import time
import urllib.error
import urllib.request

from app.config import settings

logger = logging.getLogger(__name__)

MAX_RETRIES = 3

EXTRACTION_PROMPT = """You are a contract analysis assistant. Read the following contract text and extract structured information.

Return a JSON object with these sections:

{
  "metadata": {
    "title": "contract title",
    "contract_number": "contract number if found, or null",
    "contract_type": "SERVICE, LEASE, EMPLOYMENT, SALE, NDA, PARTNERSHIP, or OTHER",
    "description": "brief description of what this contract is about",
    "signature_date": "YYYY-MM-DD or null",
    "effective_date": "YYYY-MM-DD or null",
    "start_date": "YYYY-MM-DD or null",
    "end_date": "YYYY-MM-DD or null",
    "value": 0,
    "currency": "TND, USD, EUR, etc.",
    "language": "en, fr, ar, etc."
  },

  "parties": [
    {
      "name": "company or person name",
      "type": "COMPANY, INDIVIDUAL, GOVERNMENT, or OTHER",
      "role": "CLIENT, SERVICE_PROVIDER, SUPPLIER, CUSTOMER, PARTNER, EMPLOYER, EMPLOYEE, LANDLORD, TENANT, or OTHER",
      "registration_number": "if found, or null",
      "address": "if found, or null",
      "contact_email": "if found, or null",
      "contact_phone": "if found, or null"
    }
  ],

  "clauses": [
    {
      "clause_number": "e.g. 7.2",
      "title": "clause title",
      "type": "GENERAL, SCOPE, PAYMENT, PRICE, DELIVERY, CONFIDENTIALITY, DATA_PROTECTION, INTELLECTUAL_PROPERTY, LIABILITY, WARRANTY, PENALTY, TERMINATION, RENEWAL, NOTICE, GOVERNING_LAW, DISPUTE_RESOLUTION, FORCE_MAJEURE, INSURANCE, AUDIT, NON_COMPETE, NON_SOLICITATION, or OTHER",
      "text": "the full clause text",
      "summary": "a short summary of what this clause says",
      "is_important": true,
      "confidence": 0.95
    }
  ],

  "events": [
    {
      "type": "START, EXPIRATION, RENEWAL, RENEWAL_NOTICE_DEADLINE, PAYMENT, TERMINATION_NOTICE, DELIVERY, MILESTONE, or OTHER",
      "date": "YYYY-MM-DD or null",
      "description": "what happens on this date",
      "source_text": "the sentence in the contract that sets this date"
    }
  ],

  "obligations": [
    {
      "title": "short title",
      "description": "what must be done",
      "obligation_type": "REPORTING, DELIVERY, PAYMENT, COMPLIANCE, NOTIFICATION, or OTHER",
      "frequency": "ONE_TIME, DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY, or null",
      "source_text": "the original text from the contract"
    }
  ],

  "payment_terms": [
    {
      "amount": 0,
      "currency": "TND",
      "payment_type": "FIXED, INSTALLMENT, MONTHLY, QUARTERLY, MILESTONE, ADVANCE, or OTHER",
      "due_days": 30,
      "frequency": "MONTHLY, QUARTERLY, YEARLY, ONE_TIME, or null",
      "description": "payment description",
      "source_text": "original text"
    }
  ],

  "penalties": [
    {
      "type": "LATE_DELIVERY, LATE_PAYMENT, BREACH, or OTHER",
      "amount": null,
      "percentage": null,
      "currency": "TND",
      "trigger": "what triggers this penalty",
      "description": "penalty description",
      "source_text": "original text"
    }
  ]
}

IMPORTANT RULES:
- Return ONLY valid JSON, no markdown, no explanation, no extra text.
- If you cannot find information for a field, use null.
- If a section has no items, return an empty array [].
- Extract as many clauses as you can find in the contract.
- Dates must be in YYYY-MM-DD format.
- confidence should be between 0.0 and 1.0.

CONTRACT TEXT:
"""


def _call_gemini(prompt: str) -> str:
    """Send the prompt to Google Gemini and return the raw JSON text."""
    import google.generativeai as genai

    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not set. "
            "Add it to .env: GEMINI_API_KEY=your-key-here (or set AI_PROVIDER=ollama)"
        )

    genai.configure(api_key=api_key)

    model_name = settings.GEMINI_MODEL
    logger.info("Using Gemini model: %s", model_name)
    model = genai.GenerativeModel(model_name)

    response = None
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )
            break
        except Exception as e:
            last_error = e
            error_msg = str(e)
            logger.error("Gemini error (attempt %d/%d): %s", attempt, MAX_RETRIES, error_msg)

            if "429" in error_msg or "quota" in error_msg.lower():
                wait_time = 30 * attempt
                logger.warning("Rate limited. Waiting %ds before retry...", wait_time)
                time.sleep(wait_time)
            else:
                raise

    if response is None:
        raise RuntimeError(f"Gemini API failed after {MAX_RETRIES} retries. Last error: {last_error}")

    return response.text


def _call_ollama(prompt: str) -> str:
    """Send the prompt to a local Ollama server and return the raw JSON text."""
    base_url = settings.OLLAMA_BASE_URL.rstrip("/")
    model_name = settings.OLLAMA_MODEL
    num_ctx = settings.OLLAMA_NUM_CTX
    logger.info("Using Ollama model: %s at %s (num_ctx=%d)", model_name, base_url, num_ctx)

    # Rough estimate (~4 chars per token). Ollama silently drops the start of prompts
    # that don't fit, which would cut off the instructions.
    estimated_tokens = len(prompt) // 4
    if estimated_tokens > num_ctx:
        logger.warning(
            "Prompt is ~%d tokens but OLLAMA_NUM_CTX is %d; the contract may be truncated. "
            "Increase OLLAMA_NUM_CTX if your model and memory allow it.",
            estimated_tokens, num_ctx,
        )

    payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": prompt}],
        "format": "json",
        "stream": False,
        "options": {"temperature": 0.1, "num_ctx": num_ctx},
    }
    request = urllib.request.Request(
        f"{base_url}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=settings.OLLAMA_TIMEOUT_SECONDS) as response:
            body = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        if e.code == 404:
            raise RuntimeError(
                f"Ollama model '{model_name}' not found. Pull it first: ollama pull {model_name}"
            ) from e
        raise RuntimeError(f"Ollama returned HTTP {e.code}: {detail}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(
            f"Could not reach Ollama at {base_url} ({e.reason}). "
            "Make sure Ollama is running and OLLAMA_BASE_URL is correct."
        ) from e

    return body["message"]["content"]


PROVIDERS = {
    "gemini": _call_gemini,
    "ollama": _call_ollama,
}


def extract_contract_data(contract_text: str) -> dict:
    """Send the contract text to the configured provider and return the parsed JSON."""
    provider = settings.AI_PROVIDER.lower()
    call_provider = PROVIDERS.get(provider)
    if call_provider is None:
        raise ValueError(f"Unknown AI_PROVIDER '{settings.AI_PROVIDER}'. Use one of: {', '.join(PROVIDERS)}")

    # Contract text is confidential: log sizes and counts only, never content
    prompt = EXTRACTION_PROMPT + contract_text
    logger.info("Sending %d characters to %s", len(prompt), provider)
    raw = call_provider(prompt)

    result = json.loads(raw)
    if not isinstance(result, dict):
        raise ValueError(f"{provider} returned {type(result).__name__} instead of a JSON object")

    logger.info(
        "%s found %s",
        provider,
        ", ".join(f"{len(result.get(key) or [])} {key}" for key in
                  ("parties", "clauses", "events", "obligations", "payment_terms", "penalties")),
    )
    return result
