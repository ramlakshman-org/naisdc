'use client';
import {useState,useEffect} from 'react';
import {useRouter} from 'next/navigation';
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
 return <main className="registration"><section className="panel">
  <h1>Intern Skill Assessment</h1><p>60 multiple-choice questions · 60 minutes</p>
  <div className="notice"><h2>Instructions</h2><ul>
   <li>Answer independently. Do not use Google, AI tools or outside help.</li>
   <li>The timer starts when you select Start assessment. Your answers save automatically.</li>
   <li>Clicking Next locks your selected answer. Previous lets you review locked answers without changing them. Skipped questions can still be answered.</li>
   <li>Your saved answers are submitted when the 60 minutes end.</li>
   <li>Questions 1–50 count toward your score. Questions 51–60 cover learning readiness and are unscored.</li>
  </ul></div>
  <form className="form" onSubmit={start}>
   <label>Student name<input autoComplete="name" minLength={2} maxLength={100} required value={name} onChange={e=>setName(e.target.value)}/></label>
   <label>Mobile number<input type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[0-9]{10}" maxLength={10} placeholder="10-digit mobile number" required value={mobile} onChange={e=>setMobile(e.target.value.replace(/\D/g,'').slice(0,10))}/></label>
   <label className="check"><input type="checkbox" required checked={accepted} onChange={e=>setAccepted(e.target.checked)}/>I agree to answer without Google, AI tools or outside help.</label>
   {error&&<p className="error" role="alert">{error}</p>}
   <button className="primary" disabled={busy||!accepted}>{busy?'Starting…':'Start assessment'}</button>
   {existing&&<button className="secondary" type="button" disabled={busy} onClick={()=>router.push('/test')}>Continue existing assessment</button>}
  </form>
 </section></main>;
}
