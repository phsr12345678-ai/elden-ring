import type { Metadata } from 'next';
import './globals.css';
import { Shell } from '@/components/shell';
export const metadata:Metadata={title:{default:'ELDEN RING ARCHIVE · 개인 위키',template:'%s · ELDEN RING ARCHIVE'},description:'본편과 Shadow of the Erdtree를 위한 한국어 개인 데이터베이스와 플레이 도우미'};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ko"><body><Shell>{children}</Shell></body></html>;
}
