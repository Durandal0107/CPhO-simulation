import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,advance,choose,totalDays,gradeName,gradeRound,examDay,examThreshold,checkElimination,theoryKeys} from '../game.js';
import {createCalibratedGame} from '../calibration.js';
import {validSave,migrateSave} from '../storage.js';
const make=(headstart=false)=>createGame('年级测试',['grinder','lost',...(headstart?['headstart']:[])],()=>.9,'ordinary',{calendarVersion:3});
const settle=s=>{if(s.pending)choose(s,1,()=>.9);};
test('基础36回合与起跑线48回合，按12回合正确切换年级及赛程',()=>{
 for(const headstart of [false,true]){const s=make(headstart);assert.equal(totalDays(s),headstart?48:36);
 const grades=headstart?['初二','初三','高一','高二']:['初三','高一','高二'];
 grades.forEach((grade,i)=>{s.week=i*12+1;assert.equal(gradeName(s),grade);assert.equal(gradeRound(s),1);assert.equal(examDay(s),0);for(const [round,stage]of [[8,8],[10,16],[12,24]]){s.week=i*12+round;assert.equal(examDay(s),stage);}});
 }
});
test('初三、高一失败保留当日事件、跳过后续比赛、次年恢复参赛',()=>{
 for(const day of [8,10,20,22]){const s=make();s.week=day;for(const k of [...theoryKeys,'lab'])s.stats[k]=0;
 const result=advance(s,['rest'],()=>.5);assert.equal(result.pass,false);assert.equal(s.route,false);assert.equal(s.ended,false);assert.ok(s.pending);assert.equal(checkElimination(s),false);settle(s);
 while(gradeRound(s)!==1){const before=s.medals.length;advance(s,['rest'],()=>.5);assert.equal(s.medals.length,before);assert.ok(s.pending);settle(s);}
 assert.equal(s.route,true);assert.equal(s.ended,false);
 }
});
test('高二预赛、复赛失败立即结束；决赛铜牌也能完成故事',()=>{
 for(const day of [32,34]){const s=make();s.week=day;for(const k of [...theoryKeys,'lab'])s.stats[k]=0;advance(s,['rest'],()=>.5);assert.equal(s.endReason,'eliminated');assert.equal(s.pending,null);}
 const s=make();s.week=36;advance(s,['rest'],()=>.5);assert.equal(s.ended,false);assert.equal(s.medals.at(-1).grade,'高二');settle(s);assert.equal(s.ended,true);
});
test('完整三年赛程九次考试，最后一天事件处理后结束',()=>{
 const s=make();const days=[];while(!s.ended){Object.assign(s.stats,{mechanics:100,electro:100,thermal:100,optics:100,modern:100,lab:100,mood:100});const day=s.week;const r=advance(s,['rest'],()=>.5);if(r)days.push(day);if(day===36)assert.equal(s.ended,false);settle(s);}
 assert.deepEqual(days,[8,10,12,20,22,24,32,34,36]);assert.deepEqual(s.medals.map(m=>m.grade),['初三','初三','初三','高一','高一','高一','高二','高二','高二']);
});
test('每年独立校准混合1000人，当前年级使用自己的分数线，续存不变',()=>{
 const s=createCalibratedGame({name:'校准',talents:['grinder','lost','headstart'],identity:'ordinary',seed:42});
 assert.equal(s.eventPlan.length,48);assert.deepEqual(s.calibration.cohorts,{初三:450,高一:350,高二:200});assert.equal(s.calibration.years.length,4);
 for(let i=0;i<4;i++){s.week=i*12+8;assert.equal(examThreshold(s,8),s.yearCutoffs[i].preliminary);assert.ok(s.calibration.years[i].actualFinalExams>0);}
 assert.notDeepEqual(s.yearCutoffs[0],s.yearCutoffs[3]);assert.ok(validSave(s));assert.deepEqual(migrateSave(s),s);
 for(const mutate of [t=>t.yearCutoffs.pop(),t=>t.yearCutoffs[2].gold=-1,t=>t.calibration.cohorts.高二=201]){const bad=JSON.parse(JSON.stringify(s));mutate(bad);assert.equal(validSave(bad),false);}
});
