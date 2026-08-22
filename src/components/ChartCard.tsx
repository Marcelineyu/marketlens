import { useMemo, useRef } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartSpec, ColumnProfile, Row } from '../types';
import { downloadCsv } from '../utils/csvExport';
import { buildChartData, scatterPoints } from '../utils/chartData';
import { fieldLabel } from '../utils/fieldLabel';

const colors = ['#7c8cff', '#58d7c6', '#8290aa', '#d8aa62', '#9aa7c0', '#6e7ea0'];

export function paintPngCanvas(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  width: number,
  height: number,
) {
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
}

const cleanNumber = (value: number) =>
  Number.isFinite(value) ? Number(value.toPrecision(12)) : value;

export function chartExportRows(
  data: Array<Record<string, unknown>>,
  spec: ChartSpec,
): Row[] {
  if (spec.kind === 'scatter') {
    return data.map((point: any) => ({ [spec.x]: point.x, [spec.y!]: point.y }));
  }
  if (spec.kind === 'histogram') {
    return data.map((point: any) => ({ [`${spec.x} range`]: point.name, count: point.value }));
  }
  const valueHeader =
    spec.aggregation === 'outcomeRate'
      ? `${spec.outcome || 'outcome'} rate (%)`
      : spec.aggregation === 'count' || !spec.y
        ? 'count'
        : `${spec.aggregation || 'value'} ${spec.y}`;
  return data.map((point: any) => {
    const row: Row = {
      [spec.x]: point.name,
      [valueHeader]:
        typeof point.value === 'number' ? cleanNumber(point.value) : point.value,
    };
    if (Number.isFinite(point.count)) row.records = point.count;
    return row;
  });
}

export default function ChartCard({
  rows,
  spec,
  profiles = [],
  onRemove,
  scopeLabel,
}: {
  rows: Row[];
  spec: ChartSpec;
  profiles?: ColumnProfile[];
  onRemove?: () => void;
  scopeLabel?: string;
}) {
  const { data, outlierNote } = useMemo(
    () => buildChartData(rows, spec, profiles),
    [rows, spec, profiles],
  );
  const wrap = useRef<HTMLDivElement>(null);
  const valueLabel = spec.aggregation === 'outcomeRate' ? 'Rate (%)' : 'Value';
  const scatterSampled = spec.kind === 'scatter' && scatterPoints(rows, spec).length > 800;
  const xLabel = fieldLabel(spec.x);
  const yLabel = spec.kind === 'histogram' ? 'Frequency' : fieldLabel(spec.y || '');
  const scopeNote = scopeLabel
    ? scopeLabel.charAt(0).toUpperCase() + scopeLabel.slice(1)
    : `Based on ${rows.length.toLocaleString()} filtered records`;

  const png = () => {
    const svg = wrap.current?.querySelector('svg');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svg.clientWidth * 2;
      canvas.height = svg.clientHeight * 2;
      const context = canvas.getContext('2d');
      if (context) paintPngCanvas(context, img, canvas.width, canvas.height);
      const anchor = document.createElement('a');
      anchor.download = `${spec.id}.png`;
      anchor.href = canvas.toDataURL('image/png');
      anchor.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
  };

  return (
    <article
      className={`chart-card ${spec.featured ? 'featured' : ''}`}
      ref={wrap}
      aria-label={`${spec.title}. ${spec.subtitle}`}
      data-title-mode={(spec as ChartSpec & { titleMode?: string }).titleMode || 'descriptive'}
    >
      <div className="card-head">
        <div>
          <h3>{spec.title}</h3>
          <p>{spec.subtitle}</p>
        </div>
        <details className="menu">
          <summary aria-label="Chart menu">•••</summary>
          <div>
            <button onClick={png}>Download PNG</button>
            <button onClick={() => downloadCsv(chartExportRows(data, spec), `${spec.id}.csv`)}>
              Download data
            </button>
            {onRemove && <button onClick={onRemove}>Remove</button>}
          </div>
        </details>
      </div>
      <div className="chart-area">
        {!data.length ? (
          <div className="empty">No data matches the current filters.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {spec.kind === 'donut' ? (
              <PieChart>
                <Pie
                  data={data as any[]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="82%"
                  paddingAngle={2}
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => Number(value || 0).toLocaleString()} />
              </PieChart>
            ) : spec.kind === 'line' ? (
              <LineChart data={data as any[]}>
                <CartesianGrid stroke="rgba(148,163,184,.14)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} minTickGap={28} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#7c8cff" strokeWidth={3} dot={false} />
              </LineChart>
            ) : spec.kind === 'scatter' ? (
              <ScatterChart margin={{ left: 18, bottom: 28 }}>
                <CartesianGrid stroke="rgba(148,163,184,.14)" />
                <XAxis
                  dataKey="x"
                  name={spec.x}
                  tick={{ fontSize: 11 }}
                  label={{ value: xLabel, position: 'insideBottom', offset: -16 }}
                />
                <YAxis
                  dataKey="y"
                  name={spec.y}
                  tick={{ fontSize: 11 }}
                  label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: -8 }}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={data as any[]} fill="#7c8cff" fillOpacity={0.7} />
              </ScatterChart>
            ) : (
              <BarChart
                data={data as any[]}
                layout={spec.kind === 'horizontal' ? 'vertical' : 'horizontal'}
                margin={{
                  left: spec.kind === 'horizontal' ? 24 : spec.kind === 'histogram' ? 18 : 0,
                  bottom: spec.kind === 'histogram' ? 28 : 0,
                }}
              >
                <CartesianGrid stroke="rgba(148,163,184,.14)" vertical={false} />
                {spec.kind === 'horizontal' ? (
                  <>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11 }} />
                  </>
                ) : (
                  <>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={data.length > 6 && spec.kind !== 'histogram' ? -25 : 0}
                      textAnchor={data.length > 6 && spec.kind !== 'histogram' ? 'end' : 'middle'}
                      height={spec.kind === 'histogram' ? 50 : data.length > 6 ? 60 : 30}
                      label={
                        spec.kind === 'histogram'
                          ? { value: xLabel, position: 'insideBottom', offset: -16 }
                          : undefined
                      }
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      label={
                        spec.kind === 'histogram'
                          ? { value: yLabel, angle: -90, position: 'insideLeft', offset: -8 }
                          : undefined
                      }
                    />
                  </>
                )}
                <Tooltip
                  formatter={(value: any) => [
                    Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 }),
                    valueLabel,
                  ]}
                />
                <Bar dataKey="value" fill="#7c8cff" radius={[7, 7, 0, 0]}>
                  {data.map((_, index) => (
                    <Cell key={index} fill={index === 0 ? '#58d7c6' : '#7c8cff'} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
      {scatterSampled && (
        <p className="chart-note scatter-sample-note">
          Showing a sample of 800 records for performance.
        </p>
      )}
      {outlierNote && <p className="chart-note outlier-note">{outlierNote}</p>}
      <p className="chart-note">
        {scopeNote}
        {data.some((point: any) => point.count < 30)
          ? '. Small groups should be interpreted cautiously.'
          : '.'}
      </p>
    </article>
  );
}
