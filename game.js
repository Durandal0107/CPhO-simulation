export const talents=[{name:'物理直觉',desc:'力学初始 +12，学习收益 +15%',key:'intuition'},{name:'实验巧手',desc:'实验初始 +18',key:'hands'},{name:'稳如磐石',desc:'心态初始 +15，比赛发挥更稳定',key:'calm'},{name:'数学底子',desc:'电磁学初始 +12',key:'math'},{name:'自律达人',desc:'每天拥有 7 个行动点',key:'discipline'},{name:'乐天派',desc:'每天额外恢复 5 点心态',key:'optimist'}];
export const actions=[{id:'mechanics',icon:'↗',name:'力学专题',desc:'从受力分析到刚体运动，建立物理直觉。',cost:2,gain:{mechanics:9,mood:-5},hint:'力学 +9 · 心态 −5'},{id:'electro',icon:'ϟ',name:'电磁学研习',desc:'画好每一条场线，推导每一个边界条件。',cost:2,gain:{electro:9,mood:-5},hint:'电磁学 +9 · 心态 −5'},{id:'thermal',icon:'☼',name:'热学与光学',desc:'在微观世界与光的波动之间寻找答案。',cost:2,gain:{thermal:9,mood:-4},hint:'热光 +9 · 心态 −4'},{id:'lab',icon:'⚗',name:'实验室训练',desc:'调平、读数、拟合，让数据说话。',cost:2,gain:{lab:10,mood:-3},hint:'实验 +10 · 心态 −3'},{id:'school',icon:'▤',name:'回归文化课',desc:'补上落下的作业，给未来留一条路。',cost:1,gain:{school:6,mood:-1},hint:'文化课 +6 · 心态 −1'},{id:'rest',icon:'♧',name:'去操场走走',desc:'放下笔。晚风和朋友也是青春的一部分。',cost:1,gain:{mood:12,school:1},hint:'心态 +12 · 文化课 +1'}];
// 活动收益按基础值缩放；保留分数精度，避免小收益被取整吞掉。
const statLabels={mechanics:'力学',electro:'电磁学',thermal:'热光',lab:'实验',school:'文化课',mood:'心态'};
export const formatStat=value=>Number(value.toFixed(2)).toString();
for(const action of actions){
  for(const key of Object.keys(action.gain))action.gain[key]/=key==='mood'?2:3;
  action.hint=Object.entries(action.gain).map(([key,value])=>`${statLabels[key]} ${value<0?'−':'+'}${formatStat(Math.abs(value))}`).join(' · ');
}
export const events=[{title:'第一道解不出的题',text:'晚自习结束了，黑板上的圆环还在转动。你算了三页纸，答案却始终多一个负号。同桌收拾好书包，问你要不要一起去问教练。',choices:[{name:'带着草稿去请教',result:'教练没有给答案，只问：“你选的参考系是什么？”你忽然看到了问题的入口。',gain:{mechanics:5,mood:2}},{name:'再独立想一会儿',result:'你重新画图，终于发现约束条件。走出教室时，走廊已经熄灯。',gain:{mechanics:7,mood:-5}}]},{title:'一封来自家里的消息',text:'手机亮了。妈妈问：“最近睡得好吗？不一定每次都要赢。”桌上的习题集摊开着，旁边是还没吃的晚饭。',choices:[{name:'打个电话，聊聊近况',result:'你们没有谈分数。挂电话后，晚饭还是温的。',gain:{mood:10}},{name:'先把这一题做完',result:'你发了一个“放心”，又低下头。今晚的推导格外顺利。',gain:{electro:5,mood:-3}}]},{title:'实验台上的意外',text:'同组同学得到了一条漂亮的直线，你的散点却乱得像星空。距离实验室关门还有二十分钟。',choices:[{name:'重新检查仪器零点',result:'原来是游标卡尺的零点误差。你学会了先相信记录，再质疑仪器。',gain:{lab:7}},{name:'和同学一起讨论数据',result:'你们比较了测量步骤，发现固定装置松动了。合作有时比独自坚持更有效。',gain:{lab:4,mood:5}}]},{title:'排名表背后的名字',text:'模拟考排名贴在门口。那个总和你讨论题目的朋友，这次排在你前面。你看着分数，心里有一点酸。',choices:[{name:'约他交换错题',result:'他的解法和你完全不同。你们在同一张纸上，画出了两条抵达答案的路。',gain:{thermal:5,mood:4}},{name:'把目标写在笔记本上',result:'你把不甘心变成了计划，也提醒自己：对手并不是敌人。',gain:{mechanics:5,mood:-2}}]}];
events.push(
{title:'窗边的月亮',text:'光学题里出现了望远镜。你抬头看见窗外的月亮，忽然想起：最初喜欢物理，并不是为了排名。',choices:[{name:'用透镜搭一个小望远镜',result:'成像很模糊，但月亮真的近了一点。课本里的公式，第一次变成手心里的世界。',gain:{thermal:6,lab:3}},{name:'放下试卷，看看夜空',result:'你记不起月面的名字，却记得今晚的风。明天还有题目，今晚先留给自己。',gain:{mood:10}}]},
{title:'教练的空白批注',text:'教练把模拟卷还给你，最后一道题没有打叉，只写着：“先说明你的模型。”你突然发现，算式写满了，假设却一句也没有。',choices:[{name:'重新写出每一步假设',result:'你区分了理想化、近似和结论。物理不只是计算，也是在解释计算为什么成立。',gain:{mechanics:6,electro:3}},{name:'请教练示范一次解题',result:'教练从一张图开始，用十分钟替代了三页代数。你决定先养成画图的习惯。',gain:{mechanics:4,mood:4}}]},
{title:'文化课的小测',text:'英语老师把你叫到走廊：“竞赛很重要，但这张卷子也要认真看看。”教室里正在讨论下一次集训，而你的错题本已经很久没翻开。',choices:[{name:'今晚补齐文化课笔记',result:'你用一晚把漏洞标了出来。没有立刻追上所有人，但至少知道了从哪里开始。',gain:{school:10,mood:-3}},{name:'和老师约一个补课计划',result:'老师帮你把任务拆成了几小块。路不止一条，你也不必同时走完所有路。',gain:{school:5,mood:5}}]},
{title:'离开教室的同伴',text:'一起上过第一堂竞赛课的同学决定回归文化课。收拾书包时，他把一叠实验记录递给你：“替我再往前看看。”',choices:[{name:'认真收下，约好保持联系',result:'你们约定周末一起吃饭。方向变了，友谊并没有被成绩表带走。',gain:{lab:4,mood:6}},{name:'送他一本写满批注的笔记',result:'你把扉页留白，说以后还可以一起讨论有趣的问题。物理教室外，也有很大的世界。',gain:{school:4,mood:7}}]}
);

