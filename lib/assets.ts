import manifest from '@/data/assets.json';
export type Asset={id:string;url:string;source:string;kind:string;rights:string;nameKo?:string;entryId?:string;category?:string;content_type?:string;spoiler?:boolean};
export const assets:Asset[]=manifest;
export function assetForUrl(url:string|undefined|null){return url?assets.find(a=>a.url===url):undefined;}
