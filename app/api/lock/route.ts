import {NextRequest} from 'next/server';
import {db,findAttempt,expired} from '@/lib/server';
import {fail,ok} from '@/lib/http';

export const runtime='nodejs';
export async function POST(req:NextRequest){
 try{
  const attempt=await findAttempt(req);
  if(!attempt)return fail('Session not found.',401);
  if(attempt.completed_at||expired(attempt.started_at))return fail('Assessment is no longer accepting answers.',409);
  const {id}=await req.json().catch(()=>null)||{};
  if(!Number.isInteger(id)||id<1||id>60)return fail('Invalid question.');
  const sql=db();
  // Serialize with answer updates. Skipped questions stay available to answer.
  const rows=await sql`UPDATE attempts
   SET locked_answers=CASE WHEN answers ? ${String(id)}
     THEN jsonb_set(locked_answers,ARRAY[${String(id)}],'true'::jsonb,true)
     ELSE locked_answers END
   WHERE id=${attempt.id} AND completed_at IS NULL AND started_at + interval '60 minutes' > now()
   RETURNING locked_answers`;
  if(!rows.length)return fail('Assessment is no longer accepting answers.',409);
  return ok({lockedAnswers:rows[0].locked_answers});
 }catch(error){console.error('Answer lock failed',error);return fail('Could not continue. Please retry Next.',500);}
}
