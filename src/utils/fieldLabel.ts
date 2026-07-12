export function fieldLabel(name:string){
 const words=name.trim().replace(/[_-]+/g,' ').replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2').replace(/\s+/g,' ').split(' ').filter(Boolean);
 return words.map(word=>word===word.toUpperCase()&&/[A-Z]/.test(word)?word:word.charAt(0).toUpperCase()+word.slice(1).toLowerCase()).join(' ');
}
