'use client';
import Link from 'next/link';
import { ArrowUpRight,Star,CheckSquare } from 'lucide-react';
import { useProfile } from './storage';
export function JourneySummary(){const {profile}=useProfile();return <section className="journey-card"><span className="eyebrow">YOUR JOURNEY</span><h2>나의 여정</h2><p>하나씩 기록하는, 나만의 모험.</p><Link href="/favorites"><Star size={18}/><span>즐겨찾기</span><strong>{profile.favorites.length}</strong><ArrowUpRight size={14}/></Link><Link href="/checklist"><CheckSquare size={18}/><span>완료한 기록</span><strong>{profile.checked.length}</strong><ArrowUpRight size={14}/></Link><small>이 브라우저에 자동 저장됩니다.</small></section>;}
