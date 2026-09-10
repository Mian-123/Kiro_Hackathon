"""
Operation 3: calculate_priority
Scores incident urgency 0-100 using a 5-factor weighted formula.
Factors: severity 30%, citizen_support 20%, population 20%, location 15%, duration 15%.
Bands: 0-25 LOW, 26-50 MEDIUM, 51-75 HIGH, 76-100 CRITICAL.
"""
from __future__ import annotations

PRIORITY_SYSTEM_PROMPT = """You are a civic operations analyst for Lahore, Pakistan.
Given an incident summary, return ONLY valid JSON - no markdown, no extra text.

{
  "priority_score": <integer 0-100>,
  "priority_band": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "reasoning": "<2 sentences explaining this priority level>"
}

Scoring guide: >=76 CRITICAL, 51-75 HIGH, 26-50 MEDIUM, 0-25 LOW"""
