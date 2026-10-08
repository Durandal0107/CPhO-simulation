import {validIdentity} from './identities.js';
import {talents,legacyTalents,validTalents,totalDays,actions,budget} from './game.js';
const keys=['mechanics','electro','thermal','optics','modern','lab','school','mood','wealth','popularity'];
export function validSave(s){return !!s&&[1,2].includes(s.version)&&(s.identity==null||validIdentity(s.identity))&&(s.calendarPrep===undefined||[0,6,12].includes(s.calendarPrep))&&(s.headstartMultipliers===undefined||(Array.isArray(s.headstartMultipliers)&&s.headstartMultipliers.length===2&&s.headstartMultipliers.every(v=>Number.isFinite(v)&&v>=0&&v<=1)))&&typeof s.name==='string'&&s.name.length<=16&&Number.isInteger(s.week)&&s.week>=1&&s.week<=36&&Array.isArray(s.talents)&&(s.version===2?validTalents(s.talents):(s.talents.length===2&&new Set(s.talents).size===2&&s.talents.every(id=>legacyTalents.some(t=>t.key===id))))&&s.stats&&keys.filter(k=>(s.version===2||!['wealth','popularity'].includes(k))&&(!['optics','modern'].includes(k)||s.scienceVersion===2||s.stats.optics!==undefined||s.stats.modern!==undefined)).every(k=>Number.isFinite(s.stats[k])&&s.stats[k]>=0&&(k==='wealth'||s.stats[k]<=100))&&(s.dailyPenalty===undefined||[0,2].includes(s.dailyPenalty))&&Array.isArray(s.log)&&s.log.every(l=>Number.isInteger(l.week)&&typeof l.text==='string')&&Array.isArray(s.medals)&&s.medals.every(m=>typeof m.stage==='string'&&typeof m.title==='string'&&Number.isFinite(m.score)&&typeof m.pass==='boolean')&&(s.relationship===undefined||typeof s.relationship==='boolean')&&(s.relationshipSince==null||Number.isInteger(s.relationshipSince))&&(s.romanceCooldown===undefined||(Number.isInteger(s.romanceCooldown)&&s.romanceCooldown>=0))&&s.week<=totalDays(s)&&validRun(s)&&typeof s.route==='boolean'&&typeof s.ended==='boolean'&&(s.pending===null||(s.pending&&typeof s.pending.title==='string'&&typeof s.pending.text==='string'&&Array.isArray(s.pending.choices)&&s.pending.choices.length===2&&s.pending.choices.every(c=>typeof c.name==='string'&&typeof c.result==='string'&&(c.relationship===undefined||typeof c.relationship==='boolean')&&(!c.requires||Object.entries(c.requires).every(([k,v])=>keys.includes(k)&&Number.isFinite(v)))&&c.gain&&Object.entries(c.gain).every(([k,v])=>keys.includes(k)&&Number.isFinite(v)))))&&(s.endReason===undefined||['mood','eliminated'].includes(s.endReason))&&(s.endReason!=='mood'||(s.ended&&s.stats.mood===0&&s.pending===null))&&(s.endReason!=='eliminated'||(s.ended&&s.route===false&&s.pending===null&&s.medals.at(-1)?.pass===false&&['预赛','复赛'].includes(s.medals.at(-1)?.stage)))&&(!s.ended||s.week===totalDays(s)||(s.endReason==='mood'&&s.stats.mood===0)||s.endReason==='eliminated');}
export function validPlan(plan,state){return Array.isArray(plan)&&plan.every(id=>actions.some(a=>a.id===id))&&plan.reduce((n,id)=>n+actions.find(a=>a.id===id).cost,0)<=budget(state);}

export function migrateSave(saved){
 const state=JSON.parse(JSON.stringify(saved));
 if(state.stats.optics===undefined)state.stats.optics=state.stats.thermal;
 if(state.stats.modern===undefined)state.stats.modern=15;
 state.scienceVersion=2;
 if(state.pending?.title==='窗边的月亮')for(const choice of state.pending.choices){if(choice.gain.thermal!==undefined){choice.gain.optics=choice.gain.thermal;delete choice.gain.thermal;}}
 return state;
}

function validEvent(e,day){
 return !!e&&e.day===day&&typeof e.id==='string'&&typeof e.title==='string'&&typeof e.text==='string'&&Array.isArray(e.choices)&&e.choices.length===2&&e.choices.every(c=>typeof c.name==='string'&&typeof c.result==='string'&&(c.relationship===undefined||typeof c.relationship==='boolean')&&(!c.requires||Object.entries(c.requires).every(([k,v])=>keys.includes(k)&&Number.isFinite(v)))&&c.gain&&Object.entries(c.gain).every(([k,v])=>keys.includes(k)&&Number.isFinite(v)));
}
function validRun(s){
 if(s.runCutoffs===undefined&&s.eventPlan===undefined&&s.worldSeed===undefined&&s.calibration===undefined)return true;
 if(!Number.isInteger(s.worldSeed)||s.worldSeed<0||s.worldSeed>4294967295||!s.runCutoffs||!s.calibration||s.calibration.sampleSize!==1000||s.calibration.worldSeed!==s.worldSeed)return false;
 if(!['preliminary','semifinal','training','gold','silver'].every(k=>Number.isFinite(s.runCutoffs[k])&&s.runCutoffs[k]>=0&&s.runCutoffs[k]<=(k==='preliminary'?320:400)&&s.runCutoffs[k]===s.calibration.cutoffs?.[k]))return false;
 if(s.runCutoffs.training<s.runCutoffs.gold||s.runCutoffs.gold<s.runCutoffs.silver)return false;
 return Array.isArray(s.eventPlan)&&s.eventPlan.length===totalDays(s)&&s.eventPlan.every((slot,i)=>slot&&[null,'single','dating','breakup'].includes(slot.condition)&&validEvent(slot.primary,i+1)&&validEvent(slot.fallback,i+1));
}
