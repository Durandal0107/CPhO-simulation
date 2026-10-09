import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,advance,performAction,settleDailyStats,rollActivityJudgement,choose,applyGain} from '../game.js';
import {validSave,migrateSave} from '../storage.js';
import {createCalibratedGame} from '../calibration.js';
const make=(talents=['grinder','lost'],identity=null)=>createGame('属性测试',talents,()=>.9,identity,{attributeRulesVersion:1});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('文化课自然下降后判定严格门槛；每日人缘为相应公式并有上下限',()=>{
 for(const [before,mood]of [[32,52],[33,53],[63,53],[64,54]]){const s=make();s.stats.school=before;s.stats.mood=50;settleDailyStats(s);assert.equal(s.stats.school,before-3);assert.equal(s.stats.mood,mood);near(s.stats.popularity,10+(before-3-50)*.05);}
 const low=make();low.stats.school=0;low.stats.popularity=1;settleDailyStats(low);assert.equal(low.stats.popularity,0);
 const high=make();high.stats.popularity=99.9;settleDailyStats(high);assert.equal(high.stats.popularity,100);
});
test('文化课固定心态变动不乘天赋倍率，焦虑归零时不得随后自然恢复',()=>{
 const s=make(['grinder','crash','headstart','jiahao'],'elite');s.stats.school=29;s.stats.mood=50;settleDailyStats(s);assert.equal(s.stats.mood,52);
 s.stats.school=80;s.stats.mood=50;settleDailyStats(s);assert.equal(s.stats.mood,54);
 const t=make();t.stats.school=20;t.stats.mood=1;settleDailyStats(t);assert.equal(t.stats.mood,0);assert.equal(t.endReason,'mood');
});
test('心态和概率严格边界，每次活动只判定一次，正常区间不抽随机数',()=>{
 const s=make();s.stats.mood=24;assert.equal(rollActivityJudgement(s,()=>.49999),'failure');assert.equal(rollActivityJudgement(s,()=>.5),null);
 s.stats.mood=76;assert.equal(rollActivityJudgement(s,()=>.24999),'success');assert.equal(rollActivityJudgement(s,()=>.25),null);
 for(const mood of [25,50,75]){s.stats.mood=mood;assert.equal(rollActivityJudgement(s,()=>{throw Error('正常心态不应抽随机数');}),null);}
});
test('成功和失败分别放大正负收益，倍率与已有身份天赋叠加',()=>{
 const s=make();s.stats.mood=80;performAction(s,'mechanics',()=>0);assert.equal(s.stats.mechanics,24);assert.equal(s.stats.mood,77.5);assert.equal(s.activityNotices[0].judgement,'success');
 const t=make();t.stats.mood=20;performAction(t,'mechanics',()=>0);assert.equal(t.stats.mechanics,19.5);assert.equal(t.stats.mood,10);assert.equal(t.activityNotices[0].judgement,'failure');
 const u=make(['grinder','crash','headstart','jiahao'],'elite');u.stats.mood=80;performAction(u,'mechanics',()=>0);near(u.stats.mechanics,24.93);near(u.stats.mood,77.8);
});
test('连续活动按各自开始时心态判定；失败归零立即停止后续活动',()=>{
 const s=make();s.stats.mood=26;advance(s,['mechanics','mechanics'],()=>0);near(s.stats.mechanics,22.5);assert.equal(s.activityNotices.length,1);assert.equal(s.activityNotices[0].sequence,2);assert.equal(s.activityNotices[0].moodAtAction,21);
 const t=make();t.stats.mood=8;advance(t,['mechanics','rest'],()=>0);assert.equal(t.endReason,'mood');assert.equal(t.pending,null);assert.equal(t.stats.mood,0);assert.equal(t.activityNotices.length,1);assert.ok(validSave(t));
});
test('判定仅影响活动，事件及自然结算不受它影响；实际变化考虑上限',()=>{
 const s=make();s.stats.mood=99;performAction(s,'rest',()=>0);near(s.activityNotices[0].gain.mood,1);near(s.activityNotices[0].gain.school,2/3);
 s.stats.mood=80;applyGain(s,{mechanics:3,mood:-5});assert.equal(s.stats.mood,75);
});
test('判定弹窗可续存，下一天清除；非法弹窗记录及考试索引被拒绝',()=>{
 const s=make();s.stats.mood=80;advance(s,['mechanics'],()=>0);assert.ok(validSave(s));assert.deepEqual(migrateSave(s),s);
 for(const mutate of [t=>t.activityNotices[0].judgement='unknown',t=>t.activityNotices[0].moodAtAction=50,t=>t.activityNotices[0].gain.unknown=2,t=>t.examNotice=0]){const bad=JSON.parse(JSON.stringify(s));mutate(bad);assert.equal(validSave(bad),false);}
 choose(s,1,()=>.9);assert.deepEqual(s.activityNotices,[]);assert.ok(validSave(s));
});
test('新局和10000次校准使用相同属性规则；旧存档保持原规则',()=>{
 const config={name:'测试',talents:['grinder','lost'],identity:'ordinary',seed:42};const s=createCalibratedGame(config);assert.equal(s.attributeRulesVersion,2);assert.equal(s.calibration.attributeRulesVersion,2);assert.deepEqual(s,createCalibratedGame(config));assert.ok(validSave(s));
 const broken=JSON.parse(JSON.stringify(s));delete broken.calibration.attributeRulesVersion;assert.equal(validSave(broken),false);
 const old=createGame('旧局',['grinder','lost'],()=>.9);old.stats.mood=80;advance(old,['rest'],()=>0);assert.equal(old.stats.mood,85);assert.equal(old.stats.popularity,10);assert.equal(old.activityNotices,undefined);
});

