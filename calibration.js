import {createGame,createEventPlan,advance,choose,budget,actions,canChoose,competitionDay,prepDays,totalDays,gradeRound,gradeName,performAction,settleDailyStats} from './game.js';
import {identities} from './identities.js';
import {seededRandom} from './random.js';
export function calibrateRun(player,onProgress=()=>{}){
 if(player.calendarVersion===3)return calibrateGrades(player,onProgress);
 const random=seededRandom((player.worldSeed^0xa3c59ac3)>>>0);
 const runs=Array.from({length:1000},(_,id)=>{
  const identity=identities[Math.floor(random()*identities.length)].key;
  const state=createGame('模拟',['grinder','lost'],()=>.9,identity);
  state.talents=[];state.dailyPenalty=0;state.log=[];state.calendarPrep=prepDays(player);
  state.eventPlan=player.eventPlan;
  return {id,state,pre:null,semi:null,final:null};
 });
 function simulate(run,target){
  const state=run.state;
  while(!state.ended&&competitionDay(state)<=target){
   state.route=true;
   const plan=[];let remaining=1+Math.floor(random()*budget(state));
   while(remaining>0){let available=actions.filter(a=>a.cost<=remaining);if(state.balanceVersion===2){if(state.stats.mood<35)available=available.filter(a=>a.id==='rest');else if(state.stats.school<40)available=available.filter(a=>a.id==='school');}const action=available[Math.floor(random()*available.length)];plan.push(action.id);remaining-=action.cost;}
   advance(state,plan,random,{deferQualification:true});
   if(state.pending){const available=state.pending.choices.map((c,i)=>canChoose(state,c)?i:null).filter(i=>i!==null);choose(state,available[Math.floor(random()*available.length)],random);}
  }
  const stage=target===8?'预赛':target===16?'复赛':'全国决赛';
  return state.medals.find(m=>m.stage===stage)?.score??null;
 }
 const eligible=(list,key)=>list.filter(r=>r[key]!==null);
 const top=(list,key,ratio)=>{const candidates=eligible(list,key);return candidates.sort((a,b)=>b[key]-a[key]||a.id-b.id).slice(0,Math.ceil(candidates.length*ratio));};
 runs.forEach((r,i)=>{r.pre=simulate(r,8);if((i+1)%100===0)onProgress(Math.round((i+1)*.06));});
 const semifinalists=top(runs,'pre',.3);
 semifinalists.forEach((r,i)=>{r.semi=simulate(r,16);if((i+1)%50===0)onProgress(60+Math.round((i+1)/semifinalists.length*20));});
 const finalists=top(semifinalists,'semi',.3);
 finalists.forEach(r=>{r.final=simulate(r,24);});
 const threshold=(list,key,ratio)=>top(list,key,ratio).at(-1)?.[key]??null;
 const cutoffs={preliminary:threshold(runs,'pre',.3),semifinal:threshold(semifinalists,'semi',.3),training:threshold(finalists,'final',.1),gold:threshold(finalists,'final',.3),silver:threshold(finalists,'final',.7)};
 if(Object.values(cutoffs).some(v=>v===null))throw Error('本局事件日程下，没有足够的存活角色完成全部考试。请重试生成新的一局。');
 onProgress(100);
 return {sampleSize:1000,worldSeed:player.worldSeed,semifinalists:semifinalists.length,finalists:finalists.length,actualPreExams:eligible(runs,'pre').length,actualSemiExams:eligible(semifinalists,'semi').length,actualFinalExams:eligible(finalists,'final').length,cutoffs};
}
export function createCalibratedGame({name,talents,identity,seed},onProgress){
 const state=createGame(name,talents,seededRandom(seed^0x76543210),identity,{calendarVersion:3,attributeRulesVersion:1,balanceVersion:2});
 state.worldSeed=seed>>>0;state.eventPlan=createEventPlan(state,state.worldSeed);
 state.calibration=calibrateRun(state,onProgress);
 state.runCutoffs=state.calibration.cutoffs;
 if(state.calibration.years)state.yearCutoffs=state.calibration.years.map(y=>y.cutoffs);
 return state;
}


