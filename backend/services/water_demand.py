"""
Water demand calculations for DataDungeon.

All demand figures are in acre-feet per year.
One acre-foot = 325,851 gallons — the standard unit for water management in Utah.
"""

# --- Constants ---

GALLONS_PER_ACRE_FOOT = 325_851

# Cache County municipal water use standard (Utah Division of Water Resources)
GPD_PER_CAPITA = 185

# Average household size for Cache County, Utah (2020 Census)
PEOPLE_PER_UNIT = 2.9

# Baseline annual demand growth rate (Cache County General Plan 2023)
# This is the default — Monte Carlo mode will sample around this value per run
DEFAULT_GROWTH_RATE = 0.019

# Outdoor irrigation constants (Cache County, Utah)
# Source: USU Climate Center ETo data for Logan, UT — cool-season turf
IRRIGATION_NET_FEET_PER_YEAR = 2.5   # net applied water after ~70% sprinkler efficiency
IRRIGATED_LOT_FRACTION = 0.45         # fraction of lot assumed to be irrigated (lawn + garden)
MAX_IRRIGATED_ACRES_PER_UNIT = 0.25   # cap at ~10,890 sq ft per unit to avoid outliers on rural lots


# --- Functions ---

def calculate_base_demand(unit_count: int) -> float:
    """
    Calculate the annual water demand for a development at the moment it opens.
    No growth is applied — this is the day-one demand figure.

    Math:
        daily demand  = unit_count × people_per_unit × GPD_per_capita
        annual demand = daily_demand × 365 days
        acre-feet     = annual_gallons / 325,851

    Example:
        500 units → 536.5 GPD/unit → 268,250 GPD total
                  → 97,911,250 gallons/year
                  → 300.5 acre-feet/year

    Returns:
        float: acre-feet per year at build time
    """
    daily_gallons = unit_count * PEOPLE_PER_UNIT * GPD_PER_CAPITA
    annual_gallons = daily_gallons * 365
    return annual_gallons / GALLONS_PER_ACRE_FOOT


def calculate_irrigation_demand(unit_count: int, parcel_acres: float) -> float:
    """
    Estimate annual outdoor irrigation demand for a development in acre-feet/year.

    Lot size per unit drives irrigated area — dense apartments have almost no lawn,
    while low-density subdivisions can have large irrigated yards. Capped so very
    large rural parcels don't produce unrealistic numbers.

    This is treated as a fixed annual demand (the lot size doesn't grow over time),
    and greywater recycling does NOT reduce irrigation (greywater offsets toilet
    flushing, not outdoor sprinklers).

    Example (500 units on 100 acres):
        lot_size = 100 / 500 = 0.20 acres/unit
        irrigated = min(0.20 * 0.45, 0.25) = 0.09 acres/unit
        total     = 0.09 * 500 = 45 irrigated acres
        demand    = 45 * 2.5   = 112.5 AF/year

    Example (500 units on 5 acres — apartments):
        lot_size  = 5 / 500   = 0.01 acres/unit
        irrigated = 0.01 * 0.45 = 0.0045 acres/unit
        total     = 0.0045 * 500 = 2.25 irrigated acres
        demand    = 2.25 * 2.5   = 5.6 AF/year
    """
    if unit_count <= 0 or parcel_acres <= 0:
        return 0.0

    lot_size_acres = parcel_acres / unit_count
    irrigated_per_unit = min(lot_size_acres * IRRIGATED_LOT_FRACTION, MAX_IRRIGATED_ACRES_PER_UNIT)
    total_irrigated_acres = irrigated_per_unit * unit_count
    return total_irrigated_acres * IRRIGATION_NET_FEET_PER_YEAR


def get_demand_for_year(
    unit_count: int,
    build_year: int,
    year: int,
    growth_rate: float = DEFAULT_GROWTH_RATE,
) -> float:
    """
    Calculate demand for a specific simulation year.

    Before the build year, demand is 0 — the development doesn't exist yet.
    At the build year, demand starts at the base figure.
    Each year after that, demand compounds at growth_rate.

    The growth_rate parameter is intentionally exposed so Monte Carlo mode
    can pass a different sampled rate for each simulation run.

    Args:
        unit_count:  number of homes in the development
        build_year:  year the development comes online
        year:        the simulation year being calculated
        growth_rate: annual demand growth rate (default 1.9%)

    Returns:
        float: acre-feet demand for that year. 0.0 if year < build_year.

    Example:
        500 units, build 2028, checking year 2033 at 1.9% growth
        → base = 300.5 acre-feet
        → 5 years of growth: 300.5 × (1.019)^5 = 330.4 acre-feet
    """
    if year < build_year:
        return 0.0

    base = calculate_base_demand(unit_count)
    years_of_growth = year - build_year
    return base * (1 + growth_rate) ** years_of_growth
