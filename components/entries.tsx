'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight,Star,Check,EyeOff,Swords,Skull,MapPin,UserRound,Gem,Sparkles,BookOpen } from 'lucide-react';
import { type EntryView,contentLabel,CATEGORIES } from '@/lib/catalog';
import { useProfile } from './storage';
export function EntryIcon({category,size=25}:{category:string;size?:number}) {const Icon=category==='weapons'||category==='shields'?Swords:category==='bosses'?Skull:category==='npcs'?UserRound:category==='locations'||category==='graces'?MapPin:category==='talismans'?Gem:category==='quests'?BookOpen:Sparkles;return <Icon size={size} strokeWidth={1.3}/>;}
export function Badge({content}:{content:string}) {return <span className={`badge ${content==='shadow_of_the_erdtree'?'dlc':''}`}>{contentLabel(content)}</span>;}
export function FavoriteButton({id}:{id:string}){const {profile,toggle,ready}=useProfile();const active=profile.favorites.includes(id);return <button disabled={!ready} aria-label={active?'즐겨찾기 해제':'즐겨찾기 추가'} aria-pressed={active} className={`icon-button favorite ${active?'saved':''}`} onClick={()=>toggle('favorites',id)}><Star size={18} fill={active?'currentColor':'none'}/></button>;}
export function CheckButton({id,label='플레이 체크'}:{id:string;label?:string}){const {profile,toggle,ready}=useProfile();const active=profile.checked.includes(id);return <button disabled={!ready} className={`check-button ${active?'checked':''}`} aria-pressed={active} onClick={()=>toggle('checked',id)}><span>{active&&<Check size={13}/>}</span>{active?'완료':label}</button>;}
export function SpoilerGuard({spoiler,children,compact=false}:{spoiler:boolean;children:React.ReactNode;compact?:boolean}) {
 const {profile}=useProfile();const [revealed,setRevealed]=useState(false);
 if(spoiler&&profile.hideSpoilers&&!revealed)return <div className={`spoiler-guard ${compact?'compact':''}`}><EyeOff size={compact?18:30}/><strong>스포일러가 숨겨져 있습니다</strong>{!compact&&<p>후반 지역, 퀘스트 결말 또는 주요 인물의 정보입니다.</p>}<button className="text-button" onClick={()=>setRevealed(true)}>이 정보만 보기 <ArrowUpRight size={14}/></button></div>;
 return <>{children}</>;
}
export function EntryCard({entry:e}:{entry:EntryView}) {
 return <article className="entry-card"><SpoilerGuard spoiler={e.spoiler} compact><div className="entry-card-top"><span className="entry-symbol"><EntryIcon category={e.category}/></span><Badge content={e.content_type}/><FavoriteButton id={e.id}/></div><Link href={`/entry/${e.id}`} className="entry-main-link"><small className="eyebrow">{CATEGORIES[e.category as keyof typeof CATEGORIES]} {e.subtype&&`/ ${e.subtype}`}</small><h3>{e.nameKo}</h3><p className="entry-english">{e.nameEn}</p><p className="entry-acquisition">{e.acquisition||e.summary||'상세 문서에서 데이터와 출처를 확인하세요.'}</p></Link><div className="entry-card-bottom"><span>{e.verification_status==='verified'?'검증 완료':'검토 필요'}{e.translationPending?' · 한국어명 미등록':''}</span><Link href={`/entry/${e.id}`} aria-label={`${e.nameKo} 상세 보기`}><ArrowUpRight size={18}/></Link></div></SpoilerGuard></article>;
}
