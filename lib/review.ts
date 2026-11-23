import 'server-only';
import answerKey from '@/data/answers.json';
import {questions,sections,type AnswerMap} from '@/lib/questions';

export function reviewAnswers(answers:AnswerMap){
 return questions.map(question=>{
  const selectedChoice=answers[String(question.id)]??null;
  const correctChoice=question.id<=50?answerKey[String(question.id) as keyof typeof answerKey]:null;
  return {...question,sectionName:sections[question.section],selectedChoice,correctChoice,
   result:correctChoice===null?'unscored':selectedChoice===null?'unanswered':selectedChoice===correctChoice?'correct':'incorrect'};
 });
}
