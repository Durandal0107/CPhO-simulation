import {createCalibratedGame} from './calibration.js';
self.onmessage=({data})=>{
 try{const state=createCalibratedGame(data,progress=>self.postMessage({type:'progress',progress}));self.postMessage({type:'complete',state});}
 catch(error){self.postMessage({type:'error',message:error.message});}
};
