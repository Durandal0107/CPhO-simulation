import {test} from 'node:test';import assert from 'node:assert/strict';import {createGame,advance,choose,budget,ending,actions} from '../game.js';
test('24周完成：剧情、晋级、结局与属性边界',()=>{const s=createGame('测试',['discipline','intuition']);assert.equal(budget(s),7);Object.assign(s.stats,{mechanics:80,electro:80,thermal:80,lab:80});for(let i=0;i<24;i++){const plans=i<8?['mechanics','electro','thermal','rest']:i<16?['mechanics','electro','lab','rest']:['thermal','lab','rest','rest','rest'];advance(s,plans,()=>.5);if(s.pending)choose(s,0);}assert.equal(s.ended,true);assert.equal(s.medals.length,3);assert.equal(s.medals[0].pass,true);assert.equal(s.medals[1].pass,true);assert.ok(ending(s));for(const v of Object.values(s.stats))assert.ok(v>=0&&v<=100);assert.throws(()=>advance(s,['rest']));});
test('超预算不改变状态；剧情未处理不能推进',()=>{const s=createGame('',['calm','hands']);const before=JSON.stringify(s);assert.throws(()=>advance(s,['lab','lab','lab','lab']));assert.equal(JSON.stringify(s),before);advance(s,['rest'],()=>.5);advance(s,['rest'],()=>.5);assert.ok(s.pending);assert.throws(()=>advance(s,['rest']));choose(s,1);assert.equal(s.pending,null);});
test('预赛失败后仍可完成文化课路线',()=>{const s=createGame('转向',['calm','optimist']);for(let i=0;i<24;i++){advance(s,['school','school','school','school','school','rest'],()=>0);if(s.pending)choose(s,0);}assert.equal(s.route,false);assert.equal(s.medals.length,1);assert.equal(ending(s),'另一条闪光的路');});

test('所有活动按比例缩放，含小数和学习天赋收益',()=>{
const original=[{mechanics:9,mood:-5},{electro:9,mood:-5},{thermal:9,mood:-4},{lab:10,mood:-3},{school:6,mood:-1},{mood:12,school:1}];
for(let i=0;i<actions.length;i++)for(const [key,value]of Object.entries(original[i]))assert.equal(actions[i].gain[key],value/(key==='mood'?2:3));
const s=createGame('测试',['intuition','calm']);advance(s,['lab'],()=>0);assert.ok(Math.abs(s.stats.lab-(10+10/3*1.15))<1e-10);assert.equal(s.stats.mood,81.5);
});