function randomPlan(state,random){
 const plan=[];let remaining=1+Math.floor(random()*budget(state));
 while(remaining>0){let available=actions.filter(a=>a.cost<=remaining);if(state.balanceVersion===2){if(state.stats.mood<35)available=available.filter(a=>a.id==='rest');else if(state.stats.school<40)available=available.filter(a=>a.id==='school');}const action=available[Math.floor(random()*available.length)];plan.push(action.id);remaining-=action.cost;}
 return plan;
}
function calibrateGrades(player,onProgress){
 const cohorts={初三:450,高一:350,高二:200};
 const runs=Array.from({length:1000},(_,id)=>{
  const random=seededRandom((player.worldSeed^Math.imul(id+1,0x9e3779b1))>>>0);
  const state=createGame('模拟',['grinder','lost'],()=>.9,identities[Math.floor(random()*identities.length)].key,{calendarVersion:3,attributeRulesVersion:player.attributeRulesVersion,balanceVersion:player.balanceVersion});
  state.talents=[];state.dailyPenalty=0;state.log=[];state.calendarPrep=prepDays(player);
  const priorRounds=id<450?0:id<800?12:24;
  // Prior learning establishes grade differences; current-world events start on day 1.
  for(let day=0;day<priorRounds&&!state.ended;day++){
   for(const action of randomPlan(state,random)){performAction(state,action,random,1,false);if(state.ended)break;}
   if(!state.ended)settleDailyStats(state);
   state.log=[];
  }
  state.eventPlan=player.eventPlan;
  return {id,state,random,pre:null,semi:null,final:null,priorRounds};
 });
 const eligible=(list,key)=>list.filter(r=>r[key]!==null);
 const top=(list,key,ratio)=>{const candidates=eligible(list,key);return candidates.sort((a,b)=>b[key]-a[key]||a.id-b.id).slice(0,Math.ceil(candidates.length*ratio));};
 const threshold=(list,key,ratio)=>top(list,key,ratio).at(-1)?.[key]??null;
 const years=[];let semifinalists=[],finalists=[],current;
 for(let day=1;day<=totalDays(player);day++){
  const round=(day-1)%12+1;
  if(round===1){runs.forEach(r=>{r.pre=r.semi=r.final=null;});current={grade:gradeName({...player,week:day}),startDay:day,sampleSize:1000,cohorts:{...cohorts},cutoffs:{}};}
  for(const run of runs){
   const {state,random}=run;if(state.ended)continue;
   state.route=true;
   const result=advance(state,randomPlan(state,random),random,{deferQualification:true});
   if(result)run[round===8?'pre':round===10?'semi':'final']=result.score;
   if(state.pending){const available=state.pending.choices.map((c,i)=>canChoose(state,c)?i:null).filter(i=>i!==null);choose(state,available[Math.floor(random()*available.length)],random);}
   // Journals are irrelevant to the reference population and costly to retain.
   state.log=[];
  }
  if(round===8){semifinalists=top(runs,'pre',.3);current.actualPreExams=eligible(runs,'pre').length;current.cutoffs.preliminary=threshold(runs,'pre',.3);}
  if(round===10){finalists=top(semifinalists,'semi',.3);current.actualSemiExams=eligible(semifinalists,'semi').length;current.cutoffs.semifinal=threshold(semifinalists,'semi',.3);}
  if(round===12){
   current.actualFinalExams=eligible(finalists,'final').length;current.semifinalists=semifinalists.length;current.finalists=finalists.length;
   Object.assign(current.cutoffs,{training:threshold(finalists,'final',.1),gold:threshold(finalists,'final',.3),silver:threshold(finalists,'final',.7)});
   if(Object.values(current.cutoffs).some(v=>v===null))throw Error(`${current.grade}本局事件日程下没有足够角色完成考试，请重新开局。`);
   years.push(current);
  }
  onProgress(Math.floor(day/totalDays(player)*100));
 }
 return {sampleSize:1000,worldSeed:player.worldSeed,...(player.balanceVersion===2?{balanceVersion:2}:{}),...(player.attributeRulesVersion===1?{attributeRulesVersion:1}:{}),cohorts,years,cutoffs:years[0].cutoffs,actualFinalExams:years[0].actualFinalExams};
}
