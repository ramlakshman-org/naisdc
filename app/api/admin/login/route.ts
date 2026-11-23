import {NextRequest,NextResponse} from 'next/server';
import {passwordMatches,signAdminSession} from '@/lib/server';
import {fail} from '@/lib/http';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 try{const {password}=await req.json().catch(()=>null)||{};if(!passwordMatches(password))return fail('Invalid admin password.',401);
 const resp=NextResponse.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 resp.cookies.set('intern_admin',signAdminSession(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:8*3600});return resp;
 }catch(e){console.error('Admin sign in failed',e);return fail('Unable to sign in',500);}
}
