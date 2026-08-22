from __future__ import annotations

import json
import re
from typing import Any

import requests

from app.config import OPENROUTER_SITE_NAME, OPENROUTER_SITE_URL
from app.services.website_reader import (
    fetch_website_text,
)


OPENROUTER_URL = (
    "https://openrouter.ai/api/v1/chat/completions"
)


# =========================================================
# BASIC HELPERS
# =========================================================

def clean_text(
    value: Any,
) -> str:

    if value is None:
        return ""

    return str(value).strip()


def clean_model_output(
    text: str,
) -> str:

    text = str(
        text or ""
    ).strip()

    # Remove Gemma/provider padding tokens.
    text = re.sub(
        r"<pad>",
        "",
        text,
        flags=re.IGNORECASE,
    ).strip()

    # Remove markdown JSON fences.
    if text.startswith(
        "```"
    ):

        text = re.sub(
            r"^```(?:json)?\s*",
            "",
            text,
            flags=re.IGNORECASE,
        )

        text = re.sub(
            r"\s*```$",
            "",
            text,
        )

    return text.strip()


# =========================================================
# OPENROUTER REQUEST
# =========================================================

def _ai_request(
    messages: list[dict[str, str]],
    *,
    ai_config: dict,
    structured: bool,
    max_tokens: int,
) -> str:
    provider = str(ai_config.get("provider") or "").strip().lower()
    model = str(ai_config.get("model") or "").strip()
    api_key = str((ai_config.get("credentials") or {}).get("api_key") or "").strip()
    base_url = str(ai_config.get("base_url") or "").strip()

    if not provider or not model or not api_key:
        raise RuntimeError("AI provider, model, and API key must be configured before using AI generation.")

    if provider == "openrouter":
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": OPENROUTER_SITE_URL,
            "X-Title": OPENROUTER_SITE_NAME,
        }
    elif provider == "openai_compatible":
        url = base_url.rstrip("/") + "/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    else:
        raise RuntimeError(f"Unsupported AI provider: {provider}")

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.45,
        "top_p": 0.90,
        "max_tokens": max_tokens,
    }
    if structured:
        payload["response_format"] = {"type": "json_object"}

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=120)
    except requests.RequestException as exc:
        raise RuntimeError(f"AI provider connection failed: {exc}") from exc

    if not response.ok:
        retry_after = (response.headers.get("Retry-After") or "").strip()
        try:
            data = response.json()
        except Exception:
            data = None

        error_obj = data.get("error") if isinstance(data, dict) else None
        if isinstance(error_obj, dict):
            message = str(error_obj.get("message") or "").strip()
            code = str(error_obj.get("code") or "").strip()
            metadata = error_obj.get("metadata") if isinstance(error_obj.get("metadata"), dict) else {}
            provider_name = str(metadata.get("provider_name") or "").strip()
            parts = [message]
            if code:
                parts.append(f"code={code}")
            if provider_name:
                parts.append(f"provider={provider_name}")
            detail = " | ".join(part for part in parts if part) or response.text[:1000]
        else:
            detail = response.text[:1000]

        if response.status_code == 429:
            suffix = f" Retry-After: {retry_after} seconds." if retry_after else ""
            raise RuntimeError(
                f"AI provider rate limit (429): {detail}.{suffix}"
            )

        raise RuntimeError(f"AI provider error {response.status_code}: {detail}")

    try:
        data = response.json()
    except Exception as exc:
        raise RuntimeError("AI provider returned invalid JSON.") from exc

    choices = data.get("choices") or []
    if not choices:
        raise RuntimeError("AI provider returned no choices.")
    choice = choices[0]
    content = (choice.get("message") or {}).get("content")
    if isinstance(content, list):
        content = "".join(str(part.get("text", "")) for part in content if isinstance(part, dict))
    content = clean_model_output(content or "")
    if not content:
        raise RuntimeError("MODEL_EMPTY_OUTPUT")
    if choice.get("finish_reason") in {"length", "error"}:
        raise RuntimeError("MODEL_INCOMPLETE_OUTPUT")
    return content


