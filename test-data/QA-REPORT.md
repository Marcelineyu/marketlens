# MarketLens QA summary

## Coverage

- Created 16 deterministic CSV/XLSX fixtures covering retail, missing values, formatted numbers, identifiers, dates, pagination, Advertising-style targets, malformed input, native Excel types, and 1,500-row data.
- Exercised the built-in Ecommerce flow from a clean load in the embedded browser, including type detection, automatic charts, observations, chart-builder defaults, filters, preview, and the full data table.
- Verified fixture-backed parsing, type detection, chart recommendations, filtering, exports, empty states, pagination, and chart behavior through automated regression tests.
- The embedded browser's file control did not expose a reliable local-file assignment or Windows picker automation path. External fixture uploads therefore were not claimed as completed browser E2E coverage.

## Confirmed material issues and fixes

| ID | Fixture | Reproduction | Expected | Actual before fix | Severity | Result |
| -- | ------- | ------------ | -------- | ----------------- | -------- | ------ |
| QA-01 | Missing values | Filter/chart rows containing blank numeric cells | Missing values excluded | Blanks contributed zeroes | High | Fixed and regression tested |
| QA-02 | Empty filter | Apply a category combination with no matching rows | Explicit empty observations | Zero-valued observations were invented | High | Fixed and browser verified |
| QA-03 | Pagination | Navigate to a late page, then restrict the filter | Reset to page 1 | Page label could remain beyond the new page count | Medium | Fixed and browser verified |
| QA-04 | Chart CSV | Export scatter or grouped chart data | Field-aware headers | Generic `name`, `x`, and `y` headers | Medium | Fixed and regression tested |
| QA-05 | Advertising | Inspect observations with a named sales target | Focus on sales and strongest predictor | First numeric field was emphasized | Medium | Fixed and regression tested |
| QA-06 | Mixed numeric formats | Parse currency, percentages, and thousands separators | Valid formats become numbers; invalid text remains text | Formatted values remained categorical strings | Medium | Fixed and regression tested |
| QA-07 | Numeric identifiers | Profile `Customer ID`, `Order ID`, and `Account Number` | Detect identifiers | Spaced names could be classified as metrics | High | Fixed and regression tested |
| QA-08 | Built-in Ecommerce | Load the demo from a clean browser state | IDs excluded; `order_date` is the line X-axis | Hyphenated IDs were parsed as dates and `order_id` became the time axis | High | Fixed and browser re-verified |
| QA-09 | Malformed CSV | Parse rows with extra or missing fields | Clear parse error | Structurally inconsistent rows could be accepted | Medium | Fixed and regression tested |

## Focused low-priority QA

| ID | Fixture or flow | Steps | Expected | Actual | Reproducible | Severity | Status | Production code changed |
| -- | --------------- | ----- | -------- | ------ | ------------ | -------- | ------ | ----------------------- |
| QA-10 | Ecommerce demo | Load the demo and inspect the distribution and relationship charts at desktop and mobile widths | Readable field-specific axes with no clipping or page overflow | `Revenue`/`Frequency` and `Quantity`/`Revenue` labels remained inside their cards | Yes | Low | Fixed and verified | Yes |
| QA-11 | Identifier-only fixtures | Profile string, UUID, numeric, date-like numeric, and mixed identifier schemas | No analytical charts, KPIs, or observations; explain recovery | Dedicated explanation, profile, preview, and upload recovery action | Yes | Low | Fixed and regression tested | Yes |
| QA-12 | Identifier plus business field | Profile IDs with revenue, profit, status, region, or date plus revenue | Dataset remains chartable | Identifier-only state was not shown | Yes | Regression guard | Passed | No |
| QA-13 | Embedded file chooser | Attempt local fixture selection through browser automation | Exercise real upload when the environment supports it | The embedded browser did not expose reliable local-file assignment | Yes | Test-environment limitation | Documented, not a product defect | No |

## Final validation

- Run `npm test` for the current automated result and `npm run build` for the current production bundle.
- Browser regression coverage includes Ecommerce date/ID detection; both ID fields are disabled for line X and `order_date` is selected.
- Known expected warning: Vite reports the main minified chunk above 500 kB. No low-risk optimization was required in this QA pass.

## Low-priority improvements completed

- Scatter plots now label the selected X and Y fields with readable field names.
- Histograms now label the analyzed numeric field and use `Frequency` consistently for the count axis.
- Identifier-only datasets now suppress analysis and show a dedicated explanation, recovery action, column profile, and data preview.
