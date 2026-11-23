import {NextRequest} from 'next/server';
import {findAttempt,expired,DURATION_MS,finishAttempts} from '@/lib/server';
import {questions} from '@/lib/questions';
import {fail,ok} from '@/lib/http';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 try{const a=await findAttempt(req);if(!a)return fail('Session not found. Contact the coordinator if you changed devices.',401);
 const expiresAt=new Date(new Date(a.started_at).getTime()+DURATION_MS).toISOString();
 const timeUp=expired(a.started_at);
 if(timeUp&&!a.completed_at)await finishAttempts(a.id);
 return ok({name:a.name,startedAt:a.started_at,expiresAt,serverNow:Date.now(),completed:Boolean(a.completed_at)||timeUp,expired:timeUp,answers:a.answers,lockedAnswers:a.locked_answers,questions});
 }catch(e){console.error('Session fetch failed',e);return fail('Could not load session',500);}
}
