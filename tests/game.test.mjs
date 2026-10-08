import {test} from 'node:test';import assert from 'node:assert/strict';import {createGame,advance,choose,budget,ending,actions,canChoose,dailyEvent} from '../game.js';
test('24天完成：剧情、晋级、结局与属性边界',()=>{const s=createGame('测试',['discipline','intuition']);assert.equal(budget(s),7);Object.assign(s.stats,{mechanics:80,electro:80,thermal:80,lab:80});for(let i=0;i<24;i++){s.stats.mood=100;const plans=i<8?['mechanics','electro','thermal','rest']:i<16?['mechanics','electro','lab','rest']:['thermal','lab','rest','rest','rest'];advance(s,plans,()=>.5);if(s.pending)choose(s,0);}assert.equal(s.ended,true);assert.equal(s.medals.length,3);assert.equal(s.medals[0].pass,true);assert.equal(s.medals[1].pass,true);assert.ok(ending(s));for(const v of Object.values(s.stats))assert.ok(v>=0&&v<=100);assert.throws(()=>advance(s,['rest']));});
test('超预算不改变状态；剧情未处理不能推进',()=>{const s=createGame('',['calm','hands']);const before=JSON.stringify(s);assert.throws(()=>advance(s,['lab','lab','lab','lab']));assert.equal(JSON.stringify(s),before);advance(s,['rest'],()=>.5);assert.ok(s.pending);assert.throws(()=>advance(s,['rest']));choose(s,1);assert.equal(s.pending,null);});
test('预赛失败后仍可完成文化课路线',()=>{const s=createGame('转向',['calm','optimist']);for(let i=0;i<24;i++){advance(s,['school','school','school','school','school','rest'],()=>0);if(s.pending)choose(s,0);}assert.equal(s.route,false);assert.equal(s.medals.length,1);assert.equal(ending(s),'另一条闪光的路');});

test('非心态收益维持三分之一，学习心态消耗加倍、散步恢复2点',()=>{
const original=[{mechanics:9,mood:-5},{electro:9,mood:-5},{thermal:9,mood:-4},{lab:10,mood:-3},{school:6,mood:-1},{mood:12,school:1}];
for(let i=0;i<actions.length;i++)for(const [key,value]of Object.entries(original[i]))assert.equal(actions[i].gain[key],key==='mood'?(actions[i].id==='rest'?2:value):value/3);
const s=createGame('测试',['intuition','calm']);advance(s,['lab'],()=>0);assert.ok(Math.abs(s.stats.lab-(10+10/3*1.15))<1e-10);assert.equal(s.stats.mood,80);
});

test('每天包括最后一天都有事件，事件处理完才进入下一天或结局',()=>{
 const s=createGame('测试',['calm','hands']);
 for(let day=1;day<=24;day++){
  assert.equal(s.week,day);advance(s,['rest'],()=>0);
  assert.equal(s.pending.day,day);assert.equal(s.ended,false);
  assert.ok(s.pending.choices.every(c=>Object.values(c.gain).some(v=>v!==0)));
  assert.throws(()=>advance(s,['rest']));choose(s,0);
 }
 assert.equal(s.ended,true);assert.equal(s.log.filter(l=>l.text.includes('教练没有给答案')).length,12);
});
test('难题门槛由引擎强制执行，达标后才能攻克',()=>{
 const s=createGame('测试',['calm','hands']);
 const e=dailyEvent(s,()=>8/13);assert.ok(e.id.startsWith('challenge-'));
 s.pending=e;const [key,min]=Object.entries(e.choices[0].requires)[0];
 s.stats[key]=min-.1;assert.equal(canChoose(s,e.choices[0]),false);
 const before=JSON.stringify(s);assert.throws(()=>choose(s,0),/能力/);assert.equal(JSON.stringify(s),before);
 s.stats[key]=min;assert.ok(canChoose(s,e.choices[0]));choose(s,0);assert.equal(s.stats[key],min+3);
});
test('恋爱每天扣行动点并恢复心态；失恋数值与冷却持久化',()=>{
 const s=createGame('测试',['calm','hands']);
 advance(s,['rest'],()=>.999);assert.equal(s.pending.id,'romance-start');choose(s,0);
 assert.equal(s.relationship,true);assert.equal(budget(s),5);
 s.stats.mood=50;const before=JSON.stringify(s);
 assert.throws(()=>advance(s,['mechanics','electro','thermal']));assert.equal(JSON.stringify(s),before);
 advance(s,['rest'],()=>0);assert.equal(s.stats.mood,52);choose(s,0);
 advance(s,['rest'],()=>0);choose(s,0);
 advance(s,['rest'],()=>.999);assert.equal(s.pending.id,'romance-breakup');
 const mood=s.stats.mood;choose(s,1);assert.equal(s.stats.mood,Math.max(0,mood-35));assert.equal(s.relationship,false);assert.equal(budget(s),6);assert.equal(s.romanceCooldown,4);
});
