import {cutoffs} from './cutoffs.js';
import {validIdentity} from './identities.js';
import {talents,legacyTalents,validTalents,prepDays,totalDays,competitionDay,examScale} from './talents.js';
export {talents,legacyTalents,validTalents,prepDays,totalDays,competitionDay,examScale};
export const actions=[{id:'mechanics',icon:'↗',name:'力学专题',desc:'从受力分析到刚体运动，建立物理直觉。',cost:2,gain:{mechanics:9,mood:-5},hint:'力学 +9 · 心态 −5'},{id:'electro',icon:'ϟ',name:'电磁学研习',desc:'画好每一条场线，推导每一个边界条件。',cost:2,gain:{electro:9,mood:-5},hint:'电磁学 +9 · 心态 −5'},{id:'thermal',icon:'☼',name:'热学专题',desc:'从热力学定律到分子运动，理解温度与能量。',cost:2,gain:{thermal:9,mood:-4},hint:'热光 +9 · 心态 −4'},{id:'lab',icon:'⚗',name:'实验室训练',desc:'调平、读数、拟合，让数据说话。',cost:2,gain:{lab:10,mood:-3},hint:'实验 +10 · 心态 −3'},{id:'school',icon:'▤',name:'回归文化课',desc:'补上落下的作业，给未来留一条路。',cost:1,gain:{school:6,mood:-1},hint:'文化课 +6 · 心态 −1'},{id:'rest',icon:'♧',name:'去操场走走',desc:'放下笔。晚风和朋友也是青春的一部分。',cost:1,gain:{mood:12,school:1},hint:'心态 +12 · 文化课 +1'}];
actions.splice(3,0,
 {id:'optics',icon:'◈',name:'光学专题',desc:'从几何成像到干涉衍射，追踪光的传播。',cost:2,gain:{optics:9,mood:-4}},
 {id:'modern',icon:'ℏ',name:'近代物理研习',desc:'走进相对论、量子与原子核的世界。',cost:2,gain:{modern:9,mood:-4}}
);
export const theoryKeys=['mechanics','electro','thermal','optics','modern'];
export const physicalKeys=[...theoryKeys,'lab'];
// 活动收益按基础值缩放；保留分数精度，避免小收益被取整吞掉。
const statLabels={mechanics:'力学',electro:'电磁学',thermal:'热学',optics:'光学',modern:'近代物理',lab:'实验',school:'文化课',mood:'心态'};
export const formatStat=value=>Number(value.toFixed(2)).toString();
for(const action of actions){
  for(const key of Object.keys(action.gain)){
    if(key==='mood')action.gain[key]=action.id==='rest'?2:action.gain[key];
    else action.gain[key]/=3;
  }
  action.hint=Object.entries(action.gain).map(([key,value])=>`${statLabels[key]} ${value<0?'−':'+'}${formatStat(Math.abs(value))}`).join(' · ');
}
export const events=[{title:'第一道解不出的题',text:'晚自习结束了，黑板上的圆环还在转动。你算了三页纸，答案却始终多一个负号。同桌收拾好书包，问你要不要一起去问教练。',choices:[{name:'带着草稿去请教',result:'教练没有给答案，只问：“你选的参考系是什么？”你忽然看到了问题的入口。',gain:{mechanics:5,mood:2}},{name:'再独立想一会儿',result:'你重新画图，终于发现约束条件。走出教室时，走廊已经熄灯。',gain:{mechanics:7,mood:-5}}]},{title:'一封来自家里的消息',text:'手机亮了。妈妈问：“最近睡得好吗？不一定每次都要赢。”桌上的习题集摊开着，旁边是还没吃的晚饭。',choices:[{name:'打个电话，聊聊近况',result:'你们没有谈分数。挂电话后，晚饭还是温的。',gain:{mood:10}},{name:'先把这一题做完',result:'你发了一个“放心”，又低下头。今晚的推导格外顺利。',gain:{electro:5,mood:-3}}]},{title:'实验台上的意外',text:'同组同学得到了一条漂亮的直线，你的散点却乱得像星空。距离实验室关门还有二十分钟。',choices:[{name:'重新检查仪器零点',result:'原来是游标卡尺的零点误差。你学会了先相信记录，再质疑仪器。',gain:{lab:7}},{name:'和同学一起讨论数据',result:'你们比较了测量步骤，发现固定装置松动了。合作有时比独自坚持更有效。',gain:{lab:4,mood:5}}]},{title:'排名表背后的名字',text:'模拟考排名贴在门口。那个总和你讨论题目的朋友，这次排在你前面。你看着分数，心里有一点酸。',choices:[{name:'约他交换错题',result:'他的解法和你完全不同。你们在同一张纸上，画出了两条抵达答案的路。',gain:{thermal:5,mood:4}},{name:'把目标写在笔记本上',result:'你把不甘心变成了计划，也提醒自己：对手并不是敌人。',gain:{mechanics:5,mood:-2}}]}];
events.push(
{title:'窗边的月亮',text:'光学题里出现了望远镜。你抬头看见窗外的月亮，忽然想起：最初喜欢物理，并不是为了排名。',choices:[{name:'用透镜搭一个小望远镜',result:'成像很模糊，但月亮真的近了一点。课本里的公式，第一次变成手心里的世界。',gain:{optics:6,lab:3}},{name:'放下试卷，看看夜空',result:'你记不起月面的名字，却记得今晚的风。明天还有题目，今晚先留给自己。',gain:{mood:10}}]},
{title:'教练的空白批注',text:'教练把模拟卷还给你，最后一道题没有打叉，只写着：“先说明你的模型。”你突然发现，算式写满了，假设却一句也没有。',choices:[{name:'重新写出每一步假设',result:'你区分了理想化、近似和结论。物理不只是计算，也是在解释计算为什么成立。',gain:{mechanics:6,electro:3}},{name:'请教练示范一次解题',result:'教练从一张图开始，用十分钟替代了三页代数。你决定先养成画图的习惯。',gain:{mechanics:4,mood:4}}]},
{title:'文化课的小测',text:'英语老师把你叫到走廊：“竞赛很重要，但这张卷子也要认真看看。”教室里正在讨论下一次集训，而你的错题本已经很久没翻开。',choices:[{name:'今晚补齐文化课笔记',result:'你用一晚把漏洞标了出来。没有立刻追上所有人，但至少知道了从哪里开始。',gain:{school:10,mood:-3}},{name:'和老师约一个补课计划',result:'老师帮你把任务拆成了几小块。路不止一条，你也不必同时走完所有路。',gain:{school:5,mood:5}}]},
{title:'离开教室的同伴',text:'一起上过第一堂竞赛课的同学决定回归文化课。收拾书包时，他把一叠实验记录递给你：“替我再往前看看。”',choices:[{name:'认真收下，约好保持联系',result:'你们约定周末一起吃饭。方向变了，友谊并没有被成绩表带走。',gain:{lab:4,mood:6}},{name:'送他一本写满批注的笔记',result:'你把扉页留白，说以后还可以一起讨论有趣的问题。物理教室外，也有很大的世界。',gain:{school:4,mood:7}}]}
);

