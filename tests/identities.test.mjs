import {cutoffs} from '../cutoffs.js';
import {test} from 'node:test';import assert from 'node:assert/strict';import {createGame,effectiveGain,budget,examThreshold,exam,advance} from '../game.js';import {validSave,validPlan} from '../storage.js';
const game=(identity,talents=['grinder','lost'])=>createGame('身份测试',talents,()=>.9,identity);
test('身份保存、恢复与非法身份拒绝；旧存档可读取',()=>{for(const id of ['elite','prodigy','ordinary'])assert.ok(validSave(JSON.parse(JSON.stringify(game(id)))));assert.throws(()=>game('invalid'));assert.ok(!validSave({...game('elite'),identity:'invalid'}));const old=game(null);delete old.identity;assert.ok(validSave(old));});
test('两种学习身份只提高正学习收益，不增加休息心态或事件奖励',()=>{const a=game('elite'),b=game('prodigy');assert.ok(Math.abs(effectiveGain(a,{mechanics:3,school:2},true).mechanics-3.3)<1e-10);assert.ok(Math.abs(effectiveGain(b,{mechanics:3},true).mechanics-3.15)<1e-10);assert.equal(effectiveGain(a,{mood:2},true).mood,2);assert.equal(effectiveGain(b,{lab:4}).lab,4);assert.equal(effectiveGain(a,{mood:-5}).mood,-5.5);});
test('强校心态消耗与嘉豪、学习加成与破釜沉舟乘法叠加',()=>{const s=game('elite',['grinder','lost','jiahao','allin']);assert.equal(effectiveGain(s,{mood:-5}).mood,-4.4);assert.ok(Math.abs(effectiveGain(s,{mechanics:3},true).mechanics-4.95)<1e-10);assert.equal(effectiveGain(s,{school:2},true).school,0);});
test('一般路过+1行动点与卷卷、恋爱及迷失叠加',()=>{const s=game('ordinary');assert.equal(budget(s),8);s.relationship=true;s.dailyPenalty=2;assert.equal(budget(s),5);assert.ok(validPlan(['mechanics','electro','rest'],s));assert.ok(!validPlan(['mechanics','electro','lab'],s));});
test('强校只提高预复赛晋级线，实际考试按新线判定',()=>{const s=game('elite');assert.equal(examThreshold(s,8),cutoffs.preliminary*1.3);assert.ok(Math.abs(examThreshold(s,16)-cutoffs.semifinal*1.3)<1e-9);assert.equal(examThreshold(s,24),cutoffs.gold);Object.assign(s.stats,{mechanics:30,electro:30,thermal:30,optics:30,modern:30,lab:30,mood:100});s.week=8;assert.equal(exam(s,()=>.5).pass,false);const normal=game('prodigy');Object.assign(normal.stats,s.stats);normal.week=8;assert.equal(exam(normal,()=>.5).pass,true);});
test('身份加成实际作用于每日结算',()=>{const s=game('prodigy');advance(s,['mechanics'],()=>.5);assert.ok(Math.abs(s.stats.mechanics-21.15)<1e-9);});

test('旧身份存档保留学习20%／15%及路过2行动点，新身份参数保存恢复',()=>{
 for(const [id,oldGain,newGain] of [['elite',3.6,3.3],['prodigy',3.45,3.15],['ordinary',3,3]]){
  const fresh=game(id);assert.equal(fresh.identityRulesVersion,2);assert.ok(Math.abs(effectiveGain(fresh,{mechanics:3},true).mechanics-newGain)<1e-9);
  const restored=JSON.parse(JSON.stringify(fresh));assert.ok(validSave(restored));assert.equal(restored.identityRulesVersion,2);
  delete restored.identityRulesVersion;assert.ok(validSave(restored));assert.ok(Math.abs(effectiveGain(restored,{mechanics:3},true).mechanics-oldGain)<1e-9);
  if(id==='ordinary'){assert.equal(budget(fresh),8);assert.equal(budget(restored),9);}
  const legacy=createGame('旧规则',['grinder','lost'],()=>.9,id,{identityRulesVersion:1});assert.equal(legacy.identityRulesVersion,undefined);assert.ok(validSave(legacy));assert.equal(budget(legacy),budget(restored));
 }
 const broken=game('elite');broken.identityRulesVersion=3;assert.equal(validSave(broken),false);
});

test('新版学习加成覆盖七项学习属性，并叠加行动收益减半',()=>{
 for(const [id,expected]of [['elite',1.65],['prodigy',1.575]]){
  const s=game(id);s.balanceVersion=2;
  for(const key of ['mechanics','electro','thermal','optics','modern','lab','school']){
   assert.ok(Math.abs(effectiveGain(s,{[key]:3},true)[key]-expected)<1e-9);
   assert.equal(effectiveGain(s,{[key]:-1},true)[key],-1);
   assert.equal(effectiveGain(s,{[key]:3})[key],3);
  }
 }
});
