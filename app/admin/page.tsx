'use client';
import {useEffect,useState} from 'react';
import Brand from '@/components/Brand';
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
 if(!signedIn)return <><header className="site-header"><Brand/><span className="header-note">Admin access</span></header><main className="admin-login"><section className="panel narrow">
  <h1>A place to review.</h1><p className="muted">Sign in to view student assessments and answers.</p><form className="form" onSubmit={signIn}>
   <label>Admin password<input type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
   {error&&<p className="error" role="alert">{error}</p>}
   <button className="primary" disabled={busy}>{busy?'Please wait…':'Sign in'}</button>
  </form><a className="return" href="/">Student registration</a>
 </section></main><footer className="site-footer">Intern Skill Assessment<span>For authorized coordinators.</span></footer></>;
 if(review)return <><header className="site-header"><Brand/><span className="header-note">Admin access</span></header><main className="admin-page answer-review">
  <button className="tertiary back-button" onClick={()=>setReview(null)}>Back to results</button>
  <section className="review-summary"><div><h1>{review.student.name}</h1><p className="muted">{review.student.mobile} · Student answers</p></div><div className="review-total"><strong>{review.student.total_score}</strong><span> / 50</span></div></section>
  <p className="review-explainer">Questions 1–50 are scored. Questions 51–60 are learning-readiness responses and are unscored.</p>
  <div className="answer-list">{review.questions.map(question=><article className="review-question" key={question.id}>
   <div className="review-question-heading"><p className="review-category">Question {question.id} · {question.sectionName}</p><p className={`review-result ${question.result}`}>{question.result==='correct'?'Correct':question.result==='incorrect'?'Incorrect':question.result==='unanswered'?'Unanswered':'Unscored'}</p></div>
   <h2>{question.text}</h2>
   <dl><div><dt>Student’s answer</dt><dd>{answerText(question.options,question.selectedChoice)}</dd></div>
   {question.correctChoice!==null&&<div><dt>Correct answer</dt><dd>{answerText(question.options,question.correctChoice)}</dd></div>}</dl>
  </article>)}</div>
 </main></>;
 return <><header className="site-header"><Brand/><div className="header-actions"><span className="header-note">Admin access</span><button className="tertiary" disabled={busy} onClick={()=>void logout()}>Sign out</button></div></header><main className="admin-page"><div className="dashboard-heading"><div><h1>Assessment results</h1><p className="muted">A clear view of every student’s starting point.</p></div><div className="result-controls">
  <button className="secondary" disabled={busy} onClick={()=>{setBusy(true);void load().catch(e=>setError(e.message)).finally(()=>setBusy(false));}}>Refresh</button>
  <a className="primary" href="/api/admin/export">Download CSV</a>
 </div></div>
 <div className="results-summary"><p><strong>{rows.length}</strong> students</p><p><strong>{rows.filter(r=>r.completed_at).length}</strong> completed</p><p><strong>{rows.filter(r=>!r.completed_at).length}</strong> in progress</p></div>
  <section className="results-panel">
   <div className="result-heading"><h2>All submissions</h2><span>Scores across five categories</span></div>
   {error&&<p className="error" role="alert">{error}</p>}
   <div className="table-scroll" tabIndex={0} role="region" aria-label="Student results; scroll horizontally to see all categories"><table>
    <thead><tr><th scope="col">Student name</th><th scope="col">Mobile number</th><th scope="col">Total / 50</th>{Object.entries(categories).map(([key,label])=><th scope="col" key={key}>{label} / 10</th>)}<th scope="col">Completion status</th><th scope="col">Answers</th></tr></thead>
    <tbody>{rows.map(row=><tr key={row.id}><td className="student-name">{row.name}</td><td className="mobile-cell">{row.mobile}</td><td className="total-cell">{row.total_score??'—'}</td>{Object.keys(categories).map(key=><td key={key}>{row.scores?.[key]??'—'}</td>)}<td><span className={row.completed_at?'completion-status completed':'completion-status pending'}>{row.completed_at?'Completed':'In progress'}</span></td><td>{row.completed_at?<button className="tertiary table-action" disabled={busy} onClick={()=>void showAnswers(row.id)} aria-label={`View answers for ${row.name}`}>View answers</button>:<span className="muted">Not submitted</span>}</td></tr>)}</tbody>
   </table></div>{!rows.length&&<p className="empty">No assessments yet.</p>}
  </section>
  <p className="table-hint">Swipe the table to view all scores and answers.</p>
 </main><footer className="site-footer">Intern Skill Assessment<span>Student results are private.</span></footer></>;
}
