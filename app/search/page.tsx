import { Browser } from '@/components/browser';
export default async function Search({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const p=await searchParams;return <Browser initialQuery={p.q} initialContent={p.content} initialCategory={p.category} initialReview={p.review==='true'}/>;}
