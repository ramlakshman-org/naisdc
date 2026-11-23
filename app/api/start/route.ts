import {NextRequest} from 'next/server';
import {createToken,db,hashToken,mobileValid,safeName} from '@/lib/server';
import {fail,ok} from '@/lib/http';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 try{
 const data=await req.json().catch(()=>null);
 if(!data||!safeName(data.name)||!mobileValid(data.mobile)||data.accepted!==true)return fail('Enter a name (2–100 characters) and 10-digit mobile number, and accept the declaration.');
 const name=data.name.trim();const mobile=data.mobile;const token=createToken();const sql=db();
 const rows=await sql`INSERT INTO attempts (name,mobile,token_hash) VALUES (${name},${mobile},${hashToken(token)}) ON CONFLICT (mobile) DO NOTHING RETURNING id,started_at`;
 if(!rows.length){
  const existing=await sql`SELECT completed_at,started_at FROM attempts WHERE mobile=${mobile}`;
  if(existing[0]?.completed_at||existing[0]&&new Date(existing[0].started_at).getTime()+3600000<=Date.now())return fail('This mobile number has already completed an assessment.',409);
  return fail('This mobile number already has an assessment in progress. Continue on the original browser.',409);
 }
 return ok({token,startedAt:rows[0].started_at,expiresAt:new Date(new Date(rows[0].started_at).getTime()+3600000).toISOString()},201);
 }catch(e){console.error('Start failed',e);return fail('Unable to start the assessment. Please contact the coordinator.',500);}
}
