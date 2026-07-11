export function finiteNumber(value:unknown){if(value===null||value===undefined||String(value).trim()==='')return undefined;const number=Number(value);return Number.isFinite(number)?number:undefined}
export const numericValues=(values:unknown[])=>values.map(finiteNumber).filter((value):value is number=>value!==undefined);
