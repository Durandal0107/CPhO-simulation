import {test} from 'node:test';import assert from 'node:assert/strict';
import {createGame,budget,advance,choose,exam,effectiveGain,dailyEvent,beginDay,totalDays,competitionDay,validTalents,physicalKeys} from '../game.js';import {validSave} from '../storage.js';
const game=(ids)=>createGame('天赋测试',ids,()=>.9);
test('新开局分类选择与旧存档兼容',()=>{assert.ok(validTalents(['grinder','chaos']));assert.ok(validTalents(['master','lost','jiahao','headstart','allin']));assert.ok(!validTalents(['grinder','master','lost']));assert.throws(()=>game(['jiahao','lost']));assert.ok(validSave(game(['grinder','chaos'])));assert.ok(validSave(createGame('旧存档',['calm','hands'])));assert.equal(budget(game(['grinder','crash'])),7);});
test('家财万贯按每7天翻倍财富、人缘加1',()=>{const s=game(['wealthy','chaos']);for(let d=1;d<=14;d++){advance(s,['rest'],()=>.6,{deferQualification:true});choose(s,1,()=>.9);}assert.equal(s.stats.wealth,400);assert.equal(s.stats.popularity,12);assert.ok(validSave(s));});
test('提前准备倍率、日期与最后一天结局',()=>{const s=game(['grinder','lost','headstart']);assert.equal(totalDays(s),36);assert.equal(competitionDay(s),-11);assert.ok(Math.abs(effectiveGain(s,{mechanics:3}).mechanics-2.1)<1e-9);s.week=12;assert.ok(Math.abs(effectiveGain(s,{mechanics:3}).mechanics-2.1)<1e-9);s.week=13;assert.ok(Math.abs(effectiveGain(s,{mechanics:3}).mechanics-2.7)<1e-9);Object.assign(s.stats,{mechanics:90,electro:90,thermal:90,optics:90,modern:90,lab:90});s.week=20;advance(s,['rest'],()=>.5);assert.equal(s.medals[0].stage,'预赛');choose(s,1,()=>.9);s.week=36;advance(s,['rest'],()=>.5);assert.equal(s.ended,false);choose(s,1,()=>.9);assert.equal(s.ended,true);assert.ok(validSave(s));});
test('嘉豪心态减耗、初始人缘与专属事件概率边界',()=>{const s=game(['master','chaos','jiahao']);assert.equal(s.stats.popularity,8);assert.equal(effectiveGain(s,{mood:-5}).mood,-4);assert.equal(dailyEvent(s,()=>.099).id,'jiahao-special');assert.notEqual(dailyEvent(s,()=>.1).id,'jiahao-special');});
test('破釜沉舟文化课始终归零、物竞正收益提高50%',()=>{const s=game(['grinder','lost','allin']);assert.equal(s.stats.school,0);assert.equal(effectiveGain(s,{mechanics:3}).mechanics,4.5);advance(s,['school'],()=>.5);choose(s,0,()=>.9);assert.equal(s.stats.school,0);});
test('精神错乱每个属性独立覆盖九种等概率偏移',()=>{const s=game(['grinder','chaos']);for(let i=0;i<9;i++){assert.equal(effectiveGain(s,{mechanics:3},true,()=> (i+.5)/9).mechanics,3+i-5);}let rolls=[0,.999];assert.deepEqual(effectiveGain(s,{mechanics:3,mood:-5},true,()=>rolls.shift()),{mechanics:-2,mood:-2});});
test('坠机体质正收益、五种扣分区间与预赛320分计分',()=>{for(const [roll,penalty] of [[.01,120],[.1,80],[.3,60],[.6,40],[.95,0]]){const s=game(['grinder','crash']);Object.assign(s.stats,{mechanics:100,electro:100,thermal:100,optics:100,modern:100,lab:100,mood:100});s.week=8;let rolls=[.5,.5,roll];const r=exam(s,()=>rolls.shift());assert.equal(r.maxScore,320);assert.equal(r.score,320-penalty);assert.equal(r.penalty,penalty);assert.equal(effectiveGain(s,{mechanics:4}).mechanics,5);}});
test('大手仅在复赛20%概率无视分数晋级',()=>{const s=game(['master','chaos']);s.week=16;let rolls=[.5,.5,.199];assert.equal(exam(s,()=>rolls.shift()).gifted,true);const t=game(['master','chaos']);t.week=16;rolls=[.5,.5,.2];assert.equal(exam(t,()=>rolls.shift()).pass,false);});
test('迷失当天只抽一次，扣行动点并保存结果',()=>{const s=game(['grinder','lost']);s.stats.mood=40;beginDay(s,()=>.099);assert.equal(budget(s),5);assert.equal(s.stats.mood,45);assert.ok(validSave(JSON.parse(JSON.stringify(s))));beginDay(s,()=>.1);assert.equal(budget(s),7);});

test('旧起跑线存档保留原赛程与倍率',()=>{const s=game(['grinder','lost','headstart']);delete s.calendarPrep;delete s.headstartMultipliers;assert.equal(totalDays(s),30);assert.equal(effectiveGain(s,{mechanics:3}).mechanics,1.5);s.week=7;assert.ok(Math.abs(effectiveGain(s,{mechanics:3}).mechanics-2.4)<1e-9);assert.ok(validSave(s));});

test('破釜沉舟覆盖五项理论和实验，保持行动减半、心态及负收益规则',()=>{
 const s=game(['grinder','lost','allin']);s.balanceVersion=2;
 for(const key of physicalKeys){
  assert.equal(effectiveGain(s,{[key]:4},true)[key],3);
  assert.equal(effectiveGain(s,{[key]:4})[key],6);
  assert.equal(effectiveGain(s,{[key]:-1},true)[key],-1);
 }
 assert.deepEqual(effectiveGain(s,{mood:2,popularity:2,school:4},true),{mood:1,popularity:1,school:0});
 assert.equal(effectiveGain(s,{mood:-5},true).mood,-5);
 s.authorityBuff={start:2,end:6};s.week=2;
 assert.equal(effectiveGain(s,{mechanics:4},true).mechanics,6);
});

test('旧破釜沉舟存档继续按原倍率，新存档保存50%加成',()=>{
 const s=game(['grinder','lost','allin']);assert.equal(s.allinMultiplier,1.5);
 const restored=JSON.parse(JSON.stringify(s));assert.ok(validSave(restored));assert.equal(effectiveGain(restored,{lab:4}).lab,6);
 delete restored.allinMultiplier;assert.ok(validSave(restored));assert.equal(effectiveGain(restored,{lab:4}).lab,8);
 s.allinMultiplier=1.7;assert.ok(!validSave(s));
});
