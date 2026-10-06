import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {assets} from '@/lib/assets';
export const runtime='nodejs';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const asset=assets.find(a=>a.id===id);
 if(!asset||!/^[a-z0-9-]+$/.test(id))return new Response('Not found',{status:404});
 try{const b=await readFile(path.resolve('data/assets-cache',id));const type=b.subarray(0,4).toString()==='RIFF'?'image/webp':b[0]===137?'image/png':b[0]===255?'image/jpeg':null;if(!type)return new Response('Invalid image',{status:415});return new Response(b,{headers:{'Content-Type':type,'Cache-Control':'private, max-age=86400','X-Content-Type-Options':'nosniff'}});}catch{return new Response('그림 캐시가 없습니다. npm run assets:fetch를 실행하세요.',{status:404});}
}
