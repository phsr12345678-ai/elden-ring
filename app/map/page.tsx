import {assets} from '@/lib/assets';
import {db,view} from '@/lib/db';
import {MapView} from '@/components/map-view';
export const dynamic='force-dynamic';
export default async function MapPage(){const entries=await db.entry.findMany({orderBy:{nameKo:'asc'}});const documents=entries.map(row=>{const e=view(row);return {id:e.id,nameKo:e.nameKo,nameEn:e.nameEn,category:e.category,content_type:e.content_type,acquisition:e.acquisition,spoiler:e.spoiler,navigation:typeof e.details.navigation==='string'?e.details.navigation:undefined};});return <MapView documents={documents} mapAssets={assets.filter(a=>a.kind==='map')}/>;}
