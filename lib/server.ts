import 'server-only';
import {neon} from '@neondatabase/serverless';
import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import type {NextRequest} from 'next/server';
import {cookies} from 'next/headers';
import answerKey from '@/data/answers.json';
import {questions} from '@/lib/questions';

export const DURATION_MS=60*60*1000;
export function db(){const url=process.env.DATABASE_URL;if(!url)throw new Error('DATABASE_URL is not configured');return neon(url);}
export const hashToken=(token:string)=>createHash('sha256').update(token).digest('hex');
export const createToken=()=>randomBytes(32).toString('hex');
export function mobileValid(v:unknown):v is string {return typeof v==='string'&&/^\d{10}$/.test(v);}
export function safeName(v:unknown):v is string{return typeof v==='string'&&v.trim().length>=2&&v.trim().length<=100;}
export function getStudentToken(req:NextRequest){const value=req.headers.get('authorization')||'';const match=/^Bearer ([a-f0-9]{64})$/.exec(value);return match?.[1]||null;}
export async function findAttempt(req:NextRequest){const t=getStudentToken(req);if(!t)return null;const sql=db();const rows=await sql`SELECT id,name,mobile,started_at,completed_at,answers,locked_answers FROM attempts WHERE token_hash=${hashToken(t)} LIMIT 1`;return rows[0]||null;}
export function expired(started:string|Date){return Date.now()>=new Date(started).getTime()+DURATION_MS;}

// Lock each attempt before scoring so concurrent answer saves and submissions
// always agree. Without an id, finalize only attempts whose hour has elapsed.
export async function finishAttempts(id?:string|number){
 const sql=db();
 const key=questions.filter(q=>q.id<=50).map(q=>({id:String(q.id),section:q.section,choice:answerKey[String(q.id) as keyof typeof answerKey]}));
 return sql`WITH locked AS MATERIALIZED (
   SELECT id,answers FROM attempts
   WHERE completed_at IS NULL AND (${id??null}::bigint IS NOT NULL AND id=${id??null}::bigint
     OR ${id??null}::bigint IS NULL AND started_at + interval '60 minutes' <= now())
   ORDER BY id FOR UPDATE
 ), category_scores AS (
   SELECT locked.id,k.section,count(*) FILTER (WHERE locked.answers -> k.id = to_jsonb(k.choice))::integer AS score
   FROM locked CROSS JOIN jsonb_to_recordset(${JSON.stringify(key)}::jsonb) AS k(id text,section text,choice integer)
   GROUP BY locked.id,k.section
 ), scored AS (
   SELECT id,jsonb_object_agg(section,score) AS scores,sum(score)::integer AS total
   FROM category_scores GROUP BY id
 ) UPDATE attempts a SET completed_at=LEAST(now(),a.started_at + interval '60 minutes'),
   scores=scored.scores,total_score=scored.total,track=NULL
   FROM scored WHERE a.id=scored.id AND a.completed_at IS NULL RETURNING a.id`;
}
function sessionKey(){const v=process.env.SESSION_SECRET;if(!v||v.length<32)throw new Error('SESSION_SECRET must have at least 32 characters');return v;}
export function signAdminSession(){const expiry=Date.now()+8*60*60*1000;const data=`admin.${expiry}`;const sig=createHmac('sha256',sessionKey()).update(data).digest('hex');return `${data}.${sig}`;}
export function verifyAdminSession(v:string|undefined){if(!v)return false;const m=/^admin\.(\d{13})\.([0-9a-f]{64})$/.exec(v);if(!m||Number(m[1])<=Date.now())return false;const expected=createHmac('sha256',sessionKey()).update(`admin.${m[1]}`).digest('hex');return timingSafeEqual(Buffer.from(m[2]),Buffer.from(expected));}
export async function isAdmin(){const store=await cookies();return verifyAdminSession(store.get('intern_admin')?.value);}
export function passwordMatches(value:unknown){const p=process.env.ADMIN_PASSWORD;if(!p||p.length<12||typeof value!=='string')return false;const a=createHash('sha256').update(value).digest();const b=createHash('sha256').update(p).digest();return timingSafeEqual(a,b);}
