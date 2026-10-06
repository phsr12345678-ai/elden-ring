import { NextRequest, NextResponse } from 'next/server';
import { db,view } from '@/lib/db';
import { saveEntry } from '@/lib/writes';
import { assertLocalWrite } from '@/lib/admin';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest) {
  const id=req.nextUrl.searchParams.get('id');
  if(!id)return NextResponse.json({error:'ID가 필요합니다.'},{status:400});
  const e=await db.entry.findUnique({where:{id},include:{outgoing:true,sources:true,questSteps:{orderBy:{position:'asc'}},upgrades:true}});
  if(!e)return NextResponse.json({error:'문서를 찾을 수 없습니다.'},{status:404});
  const {outgoing,sources,questSteps,upgrades,createdAt,updatedAt,searchText,...fields}=view(e);
  return NextResponse.json({...fields,relations:outgoing.map(({toId,label})=>({toId,label})),sources:sources.map(({title,url,note,checkedAt})=>({title,url,note,checkedAt})),questSteps:questSteps.map(({questId,...step})=>({...step,requiredItems:JSON.parse(step.requiredItems)})),upgrades:upgrades.map(({id,entryId,...u})=>({...u,attack:JSON.parse(u.attack),scaling:JSON.parse(u.scaling)}))});
}
export async function POST(req:NextRequest) {
  try { assertLocalWrite(req); } catch(e){return NextResponse.json({error:String(e).replace('Error: ','')},{status:403});}
  try {
    const text=await req.text();
    if(text.length>500000)return NextResponse.json({error:'문서가 너무 큽니다.'},{status:413});
    const id=await saveEntry(JSON.parse(text));
    return NextResponse.json({id});
  } catch(e) {return NextResponse.json({error:e instanceof Error?e.message:'저장 실패'},{status:400});}
}
export async function DELETE(req:NextRequest) {
  try { assertLocalWrite(req); } catch(e){return NextResponse.json({error:String(e).replace('Error: ','')},{status:403});}
  try {
    const id=req.nextUrl.searchParams.get('id');
    if(!id)return NextResponse.json({error:'ID가 필요합니다.'},{status:400});
    await db.$transaction(async tx=>{
      const used=await tx.questStep.count({where:{OR:[{locationId:id},{npcId:id},{requiredItems:{contains:JSON.stringify(id)}}]}});
      if(used)throw new Error('퀘스트 단계에서 참조하는 문서입니다. 단계 연결을 먼저 수정하세요.');
      await tx.entry.delete({where:{id}});
      await tx.seedRegistry.upsert({where:{id},create:{id},update:{}});
    });
    return NextResponse.json({ok:true});
  } catch(e) {return NextResponse.json({error:e instanceof Error?e.message:'삭제 실패'},{status:400});}
}
