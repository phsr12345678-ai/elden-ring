// Three-way merge: enrich unchanged values while preserving administrator edits.
export function mergeFields(current:unknown,baseline:unknown,incoming:unknown):unknown{
 if(current==null&&baseline==null)return incoming;
 if(JSON.stringify(current)===JSON.stringify(baseline))return incoming;
 const obj=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
 if(obj(current)&&obj(baseline)&&obj(incoming))return Object.fromEntries([...new Set([...Object.keys(current),...Object.keys(incoming)])].map(k=>[k,mergeFields(current[k],baseline[k],incoming[k])]));
 return current;
}
