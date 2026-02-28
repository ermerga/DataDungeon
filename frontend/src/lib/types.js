// Thallo — Shared API Types (JSDoc)
// These match the Pydantic schemas in backend/schemas/ exactly.
// Use these as @param and @type annotations throughout the frontend.

/**
 * Sent to POST /projects to create a new project.
 * @typedef {Object} ProjectCreate
 * @property {string} project_name
 * @property {number} unit_count - Number of homes. Must be > 0.
 * @property {number} build_year - Year the development comes online. 2025–2075.
 * @property {Object} parcel_geojson - GeoJSON Feature with a Polygon geometry.
 */

/**
 * Returned by POST /projects and GET /projects/:id
 * @typedef {Object} ProjectResponse
 * @property {number} id
 * @property {string} project_name
 * @property {number} unit_count
 * @property {number} build_year
 * @property {Object} parcel_geojson
 * @property {'pending'|'running'|'complete'|'failed'} status
 * @property {string} created_at - ISO 8601 datetime string
 */

/**
 * A single point on the probability-of-failure curve.
 * @typedef {Object} FailurePoint
 * @property {number} year - Calendar year (2025–2074)
 * @property {number} p_failure - Probability of failure by this year (0.0–1.0)
 */

/**
 * PASS/FAIL verdict for each of the four fixed climate scenarios.
 * @typedef {Object} ScenarioResults
 * @property {'PASS'|'FAIL'} baseline
 * @property {'PASS'|'FAIL'} moderate_drought
 * @property {'PASS'|'FAIL'} severe_drought
 * @property {'PASS'|'FAIL'} reduced_snowpack
 */

/**
 * The full simulation result. Present inside SimulationStatusResponse when status is "complete".
 * @typedef {Object} SimulationResult
 * @property {'PASS'|'FAIL'} verdict
 * @property {number} p_failure_by_2074 - Overall probability of failure by 2074 (0.0–1.0)
 * @property {number|null} first_failure_year - First year demand exceeds supply. Null if PASS.
 * @property {number|null} median_deficit_acre_feet - Median deficit at point of failure. Null if PASS.
 * @property {FailurePoint[]} failure_curve - 50 entries, one per year 2025–2074.
 * @property {ScenarioResults} scenario_results
 */

/**
 * Returned by GET /projects/:id/results
 * Poll this endpoint every 2 seconds until status === "complete".
 * @typedef {Object} SimulationStatusResponse
 * @property {'pending'|'running'|'complete'|'failed'} status
 * @property {SimulationResult|null} results - Null until status is "complete"
 */

/**
 * Sent to PATCH /projects/:id/whatif to adjust levers and get an updated simulation result.
 * All fields are optional — only send the ones being changed.
 * @typedef {Object} WhatIfRequest
 * @property {number} [unit_reduction_pct] - 0.0 to 1.0. E.g. 0.2 = 20% fewer homes.
 * @property {boolean} [greywater_recycling] - Reduces municipal demand by 28%.
 * @property {boolean} [pipeline_added] - Adds 5,000 acre-feet/year to supply.
 * @property {number} [build_delay_years] - Years to push back the build start. 0–20.
 */

/**
 * Which levers Claude is recommending for a given intervention path.
 * @typedef {Object} LeverSet
 * @property {number|null} unit_reduction_pct
 * @property {boolean|null} greywater_recycling
 * @property {boolean|null} pipeline_added
 * @property {number|null} build_delay_years
 */

/**
 * A single AI-recommended intervention path.
 * @typedef {Object} Recommendation
 * @property {number} rank - 1 is the best option.
 * @property {LeverSet} levers - Which levers to pull.
 * @property {'PASS'|'FAIL'} projected_verdict - Expected outcome after applying these levers.
 * @property {number} projected_p_failure - Expected p_failure_by_2074 after applying levers.
 * @property {string} explanation - Plain-English explanation for the developer.
 */

/**
 * Returned by POST /projects/:id/recommend
 * Only call this after the simulation returns verdict === "FAIL".
 * @typedef {Object} RecommendationResponse
 * @property {Recommendation[]} recommendations - 2–3 ranked options.
 * @property {boolean} unfixable - True if no lever combination can fix the failure.
 * @property {string|null} unfixable_reason - Explanation if unfixable is true.
 */
