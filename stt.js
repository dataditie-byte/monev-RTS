/*
 * Monev RTS Dit IE 2026 — STT Engine
 * Browser SpeechRecognition + local Whisper fallback.
 * No Gemini, no Google Cloud, no billing.
 */
import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0/+esm";

let activeRecognition = null;
let localPipeline = null;
let localPipelinePromise = null;

function browserSupported(){
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function startBrowser(opts={}){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR) throw new Error('Pengenalan suara browser tidak tersedia.');

  if(activeRecognition){
    try{ activeRecognition.stop(); }catch(e){}
    activeRecognition=null;
  }

  const rec = new SR();
  rec.lang = opts.lang || 'id-ID';
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  rec.onresult = (e)=>{
    let interim='';
    for(let i=e.resultIndex;i<e.results.length;i++){
      const result=e.results[i];
      const text=(result?.[0]?.transcript||'').trim();
      if(!text) continue;
      if(result.isFinal) opts.onFinal?.(text);
      else interim += (interim?' ':'')+text;
    }
    opts.onInterim?.(interim);
  };
  rec.onerror = (e)=>opts.onError?.(e);
  rec.onend = ()=>{
    if(activeRecognition===rec) activeRecognition=null;
    opts.onEnd?.();
  };

  activeRecognition=rec;
  rec.start();
  return rec;
}

function stopBrowser(){
  const rec=activeRecognition;
  activeRecognition=null;
  if(rec){ try{rec.stop();}catch(e){} }
}

async function getLocalPipeline(){
  if(localPipeline) return localPipeline;
  if(localPipelinePromise) return localPipelinePromise;

  localPipelinePromise=(async()=>{
    const options = navigator.gpu ? {device:'webgpu'} : {};
    return await pipeline(
      'automatic-speech-recognition',
      'onnx-community/whisper-tiny',
      options
    );
  })();

  try{
    localPipeline=await localPipelinePromise;
    return localPipeline;
  }finally{
    localPipelinePromise=null;
  }
}

async function blobTo16kMono(blob){
  const buffer=await blob.arrayBuffer();
  const AC=window.AudioContext||window.webkitAudioContext;
  const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
  if(!AC||!Offline) throw new Error('Pemrosesan audio tidak tersedia pada perangkat ini.');

  const ctx=new AC();
  try{
    const decoded=await ctx.decodeAudioData(buffer);
    const duration=Math.max(0.05,decoded.duration);
    const frames=Math.max(1,Math.ceil(duration*16000));
    const offline=new Offline(1,frames,16000);
    const source=offline.createBufferSource();
    source.buffer=decoded;
    source.connect(offline.destination);
    source.start(0);
    const rendered=await offline.startRendering();
    return rendered.getChannelData(0);
  }finally{
    try{await ctx.close();}catch(e){}
  }
}

async function transcribeLocal(blob){
  if(!blob || !blob.size) throw new Error('Rekaman suara kosong.');
  const transcriber=await getLocalPipeline();
  const audio=await blobTo16kMono(blob);
  const result=await transcriber(audio,{
    language:'indonesian',
    task:'transcribe',
    chunk_length_s:30,
    stride_length_s:5
  });
  return String(result?.text||'').trim();
}

window.MonevSTT={
  browserSupported,
  startBrowser,
  stopBrowser,
  transcribeLocal
};
