"""
DataDungeon — PDF Report Generator

Builds a formatted PDF report from a completed project and its simulation results.
Works for both PASS and FAIL verdicts.

Layout:
  1. Header bar — project name + report title
  2. Project details — units, build year, levers applied
  3. Verdict banner — large PASS (green) or FAIL (red)
  4. Simulation summary — p_failure, first failure year, median deficit
  5. Fixed scenario results — table of 4 climate scenarios
  6. Failure probability by decade — table from failure_curve
  7. Data sources footer
"""

from fpdf import FPDF
from datetime import date
from pathlib import Path

LOGO_PATH = Path(__file__).parent.parent / "image.png"


# ---------------------------------------------------------------------------
# Parcel centroid helper
# ---------------------------------------------------------------------------

def _calc_centroid(parcel_geojson: dict):
    """Return (lat, lng) centroid of a GeoJSON Polygon or Feature, or (None, None)."""
    try:
        geojson = parcel_geojson or {}
        if geojson.get("type") == "Feature":
            coords = geojson["geometry"]["coordinates"][0]
        else:
            coords = geojson["coordinates"][0]
        lngs = [c[0] for c in coords]
        lats = [c[1] for c in coords]
        return sum(lats) / len(lats), sum(lngs) / len(lngs)
    except (KeyError, IndexError, TypeError, ZeroDivisionError):
        return None, None


# ---------------------------------------------------------------------------
# Colours — Thallo brand palette
# ---------------------------------------------------------------------------

NAVY        = (0,   18,  51)   # #001233 — header bar, primary text
NAVY_MID    = (0,   40,  85)   # #002855 — table headers, accents
SLATE       = (51,  65,  92)   # #33415C — borders, secondary elements
MUTED       = (151, 157, 172)  # #979DAC — secondary text, footnotes
WHITE       = (255, 255, 255)  # #FFFFFF

PASS_GREEN  = (22,  101, 52)   # text on pass badge
PASS_BG     = (220, 252, 231)  # pass badge background
FAIL_RED    = (185, 28,  28)   # text on fail badge
FAIL_BG     = (254, 226, 226)  # fail badge background

LIGHT_ROW   = (240, 243, 248)  # alternating table row (tint of NAVY)
DARK_TEXT   = NAVY             # primary body text


# ---------------------------------------------------------------------------
# Helper — set fill + text colour together
# ---------------------------------------------------------------------------

def _set_colors(pdf: FPDF, text: tuple, fill: tuple = None):
    pdf.set_text_color(*text)
    if fill:
        pdf.set_fill_color(*fill)


# ---------------------------------------------------------------------------
# Section helpers
# ---------------------------------------------------------------------------

def _section_heading(pdf: FPDF, title: str):
    """Render a bold section heading with a thin rule underneath."""
    pdf.ln(6)
    pdf.set_font("Helvetica", "B", 11)
    _set_colors(pdf, DARK_TEXT)
    pdf.cell(0, 8, title, ln=True)

    # thin rule
    pdf.set_draw_color(*SLATE)
    pdf.set_line_width(0.4)
    pdf.line(pdf.get_x(), pdf.get_y(), pdf.get_x() + 175, pdf.get_y())
    pdf.ln(3)


def _kv_row(pdf: FPDF, label: str, value: str, shade: bool = False):
    """Render a label / value pair as a shaded or white table row."""
    fill_color = LIGHT_ROW if shade else WHITE
    pdf.set_fill_color(*fill_color)
    pdf.set_font("Helvetica", "", 10)
    _set_colors(pdf, MUTED)
    pdf.cell(60, 8, label, border="LTB", fill=True)
    _set_colors(pdf, DARK_TEXT)
    pdf.cell(115, 8, value, border="RTB", fill=True, ln=True)


