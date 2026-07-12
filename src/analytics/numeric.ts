const numberBody='(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?';
export function finiteNumber(value:unknown){
 if(value===null||value===undefined||String(value).trim()==='')return undefined;
 if(typeof value==='number')return Number.isFinite(value)?value:undefined;
 const text=String(value).trim(),accounting=text.match(new RegExp(`^\\((\\$)?(${numberBody})(%)?\\)$`));
 if(accounting){if(accounting[1]&&accounting[3])return undefined;const number=Number(accounting[2].replace(/,/g,''));return accounting[3]?-number/100:-number}
 const percent=text.match(new RegExp(`^([+-]?)(${numberBody})%$`));if(percent)return Number(`${percent[1]}${percent[2].replace(/,/g,'')}`)/100;
 const amount=text.match(new RegExp(`^([+-]?)\\$?(${numberBody})$`));return amount?Number(`${amount[1]}${amount[2].replace(/,/g,'')}`):undefined
}
export const numericValues=(values:unknown[])=>values.map(finiteNumber).filter((value):value is number=>value!==undefined);
export function hasMeaningfulVariance(values:unknown[]){const nums=numericValues(values);if(nums.length<3)return false;const min=Math.min(...nums),max=Math.max(...nums),scale=Math.max(1,...nums.map(Math.abs));return max-min>scale*1e-12}
