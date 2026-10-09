// Optional baseline checkout: npm run benchmark -- /path/to/previous-version
// Timings are diagnostic, not CI thresholds. Full seeded states must match.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createCalibratedGame} from '../calibration.js';
const baseline=process.argv[2]?await import(pathToFileURL(resolve(process.argv[2],'calibration.js'))):null;
const cases=[
 {name:'普通开局',talents:['grinder','lost'],identity:'ordinary',seed:42},
 {name:'额外12回合与嘉豪事件',talents:['master','crash','headstart','jiahao'],identity:'elite',seed:7}
];
for(const config of cases){
 let previous,baselineMs;
 if(baseline){const start=performance.now();previous=baseline.createCalibratedGame(config);baselineMs=performance.now()-start;}
 const start=performance.now(),state=createCalibratedGame(config),elapsedMs=performance.now()-start;
 if(previous)assert.deepEqual(state,previous);
 console.log(JSON.stringify({case:config.name,seed:config.seed,elapsedMs:Math.round(elapsedMs),...(baseline?{baselineMs:Math.round(baselineMs),speedup:Number((baselineMs/elapsedMs).toFixed(2)),identical:true}:{}),pools:state.calibration.competitionCount,actorsPerPool:state.calibration.sampleSize}));
}
