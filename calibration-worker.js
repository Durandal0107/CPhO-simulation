import {createCalibratedGame} from './calibration.js';
self.onmessage=({data})=>{
 let lastProgress=-1;
 try{const state=createCalibratedGame(data,progress=>{if(progress!==lastProgress){lastProgress=progress;self.postMessage({type:'progress',progress});}});self.postMessage({type:'complete',state});}
 catch(error){self.postMessage({type:'error',message:error.message});}
};
