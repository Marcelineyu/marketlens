import { ColumnProfile,Row } from '../types';
import { aggregate,median } from './aggregations';
import { numericCorrelation,preferredBinary,preferredNumericTarget } from './chartSuggestions';
import { numericValues } from './numeric';

const positive=(value:unknown)=>['yes','true','success','converted','1'].includes(String(value).toLowerCase());
export function insights(rows:Row[],profiles:ColumnProfile[]){
 if(!rows.length)return['No observations are available for the current filters.'];
 const out:string[]=[],binary=preferredBinary(profiles),category=profiles.find(profile=>profile.type==='categorical'&&profile.unique<25),target=preferredNumericTarget(profiles),numeric=target||profiles.find(profile=>profile.type==='numeric');
 if(binary){const count=rows.filter(row=>positive(row[binary.name])).length;out.push(`In this dataset, the observed positive ${binary.name} rate was ${(count/rows.length*100).toFixed(1)}% (${count.toLocaleString()} of ${rows.length.toLocaleString()} records).`)}
 if(category){const top=aggregate(rows,category.name,undefined,'count').sort((a,b)=>b.value-a.value)[0];if(top)out.push(`${top.name} was the most common ${category.name} value, representing ${(top.value/rows.length*100).toFixed(1)}% of filtered records.`)}
 if(numeric){const values=numericValues(rows.map(row=>row[numeric.name]));if(values.length)out.push(`The median ${numeric.name} was ${median(values).toLocaleString(undefined,{maximumFractionDigits:1})}, compared with an average of ${(values.reduce((sum,value)=>sum+value,0)/values.length).toLocaleString(undefined,{maximumFractionDigits:1})}.`)}
 if(target){const strongest=profiles.filter(profile=>profile.type==='numeric'&&profile.name!==target.name).map(profile=>({profile,strength:numericCorrelation({...profile,values:rows.map(row=>row[profile.name])},{...target,values:rows.map(row=>row[target.name])})})).sort((a,b)=>b.strength-a.strength)[0];if(strongest&&strongest.strength>0)out.push(`${strongest.profile.name} had the strongest observed linear association with ${target.name} (|r| = ${strongest.strength.toFixed(2)}). This descriptive relationship does not establish causation.`)}
 if(binary&&category){const top=aggregate(rows,category.name,undefined,'outcomeRate',binary.name).sort((a,b)=>b.value-a.value)[0];if(top)out.push(`${top.name} had the highest observed ${binary.name} rate at ${top.value.toFixed(1)}%, based on ${top.count} records.${top.count<30?' This category is small, so the result may be unstable.':''}`)}
 return out.slice(0,4);
}
