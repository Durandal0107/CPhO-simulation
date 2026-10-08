import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,exam,advance,settleExamMood,physicalKeys,canChoose} from '../game.js';
import {settleCalibrationQualification} from '../calibration.js';
import {validSave,migrateSave} from '../storage.js';

const make=(day=8,mood=60,ability=50,options={})=>{
 const s=createGame('考后心态',['grinder','lost'],()=>.9,null,{examMoodVersion:1,...options});
 s.week=day;s.stats.mood=mood;for(const key of physicalKeys)s.stats[key]=ability;
 return s;
};

test('所有角色预赛及复赛按晋级结果固定改变心态，分数使用考前心态',()=>{
 for(const [day,ability,score,effect] of [[8,50,144,10],[8,0,0,-20],[16,50,180,20],[16,0,0,-30]]){
  const s=make(day,60,ability);const r=exam(s,()=>.5);
  assert.equal(r.score,score);assert.equal(r.moodAtExam,60);assert.equal(r.performanceFactor,.9);
  assert.equal(r.moodEffect,effect);assert.equal(r.moodAfterExam,60+effect);assert.equal(s.stats.mood,60+effect);
  assert.ok(validSave(s));assert.ok(s.log.some(l=>l.text.includes(`心态 ${effect>0?'+':''}${effect}`)));
 }
 const final=make(24);const r=exam(final,()=>.5);assert.equal(final.stats.mood,60);assert.equal(r.moodEffect,undefined);assert.equal(r.moodAfterExam,undefined);
});

test('心态变化不叠加坠机、嘉豪、身份、起跑线、权威或行动减半',()=>{
 const s=createGame('固定结算',['master','crash','jiahao','headstart'],()=>.9,'elite',{calendarVersion:3,examMoodVersion:1,balanceVersion:2});
 s.week=10;s.stats.mood=60;s.authorityBuff={start:6,end:10};for(const key of physicalKeys)s.stats[key]=100;
 const r=exam(s,()=>.95);assert.equal(r.pass,true);assert.equal(r.moodEffect,20);assert.equal(s.stats.mood,80);
 const low=make(8,60,0);low.talents.push('jiahao');low.identity='elite';const fail=exam(low,()=>.5);assert.equal(fail.moodEffect,-20);assert.equal(low.stats.mood,40);
});

test('心态上限100，下限0触发GAMEOVER且不能被当天事件救回',()=>{
 for(const day of [8,16]){const s=make(day,98,100);const r=exam(s,()=>.5);assert.equal(r.moodAfterExam,100);assert.equal(s.stats.mood,100);}
 for(const [day,mood] of [[8,10],[10,20]]){
  const s=make(day,mood,0,{calendarVersion:3});const r=advance(s,['rest'],()=>.5);
  assert.equal(r.pass,false);assert.equal(s.stats.mood,0);assert.equal(s.endReason,'mood');assert.equal(s.pending,null);assert.equal(s.week,day);assert.equal(s.medals.length,1);
 }
});

test('低年级失败后心态非零继续事件，高二失败仍结束且已经扣除心态',()=>{
 const low=make(8,60,0,{calendarVersion:3});const r=advance(low,['rest'],()=>.5);assert.equal(r.moodAtExam,65);assert.equal(low.stats.mood,45);assert.equal(low.ended,false);assert.ok(low.pending);assert.equal(low.route,false);
 const high=make(34,60,0,{calendarVersion:3});const fail=advance(high,['rest'],()=>.5);assert.equal(fail.moodAtExam,65);assert.equal(high.stats.mood,35);assert.equal(high.endReason,'eliminated');assert.equal(high.pending,null);
});

test('模拟心态等真实排名确定后结算，先于事件选项的心态门槛判断',()=>{
 const s=make(8,60,20);s.talents=[];const r=exam(s,()=>.5,{deferQualification:true});assert.equal(r.pass,false);assert.equal(r.moodEffect,undefined);assert.equal(s.stats.mood,60);
 s.pending={day:8,title:'排名后的选择',text:'心态门槛',choices:[{name:'专注训练',requires:{mood:70},gain:{mechanics:2},result:'完成训练'},{name:'略过',gain:{mood:0},result:'略过'}]};
 assert.equal(canChoose(s,s.pending.choices[0]),false);
 const before=s.stats.mechanics,run={id:0,state:s,random:()=>0,profile:null,pre:r.score};
 settleCalibrationQualification([run],[run],'pre');
 assert.equal(r.pass,true);assert.equal(r.moodAfterExam,70);assert.equal(s.stats.mechanics,before+2);assert.equal(s.week,9);assert.equal(s.pending,null);
});

test('模拟角色不按旧线得到奖励，排名落选归零不执行后续事件',()=>{
 const s=make(16,20,100);s.talents=[];const r=exam(s,()=>.5,{deferQualification:true});assert.equal(r.pass,true);assert.equal(s.stats.mood,20);
 s.pending={day:16,title:'不能救回',text:'排名后处理',choices:[{name:'回复',gain:{mood:100},result:'回复'},{name:'回复',gain:{mood:100},result:'回复'}]};
 const run={id:0,state:s,random:()=>0,profile:null,semi:r.score};settleCalibrationQualification([run],[],'semi');
 assert.equal(r.pass,false);assert.equal(r.moodEffect,-30);assert.equal(r.moodAfterExam,0);assert.equal(s.endReason,'mood');assert.equal(s.pending,null);assert.equal(s.week,16);
});

test('保存考前考后心态，读档与重复结算不重复加减；旧存档保持原规则',()=>{
 const s=make();const r=exam(s,()=>.5);const restored=migrateSave(JSON.parse(JSON.stringify(s)));assert.ok(validSave(restored));
 settleExamMood(restored,restored.medals[0]);assert.equal(restored.stats.mood,70);assert.deepEqual(restored,s);
 for(const mutate of [t=>t.examMoodVersion=2,t=>t.medals[0].moodEffect=20,t=>t.medals[0].moodAfterExam=80,t=>t.medals[0].moodAtExam=NaN,t=>delete t.medals[0].moodAfterExam]){const bad=JSON.parse(JSON.stringify(s));mutate(bad);assert.equal(validSave(bad),false);}
 const old=make();delete old.examMoodVersion;const legacy=exam(old,()=>.5);assert.equal(old.stats.mood,60);assert.equal(legacy.moodEffect,undefined);assert.ok(validSave(old));assert.equal(r.moodEffect,10);
});
