import { FilterState, Row } from '../types';
import { isMissing } from './typeDetection';
export const MISSING_FILTER_VALUE='__marketlens_missing__';
export const categoryFilterValue=(value:unknown)=>isMissing(value)?MISSING_FILTER_VALUE:String(value);
export function applyFilters(rows:Row[],filters:FilterState){return rows.filter(r=>Object.entries(filters).every(([c,f])=>f.kind==='category'?f.values.length===0||f.values.includes(categoryFilterValue(r[c])):Number(r[c])>=f.min&&Number(r[c])<=f.max))}
