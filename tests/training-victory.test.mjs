import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,advance,choose,exam,ending,checkTrainingVictory,physicalKeys,effectiveGain,budget,examThreshold} from '../game.js';
import {validSave,migrateSave} from '../storage.js';
import {createCalibratedGame} from '../calibration.js';
const make=(talents=['grinder','lost'],calendarVersion=3)=>{
 const s=createGame('集训队',talents,()=>.9,'elite',{calendarVersion,identityRulesVersion:4,actionRulesVersion:3,balanceVersion:2,attributeRulesVersion:2});
 for(const key of physicalKeys)s.stats[key]=100;s.stats.mood=100;s.stats.school=50;return s;
};

test('强校新版学习15%、负心态10%，其他身份及预复赛线倍率不变',()=>{
 const s=make();for(const key of [...physicalKeys,'school'])assert.ok(Math.abs(effectiveGain(s,{[key]:3},true)[key]-1.15)<1e-9);
 assert.equal(effectiveGain(s,{mechanics:3}).mechanics,3);assert.equal(effectiveGain(s,{mood:-5},true).mood,-2.75);assert.equal(effectiveGain(s,{mood:-10}).mood,-11);assert.equal(effectiveGain(s,{mood:2},true).mood,1);
 s.talents.push('jiahao');assert.ok(Math.abs(effectiveGain(s,{mood:-5},true).mood+2.2)<1e-9);
 assert.equal(examThreshold(s,8),75*1.3);assert.equal(examThreshold(s,16),125*1.3);assert.equal(examThreshold(s,24),166);
 s.identity='prodigy';assert.ok(Math.abs(effectiveGain(s,{mechanics:3},true).mechanics-1.1)<1e-9);
 s.identity='ordinary';for(let week=1;week<=4;week++){s.week=week;assert.equal(budget(s),5+(week%2===0?1:0));}
});

test('任一年级进入集训队立即胜利，不触发当天事件或后续回合',()=>{
 for(const headstart of [false,true])for(const week of (headstart?[12,24,36,48]:[12,24,36])){
  const s=make(['grinder','lost',...(headstart?['headstart']:[])]);s.week=week;
  const r=advance(s,['rest'],()=>.5);assert.equal(r.training,true);assert.equal(r.title,'进入集训队');assert.equal(s.ended,true);assert.equal(s.endReason,'training');assert.equal(ending(s),'游戏胜利');assert.equal(s.pending,null);assert.equal(s.week,week);
  assert.ok(s.log.some(x=>x.text.includes('进入集训队')));assert.throws(()=>advance(s,['rest']));assert.throws(()=>choose(s,0));
 }
});

test('刚好集训队线获胜，只有金牌继续；大手加分和坠机扣分后才判定',()=>{
 const exact=make();exact.week=12;for(const key of physicalKeys)exact.stats[key]=43.75;assert.equal(exam(exact,()=>.5).score,175);assert.equal(exact.endReason,'training');
 const gold=make();gold.week=12;for(const key of physicalKeys)gold.stats[key]=43;const r=advance(gold,['rest'],()=>.5);assert.equal(r.title,'国赛金牌');assert.equal(r.training,false);assert.equal(gold.ended,false);assert.ok(gold.pending);
 const master=make(['master','lost']);master.week=12;for(const key of physicalKeys)master.stats[key]=40;assert.equal(exam(master,()=>.5).training,true);assert.equal(master.endReason,'training');
 const crash=make(['grinder','crash']);crash.week=12;crash.runCutoffs={preliminary:75,semifinal:125,training:350,gold:250,silver:200};const penalty=exam(crash,()=>0);assert.equal(penalty.penalty,120);assert.equal(penalty.training,false);assert.equal(crash.ended,false);
});

test('校准推迟资格结算，不按旧静态集训队线提前结束模拟',()=>{
 const s=make();s.week=12;const r=advance(s,['rest'],()=>.5,{deferQualification:true});assert.equal(r.training,true);assert.equal(s.ended,false);assert.ok(s.pending);choose(s,0,()=>.9);assert.equal(s.week,13);
});

test('提前胜利可保存恢复，旧集训队结果可转为胜利，无效胜利存档拒绝',()=>{
 const s=createCalibratedGame({name:'存档校验',talents:['grinder','lost'],identity:'elite',seed:42});s.week=12;s.stats.mood=100;for(const key of physicalKeys)s.stats[key]=100;
 advance(s,['rest'],()=>.9);assert.equal(s.endReason,'training');assert.ok(validSave(s));assert.deepEqual(migrateSave(s),s);
 for(const mutate of [t=>t.ended=false,t=>t.medals.at(-1).training=false,t=>t.medals.at(-1).score=0,t=>t.medals.at(-1).title='国赛金牌',t=>t.stats.mood=0]){const bad=structuredClone(s);mutate(bad);assert.equal(validSave(bad),false);}
 const old=structuredClone(s);old.ended=false;delete old.endReason;old.medals.at(-1).title='国赛金牌';assert.ok(validSave(old));assert.equal(checkTrainingVictory(old),true);assert.ok(validSave(old));assert.equal(ending(old),'游戏胜利');
 const zero=structuredClone(old);zero.stats.mood=0;zero.endReason='mood';assert.equal(checkTrainingVictory(zero),false);assert.equal(ending(zero),'GAMEOVER');
});
