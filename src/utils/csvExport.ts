import Papa from 'papaparse';import { Row } from '../types';
export const toCsv=(rows:Row[])=>Papa.unparse(rows);
export function downloadCsv(rows:Row[],name:string){const a=document.createElement('a');const url=URL.createObjectURL(new Blob([toCsv(rows)],{type:'text/csv'}));a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
