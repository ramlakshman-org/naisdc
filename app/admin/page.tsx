'use client';
import {useEffect,useState} from 'react';
type Item={id:number;name:string;mobile:string;completed_at:string|null;total_score:number|null;scores:Record<string,number>|null};
type Review={student:{id:number;name:string;mobile:string;total_score:number};questions:{id:number;text:string;options:string[];sectionName:string;selectedChoice:number|null;correctChoice:number|null;result:'correct'|'incorrect'|'unanswered'|'unscored'}[]};
function answerText(options:string[],choice:number|null){return choice===null?'Not answered':`${String.fromCharCode(65+choice)}. ${options[choice]}`;}
const categories={A:'Computer',B:'Internet',C:'Frontend',D:'Backend',E:'AI'};
export default function Admin(){
 const [password,setPassword]=useState('');const [signedIn,setSignedIn]=useState(false);
 const [busy,setBusy]=useState(true);const [error,setError]=useState('');const [rows,setRows]=useState<Item[]>([]);
 const [review,setReview]=useState<Review|null>(null);
 async function load(){
  setError('');const res=await fetch('/api/admin/results',{cache:'no-store'});
  if(res.status===401){setSignedIn(false);setRows([]);setReview(null);return;}
  const data=await res.json();if(!res.ok)throw new Error(data.error||'Unable to load results.');
  setRows(data.rows);setSignedIn(true);
 }
 useEffect(()=>{void load().catch(e=>setError(e.message)).finally(()=>setBusy(false));},[]);
 async function signIn(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError('');
  try{
   const res=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
   const data=await res.json();if(!res.ok)throw new Error(data.error||'Unable to sign in.');
   setPassword('');await load();
  }catch(e){setError(e instanceof Error?e.message:'Unable to sign in.');}finally{setBusy(false);}
 }
 async function logout(){
  setBusy(true);setError('');
  try{const res=await fetch('/api/admin/logout',{method:'POST'});if(!res.ok)throw new Error('Unable to sign out. Please retry.');setSignedIn(false);setRows([]);setReview(null);}
  catch(e){setError(e instanceof Error?e.message:'Unable to sign out.');}finally{setBusy(false);}
 }
 async function showAnswers(id:number){
  setBusy(true);setError('');
  try{
   const response=await fetch(`/api/admin/details?id=${id}`,{cache:'no-store'});
   if(response.status===401){setSignedIn(false);setRows([]);setReview(null);return;}
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Unable to load answers.');
   setReview(data);window.scrollTo(0,0);
  }catch(e){setError(e instanceof Error?e.message:'Unable to load answers.');}finally{setBusy(false);}
 }
 if(!signedIn)return <main className="center"><section className="panel narrow">
  <h1>Admin login</h1><form className="form" onSubmit={signIn}>
   <label>Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
   {error&&<p className="error" role="alert">{error}</p>}
   <button className="primary" disabled={busy}>{busy?'Please wait…':'Sign in'}</button>
  </form><a className="return" href="/">Student registration</a>
 </section></main>;
 if(review)return <main className="admin-page answer-review">
  <header className="top"><h1>Student answers</h1><button className="secondary" onClick={()=>setReview(null)}>Back to results</button></header>
  <section className="panel review-summary"><h2>{review.student.name}</h2><p>{review.student.mobile} · Total score: {review.student.total_score}/50</p><p>Questions 1–50 are scored. Questions 51–60 are learning-readiness responses and are unscored.</p></section>
  <div className="answer-list">{review.questions.map(question=><article className="panel review-question" key={question.id}>
   <p className="review-category">Question {question.id} · {question.sectionName}</p>
   <h2>{question.text}</h2>
   <p className={`review-result ${question.result}`}>{question.result==='correct'?'Correct':question.result==='incorrect'?'Incorrect':question.result==='unanswered'?'Unanswered':'Unscored'}</p>
   <dl><dt>Student’s answer</dt><dd>{answerText(question.options,question.selectedChoice)}</dd>
   {question.correctChoice!==null&&<><dt>Correct answer</dt><dd>{answerText(question.options,question.correctChoice)}</dd></>}</dl>
  </article>)}</div>
 </main>;
 return <main className="admin-page"><header className="top"><h1>Assessment results</h1><button className="secondary" disabled={busy} onClick={()=>void logout()}>Sign out</button></header>
  <section className="results-panel">
   <div className="result-heading"><p>{rows.length} students · {rows.filter(r=>r.completed_at).length} completed</p><div className="result-controls">
    <button className="secondary" disabled={busy} onClick={()=>{setBusy(true);void load().catch(e=>setError(e.message)).finally(()=>setBusy(false));}}>Refresh</button>
    <a className="primary" href="/api/admin/export">Download CSV</a>
   </div></div>
   {error&&<p className="error" role="alert">{error}</p>}
   <div className="table-scroll" tabIndex={0} role="region" aria-label="Student results; scroll horizontally to see all categories"><table>
    <thead><tr><th scope="col">Student name</th><th scope="col">Mobile number</th><th scope="col">Total / 50</th>{Object.entries(categories).map(([key,label])=><th scope="col" key={key}>{label} / 10</th>)}<th scope="col">Completion status</th><th scope="col">Answers</th></tr></thead>
    <tbody>{rows.map(row=><tr key={row.id}><td>{row.name}</td><td>{row.mobile}</td><td>{row.total_score??'—'}</td>{Object.keys(categories).map(key=><td key={key}>{row.scores?.[key]??'—'}</td>)}<td>{row.completed_at?'Completed':'In progress'}</td><td>{row.completed_at?<button className="secondary" disabled={busy} onClick={()=>void showAnswers(row.id)} aria-label={`View answers for ${row.name}`}>View answers</button>:'Available after submission'}</td></tr>)}</tbody>
   </table></div>{!rows.length&&<p className="empty">No assessments yet.</p>}
  </section>
 </main>;
}
