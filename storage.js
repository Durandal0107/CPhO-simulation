import {validIdentity} from './identities.js';
import {talents,legacyTalents,validTalents,totalDays,gradeName,actions,budget} from './game.js';
const keys=['mechanics','electro','thermal','optics','modern','lab','school','mood','wealth','popularity'];
export function validSave(s){return !!s&&[1,2].includes(s.version)&&(s.identity==null||validIdentity(s.identity))&&(s.calendarVersion===undefined||s.calendarVersion===3)&&(s.calendarPrep===undefined||[0,6,12].includes(s.calendarPrep))&&(s.headstartMultipliers===undefined||(Array.isArray(s.headstartMultipliers)&&s.headstartMultipliers.length===2&&s.headstartMultipliers.every(v=>Number.isFinite(v)&&v>=0&&v<=1)))&&typeof s.name==='string'&&s.name.length<=16&&Number.isInteger(s.week)&&s.week>=1&&s.week<=48&&Array.isArray(s.talents)&&(s.version===2?validTalents(s.talents):(s.talents.length===2&&new Set(s.talents).size===2&&s.talents.every(id=>legacyTalents.some(t=>t.key===id))))&&s.stats&&keys.filter(k=>(s.version===2||!['wealth','popularity'].includes(k))&&(!['optics','modern'].includes(k)||s.scienceVersion===2||s.stats.optics!==undefined||s.stats.modern!==undefined)).every(k=>Number.isFinite(s.stats[k])&&s.stats[k]>=0&&(k==='wealth'||s.stats[k]<=100))&&(s.dailyPenalty===undefined||[0,2].includes(s.dailyPenalty))&&Array.isArray(s.log)&&s.log.every(l=>Number.isInteger(l.week)&&typeof l.text==='string')&&Array.isArray(s.medals)&&s.medals.every(m=>typeof m.stage==='string'&&typeof m.title==='string'&&Number.isFinite(m.score)&&typeof m.pass==='boolean')&&(s.relationship===undefined||typeof s.relationship==='boolean')&&(s.relationshipSince==null||Number.isInteger(s.relationshipSince))&&(s.romanceCooldown===undefined||(Number.isInteger(s.romanceCooldown)&&s.romanceCooldown>=0))&&s.week<=totalDays(s)&&validRun(s)&&validAttributeRules(s)&&typeof s.route==='boolean'&&typeof s.ended==='boolean'&&(s.pending===null||(s.pending&&typeof s.pending.title==='string'&&typeof s.pending.text==='string'&&validChoices(s.pending)))&&(s.endReason===undefined||['mood','eliminated'].includes(s.endReason))&&(s.endReason!=='mood'||(s.ended&&s.stats.mood===0&&s.pending===null))&&(s.endReason!=='eliminated'||(s.ended&&s.route===false&&s.pending===null&&s.medals.at(-1)?.pass===false&&['预赛','复赛'].includes(s.medals.at(-1)?.stage)))&&(!s.ended||s.week===totalDays(s)||(s.endReason==='mood'&&s.stats.mood===0)||s.endReason==='eliminated');}
export function validPlan(plan,state){return Array.isArray(plan)&&plan.every(id=>actions.some(a=>a.id===id))&&plan.reduce((n,id)=>n+actions.find(a=>a.id===id).cost,0)<=budget(state);}

export function migrateSave(saved){
 const state=JSON.parse(JSON.stringify(saved));
 if(state.stats.optics===undefined)state.stats.optics=state.stats.thermal;
 if(state.stats.modern===undefined)state.stats.modern=15;
 state.scienceVersion=2;
 if(state.pending?.title==='窗边的月亮')for(const choice of state.pending.choices){if(choice.gain.thermal!==undefined){choice.gain.optics=choice.gain.thermal;delete choice.gain.thermal;}}
 return state;
}

