import {readFileSync} from 'node:fs';
const q=JSON.parse(readFileSync(new URL('../data/questions.json',import.meta.url)));
const a=JSON.parse(readFileSync(new URL('../data/answers.json',import.meta.url)));
if(q.length!==60)throw new Error('Expected 60 questions');
for(let i=1;i<=60;i++){const x=q[i-1];if(x.id!==i||x.options.length!==4||x.section!=='ABCDEF'[Math.floor((i-1)/10)])throw new Error(`Question ${i} invalid`);if(i<=50&&(!Number.isInteger(a[String(i)])||a[String(i)]<0||a[String(i)]>3))throw new Error(`Answer key ${i} invalid`);}
console.log('PASS: 60 questions, 6 sections, and 50 answer keys validated.');
