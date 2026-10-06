import { notFound } from 'next/navigation';
import { db,view } from '@/lib/db';
import {assetForUrl,assets} from '@/lib/assets';
import { Detail } from '@/components/detail';
export const dynamic='force-dynamic';
export default async function EntryPage({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 const e=await db.entry.findUnique({where:{id},include:{outgoing:{include:{to:true}},incoming:{include:{from:true}},sources:true,questSteps:{orderBy:{position:'asc'}},upgrades:{orderBy:{level:'asc'}}}});
 if(!e)notFound();
 const related=[...e.outgoing.map(r=>({...view(r.to),label:r.label,direction:'outgoing'})),...e.incoming.map(r=>({...view(r.from),label:r.label,direction:'incoming'}))];
 return <Detail locationImages={assets.filter(a=>Array.isArray(view(e).details.locationPictures)&&(view(e).details.locationPictures as string[]).includes(a.id)).map(a=>({id:a.id,nameKo:a.nameKo??e.nameKo,source:a.source}))} assetId={assetForUrl(e.imageUrl)?.id} entry={view(e)} related={related} sources={e.sources.map(s=>({...s,checkedAt:s.checkedAt?.toISOString()??null}))} steps={e.questSteps.map(s=>({...s,requiredItems:JSON.parse(s.requiredItems)}))} upgrades={e.upgrades.map(u=>({...u,attack:JSON.parse(u.attack),scaling:JSON.parse(u.scaling)}))}/>;
}
