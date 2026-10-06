import { test,expect } from '@playwright/test';
const origin={'Origin':'http://127.0.0.1:3000'};
test('home, bilingual search, autocomplete, DLC filtering and links',async({page,request})=>{
 await page.goto('/');await expect(page.getByRole('heading',{name:'ELDEN RING ARCHIVE'})).toBeVisible();
 await page.getByRole('combobox',{name:'통합 검색'}).fill('Moonveil');
 await expect(page.getByRole('option').filter({hasText:'명도 월은'})).toBeVisible();
 await page.getByRole('option').filter({hasText:'명도 월은'}).click();
 await expect(page.getByRole('heading',{name:'명도 월은',exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'게르 갱도',exact:false}).first()).toBeVisible();
 const ko=await (await request.get('/api/entries?q=말레니아')).json();const en=await (await request.get('/api/entries?q=Malenia')).json();
 expect(ko.entries.some((e:{id:string})=>en.entries.some((x:{id:string})=>x.id===e.id))).toBeTruthy();
 const dlc=await(await request.get('/api/entries?content=shadow_of_the_erdtree')).json();expect(dlc.total).toBeGreaterThan(60);expect(dlc.entries.every((e:{content_type:string})=>e.content_type==='shadow_of_the_erdtree')).toBeTruthy();
 await page.goto('/search?q=Moonveil');await expect(page.getByRole('heading',{name:'명도 월은',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Shadow of the Erdtree',exact:true}).click();await expect(page.getByRole('heading',{name:'검색 결과가 없습니다'})).toBeVisible();
});
test('favorites, checks and notes persist across reload',async({page})=>{
 await page.goto('/entry/weapons-moonveil');await page.getByRole('button',{name:'즐겨찾기 추가',exact:true}).click();await page.getByRole('button',{name:'플레이 체크',exact:true}).click();
 await page.getByRole('textbox',{name:'나의 메모'}).fill('테스트: 지력 빌드 준비');await page.reload();
 await expect(page.getByRole('button',{name:'즐겨찾기 해제',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'완료',exact:true})).toBeVisible();await expect(page.getByRole('textbox',{name:'나의 메모'})).toHaveValue('테스트: 지력 빌드 준비');
 await page.goto('/favorites');await expect(page.getByRole('heading',{name:'명도 월은',exact:true})).toBeVisible();
});
test('spoiler titles and quest endings require reveal',async({page})=>{
 await page.goto('/entry/bosses-malenia-blade-of-miquella');await expect(page.getByRole('heading',{name:'미켈라의 칼날 말레니아',exact:true})).toHaveCount(0);await expect(page.getByText('스포일러가 숨겨져 있습니다')).toBeVisible();
 await page.getByRole('button',{name:'이 정보만 보기',exact:false}).click();await expect(page.getByRole('heading',{name:'미켈라의 칼날 말레니아',exact:true})).toBeVisible();
 await page.goto('/entry/bosses-maliketh-the-black-blade');await expect(page.getByRole('heading',{name:'흑검 말리케스',exact:true})).toHaveCount(0);
 await page.goto('/entry/quests-ranni-quest');await expect(page.getByRole('heading',{name:'월광의 제단에서 마지막으로 만납니다.'})).toHaveCount(0);
 await page.getByRole('switch',{name:'스포일러 숨김'}).click();await expect(page.getByRole('heading',{name:'월광의 제단에서 마지막으로 만납니다.'})).toBeVisible();
 await page.getByRole('button',{name:'단계 완료',exact:true}).first().click();await page.reload();await expect(page.getByRole('button',{name:'완료',exact:true})).toHaveCount(1);
});
test('admin CRUD, connected relations and scope exclusion',async({page,request})=>{
 const id='items-e2e-review-note',target='weapons-moonveil';
 const payload={id,nameKo:'검증용 기록',nameEn:'E2E Review Note',category:'items',content_type:'base_game',sources:[],relations:[{toId:target,label:'테스트 연결'}]};
 try{
  const blocked=await request.post('/api/admin',{data:{...payload,nameEn:'ELDEN RING NIGHTREIGN'},headers:origin});expect(blocked.status()).toBe(400);
  const unknown=await request.post('/api/admin',{data:{...payload,content_type:'third_game'},headers:origin});expect(unknown.status()).toBe(400);
  const cross=await request.post('/api/admin',{data:payload,headers:{Origin:'https://example.com'}});expect(cross.status()).toBe(403);
  const created=await request.post('/api/admin',{data:payload,headers:origin});expect(created.status()).toBe(200);
  await page.goto(`/admin?id=${id}`);await expect(page.getByRole('textbox',{name:'한국어 이름',exact:true})).toHaveValue('검증용 기록');
  await page.getByRole('textbox',{name:'한국어 이름',exact:true}).fill('수정된 검증 기록');await page.getByRole('button',{name:'SQLite에 저장'}).click();await expect(page.getByRole('status')).toContainText('저장했습니다');
  await page.goto(`/entry/${id}`);await expect(page.getByRole('heading',{name:'수정된 검증 기록',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'명도 월은',exact:false}).first()).toBeVisible();
  const deleted=await request.delete(`/api/admin?id=${id}`,{headers:origin});expect(deleted.status()).toBe(200);expect((await request.get(`/api/admin?id=${id}`)).status()).toBe(404);
 }finally{await request.delete(`/api/admin?id=${id}`,{headers:origin});}
});
test('mobile navigation, detail tables and search have no horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const path of ['/','/search?q=Moonveil','/entry/weapons-moonveil','/checklist','/admin']){
  await page.goto(path);await expect(page.locator('main')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 }
 await page.getByRole('button',{name:'메뉴 열기'}).click();await expect(page.getByRole('link',{name:'아카이브 홈'})).toBeVisible();await page.getByRole('link',{name:'아카이브 홈'}).click();await expect(page.getByRole('heading',{name:'ELDEN RING ARCHIVE'})).toBeVisible();
});
test('saved build survives reload',async({page})=>{
 await page.goto('/builds');await page.getByRole('textbox',{name:'빌드 이름'}).fill('Lv.150 월은');await page.getByRole('button',{name:'빌드 저장'}).click();await page.reload();await expect(page.getByRole('button',{name:'Lv.150 월은 Lv. 150'})).toBeVisible();
});
