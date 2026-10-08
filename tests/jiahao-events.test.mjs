import {test} from 'node:test';import assert from 'node:assert/strict';
import {createGame,randomEvent,createEventPlan,dailyEvent,choose,effectiveGain,authorityBuffDays,beginDay,settleDailyStats,advance,budget,physicalKeys} from '../game.js';
import {createCalibratedGame} from '../calibration.js';import {validSave,migrateSave} from '../storage.js';
const make=ids=>createGame('嘉豪测试',ids||['grinder','lost','jiahao'],()=>.9,null,{balanceVersion:2,attributeRulesVersion:1,jiahaoVersion:1});
const draw=(s,...rolls)=>randomEvent(s,()=>rolls.shift()??.99);
const confession=s=>draw(s,.99,.999);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('嘉豪10%专属机会严格边界，池内等概率选原事件或暴雨，未选择嘉豪没有暴雨',()=>{
 const s=make();assert.equal(draw(s,.09999,.49999).id,'jiahao-special');assert.equal(draw(s,.09999,.5).id,'jiahao-rain');assert.notEqual(draw(s,.1,.5).id,'jiahao-rain');
 const other=make(['grinder','lost']);for(let i=0;i<100;i++)assert.notEqual(randomEvent(other,()=>i/100).id,'jiahao-rain');
 const old=createGame('旧嘉豪',['grinder','lost','jiahao'],()=>.9);assert.equal(draw(old,0,.99).id,'jiahao-special');
});
test('暴雨跳舞基础心态20、七项学习能力各减1，放弃心态5并沿用嘉豪减耗',()=>{
 const s=make();const rain=draw(s,0,.99);assert.equal(rain.title,'暴雨中的狂欢');assert.equal(rain.choices[0].gain.mood,20);for(const key of [...physicalKeys,'school'])assert.equal(rain.choices[0].gain[key],-1);
 s.stats.mood=50;const before={...s.stats};s.pending=rain;choose(s,0,()=>.9);assert.equal(s.stats.mood,70);for(const key of [...physicalKeys,'school'])assert.equal(s.stats[key],before[key]-1);
 const t=make();t.stats.mood=4;t.pending=draw(t,0,.99);choose(t,1,()=>.9);assert.equal(t.stats.mood,0);assert.equal(t.endReason,'mood');
});
test('告白仅在嘉豪新局新增第三选项，选择后保持单身、人缘减2、无恋爱行动点消耗',()=>{
 const s=make();const e=confession(s);assert.equal(e.id,'romance-start');assert.equal(e.choices.length,3);assert.equal(e.choices[2].name,'你是来挑战我的权威的吗？');const ap=budget(s),pop=s.stats.popularity;s.pending=e;choose(s,2,()=>.9);assert.equal(s.stats.popularity,pop-2);assert.equal(s.relationship,false);assert.equal(s.romanceCooldown,0);assert.equal(budget(s),ap);assert.deepEqual(s.authorityBuff,{start:2,end:6});
 const other=make(['grinder','lost']);assert.equal(confession(other).choices.length,2);
});
test('从下一回合起完整5回合翻倍，动作与事件叠加减半和天赋，负收益不变',()=>{
 const s=make();s.pending=confession(s);const base=effectiveGain(s,{mechanics:3,mood:-5},true);choose(s,2,()=>.9);
 for(let day=1;day<=7;day++){s.week=day;const active=day>=2&&day<=6;assert.equal(authorityBuffDays(s),active?7-day:0);const gain=effectiveGain(s,{mechanics:3,mood:-5},true);near(gain.mechanics,base.mechanics*(active?2:1));near(gain.mood,base.mood);assert.equal(effectiveGain(s,{mood:3,popularity:2}).mood,active?6:3);}
 beginDay(s,()=>.9);assert.equal(s.authorityBuff,undefined);
 const t=make(['grinder','crash','jiahao','headstart']);t.authorityBuff={start:2,end:6};t.week=2;near(effectiveGain(t,{mechanics:3},true).mechanics,3*1.5*.7*.5*2);
});
test('重触发刷新随后5回合，倍率仍为2；年级切换不重置或提前消耗',()=>{
 const s=make();s.week=10;s.pending=confession(s);choose(s,2,()=>.9);s.week=12;s.pending=confession(s);choose(s,2,()=>.9);assert.equal(s.week,13);assert.deepEqual(s.authorityBuff,{start:13,end:17});assert.equal(authorityBuffDays(s),5);assert.equal(effectiveGain(s,{mechanics:2}).mechanics,4);
});
test('固定自然回复、迷失奖励、财富翻倍、人缘周期奖励不被权威加成翻倍',()=>{
 const s=make();s.week=2;s.authorityBuff={start:2,end:6};s.stats.mood=50;settleDailyStats(s);assert.equal(s.stats.mood,54);s.stats.mood=50;beginDay(s,()=>0);assert.equal(s.stats.mood,55);
 const t=make(['wealthy','lost','jiahao']);t.week=7;t.authorityBuff={start:6,end:10};advance(t,['rest'],()=>.9);assert.equal(t.stats.wealth,200);near(t.stats.popularity,9+.05*(65+1/3-3-50));
});
test('新日程和校准共用暴雨与三选项告白，选择加成在模拟角色上独立生效且能存读档',()=>{
 const player=createCalibratedGame({name:'嘉豪',talents:['grinder','lost','jiahao','headstart'],identity:'ordinary',seed:1});assert.ok(player.eventPlan.some(slot=>slot.primary.id==='jiahao-rain'));assert.equal(player.calibration.jiahaoVersion,1);assert.ok(validSave(player));
 const slot=player.eventPlan.find(slot=>slot.primary.id==='romance-start');assert.ok(slot);assert.equal(slot.primary.choices.length,3);player.week=slot.primary.day;player.relationship=false;player.romanceCooldown=0;player.pending=dailyEvent(player);assert.ok(validSave(player));
 const sim=make(['grinder','lost']);sim.talents=[];sim.week=player.week;sim.eventPlan=player.eventPlan;assert.deepEqual(dailyEvent(sim),player.pending);sim.pending=dailyEvent(sim);choose(sim,2,()=>.9);assert.ok(sim.authorityBuff);assert.equal(player.authorityBuff,undefined);
 choose(player,2,()=>.9);assert.ok(validSave(player));assert.deepEqual(migrateSave(player),player);
 for(const mutate of [s=>s.authorityBuff.end++,s=>s.authorityBuff.start=0,s=>delete s.calibration.jiahaoVersion,s=>s.eventPlan.find(slot=>slot.primary.id==='romance-start').primary.choices[2].authorityBoost=6]){const bad=JSON.parse(JSON.stringify(player));mutate(bad);assert.equal(validSave(bad),false);}
});
