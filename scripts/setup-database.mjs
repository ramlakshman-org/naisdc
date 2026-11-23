import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {neon} from '@neondatabase/serverless';

export async function initializeDatabase(sql){
 // This project's schema contains standalone DDL and full-line SQL comments.
 // Remove those comments before splitting, because a comment may contain ';'.
 const statements=readFileSync(new URL('../schema.sql',import.meta.url),'utf8')
  .replace(/^\s*--.*$/gm,'').split(';').map(statement=>statement.trim()).filter(Boolean);
 await sql.transaction(statements.map(statement=>sql.query(statement)));
}

async function main(){
 const url=process.env.DATABASE_URL;
 if(!url){
  if(process.env.VERCEL)throw new Error('DATABASE_URL is required for Vercel deployment. Connect Neon before deploying.');
  console.log('Local build: database setup skipped because DATABASE_URL is not set.');return;
 }
 if(process.env.VERCEL_ENV==='production'){
  if((process.env.ADMIN_PASSWORD||'').length<12)throw new Error('Set a Production ADMIN_PASSWORD of at least 12 characters in Vercel.');
  if((process.env.SESSION_SECRET||'').length<32)throw new Error('Set a Production SESSION_SECRET of at least 32 characters in Vercel.');
 }
 await initializeDatabase(neon(url));
 console.log('PostgreSQL assessment schema is ready. Existing assessments are preserved.');
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 main().catch(error=>{
  // Do not print driver errors or connection strings, which can include secrets.
  if(!process.env.DATABASE_URL||error.message?.startsWith('Set a Production'))console.error(error.message);
  else console.error('Database setup failed. Check DATABASE_URL, database access and SQL permissions.');
  if(error.code)console.error('Database error code:',error.code);
  process.exitCode=1;
 });
}
