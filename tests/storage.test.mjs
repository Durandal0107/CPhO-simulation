import {test} from 'node:test';import assert from 'node:assert/strict';import {createGame,advance} from '../game.js';import {validSave,validPlan} from '../storage.js';
test('正确存档与剧情可恢复，损坏存档被拒绝',()=>{const s=createGame('测试',['calm','hands']);assert.ok(validSave(JSON.parse(JSON.stringify(s))));advance(s,['rest']);assert.ok(validSave(s));for(const invalid of [null,{}, {...s,stats:{}},{...s,talents:['missing','hands']},{...s,pending:{title:'broken'}}])assert.ok(!validSave(invalid));});
test('只恢复有效且预算以内的计划',()=>{const s=createGame('测试',['calm','hands']);assert.ok(validPlan(['lab','rest'],s));assert.ok(!validPlan(['lab','lab','lab','lab'],s));assert.ok(!validPlan(['unknown'],s));});

test('恋爱、能力门槛与事件待选状态能够安全存读',()=>{
 const s=createGame('测试',['calm','hands']);s.relationship=true;s.relationshipSince=1;s.week=4;
 advance(s,['rest'],()=>.999);const restored=JSON.parse(JSON.stringify(s));assert.ok(validSave(restored));assert.ok(!validPlan(['lab','lab','lab'],restored));
 const invalid=JSON.parse(JSON.stringify(s));invalid.pending.choices[0].requires={unknown:10};assert.ok(!validSave(invalid));
});
