'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="content-page empty-state"><h1>기록을 불러오지 못했습니다</h1><p>서버와 SQLite 상태를 확인하세요. 첫 실행이라면 npm run db:setup으로 DB를 준비합니다.</p><button className="button" onClick={reset}>다시 시도</button></div>;}
