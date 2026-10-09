import {markReferenceState,createGame,createEventPlan,advance,choose,budget,actions,canChoose,competitionDay,prepDays,totalDays,gradeRound,gradeName,performAction,settleDailyStats,settleExamMood} from './game.js';
import {identities} from './identities.js';
import {seededRandom} from './random.js';
import {referenceProfile,referenceGoal,referencePlan,referenceChoice} from './reference-policy.js';
export const calibrationSettings=player=>({sampleSize:player.cutoffRulesVersion===2?10000:1000,qualificationRatio:player.cutoffRulesVersion===2 ? .1 : .2});
export function calibrateRun(player,onProgress=()=>{}){
 if(player.calendarVersion===3&&player.independentPoolsVersion===1)return calibrateIndependentGrades(player,onProgress);
 if(player.calendarVersion===3)return calibrateGrades(player,onProgress);
 const {sampleSize,qualificationRatio}=calibrationSettings(player);
 const random=seededRandom((player.worldSeed^0xa3c59ac3)>>>0);
 const runs=Array.from({length:sampleSize},(_,id)=>{
  const identity=identities[Math.floor(random()*identities.length)].key;
  const state=createGame('模拟',['grinder','lost'],()=>.9,identity,{identityRulesVersion:player.identityRulesVersion??1,actionRulesVersion:player.actionRulesVersion});
  markReferenceState(state);
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
 runs.forEach((r,i)=>{r.pre=simulate(r,8);if((i+1)%100===0)onProgress(Math.round((i+1)/sampleSize*60));});
 const semifinalists=top(runs,'pre',qualificationRatio);
 semifinalists.forEach((r,i)=>{r.semi=simulate(r,16);if((i+1)%50===0)onProgress(60+Math.round((i+1)/semifinalists.length*20));});
 const finalists=top(semifinalists,'semi',qualificationRatio);
 finalists.forEach(r=>{r.final=simulate(r,24);});
 const threshold=(list,key,ratio)=>top(list,key,ratio).at(-1)?.[key]??null;
 const cutoffs={preliminary:threshold(runs,'pre',qualificationRatio),semifinal:threshold(semifinalists,'semi',qualificationRatio),training:threshold(finalists,'final',.1),gold:threshold(finalists,'final',.3),silver:threshold(finalists,'final',.7)};
 if(Object.values(cutoffs).some(v=>v===null))throw Error('本局事件日程下，没有足够的存活角色完成全部考试。请重试生成新的一局。');
 onProgress(100);
 return {sampleSize,qualificationRatio,...(player.actionRulesVersion===2?{actionRulesVersion:2}:{}),...(player.identityRulesVersion===2?{identityRulesVersion:2}:{}),...(player.cutoffRulesVersion===2?{cutoffRulesVersion:2}:{}),worldSeed:player.worldSeed,semifinalists:semifinalists.length,finalists:finalists.length,actualPreExams:eligible(runs,'pre').length,actualSemiExams:eligible(semifinalists,'semi').length,actualFinalExams:eligible(finalists,'final').length,cutoffs};
}
export function createCalibratedGame({name,talents,identity,seed},onProgress){
 const state=createGame(name,talents,seededRandom(seed^0x76543210),identity,{calendarVersion:3,attributeRulesVersion:1,balanceVersion:2,jiahaoVersion:1,cutoffRulesVersion:2,independentPoolsVersion:1,referencePolicyVersion:1,examMoodVersion:1,actionRulesVersion:2});
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

function finishCalibrationEvent(run){
 const {state,random,profile}=run;
 if(state.pending){const available=state.pending.choices.map((c,i)=>canChoose(state,c)?i:null).filter(i=>i!==null);choose(state,profile?referenceChoice(state,random,referenceGoal(state),profile):available[Math.floor(random()*available.length)],random);}
 state.log=[];
}

// Reference pools must rank this exam before applying its mood outcome or choosing its daily event.
export function settleCalibrationQualification(runs,qualified,key){
 const winners=new Set(qualified.map(run=>run.id));
 for(const run of runs){
  const {state}=run;
  if(state.examMoodVersion!==1||run[key]===null)continue;
  const result=state.medals.at(-1);
  result.pass=winners.has(run.id);result.title=result.pass?(key==='pre'?'晋级复赛':'入选省队'):'未能晋级';state.route=result.pass;
  settleExamMood(state,result);
  finishCalibrationEvent(run);
 }
}

function calibrateCompetition(player,startDay,stageIndex,onProgress){
 const {sampleSize,qualificationRatio}=calibrationSettings(player);
 const cohorts={初三:sampleSize*.45,高一:sampleSize*.35,高二:sampleSize*.2};
 const poolSeed=(player.worldSeed^Math.imul(startDay,0x85ebca6b)^Math.imul(stageIndex+1,0xc2b2ae35))>>>0;
 // Each call owns a fresh population. No statistics, relationships or buffs cross pools.
 const runs=Array.from({length:sampleSize},(_,id)=>{
  const random=seededRandom((poolSeed^Math.imul(id+1,0x9e3779b1))>>>0);
  const state=createGame('模拟',['grinder','lost'],()=>.9,identities[Math.floor(random()*identities.length)].key,{calendarVersion:3,attributeRulesVersion:player.attributeRulesVersion,balanceVersion:player.balanceVersion,jiahaoVersion:player.jiahaoVersion,examMoodVersion:player.examMoodVersion,identityRulesVersion:player.identityRulesVersion??1,actionRulesVersion:player.actionRulesVersion});
  markReferenceState(state);
  state.talents=[];state.dailyPenalty=0;state.calendarPrep=prepDays(player);
  const profile=player.referencePolicyVersion===1?referenceProfile(random):null;
  const priorRounds=id<cohorts.初三?0:id<cohorts.初三+cohorts.高一?12:24;
  for(let day=0;day<priorRounds&&!state.ended;day++){
   for(const action of profile?referencePlan(state,random,'balanced',profile):randomPlan(state,random)){performAction(state,action,random,1,false);if(state.ended)break;}
   if(!state.ended)settleDailyStats(state);
   state.log=[];
  }
  state.week=startDay;state.eventPlan=player.eventPlan;state.log=[];
  return {id,state,random,profile,pre:null,semi:null,final:null};
 });
 const eligible=(list,key)=>list.filter(r=>r[key]!==null);
 const top=(list,key,ratio)=>{const candidates=eligible(list,key);return candidates.sort((a,b)=>b[key]-a[key]||a.id-b.id).slice(0,Math.ceil(candidates.length*ratio));};
 const threshold=(list,key,ratio)=>top(list,key,ratio).at(-1)?.[key]??null;
 function simulate(run,round){
  const {state,random,profile}=run;
  while(!state.ended&&state.week<=startDay+round-1){
   state.route=true;
   const goal=referenceGoal(state);
   const result=advance(state,profile?referencePlan(state,random,goal,profile):randomPlan(state,random),random,{deferQualification:true});
   if(result)run[result.stage==='预赛'?'pre':result.stage==='复赛'?'semi':'final']=result.score;
   if(result&&state.examMoodVersion===1&&result.stage!=='全国决赛')break;
   finishCalibrationEvent(run);
  }
 }
 runs.forEach((run,i)=>{simulate(run,8);if((i+1)%100===0)onProgress((i+1)/sampleSize*.8);});
 const semifinalists=top(runs,'pre',qualificationRatio);
 settleCalibrationQualification(runs,semifinalists,'pre');
 const report={poolSeed,startDay,examDay:startDay+[8,10,12][stageIndex]-1,sampleSize,cohorts,actualPreExams:eligible(runs,'pre').length,semifinalists:semifinalists.length,cutoffs:{preliminary:threshold(runs,'pre',qualificationRatio)}};
 if(stageIndex>=1){
  semifinalists.forEach((run,i)=>{simulate(run,10);if((i+1)%50===0)onProgress(.8+(i+1)/semifinalists.length*.15);});
  const finalists=top(semifinalists,'semi',qualificationRatio);
  settleCalibrationQualification(semifinalists,finalists,'semi');
  Object.assign(report,{actualSemiExams:eligible(semifinalists,'semi').length,finalists:finalists.length});
  report.cutoffs.semifinal=threshold(semifinalists,'semi',qualificationRatio);
  if(stageIndex===2){
   finalists.forEach(run=>simulate(run,12));
   report.actualFinalExams=eligible(finalists,'final').length;
   Object.assign(report.cutoffs,{training:threshold(finalists,'final',.1),gold:threshold(finalists,'final',.3),silver:threshold(finalists,'final',.7)});
  }
 }
 if(Object.values(report.cutoffs).some(v=>v===null))throw Error(`${gradeName({...player,week:startDay})}本局事件日程下没有足够角色完成考试，请重新开局。`);
 onProgress(1);return report;
}

function calibrateIndependentGrades(player,onProgress){
 const {sampleSize,qualificationRatio}=calibrationSettings(player),years=[];
 const competitionCount=totalDays(player)/12*3;
 for(let startDay=1;startDay<=totalDays(player);startDay+=12){
  const stages={};
  for(const [stageIndex,key]of ['preliminary','semifinal','final'].entries()){
   const completed=years.length*3+stageIndex;
   stages[key]=calibrateCompetition(player,startDay,stageIndex,progress=>onProgress(Math.floor((completed+progress)/competitionCount*100)));
  }
  const {preliminary,semifinal,final}=stages;
  years.push({grade:gradeName({...player,week:startDay}),startDay,sampleSize,cohorts:{...preliminary.cohorts},stages,
   actualPreExams:preliminary.actualPreExams,semifinalists:preliminary.semifinalists,actualSemiExams:semifinal.actualSemiExams,finalists:semifinal.finalists,actualFinalExams:final.actualFinalExams,
   cutoffs:{preliminary:preliminary.cutoffs.preliminary,semifinal:semifinal.cutoffs.semifinal,training:final.cutoffs.training,gold:final.cutoffs.gold,silver:final.cutoffs.silver}});
 }
 return {sampleSize,qualificationRatio,...(player.actionRulesVersion===2?{actionRulesVersion:2}:{}),...(player.identityRulesVersion===2?{identityRulesVersion:2}:{}),cutoffRulesVersion:player.cutoffRulesVersion,independentPoolsVersion:1,...(player.referencePolicyVersion===1?{referencePolicyVersion:1}:{}),...(player.examMoodVersion===1?{examMoodVersion:1}:{}),competitionCount,totalSimulations:competitionCount*sampleSize,initialLearningRounds:{初三:0,高一:12,高二:24},
  worldSeed:player.worldSeed,...(player.jiahaoVersion===1?{jiahaoVersion:1}:{}),...(player.balanceVersion===2?{balanceVersion:2}:{}),...(player.attributeRulesVersion===1?{attributeRulesVersion:1}:{}),cohorts:years[0].cohorts,years,cutoffs:years[0].cutoffs,actualFinalExams:years[0].actualFinalExams};
}

function calibrateGrades(player,onProgress){
 const {sampleSize,qualificationRatio}=calibrationSettings(player);
 const cohorts={初三:sampleSize*.45,高一:sampleSize*.35,高二:sampleSize*.2};
 const runs=Array.from({length:sampleSize},(_,id)=>{
  const random=seededRandom((player.worldSeed^Math.imul(id+1,0x9e3779b1))>>>0);
  const state=createGame('模拟',['grinder','lost'],()=>.9,identities[Math.floor(random()*identities.length)].key,{calendarVersion:3,attributeRulesVersion:player.attributeRulesVersion,balanceVersion:player.balanceVersion,jiahaoVersion:player.jiahaoVersion,identityRulesVersion:player.identityRulesVersion??1,actionRulesVersion:player.actionRulesVersion});
  markReferenceState(state);
  state.talents=[];state.dailyPenalty=0;state.log=[];state.calendarPrep=prepDays(player);
  const priorRounds=id<cohorts.初三?0:id<cohorts.初三+cohorts.高一?12:24;
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
  if(round===1){runs.forEach(r=>{r.pre=r.semi=r.final=null;});current={grade:gradeName({...player,week:day}),startDay:day,sampleSize,cohorts:{...cohorts},cutoffs:{}};}
  for(const run of runs){
   const {state,random}=run;if(state.ended)continue;
   state.route=true;
   const result=advance(state,randomPlan(state,random),random,{deferQualification:true});
   if(result)run[round===8?'pre':round===10?'semi':'final']=result.score;
   if(state.pending){const available=state.pending.choices.map((c,i)=>canChoose(state,c)?i:null).filter(i=>i!==null);choose(state,available[Math.floor(random()*available.length)],random);}
   // Journals are irrelevant to the reference population and costly to retain.
   state.log=[];
  }
  if(round===8){semifinalists=top(runs,'pre',qualificationRatio);current.actualPreExams=eligible(runs,'pre').length;current.cutoffs.preliminary=threshold(runs,'pre',qualificationRatio);}
  if(round===10){finalists=top(semifinalists,'semi',qualificationRatio);current.actualSemiExams=eligible(semifinalists,'semi').length;current.cutoffs.semifinal=threshold(semifinalists,'semi',qualificationRatio);}
  if(round===12){
   current.actualFinalExams=eligible(finalists,'final').length;current.semifinalists=semifinalists.length;current.finalists=finalists.length;
   Object.assign(current.cutoffs,{training:threshold(finalists,'final',.1),gold:threshold(finalists,'final',.3),silver:threshold(finalists,'final',.7)});
   if(Object.values(current.cutoffs).some(v=>v===null))throw Error(`${current.grade}本局事件日程下没有足够角色完成考试，请重新开局。`);
   years.push(current);
  }
  onProgress(Math.floor(day/totalDays(player)*100));
 }
 return {sampleSize,qualificationRatio,...(player.actionRulesVersion===2?{actionRulesVersion:2}:{}),...(player.identityRulesVersion===2?{identityRulesVersion:2}:{}),...(player.cutoffRulesVersion===2?{cutoffRulesVersion:2}:{}),worldSeed:player.worldSeed,...(player.jiahaoVersion===1?{jiahaoVersion:1}:{}),...(player.balanceVersion===2?{balanceVersion:2}:{}),...(player.attributeRulesVersion===1?{attributeRulesVersion:1}:{}),cohorts,years,cutoffs:years[0].cutoffs,actualFinalExams:years[0].actualFinalExams};
}