function validChoices(e){
 return Array.isArray(e.choices)&&(e.choices.length===2||(e.id==='romance-start'&&e.choices.length===3))&&e.choices.every(c=>typeof c.name==='string'&&typeof c.result==='string'&&(c.authorityBoost===undefined||c.authorityBoost===5)&&(c.relationship===undefined||typeof c.relationship==='boolean')&&(!c.requires||Object.entries(c.requires).every(([k,v])=>keys.includes(k)&&Number.isFinite(v)))&&c.gain&&Object.entries(c.gain).every(([k,v])=>keys.includes(k)&&Number.isFinite(v)));
}
function validEvent(e,day){
 return !!e&&e.day===day&&typeof e.id==='string'&&typeof e.title==='string'&&typeof e.text==='string'&&validChoices(e);
}
function validRun(s){
 if(s.calendarVersion===3&&!validYears(s))return false;
 if(s.runCutoffs===undefined&&s.eventPlan===undefined&&s.worldSeed===undefined&&s.calibration===undefined)return true;
 if(!Number.isInteger(s.worldSeed)||s.worldSeed<0||s.worldSeed>4294967295||!s.runCutoffs||!s.calibration||s.calibration.sampleSize!==1000||s.calibration.worldSeed!==s.worldSeed)return false;
 if(!['preliminary','semifinal','training','gold','silver'].every(k=>Number.isFinite(s.runCutoffs[k])&&s.runCutoffs[k]>=0&&s.runCutoffs[k]<=(k==='preliminary'?320:400)&&s.runCutoffs[k]===s.calibration.cutoffs?.[k]))return false;
 if(s.runCutoffs.training<s.runCutoffs.gold||s.runCutoffs.gold<s.runCutoffs.silver)return false;
 return Array.isArray(s.eventPlan)&&s.eventPlan.length===totalDays(s)&&s.eventPlan.every((slot,i)=>slot&&[null,'single','dating','breakup'].includes(slot.condition)&&validEvent(slot.primary,i+1)&&validEvent(slot.fallback,i+1));
}

function validYears(s){
 const years=s.calibration?.years;
 if(!Array.isArray(years)||years.length!==totalDays(s)/12||!Array.isArray(s.yearCutoffs)||s.yearCutoffs.length!==years.length)return false;
 if(!['初三','高一','高二'].every((g,i)=>s.calibration.cohorts?.[g]===[450,350,200][i]))return false;
 return years.every((y,i)=>y.startDay===i*12+1&&y.grade===gradeName({...s,week:i*12+1})&&y.sampleSize===1000&&['初三','高一','高二'].every((g,j)=>y.cohorts?.[g]===[450,350,200][j])&&['preliminary','semifinal','training','gold','silver'].every(k=>Number.isFinite(y.cutoffs?.[k])&&y.cutoffs[k]>=0&&y.cutoffs[k]<=(k==='preliminary'?320:400)&&y.cutoffs[k]===s.yearCutoffs[i]?.[k]&&(i!==0||y.cutoffs[k]===s.runCutoffs?.[k]))&&y.cutoffs.training>=y.cutoffs.gold&&y.cutoffs.gold>=y.cutoffs.silver);
}

function validAttributeRules(s){
 if(s.jiahaoVersion!==undefined&&s.jiahaoVersion!==1)return false;
 if(s.jiahaoVersion===1&&s.calibration&&s.calibration.jiahaoVersion!==1)return false;
 if(s.authorityBuff!==undefined&&(s.jiahaoVersion!==1||!s.authorityBuff||!Number.isInteger(s.authorityBuff.start)||s.authorityBuff.start<2||!Number.isInteger(s.authorityBuff.end)||s.authorityBuff.end!==s.authorityBuff.start+4||s.authorityBuff.end>totalDays(s)+5))return false;
 if(s.balanceVersion!==undefined&&s.balanceVersion!==2)return false;
 if(s.balanceVersion===2&&s.calibration&&s.calibration.balanceVersion!==2)return false;
 if(s.attributeRulesVersion!==undefined&&s.attributeRulesVersion!==1)return false;
 if(s.attributeRulesVersion===1&&s.calibration&&s.calibration.attributeRulesVersion!==1)return false;
 if(s.examNotice!==undefined&&(!Number.isInteger(s.examNotice)||s.examNotice<0||s.examNotice>=s.medals.length))return false;
 return s.activityNotices===undefined||(Array.isArray(s.activityNotices)&&s.activityNotices.length<=9&&s.activityNotices.every(n=>n&&actions.some(a=>a.id===n.actionId)&&Number.isInteger(n.sequence)&&n.sequence>=1&&n.sequence<=9&&n.week===s.week&&['success','failure'].includes(n.judgement)&&Number.isFinite(n.moodAtAction)&&n.moodAtAction>=0&&n.moodAtAction<=100&&(n.judgement==='failure'?n.moodAtAction<25:n.moodAtAction>75)&&n.gain&&Object.entries(n.gain).every(([k,v])=>keys.includes(k)&&Number.isFinite(v))));
}
