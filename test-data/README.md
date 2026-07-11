# MarketLens QA fixtures

Deterministic, fictional datasets for browser and regression QA. Regenerate them with:

```bash
node test-data/generate-fixtures.mjs
```

The suite covers retail transactions, missing and formatted numeric values, identifier-only schemas, valid names containing `id`, no-date and weakly chartable schemas, empty filters, pagination, advertising targets, malformed CSV input, native XLSX cells, and a 1,500-row performance case.

