"""
DataDungeon — Water Simulation Engine

Runs a 50-year water viability simulation for a development project in Cache County, Utah.
Supports two modes:
  - Mode 1: Four fixed climate scenarios (deterministic)
  - Mode 2: Monte Carlo — 1,000 runs with sampled supply and demand variability

All supply and demand figures are in acre-feet per year.

Supply model:
  Water authorities reserve a specific pool of water rights for new development —
  the "development allocation." This is what a new project actually competes against,
  not the county's total supply. Cache County's allocation for new growth is 1,500 AF/year.
  Climate scenarios and annual trend reduce this allocation over time.
"""

import json
import numpy as np
from pathlib import Path
from services.water_demand import get_demand_for_year

# ---------------------------------------------------------------------------
# County data — loaded once at module startup, not on every request
# ---------------------------------------------------------------------------

DATA_PATH = Path(__file__).parent.parent / "data" / "cache_county.json"

with open(DATA_PATH) as f:
    COUNTY_DATA = json.load(f)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SIMULATION_START = 2025
SIMULATION_END = 2074
SIMULATION_YEARS = list(range(SIMULATION_START, SIMULATION_END + 1))

N_SIMULATIONS = 1000

GREYWATER_DEMAND_REDUCTION = 0.28  # EPA WaterSense standard — removes 28% of municipal demand
PIPELINE_SUPPLY_ADDITION = 500     # acre-feet per year — supplemental well or water rights purchase

# If P(failure by 2074) exceeds this threshold the project verdict is FAIL
FAIL_THRESHOLD = 0.15


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def run_simulation(
    unit_count: int,
    build_year: int,
    greywater_recycling: bool = False,
    pipeline_added: bool = False,
    unit_reduction_pct: float = 0.0,
    build_delay_years: int = 0,
    n_simulations: int = N_SIMULATIONS,
) -> dict:
    """
    Run the full water viability simulation for a development project.

    Args:
        unit_count:          number of homes in the development
        build_year:          year the development comes online
        greywater_recycling: if True, reduces municipal demand by 28%
        pipeline_added:      if True, adds 500 acre-feet/year to the development allocation
        unit_reduction_pct:  fraction to reduce unit count (0.2 = 20% fewer homes)
        build_delay_years:   years to push back the build start date
        n_simulations:       number of Monte Carlo runs (default 1,000)

    Returns:
        dict matching the SimulationResult schema in schemas/simulation.py
    """

    # --- Step 1: Apply what-if levers to inputs ---
    effective_unit_count = int(unit_count * (1 - unit_reduction_pct))
    effective_build_year = build_year + build_delay_years
    demand_multiplier = (1.0 - GREYWATER_DEMAND_REDUCTION) if greywater_recycling else 1.0

    # Pull values from county data
    # development_allocation is the water reserved for new growth — not total county supply
    development_allocation = COUNTY_DATA["supply"]["development_allocation_acre_feet_per_year"]
    annual_trend = COUNTY_DATA["supply"]["annual_trend_rate"]
    mc_supply = COUNTY_DATA["supply"]["monte_carlo"]
    mc_demand = COUNTY_DATA["demand"]["demand_growth"]["monte_carlo"]
    scenarios = COUNTY_DATA["climate_scenarios"]

    # --- Step 2: Mode 1 — Four fixed scenarios ---
    # Each scenario applies a fixed modifier to the development allocation.
    # Drought reduces how much new development water is available.

    scenario_results = {}

    for key in ["baseline", "moderate_drought", "severe_drought", "reduced_snowpack"]:
        modifier = scenarios[key]["supply_modifier"]
        scenario_failed = False

        for i, year in enumerate(SIMULATION_YEARS):
            # Available allocation shrinks with drought modifier and long-term trend
            available = development_allocation * modifier * (1 + annual_trend) ** i
            if pipeline_added:
                available += PIPELINE_SUPPLY_ADDITION

            demand = get_demand_for_year(
                effective_unit_count, effective_build_year, year
            ) * demand_multiplier

            if demand > available:
                scenario_failed = True
                break

        scenario_results[key] = "FAIL" if scenario_failed else "PASS"

    # --- Step 3: Mode 2 — Monte Carlo ---
    # Run n_simulations independent simulations. Each samples slightly different
    # supply shocks and demand growth rates from probability distributions.
    #
    # failure_counts[i] = how many simulations failed BY year i.
    # When a simulation fails at year X, we increment every year from X onward.
    # Dividing by n_simulations gives P(failure by that year).

    failure_counts = [0] * len(SIMULATION_YEARS)
    simulation_outcomes = []

    for _ in range(n_simulations):
        # Sample a demand growth rate for this run
        growth_rate = float(np.clip(
            np.random.normal(loc=mc_demand["mean"], scale=mc_demand["std_dev"]),
            mc_demand["min_clamp"],
            mc_demand["max_clamp"],
        ))

        sim_failed = False
        first_failure_year = None
        deficit_at_failure = None

        for i, year in enumerate(SIMULATION_YEARS):
            # Sample a supply shock — lognormal centered at 1.0
            # sigma=0.11 reflects year-to-year variability in Bear River flows
            supply_shock = float(np.random.lognormal(mean=0, sigma=mc_supply["sigma"]))
            available = development_allocation * supply_shock * (1 + annual_trend) ** i

            if pipeline_added:
                available += PIPELINE_SUPPLY_ADDITION

            demand = get_demand_for_year(
                effective_unit_count, effective_build_year, year, growth_rate
            ) * demand_multiplier

            if demand > available:
                sim_failed = True
                first_failure_year = year
                deficit_at_failure = demand - available

                for j in range(i, len(SIMULATION_YEARS)):
                    failure_counts[j] += 1
                break

        simulation_outcomes.append({
            "failed": sim_failed,
            "first_failure_year": first_failure_year,
            "deficit": deficit_at_failure,
        })

    # --- Step 4: Build the output ---

    p_failure_by_2074 = failure_counts[-1] / n_simulations

    failure_curve = [
        {"year": year, "p_failure": round(failure_counts[i] / n_simulations, 4)}
        for i, year in enumerate(SIMULATION_YEARS)
    ]

    failed_sims = [s for s in simulation_outcomes if s["failed"]]
    first_failure_year = None
    median_deficit = None

    if failed_sims:
        failure_years = sorted(s["first_failure_year"] for s in failed_sims)
        first_failure_year = failure_years[len(failure_years) // 2]

        deficits = sorted(s["deficit"] for s in failed_sims)
        median_deficit = round(deficits[len(deficits) // 2], 1)

    verdict = "FAIL" if p_failure_by_2074 > FAIL_THRESHOLD else "PASS"

    return {
        "verdict": verdict,
        "p_failure_by_2074": round(p_failure_by_2074, 4),
        "first_failure_year": first_failure_year,
        "median_deficit_acre_feet": median_deficit,
        "failure_curve": failure_curve,
        "scenario_results": scenario_results,
    }
