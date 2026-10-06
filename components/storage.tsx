'use client';
import { createContext,useContext,useEffect,useState } from 'react';
type Profile={ favorites:string[]; checked:string[]; hideSpoilers:boolean; notes:Record<string,string> };
const initial:Profile={favorites:[],checked:[],hideSpoilers:true,notes:{}};
const key='elden-ring-archive:v1';
type Ctx={profile:Profile;ready:boolean;toggle:(type:'favorites'|'checked',id:string)=>void;setSpoilers:(hide:boolean)=>void;note:(id:string,value:string)=>void;replace:(p:Profile)=>void;storageError:string};
const Context=createContext<Ctx|null>(null);
export function ProfileProvider({children}:{children:React.ReactNode}) {
  const [profile,setProfile]=useState<Profile>(initial),[ready,setReady]=useState(false),[storageError,setStorageError]=useState('');
  useEffect(()=>{try {const raw=localStorage.getItem(key);if(raw){const p=JSON.parse(raw);if(Array.isArray(p.favorites)&&Array.isArray(p.checked)&&typeof p.hideSpoilers==='boolean')setProfile({...initial,...p});}}catch{setStorageError('브라우저 저장소를 읽을 수 없습니다. 이 세션의 변경은 새로고침 시 사라질 수 있습니다.');}setReady(true);},[]);
  useEffect(()=>{if(ready)try{localStorage.setItem(key,JSON.stringify(profile));}catch{setStorageError('저장 공간이 부족하거나 브라우저 저장이 차단되었습니다. 진행 데이터를 내보내세요.');}},[profile,ready]);
  function toggle(type:'favorites'|'checked',id:string){setProfile(p=>({...p,[type]:p[type].includes(id)?p[type].filter(x=>x!==id):[...p[type],id]}));}
  return <Context.Provider value={{profile,ready,toggle,setSpoilers:(hideSpoilers)=>setProfile(p=>({...p,hideSpoilers})),note:(id,value)=>setProfile(p=>({...p,notes:{...p.notes,[id]:value}})),replace:setProfile,storageError}}>{children}</Context.Provider>;
}
export function useProfile(){const ctx=useContext(Context);if(!ctx)throw new Error('Profile provider missing');return ctx;}
