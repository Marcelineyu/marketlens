import { render,screen } from '@testing-library/react';
import { expect,it,vi } from 'vitest';
import ChartCard,{chartData,paintPngCanvas} from '../components/ChartCard';
import { ChartSpec,Row } from '../types';

const scatterSpec:ChartSpec={id:'scatter-test',title:'Scatter test',subtitle:'Numeric relationship',kind:'scatter',x:'x',y:'y'};

it('paints a white background before drawing PNG chart content',()=>{const fillRect=vi.fn();const drawImage=vi.fn();const context={fillStyle:'',fillRect,drawImage} as unknown as CanvasRenderingContext2D;paintPngCanvas(context,{} as CanvasImageSource,640,480);expect(context.fillStyle).toBe('#fff');expect(fillRect).toHaveBeenCalledWith(0,0,640,480);expect(drawImage).toHaveBeenCalledWith({},0,0,640,480);expect(fillRect.mock.invocationCallOrder[0]).toBeLessThan(drawImage.mock.invocationCallOrder[0])});

it('samples scatter data after validating points and keeps the 800-point threshold',()=>{const rows:Row[]=[{x:'invalid',y:1},...Array.from({length:805},(_,i)=>({x:i,y:i*2}))];expect(chartData(rows,scatterSpec)).toHaveLength(800)});

it('shows the scatter sampling note only when more than 800 valid points exist',()=>{const sampled=Array.from({length:801},(_,i)=>({x:i,y:i*2}));const {rerender}=render(<ChartCard rows={sampled} spec={scatterSpec}/>);expect(screen.getByText('Showing a sample of 800 records for performance.')).toBeInTheDocument();rerender(<ChartCard rows={sampled.slice(0,800)} spec={scatterSpec}/>);expect(screen.queryByText('Showing a sample of 800 records for performance.')).not.toBeInTheDocument()});
