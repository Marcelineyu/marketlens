import { Aggregation,Row } from '../types';
import { numericValues } from './numeric';

export const median=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return sorted.length?(sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.ceil((sorted.length-1)/2)])/2:0};
const requiresNumericValues=(op:Aggregation)=>['sum','average','median','minimum','maximum'].includes(op);

export function aggregate(rows:Row[],group:string,value:string|undefined,op:Aggregation='count',outcome?:string){
 const groups=new Map<string,Row[]>();
 for(const row of rows){const key=String(row[group]??'Missing');groups.set(key,[...(groups.get(key)||[]),row])}
 return [...groups].flatMap(([name,groupRows])=>{const nums=value?numericValues(groupRows.map(row=>row[value])):[];if(value&&requiresNumericValues(op)&&!nums.length)return[];let result=groupRows.length;if(op==='sum')result=nums.reduce((sum,n)=>sum+n,0);if(op==='average')result=nums.reduce((sum,n)=>sum+n,0)/nums.length;if(op==='median')result=median(nums);if(op==='minimum')result=Math.min(...nums);if(op==='maximum')result=Math.max(...nums);if(op==='outcomeRate'&&outcome)result=groupRows.filter(row=>isPositive(row[outcome])).length/groupRows.length*100;return[{name,value:result,count:groupRows.length}]})
}

export const isPositive=(value:unknown)=>['yes','true','success','converted','1'].includes(String(value).toLowerCase());
export function topN(data:{name:string;value:number;count?:number}[],n=10){const sorted=[...data].sort((a,b)=>b.value-a.value);if(sorted.length<=n)return sorted;const rest=sorted.slice(n);return[...sorted.slice(0,n),{name:'Other',value:rest.reduce((sum,row)=>sum+row.value,0),count:rest.reduce((sum,row)=>sum+(row.count||0),0)}]}
