import { render,screen } from '@testing-library/react';
import { expect,it,vi } from 'vitest';
import ChartCard,{chartData,chartExportRows,paintPngCanvas} from '../components/ChartCard';
import { ChartSpec,Row } from '../types';
import { toCsv } from '../utils/csvExport';
import { fieldLabel } from '../utils/fieldLabel';

const scatterSpec:ChartSpec={id:'scatter-test',title:'Scatter test',subtitle:'Numeric relationship',kind:'scatter',x:'x',y:'y'};

it('paints a white background before drawing PNG chart content',()=>{const fillRect=vi.fn();const drawImage=vi.fn();const context={fillStyle:'',fillRect,drawImage} as unknown as CanvasRenderingContext2D;paintPngCanvas(context,{} as CanvasImageSource,640,480);expect(context.fillStyle).toBe('#fff');expect(fillRect).toHaveBeenCalledWith(0,0,640,480);expect(drawImage).toHaveBeenCalledWith({},0,0,640,480);expect(fillRect.mock.invocationCallOrder[0]).toBeLessThan(drawImage.mock.invocationCallOrder[0])});

it('samples scatter data after validating points and keeps the 800-point threshold',()=>{const rows:Row[]=[{x:'invalid',y:1},...Array.from({length:805},(_,i)=>({x:i,y:i*2}))];expect(chartData(rows,scatterSpec)).toHaveLength(800)});
it('excludes missing values from numeric chart data',()=>{const histogram=chartData([{value:null},{value:''},{value:4},{value:8}],{id:'hist',title:'Value',subtitle:'Value',kind:'histogram',x:'value'});expect(histogram.reduce((sum,row)=>sum+('value'in row?row.value:0),0)).toBe(2);expect(chartData([{x:null,y:2},{x:1,y:2}],scatterSpec)).toHaveLength(1)});
it('uses field-aware chart CSV headers',()=>{const scatter=chartData([{TV:10,sales:4},{TV:20,sales:8}],{...scatterSpec,x:'TV',y:'sales'});expect(toCsv(chartExportRows(scatter,{...scatterSpec,x:'TV',y:'sales'})).split('\n')[0].trim()).toBe('TV,sales');const histogram=chartData([{sales:4},{sales:8}],{id:'sales-dist',title:'Sales distribution',subtitle:'Distribution',kind:'histogram',x:'sales'});expect(toCsv(chartExportRows(histogram,{id:'sales-dist',title:'Sales distribution',subtitle:'Distribution',kind:'histogram',x:'sales'})).split('\n')[0].trim()).toBe('sales range,count')});

it('shows the scatter sampling note only when more than 800 valid points exist',()=>{const sampled=Array.from({length:801},(_,i)=>({x:i,y:i*2}));const {rerender}=render(<ChartCard rows={sampled} spec={scatterSpec}/>);expect(screen.getByText('Showing a sample of 800 records for performance.')).toBeInTheDocument();rerender(<ChartCard rows={sampled.slice(0,800)} spec={scatterSpec}/>);expect(screen.queryByText('Showing a sample of 800 records for performance.')).not.toBeInTheDocument()});
it('formats machine-style field names consistently',()=>{expect(fieldLabel('ad_spend')).toBe('Ad Spend');expect(fieldLabel('total-sales')).toBe('Total Sales');expect(fieldLabel('customerAge')).toBe('Customer Age');expect(fieldLabel('TV')).toBe('TV')});
it('labels scatter axes with the selected fields',()=>{render(<ChartCard rows={[{ad_spend:10,total_sales:20},{ad_spend:20,total_sales:35}]} spec={{...scatterSpec,x:'ad_spend',y:'total_sales'}}/>);expect(screen.getByText('Ad Spend')).toBeInTheDocument();expect(screen.getByText('Total Sales')).toBeInTheDocument()});
it('labels histogram axes with the analyzed field and frequency',()=>{render(<ChartCard rows={[{customer_age:20},{customer_age:35}]} spec={{id:'age-hist',title:'Age distribution',subtitle:'Distribution',kind:'histogram',x:'customer_age'}}/>);expect(screen.getByText('Customer Age')).toBeInTheDocument();expect(screen.getByText('Frequency')).toBeInTheDocument()});
