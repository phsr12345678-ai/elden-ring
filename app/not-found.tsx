import Link from 'next/link';
export default function NotFound(){return <div className="content-page empty-state"><span className="eyebrow">404 / LOST GRACE</span><h1>이 기록을 찾을 수 없습니다</h1><p>문서가 삭제되었거나 주소가 변경되었습니다.</p><Link className="button" href="/search">전체 문서로 돌아가기</Link></div>;}
