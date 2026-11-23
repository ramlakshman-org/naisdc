import {NextRequest} from 'next/server';
import {db,isAdmin,finishAttempts} from '@/lib/server';
import {reviewAnswers} from '@/lib/review';
import {fail,ok} from '@/lib/http';

export const runtime='nodejs';
export async function GET(request:NextRequest){
 try{
  if(!await isAdmin())return fail('Unauthorized',401);
  const id=request.nextUrl.searchParams.get('id');
  if(!id||!/^\d+$/.test(id)||!Number.isSafeInteger(Number(id))||Number(id)<1)return fail('Invalid assessment.');
  await finishAttempts();
  const sql=db();
  const rows=await sql`SELECT id,name,mobile,completed_at,total_score,answers FROM attempts WHERE id=${id} LIMIT 1`;
  const attempt=rows[0];
  if(!attempt)return fail('Assessment not found.',404);
  if(!attempt.completed_at)return fail('Answer review is available after submission.',409);
  return ok({student:{id:attempt.id,name:attempt.name,mobile:attempt.mobile,total_score:attempt.total_score},questions:reviewAnswers(attempt.answers||{})});
 }catch(error){console.error('Admin answer review failed',error);return fail('Unable to load answers. Please retry.',500);}
}
