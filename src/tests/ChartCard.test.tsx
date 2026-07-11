import { render,screen } from '@testing-library/react';
import { expect,it,vi } from 'vitest';
import ChartCard,{chartData,chartExportRows,paintPngCanvas} from '../components/ChartCard';
import { ChartSpec,Row } from '../types';
import { toCsv } from '../utils/csvExport';

const scatterSpec:ChartSpec={id:'scatter-test',title:'Scatter test',subtitle:'Numeric relationship',kind:'scatter',x:'x',y:'y'};

it('paints a white background before drawing PNG chart content',()=>{const fillRect=vi.fn();const drawImage=vi.fn();const context={fillStyle:'',fillRect,drawImage} as unknown as CanvasRenderingContext2D;paintPngCanvas(context,{} as CanvasImageSource,640,480);expect(context.fillStyle).toBe('#fff');expect(fillRect).toHaveBeenCalledWith(0,0,640,480);expect(drawImage).toHaveBeenCalledWith({},0,0,640,480);expect(fillRect.mock.invocationCallOrder[0]).toBeLessThan(drawImage.mock.invocationCallOrder[0])});

it('samples scatter data after validating points and keeps the 800-point threshold',()=>{const rows:Row[]=[{x:'invalid',y:1},...Array.from({length:805},(_,i)=>({x:i,y:i*2}))];expect(chartData(rows,scatterSpec)).toHaveLength(800)});
it('excludes missing values from numeric chart data',()=>{const histogram=chartData([{value:null},{value:''},{value:4},{value:8}],{id:'hist',title:'Value',subtitle:'Value',kind:'histogram',x:'value'});expect(histogram.reduce((sum,row)=>sum+('value'in row?row.value:0),0)).toBe(2);expect(chartData([{x:null,y:2},{x:1,y:2}],scatterSpec)).toHaveLength(1)});
it('uses field-aware chart CSV headers',()=>{const scatter=chartData([{TV:10,sales:4},{TV:20,sales:8}],{...scatterSpec,x:'TV',y:'sales'});expect(toCsv(chartExportRows(scatter,{...scatterSpec,x:'TV',y:'sales'})).split('\n')[0].trim()).toBe('TV,sales');const histogram=chartData([{sales:4},{sales:8}],{id:'sales-dist',title:'Sales distribution',subtitle:'Distribution',kind:'histogram',x:'sales'});expect(toCsv(chartExportRows(histogram,{id:'sales-dist',title:'Sales distribution',subtitle:'Distribution',kind:'histogram',x:'sales'})).split('\n')[0].trim()).toBe('sales range,count')});

it('shows the scatter sampling note only when more than 800 valid points exist',()=>{const sampled=Array.from({length:801},(_,i)=>({x:i,y:i*2}));const {rerender}=render(<ChartCard rows={sampled} spec={scatterSpec}/>);expect(screen.getByText('Showing a sample of 800 records for performance.')).toBeInTheDocument();rerender(<ChartCard rows={sampled.slice(0,800)} spec={scatterSpec}/>);expect(screen.queryByText('Showing a sample of 800 records for performance.')).not.toBeInTheDocument()});
