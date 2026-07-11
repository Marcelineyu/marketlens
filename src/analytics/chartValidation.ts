import { ChartSpec,ColumnProfile } from '../types';

export const builderUsesY=(kind:ChartSpec['kind'])=>['bar','horizontal','line','scatter'].includes(kind);
export const builderUsesAggregation=(kind:ChartSpec['kind'])=>['bar','horizontal','line'].includes(kind);

export function validBuilderX(kind:ChartSpec['kind'],profile:ColumnProfile){
 if(kind==='scatter'||kind==='histogram')return profile.type==='numeric';
 if(kind==='line')return profile.type==='date';
 if(kind==='donut')return ['categorical','binary'].includes(profile.type)&&profile.unique<=15;
 if(kind==='bar'||kind==='horizontal')return ['categorical','binary'].includes(profile.type);
 return false;
}

export function chartBuilderError(kind:ChartSpec['kind'],x?:ColumnProfile,y?:ColumnProfile){
 if(!x)return 'Choose a valid X-axis field.';
 if(builderUsesY(kind)&&y&&x.name===y.name)return 'X and Y axes must use different fields.';
 if(kind==='histogram'&&x.type!=='numeric')return 'Histograms require a numeric X-axis.';
 if(kind==='scatter'&&(x.type!=='numeric'||y?.type!=='numeric'))return 'Scatter plots require two different numeric fields.';
 if(kind==='line'&&(x.type!=='date'||y?.type!=='numeric'))return 'Line charts require a date X-axis and a numeric Y-axis.';
 if(kind==='donut'&&(!['categorical','binary'].includes(x.type)||x.unique>15))return 'Donut charts require a low-cardinality categorical field.';
 if((kind==='bar'||kind==='horizontal')&&!['categorical','binary'].includes(x.type))return 'Bar charts require a categorical or binary X-axis.';
 return '';
}