export const statNames={wealth:'财富',popularity:'人缘',mechanics:'力学',electro:'电磁学',thermal:'热学',optics:'光学',modern:'近代物理',lab:'实验',school:'文化课',mood:'心态'};
export function canChoose(state,choice){return Object.entries(choice.requires||{}).every(([key,min])=>state.stats[key]>=min);}
export function dailyEvent(state,random=Math.random){
  if(state.talents.includes('jiahao')&&random()<.1)return {id:'jiahao-special',day:state.week,title:'嘉豪的独有时刻',text:'同学们又在讨论排名，你却突然进入了自己的节奏。今天，要把这份专注用在哪里？',choices:[{name:'自在极意，沉浸推导',result:'你暂时忘记比较，在一道推导中找回了节奏。',gain:{mechanics:4,mood:3}},{name:'分享自己的奇妙解法',result:'你把思路讲给身边的人，收获了意外的共鸣。',gain:{popularity:2,mood:4}}]};
  const pool=events.map((e,i)=>({...e,id:`story-${i}`}));
  for(const key of physicalKeys){
    const min=Math.round(22+state.week*.9);
    pool.push({id:`challenge-${key}`,title:`${statNames[key]}训练的拦路题`,text:`今天的训练最后留下了一道难题。要独立完成它，你需要${statNames[key]}达到${min}。你可以选择迎难而上，也可以承认眼下的局限。`,choices:[{name:'独立攻克难题',requires:{[key]:min},result:'你把条件拆开，一步一步推导到最后。难题变成了新的经验，专注也消耗了一些心力。',gain:{[key]:3,mood:-2}},{name:'暂时放弃，记入错题本',result:'你标记了不理解的地方，今天先到这里。未完成的题目让你有些失落，但以后仍可以回来。',gain:{mood:-3}}]});
  }
  if(!state.relationship&&(state.romanceCooldown||0)===0)pool.push({id:'romance-start',title:'晚自习后的告白',text:'一起讨论题目的同学在路口停下来，认真问你愿不愿意一起走下去。恋爱期间每天固定占用1行动点，并恢复2点心态，从下一天开始。',choices:[{name:'接受告白，一起走下去',relationship:true,result:'你们约定每天留一点时间给彼此。从下一天起，恋爱会固定占用1行动点，每天恢复2点心态。',gain:{mood:8}},{name:'温柔拒绝，先专注自己的路',result:'你认真解释了自己的选择。对方尊重你的决定，你也为这段坦诚的对话松了一口气。',gain:{mood:2}}]});
  if(state.relationship){
    pool.push({id:'romance-date',title:'一道题之外的约会',text:'对方邀你在今天的固定相处时间里去操场散步。你们可以聊聊近况，也可以带上笔记讨论明天的测验。',choices:[{name:'好好倾听彼此',result:'你们聊起最近的烦恼。被理解的感觉，让一天的疲惫轻了一点。',gain:{mood:6}},{name:'一起整理课堂笔记',result:'相处的时间里，你们互相补齐了遗漏的知识点。',gain:{school:2,mood:2}}]});
    if(state.week-(state.relationshipSince||1)>=3)pool.push({id:'romance-breakup',title:'一段关系的句号',text:'你们的节奏渐渐不同。对方说，希望各自往前走。关系已经结束；这次选择决定你如何面对，而无法挽回分手。从下一天起不再扣除恋爱行动点。',choices:[{name:'接受告别，找朋友聊聊',relationship:false,result:'你没有掩饰难过。朋友陪你坐了很久。恋爱结束，心态下降25点，下一天恢复全部行动点。',gain:{mood:-25}},{name:'独自整理回忆',relationship:false,result:'你把共同的笔记收进抽屉。眼下的失落很重，心态下降35点，下一天恢复全部行动点。',gain:{mood:-35}}]});
  }
  const candidates=pool.filter(e=>e.id!==state.lastEvent);
  const event=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];
  return {...event,day:state.week};
}

