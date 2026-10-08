import {createGame,createEventPlan,advance,choose,budget,actions,canChoose,competitionDay,prepDays} from './game.js';
import {identities} from './identities.js';
import {seededRandom} from './random.js';
export function calibrateRun(player,onProgress=()=>{}){
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
   while(remaining>0){const available=actions.filter(a=>a.cost<=remaining);const action=available[Math.floor(random()*available.length)];plan.push(action.id);remaining-=action.cost;}
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
 const state=createGame(name,talents,seededRandom(seed^0x76543210),identity);
 state.worldSeed=seed>>>0;state.eventPlan=createEventPlan(state,state.worldSeed);
 state.calibration=calibrateRun(state,onProgress);
 state.runCutoffs=state.calibration.cutoffs;
 return state;
}
