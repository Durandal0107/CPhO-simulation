import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,createEventPlan,markReferenceState,advance,choose,canChoose,settleDailyStats,performAction} from '../game.js';
import {referencePlan,referenceProfile,referenceGoal} from '../reference-policy.js';
import {seededRandom} from '../random.js';

const rules={calendarVersion:3,attributeRulesVersion:1,balanceVersion:2,jiahaoVersion:1,examMoodVersion:1,actionRulesVersion:2};
const freeze=value=>{if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const gameplay=state=>{const {log,activityNotices,...rest}=state;return rest;};

test('模拟快速路径与玩家引擎逐回合一致，共享事件不可被修改且随机调用不变',()=>{
 for(const identity of ['ordinary','elite','prodigy'])for(const talents of [[],['grinder','lost'],['master','crash','headstart','jiahao'],['wealthy','chaos','allin']]){
  const player=createGame('校验',talents.length?talents:['grinder','lost'],()=>.9,identity,rules);
  player.talents=[...talents];
  const schedule=freeze(createEventPlan(player,42));player.eventPlan=schedule;
  const simulation=markReferenceState(structuredClone(player));simulation.eventPlan=schedule;
  const a=seededRandom(71),b=seededRandom(71),profile=referenceProfile(seededRandom(123));
  for(let turn=0;turn<48&&!player.ended;turn++){
   const planA=referencePlan(player,a,referenceGoal(player),profile),planB=referencePlan(simulation,b,referenceGoal(simulation),profile);
   assert.deepEqual(planB,planA);
   assert.deepEqual(advance(simulation,planB,b,{deferQualification:true}),advance(player,planA,a,{deferQualification:true}));
   assert.deepEqual(gameplay(simulation),gameplay(player));
   if(player.pending){
    const available=player.pending.choices.map((c,i)=>canChoose(player,c)?i:null).filter(i=>i!==null);
    const index=available[turn%available.length];
    choose(player,index,a);choose(simulation,index,b);
   }
   assert.deepEqual(gameplay(simulation),gameplay(player));
   assert.equal(b(),a());
  }
  assert.equal(simulation.log.length,0);
 }
});

test('收益缓存随身份、规则、权威增益生效及结束、天赋改变而失效',()=>{
 const state=createGame('校验',['grinder','lost'],()=>.9,'ordinary',rules);state.talents=[];
 const profile=referenceProfile(seededRandom(20));
 const compare=()=>{
  const uncached=structuredClone(state),a=seededRandom(31),b=seededRandom(31);
  assert.deepEqual(referencePlan(state,a,'final',profile),referencePlan(uncached,b,'final',profile));
  assert.equal(a(),b());
 };
 compare();state.stats.mood=90;state.stats.lab=0;compare();
 state.authorityBuff={start:2,end:6};compare();state.week=2;compare();state.week=7;compare();
 for(const identity of ['elite','prodigy','ordinary']){state.identity=identity;compare();state.identityRulesVersion=1;compare();state.identityRulesVersion=2;compare();}
 delete state.actionRulesVersion;compare();state.actionRulesVersion=2;compare();
 delete state.balanceVersion;compare();state.balanceVersion=2;compare();
 state.talents=['master','crash','headstart','jiahao'];compare();state.week=20;compare();state.talents=[];compare();
});

test('快速路径仍执行低心态失败判定及归零结束，玩家日志正常生成',()=>{
 const player=createGame('校验',['grinder','lost'],()=>.9,'elite',rules);player.stats.mood=1;
 const simulation=markReferenceState(structuredClone(player));
 performAction(player,'mechanics',()=>0);performAction(simulation,'mechanics',()=>0);
 settleDailyStats(player);settleDailyStats(simulation);
 assert.deepEqual(gameplay(simulation),gameplay(player));assert.equal(simulation.endReason,'mood');
 assert.ok(player.log.length);assert.equal(simulation.log.length,0);
});
