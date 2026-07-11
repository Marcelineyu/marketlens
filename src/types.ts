export type Row = Record<string, unknown>;
export type ColumnType = 'numeric'|'categorical'|'date'|'binary'|'identifier'|'text';
export interface ColumnProfile { name:string; type:ColumnType; missing:number; unique:number; examples:string[]; values:unknown[] }
export interface Dataset { name:string; rows:Row[]; originalRows:Row[]; profiles:ColumnProfile[] }
export interface FilterState { [column:string]: {kind:'category'; values:string[]} | {kind:'numeric'; min:number; max:number} }
export interface ChartSpec { id:string; title:string; subtitle:string; kind:'bar'|'horizontal'|'line'|'donut'|'scatter'|'histogram'; x:string; y?:string; aggregation?:Aggregation; outcome?:string; featured?:boolean }
export type Aggregation = 'count'|'sum'|'average'|'median'|'minimum'|'maximum'|'percentage'|'outcomeRate';
