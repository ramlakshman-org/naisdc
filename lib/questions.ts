import rawQuestions from '@/data/questions.json';

export type Question = { id:number; section:string; text:string; options:string[] };
export type AnswerMap = Record<string,number>;
export const questions = rawQuestions as Question[];
export const sections:Record<string,string> = {
 A:'Computer & Digital Literacy', B:'Internet & Website Fundamentals',
 C:'Frontend Development & Design',D:'Backend, Database & Hosting',
 E:'AI Tools, Prompting & Problem Solving',F:'Experience & Learning Readiness'
};
