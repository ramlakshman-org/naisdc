import {NextRequest} from 'next/server';
import {db,findAttempt,expired} from '@/lib/server';
import {questions} from '@/lib/questions';
import {fail,ok} from '@/lib/http';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 try{const a=await findAttempt(req);if(!a)return fail('Session not found.',401);if(a.completed_at)return fail('Assessment already submitted.',409);if(expired(a.started_at))return fail('Time is up. Submit your assessment.',409);
 const {id,choice}=await req.json().catch(()=>null)||{};if(!Number.isInteger(id)||id<1||id>60||!Number.isInteger(choice)||choice<0||choice>=questions[id-1].options.length)return fail('Invalid answer.');
 const sql=db();const updated=await sql`UPDATE attempts SET answers=jsonb_set(answers,ARRAY[${String(id)}],to_jsonb(${choice}::integer),true) WHERE id=${a.id} AND completed_at IS NULL AND NOT (locked_answers ? ${String(id)}) AND started_at + interval '60 minutes' > now() RETURNING id`;
 if(!updated.length)return fail('This answer is locked or the assessment is no longer accepting answers.',409);return ok({saved:true,id});
 }catch(e){console.error('Answer save failed',e);return fail('Could not save answer. Please retry.',500);}
}
