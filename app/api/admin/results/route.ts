import {db,isAdmin,finishAttempts} from '@/lib/server';
import {fail,ok} from '@/lib/http';
export const runtime='nodejs';
export async function GET(){
 try{if(!await isAdmin())return fail('Unauthorized',401);
 await finishAttempts();
 const sql=db();const rows=await sql`SELECT id,name,mobile,started_at,completed_at,total_score,scores FROM attempts ORDER BY started_at DESC`;
 return ok({rows});
 }catch(e){console.error('Admin results failed',e);return fail('Unable to load results',500);}
}
