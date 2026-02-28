"""
DataDungeon — AI Agent Service

Calls Claude to suggest water-use interventions for a failed project.

Flow:
  1. Build a plain-English prompt describing the failure (p_failure, first failure year, etc.)
  2. Define a tool called `suggest_interventions` — Claude must call this tool,
     which forces its response into a structured JSON shape we control.
  3. For each lever combination Claude suggests, run the REAL simulation so the
     projected outcomes are honest numbers, not Claude's estimates.
  4. Sort by projected failure probability and return ranked recommendations.

Claude's job: decide WHICH levers to pull.
Simulation engine's job: compute WHAT ACTUALLY HAPPENS if you pull them.
"""

import os
import anthropic
from services.simulation_engine import run_simulation


# ---------------------------------------------------------------------------
# Anthropic client — reads ANTHROPIC_API_KEY from environment automatically
# ---------------------------------------------------------------------------

_client = anthropic.Anthropic()


# ---------------------------------------------------------------------------
# Tool definition
#
# We give Claude exactly one tool and force it to call it (tool_choice below).
# The `input_schema` is a JSON Schema object — it defines the exact shape of
# the data Claude must return. This replaces "please respond with JSON only"
# prompting, which is fragile.
#
# Each item in `interventions` represents one lever combination to try.
# ---------------------------------------------------------------------------

_SUGGEST_TOOL = {
    "name": "suggest_interventions",
    "description": (
        "Suggest 2–3 ranked combinations of water-use interventions that could "
        "reduce the probability of water deficit below the 15% fail threshold. "
        "Each combination must be meaningfully distinct. Rank 1 is the most impactful."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "interventions": {
                "type": "array",
                "minItems": 2,
                "maxItems": 3,
                "items": {
                    "type": "object",
                    "properties": {
                        "unit_reduction_pct": {
                            "type": "number",
                            "description": (
                                "Fraction of units to cut (0.0–1.0). "
                                "0.2 = 20% fewer homes. 0.0 = no reduction."
                            ),
                        },
                        "greywater_recycling": {
                            "type": "boolean",
                            "description": (
                                "Install greywater recycling. "
                                "Reduces indoor municipal demand by 28%."
                            ),
                        },
                        "pipeline_added": {
                            "type": "boolean",
                            "description": (
                                "Add a supplemental pipeline or water-rights purchase. "
                                "Adds 500 acre-feet/year to the development's supply allocation."
                            ),
                        },
                        "build_delay_years": {
                            "type": "integer",
                            "description": (
                                "Years to delay construction start (0–10). "
                                "Buys time for supply infrastructure to catch up."
                            ),
                        },
                        "explanation": {
                            "type": "string",
                            "description": (
                                "Plain-English explanation of why this combination helps "
                                "and what trade-offs the developer should consider."
                            ),
                        },
                    },
                    "required": ["explanation"],
                },
            }
        },
        "required": ["interventions"],
    },
}


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def get_recommendations(
    unit_count: int,
    build_year: int,
    simulation_result: dict,
) -> dict:
    """
    Ask Claude for intervention suggestions, then verify each one with the
    real simulation engine before returning results.

    Args:
        unit_count:        number of homes in the development
        build_year:        year the development comes online
        simulation_result: the full result dict from run_simulation()

    Returns:
        dict matching the RecommendationResponse schema in schemas/agent.py
    """

    # --- Step 1: Build the prompt ---
    # We describe the failure in plain English so Claude understands the context.
    # Specific numbers (p_failure, deficit) help Claude calibrate how aggressive
    # its suggestions need to be.

    p_fail = simulation_result["p_failure_by_2074"]
    first_year = simulation_result.get("first_failure_year") or "N/A"
    deficit = simulation_result.get("median_deficit_acre_feet") or "N/A"
    scenarios = simulation_result["scenario_results"]

    scenario_summary = ", ".join(
        f"{k.replace('_', ' ')}: {v}" for k, v in scenarios.items()
    )

    prompt = f"""
A proposed housing development in Cache County, Utah has FAILED its 50-year water viability check.

Project details:
- Homes proposed: {unit_count} units
- Planned build year: {build_year}
- Simulation horizon: 2025–2074

Failure summary:
- Probability of water deficit by 2074: {p_fail * 100:.1f}%
- Median first failure year: {first_year}
- Median deficit at failure: {deficit} acre-feet/year
- Fixed-scenario outcomes: {scenario_summary}

Available interventions:
- unit_reduction_pct (0.0–1.0): Reduce the number of homes. 0.2 = 20% fewer units, 20% less demand.
- greywater_recycling (true/false): Greywater recycling cuts indoor municipal demand by 28%.
- pipeline_added (true/false): A new pipeline or water rights purchase adds 500 acre-feet/year to supply.
- build_delay_years (0–10): Delaying construction shifts when demand starts, giving supply time to catch up.

The project passes if P(failure by 2074) drops to 15% or below.

Suggest 2–3 distinct intervention combinations that could fix this project.
Rank them from most to least impactful. Consider cost and practicality in your explanations.
    """.strip()

    # --- Step 2: Call Claude ---
    # tool_choice={"type": "tool", "name": "suggest_interventions"} forces Claude
    # to call our tool instead of writing a free-text reply. This guarantees the
    # response has the exact structure we need — no JSON parsing guesswork.

    response = _client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        tools=[_SUGGEST_TOOL],
        tool_choice={"type": "tool", "name": "suggest_interventions"},
        messages=[{"role": "user", "content": prompt}],
    )

    # --- Step 3: Extract Claude's suggestions ---
    # The response content is a list of blocks. Because we forced tool use,
    # there will be exactly one block of type "tool_use" containing the levers.

    interventions = []
    for block in response.content:
        if block.type == "tool_use":
            interventions = block.input.get("interventions", [])
            break

    # --- Step 4: Run the real simulation for each suggestion ---
    # Claude picks levers. The simulation engine computes the real outcome.
    # This means the projected_p_failure numbers are honest — not Claude's guess.

    recommendations = []
    for suggestion in interventions:
        levers = {
            "unit_reduction_pct": float(suggestion.get("unit_reduction_pct") or 0.0),
            "greywater_recycling": bool(suggestion.get("greywater_recycling") or False),
            "pipeline_added": bool(suggestion.get("pipeline_added") or False),
            "build_delay_years": int(suggestion.get("build_delay_years") or 0),
        }

        result = run_simulation(
            unit_count=unit_count,
            build_year=build_year,
            **levers,
        )

        recommendations.append({
            "rank": 0,  # set after sorting below
            "levers": levers,
            "projected_verdict": result["verdict"],
            "projected_p_failure": result["p_failure_by_2074"],
            "explanation": suggestion.get("explanation", ""),
        })

    # --- Step 5: Sort and assign final ranks ---
    # Sort by projected failure probability ascending — best outcome = rank 1.
    # Claude's initial ordering was its opinion; this makes ranking objective.

    recommendations.sort(key=lambda r: r["projected_p_failure"])
    for i, rec in enumerate(recommendations):
        rec["rank"] = i + 1

    # --- Step 6: Check if the problem is unfixable ---
    # If every suggestion Claude gave still results in a FAIL after the real sim,
    # the project is likely too large for the available water supply.

    all_fail = all(r["projected_verdict"] == "FAIL" for r in recommendations)

    return {
        "recommendations": recommendations,
        "unfixable": all_fail,
        "unfixable_reason": (
            "No combination of the available interventions reduces the failure "
            "probability below 15%. The development may need to be significantly "
            "reduced in scale or relocated to a different water service area."
        ) if all_fail else None,
    }
