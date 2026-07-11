# MarketLens

Turn your CSV into clear, beautiful insights.

MarketLens is a client-side data exploration portfolio project built by Marceline Yu. It profiles CSV and Excel files, suggests useful charts from the available fields, supports filtering and custom chart creation, and keeps uploaded data in the browser.

## Why I Simplified the Product

The first version of MarketLens tried to force uploaded datasets into predefined marketing concepts such as campaigns, funnels, and RFM segments. Testing the application with the UCI Bank Marketing dataset revealed that this approach could produce misleading field mappings and analyses.

For example, a generic numeric column could be incorrectly treated as conversions, or a demographic field could be interpreted as a funnel stage simply because its data type was compatible.

I redesigned MarketLens as a general exploratory data analysis and visualization tool. The current version detects the actual structure of an uploaded dataset and generates appropriate charts and descriptive observations without inventing unsupported business meaning.

This redesign reflects three principles:

- Prefer conservative data interpretation over forced automation.
- Generate only analyses that are supported by the available fields.
- Make visualizations clear, useful, and easy to understand for non-technical users.

## Run locally

```bash
npm install
npm run dev
```

Production verification:

```bash
npm test
npm run build
```

## Author

Marceline Yu

- GitHub profile: [github.com/Marcelineyu](https://github.com/Marcelineyu)
- LinkedIn: [linkedin.com/in/marcelineyu](https://www.linkedin.com/in/marcelineyu/)
- Project repository: [github.com/Marcelineyu/marketlens](https://github.com/Marcelineyu/marketlens)
