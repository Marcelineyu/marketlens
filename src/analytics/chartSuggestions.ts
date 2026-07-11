import { ChartSpec,ColumnProfile } from '../types';
import { finiteNumber } from './numeric';

const binaryOutcomeName=/^(y|outcome|result|converted|conversion|subscribed|success)$/i;
const numericTargetName=/^(sales|revenue|profit|conversions|conversion|outcome|target|y|orders)$/i;
const displayName=(name:string,start=false)=>{const clean=name.trim().replace(/[_-]+/g,' ').replace(/\s+/g,' ');return start&&clean?clean[0].toUpperCase()+clean.slice(1):clean};
export const numericCorrelation=(a:ColumnProfile,b:ColumnProfile)=>{const pairs:[number,number][]=[];a.values.forEach((value,i)=>{const x=finiteNumber(value),y=finiteNumber(b.values[i]);if(x!==undefined&&y!==undefined)pairs.push([x,y])});if(pairs.length<3)return 0;const ax=pairs.reduce((sum,[x])=>sum+x,0)/pairs.length,ay=pairs.reduce((sum,[,y])=>sum+y,0)/pairs.length;let numerator=0,dx=0,dy=0;for(const [x,y] of pairs){numerator+=(x-ax)*(y-ay);dx+=(x-ax)**2;dy+=(y-ay)**2}return dx&&dy?Math.abs(numerator/Math.sqrt(dx*dy)):0};

export function preferredBinary(profiles:ColumnProfile[]){return profiles.find(x=>x.type==='binary'&&binaryOutcomeName.test(x.name))||profiles.find(x=>x.type==='binary')}
export function preferredNumericTarget(profiles:ColumnProfile[]){return profiles.find(x=>x.type==='numeric'&&numericTargetName.test(x.name.trim()))}

export function suggestCharts(profiles:ColumnProfile[]):ChartSpec[]{
 const out:ChartSpec[]=[];
 const binary=preferredBinary(profiles);
 const nums=profiles.filter(x=>x.type==='numeric');
 const target=preferredNumericTarget(profiles);
 const cats=profiles.filter(x=>x.type==='categorical'&&x.unique<=30).slice(0,3);
 const date=profiles.find(x=>x.type==='date');
 if(binary)out.push({id:'outcome',title:`${displayName(binary.name,true)} outcome`,subtitle:'Counts and share of records',kind:'donut',x:binary.name,featured:true});
 if(target){
  out.push({id:'target-distribution',title:`${displayName(target.name,true)} distribution`,subtitle:'Distribution across the observed range',kind:'histogram',x:target.name,featured:!binary});
  nums.filter(x=>x.name!==target.name).map((profile,index)=>({profile,index,strength:numericCorrelation(profile,target)})).sort((a,b)=>b.strength-a.strength||a.index-b.index).slice(0,3).forEach(({profile},index)=>out.push({id:`target-scatter-${index}`,title:`${displayName(profile.name,true)} vs ${displayName(target.name)}`,subtitle:`Relationship with ${displayName(target.name)}`,kind:'scatter',x:profile.name,y:target.name}));
  if(date&&out.length<6)out.push({id:'target-trend',title:`${displayName(target.name,true)} over time`,subtitle:`Average ${displayName(target.name)} by date`,kind:'line',x:date.name,y:target.name,aggregation:'average'});
 }else{
  if(date&&nums[0])out.push({id:'trend',title:`${displayName(nums[0].name,true)} over time`,subtitle:`Average ${displayName(nums[0].name)} by date`,kind:'line',x:date.name,y:nums[0].name,aggregation:'average',featured:!binary});
  if(nums[0])out.push({id:'dist',title:`${displayName(nums[0].name,true)} distribution`,subtitle:'Distribution across the observed range',kind:'histogram',x:nums[0].name,featured:!out.length});
 }
 if(cats[0]&&out.length<6)out.push({id:'category',title:`Records by ${displayName(cats[0].name)}`,subtitle:'Most common categories',kind:'horizontal',x:cats[0].name,aggregation:'count'});
 if(binary&&cats[0]&&out.length<6)out.push({id:'rate1',title:`${displayName(binary.name,true)} rate by ${displayName(cats[0].name)}`,subtitle:'Observed positive outcome rate and sample size',kind:'bar',x:cats[0].name,outcome:binary.name,aggregation:'outcomeRate'});
 if(binary&&cats[1]&&out.length<6)out.push({id:'rate2',title:`${displayName(binary.name,true)} rate by ${displayName(cats[1].name)}`,subtitle:'Observed positive outcome rate and sample size',kind:'bar',x:cats[1].name,outcome:binary.name,aggregation:'outcomeRate'});
 if(out.length<4&&cats[1])out.push({id:'category2',title:`Records by ${displayName(cats[1].name)}`,subtitle:'Most common categories',kind:'horizontal',x:cats[1].name,aggregation:'count'});
 if(!target&&out.length<4&&nums[1])out.push({id:'scatter',title:`${displayName(nums[0].name,true)} vs ${displayName(nums[1].name)}`,subtitle:'Relationship between numeric fields',kind:'scatter',x:nums[0].name,y:nums[1].name});
 return out.slice(0,6);
}
