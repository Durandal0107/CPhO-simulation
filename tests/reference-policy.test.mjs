import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,actions,budget,advance,physicalKeys} from '../game.js';
import {referencePlan,referenceChoice,referenceGoal} from '../reference-policy.js';
const make=()=>{const s=createGame('参考角色',['grinder','lost'],()=>.9,'ordinary',{balanceVersion:2,attributeRulesVersion:1});s.talents=[];return s;};
const profile={moodReserve:55,schoolFloor:0,focus:Object.fromEntries(physicalKeys.map(k=>[k,1]))};
test('参考角色用完行动点，预赛不训练不计分科目，规划不修改实际状态',()=>{
 const s=make(),before=JSON.stringify(s),plan=referencePlan(s,()=>.5,'preliminary',profile);
 assert.equal(JSON.stringify(s),before);
 assert.equal(plan.reduce((sum,id)=>sum+actions.find(a=>a.id===id).cost,0),budget(s));
 assert.ok(plan.includes('mechanics')||plan.includes('electro'));
 assert.ok(!plan.includes('modern')&&!plan.includes('lab'));
});
test('低心态保命，高分科目已满级后优先休息',()=>{
 const s=make();s.stats.mood=5;const plan=referencePlan(s,()=>.5,'preliminary',profile);assert.ok(plan.every(id=>id==='rest'));advance(s,plan,()=>.9,{deferQualification:true});assert.equal(s.ended,false);
 const full=make();for(const k of ['mechanics','electro','thermal','optics'])full.stats[k]=100;
 assert.ok(referencePlan(full,()=>.5,'preliminary',profile).every(id=>id==='rest'));
});
test('规划时逐项预估心态，避免计划末尾继续透支；弱科优先',()=>{
 const s=make();s.stats.mood=61;s.stats.mechanics=100;s.stats.electro=10;
 const plan=referencePlan(s,()=>.5,'preliminary',profile);assert.equal(plan[0],'electro');assert.ok(plan.includes('rest'));
 advance(s,plan,()=>.9,{deferQualification:true});assert.ok(s.stats.mood>=profile.moodReserve);
});
test('训练目标跟随当年考试阶段，复赛与决赛纳入实验和近代',()=>{
 const s=make();for(const [week,goal]of [[8,'preliminary'],[10,'semifinal'],[12,'final'],[20,'preliminary']]){s.week=week;assert.equal(referenceGoal(s),goal);}
 for(const k of physicalKeys)s.stats[k]=100;s.stats.lab=0;s.stats.mood=90;
 assert.equal(referencePlan(s,()=>.5,'final',profile)[0],'lab');
});
test('事件选择遵守能力门槛，回避致死选项，在低心态时优先恢复',()=>{
 const s=make();s.stats.mood=10;s.pending={choices:[{gain:{mechanics:100,mood:-20}},{gain:{mood:3}},{gain:{mechanics:100},requires:{mechanics:90}}]};
 assert.equal(referenceChoice(s,()=>.5,'preliminary',profile),1);
 s.stats.mood=70;s.pending={choices:[{gain:{mechanics:3}},{gain:{mood:1}}]};assert.equal(referenceChoice(s,()=>.5,'preliminary',profile),0);
});
