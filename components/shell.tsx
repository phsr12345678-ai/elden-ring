'use client';
import Link from 'next/link';
import { usePathname,useRouter } from 'next/navigation';
import { useEffect,useRef,useState } from 'react';
import { ArrowUpRight,BookOpen,Search,Star,CheckSquare,Compass,SlidersHorizontal,EyeOff,Eye,Menu,X,Settings,ChevronRight,Swords,MapPin,Skull,Sparkles,Layers,Download } from 'lucide-react';
import { CATEGORIES,GROUPS,type EntryView } from '@/lib/catalog';
import { ProfileProvider,useProfile } from './storage';
export function Shell({children}:{children:React.ReactNode}){return <ProfileProvider><Frame>{children}</Frame></ProfileProvider>;}
export function Crest({small=false}:{small?:boolean}) {
  return <svg viewBox="0 0 80 100" width={small?27:70} height={small?34:88} fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="1.5"><circle cx="40" cy="37" r="22"/><circle cx="29" cy="55" r="22"/><circle cx="51" cy="55" r="22"/><path d="M40 4v86M19 18l21-9 21 9M13 78l27 11 27-11M40 89v8M20 39h40"/></g></svg>;
}
function Frame({children}:{children:React.ReactNode}) {
  const path=usePathname(),[mobile,setMobile]=useState(false);
  const {profile,setSpoilers,storageError}=useProfile();
  useEffect(()=>setMobile(false),[path]);
  return <div className="app-shell">
    {mobile&&<button className="nav-backdrop" aria-label="메뉴 닫기" onClick={()=>setMobile(false)}/>}
    <aside className={`sidebar ${mobile?'open':''}`}>
      <Link href="/" className="brand"><Crest small/><span>ELDEN RING<small>PERSONAL ARCHIVE</small></span></Link>
      <div className="sidebar-caption">THE LANDS BETWEEN</div>
      <nav aria-label="주 메뉴">
        <Link href="/" className={`nav-item ${path==='/'?'active':''}`}><Compass size={17}/> 아카이브 홈 <ChevronRight size={13}/></Link>
        <Link href="/search" className={`nav-item ${path==='/search'?'active':''}`}><Search size={17}/> 전체 문서</Link>
        {GROUPS.map(group=><div className="nav-group" key={group.name}><div className="nav-label">{group.name}</div>{group.categories.map(cat=><Link key={cat} href={cat==='maps'?'/map':`/browse/${cat}`} className={`nav-item ${path===`/browse/${cat}`?'active':''}`}><NavIcon category={cat}/>{CATEGORIES[cat]}</Link>)}</div>)}
        <Link href="/gallery" className={`nav-item ${path==='/gallery'?'active':''}`}><Layers size={16}/>그림 보관함</Link><div className="nav-group"><div className="nav-label">나의 여정</div><Link href="/favorites" className={`nav-item ${path==='/favorites'?'active':''}`}><Star size={16}/>내 즐겨찾기<span className="nav-count">{profile.favorites.length}</span></Link><Link href="/checklist" className="nav-item"><CheckSquare size={16}/>플레이 체크리스트</Link><Link href="/builds" className="nav-item"><SlidersHorizontal size={16}/>빌드 노트</Link></div>
      </nav>
      <div className="sidebar-bottom"><Link href="/admin"><Settings size={15}/> 데이터 편집 <ArrowUpRight size={12}/></Link><span>본편 + SHADOW OF THE ERDTREE</span><small>개인용 비공식 아카이브</small></div>
    </aside>
    <div className="main-shell"><header className="topbar"><button className="icon-button mobile-menu" aria-label="메뉴 열기" onClick={()=>setMobile(!mobile)}>{mobile?<X size={21}/>:<Menu size={21}/>}</button><span className="topbar-breadcrumb">나만의 기록 <span>/</span> {path==='/'?'아카이브':path.startsWith('/entry')?'문서':path==='/admin'?'데이터 편집':'탐색'}</span><div className="topbar-actions"><button className={`spoiler-toggle ${profile.hideSpoilers?'enabled':''}`} role="switch" aria-checked={profile.hideSpoilers} onClick={()=>setSpoilers(!profile.hideSpoilers)}>{profile.hideSpoilers?<EyeOff size={15}/>:<Eye size={15}/>}<span>스포일러 숨김</span><i/></button><Link href="/favorites" className="icon-button" aria-label="즐겨찾기"><Star size={18}/></Link><span className="avatar">T</span></div></header>
    {storageError&&<p className="storage-error" role="alert">{storageError}</p>}<main>{children}</main><footer className="footer"><Crest small/><span>ELDEN RING ARCHIVE <small>빛바랜 자의 여정을 위한 개인 기록.</small></span><Link href="/about">데이터와 출처 안내 <ArrowUpRight size={13}/></Link></footer></div>
  </div>;
}
function NavIcon({category}:{category:string}) {
 const Icon=category==='bosses'?Skull:category==='locations'||category==='graces'?MapPin:category==='weapons'||category==='shields'?Swords:category==='sorceries'||category==='incantations'?Sparkles:category==='quests'?BookOpen:Layers;
 return <Icon size={15}/>;
}
export function SearchBox({large=false,defaultValue=''}:{large?:boolean;defaultValue?:string}) {
 const [q,setQ]=useState(defaultValue),[suggestions,setSuggestions]=useState<EntryView[]>([]),[open,setOpen]=useState(false),[index,setIndex]=useState(-1);
 const {profile}=useProfile(),router=useRouter(),ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const abort=new AbortController();const timer=setTimeout(()=>{if(!q.trim()){setSuggestions([]);return;}fetch(`/api/entries?q=${encodeURIComponent(q)}&limit=6&hideSpoilers=${profile.hideSpoilers}`,{signal:abort.signal}).then(r=>r.json()).then(d=>{setSuggestions(d.entries??[]);setIndex(-1);}).catch(()=>{});},180);return()=>{clearTimeout(timer);abort.abort();};},[q,profile.hideSpoilers]);
 useEffect(()=>{function outside(e:MouseEvent){if(!ref.current?.contains(e.target as Node))setOpen(false);}document.addEventListener('mousedown',outside);return()=>document.removeEventListener('mousedown',outside);},[]);
 function go(){setOpen(false);router.push(index>=0&&suggestions[index]?`/entry/${suggestions[index].id}`:`/search?q=${encodeURIComponent(q)}`);}
 return <div className={`search-box ${large?'large':''}`} ref={ref}><form onSubmit={e=>{e.preventDefault();go();}}><Search size={large?23:19}/><input aria-label="통합 검색" role="combobox" aria-autocomplete="list" aria-expanded={open&&suggestions.length>0} aria-controls="search-suggestions" aria-activedescendant={index>=0?`suggestion-${index}`:undefined} placeholder="무기, 보스, 지역… 무엇을 찾고 있나요?" value={q} onFocus={()=>setOpen(true)} onChange={e=>{setQ(e.target.value);setOpen(true);}} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);if(e.key==='ArrowDown'){e.preventDefault();setIndex(i=>Math.min(i+1,suggestions.length-1));}if(e.key==='ArrowUp'){e.preventDefault();setIndex(i=>Math.max(-1,i-1));}}}/><button type="submit" aria-label="검색 실행"><span>검색</span><ArrowUpRight size={17}/></button></form>{open&&suggestions.length>0&&<div className="suggestions" id="search-suggestions" role="listbox">{suggestions.map((e,i)=><Link id={`suggestion-${i}`} role="option" aria-selected={i===index} className={i===index?'selected':''} href={`/entry/${e.id}`} key={e.id} onClick={()=>setOpen(false)}><span>{e.nameKo}<small>{e.nameEn}</small></span><small>{CATEGORIES[e.category as keyof typeof CATEGORIES]} · {e.content_type==='base_game'?'본편':'DLC'}</small></Link>)}</div>}</div>;
}
