import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,actions,effectiveGain,budget,advance,performAction,settleDailyStats,exam,physicalKeys} from '../game.js';
import {validSave,validPlan,migrateSave} from '../storage.js';
import {referencePlan} from '../reference-policy.js';
const make=(talents=['grinder','lost'],identity=null)=>createGame('行动规则',talents,()=>.9,identity,{actionRulesVersion:2,balanceVersion:2,attributeRulesVersion:1});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('七项学习行动心态消耗减半，学习正收益与散步回复保持既有规则',()=>{
 const s=make();
 const moods={mechanics:-2.5,electro:-2.5,thermal:-2,optics:-2,modern:-2,lab:-1.5,school:-.5,rest:1};
 for(const action of actions){
  const gain=effectiveGain(s,action.gain,true);assert.equal(gain.mood,moods[action.id]);
  const old={...s};delete old.actionRulesVersion;
  for(const key of Object.keys(gain).filter(k=>k!=='mood'))assert.equal(gain[key],effectiveGain(old,action.gain,true)[key]);
 }
});

test('减耗叠加嘉豪和强校，成功及失败仍按开始时心态独立判定',()=>{
 const mixed=make(['grinder','lost','jiahao'],'elite');near(effectiveGain(mixed,{mood:-5},true).mood,-2.2);
 near(effectiveGain(mixed,{mood:-5},true,null,'failure').mood,-4.4);near(effectiveGain(mixed,{mood:-5},true,null,'success').mood,-1.1);
 const low=make();low.stats.mood=20;performAction(low,'mechanics',()=>0);assert.equal(low.stats.mood,15);assert.equal(low.stats.mechanics,18.75);
 const high=make();high.stats.mood=80;performAction(high,'mechanics',()=>0);assert.equal(high.stats.mood,78.75);assert.equal(high.stats.mechanics,21);
});

test('精神错乱偏移后按符号减半，只缩放负心态',()=>{
 const s=make(['grinder','chaos']);assert.equal(effectiveGain(s,{mood:2},true,()=>0).mood,-1.5);
 assert.equal(effectiveGain(s,{mood:-1},true,()=>.999).mood,1);
});

test('事件惩罚、考后心态和每日固定回复不受行动减耗影响',()=>{
 const s=make();assert.equal(effectiveGain(s,{mood:-20}).mood,-20);s.stats.mood=50;s.stats.school=50;settleDailyStats(s);assert.equal(s.stats.mood,53);
 for(const [ability,effect]of [[100,10],[0,-20]]){
  const player=make();player.week=8;player.examMoodVersion=1;player.stats.mood=60;for(const key of physicalKeys)player.stats[key]=ability;
  const r=exam(player,()=>.5);assert.equal(r.moodEffect,effect);assert.equal(player.stats.mood,60+effect);
 }
});

test('基础行动点4，天赋及身份加点和恋爱、迷失扣点叠加',()=>{
 assert.equal(budget(make(['master','lost'])),4);
 assert.equal(budget(make(['master','lost'],'ordinary')),5);
 const s=make(['grinder','lost'],'ordinary');assert.equal(budget(s),6);s.relationship=true;s.dailyPenalty=2;assert.equal(budget(s),3);
 assert.ok(validPlan(['mechanics','rest'],s));assert.equal(validPlan(['mechanics','electro'],s),false);
 const low=make(['master','lost'],'elite');low.relationship=true;low.dailyPenalty=2;assert.equal(budget(low),1);assert.ok(validPlan(['rest'],low));
 const before=JSON.stringify(low);assert.throws(()=>advance(low,['mechanics'],()=>.5));assert.equal(JSON.stringify(low),before);
});

test('模拟规划使用缩减后的完整预算，不追加行动点',()=>{
 const s=make(['master','lost'],'ordinary');s.talents=[];
 const plan=referencePlan(s,()=>.5,'preliminary',{moodReserve:55,schoolFloor:0,focus:Object.fromEntries(physicalKeys.map(k=>[k,1]))});
 assert.equal(plan.reduce((sum,id)=>sum+actions.find(a=>a.id===id).cost,0),5);assert.ok(validPlan(plan,s));
});

test('新规则可以保存和恢复，旧存档保留6基础点及完整心态消耗',()=>{
 const s=make(['grinder','lost'],'ordinary');const restored=migrateSave(JSON.parse(JSON.stringify(s)));assert.ok(validSave(restored));assert.deepEqual(restored,s);assert.equal(restored.actionRulesVersion,2);
 const old=JSON.parse(JSON.stringify(s));delete old.actionRulesVersion;assert.ok(validSave(old));assert.equal(budget(old),8);assert.equal(effectiveGain(old,{mood:-5},true).mood,-5);
 restored.actionRulesVersion=3;assert.equal(validSave(restored),false);
});
