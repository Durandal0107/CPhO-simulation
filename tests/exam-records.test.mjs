import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,exam,physicalKeys,examThreshold,awardThreshold} from '../game.js';
import {validSave} from '../storage.js';
test('截图中的心态、扣分与最终成绩可以逐项核对',()=>{
 const s=createGame('陈梓涵',['grinder','crash'],()=>.9);s.week=24;s.stats.mood=79.84;for(const k of physicalKeys)s.stats[k]=67.45;
 const rolls=[.5,.5,.1],r=exam(s,()=>rolls.shift());assert.equal(r.performanceFactor,.9496);assert.equal(r.scoreBeforePenalty,256);assert.equal(r.penalty,80);assert.equal(r.score,176);assert.ok(validSave(s));
});
test('记录只保存本场分数线和身份倍率，后续状态变化不改写结果',()=>{
 for(const [day,keys]of [[8,['preliminary']],[16,['semifinal']],[24,['training','gold','silver']]]){
  const s=createGame('考试记录',['grinder','lost'],()=>.9,'elite');s.week=day;const r=exam(s,()=>.5);assert.deepEqual(Object.keys(r.cutoffsAtExam),keys);assert.equal(r.cutoffMultiplier,day===24?1:1.3);
  assert.equal(r.cutoffsAtExam[keys[0]],day===24?awardThreshold(s,'training'):examThreshold(s,day));
  const before=JSON.stringify(r);s.identity='ordinary';s.week=24;s.runCutoffs={preliminary:1,semifinal:1,training:1,gold:1,silver:1};assert.equal(JSON.stringify(r),before);
 }
});
test('损坏的成绩计算与本场分数线记录不能读取',()=>{
 const s=createGame('考试记录',['grinder','lost'],()=>.9);s.week=8;exam(s,()=>.5);assert.ok(validSave(s));
 for(const mutate of [r=>r.scoreBeforePenalty+=1,r=>r.cutoffsAtExam.semifinal=1,r=>r.cutoffsAtExam.preliminary=-1,r=>r.cutoffMultiplier=2]){const bad=JSON.parse(JSON.stringify(s));mutate(bad.medals[0]);assert.equal(validSave(bad),false);}
});
