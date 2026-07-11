import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
vi.mock('recharts',async importOriginal=>{const actual=await importOriginal<typeof import('recharts')>();const React=await import('react');return{...actual,ResponsiveContainer:({children}:{children:React.ReactNode})=>{const sized=React.isValidElement<{width?:number;height?:number}>(children)?React.cloneElement(children,{width:800,height:400}):children;return React.createElement('div',{style:{width:800,height:400}},sized)},Scatter:()=>null}});
afterEach(()=>cleanup());
class ResizeObserver{observe(){}unobserve(){}disconnect(){}}
Object.defineProperty(globalThis,'ResizeObserver',{value:ResizeObserver});
Object.defineProperty(globalThis.URL,'createObjectURL',{value:()=> 'blob:test'});
Object.defineProperty(globalThis.URL,'revokeObjectURL',{value:()=>{}});
