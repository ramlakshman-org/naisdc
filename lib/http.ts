import {NextResponse} from 'next/server';
export const noStore={ 'Cache-Control':'no-store, max-age=0' };
export function fail(message:string,status=400){return NextResponse.json({error:message},{status,headers:noStore});}
export function ok(data:unknown,status=200){return NextResponse.json(data,{status,headers:noStore});}
