'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import type {Question,AnswerMap} from '@/lib/questions';
type Session={name:string;expiresAt:string;serverNow:number;completed:boolean;answers:AnswerMap;lockedAnswers:Record<string,boolean>;questions:Question[]};
const pad=(n:number)=>String(n).padStart(2,'0');
export default function Test(){
 const router=useRouter();const [session,setSession]=useState<Session|null>(null);
 const [index,setIndex]=useState(0);const [answers,setAnswers]=useState<AnswerMap>({});
 const [lockedAnswers,setLockedAnswers]=useState<Record<string,boolean>>({});
 const [remaining,setRemaining]=useState(3600);const [error,setError]=useState('');
 const [saving,setSaving]=useState(false);const [submitting,setSubmitting]=useState(false);
 const [confirm,setConfirm]=useState(false);const [loading,setLoading]=useState(true);
 const pending=useRef<Promise<unknown>>(Promise.resolve());const submitted=useRef(false);
 const savingGuard=useRef(false);const token=useRef('');const deadline=useRef(0);
 const api=useCallback(async(path:string,options?:RequestInit)=>{
  const res=await fetch(path,{...options,cache:'no-store',headers:{Authorization:`Bearer ${token.current}`,...options?.headers}});
  const data=await res.json();if(!res.ok)throw new Error(data.error||'Request failed. Please retry.');return data;
 },[]);
 useEffect(()=>{
  let active=true;
  async function load(){
   try{
    token.current=localStorage.getItem('intern_attempt_token')||'';
    if(!token.current){router.replace('/');return;}
    const data:Session=await api('/api/session');if(!active)return;
    if(data.completed){router.replace('/complete');return;}
    const milliseconds=Math.max(0,new Date(data.expiresAt).getTime()-data.serverNow);
    deadline.current=performance.now()+milliseconds;
    setSession(data);setAnswers(data.answers||{});setLockedAnswers(data.lockedAnswers||{});setRemaining(Math.ceil(milliseconds/1000));
   }catch(e){if(active)setError(e instanceof Error?e.message:'Unable to load assessment.');}
   finally{if(active)setLoading(false);}
  }
  void load();return ()=>{active=false;};
 },[api,router]);
 const submit=useCallback(async()=>{
  if(submitted.current)return;
  submitted.current=true;setSubmitting(true);setError('');setConfirm(false);
  try{
   // A save rejected at the deadline must not prevent submitting saved answers.
   try{await pending.current;}catch(e){if(performance.now()<deadline.current)throw e;}
   await api('/api/submit',{method:'POST'});router.replace('/complete');
  }catch(e){submitted.current=false;setError(e instanceof Error?e.message:'Unable to submit. Please retry.');setSubmitting(false);}
 },[api,router]);
 useEffect(()=>{
  if(!session||submitting)return;
  const tick=()=>{const seconds=Math.max(0,Math.ceil((deadline.current-performance.now())/1000));setRemaining(seconds);if(seconds===0){clearInterval(timer);void submit();}};
  const timer=setInterval(tick,1000);
  // After a failed automatic submission, keep a visible manual retry button.
  if(deadline.current>performance.now())tick();else clearInterval(timer);
  return ()=>clearInterval(timer);
 },[session,submitting,submit]);
 async function choose(choice:number){
  if(!session||submitted.current||savingGuard.current||performance.now()>=deadline.current)return;
  const id=String(session.questions[index].id);if(lockedAnswers[id])return;savingGuard.current=true;setSaving(true);setError('');
  const task=api('/api/answer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:Number(id),choice})});
  pending.current=task;
  try{await task;setAnswers(previous=>({...previous,[id]:choice}));}
  catch(e){setError(e instanceof Error?e.message:'Could not save. Select your answer again to retry.');}
  finally{savingGuard.current=false;setSaving(false);pending.current=Promise.resolve();}
 }
 async function next(){
  if(!session||savingGuard.current||submitted.current||index===59)return;
  const id=String(session.questions[index].id);
  if(lockedAnswers[id]||answers[id]===undefined||remaining<=0){setIndex(i=>i+1);return;}
  savingGuard.current=true;setSaving(true);setError('');
  const task=api('/api/lock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:Number(id)})});
  pending.current=task;
  try{const data=await task;setLockedAnswers(data.lockedAnswers);setIndex(i=>i+1);}
  catch(e){setError(e instanceof Error?e.message:'Could not continue. Please retry Next.');}
  finally{savingGuard.current=false;setSaving(false);pending.current=Promise.resolve();}
 }
 if(loading)return <main className="center">Loading assessment…</main>;
 if(!session)return <main className="center"><section className="panel narrow"><h1>Unable to open assessment</h1><p className="error" role="alert">{error}</p><button className="secondary" onClick={()=>window.location.reload()}>Retry</button><a className="return" href="/">Return to registration</a></section></main>;
 const question=session.questions[index];const answered=Object.keys(answers).length;const disabled=saving||submitting;
 return <main className="assessment">
  <header className="assessment-header"><h1>Intern Skill Assessment</h1><strong className={remaining<300?'timer urgent':'timer'} aria-label="Time remaining">{pad(Math.floor(remaining/60))}:{pad(remaining%60)}</strong></header>
  <p className="testmeta"><span>{session.name}</span><span>{answered} of 60 answered</span></p>
  <section className="panel question-card" aria-busy={disabled}>
   <p>Question {index+1} of 60</p><h2>{question.text}</h2>
   <div className="choices" role="group" aria-label="Answer choices">{question.options.map((option,choice)=><button key={choice} disabled={disabled||remaining<=0||Boolean(lockedAnswers[String(question.id)])} aria-pressed={answers[String(question.id)]===choice} className={`choice ${answers[String(question.id)]===choice?'chosen':''}`} onClick={()=>void choose(choice)}><span className="letter">{String.fromCharCode(65+choice)}</span><span>{option}</span></button>)}</div>
   <p className="status" role="status">{submitting?'Submitting…':saving?'Saving…':remaining===0?'Time is up. Submit your saved answers.':lockedAnswers[String(question.id)]?'This answer is locked because you clicked Next.':'Answers save automatically. Clicking Next locks your answer.'}</p>
   {error&&<p className="error" role="alert">{error}</p>}
   <div className="question-actions"><button className="secondary" disabled={disabled||index===0} onClick={()=>setIndex(i=>i-1)}>Previous</button><button className="secondary" disabled={disabled||index===59} onClick={()=>void next()}>Next</button><button className="primary" disabled={disabled} onClick={()=>remaining===0?void submit():setConfirm(true)}>Submit</button></div>
  </section>
  {confirm&&<div className="modal-back"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="submit-title"><h2 id="submit-title">Submit assessment?</h2><p>You have answered {answered} of 60 questions. Unanswered questions receive no marks. You cannot change answers after submitting.</p><div className="modal-buttons"><button className="secondary" autoFocus onClick={()=>setConfirm(false)}>Go back</button><button className="primary" onClick={()=>void submit()}>Confirm submission</button></div></section></div>}
 </main>;
}
