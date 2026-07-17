# MarketLens Python QA Tools

This folder contains offline command-line utilities for inspecting CSV datasets during development and QA. These tools are **not** part of the browser application and do not send data anywhere.

## Why this exists

MarketLens performs its analysis in the browser using TypeScript. The Python utility provides a lightweight way to inspect fixture files, validate row counts, review missing values, and spot obvious data issues before running the web application or automated tests.

It does **not** claim perfect parity with the TypeScript analytics engine. Type inference, chart suggestions, and business safeguards remain implemented in the React application.

## Run the profiler

```bash
python tools/profile_dataset.py test-data/fixtures/01-retail-sales.csv
```

JSON output:

```bash
python tools/profile_dataset.py test-data/fixtures/01-retail-sales.csv --json
```

## Run Python tests

```bash
python -m unittest discover -s tools/tests
```

## Requirements

- Python 3.9 or newer
- Standard library only
