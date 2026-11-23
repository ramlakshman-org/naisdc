import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';

// Exercise the actual route handlers and SQL against an isolated PostgreSQL
// engine. Only the Neon transport and Next cookie context are substituted.
const require=createRequire(import.meta.url);
const root=fileURLToPath(new URL('..',import.meta.url));
const database=new PGlite();
await database.exec(readFileSync(resolve(root,'schema.sql'),'utf8'));
const environment={DATABASE_URL:'postgresql://test-only',ADMIN_PASSWORD:'test-password-only-123',SESSION_SECRET:'test-session-secret-32-characters-long'};
let adminCookie;
const cache=new Map();
async function sql(strings,...values){
 const query=strings.reduce((text,part,index)=>text+(index?`$${index}`:'')+part,'');
 return (await database.query(query,values)).rows;
}
function load(relative){
 const file=resolve(root,relative);
 if(cache.has(file))return cache.get(file).exports;
 if(file.endsWith('.json'))return JSON.parse(readFileSync(file,'utf8'));
 const module={exports:{}};cache.set(file,module);
 const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
 const customRequire=id=>{
  if(id==='server-only')return {};
  if(id==='@neondatabase/serverless')return {neon:()=>sql};
  if(id==='next/headers')return {cookies:async()=>({get:()=>adminCookie?{value:adminCookie}:undefined})};
  if(id.startsWith('@/'))return load(id.slice(2)+(id.endsWith('.json')?'':'.ts'));
  return require(id);
 };
 runInNewContext(source,{module,exports:module.exports,require:customRequire,process:{env:environment},Buffer,console,Date,Response},{filename:file});
 return module.exports;
}
const {NextRequest}=require('next/server');
async function request(route,{method='POST',token,body}={}){
 const req=new NextRequest(`http://localhost/api/${route}`,{method,headers:{...(token?{authorization:`Bearer ${token}`} : {}),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 return load(`app/api/${route.split('?')[0]}/route.ts`)[method](req);
}
async function start(mobile,name='Test Student'){
 const res=await request('start',{body:{name,mobile,accepted:true}});assert.equal(res.status,201);return (await res.json()).token;
}
async function answer(token,id,choice){return request('answer',{token,body:{id,choice}});}
async function row(mobile){return (await database.query('SELECT * FROM attempts WHERE mobile=$1',[mobile])).rows[0];}
const key=JSON.parse(readFileSync(resolve(root,'data/answers.json'),'utf8'));
try{
 for(const body of [{name:'A',mobile:'1234567890',accepted:true},{name:'Student',mobile:'12345',accepted:true},{name:'Student',mobile:'1234567890',accepted:false}])assert.equal((await request('start',{body})).status,400);
 assert.equal((await request('session',{method:'GET',token:'a'.repeat(64)})).status,401);
 const token=await start('0123456789');
 const session=await (await request('session',{method:'GET',token})).json();
 assert.equal(session.questions.length,60);assert.equal(Object.keys(session).includes('answerKey'),false);
 assert.equal(new Date(session.expiresAt)-new Date(session.startedAt),3600000);
 assert.equal((await answer(token,0,0)).status,400);assert.equal((await answer(token,1,4)).status,400);
 assert.equal((await request('lock',{body:{id:1}})).status,401);
 assert.equal((await request('lock',{token,body:{id:61}})).status,400);
 // Editing is allowed before Next; locking survives a new session request.
 await answer(token,1,(key[1]+1)%4);assert.equal((await answer(token,1,key[1])).status,200);
 assert.equal((await request('lock',{token,body:{id:1}})).status,200);
 assert.equal((await request('lock',{token,body:{id:1}})).status,200);
 assert.equal((await answer(token,1,(key[1]+1)%4)).status,409);
 const lockedSession=await (await request('session',{method:'GET',token})).json();
 assert.equal(lockedSession.lockedAnswers['1'],true);assert.equal(lockedSession.answers['1'],key[1]);
 // Next on an unanswered question does not lock it.
 await request('lock',{token,body:{id:2}});
 for(let id=2;id<=60;id++)assert.equal((await answer(token,id,id<=50?key[id]:0)).status,200);
 const saved=await (await request('session',{method:'GET',token})).json();assert.equal(Object.keys(saved.answers).length,60);
 assert.equal((await request('submit',{token})).status,200);
 const perfect=await row('0123456789');assert.equal(perfect.total_score,50);assert.deepEqual(perfect.scores,{A:10,B:10,C:10,D:10,E:10});assert.ok(perfect.completed_at);
 assert.equal((await answer(token,1,(key[1]+1)%4)).status,409);
 assert.equal((await request('submit',{token})).status,200);
 assert.equal((await request('start',{body:{name:'Duplicate',mobile:'0123456789',accepted:true}})).status,409);
 const partial=await start('1234567890');await answer(partial,1,key[1]);await answer(partial,11,key[11]);await answer(partial,21,(key[21]+1)%4);await answer(partial,51,0);
 await request('submit',{token:partial});const scored=await row('1234567890');assert.equal(scored.total_score,2);assert.deepEqual(scored.scores,{A:1,B:1,C:0,D:0,E:0});
 const expired=await start('2345678901');await answer(expired,31,key[31]);
 await database.query("UPDATE attempts SET started_at=now()-interval '61 minutes' WHERE mobile=$1",['2345678901']);
 assert.equal((await answer(expired,32,key[32])).status,409);
 assert.equal((await request('lock',{token:expired,body:{id:31}})).status,409);
 const expiredSession=await (await request('session',{method:'GET',token:expired})).json();assert.equal(expiredSession.completed,true);assert.equal((await row('2345678901')).total_score,1);
 const abandoned=await start('3456789012');await answer(abandoned,41,key[41]);
 await database.query("UPDATE attempts SET started_at=now()-interval '61 minutes' WHERE mobile=$1",['3456789012']);
 assert.equal((await request('admin/results',{method:'GET'})).status,401);assert.equal((await request('admin/export',{method:'GET'})).status,401);
 assert.equal((await request('admin/details?id=1',{method:'GET'})).status,401);
 assert.equal((await request('admin/login',{body:{password:'wrong'}})).status,401);
 const login=await request('admin/login',{body:{password:environment.ADMIN_PASSWORD}});assert.equal(login.status,200);assert.match(login.headers.get('set-cookie'),/HttpOnly/i);
 adminCookie=login.cookies.get('intern_admin').value;
 const results=await (await request('admin/results',{method:'GET'})).json();assert.equal(results.rows.length,4);assert.equal((await row('3456789012')).total_score,1);assert.ok((await row('3456789012')).completed_at);
 await start('4567890123','=HYPERLINK("bad")');
 const exportResponse=await request('admin/export',{method:'GET'});assert.equal(exportResponse.status,200);const csv=await exportResponse.text();assert.match(csv,/Completion|Status/);assert.match(csv,/Computer \/ 10/);assert.match(csv,/"Completed"/);assert.match(csv,/"In progress"/);assert.match(csv,/'=HYPERLINK/);
 assert.match(csv,/,"\d{4}-\d{2}-\d{2}T[^"\r\n]+Z"/,'CSV timestamps should be plain ISO dates without embedded quotation marks');
 const empty=await start('5678901234');await request('submit',{token:empty});assert.equal((await row('5678901234')).total_score,0);
 const perfectReview=await (await request(`admin/details?id=${perfect.id}`,{method:'GET'})).json();
 assert.equal(perfectReview.questions.length,60);assert.equal(perfectReview.questions.filter(q=>q.result==='correct').length,50);
 assert.equal(perfectReview.questions.filter(q=>q.result==='unscored').length,10);
 for(const q of perfectReview.questions){assert.equal(q.selectedChoice,q.id<=50?key[q.id]:0);assert.equal(q.correctChoice,q.id<=50?key[q.id]:null);assert.ok(q.options[q.selectedChoice]);}
 assert.equal('token_hash' in perfectReview.student,false);
 const partialReview=await (await request(`admin/details?id=${scored.id}`,{method:'GET'})).json();
 assert.equal(partialReview.questions[0].result,'correct');assert.equal(partialReview.questions[20].result,'incorrect');
 assert.equal(partialReview.questions[20].correctChoice,key[21]);assert.equal(partialReview.questions[1].result,'unanswered');
 assert.equal(partialReview.questions[1].selectedChoice,null);assert.equal(partialReview.questions[50].result,'unscored');
 assert.equal((await request('admin/details?id=invalid',{method:'GET'})).status,400);
 assert.equal((await request('admin/details?id=999999',{method:'GET'})).status,404);
 assert.equal((await request(`admin/details?id=${(await row('4567890123')).id}`,{method:'GET'})).status,409);
 adminCookie=adminCookie.slice(0,-1)+(adminCookie.endsWith('0')?'1':'0');assert.equal((await request('admin/results',{method:'GET'})).status,401);
 console.log('PASS: registration, 60 saved answers, persisted answer locks, scoring, expiry, duplicate prevention, admin authentication, detailed correct/incorrect/unanswered/unscored reviews, CSV and cookie tampering.');
}finally{await database.close();}
