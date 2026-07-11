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

## Final validation

- Automated tests: 38 passed across 4 files.
- Production build: passed, 593 modules transformed.
- Browser regression: Ecommerce reports one date field; both ID fields are disabled for line X; `order_date` is selected.
- Known expected warning: Vite reports the main minified chunk above 500 kB. No low-risk optimization was required in this QA pass.

## Remaining low-priority limitations

- Identifier-only datasets do not have a dedicated explanatory empty-state message.
- Some charts rely on titles and tick labels instead of explicit axis/unit labels.
