import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,effectiveGain,exam,physicalKeys} from '../game.js';
import {validSave,migrateSave} from '../storage.js';
const make=()=>createGame('坠机测试',['grinder','crash'],()=>.9,null,{balanceVersion:2});
const takeExam=(s,roll)=>{s.week=8;s.stats.mood=100;for(const key of physicalKeys)s.stats[key]=100;const rolls=[.5,.5,roll];return exam(s,()=>rolls.shift());};

test('坠机体质各项正收益提高50%，与行动减半叠加且负收益不变',()=>{
 const s=make();
 for(const key of [...physicalKeys,'school','mood','wealth','popularity']){
  assert.equal(effectiveGain(s,{[key]:4})[key],6);
  assert.equal(effectiveGain(s,{[key]:4},true)[key],3);
  assert.equal(effectiveGain(s,{[key]:-4})[key],-4);
 }
});

test('考试扣分严格按5%、10%、15%、20%、25%、25%划分，边界落入下一档',()=>{
 const counts=new Map();
 for(let i=0;i<100;i++){const r=takeExam(make(),(i+.5)/100);counts.set(r.penalty,(counts.get(r.penalty)||0)+1);assert.equal(r.score,320-r.penalty);}
 assert.deepEqual([...counts],[[120,5],[80,10],[60,15],[40,20],[20,25],[0,25]]);
 for(const [roll,penalty] of [[0,120],[.05,80],[.15,60],[.3,40],[.5,20],[.75,0]])assert.equal(takeExam(make(),roll).penalty,penalty);
 const weak=make();weak.week=8;for(const key of physicalKeys)weak.stats[key]=0;assert.equal(exam(weak,()=>0).score,0);
});

test('新版坠机存档保存倍率和概率版本，旧存档维持原来的25%加成与分布',()=>{
 const s=make();assert.equal(s.crashVersion,2);assert.ok(validSave(s));
 const restored=migrateSave(s);assert.equal(effectiveGain(restored,{mood:4}).mood,6);assert.equal(takeExam(restored,.6).penalty,20);
 const old=make();delete old.crashVersion;assert.ok(validSave(old));assert.equal(effectiveGain(old,{mood:4}).mood,5);assert.equal(takeExam(old,.35).penalty,60);assert.equal(takeExam(old,.6).penalty,40);
 const invalid=make();invalid.crashVersion=3;assert.equal(validSave(invalid),false);
});
