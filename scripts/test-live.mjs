import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base='http://127.0.0.1:3000';
const key=JSON.parse(readFileSync(new URL('../data/answers.json',import.meta.url)));
const mobile=String(Date.now()).slice(-10);
const name=`QA End-to-end ${mobile}`;
let cookie='';
async function api(path,{method='GET',body,token,admin=false}={}){
 const response=await fetch(`${base}/api/${path}`,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{authorization:`Bearer ${token}`} :{}),...(admin?{cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
 return {status:response.status,response,data:response.headers.get('content-type')?.includes('json')?await response.json():await response.text()};
}
assert.equal((await fetch(base)).status,200);
for(const path of ['/test','/admin','/complete'])assert.equal((await fetch(base+path)).status,200);
assert.equal((await api('admin/results')).status,401);assert.equal((await api('admin/export')).status,401);
assert.equal((await api('submit',{method:'POST'})).status,401);
assert.equal((await api('start',{method:'POST',body:{name,mobile:'123',accepted:true}})).status,400);
assert.equal((await api('start',{method:'POST',body:{name,mobile,accepted:false}})).status,400);
const start=await api('start',{method:'POST',body:{name,mobile,accepted:true}});assert.equal(start.status,201);
const token=start.data.token;
const session=await api('session',{token});assert.equal(session.status,200);assert.equal(session.data.questions.length,60);assert.equal(session.data.completed,false);
assert.equal(new Date(session.data.expiresAt)-new Date(session.data.startedAt),3600000);
assert.equal((await api('answer',{method:'POST',token,body:{id:1,choice:9}})).status,400);
for(let id=1;id<=60;id++){
 const choice=id<=50?key[id]:0;
 if(id===1){
  assert.equal((await api('answer',{method:'POST',token,body:{id,choice:(choice+1)%4}})).status,200);
 }
 assert.equal((await api('answer',{method:'POST',token,body:{id,choice}})).status,200);
 if(id<60){
  assert.equal((await api('lock',{method:'POST',token,body:{id}})).status,200);
  assert.equal((await api('answer',{method:'POST',token,body:{id,choice:(choice+1)%4}})).status,409);
 }
}
const resumed=await api('session',{token});assert.equal(Object.keys(resumed.data.answers).length,60);assert.equal(Object.keys(resumed.data.lockedAnswers).length,59);assert.equal(resumed.data.startedAt,session.data.startedAt);
assert.equal((await api('submit',{method:'POST',token})).status,200);
assert.equal((await api('submit',{method:'POST',token})).status,200);
assert.equal((await api('answer',{method:'POST',token,body:{id:60,choice:1}})).status,409);
assert.equal((await api('start',{method:'POST',body:{name,mobile,accepted:true}})).status,409);
assert.equal((await api('admin/login',{method:'POST',body:{password:'wrong'}})).status,401);
const login=await api('admin/login',{method:'POST',body:{password:'local-admin-123'}});assert.equal(login.status,200);
cookie=login.response.headers.get('set-cookie').split(';')[0];
const results=await api('admin/results',{admin:true});assert.equal(results.status,200);
const result=results.data.rows.find(row=>row.mobile===mobile);assert.ok(result.completed_at);assert.equal(result.total_score,50);assert.deepEqual(result.scores,{A:10,B:10,C:10,D:10,E:10});
const review=await api(`admin/details?id=${result.id}`,{admin:true});assert.equal(review.status,200);assert.equal(review.data.questions.length,60);assert.equal(review.data.questions.filter(q=>q.result==='correct').length,50);assert.equal(review.data.questions.filter(q=>q.result==='unscored').length,10);
const exported=await api('admin/export',{admin:true});assert.equal(exported.status,200);assert.match(exported.response.headers.get('content-disposition'),/\.csv/);assert.ok(exported.data.includes(name));assert.ok(exported.data.includes('"Completed","50","10","10","10","10","10"'));
const logout=await api('admin/logout',{method:'POST',admin:true});assert.equal(logout.status,200);assert.match(logout.response.headers.get('set-cookie'),/Max-Age=0/);
console.log(JSON.stringify({passed:true,name,mobile,answers:60,lockedAnswers:59,total:result.total_score,categories:result.scores,checks:['all pages','invalid inputs','server timer','answer save','edit before Next','locks after Next','resume','submit','repeat submit','duplicate blocking','admin auth','results','CSV','logout']},null,2));