const revised=(talents=['grinder','lost'],identity=null)=>createGame('文化课新规则',talents,()=>.9,identity,{attributeRulesVersion:2,identityRulesVersion:3,actionRulesVersion:3,balanceVersion:2,jiahaoVersion:1});
test('新版文化课严格使用30和70门槛，固定心态±2，人缘公式及上下限不变',()=>{
 for(const [before,mood]of [[32,51],[33,53],[63,53],[73,53],[74,55]]){
  const s=revised();s.stats.school=before;s.stats.mood=50;settleDailyStats(s);
  assert.equal(s.stats.school,before-3);assert.equal(s.stats.mood,mood);
  near(s.stats.popularity,10+(before-3-50)*.05);
  const text=s.log.map(x=>x.text);
  assert.equal(text.includes('焦虑：文化课低于30，心态 −2。'),before<33);
  assert.equal(text.includes('自在：文化课高于70，心态 +2。'),before>73);
 }
 const low=revised();low.stats.school=0;low.stats.popularity=1;settleDailyStats(low);assert.equal(low.stats.popularity,0);
 const high=revised();high.stats.school=100;high.stats.popularity=99.9;high.stats.mood=99;settleDailyStats(high);assert.equal(high.stats.popularity,100);assert.equal(high.stats.mood,100);
});
test('新版文化课固定变化不叠加身份天赋和权威，焦虑归零立即结束',()=>{
 const s=revised(['grinder','crash','headstart','jiahao'],'elite');s.week=2;s.authorityBuff={start:2,end:6};
 s.stats.school=32;s.stats.mood=50;settleDailyStats(s);assert.equal(s.stats.mood,51);
 s.stats.school=74;s.stats.mood=50;settleDailyStats(s);assert.equal(s.stats.mood,55);
 const fatal=revised();fatal.stats.school=20;fatal.stats.mood=2;settleDailyStats(fatal);assert.equal(fatal.stats.mood,0);assert.equal(fatal.endReason,'mood');assert.ok(!fatal.log.some(x=>x.text.startsWith('每日自然恢复')));
});
test('新版继续活动成功／失败判定和存档恢复，旧版保持原60门槛及±1',()=>{
 const fresh=revised();fresh.stats.mood=80;performAction(fresh,'mechanics',()=>0);
 assert.equal(fresh.activityNotices[0].judgement,'success');near(fresh.stats.mechanics,20);assert.ok(validSave(fresh));assert.deepEqual(migrateSave(fresh),fresh);
 const failed=revised();failed.stats.mood=20;performAction(failed,'mechanics',()=>0);assert.equal(failed.activityNotices[0].judgement,'failure');near(failed.stats.mechanics,18.5);
 const old=make();old.stats.school=64;old.stats.mood=50;settleDailyStats(old);assert.equal(old.stats.mood,54);assert.ok(validSave(old));
 fresh.attributeRulesVersion=3;assert.equal(validSave(fresh),false);
});
