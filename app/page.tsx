'use client';
import {useState,useEffect} from 'react';
import {useRouter} from 'next/navigation';
import Brand from '@/components/Brand';
export default function Home(){
 const router=useRouter();const [name,setName]=useState('');const [mobile,setMobile]=useState('');
 const [accepted,setAccepted]=useState(false);const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');const [existing,setExisting]=useState(false);
 useEffect(()=>{try{setExisting(Boolean(localStorage.getItem('intern_attempt_token')));}catch{setError('Enable browser storage to take the assessment.');}},[]);
 async function start(e:React.FormEvent){
  e.preventDefault();setError('');setBusy(true);
  try{
   localStorage.setItem('intern_storage_check','1');localStorage.removeItem('intern_storage_check');
   const res=await fetch('/api/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,mobile,accepted})});
   const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not start. Please retry.');
   localStorage.setItem('intern_attempt_token',data.token);router.push('/test');
  }catch(e){setError(e instanceof Error?e.message:'Could not start. Please retry.');}finally{setBusy(false);}
 }
 return <><header className="site-header"><Brand/><span className="header-note">Internship assessment</span></header>
 <main className="registration">
  <section className="registration-intro"><h1>Start with what<br className="desktop-break"/> you know.</h1><p className="intro-copy">A simple assessment to understand your skills and your starting point.</p>
   <div className="assessment-facts" aria-label="Assessment overview"><span><strong>60</strong> questions</span><span><strong>60</strong> minutes</span><span><strong>50</strong> marks</span></div>
   <div className="instructions"><h2>Before you begin</h2><ul>
    <li><strong>Keep it independent.</strong> No Google, AI tools or outside help.</li>
    <li><strong>Take your time.</strong> Answers save automatically. Your saved answers are submitted after 60 minutes.</li>
    <li><strong>Choose, then continue.</strong> Next locks your answer. Previous is for review. Skipped questions remain answerable.</li>
   </ul><p className="scoring-note">The first 50 questions are scored. The last 10 are about your experience and learning readiness.</p></div>
  </section>
  <section className="registration-form panel"><h2>Your details</h2><p className="muted">Enter your name and mobile number to begin.</p>
   <form className="form" onSubmit={start}>
    <label>Student name<input autoComplete="name" placeholder="Your full name" minLength={2} maxLength={100} required value={name} onChange={e=>setName(e.target.value)}/></label>
    <label>Mobile number<input type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[0-9]{10}" maxLength={10} placeholder="10-digit mobile number" required value={mobile} onChange={e=>setMobile(e.target.value.replace(/\D/g,'').slice(0,10))}/></label>
    <label className="check"><input type="checkbox" required checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>I agree to answer independently, without Google, AI tools or outside help.</span></label>
    {error&&<p className="error" role="alert">{error}</p>}
    <button className="primary" disabled={busy||!accepted}>{busy?'Starting…':'Start assessment'}</button>
    {existing&&<button className="secondary" type="button" disabled={busy} onClick={()=>router.push('/test')}>Continue existing assessment</button>}
    <p className="form-footnote">Your 60-minute timer starts when you begin.</p>
   </form>
  </section>
 </main><footer className="site-footer">Intern Skill Assessment<span>Answer honestly. Start confidently.</span></footer></>;
}
