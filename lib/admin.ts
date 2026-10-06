import { NextRequest } from 'next/server';
// Personal desktop server. Writes are limited to loopback hosts and same-origin requests.
export function assertLocalWrite(req: NextRequest) {
  const host = req.headers.get('host')??'';
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)) throw new Error('관리자 쓰기는 로컬 PC에서만 허용됩니다.');
  const origin=req.headers.get('origin');
  if (!origin || new URL(origin).host !== host) throw new Error('동일 출처 요청만 허용됩니다.');
  const site=req.headers.get('sec-fetch-site');
  if (site && site!=='same-origin' && site!=='none') throw new Error('외부 사이트의 요청을 거부했습니다.');
}