export const statNames={mechanics:'力学',electro:'电磁学',thermal:'热学·光学',lab:'实验',school:'文化课',mood:'心态'};
export function canChoose(state,choice){return Object.entries(choice.requires||{}).every(([key,min])=>state.stats[key]>=min);}
export function dailyEvent(state,random=Math.random){
  const pool=events.map((e,i)=>({...e,id:`story-${i}`}));
  for(const key of ['mechanics','electro','thermal','lab']){
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
export function createGame(name,selected){return {version:1,name:name.trim().slice(0,16)||'物竞少年',talents:selected,week:1,stats:{mechanics:18+(selected.includes('intuition')?12:0),electro:15+(selected.includes('math')?12:0),thermal:15,lab:10+(selected.includes('hands')?18:0),school:65,mood:70+(selected.includes('calm')?15:0)},log:[],medals:[],route:true,pending:null,ended:false,relationship:false,relationshipSince:null,romanceCooldown:0,lastEvent:null};}
export function applyGain(state,gain,learning=false){for(const [key,value]of Object.entries(gain)){state.stats[key]=clamp(state.stats[key]+(learning&&value>0&&['mechanics','electro','thermal','lab'].includes(key)&&state.talents.includes('intuition')?value*1.15:value));}}
export function budget(state){return (state.talents.includes('discipline')?7:6)-(state.relationship?1:0);}
export function exam(state,random=Math.random){const s=state.stats;const base=(s.mechanics+s.electro+s.thermal)/3*.72+s.lab*.28;const score=Math.round(clamp(base*(.75+s.mood/400)+(random()-.5)*(state.talents.includes('calm')?8:18)));const stage=state.week===8?'预赛':state.week===16?'复赛':'全国决赛';const threshold=state.week===8?35:state.week===16?62:82;const pass=score>=threshold;state.medals.push({stage,score,pass,title:state.week===24?(pass?'国赛金牌':score>=70?'国赛银牌':'国赛铜牌'):(pass?(state.week===8?'晋级复赛':'入选省队'):'未能晋级')});if(!pass&&state.week!==24)state.route=false;return state.medals.at(-1);}
export function advance(state,plan,random=Math.random){
  if(state.ended||state.pending)throw Error('当前无法推进');
  const cost=plan.reduce((sum,id)=>{const action=actions.find(a=>a.id===id);if(!action)throw Error('未知行动');return sum+action.cost;},0);
  if(!plan.length||cost>budget(state))throw Error('行动点不足或计划为空');
  for(const id of plan)applyGain(state,actions.find(a=>a.id===id).gain,true);
  applyGain(state,{school:-3,mood:state.talents.includes('optimist')?5:-2});
  if(state.relationship){applyGain(state,{mood:2});state.log.unshift({week:state.week,text:'恋爱日常：固定占用1行动点，心态 +2。'});}
  if(state.romanceCooldown>0)state.romanceCooldown--;
  state.log.unshift({week:state.week,text:plan.map(id=>actions.find(a=>a.id===id).name).join('、')});
  let result=null;
  if([8,16,24].includes(state.week)&&state.route){result=exam(state,random);state.log.unshift({week:state.week,text:`${result.stage}：${result.score} 分，${result.title}。`});}
  state.pending=dailyEvent(state,random);
  state.lastEvent=state.pending.id;
  return result;
}
export function choose(state,index){
  const event=state.pending,choice=event?.choices[index];
  if(!choice)throw Error('无效选择');
  if(!canChoose(state,choice))throw Error('能力尚未达到要求');
  applyGain(state,choice.gain);
  if(typeof choice.relationship==='boolean'){
    state.relationship=choice.relationship;
    state.relationshipSince=choice.relationship?(event.day||state.week):null;
    if(!choice.relationship)state.romanceCooldown=4;
  }
  state.log.unshift({week:event.day||state.week,text:choice.result});
  state.pending=null;
  if(event.day){if(state.week===24)state.ended=true;else state.week++;}
}
export function ending(state){const last=state.medals.at(-1);if(last?.stage==='全国决赛')return last.title==='国赛金牌'?'追光的人': '山顶的风景';if(state.stats.school>=80)return '另一条闪光的路';if(state.stats.mood>=65)return '热爱不止于奖牌';return '青春的未完成式';}
