import {NextResponse} from 'next/server';
export async function POST(){const r=NextResponse.json({ok:true});r.cookies.set('intern_admin','',{httpOnly:true,sameSite:'strict',path:'/',maxAge:0});return r;}
