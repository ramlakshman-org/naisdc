// Local-only preview: the application and its Neon queries run unchanged.
// Intercept only this process's fake Neon connection and execute it in PGlite.
const {PGlite}=require('@electric-sql/pglite');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const {randomBytes}=require('node:crypto');
const root=resolve(__dirname,'..');
const database=new PGlite(resolve(root,'.local-assessment'));
const ready=database.exec(readFileSync(resolve(root,'schema.sql'),'utf8'));
process.env.DATABASE_URL='postgresql://local:local@local-assessment.invalid/assessment';
process.env.ADMIN_PASSWORD='local-admin-123';
process.env.SESSION_SECRET=randomBytes(32).toString('hex');
const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,init)=>{
 const connection=new Headers(init?.headers).get('Neon-Connection-String');
 if(!connection?.includes('@local-assessment.invalid/'))return originalFetch(input,init);
 try{
  await ready;
  const {query,params}=JSON.parse(init.body);
  const result=await database.query(query,params,{rowMode:'array'});
  const rows=result.rows.map(row=>row.map(value=>value===null?null:value instanceof Date?value.toISOString().replace('T',' ').replace('Z','+00'):typeof value==='object'?JSON.stringify(value):typeof value==='boolean'?(value?'t':'f'):String(value)));
  return Response.json({fields:result.fields,rows,rowCount:result.affectedRows??rows.length});
 }catch(error){return Response.json({message:error.message,code:error.code},{status:400});}
};
console.log('Local preview database: .local-assessment (test data only)');
console.log('Local admin password: local-admin-123');
process.argv=[process.argv[0],require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1'];
require('next/dist/bin/next');
