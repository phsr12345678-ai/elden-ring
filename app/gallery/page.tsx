import fs from 'node:fs';import path from 'node:path';import {assets} from '@/lib/assets';import {Gallery} from '@/components/gallery';
export const dynamic='force-dynamic';
export default function GalleryPage(){return <Gallery images={assets.filter(a=>fs.existsSync(path.resolve('data/assets-cache',a.id)))}/>;}
