import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,exam,physicalKeys} from '../game.js';
import {validSave} from '../storage.js';

const make=(day,identity=null)=>{
 const s=createGame('大手测试',['master','crash'],()=>.9,identity);s.week=day;
 for(const key of physicalKeys)s.stats[key]=50;
 s.stats.mood=100;
 return s;
};

test('新大手固定加分且预赛无效果，不额外抽取直通概率',()=>{
 for(const [day,base,bonus,score] of [[8,160,0,160],[16,200,125/3,242],[24,200,175/4,244]]){
  const s=make(day);assert.equal(s.masterVersion,2);assert.equal(s.masterProbability,undefined);
  const rolls=[.5,.5,.95];const r=exam(s,()=>{assert.ok(rolls.length);return rolls.shift();});
  assert.equal(r.scoreBeforeBonus,base);assert.equal(r.masterBonus,bonus);assert.equal(r.score,score);assert.equal(r.gifted,false);assert.equal(rolls.length,0);
  assert.ok(validSave(JSON.parse(JSON.stringify(s))));
 }
});

test('大手跟随本场分数线与强省强校倍率，决赛采用集训队线',()=>{
 const s=make(16,'elite');
 s.yearCutoffs=[null,{preliminary:90,semifinal:120,training:240,gold:220,silver:200}];
 const semi=exam(s,()=>.95);assert.equal(semi.cutoffsAtExam.semifinal,156);assert.equal(semi.masterBonus,52);assert.equal(semi.score,252);
 s.week=24;const final=exam(s,()=>.95);assert.equal(final.masterBonus,60);assert.equal(final.score,260);assert.equal(final.training,true);
 const snapshot=JSON.stringify(semi);s.yearCutoffs[1].semifinal=300;assert.equal(JSON.stringify(semi),snapshot);
});

test('大手不能无条件晋级，加分达到满分后仍会扣坠机分',()=>{
 const low=make(16);for(const key of physicalKeys)low.stats[key]=0;
 const fail=exam(low,()=>.95);assert.equal(fail.score,42);assert.equal(fail.pass,false);assert.equal(low.route,false);
 const full=make(24);for(const key of physicalKeys)full.stats[key]=100;
 const rolls=[.5,.5,.01];const r=exam(full,()=>rolls.shift());assert.equal(r.scoreBeforeBonus,400);assert.equal(r.masterBonus,43.75);assert.equal(r.scoreBeforePenalty,400);assert.equal(r.penalty,120);assert.equal(r.score,280);assert.ok(validSave(full));
});

test('大手加分记录和版本损坏会拒绝，正常读档保留效果',()=>{
 const s=make(16);exam(s,()=>.95);const restored=JSON.parse(JSON.stringify(s));assert.ok(validSave(restored));assert.equal(restored.masterVersion,2);
 for(const mutate of [s=>s.masterVersion=3,s=>s.medals[0].masterBonus+=1,s=>s.medals[0].scoreBeforeBonus+=1,s=>s.medals[0].gifted=true,s=>delete s.medals[0].scoreBeforeBonus,s=>s.medals[0].masterBonus=-1]){
  const bad=JSON.parse(JSON.stringify(s));mutate(bad);assert.equal(validSave(bad),false);
 }
});
