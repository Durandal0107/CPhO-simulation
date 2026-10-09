export const identities=[
 {key:'elite',name:'强省强校',effect:'预赛、复赛晋级线 +30%；学习收益 +15%；心态消耗 +10%',desc:'人外有人，山外有山。弱肉强食，这规矩你早就懂得。'},
 {key:'prodigy',name:'天赋怪',effect:'学习收益 +10%',desc:'你才是挑战者！'},
 {key:'ordinary',name:'一般路过',effect:'偶数回合行动点 +1（仅当回合，不累积）',desc:'你总是相信勤能补拙。'}
];
export const validIdentity=key=>identities.some(i=>i.key===key);
export const identityName=key=>identities.find(i=>i.key===key)?.name||'原版身份';