const clamp=x=>Math.max(0,Math.min(100,x));
export function createGame(name,selected,random=Math.random,identity=null){
 if(identity!==null&&!validIdentity(identity))throw Error('请选择有效身份');
 const legacy=Array.isArray(selected)&&selected.length===2&&selected.every(id=>legacyTalents.some(t=>t.key===id));
 if(!legacy&&!validTalents(selected))throw Error('请选择1项正面、1项负面天赋，中立天赋任选');
 const state={version:legacy?1:2,scienceVersion:2,name:name.trim().slice(0,16)||'物竞少年',talents:[...selected],identity,week:1,stats:{mechanics:18+(selected.includes('intuition')?12:0),electro:15+(selected.includes('math')?12:0),thermal:15,optics:15,modern:15,lab:10+(selected.includes('hands')?18:0),school:selected.includes('allin')?0:65,mood:70+(selected.includes('calm')?15:0)},log:[],medals:[],route:true,pending:null,ended:false,relationship:false,relationshipSince:null,romanceCooldown:0,lastEvent:null};
 if(!legacy){state.stats.wealth=100;state.stats.popularity=10-(selected.includes('jiahao')?2:0);state.dailyPenalty=0;beginDay(state,random);}
 return state;
}
export function beginDay(state,random=Math.random){
 state.dailyPenalty=0;
 if(state.talents.includes('lost')&&random()<.1){state.dailyPenalty=2;state.stats.mood=clamp(state.stats.mood+5);state.log.unshift({week:state.week,text:'迷失：沉迷电子世界，今天行动点−2、心态 +5。'});}
}
export function effectiveGain(state,gain,learning=false,random=null){
 const physical=physicalKeys;const out={};
 for(const [key,base]of Object.entries(gain)){
  let value=base;
  if(learning&&random&&state.talents.includes('chaos'))value+=Math.min(8,Math.floor(random()*9))-5;
  if(value>0){
   if(learning&&[...physicalKeys,'school'].includes(key))value*=state.identity==='elite'?1.2:state.identity==='prodigy'?1.15:1;
   if(state.talents.includes('crash'))value*=1.25;
   if(state.talents.includes('headstart'))value*=state.week<=prepDays(state)?.5:.8;
   if(physical.includes(key)&&state.talents.includes('allin'))value*=2;
   if(learning&&physical.includes(key)&&state.talents.includes('intuition'))value*=1.15;
  }
  if(key==='mood'&&value<0&&state.talents.includes('jiahao'))value*=.8;
  if(key==='mood'&&value<0&&state.identity==='elite')value*=1.1;
  if(key==='school'&&state.talents.includes('allin'))value=0;
  out[key]=value;
 }
 return out;
}
export function checkGameOver(state){
 if(state.stats.mood>0)return false;
 state.stats.mood=0;state.ended=true;state.endReason='mood';state.pending=null;
 return true;
}
export function applyGain(state,gain,learning=false,random=null){
 if(state.ended)return {};
 const actual=effectiveGain(state,gain,learning,random);
 for(const [key,value]of Object.entries(actual)){
  if(key==='wealth')state.stats[key]=Math.max(0,(state.stats[key]||0)+value);
  else state.stats[key]=clamp((state.stats[key]||0)+value);
 }
 if(state.talents.includes('allin'))state.stats.school=0;
 checkGameOver(state);
 return actual;
}
export function budget(state){return (state.talents.includes('discipline')||state.talents.includes('grinder')?7:6)+(state.identity==='ordinary'?2:0)-(state.relationship?1:0)-(state.dailyPenalty||0);}
export function examThreshold(state,day){const base=state.version===1?(day===8?35:day===16?62:82):(day===8?cutoffs.preliminary:day===16?cutoffs.semifinal:cutoffs.gold);return base*(state.identity==='elite'&&day!==24?1.3:1);}
export function awardThreshold(state,award){return state.version===1?(award==='silver'?70:award==='training'?90:82):cutoffs[award];}
export function exam(state,random=Math.random){
 const s=state.stats,day=competitionDay(state);
 let maxScore,score;
 if(state.version===1){maxScore=100;const base=theoryKeys.reduce((sum,key)=>sum+s[key],0)/theoryKeys.length*.72+s.lab*.28;score=Math.round(clamp(base*(.75+s.mood/400)+(random()-.5)*(state.talents.includes('calm')?8:18)));}
 else{
  maxScore=day===8?320:400;
  const mechanicalShare=.4+random()*.2,thermalShare=.4+random()*.2;
  const pair=(first,second,share)=>s[first]/100*share+s[second]/100*(1-share);
  const weighted=pair('mechanics','electro',mechanicalShare)*(day===8?.7:.4)+pair('thermal','optics',thermalShare)*.3+(day===8?0:s.modern/100*.1+s.lab/100*.2);
  score=Math.round(maxScore*weighted);
 }
 let penalty=0;if(state.talents.includes('crash')){const roll=random();penalty=roll<.05?120:roll<.15?80:roll<.4?60:roll<.9?40:0;score=Math.max(0,score-penalty);}
 const gifted=day===16&&state.talents.includes('master')&&random()<.2;
 const stage=day===8?'预赛':day===16?'复赛':'全国决赛';
 const threshold=examThreshold(state,day);
 const pass=gifted||score>=threshold;
 const training=day===24&&score>=awardThreshold(state,'training');
 const result={stage,score,pass,maxScore,penalty,gifted,training,title:day===24?(pass?'国赛金牌':score>=awardThreshold(state,'silver')?'国赛银牌':'国赛铜牌'):(pass?(day===8?'晋级复赛':'入选省队'):'未能晋级')};
 state.medals.push(result);if(!pass&&day!==24)state.route=false;return result;
}
export function advance(state,plan,random=Math.random){
  if(state.ended||state.pending)throw Error('当前无法推进');
  const cost=plan.reduce((sum,id)=>{const action=actions.find(a=>a.id===id);if(!action)throw Error('未知行动');return sum+action.cost;},0);
  if(!plan.length||cost>budget(state))throw Error('行动点不足或计划为空');
  const changes={};
  for(const id of plan){const gain=applyGain(state,actions.find(a=>a.id===id).gain,true,random);for(const [key,value]of Object.entries(gain))changes[key]=(changes[key]||0)+value;if(state.ended)return null;}
  applyGain(state,{school:-3});
  if(state.ended)return null;
  state.stats.mood=clamp(state.stats.mood+3+(state.talents.includes('optimist')?5:0));
  state.log.unshift({week:state.week,text:'每日自然恢复：心态 +3。'+(state.talents.includes('optimist')?'乐天派额外心态 +5。':'')});
  if(state.relationship){const gain=applyGain(state,{mood:2});state.log.unshift({week:state.week,text:`恋爱日常：固定占用1行动点，心态 +${formatStat(gain.mood)}。`});}
  if(state.romanceCooldown>0)state.romanceCooldown--;
  state.log.unshift({week:state.week,text:plan.map(id=>actions.find(a=>a.id===id).name).join('、')+(state.version===2?'（行动结算：'+Object.entries(changes).map(([key,value])=>`${statNames[key]} ${value>=0?'+':''}${formatStat(value)}`).join(' · ')+')':'')});
  let result=null;
  if([8,16,24].includes(competitionDay(state))&&state.route){result=exam(state,random);state.log.unshift({week:state.week,text:`${result.stage}：${result.score} 分，${result.title}。`});}
  if(state.talents.includes('wealthy')&&state.week%7===0){state.stats.wealth*=2;state.stats.popularity=clamp(state.stats.popularity+1);state.log.unshift({week:state.week,text:'家财万贯：财富翻倍，人缘 +1。'});}
  state.pending=dailyEvent(state,random);
  state.lastEvent=state.pending.id;
  return result;
}
export function choose(state,index,random=Math.random){
  const event=state.pending,choice=event?.choices[index];
  if(!choice)throw Error('无效选择');
  if(!canChoose(state,choice))throw Error('能力尚未达到要求');
  const actual=applyGain(state,choice.gain);
  if(typeof choice.relationship==='boolean'){
    state.relationship=choice.relationship;
    state.relationshipSince=choice.relationship?(event.day||state.week):null;
    if(!choice.relationship)state.romanceCooldown=4;
  }
  state.log.unshift({week:event.day||state.week,text:choice.result+(state.version===2?'（'+Object.entries(actual).map(([key,value])=>`${statNames[key]} ${value>=0?'+':''}${formatStat(value)}`).join(' · ')+'）':'')});
  state.pending=null;
  if(state.ended)return;
  if(event.day){if(state.week===totalDays(state))state.ended=true;else{state.week++;beginDay(state,random);}}
}
export function ending(state){if(state.endReason==='mood')return 'GAMEOVER';const last=state.medals.at(-1);if(last?.stage==='全国决赛')return last.title==='国赛金牌'?'追光的人': '山顶的风景';if(state.stats.school>=80)return '另一条闪光的路';if(state.stats.mood>=65)return '热爱不止于奖牌';return '青春的未完成式';}
