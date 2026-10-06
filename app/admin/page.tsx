import { Suspense } from 'react';
import { AdminEditor } from '@/components/admin-editor';
export default function Admin(){return <Suspense fallback={<p className="content-page">편집기 준비 중…</p>}><AdminEditor/></Suspense>;}
