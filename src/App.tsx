import { useEffect, useState } from 'react';
import { applyFilters } from './analytics/filters';
import { suggestCharts } from './analytics/chartSuggestions';
import { isIdentifierOnlyDataset } from './analytics/typeDetection';
import ChartBuilder from './components/charts/ChartBuilder';
import ChartCard from './components/ChartCard';
import DataQualityCaveat from './components/dashboard/DataQualityCaveat';
import DatasetFilters from './components/dashboard/DatasetFilters';
import DatasetSummary from './components/dashboard/DatasetSummary';
import IdentifierOnlyState from './components/dashboard/IdentifierOnlyState';
import Observations from './components/dashboard/Observations';
import DataHealthChecklist from './components/dashboard/DataHealthChecklist';
import CleaningChangeLog from './components/dashboard/CleaningChangeLog';
import DatasetNotices from './components/dashboard/DatasetNotices';
import SampleDatasetBar from './components/dashboard/SampleDatasetBar';
import ColumnProfilePanel from './components/data/ColumnProfilePanel';
import DataGrid from './components/data/DataGrid';
import PreviewTable from './components/data/PreviewTable';
import AppFooter from './components/layout/AppFooter';
import AppHeader from './components/layout/AppHeader';
import ScrollNavigation from './components/layout/ScrollNavigation';
import UploadScreen from './components/upload/UploadScreen';
import { ChartSpec, Dataset, FilterState } from './types';
import { applyChartConclusions } from './utils/chartConclusions';
import { getAnalysisContext } from './utils/analysisScope';
import { isSampleDatasetName, loadDefaultSample } from './utils/sampleDataset';

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [customCharts, setCustomCharts] = useState<ChartSpec[]>([]);
  const [viewingSample, setViewingSample] = useState(false);
  const [sampleBarDismissed, setSampleBarDismissed] = useState(false);
  const [ignoredChecklistIds, setIgnoredChecklistIds] = useState<Set<string>>(() => new Set());
  const [bootstrapping, setBootstrapping] = useState(import.meta.env.MODE !== 'test');

  useEffect(() => {
    if (import.meta.env.MODE === 'test') {
      return;
    }

    let cancelled = false;
    loadDefaultSample()
      .then((sample) => {
        if (cancelled || !sample) return;
        setDataset(sample);
        setViewingSample(true);
      })
      .finally(() => {
        if (!cancelled) setBootstrapping(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (bootstrapping && !dataset) {
    return (
      <main className="start">
        <AppHeader />
        <p className="bootstrapping-note">Loading sample dataset…</p>
      </main>
    );
  }

  if (!dataset) {
    return (
      <UploadScreen
        onLoad={(nextDataset) => {
          setDataset(nextDataset);
          setViewingSample(isSampleDatasetName(nextDataset.name));
          setSampleBarDismissed(false);
        }}
      />
    );
  }

  const reset = () => {
    setDataset(null);
    setFilters({});
    setCustomCharts([]);
    setViewingSample(false);
    setSampleBarDismissed(false);
    setIgnoredChecklistIds(new Set());
    setBootstrapping(false);
  };

  const handleDatasetUpload = (nextDataset: Dataset) => {
    setDataset(nextDataset);
    setFilters({});
    setCustomCharts([]);
    setViewingSample(false);
    setSampleBarDismissed(true);
    setIgnoredChecklistIds(new Set());
  };

  const handleDatasetChange = (nextDataset: Dataset) => {
    setDataset(nextDataset);
  };

  if (isIdentifierOnlyDataset(dataset.profiles)) {
    return (
      <IdentifierOnlyState dataset={dataset} onDatasetChange={handleDatasetChange} onReset={reset} />
    );
  }

  const filteredRows = applyFilters(dataset.rows, filters);
  const analysis = getAnalysisContext(dataset, filteredRows, filters);
  const charts = applyChartConclusions(
    analysis.rows,
    [...suggestCharts(analysis.profiles), ...customCharts],
    analysis.profiles,
  );

  const addCustomChart = (spec: ChartSpec) => {
    setCustomCharts([...customCharts, { ...spec, id: `custom-${customCharts.length}` }]);
  };

  const removeCustomChart = (id: string) => {
    setCustomCharts(customCharts.filter((chart) => chart.id !== id));
  };

  return (
    <>
      <AppHeader onReset={reset} dataset={dataset.name} />
      {viewingSample && !sampleBarDismissed && (
        <SampleDatasetBar
          onUpload={handleDatasetUpload}
          onDismiss={() => setSampleBarDismissed(true)}
        />
      )}
      <ScrollNavigation />
      <CleaningChangeLog dataset={dataset} onDatasetChange={handleDatasetChange} />
      <main className="dashboard">
        <DatasetSummary dataset={dataset} />
        <DatasetNotices dataset={dataset} />
        <DatasetFilters dataset={dataset} value={filters} onChange={setFilters} />
        <DataHealthChecklist
          dataset={dataset}
          ignoredItemIds={ignoredChecklistIds}
          onDatasetChange={handleDatasetChange}
          onIgnoreItem={(itemId) =>
            setIgnoredChecklistIds((current) => new Set([...current, itemId]))
          }
        />
        <Observations
          rows={analysis.rows}
          profiles={analysis.profiles}
          scopeLabel={analysis.scopeLabel}
        />
        <DataQualityCaveat
          profile={analysis.profile}
          profiles={analysis.profiles}
          scopeLabel={analysis.scopeLabel}
        />
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
                rows={analysis.rows}
                profiles={analysis.profiles}
                spec={spec}
                scopeLabel={analysis.scopeLabel}
                onRemove={
                  spec.id.startsWith('custom')
                    ? () => removeCustomChart(spec.id)
                    : undefined
                }
              />
            ))}
          </div>
        </section>
        <ChartBuilder dataset={dataset} rows={filteredRows} onAdd={addCustomChart} />
        <ColumnProfilePanel dataset={dataset} onDatasetChange={handleDatasetChange} />
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
          dataset={dataset}
          scopeLabel={analysis.scopeLabel}
          ignoredChecklistIds={ignoredChecklistIds}
        />
      </main>
      <AppFooter />
    </>
  );
}
