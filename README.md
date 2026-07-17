# MarketLens

MarketLens helps you understand unfamiliar CSV and Excel files in the browser. Upload a dataset, review its structure, explore supported charts and observations, and export filtered results—without sending the file to a server or forcing it into predefined business categories.

## What MarketLens does

MarketLens is built for anyone who needs a fast, honest first look at tabular data: analysts checking a new export, marketers reviewing campaign results, or product teams validating a sample before deeper work. The application profiles each field, surfaces missing values and duplicates, suggests visualizations that match the detected structure, and states observations in plain language tied to the filtered data.

- Upload CSV or Excel files (up to 10 MB)
- Inspect dataset structure, missing values, and duplicate rows
- Receive chart suggestions based on detected field types
- Build and validate custom charts before adding them to the dashboard
- Filter categories, search records, and paginate the full grid
- Export filtered data as CSV
- Keep routine analysis in the browser session

Three built-in sample datasets—Campaign, Ecommerce, and Bank Marketing—let you explore the workflow without uploading a file.

## Why I built it

The first version of MarketLens tried to map arbitrary uploads to predefined marketing concepts such as campaigns, funnels, and RFM segments. When I tested that approach against real datasets, including the UCI Bank Marketing sample, compatible-looking columns could be assigned misleading roles—a numeric field treated as conversions, or a demographic column interpreted as a funnel stage.

I changed direction instead of shipping unreliable automation. MarketLens now profiles what is actually in the file, generates charts and observations only when the fields support them, and avoids inventing business meaning the dataset does not contain.

## Key design decisions

### Conservative type inference

Numeric columns are inferred from non-empty values only. At least 90% of those values must parse as valid numbers before the column is treated as numeric. Invalid cells in a mostly numeric column become missing values—not zero—so summaries and charts are not skewed by coercing bad input.

### Structure-aware visualization

Chart suggestions depend on detected field types and valid combinations—dates for trends, numeric pairs for scatter plots, low-cardinality categories for bar charts—not on arbitrary business labels. The custom chart builder validates each combination before rendering.

### Safeguards for identifiers and dates

Columns that look like identifiers or dates receive protections during type detection and chart recommendation. Identifier-only files still show a dataset summary and preview, with a clear explanation when no chartable business fields are present.

### Browser-side processing

Uploaded files are parsed and analyzed in the browser for the current session. MarketLens does not send dataset contents to an application server. Reloading the page clears in-memory data.

## How it works

1. **Parse** the uploaded CSV or Excel file in the browser.
2. **Profile** each field and infer supported types with conservative rules.
3. **Generate** dataset summaries, observations, and valid chart suggestions from the detected structure.
4. **Explore** by filtering, searching, customizing charts, and exporting the current view.

## What I implemented

I designed and built MarketLens as a complete client-side product:

- Product workflow and interface, from upload through dashboard exploration
- React and TypeScript application architecture, including component organization and styling
- Dataset profiling, filtering, aggregation, chart suggestion, and validation logic
- Conservative inference rules, identifier-only safeguards, and descriptive observation generation
- Automated test coverage across analytics, parsing, chart behavior, and UI workflows
- Deterministic CSV and Excel fixtures for regression testing
- JavaScript fixture verification (`scripts/verify-fixtures.mjs`) and Python offline CSV profiling (`tools/profile_dataset.py`)

The product direction reflects testing against real-world datasets and revising earlier assumptions when they produced misleading results.

## Technology

| Area | Technology | Role |
| --- | --- | --- |
| Frontend | React, TypeScript | Interface, state, and analytical workflow |
| Visualization | Recharts | Supported chart rendering |
| File handling | Papa Parse, SheetJS | CSV and Excel parsing |
| Styling | CSS | Design system and responsive interface |
| Testing | Vitest, Testing Library | Application and analytics regression coverage |
| Tooling | JavaScript, Python | Fixture verification and offline CSV QA |
| Build | Vite | Local development and production build |

## Quality and validation

MarketLens is verified through automated tests, deterministic fixtures, and build checks:

| Validation | Result |
| --- | --- |
| Vitest suite | 95 tests passing |
| Fixture verification | 19 fixtures passing |
| Python tests | 8 tests passing |
| Production build | Passing |

```bash
npm test
npm run build
npm run verify:fixtures
python -m unittest discover -s tools/tests
```

Parser and UI regressions are covered in `src/tests/`. Fixture scenarios and regeneration are documented in [`test-data/README.md`](test-data/README.md). The Python profiler is documented in [`tools/README.md`](tools/README.md).

## Project structure

```text
src/
  analytics/       Dataset profiling and chart logic
  components/      React interface components
  styles/          CSS design system
  tests/           Application and analytics tests
  utils/           File parsing and export helpers

scripts/           Fixture validation
test-data/         Deterministic CSV and Excel fixtures
tools/             Python dataset profiling and tests
```

## Getting started

```bash
git clone https://github.com/Marcelineyu/marketlens.git
cd marketlens
npm install
npm run dev
```

Open the local URL shown in the terminal (typically `http://localhost:5173/`). Choose a sample dataset or upload a CSV or Excel file.

Regenerate QA fixtures:

```bash
node test-data/generate-fixtures.mjs
```

Profile a CSV offline:

```bash
python tools/profile_dataset.py test-data/fixtures/01-retail-sales.csv
```

## Author

Marceline Yu

- GitHub: [github.com/Marcelineyu](https://github.com/Marcelineyu)
- LinkedIn: [linkedin.com/in/marcelineyu](https://www.linkedin.com/in/marcelineyu/)
- Repository: [github.com/Marcelineyu/marketlens](https://github.com/Marcelineyu/marketlens)
