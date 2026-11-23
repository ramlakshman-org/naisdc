import {db,isAdmin,finishAttempts} from '@/lib/server';
import {fail} from '@/lib/http';
export const runtime='nodejs';
function csv(v:unknown){const s=v===null||v===undefined?'':v instanceof Date?v.toISOString():typeof v==='object'?JSON.stringify(v):String(v);const safe=/^[=+@\-\t\r]/.test(s)?`'${s}`:s;return `"${safe.replace(/"/g,'""')}"`;}
export async function GET(){
 try{if(!await isAdmin())return fail('Unauthorized',401);await finishAttempts();const sql=db();const rows=await sql`SELECT name,mobile,started_at,completed_at,total_score,scores FROM attempts ORDER BY started_at DESC`;
 const headers=['Name','Mobile','Status','Total / 50','Computer / 10','Internet / 10','Frontend / 10','Backend / 10','AI / 10','Started','Submitted'];
 const body=rows.map(r=>[r.name,r.mobile,r.completed_at?'Completed':'In progress',r.total_score,r.scores?.A,r.scores?.B,r.scores?.C,r.scores?.D,r.scores?.E,r.started_at,r.completed_at].map(csv).join(','));
 return new Response('\uFEFF'+[headers.map(csv).join(','),...body].join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="intern-assessment-results.csv"','Cache-Control':'no-store'}});
 }catch(e){console.error('Export failed',e);return fail('Export failed',500);}
}
