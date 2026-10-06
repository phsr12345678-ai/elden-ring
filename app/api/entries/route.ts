import { NextRequest, NextResponse } from 'next/server';
import { db, view } from '@/lib/db';
import { CATEGORIES, CONTENT_TYPES, normalize } from '@/lib/catalog';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const p=request.nextUrl.searchParams;
  const q=normalize(p.get('q')??'').slice(0,200);
  const category=p.get('category')??'';
  const content=p.get('content')??'';
  const page=Math.max(1,Math.min(10000,Number(p.get('page'))||1));
  const take=Math.max(1,Math.min(60,Number(p.get('limit'))||24));
  const where={
    ...(q?{searchText:{contains:q}}:{}),
    ...(category in CATEGORIES?{category}:{}),
    ...(CONTENT_TYPES.includes(content as typeof CONTENT_TYPES[number])?{content_type:content}:{}),
    ...(p.get('hideSpoilers')==='true'?{spoiler:false}:{}),
    ...(p.get('review')==='true'?{verification_status:'needs_review'}:{}),
    ...(p.get('subtype')?{subtype:p.get('subtype')!}:{}),
  };
  const [entries,total] = await Promise.all([db.entry.findMany({where,orderBy:[{translationPending:'asc'},{nameKo:'asc'}],skip:(page-1)*take,take}),db.entry.count({where})]);
  return NextResponse.json({entries:entries.map(view),total,page,pages:Math.ceil(total/take)});
}
