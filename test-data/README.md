# MarketLens QA fixtures

Deterministic, fictional datasets for browser and regression QA. Regenerate them with:

```bash
node test-data/generate-fixtures.mjs
```

The 20-fixture suite covers retail transactions, missing and formatted numeric values, identifier-only schemas, valid names containing `id`, no-date and weakly chartable schemas, empty filters, pagination, advertising targets, malformed CSV input, native XLSX cells, a 1,500-row performance case, category ties, accounting negatives, mostly numeric columns, constant and near-constant fields, and weak valid correlations.
