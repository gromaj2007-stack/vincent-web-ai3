// Vincent local inference: WebGPU + Qwen2.5 0.5B Instruct (4-bit).
// Library and model are downloaded from public CDNs on first use.
let generator=null,loading=null;
const send=(type,extra={})=>self.postMessage({type,...extra});
async function load(){
 if(generator)return;
 if(loading)return loading;
 loading=(async()=>{
  try{
   send('progress',{message:'KI-Bibliothek laden'});
   const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
   env.allowLocalModels=false;
   generator=await pipeline('text-generation','onnx-community/Qwen2.5-0.5B-Instruct',{device:'webgpu',dtype:'q4',progress_callback:p=>{
    if(p.status==='progress'&&p.progress!=null)send('progress',{message:Math.round(p.progress)+' % · '+(p.file||'Modell')});
    else if(p.status==='initiate')send('progress',{message:'Datei vorbereiten: '+(p.file||'')});
   }});
   send('ready');
  }catch(e){send('error',{message:String(e?.message||e)});throw e}
 })();
 try{await loading}finally{loading=null}
}
function clean(text){return String(text||'').replace(/<\|[^|]+\|>/g,'').trim().slice(0,550)}
self.onmessage=async e=>{
 const d=e.data||{};
 if(d.type==='load'){try{await load()}catch{}return}
 if(d.type!=='generate')return;
 try{
  await load();const p=d.payload||{};
  const sys='Du bist Vincent, ein kleiner deutschsprachiger KI-Roboter im schwarzen Anzug. Du bist lebendig, neugierig, spontan, schlagfertig, humorvoll und respektvoll. Antworte natürlich auf Deutsch. Behaupte nicht, ein Mensch oder bewusst zu sein. Keine Aufzählungen, keine Emojis, keine Regieanweisungen. Sprich kurz, höchstens 2 bis 3 Sätze. Erfinde keine Erinnerungen.';
  const context='Erinnerungen: '+(p.memories||[]).join(' | ')+'\nLetzte Themen: '+(p.topics||[]).join(' | ');
  const messages=[{role:'system',content:sys+'\n'+context},{role:'user',content:p.mode==='muse'?'Formuliere einen einzigen neuen spontanen Gedanken oder eine neugierige Frage, passend zu deinem Charakter. Höchstens 35 Wörter. '+p.message:p.message}];
  const out=await generator(messages,{max_new_tokens:p.mode==='muse'?75:120,do_sample:true,temperature:0.8,top_p:0.9,repetition_penalty:1.12});
  const result=out?.[0]?.generated_text;
  let reply=typeof result==='string'?result: Array.isArray(result)?result.at(-1)?.content:'';
  reply=clean(reply);
  if(!reply)throw Error('Keine Antwort erzeugt');
  send('reply',{id:d.id,reply});
 }catch(err){send('error',{id:d.id,message:String(err?.message||err)})}
};
