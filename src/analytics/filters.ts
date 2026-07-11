import { FilterState, Row } from '../types';
export function applyFilters(rows:Row[],filters:FilterState){return rows.filter(r=>Object.entries(filters).every(([c,f])=>f.kind==='category'?f.values.length===0||f.values.includes(String(r[c])):Number(r[c])>=f.min&&Number(r[c])<=f.max))}
