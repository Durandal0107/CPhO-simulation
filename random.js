export function seededRandom(seed){let value=seed>>>0;return ()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};}
export function dayRandom(seed,day,channel=0){return seededRandom((seed^Math.imul(day,2654435761)^Math.imul(channel,2246822519))>>>0);}
