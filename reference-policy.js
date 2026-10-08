import {actions,budget,canChoose,effectiveGain,gradeRound,physicalKeys} from './game.js';

export function referenceProfile(random){
 return {moodReserve:50+random()*15,schoolFloor:random()<.25?30:0,focus:Object.fromEntries(physicalKeys.map(key=>[key,.85+random()*.3]))};
}
export function referenceGoal(state){return gradeRound(state)<=8?'preliminary':gradeRound(state)<=10?'semifinal':'final';}
const weights=goal=>goal==='preliminary'?{mechanics:1.12,electro:1.12,thermal:.48,optics:.48,modern:0,lab:0}:{mechanics:.8,electro:.8,thermal:.6,optics:.6,modern:.4,lab:.8};
const clamp=value=>Math.max(0,Math.min(100,value));

export function referencePlan(state,random,goal,profile){
 const projected={...state,stats:{...state.stats}},plan=[],importance=weights(goal);
 const gains=new Map(actions.map(action=>[action,effectiveGain(state,action.gain,true)]));
 let remaining=budget(state);
 while(remaining>0){
  const affordable=actions.filter(a=>a.cost<=remaining);
  const resting=projected.stats.mood<profile.moodReserve;
  const catchingUp=projected.stats.school<profile.schoolFloor&&projected.stats.mood>profile.moodReserve+3;
  let chosen=affordable.find(a=>a.id===(resting?'rest':catchingUp?'school':''));
  if(!chosen){
   let best=-Infinity;
   for(const action of affordable){
    const gain=gains.get(action);
    if(projected.stats.mood+(gain.mood||0)<profile.moodReserve&&action.id!=='rest')continue;
    let score=0;
    for(const [key,value]of Object.entries(gain))if(importance[key])score+=importance[key]*Math.min(100-projected.stats[key],value)*profile.focus[key]*(1+.5*(1-projected.stats[key]/100));
    if(action.id==='rest')score=.08;
    if(action.id==='school')score=.02;
    score=score/action.cost*(.9+random()*.2);
    if(score>best){best=score;chosen=action;}
   }
  }
  chosen??=affordable.find(a=>a.id==='rest');
  plan.push(chosen.id);remaining-=chosen.cost;
  for(const [key,value]of Object.entries(gains.get(chosen)))projected.stats[key]=clamp(projected.stats[key]+value);
 }
 return plan;
}

export function referenceChoice(state,random,goal,profile){
 const importance=weights(goal);let chosen=null,best=-Infinity;
 for(const [index,choice]of state.pending.choices.entries()){
  if(!canChoose(state,choice))continue;
  const gain=effectiveGain(state,choice.gain);
  const moodAfter=clamp(state.stats.mood+(gain.mood||0));
  if(moodAfter===0)continue;
  let score=0;
  for(const key of physicalKeys)score+=(importance[key]||0)*(clamp(state.stats[key]+(gain[key]||0))-state.stats[key])*profile.focus[key];
  const moodValue=state.stats.mood<profile.moodReserve?1.5:state.stats.mood<75?.8:.3;
  score+=(moodAfter-state.stats.mood)*moodValue;
  if(moodAfter<25)score-=20;
  score+=(gain.school||0)*(state.stats.school<profile.schoolFloor?.6:.05);
  score+=(gain.popularity||0)*.05+(gain.wealth||0)*.001;
  if(choice.relationship===true&&!state.relationship)score+=3;
  if(choice.authorityBoost===5)score+=8;
  score+=(random()-.5)*.5;
  if(score>best){best=score;chosen=index;}
 }
 // If every available choice is fatal, resolve it normally; no revival or hidden bonus.
 return chosen??state.pending.choices.findIndex(choice=>canChoose(state,choice));
}