def _scenario_row(pdf: FPDF, label: str, result: str, shade: bool = False):
    """Render one row of the fixed-scenario results table."""
    fill_color = LIGHT_ROW if shade else WHITE
    pdf.set_fill_color(*fill_color)

    pdf.set_font("Helvetica", "", 10)
    _set_colors(pdf, DARK_TEXT)
    pdf.cell(120, 8, label, border="LTB", fill=True)

    # colour the PASS / FAIL cell
    if result == "PASS":
        pdf.set_text_color(*PASS_GREEN)
        pdf.set_fill_color(*PASS_BG)
    else:
        pdf.set_text_color(*FAIL_RED)
        pdf.set_fill_color(*FAIL_BG)

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(55, 8, result, border="RTB", fill=True, ln=True)


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def generate_report(project, simulation_results: dict, levers: dict = None) -> bytes:
    """
    Build a PDF report and return the raw bytes.

    Args:
        project:            the SQLAlchemy Project object
        simulation_results: the dict stored in project.simulation_results

    Returns:
        bytes: the PDF file content, ready to stream to the client
    """

    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.set_margins(left=15, top=15, right=15)

    verdict       = simulation_results.get("verdict", "UNKNOWN")
    p_fail        = simulation_results.get("p_failure_by_end_year", 0.0)
    end_year      = simulation_results.get("simulation_end_year", project.build_year + 49)
    first_year    = simulation_results.get("first_failure_year")
    deficit       = simulation_results.get("median_deficit_acre_feet")
    scenarios     = simulation_results.get("scenario_results", {})
    failure_curve = simulation_results.get("failure_curve", [])

    # -----------------------------------------------------------------------
    # 1. Header bar
    # -----------------------------------------------------------------------

    pdf.set_fill_color(*NAVY)
    pdf.rect(0, 0, 210, 28, "F")

    # Logo — top left of the header bar
    if LOGO_PATH.exists():
        pdf.image(str(LOGO_PATH), x=15, y=4, h=20)

    pdf.set_xy(15, 7)
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*WHITE)
    pdf.cell(0, 8, "Water Viability Report", align="R", ln=True)

    pdf.set_xy(15, 17)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, f"Generated {date.today().strftime('%B %d, %Y')}  |  Cache County, Utah", align="R", ln=True)

    pdf.set_y(35)

    # -----------------------------------------------------------------------
    # 2. Project details
    # -----------------------------------------------------------------------

    _section_heading(pdf, "Project Details")

    lat, lng = _calc_centroid(project.parcel_geojson)
    centroid_str = f"{lat:.5f} N, {lng:.5f} W" if lat is not None else "N/A"

    # Apply lever adjustments to displayed values if provided
    unit_reduction_pct  = levers.get("unit_reduction_pct", 0)  if levers else 0
    build_delay_years   = levers.get("build_delay_years", 0)    if levers else 0
    grey_lever          = levers.get("greywater_recycling", False) if levers else False
    pipe_lever          = levers.get("pipeline_added", False)   if levers else False

    displayed_units      = round(project.unit_count * (1 - unit_reduction_pct))
    displayed_build_year = project.build_year + build_delay_years
    displayed_grey       = grey_lever or project.greywater_recycling
    displayed_pipe       = pipe_lever or project.pipeline_added

    _kv_row(pdf, "Project Name",        project.project_name,               shade=False)
    _kv_row(pdf, "Parcel Center",       centroid_str,                       shade=True)
    _kv_row(pdf, "Homes Proposed",      f"{displayed_units:,} units",       shade=False)
    _kv_row(pdf, "Planned Build Year",  str(displayed_build_year),          shade=True)
    _kv_row(pdf, "Greywater Recycling", "Yes" if displayed_grey else "No",  shade=False)
    _kv_row(pdf, "Pipeline Added",      "Yes" if displayed_pipe else "No",  shade=True)

    # -----------------------------------------------------------------------
    # 3. Verdict banner
    # -----------------------------------------------------------------------

    pdf.ln(10)

    if verdict == "PASS":
        pdf.set_fill_color(*PASS_BG)
        pdf.set_draw_color(*PASS_GREEN)
        label_color = PASS_GREEN
        badge_text  = "PASS"
        sub_text    = "This project meets Cache County's 50-year water viability standard."
    else:
        pdf.set_fill_color(*FAIL_BG)
        pdf.set_draw_color(*FAIL_RED)
        label_color = FAIL_RED
        badge_text  = "FAIL"
        sub_text    = "This project exceeds the acceptable water deficit risk threshold."

    pdf.set_line_width(0.8)
    pdf.rect(15, pdf.get_y(), 175, 22, "FD")

    pdf.set_xy(15, pdf.get_y() + 3)
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(*label_color)
    pdf.cell(175, 10, f"Verdict:  {badge_text}", align="C", ln=True)

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*MUTED)
    pdf.cell(175, 6, sub_text, align="C", ln=True)

    # -----------------------------------------------------------------------
    # 4. Simulation summary
    # -----------------------------------------------------------------------

    _section_heading(pdf, "Simulation Summary")

    p_fail_pct = f"{p_fail * 100:.1f}%"
    threshold_note = "  (threshold: 15%)"

    _kv_row(pdf, f"Probability of Deficit by {end_year}",
            p_fail_pct + threshold_note, shade=False)
    _kv_row(pdf, "Monte Carlo Runs",
            "1,000 independent simulations", shade=True)
    _kv_row(pdf, "Simulation Horizon",
            f"{project.build_year} - {end_year}  (50 years)", shade=False)
    _kv_row(pdf, "Median First Failure Year",
            str(first_year) if first_year else "N/A  (no failure occurred)", shade=True)
    _kv_row(pdf, "Median Deficit at Failure",
            f"{deficit:,.1f} acre-feet/year" if deficit else "N/A  (no deficit recorded)", shade=False)

    # -----------------------------------------------------------------------
    # 5. Fixed scenario results
    # -----------------------------------------------------------------------

    _section_heading(pdf, "Fixed Climate Scenario Results")

    # Table header
    pdf.set_fill_color(*NAVY_MID)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(120, 8, "Scenario", border=1, fill=True)
    pdf.cell(55,  8, "Result",   border=1, fill=True, ln=True)

    scenario_labels = {
        "baseline":         "Baseline  (historical average)",
        "moderate_drought": "Moderate Drought  (CMIP6 SSP2-4.5, -21% supply)",
        "severe_drought":   "Severe Drought  (CMIP6 SSP5-8.5, -43% supply)",
        "reduced_snowpack": "Reduced Snowpack  (-29% snowpack, early melt)",
    }

    for i, (key, label) in enumerate(scenario_labels.items()):
        result = scenarios.get(key, "N/A")
        _scenario_row(pdf, label, result, shade=(i % 2 == 1))

    # -----------------------------------------------------------------------
    # 6. Failure probability by decade
    # -----------------------------------------------------------------------

    _section_heading(pdf, "Failure Probability Over Time")

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5,
        "Fraction of 1,000 simulations that experienced a water deficit by each year.",
        ln=True)
    pdf.ln(2)

    # Table header
    pdf.set_fill_color(*NAVY_MID)
    pdf.set_text_color(*WHITE)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(87, 8, "Year", border=1, fill=True, align="C")
    pdf.cell(88, 8, "Probability of Deficit", border=1, fill=True, align="C", ln=True)

    # Show every 5th year from the failure curve to keep the table readable
    decade_points = [pt for pt in failure_curve if pt["year"] % 5 == 0]

    for i, pt in enumerate(decade_points):
        shade = (i % 2 == 1)
        fill_color = LIGHT_ROW if shade else WHITE
        pdf.set_fill_color(*fill_color)
        pdf.set_text_color(*DARK_TEXT)
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(87, 7, str(pt["year"]), border="LTB", fill=True, align="C")

        pct = pt["p_failure"] * 100
        if pct > 15:
            pdf.set_text_color(*FAIL_RED)
            pdf.set_font("Helvetica", "B", 10)
        else:
            pdf.set_text_color(*PASS_GREEN)
            pdf.set_font("Helvetica", "", 10)

        pdf.cell(88, 7, f"{pct:.1f}%", border="RTB", fill=True, align="C", ln=True)

    # -----------------------------------------------------------------------
    # 7. Data sources
    # -----------------------------------------------------------------------

    pdf.ln(8)
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, "Data Sources", ln=True)

    pdf.set_font("Helvetica", "", 8)
    sources = [
        "USGS National Water Information System - Logan River gauge 10109000",
        "Utah Division of Water Resources - Bear River Basin Study 2021",
        "Cache County General Plan 2023 - Water Resources Element",
        "CMIP6 Projections via Utah Climate Center, Utah State University",
    ]
    pdf.set_text_color(*MUTED)
    for source in sources:
        pdf.cell(0, 4, f"  - {source}", ln=True)

    return bytes(pdf.output())
