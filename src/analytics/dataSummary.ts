import { ColumnProfile, Row } from '../types';
export function duplicateCount(rows:Row[]){const seen=new Set<string>();let n=0;for(const r of rows){const k=JSON.stringify(r);seen.has(k)?n++:seen.add(k)}return n}
export function summarize(rows:Row[],profiles:ColumnProfile[]){const count=(t:string)=>profiles.filter(p=>p.type===t).length;return{rows:rows.length,columns:profiles.length,numeric:count('numeric'),categorical:count('categorical'),date:count('date'),binary:count('binary'),missing:profiles.reduce((a,p)=>a+p.missing,0),duplicates:duplicateCount(rows)}}
