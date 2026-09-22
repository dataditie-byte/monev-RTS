/*
 * Monev RTS Dit IE 2026 — STT Engine FINAL
 *
 * Prinsip:
 * 1. Desktop/laptop: browser SpeechRecognition Bahasa Indonesia bila tersedia.
 * 2. HP: gunakan dikte bawaan keyboard (Gboard/Samsung Keyboard) agar kualitas mengikuti mesin suara HP.
 * 3. Tombol Rekam tetap hanya untuk menyimpan audio asli.
 * 4. Tidak ada Gemini, Whisper, Google Cloud, atau billing.
 */

let activeRecognition = null;

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

window.MonevSTT={
  browserSupported,
  startBrowser,
  stopBrowser
};
