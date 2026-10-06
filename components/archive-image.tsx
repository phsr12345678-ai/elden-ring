'use client';
import {useState} from 'react';
export function ArchiveImage({assetId,name,source}:{assetId?:string;name:string;source?:string|null}){
 const [open,setOpen]=useState(false),[failed,setFailed]=useState(false);if(!assetId)return <div className="document-art-placeholder"><span>이미지 미등록</span></div>;
 const image=<img src={`/api/assets/${assetId}`} alt={name} loading="lazy" onError={()=>setFailed(true)}/>;
 return <div className="archive-image">{failed?<p>그림을 아직 내려받지 못했습니다. <code>npm run assets:fetch</code>로 다시 시도할 수 있습니다.</p>:<button aria-label={`${name} 이미지 확대`} onClick={()=>setOpen(true)}>{image}<span>그림 확대</span></button>}<a href={source??'#'} target="_blank" rel="noopener noreferrer">그림 출처</a>{open&&<div className="image-overlay" role="dialog" aria-modal="true" aria-label={`${name} 그림`} onClick={()=>setOpen(false)}><button autoFocus onClick={()=>setOpen(false)} onKeyDown={e=>{if(e.key==='Escape')setOpen(false);}}>닫기 ×</button>{image}</div>}</div>;
}
