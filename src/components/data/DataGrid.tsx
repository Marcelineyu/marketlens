import { useEffect, useState } from 'react';
import { Row } from '../../types';
import { downloadCsv } from '../../utils/csvExport';
import { formatNumber } from '../../utils/format';

interface DataGridProps {
  rows: Row[];
  columns: string[];
}

export default function DataGrid({ rows, columns }: DataGridProps) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [sortColumn, setSortColumn] = useState('');

  useEffect(() => setPage(0), [rows.length]);

  const filtered = rows.filter(
    (row) =>
      !query ||
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(query.toLowerCase()),
      ),
  );

  const sorted = sortColumn
    ? [...filtered].sort((a, b) =>
        String(a[sortColumn] ?? '').localeCompare(String(b[sortColumn] ?? ''), undefined, {
          numeric: true,
        }),
      )
    : filtered;

  const shown = sorted.slice(page * 20, page * 20 + 20);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 20));

  return (
    <section className="data-section">
      <div className="section-title">
        <div>
          <div className="eyebrow">Explore the records</div>
          <h2>Filtered data</h2>
        </div>
        <button
          className="secondary"
          onClick={() => downloadCsv(filtered, 'marketlens-filtered.csv')}
        >
          Export CSV
        </button>
      </div>
      <div className="table-tools">
        <input
          aria-label="Search data rows"
          placeholder="Search rows…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
        />
        <span>{formatNumber(filtered.length)} rows</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>
                  <button onClick={() => setSortColumn(column)}>
                    {column}
                    {sortColumn === column ? ' ↑' : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column}>{String(row[column] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <button disabled={!page} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>
          Page {page + 1} of {totalPages}
        </span>
        <button disabled={(page + 1) * 20 >= filtered.length} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </section>
  );
}
