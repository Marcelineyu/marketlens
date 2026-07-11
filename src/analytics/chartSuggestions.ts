import { ChartSpec, ColumnProfile } from '../types';
const outcomeName=/^(y|outcome|result|converted|conversion|subscribed|success)$/i;
export function preferredBinary(p:ColumnProfile[]){return p.find(x=>x.type==='binary'&&outcomeName.test(x.name))||p.find(x=>x.type==='binary')}
export function suggestCharts(p:ColumnProfile[]):ChartSpec[]{const out:ChartSpec[]=[];const binary=preferredBinary(p);const nums=p.filter(x=>x.type==='numeric').slice(0,2);const cats=p.filter(x=>x.type==='categorical'&&x.unique<=30).slice(0,3);const date=p.find(x=>x.type==='date');
 if(binary)out.push({id:'outcome',title:`${binary.name} outcome`,subtitle:'Counts and share of records',kind:'donut',x:binary.name,featured:true});
 if(date&&nums[0])out.push({id:'trend',title:`${nums[0].name} over time`,subtitle:`Average ${nums[0].name} by date`,kind:'line',x:date.name,y:nums[0].name,aggregation:'average',featured:!binary});
 if(nums[0])out.push({id:'dist',title:`${nums[0].name} distribution`,subtitle:'Distribution across the observed range',kind:'histogram',x:nums[0].name,featured:!out.length});
 if(cats[0])out.push({id:'category',title:`Records by ${cats[0].name}`,subtitle:'Most common categories',kind:'horizontal',x:cats[0].name,aggregation:'count'});
 if(binary&&cats[0])out.push({id:'rate1',title:`${binary.name} rate by ${cats[0].name}`,subtitle:'Observed positive outcome rate and sample size',kind:'bar',x:cats[0].name,outcome:binary.name,aggregation:'outcomeRate'});
 if(binary&&cats[1])out.push({id:'rate2',title:`${binary.name} rate by ${cats[1].name}`,subtitle:'Observed positive outcome rate and sample size',kind:'bar',x:cats[1].name,outcome:binary.name,aggregation:'outcomeRate'});
 if(out.length<4&&cats[1])out.push({id:'category2',title:`Records by ${cats[1].name}`,subtitle:'Most common categories',kind:'horizontal',x:cats[1].name,aggregation:'count'});
 if(out.length<4&&nums[1])out.push({id:'scatter',title:`${nums[1].name} vs ${nums[0]?.name}`,subtitle:'Relationship between numeric fields',kind:'scatter',x:nums[0].name,y:nums[1].name});return out.slice(0,6)}
