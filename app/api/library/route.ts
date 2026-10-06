import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(){const entries=await db.entry.findMany({select:{id:true,nameKo:true,nameEn:true,category:true,subtype:true,content_type:true,verification_status:true,acquisition:true,summary:true,tags:true,spoiler:true,translationPending:true},orderBy:{nameKo:'asc'}});return NextResponse.json({entries:entries.map(e=>({...e,tags:JSON.parse(e.tags),aliases:[],details:{}}))});}