def call_openrouter(
    messages: list[dict[str, str]],
    *,
    ai_config: dict,
    max_tokens: int = 3500,
) -> str:
    try:
        return _ai_request(messages, ai_config=ai_config, structured=False, max_tokens=max_tokens)
    except RuntimeError as first_error:
        # Never repeat a request that the provider rejected with 429.
        # A blind retry can consume the user's rate-limit budget again.
        if "rate limit (429)" in str(first_error).lower():
            raise

        fallback_messages = [
            *messages,
            {
                "role": "user",
                "content": "IMPORTANT: Return ONLY valid JSON. Do not return markdown. Do not return explanations. Return the exact JSON structure requested.",
            },
        ]
        try:
            return _ai_request(fallback_messages, ai_config=ai_config, structured=True, max_tokens=max_tokens)
        except Exception as second_error:
            raise RuntimeError(
                f"AI generation failed. First attempt: {first_error}. Second attempt: {second_error}"
            ) from second_error


# =========================================================
# WEBSITE + LEAD CONTEXT
# =========================================================

def build_lead_context(
    lead: dict[str, Any],
) -> dict[str, Any]:

    website = clean_text(
        lead.get(
            "website"
        )
    )

    website_text = ""

    if website:

        website_text = (
            fetch_website_text(
                website,
                max_chars=3500,
            )
        )

    # This is THE important part:
    # preserve every non-sensitive source field.
    raw_data = (
        lead.get(
            "source_data"
        )
        or {}
    )

    return {
        "provided_name":
            clean_text(
                lead.get(
                    "name"
                )
            ),

        "provided_business_name":
            clean_text(
                lead.get(
                    "business_name"
                )
                or lead.get(
                    "company"
                )
            ),

        "email":
            clean_text(
                lead.get(
                    "email"
                )
            ),

        "phone":
            clean_text(
                lead.get(
                    "phone"
                )
            ),

        "website":
            website,

        "category":
            clean_text(
                lead.get(
                    "category"
                )
            ),

        "address":
            clean_text(
                lead.get(
                    "address"
                )
            ),

        "description":
            clean_text(
                lead.get(
                    "description"
                )
            ),

        "website_text":
            website_text,

        # ORIGINAL ROW
        "raw_spreadsheet_fields":
            raw_data,
    }


# =========================================================
# ANALYZE + GENERATE
# =========================================================

