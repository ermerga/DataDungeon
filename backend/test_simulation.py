from services.simulation_engine import run_simulation

print("--- Test 1: Large development, should likely FAIL ---")
result = run_simulation(unit_count=2000, build_year=2027)
print(f"Verdict:            {result['verdict']}")
print(f"P(failure by 2074): {result['p_failure_by_2074']:.1%}")
print(f"First failure year: {result['first_failure_year']}")
print(f"Median deficit:     {result['median_deficit_acre_feet']} acre-feet")
print(f"Scenario results:   {result['scenario_results']}")

print()
print("--- Test 2: Small development, should likely PASS ---")
result2 = run_simulation(unit_count=50, build_year=2030)
print(f"Verdict:            {result2['verdict']}")
print(f"P(failure by 2074): {result2['p_failure_by_2074']:.1%}")
print(f"Scenario results:   {result2['scenario_results']}")

print()
print("--- Test 3: Large development with all levers pulled ---")
result3 = run_simulation(
    unit_count=2000,
    build_year=2027,
    greywater_recycling=True,
    pipeline_added=True,
    unit_reduction_pct=0.3,
    build_delay_years=5,
)
print(f"Verdict:            {result3['verdict']}")
print(f"P(failure by 2074): {result3['p_failure_by_2074']:.1%}")
print(f"First failure year: {result3['first_failure_year']}")
