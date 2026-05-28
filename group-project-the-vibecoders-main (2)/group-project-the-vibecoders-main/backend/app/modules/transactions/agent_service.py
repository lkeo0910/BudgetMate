"""
Agent Service — AI-powered receipt parsing.

Responsibilities:
- Build a LangChain tool-calling agent backed by Google Gemini (gemini-1.5-flash).
- Expose a `get_categories` tool so the agent can look up the user's category
  list and select the correct category_id for the receipt.
- Parse the receipt image directly into a structured ReceiptOCRResponse using 
  Gemini's vision capabilities.
"""

import base64
from uuid import UUID
from typing import Any

from langchain.agents import create_agent
from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig
from sqlmodel import Session

from app.core.config import settings
from app.core.ai import llm
from app.modules.transactions.schemas import ReceiptOCRResponse
from app.modules.users.category_service import get_user_categories
from app.shared.exception.transaction_exception import (
    ReceiptOCRNotConfiguredException,
    ReceiptOCRProcessingException,
)

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are a receipt parsing assistant for a personal finance app.

You will be provided with an image of a receipt.
Your task is to analyze the image and return a structured JSON object.

## Step 1 — Get categories
Call the `get_categories` tool FIRST to retrieve the user's list of spending/income \
categories. Each item has an `id` (UUID string) and a `category_name` (string).

## Step 2 — Parse the receipt
Analyze the receipt image and the categories list to fill in the following fields:

| Field | Description |
|---|---|
| vendor | Business or store name (usually near the top of the receipt) |
| category_id | UUID of the most appropriate category from the list |
| amount | Grand total / amount due as a float (VND: whole number; keep null if not found) |
| date | Transaction date in YYYY-MM-DD format, or null if not determinable |
| type | "EXPENSE" for purchases; "INCOME" only for salary/refund/payment received |
| notes | A detailed, human-readable details of the receipt contents |

## Notes field — IMPORTANT
The `notes` field must contain a concise but thorough details of the receipt, \
including:
- Individual line items with quantities and unit prices (if visible)
- Subtotals, taxes, discounts, or service charges
- Payment method (cash, card, etc.) if shown
- Any other relevant details visible on the receipt
This gives the user a quick overview without having to look at the original image.

## Output format
Return ONLY valid JSON:
{
  "vendor": "<store name>",
  "category_id": "<UUID string from categories list>",
  "amount": <float or null>,
  "date": "<YYYY-MM-DD or null>",
  "type": "EXPENSE",
  "notes": "<detailed receipt summary>"
}

## Rules
- vendor: always provide a best-guess, never leave blank
- category_id: must exactly match one of the UUIDs returned by get_categories
- amount: final total only; ignore partial amounts; null if truly absent
- date: null if ambiguous or not present
- type: default "EXPENSE"; use "INCOME" for salary, refund, or received-payment receipts
- notes: always populate with the details you can extract (For example: if you see "2x Sprite @ 5,000", put "2x Sprite @ 5,000" in the notes field)
"""

# ---------------------------------------------------------------------------
# Tools (Optimized for Global Access)
# ---------------------------------------------------------------------------

@tool
def get_categories(config: RunnableConfig) -> list[dict]:
    """
    Return all spending/income categories available for the current user.
    Each item has 'id' (UUID string) and 'category_name' (string).
    Call this tool to choose the correct category_id for a receipt.
    """
    session = config["configurable"]["db_session"]
    user_id = config["configurable"]["user_id"]
    categories = get_user_categories(session, user_id)
    return [{"id": str(c.id), "category_name": c.category_name} for c in categories]

# ---------------------------------------------------------------------------
# Global Agent Initialization
# ---------------------------------------------------------------------------

# Create the agent once with structured output using shared LLM
receipt_agent = create_agent(
    model=llm,
    tools=[get_categories],
    system_prompt=SYSTEM_PROMPT,
    response_format=ReceiptOCRResponse,
)

# ---------------------------------------------------------------------------
# Agent runner
# ---------------------------------------------------------------------------

async def run_receipt_agent(
    *,
    image_bytes: bytes,
    content_type: str,
    user_id: UUID,
    session: Session,
) -> ReceiptOCRResponse:
    """
    Run the LangChain Gemini agent to parse a receipt image into a ReceiptOCRResponse.
    Optimized: Uses a pre-compiled global agent and centralized LLM.
    """
    if not settings.GOOGLE_API_KEY:
        raise ReceiptOCRNotConfiguredException(
            "Google API key is not configured. Set GOOGLE_API_KEY in .env."
        )

    # Encode image to base64 for vision input
    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    try:
        # Multimodal input for Gemini
        result = await receipt_agent.ainvoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Parse this receipt:"},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{content_type};base64,{base64_image}"},
                            },
                        ],
                    }
                ]
            },
            config={
                "configurable": {
                    "user_id": user_id,
                    "db_session": session
                }
            }
        )
    except Exception as exc:
        raise ReceiptOCRProcessingException(
            f"AI agent failed to process the receipt: {exc}"
        ) from exc

    structured_response = result.get("structured_response")
    if not structured_response:
        # Fallback for dict response
        if isinstance(result, dict) and "output" in result:
             return ReceiptOCRResponse.model_validate(result["output"])
        raise ReceiptOCRProcessingException("AI agent failed to return a structured response.")

    return structured_response