def analyze_and_generate_batch(
    leads: list[dict[str, Any]],
    ai_config: dict,
    campaign_goal: str,
    base_subject: str,
    base_message: str,
    tone: str,
) -> list[dict[str, Any]]:

    contexts = []

    for index, lead in enumerate(
        leads
    ):

        context = build_lead_context(
            lead
        )

        contexts.append(
            {
                "index":
                    index,
                **context,
            }
        )


    lead_data = json.dumps(
        contexts,
        ensure_ascii=False,
        indent=2,
    )


    # =====================================================
    # PROMPT
    # =====================================================

    prompt = f"""
You are the lead intelligence and personalized outreach
engine for Ritnav Mailer.

Your job has TWO stages:

STAGE 1:
Understand the lead.

STAGE 2:
Write a personalized email based on the understanding.


=========================================================
MOST IMPORTANT RULE: INSPECT RAW SPREADSHEET FIELDS
=========================================================

The object called "raw_spreadsheet_fields" contains the
ORIGINAL spreadsheet row.

These fields are extremely important.

Do NOT ignore a field because:
- its header is misspelled
- its header is abbreviated
- its header is unusual
- it is not in your predefined vocabulary

Example:

"bussiness": "clinic"

must be treated as strong evidence that the lead is
associated with a clinic.

Example:

"ph. no": "9538923304"

is phone information.

Example:

"mail": "person@example.com"

is email information.

The Python detector is only a helper.

The RAW SPREADSHEET DATA is authoritative when it contains
clear semantic evidence.


=========================================================
PERSON VS BUSINESS
=========================================================

You MUST distinguish:

- person's name
- business name
- shop name
- clinic name
- hotel name
- restaurant name
- brand name
- ambiguous name

Examples:

Input:
Name = Rahul
Business = Rahul's Clinic

Output:
person_name = Rahul
business_name = Rahul's Clinic
business_type = medical clinic
industry = healthcare
greeting = Rahul


Input:
Name = Radhe Groceries
Business = empty

Output:
person_name = null
business_name = Radhe Groceries
business_type = grocery store
industry = retail
greeting = Radhe Groceries team


Input:
Name = Amit
Business = XYZ Mart

Output:
person_name = Amit
business_name = XYZ Mart
business_type = grocery/retail store
industry = retail
greeting = Amit


Input:
Name = Rohit
bussiness = clinic

Output:
person_name = Rohit
business_name = null
business_type = medical clinic
industry = healthcare
greeting = Rohit


=========================================================
IDENTITY RULES
=========================================================

1. Never assume every "name" value is a person's name.

2. Never assume every business-looking value is a person's name.

3. Never convert the email username into a person's name.

4. Never invent a person's name.

5. Never invent a business name.

6. If a person cannot be identified confidently,
   person_name must be null.

7. If a business name cannot be identified,
   business_name may be null.

8. If business type is explicitly supplied in any raw field,
   use it.

9. If business type is not explicitly supplied, infer it only
   when the available evidence supports the inference.

10. If uncertain, use "unknown".


=========================================================
BUSINESS UNDERSTANDING
=========================================================

Use evidence in this order:

1. Explicit business/company fields
2. Raw spreadsheet fields
3. Explicit category/industry
4. Business description
5. Website content
6. Business name
7. Address

If a website is provided, use its text to understand what
the business actually does.

Do not invent business facts.


=========================================================
PERSONALIZED EMAIL RULES
=========================================================

The email must NOT merely change the recipient's name.

The business context must change the message.

For example:

A clinic should receive a clinic-relevant angle.

A grocery store should receive a grocery/retail-relevant angle.

A hotel should receive a hospitality-relevant angle.

An interior design business should receive an interior/
project-enquiry-relevant angle.

A manufacturer should receive a manufacturing-relevant angle.

A restaurant should receive a restaurant/customer/
ordering-relevant angle.


These are examples of possible directions.

Do NOT claim the business actually has a problem unless
there is evidence for that problem.

Use cautious language where necessary.

Bad:

"I noticed your clinic struggles with appointment management."

Good:

"Clinics often handle repetitive appointment enquiries
and follow-ups, which can create administrative work."


=========================================================
CAMPAIGN
=========================================================

Campaign goal:

{campaign_goal}


Base subject:

{base_subject}


Base message:

{base_message}


Tone:

{tone}


=========================================================
LEAD DATA
=========================================================

{lead_data}


=========================================================
EMAIL REQUIREMENTS
=========================================================

- 70-130 words approximately
- natural
- business-specific
- one clear CTA
- no fake urgency
- no fake scarcity
- no fake previous relationship
- no invented facts
- no deceptive subject
- no excessive hype
- no excessive emojis
- do not mention AI
- do not use a person's name unless reasonably supported
- if only the business is identified, address the business/team
- subject should preferably relate to the business context
- body must be substantially different when business context differs


=========================================================
OUTPUT
=========================================================

Return ONLY valid JSON.

No markdown.
No explanation.

Use exactly this structure:

{{
  "leads": [
    {{
      "index": 0,
      "analysis": {{
        "person_name": null,
        "business_name": null,
        "business_type": "unknown",
        "industry": "unknown",
        "contact_role": "unknown",
        "greeting": "there",
        "business_summary": "",
        "personalization_angle": "",
        "confidence": 0.0
      }},
      "email": {{
        "subject": "",
        "body": ""
      }}
    }}
  ]
}}

There must be one result for every supplied lead.
"""


    # =====================================================
    # CALL MODEL
    # =====================================================

    content = call_openrouter(
        [
            {
                "role":
                    "system",
                "content":
                    "Return valid JSON only.",
            },
            {
                "role":
                    "user",
                "content":
                    prompt,
            },
        ],
        ai_config=ai_config,
        max_tokens=5000,
    )


    # =====================================================
    # PARSE
    # =====================================================

    cleaned = clean_model_output(
        content
    )

    try:

        data = json.loads(
            cleaned
        )

    except json.JSONDecodeError as exc:

        preview = (
            cleaned[:1500]
            if cleaned
            else "<empty>"
        )

        raise RuntimeError(
            "AI returned invalid JSON.\n\n"
            f"Model response preview:\n"
            f"{preview}\n\n"
            f"Parser error:\n"
            f"{exc}"
        ) from exc


    raw_results = data.get(
        "leads"
    )

    if not isinstance(
        raw_results,
        list,
    ):

        raise RuntimeError(
            "AI did not return a valid leads array."
        )


    results = []


    for item in raw_results:

        if not isinstance(
            item,
            dict,
        ):
            continue

        try:

            index = int(
                item.get(
                    "index"
                )
            )

        except (
            TypeError,
            ValueError,
        ):

            continue

        if (
            index < 0
            or index >= len(leads)
        ):
            continue

        analysis = item.get(
            "analysis"
        )

        email = item.get(
            "email"
        )

        if not isinstance(
            analysis,
            dict,
        ):
            continue

        if not isinstance(
            email,
            dict,
        ):
            continue

        subject = clean_text(
            email.get(
                "subject"
            )
        )

        body = clean_text(
            email.get(
                "body"
            )
        )

        if not subject or not body:
            continue

        lead = leads[index]


        try:

            confidence = float(
                analysis.get(
                    "confidence",
                    0,
                )
            )

        except (
            TypeError,
            ValueError,
        ):

            confidence = 0.0


        confidence = max(
            0.0,
            min(
                1.0,
                confidence,
            ),
        )


        results.append(
            {
                "index":
                    index,

                "name":
                    clean_text(
                        lead.get(
                            "name"
                        )
                    ),

                "email":
                    clean_text(
                        lead.get(
                            "email"
                        )
                    ),

                "phone":
                    clean_text(
                        lead.get(
                            "phone"
                        )
                    ),

                "company":
                    clean_text(
                        lead.get(
                            "company"
                        )
                    ),

                "website":
                    clean_text(
                        lead.get(
                            "website"
                        )
                    ),

                "analysis":
                    {
                        "person_name":
                            clean_text(
                                analysis.get(
                                    "person_name"
                                )
                            )
                            or None,

                        "business_name":
                            clean_text(
                                analysis.get(
                                    "business_name"
                                )
                            )
                            or None,

                        "business_type":
                            clean_text(
                                analysis.get(
                                    "business_type"
                                )
                            )
                            or "unknown",

                        "industry":
                            clean_text(
                                analysis.get(
                                    "industry"
                                )
                            )
                            or "unknown",

                        "contact_role":
                            clean_text(
                                analysis.get(
                                    "contact_role"
                                )
                            )
                            or "unknown",

                        "greeting":
                            clean_text(
                                analysis.get(
                                    "greeting"
                                )
                            )
                            or "there",

                        "business_summary":
                            clean_text(
                                analysis.get(
                                    "business_summary"
                                )
                            ),

                        "personalization_angle":
                            clean_text(
                                analysis.get(
                                    "personalization_angle"
                                )
                            ),

                        "confidence":
                            confidence,
                    },

                "subject":
                    subject,

                "body":
                    body,

                "status":
                    "generated",
            }
        )


    results.sort(
        key=lambda item:
            item["index"]
    )


    return results