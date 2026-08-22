import { useState } from 'react';
import { applyFilters } from './analytics/filters';
import { suggestCharts } from './analytics/chartSuggestions';
import { isIdentifierOnlyDataset } from './analytics/typeDetection';
import ChartBuilder from './components/charts/ChartBuilder';
import ChartCard from './components/ChartCard';
import DatasetFilters from './components/dashboard/DatasetFilters';
import DatasetSummary from './components/dashboard/DatasetSummary';
import IdentifierOnlyState from './components/dashboard/IdentifierOnlyState';
import Observations from './components/dashboard/Observations';
import OptionalCleaning from './components/dashboard/OptionalCleaning';
import ColumnProfilePanel from './components/data/ColumnProfilePanel';
import DataGrid from './components/data/DataGrid';
import PreviewTable from './components/data/PreviewTable';
import AppFooter from './components/layout/AppFooter';
import AppHeader from './components/layout/AppHeader';
import ScrollNavigation from './components/layout/ScrollNavigation';
import UploadScreen from './components/upload/UploadScreen';
import { ChartSpec, Dataset, FilterState } from './types';

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [customCharts, setCustomCharts] = useState<ChartSpec[]>([]);

  if (!dataset) {
    return <UploadScreen onLoad={setDataset} />;
  }

  const reset = () => {
    setDataset(null);
    setFilters({});
    setCustomCharts([]);
  };

  if (isIdentifierOnlyDataset(dataset.profiles)) {
    return (
      <IdentifierOnlyState dataset={dataset} onDatasetChange={setDataset} onReset={reset} />
    );
  }

  const filteredRows = applyFilters(dataset.rows, filters);
  const charts = [...suggestCharts(dataset.profiles), ...customCharts];

  const addCustomChart = (spec: ChartSpec) => {
    setCustomCharts([...customCharts, { ...spec, id: `custom-${customCharts.length}` }]);
  };

  const removeCustomChart = (id: string) => {
    setCustomCharts(customCharts.filter((chart) => chart.id !== id));
  };

  return (
    <>
      <AppHeader onReset={reset} dataset={dataset.name} />
      <ScrollNavigation />
      <main className="dashboard">
        <DatasetSummary dataset={dataset} />
        <DatasetFilters dataset={dataset} value={filters} onChange={setFilters} />
        <OptionalCleaning dataset={dataset} onDatasetChange={setDataset} />
        <section className="charts">
          <div className="section-title">
            <div>
              <div className="eyebrow">Automatic exploration</div>
              <h2>Your data, in focus</h2>
            </div>
            <p>{charts.length} charts selected from the fields that actually exist.</p>
          </div>
          <div className="chart-grid">
            {charts.map((spec) => (
              <ChartCard
                key={spec.id}
                rows={filteredRows}
                spec={spec}
                onRemove={
                  spec.id.startsWith('custom')
                    ? () => removeCustomChart(spec.id)
                    : undefined
                }
              />
            ))}
          </div>
        </section>
        <Observations rows={filteredRows} profiles={dataset.profiles} />
        <ChartBuilder dataset={dataset} rows={filteredRows} onAdd={addCustomChart} />
        <ColumnProfilePanel dataset={dataset} onDatasetChange={setDataset} />
        <details className="details-card">
          <summary>
            <span>
              <b>Data preview</b>
              <small>First 20 filtered records</small>
            </span>
            <b>⌄</b>
          </summary>
          <PreviewTable
            rows={filteredRows}
            columns={dataset.profiles.map((profile) => profile.name)}
          />
        </details>
        <DataGrid
          rows={filteredRows}
          columns={dataset.profiles.map((profile) => profile.name)}
        />
      </main>
      <AppFooter />
    </>
  );
}
