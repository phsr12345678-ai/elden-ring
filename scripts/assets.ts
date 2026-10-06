import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fetch,EnvHttpProxyAgent} from 'undici';
import robotsParser from 'robots-parser';
const agent=new EnvHttpProxyAgent();const ua='ChatGPT-User; personal Elden Ring reference archive';
const root=path.resolve('data/assets-cache');await fs.mkdir(root,{recursive:true});
const list=JSON.parse(await fs.readFile('data/assets.json','utf8')) as {id:string;url:string}[];
const robotCache=new Map<string,ReturnType<typeof robotsParser>|null>();
async function allowed(u:URL){
 if(!robotCache.has(u.origin)){try{const r=await fetch(u.origin+'/robots.txt',{dispatcher:agent,headers:{'User-Agent':ua},signal:AbortSignal.timeout(20000)});if(r.status===404)robotCache.set(u.origin,null);else if(r.ok)robotCache.set(u.origin,robotsParser(u.origin+'/robots.txt',await r.text()));else throw Error('robots HTTP '+r.status);}catch{blocked.add(u.hostname);return false;}}
 return robotCache.get(u.origin)?.isAllowed(u.href,'ChatGPT-User')!==false;
}
const previous=await fs.readFile('data/assets-cache/report.json','utf8').then(s=>JSON.parse(s)).catch(()=>({failures:[]}));const deniedResources=new Set<string>(previous.failures.filter((x:{error:string})=>x.error.includes('HTTP 403')).map((x:{id:string})=>x.id));
const blocked=new Set<string>();let ok=0,cached=0;const failures=[];const hashes:Record<string,string>={};
for(const item of list){
 if(!/^[a-z0-9-]+$/.test(item.id))throw Error('Invalid asset ID');const u=new URL(item.url);if(!['eldenring.wiki.gg','i.namu.wiki','raw.githubusercontent.com','blog.kakaocdn.net','t1.daumcdn.net'].includes(u.hostname)){failures.push({id:item.id,error:'not allowed'});continue;}
 if(deniedResources.has(item.id)||/\.gif$/i.test(u.pathname)){failures.push({id:item.id,error:'HTTP 403 previously denied or unsupported GIF; not retried'});continue;}if(blocked.has(u.hostname)){failures.push({id:item.id,error:'host denied earlier request'});continue;}const file=path.join(root,item.id);try{await fs.access(file);cached++;continue;}catch{}
 if(!await allowed(u)){failures.push({id:item.id,error:'robots denied or unavailable'});continue;}
 try{const response=await fetch(u.href,{dispatcher:agent,headers:{'User-Agent':ua},signal:AbortSignal.timeout(45000),redirect:'error'});if(response.status===403||response.status===429)blocked.add(u.hostname);if(!response.ok)throw Error(`HTTP ${response.status}`);const mime=response.headers.get('content-type')??'';if(!/^image\/(png|jpeg|webp)(;|$)/.test(mime)&&mime!=='application/octet-stream')throw Error('Unsupported MIME '+mime);const b=Buffer.from(await response.arrayBuffer());if(!((b[0]===137&&b.subarray(1,4).toString()==='PNG')||(b[0]===255&&b[1]===216)||(b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP')))throw Error('Invalid image signature');if(b.length>80000000)throw Error('Image too large');await fs.writeFile(file+'.tmp',b);await fs.rename(file+'.tmp',file);hashes[item.id]=crypto.createHash('sha256').update(b).digest('hex');ok++;}catch(e){failures.push({id:item.id,error:String(e)});}
 if((ok+failures.length)%100===0)console.log({downloaded:ok,cached,failed:failures.length,total:list.length});
 await new Promise(r=>setTimeout(r,550));
}
await fs.writeFile('data/assets-cache/report.json',JSON.stringify({downloaded:ok,cached,failed:failures.length,failures,hashes},null,2));console.log({downloaded:ok,cached,failed:failures.length,total:list.length});await agent.destroy();
