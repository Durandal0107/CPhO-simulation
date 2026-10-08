export const talents=[
 {key:'grinder',group:'positive',name:'！？卷卷？！',desc:'吓哭了。',effect:'每回合行动点 +1'},
 {key:'master',group:'positive',name:'大手',desc:'？？的天还是黑了。',effect:'复赛有20%概率无视分数直接晋级'},
 {key:'wealthy',group:'positive',name:'家财万贯',desc:'我去，？✌',effect:'每7天财富翻倍、人缘 +1（初始财富100）'},
 {key:'headstart',group:'neutral',name:'赢在起跑线',desc:'？！低龄化！？',effect:'初始回合数增加12；额外回合数值加成−30%，原有回合数值加成−10%'},
 {key:'jiahao',group:'neutral',name:'天生嘉豪',desc:'自在极意豪。',effect:'心态消耗−20%，初始人缘−2；每天10%专属事件机会（独有时刻／暴雨）；告白可挑战权威，随后5回合正收益×2'},
 {key:'allin',group:'neutral',name:'破釜沉舟',desc:'我再也不想学文化课了。',effect:'文化课恒定为0，物竞正收益 +100%'},
 {key:'crash',group:'negative',name:'坠机体质',desc:'Man！',effect:'正收益 +25%；考试5%扣120、10%扣80、25%扣60、50%扣40分，10%不扣分'},
 {key:'chaos',group:'negative',name:'精神错乱',desc:'？？？',effect:'每项行动的每项数值独立随机附加−5至+3，各有1/9概率'},
 {key:'lost',group:'negative',name:'迷失',desc:'你见过凌晨四点的嚎哭深渊吗？',effect:'每天10%概率沉迷电子世界，当天行动点−2、心态 +5'}
];
export const legacyTalents=[{key:'intuition',name:'物理直觉'},{key:'hands',name:'实验巧手'},{key:'calm',name:'稳如磐石'},{key:'math',name:'数学底子'},{key:'discipline',name:'自律达人'},{key:'optimist',name:'乐天派'}];
export function validTalents(ids){return Array.isArray(ids)&&new Set(ids).size===ids.length&&ids.every(id=>talents.some(t=>t.key===id))&&['positive','negative'].every(group=>ids.filter(id=>talents.find(t=>t.key===id)?.group===group).length===1);}
export const talentName=id=>[...talents,...legacyTalents].find(t=>t.key===id)?.name||id;
export const prepDays=s=>s.calendarPrep??(s.talents.includes('headstart')?6:0);
export const totalDays=s=>(s.calendarVersion===3?36:24)+prepDays(s);
export const competitionDay=s=>s.week-prepDays(s);
export const examScale=s=>s.version===2?4:1;

export const gradeRound=s=>(s.week-1)%12+1;
export const yearIndex=s=>Math.floor((s.week-1)/12);
export const gradeName=s=>s.calendarVersion===3?['初二','初三','高一','高二'][yearIndex(s)+(prepDays(s)?0:1)]:'高二';
export const examDay=s=>s.calendarVersion===3?({8:8,10:16,12:24}[gradeRound(s)]??0):competitionDay(s);
