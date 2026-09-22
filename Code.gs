const SS_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const GEMINI_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

function sh_(name){ return SpreadsheetApp.openById(SS_ID).getSheetByName(name); }
function now_(){ return new Date(); }

function cfg_(key){
  const v = sh_('CONFIG').getDataRange().getValues();
  for(let i=1;i<v.length;i++) if(String(v[i][0]) === String(key)) return v[i][1];
  return '';
}

function json_(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(){
  return json_({
    ok:true,
    app:'Monev RTS DitIE 2026',
    version:'BACKEND-V2',
    time:now_()
  });
}

/* =========================
   API ROUTER
   ========================= */

function doPost(e){
  try{
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const data = JSON.parse(raw);
    return json_(apiRouter_(data));
  }catch(err){
    return json_({ok:false,error:String(err && err.message || err)});
  }
}

function apiRouter_(data){
  data = data || {};
  const action = String(data.action || '').trim();

  switch(action){
    case 'health': return healthCheck();
    case 'getQuestions': {
      const jenis = normalizeJenis_(data.jenis_responden || data.kelompok);
      if(!jenis) return {ok:false,error:'jenis_responden harus GURU atau SISWA'};
      return {ok:true,questions:getQuestions(jenis)};
    }
    case 'createSession': return createSession(data);
    case 'resumeSession': return resumeSession(data.id_pengisian);
    case 'saveAnswer': return saveAnswer(data);
    case 'transcribeAudio': return transcribeAudio(data);
    case 'finishSession': return finishSession(data.id_pengisian);
    case 'getProgress': return getProgress(data.id_pengisian);
    default: return {ok:false,error:'Action tidak dikenal: '+action};
  }
}

function normalizeJenis_(v){
  v = String(v || '').trim().toUpperCase();
  if(v === 'GURU' || v === 'GURU PENDAMPING' || v === 'GURU_PENDAMPING') return 'GURU';
  if(v === 'SISWA' || v === 'SISWA/FASILITATOR' || v === 'FASILITATOR' || v === 'SISWA_FASILITATOR') return 'SISWA';
  return '';
}

/* =========================
   BASIC
   ========================= */

function healthCheck(){
  return {
    ok:true,
    spreadsheet:!!SS_ID,
    geminiKey:!!GEMINI_KEY,
    driveFolder:cfg_('DRIVE_FOLDER_NAME') || 'Monev_RTS_DitIE_2026_Audio'
  };
}

function getQuestions(kelompok){
  kelompok = normalizeJenis_(kelompok);
  const v = sh_('PERTANYAAN').getDataRange().getValues();
  return v.slice(1)
    .filter(r => normalizeJenis_(r[1]) === kelompok && (r[4] === true || String(r[4]).toUpperCase() === 'TRUE' || r[4] === 1))
    .sort((a,b)=>Number(a[2])-Number(b[2]))
    .map(r=>({
      question_id:String(r[0]),
      kelompok:normalizeJenis_(r[1]),
      no_pertanyaan:Number(r[2]),
      pertanyaan:String(r[3])
    }));
}

function createSession(data){
  const jenis = normalizeJenis_(data.jenis_responden || data.kelompok);
  if(!jenis) return {ok:false,error:'jenis_responden harus GURU atau SISWA'};

  const id = 'RTS-' +
    Utilities.formatDate(now_(),Session.getScriptTimeZone(),'yyyyMMdd-HHmmss') +
    '-' + Utilities.getUuid().replace(/-/g,'').slice(0,6).toUpperCase();

  sh_('PENGISIAN').appendRow([
    id, now_(), '',
    data.nama_personel||'',
    data.nip||'',
    data.jabatan||'',
    data.unit_satker||'',
    data.provinsi||'',
    data.kabupaten_kota||'',
    data.sekolah||'',
    jenis,
    data.nama_responden||'',
    'BERJALAN'
  ]);

  return {ok:true,id_pengisian:id};
}

function resumeSession(id){
  id = String(id||'').trim();
  if(!id) return {ok:false,error:'ID pengisian wajib diisi'};

  const s=sh_('PENGISIAN'), v=s.getDataRange().getValues();
  for(let i=1;i<v.length;i++){
    if(String(v[i][0])===id){
      return {
        ok:true,
        session:{
          id_pengisian:id,
          created_at:v[i][1],
          completed_at:v[i][2],
          nama_personel:v[i][3],
          nip:v[i][4],
          jabatan:v[i][5],
          unit_satker:v[i][6],
          provinsi:v[i][7],
          kabupaten_kota:v[i][8],
          sekolah:v[i][9],
          jenis_responden:v[i][10],
          nama_responden:v[i][11],
          status:v[i][12]
        }
      };
    }
  }
  return {ok:false,error:'ID pengisian tidak ditemukan'};
}

/* =========================
   FAST ANSWER STORAGE
   =========================
   Transcription is NOT done here.
   The browser receives transcript first, then calls this fast endpoint.
*/

function saveAnswer(data){
  const idp = String(data.id_pengisian||'').trim();
  const qid = String(data.question_id||'').trim();
  if(!idp) return {ok:false,error:'id_pengisian wajib diisi'};
  if(!qid) return {ok:false,error:'question_id wajib diisi'};

  const lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try{
    const sheet=sh_('JAWABAN');
    const values=sheet.getDataRange().getValues();

    // Idempotent update: if the same session/question already exists, update it.
    for(let i=1;i<values.length;i++){
      if(String(values[i][1])===idp && String(values[i][2])===qid){
        const row=i+1;
        sheet.getRange(row,6).setValue(data.jawaban_ya_tidak||'');
        sheet.getRange(row,7).setValue(data.audio_file_id||values[i][6]||'');
        sheet.getRange(row,8).setValue(data.audio_url||values[i][7]||'');
        sheet.getRange(row,9).setValue(data.audio_file_id ? 'SELESAI' : 'TANPA_AUDIO');
        sheet.getRange(row,10).setValue(data.transkripsi||values[i][9]||'');
        return {ok:true,mode:'UPDATE',id_jawaban:String(values[i][0])};
      }
    }

    const idj = data.id_jawaban || ('J-'+Utilities.getUuid().replace(/-/g,'').slice(0,10).toUpperCase());
    sheet.appendRow([
      idj,
      idp,
      qid,
      data.no_pertanyaan||'',
      data.kelompok||'',
      data.jawaban_ya_tidak||'',
      data.audio_file_id||'',
      data.audio_url||'',
      data.audio_file_id ? 'SELESAI' : 'TANPA_AUDIO',
      data.transkripsi||'',
      0,
      '',
      now_()
    ]);

    return {ok:true,mode:'CREATE',id_jawaban:idj};
  } finally {
    lock.releaseLock();
  }
}

/* =========================
   AUDIO + TRANSCRIPTION
   =========================
   Called AFTER recording stops.
   It uploads the original audio to Drive, then immediately asks
   Gemini 3.5 Transcribe for the transcript and returns the text.
   This is the deliberate UX: Stop -> Transcribe -> show transcript.
*/

function transcribeAudio(data){
  if(!data) return {ok:false,error:'Data audio tidak ditemukan'};
  if(!data.base64) return {ok:false,error:'Base64 audio kosong'};
  if(!data.id_pengisian) return {ok:false,error:'id_pengisian wajib diisi'};
  if(!data.question_id) return {ok:false,error:'question_id wajib diisi'};

  const mimeType = normalizeMime_(data.mime_type || 'audio/webm');
  const ext = extensionForMime_(mimeType);
  const idj = data.id_jawaban || ('J-'+Utilities.getUuid().replace(/-/g,'').slice(0,10).toUpperCase());
  const fileName = data.file_name || ('RTS_'+idj+'_'+Date.now()+ext);

  const bytes = Utilities.base64Decode(data.base64);
  if(!bytes.length) return {ok:false,error:'Audio kosong'};
  if(bytes.length > 10*1024*1024) return {ok:false,error:'Ukuran audio lebih dari 10 MB'};

  const folder = getAudioFolder_();
  const blob = Utilities.newBlob(bytes,mimeType,fileName);
  const file = folder.createFile(blob);
  const fileId=file.getId();
  const fileUrl=file.getUrl();

  // If Gemini is unavailable, keep the audio and enqueue it for later retry.
  try{
    const transcript = transcribeDriveAudio_(fileId,mimeType);
    return {
      ok:true,
      id_jawaban:idj,
      file_id:fileId,
      file_url:fileUrl,
      file_name:file.getName(),
      mime_type:mimeType,
      size:bytes.length,
      transkripsi:transcript,
      status:'TRANSKRIPSI_SELESAI'
    };
  }catch(err){
    addTranscriptionQueue_(idj,fileId,mimeType,data.id_pengisian,data.question_id);
    return {
      ok:false,
      recoverable:true,
      error:String(err && err.message || err),
      id_jawaban:idj,
      file_id:fileId,
      file_url:fileUrl,
      status:'MENUNGGU_TRANSKRIPSI'
    };
  }
}

function normalizeMime_(mime){
  mime=String(mime||'audio/webm').toLowerCase().split(';')[0].trim();
  const allowed=[
    'audio/webm','audio/m4a','audio/mp4','audio/mpeg','audio/mp3',
    'audio/wav','audio/ogg','audio/opus','audio/aac','audio/flac'
  ];
  return allowed.indexOf(mime)>=0 ? mime : 'audio/webm';
}

function extensionForMime_(mime){
  const m=String(mime);
  if(m==='audio/m4a') return '.m4a';
  if(m==='audio/mp4') return '.mp4';
  if(m==='audio/mpeg'||m==='audio/mp3') return '.mp3';
  if(m==='audio/wav') return '.wav';
  if(m==='audio/ogg') return '.ogg';
  if(m==='audio/opus') return '.opus';
  if(m==='audio/aac') return '.aac';
  if(m==='audio/flac') return '.flac';
  return '.webm';
}

function getAudioFolder_(){
  const folderName=cfg_('DRIVE_FOLDER_NAME') || 'Monev_RTS_DitIE_2026_Audio';
  const folders=DriveApp.getFoldersByName(folderName);
  if(folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

function transcribeDriveAudio_(fileId,mimeType){
  if(!GEMINI_KEY) throw new Error('GEMINI_API_KEY belum diset');

  const model=cfg_('GEMINI_MODEL_TRANSCRIBE') || 'gemini-3.5-transcribe';
  const file=DriveApp.getFileById(fileId);
  const blob=file.getBlob();
  const bytes=blob.getBytes();

  // Gemini Files API upload
  const uploadUrl='https://generativelanguage.googleapis.com/upload/v1beta/files?key='+encodeURIComponent(GEMINI_KEY);
  const uploadRes=UrlFetchApp.fetch(uploadUrl,{
    method:'post',
    contentType:mimeType,
    payload:bytes,
    muteHttpExceptions:true
  });
  const uploadCode=uploadRes.getResponseCode();
  const uploadText=uploadRes.getContentText();
  if(uploadCode<200 || uploadCode>=300){
    throw new Error('Gemini Files upload '+uploadCode+': '+uploadText.slice(0,500));
  }
  const uploadJson=JSON.parse(uploadText);
  const uri=uploadJson.file && uploadJson.file.uri;
  const uploadedMime=uploadJson.file && uploadJson.file.mimeType;
  if(!uri) throw new Error('Gemini tidak mengembalikan file URI');

  // Interactions API
  const interactionsUrl='https://generativelanguage.googleapis.com/v1beta/interactions?key='+encodeURIComponent(GEMINI_KEY);
  const payload={
    model:model,
    input:[{
      type:'audio',
      uri:uri,
      mime_type:uploadedMime || mimeType
    }],
    generation_config:{
      transcription_config:{
        language_codes:['id-ID'],
        mode:'smart'
      }
    }
  };

  const res=UrlFetchApp.fetch(interactionsUrl,{
    method:'post',
    contentType:'application/json',
    payload:JSON.stringify(payload),
    muteHttpExceptions:true
  });
  const code=res.getResponseCode();
  const text=res.getContentText();
  if(code<200 || code>=300){
    throw new Error('Gemini transcription '+code+': '+text.slice(0,700));
  }

  const j=JSON.parse(text);
  const transcript=j.output_text || (j.output && j.output.text) || '';
  if(!String(transcript).trim()) throw new Error('Gemini mengembalikan transkrip kosong');
  return String(transcript).trim();
}

/* =========================
   FALLBACK QUEUE
   ========================= */

function addTranscriptionQueue_(idJawaban,fileId,mimeType,idPengisian,questionId){
  const sheet=sh_('QUEUE_AI');
  sheet.appendRow([
    'Q-'+Utilities.getUuid().replace(/-/g,'').slice(0,10).toUpperCase(),
    idJawaban,
    'TRANSKRIPSI',
    'MENUNGGU',
    0,
    '',
    '',
    '',
    now_(),
    now_(),
    ''
  ]);
}

function processQueue(){
  return processTranscriptionQueueSafe_();
}

function runQueueWorker(){
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(5000)) return {ok:true,skipped:true,message:'Worker sedang berjalan'};
  try{
    return processTranscriptionQueueSafe_();
  }finally{
    lock.releaseLock();
  }
}

function processTranscriptionQueueSafe_(){
  const sheet=sh_('QUEUE_AI');
  const rows=sheet.getDataRange().getValues();
  const batch=Number(cfg_('QUEUE_BATCH_SIZE')||3);
  const maxRetry=Number(cfg_('MAX_RETRY')||4);
  let processed=0,success=0,failed=0,skipped=0;

  for(let i=1;i<rows.length && processed<batch;i++){
    const r=rows[i];
    if(String(r[2])!=='TRANSKRIPSI' || String(r[3])!=='MENUNGGU'){ skipped++; continue; }
    const retry=Number(r[4]||0);
    if(retry>=maxRetry){ sheet.getRange(i+1,4).setValue('GAGAL'); failed++; continue; }

    const qrow=i+1;
    sheet.getRange(qrow,4).setValue('DIPROSES');
    sheet.getRange(qrow,7).setValue(now_());

    try{
      const idj=String(r[1]);
      const ans=findAnswer_(idj);
      if(!ans || !ans.audio_file_id) throw new Error('Audio untuk queue tidak ditemukan');
      const transcript=transcribeDriveAudio_(ans.audio_file_id,ans.mime_type||'audio/webm');
      updateAnswerTranscript_(idj,transcript);
      sheet.getRange(qrow,4).setValue('SELESAI');
      sheet.getRange(qrow,8).setValue(now_());
      sheet.getRange(qrow,11).setValue('');
      success++;
    }catch(err){
      const next=retry+1;
      sheet.getRange(qrow,5).setValue(next);
      sheet.getRange(qrow,6).setValue(String(err && err.message || err).slice(0,1000));
      if(next>=maxRetry){
        sheet.getRange(qrow,4).setValue('GAGAL');
        failed++;
      }else{
        sheet.getRange(qrow,4).setValue('MENUNGGU');
        const waitMin=Math.pow(2,next-1);
        sheet.getRange(qrow,11).setValue(new Date(Date.now()+waitMin*60000));
      }
    }
    processed++;
  }
  return {ok:true,processed,success,failed,skipped};
}

function findAnswer_(idj){
  const v=sh_('JAWABAN').getDataRange().getValues();
  for(let i=1;i<v.length;i++){
    if(String(v[i][0])===idj){
      return {
        row:i+1,
        audio_file_id:String(v[i][6]||''),
        audio_url:String(v[i][7]||''),
        mime_type:String(v[i][11]||'audio/webm')
      };
    }
  }
  return null;
}

function updateAnswerTranscript_(idj,transcript){
  const v=sh_('JAWABAN').getDataRange().getValues();
  for(let i=1;i<v.length;i++){
    if(String(v[i][0])===idj){
      sh_('JAWABAN').getRange(i+1,10).setValue(transcript);
      sh_('JAWABAN').getRange(i+1,9).setValue('SELESAI');
      return true;
    }
  }
  throw new Error('ID jawaban tidak ditemukan: '+idj);
}

/* =========================
   SESSION / PROGRESS
   ========================= */

function getProgress(id){
  const q=sh_('JAWABAN').getDataRange().getValues();
  let total=0;
  for(let i=1;i<q.length;i++) if(String(q[i][1])===String(id)) total++;
  return {ok:true,id_pengisian:id,terjawab:total};
}

function finishSession(id){
  id=String(id||'').trim();
  if(!id) return {ok:false,error:'id_pengisian wajib diisi'};

  const p=sh_('PENGISIAN'), pv=p.getDataRange().getValues();
  let sessionRow=-1, jenis='';
  for(let i=1;i<pv.length;i++){
    if(String(pv[i][0])===id){ sessionRow=i+1; jenis=normalizeJenis_(pv[i][10]); break; }
  }
  if(sessionRow<0) return {ok:false,error:'ID pengisian tidak ditemukan'};

  const questions=getQuestions(jenis);
  const a=sh_('JAWABAN').getDataRange().getValues();
  const answered={};
  for(let i=1;i<a.length;i++){
    if(String(a[i][1])===id) answered[String(a[i][2])]={
      answer:String(a[i][5]||''),
      transcript:String(a[i][9]||''),
      status:String(a[i][8]||'')
    };
  }

  const missing=questions.filter(q=>!answered[q.question_id]);
  const noTranscript=questions.filter(q=>answered[q.question_id] && !answered[q.question_id].transcript);

  if(missing.length || noTranscript.length){
    return {
      ok:false,
      error:'Pengisian belum lengkap',
      total_pertanyaan:questions.length,
      terjawab:questions.length-missing.length,
      belum_terjawab:missing.length,
      belum_tertranskripsi:noTranscript.length
    };
  }

  p.getRange(sessionRow,3).setValue(now_());
  p.getRange(sessionRow,13).setValue('SELESAI');
  return {ok:true,id_pengisian:id,status:'SELESAI',total_pertanyaan:questions.length};
}

/* =========================
   TRIGGER
   ========================= */

function installQueueTrigger(){
  const triggers=ScriptApp.getProjectTriggers();
  triggers.forEach(t=>{
    if(t.getHandlerFunction()==='runQueueWorker') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('runQueueWorker').timeBased().everyMinutes(5).create();
  return {ok:true,message:'Trigger queue 5 menit dibuat'};
}
