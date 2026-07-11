import { ColumnProfile, ColumnType, Row } from '../types';
const missing=(v:unknown)=>v===null||v===undefined||String(v).trim()==='';
const binaryWords=new Set(['yes','no','true','false','success','failure','converted','not converted','1','0']);
const indexName=(name:string)=>{const n=name.trim().toLowerCase().replace(/[._-]+/g,' ').replace(/\s+/g,' ');return n===''||/^unnamed(?::?\s*\d+)?$/.test(n)||/^(index|row|row number|row num|row id)$/.test(n)};
const identifierName=(name:string)=>/(^id$| id$| code$| number$)/.test(name.trim().toLowerCase().replace(/[._-]+/g,' ').replace(/\s+/g,' '));
const sequential=(values:number[])=>{if(values.length<2)return false;const sorted=[...values].sort((a,b)=>a-b);const steps=sorted.slice(1).filter((v,i)=>Math.abs(v-sorted[i]-1)<1e-9).length;return steps/Math.max(sorted.length-1,1)>=.9};
export function detectType(values:unknown[], name=''):ColumnType{
 const present=values.filter(v=>!missing(v)); if(!present.length)return 'categorical';
 const strings=present.map(v=>String(v).trim()); const unique=new Set(strings); const ratio=unique.size/present.length;
 const low=strings.map(v=>v.toLowerCase()); if(unique.size===2&&low.every(v=>binaryWords.has(v)))return 'binary';
 const numeric=strings.filter(v=>v!==''&&Number.isFinite(Number(v))).length/present.length;
 if(numeric>.95){const nums=strings.map(Number);if(ratio>.9&&indexName(name)&&sequential(nums))return 'identifier';if(ratio>.96&&present.length>20&&identifierName(name))return 'identifier';return 'numeric'}
 if(identifierName(name))return 'identifier';
 const dates=strings.filter(v=>/^(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})(?:[ T].*)?$/.test(v)&&!Number.isNaN(Date.parse(v))).length/present.length;
 if(dates>.9)return 'date';
 if(ratio>.96&&present.length>20)return strings.reduce((a,b)=>a+b.length,0)/strings.length>40?'text':'identifier';
 if(strings.reduce((a,b)=>a+b.length,0)/strings.length>80)return 'text';
 return 'categorical';
}
export function profileRows(rows:Row[]):ColumnProfile[]{
 const names=Array.from(new Set(rows.flatMap(Object.keys)));
 return names.map(name=>{const values=rows.map(r=>r[name]);const p=values.filter(v=>!missing(v));return{name,type:detectType(values,name),missing:values.length-p.length,unique:new Set(p.map(String)).size,examples:Array.from(new Set(p.map(String))).slice(0,3),values}})
}
export const isMissing=missing;
