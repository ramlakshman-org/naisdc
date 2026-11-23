import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {initializeDatabase} from './setup-database.mjs';

async function withDatabase(run){
 const database=new PGlite();
 const sql={query:statement=>({statement}),transaction:async queries=>{
  await database.exec('BEGIN');
  try{for(const query of queries)await database.query(query.statement);await database.exec('COMMIT');}
  catch(error){await database.exec('ROLLBACK');throw error;}
 }};
 try{await run(database,sql);}finally{await database.close();}
}

await withDatabase(async(database,sql)=>{
 await initializeDatabase(sql);
 const {rows}=await database.query("SELECT column_name FROM information_schema.columns WHERE table_name='attempts'");
 for(const column of ['name','mobile','token_hash','answers','scores','total_score','locked_answers'])assert.ok(rows.some(row=>row.column_name===column));
 await database.query("INSERT INTO attempts(name,mobile,token_hash) VALUES ('Deployment test','1234567890',$1)",['a'.repeat(64)]);
 await initializeDatabase(sql);
 assert.equal((await database.query('SELECT count(*)::integer AS count FROM attempts')).rows[0].count,1);
});

await withDatabase(async(database,sql)=>{
 const schema=readFileSync(new URL('../schema.sql',import.meta.url),'utf8').split('-- Safe to rerun')[0];
 await database.exec(schema);
 await database.query("INSERT INTO attempts(name,mobile,token_hash,answers,total_score,completed_at) VALUES ('Existing student','9876543210',$1,'{\"1\":1}'::jsonb,7,now())",['b'.repeat(64)]);
 await initializeDatabase(sql);
 const student=(await database.query('SELECT name,answers,total_score,completed_at,locked_answers FROM attempts')).rows[0];
 assert.equal(student.name,'Existing student');assert.deepEqual(student.answers,{'1':1});assert.equal(student.total_score,7);assert.ok(student.completed_at);assert.deepEqual(student.locked_answers,{});
});
console.log('PASS: deployment creates a new PostgreSQL schema, upgrades existing tables and preserves saved student data across repeated builds.');
