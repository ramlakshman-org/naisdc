import {NextRequest} from 'next/server';
import {findAttempt,finishAttempts} from '@/lib/server';
import {fail,ok} from '@/lib/http';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 try{const a=await findAttempt(req);if(!a)return fail('Session not found.',401);if(a.completed_at)return ok({submitted:true});
 const rows=await finishAttempts(a.id);
 return ok({submitted:true,alreadySubmitted:!rows.length});
 }catch(e){console.error('Submission failed',e);return fail('Unable to submit. Please retry.',500);}
}
