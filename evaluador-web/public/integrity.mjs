const STOP=new Set('para como con sin por del las los una uno unos unas que quien donde cuando este esta estos estas desde sobre entre hacia tambien muy mas menos cada puede pueden debe deben trabajo entrega agente sistema usuario datos archivo archivos resultado resultados version prompt prompts readme final mediante dentro fuera solo misma mismo sus esta esto ese esa esos esas hay ser son fue fueron al el la lo y e o u de en se es a un no si ya'.split(' '));

const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function category(path){
  const p=norm(path).replaceAll('\\','/');
  if(/(?:^|\/)system[_ -]?prompt\.(?:md|txt|json)$/i.test(p))return'system_prompt';
  if(/(?:^|\/)user[_ -]?prompt\.(?:md|txt|json)$/i.test(p))return'user_prompt';
  if(/decisiones|decision_log|registro.*iteracion|iteraciones|changelog/.test(p))return'decisiones';
  if(/analisis.*econom|econom|costos?/.test(p))return'economico';
  if(/gobierno|riesgo|governance/.test(p))return'gobierno';
  if(/(?:^|\/)(readme|rubrica|consigna)\./.test(p))return null;
  if(/(?:^|\/)(corridas?|runs?|salidas?|outputs?|resultados?|casos?)\//.test(p))return null;
  if(/\.(?:md|txt)$/i.test(p))return'documento';
  return null;
}

function tokens(text){
  return norm(text)
    .replace(/https?:\/\/\S+/g,' url ')
    .replace(/[^a-z0-9ñ]+/g,' ')
    .split(/\s+/)
    .filter(w=>w.length>=3&&!STOP.has(w));
}

function hash32(str){
  let h=2166136261;
  for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}
  return h>>>0;
}

function shingles(words,n=4,limit=700){
  const set=new Set();
  if(words.length<n)return[];
  const stride=Math.max(1,Math.floor((words.length-n+1)/limit));
  for(let i=0;i<=words.length-n;i+=stride)set.add(hash32(words.slice(i,i+n).join(' ')));
  return[...set].slice(0,limit).sort((a,b)=>a-b);
}

function normalizedHash(words){return hash32(words.join(' ')).toString(16).padStart(8,'0')}

export function buildIntegrityProfile(files){
  const candidates=[];
  for(const file of files||[]){
    if(typeof file?.content!=='string')continue;
    const cat=category(file.path||'');if(!cat)continue;
    const words=tokens(file.content);if(words.length<45)continue;
    candidates.push({path:file.path,category:cat,wordCount:words.length,hash:normalizedHash(words),shingles:shingles(words)});
  }
  candidates.sort((a,b)=>b.wordCount-a.wordCount);
  const preferred=candidates.filter(x=>x.category!=='documento');
  const generic=candidates.filter(x=>x.category==='documento').slice(0,3);
  return{version:1,files:[...preferred.slice(0,7),...generic].slice(0,8)};
}

function jaccard(a,b){
  if(!a?.length||!b?.length)return 0;
  const small=a.length<=b.length?a:b,big=a.length<=b.length?b:a;
  const bs=new Set(big);let inter=0;for(const x of small)if(bs.has(x))inter++;
  return inter/(a.length+b.length-inter);
}

function comparable(a,b){return a.category===b.category||(a.category==='documento'&&b.category==='documento')}

export function compareProfiles(a,b){
  const matches=[];
  for(const fa of a?.files||[])for(const fb of b?.files||[]){
    if(!comparable(fa,fb))continue;
    const similarity=fa.hash===fb.hash?1:jaccard(fa.shingles,fb.shingles);
    if(similarity>=.48)matches.push({fileA:fa.path,fileB:fb.path,category:fa.category,similarity,exact:fa.hash===fb.hash});
  }
  matches.sort((x,y)=>y.similarity-x.similarity);
  const strong=matches.filter(m=>m.similarity>=.70);
  const veryStrong=matches.filter(m=>m.similarity>=.85);
  const exact=matches.filter(m=>m.exact);
  const max=matches[0]?.similarity||0;
  let level='low';
  if(exact.length>=1||max>=.94||veryStrong.length>=2)level='high';
  else if(max>=.78||strong.length>=2)level='medium';
  return{level,maxSimilarity:max,matches:matches.slice(0,5),exactFiles:exact.length};
}

function injectionCount(alerts){return(alerts||[]).filter(x=>/(ignorar reglas|ignorar.*rubrica|extraer instrucciones|instrucciones internas|system prompt)/i.test(String(x))).length}

export function buildIntegrityReport(item,allItems){
  const alerts=item?.result?.alertas_manipulacion||[];
  const inconsistencies=item?.result?.inconsistencias||[];
  const similarities=[];
  if(item?.integrityProfile?.files?.length){
    for(const other of allItems||[]){
      if(!other||other.id===item.id||!other.integrityProfile?.files?.length)continue;
      const cmp=compareProfiles(item.integrityProfile,other.integrityProfile);
      if(cmp.level!=='low'||cmp.maxSimilarity>=.65)similarities.push({itemId:other.id,name:other.target?.name||'Otro trabajo',source:other.target?.url||'',...cmp});
    }
  }
  similarities.sort((a,b)=>b.maxSimilarity-a.maxSimilarity);
  return{
    version:1,
    promptInjection:{count:injectionCount(alerts),alerts:alerts.filter(x=>/(ignorar reglas|ignorar.*rubrica|extraer instrucciones|instrucciones internas|system prompt)/i.test(String(x)))},
    manipulation:{count:alerts.length,alerts},
    contradictions:{count:inconsistencies.length},
    similarity:{comparedWith:(allItems||[]).filter(x=>x?.id!==item?.id&&x?.integrityProfile?.files?.length).length,matches:similarities.slice(0,5),highest:similarities[0]||null},
    changesScore:false,
    note:'Los controles de integridad son señales auxiliares. No determinan plagio ni modifican automáticamente la nota.'
  };
}
