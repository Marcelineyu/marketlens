# MarketLens

MarketLens is a browser-based CSV and Excel exploration tool that profiles uploaded datasets, suggests useful visualizations, and produces evidence-based summaries without sending user data to a server.

## Overview

MarketLens helps analysts, marketers, and product teams inspect tabular files quickly. Upload a CSV or Excel file—or try one of the built-in sample datasets—and the application profiles each field, detects structure conservatively, and generates charts and observations supported by the available columns.

All parsing and analysis run in the browser. That keeps uploaded files on the user's machine and makes the tool useful for quick exploratory review, portfolio demonstrations, and offline-friendly workflows.

MarketLens does not invent unsupported business meaning. It describes what the data contains and what relationships appear in the filtered view, without forcing arbitrary datasets into predefined marketing concepts.

## Product Motivation

Early versions of MarketLens attempted to map uploaded datasets to predefined marketing concepts such as campaigns, funnels, and RFM segments. Testing with real-world files, including the UCI Bank Marketing dataset, showed that this approach could produce misleading field mappings. A numeric column could be treated as conversions, or a demographic field could be interpreted as a funnel stage simply because its type was compatible.

The product was redesigned around conservative, structure-aware exploratory analysis. MarketLens now detects the actual shape of an uploaded dataset and generates charts and descriptive observations only when the fields support them.

## Core Features

- CSV and Excel file parsing
- Browser-only data processing
- Automatic field profiling
- Conservative type inference
- Missing-value and duplicate detection
- Suggested visualizations
- Custom chart builder with validation
- Dataset filtering
- Searchable data preview with pagination
- CSV export
- Identifier-only dataset safeguards
- Sample datasets for exploration

## Analytical Principles

- Analyses must be supported by the uploaded fields.
- Numeric inference considers non-empty values only.
- A column must meet a 90% numeric-validity threshold before it is treated as numeric.
- Invalid values in a mostly numeric column are treated as missing, not zero.
- Identifier and date protections prevent misleading chart recommendations.
- Observations are descriptive and do not establish causation.
- The tool does not assign unsupported business meaning to arbitrary fields.

## Technology

| Layer | Tools |
| --- | --- |
| Application logic and analytics | TypeScript |
| User interface | React |
| Visualizations | Recharts |
| CSV parsing | Papa Parse |
| Excel parsing | SheetJS / xlsx |
| Visual system and responsive layout | CSS |
| Automated tests | Vitest and Testing Library |
| Fixture generation and validation | JavaScript (Node.js) |
| Offline CSV profiling and QA | Python |
| Development and production build | Vite |

## Architecture

MarketLens is organized around a small set of layers:

1. **File parsing** — reads CSV and Excel files in the browser and normalizes mostly numeric columns.
2. **Type detection** — profiles columns and applies conservative inference rules.
3. **Dataset profiling** — summarizes row counts, missing values, duplicates, and field types.
4. **Aggregation and filtering** — groups, filters, and prepares data for charts and exports.
5. **Chart suggestion and validation** — recommends supported visualizations and validates custom chart combinations.
6. **React presentation layer** — upload flow, dashboard, chart builder, data grid, and observations.
7. **Development and QA tools** — fixture generation, fixture validation, and offline Python profiling.

```
marketlens/
├── index.html
├── package.json
├── scripts/
│   └── verify-fixtures.mjs
├── src/
│   ├── analytics/
│   ├── components/
│   │   ├── charts/
│   │   ├── dashboard/
│   │   ├── data/
│   │   ├── icons/
│   │   ├── layout/
│   │   └── upload/
│   ├── data/
│   ├── styles/
│   ├── tests/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   └── types.ts
├── test-data/
│   ├── fixtures/
│   └── generate-fixtures.mjs
└── tools/
    ├── profile_dataset.py
    ├── tests/
    └── README.md
```

## Privacy

- Uploaded files are parsed and analyzed in the browser.
- Dataset contents are not sent to a MarketLens server.
- Reloading the page clears the in-memory session data.
- The Python utility is an optional local command-line tool for inspecting CSV files on disk.

MarketLens is a client-side application. It does not provide enterprise security guarantees beyond keeping routine analysis local to the browser session.

## Getting Started

```bash
git clone https://github.com/Marcelineyu/marketlens.git
cd marketlens
npm install
npm run dev
```

Production verification:

```bash
npm test
npm run build
```

Regenerate deterministic QA fixtures:

```bash
node test-data/generate-fixtures.mjs
```

Validate fixture files:

```bash
npm run verify:fixtures
```

Profile a CSV offline with Python:

```bash
python tools/profile_dataset.py test-data/fixtures/01-retail-sales.csv
python -m unittest discover -s tools/tests
```

Fixture documentation lives in [`test-data/README.md`](test-data/README.md).

## Author

Marceline Yu

- GitHub: [github.com/Marcelineyu](https://github.com/Marcelineyu)
- LinkedIn: [linkedin.com/in/marcelineyu](https://www.linkedin.com/in/marcelineyu/)
- Repository: [github.com/Marcelineyu/marketlens](https://github.com/Marcelineyu/marketlens)
