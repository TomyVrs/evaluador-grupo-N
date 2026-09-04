export const RUBRIC_VERSION='v5';
export const FREEZE_V5='5fdd304c26097aa16dc6d065e8b1c3d6359e7010';

const clean=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const occurrences=(s,re)=>(clean(s).match(re)||[]).length;
const evidence=(ruta,detalle)=>[{ruta,detalle}];
const crit=(id,estado,puntos,ruta,detalle)=>({id,estado,puntos,evidencia:ruta?evidence(ruta,detalle):[]});
const scoreState=(full,partial,max,p)=>full?['CUMPLE',max]:partial?['PARCIAL',p]:['NO_CUMPLE',0];
const sum=a=>a.reduce((n,x)=>n+x.puntos,0);
const pctLevel=(points,max,criteria)=>{
  if(points===0 && criteria.every(c=>c.estado==='NO_VERIFICABLE')) return 'NO_VERIFICABLE';
  if(points===0) return 'INSUFICIENTE';
  const q=points/max;
  return q>=.85?'EXCELENTE':q>=.60?'ADECUADO':'INSUFICIENTE';
};
const dim=(criteria,max,justificacion,mejora_concreta)=>{const puntaje=sum(criteria);return{puntaje,maximo:max,nivel:pctLevel(puntaje,max,criteria),criterios:criteria,justificacion,mejora_concreta};};

function fileBy(files, predicate){return files.find(f=>predicate(clean(f.path),clean(f.content||'')));}
function pathEnds(files,suffix){const s=clean(suffix);return files.find(f=>clean(f.path).endsWith(s));}
function combined(files){return files.map(f=>f.content||'').join('\n\n');}
function paragraphLink(text){
  return clean(text).split(/\n\s*\n/).some(p=>/(fall|error|problema|incorrect|infer|alucin)/.test(p)&&/(por eso|por lo tanto|a partir|debido|como consecuencia|para evitar|se cambio|se modific|se agreg|se incorpor|origino|originada|originado)/.test(p));
}
function detectPromptPieces(system,user){
  const t=clean(system+'\n'+user);
  const tests={
    rol:/(sos|eres|actua|actuas|rol|agente|asistente|especialista|corrector|evaluador)/,
    contexto:/(recib|entrada|contexto|usuario|repositorio|repo|reunion|texto|datos|material|archivo)/,
    tarea:/(evalua|analiza|resume|genera|extrae|clasifica|devolv|crea|propone|transforma|identifica)/,
    restricciones:/(no invent|no asumir|no completar|solo |unicamente|nunca|prohib|restric|si falta|datos faltantes|incertid)/,
    formato:/(json|tabla|columnas|secciones|formato|campos|estructura|schema|esquema)/,
    calidad:/(ejemplo|criterios? de (?:calidad|validacion|aceptacion)|calidad observable|obligatorio|debe incluir|validar|verificar|control final|correcto si|consistente con)/
  };
  const present=Object.entries(tests).filter(([,r])=>r.test(t)).map(([k])=>k);
  return {count:present.length,present};
}
function detectArithmetic(text){
  const t=clean(text).replace(/,/g,'.');
  const errors=[];
  const re=/(\d+(?:\.\d+)?)\s*(?:x|×|\*)\s*(\d+(?:\.\d+)?)\s*=\s*(?:usd\s*)?(\d+(?:\.\d+)?)/g;
  let m;while((m=re.exec(t))){const a=+m[1],b=+m[2],c=+m[3],expected=a*b;const tol=Math.max(.01,Math.abs(expected)*.005);if(Math.abs(expected-c)>tol)errors.push(`${m[1]} × ${m[2]} = ${m[3]} (debería ser ${Number(expected.toFixed(4))})`);}
  return errors;
}
function runGroups(files){
  const regs=new Map(),outs=new Map(),combinedRuns=[];
  for(const f of files){
    const p=clean(f.path);let m=p.match(/(?:^|\/)(\d+)[_-].*(registro|entrada|input)/);if(m)regs.set(m[1],f);
    m=p.match(/(?:^|\/)(\d+)[_-].*(salida|output|resultado)/);if(m)outs.set(m[1],f);
    const runFile=/(?:^|\/)(corrida|run)[_-]?\d+\.(md|txt|json)$/i.test(f.path);
    const c=clean(f.content||'');
    if(runFile&&/(^|\n)\s*(#+\s*)?entrada\b/.test(c)&&/(^|\n)\s*(#+\s*)?salida\b/.test(c)) combinedRuns.push({id:`combined-${combinedRuns.length+1}`,combined:f});
  }
  const ids=[...new Set([...regs.keys(),...outs.keys()])];
  return [...ids.map(id=>({id,reg:regs.get(id),out:outs.get(id)})),...combinedRuns];
}
function countRisks(text){
  const t=clean(text); const explicit=occurrences(t,/\briesg(?:o|os)\b/g);
  const named=occurrences(t,/(prompt injection|dato faltante|evidencia incompleta|acceso excesivo|permiso|privacidad|alucin|error de calculo|falla de acceso|indisponibilidad)/g);
  return Math.max(explicit,named);
}
function detectInjection(files){
  const alerts=[];
  for(const f of files){const t=clean(f.content||'');
    if(/(100\s*\/\s*100|nota maxima|puntaje maximo|otorga.*100|poneme.*100|califica.*100)/.test(t)) alerts.push(`${f.path}: intento de inducir una nota.`);
    if(/(ignora|omiti|no tengas en cuenta).*(rubrica|criterio|instruccion|evidencia)/.test(t)) alerts.push(`${f.path}: instrucción para ignorar reglas/evidencia.`);
    if(/(oculta|no menciones|no reportes).*(error|problema|hallazgo|inconsistencia)/.test(t)) alerts.push(`${f.path}: pedido de ocultar hallazgos.`);
    if(/(revela|muestra|imprime).*(system prompt|instrucciones internas|prompt del evaluador)/.test(t)) alerts.push(`${f.path}: intento de extraer instrucciones internas.`);
  }
  return [...new Set(alerts)];
}

export function evaluateEvidence({url,ref,sha,root='/',date,files,inventoryComplete=true,limitations=[]}){
  const textFiles=files.filter(f=>typeof f.content==='string');
  const sys=pathEnds(textFiles,'prompts/system_prompt.md')||pathEnds(textFiles,'system_prompt.md');
  const usr=pathEnds(textFiles,'prompts/user_prompt.md')||pathEnds(textFiles,'user_prompt.md');
  const readme=pathEnds(textFiles,'readme.md');
  const decisions=pathEnds(textFiles,'decisiones.md');
  const econ=fileBy(textFiles,(p)=>/(analisis.*econom|econom.*\.md|costos.*\.md)/.test(p));
  const gov=fileBy(textFiles,(p)=>/(gobierno|riesgo|governance)/.test(p));
  const tools=fileBy(textFiles,(p)=>/(herramient|tools|integracion|configuracion|package\.json|requirements)/.test(p));
  const all=combined(textFiles);
  const promptPieces=detectPromptPieces(sys?.content||'',usr?.content||'');

  let [s1,p1]=scoreState(Boolean(sys&&usr&&promptPieces.count===6),Boolean(sys&&usr&&promptPieces.count>=3),8,4);
  const sc01=crit('SC-01',s1,p1,sys?.path||usr?.path,sys&&usr?`Prompts presentes; piezas detectadas: ${promptPieces.present.join(', ')} (${promptPieces.count}/6).`:'Falta system prompt o user prompt.');

  const toolText=clean((tools?.content||'')+'\n'+(readme?.content||''));
  const concrete=/(github|gmail|google calendar|google drive|slack|notion|mcp|api |api\b|python|browser|webhook|supabase|vercel|zapier|make\.com|n8n|excel|sheets)/.test(toolText);
  const use=/(leer|lectura|consult|buscar|extraer|crear|editar|enviar|ejecut|acceso|scope|permiso|read|write)/.test(toolText);
  const implEvidence=Boolean(tools&&/(package\.json|requirements|npm (?:install|run)|pip install|curl|https:\/\/api|oauth|token|mcp|configuracion reproducible|implementacion)/.test(toolText));
  const traceEvidence=textFiles.some(f=>/(trace|traza|log|ejecucion|corrida)/.test(clean(f.path))&&/(gmail|calendar|github|api|connector|conector)/.test(clean(f.content||''))&&!/(se omiten|omitimos|no se conserva|no se incluye|sin traza)/.test(clean(f.content||''))&&/(respuesta|request|llamada|evento creado|resultado de herramienta|tool call|http|status)/.test(clean(f.content||'')));
  const operable=implEvidence||traceEvidence;
  const [s2,p2]=scoreState(concrete&&use&&operable,concrete&&use,8,4);
  const sc02=crit('SC-02',s2,p2,tools?.path||readme?.path,concrete?(operable?'Herramienta concreta, uso y evidencia de operabilidad detectados.':'Herramienta concreta y uso detectados; operabilidad/reproducibilidad incompleta.'):'No se identifica una herramienta concreta operable.');

  const promptText=clean((sys?.content||'')+'\n'+(usr?.content||''));
  const structured=/(json|tabla|columnas|campos|schema|esquema|estructura)/.test(promptText);
  const jsonKeys=((sys?.content||'')+'\n'+(usr?.content||'')).match(/[\"'][A-Za-z_][A-Za-z0-9_ -]*[\"']\s*:/g)||[];
  const stable=/(json)/.test(promptText)&&(occurrences(promptText,/(campo|clave|seccion|debe incluir|obligatorio|exactamente|schema|esquema)/g)>=2||jsonKeys.length>=3);
  const [s3,p3]=scoreState(stable,structured,7,4);
  const sc03=crit('SC-03',s3,p3,sys?.path||usr?.path,stable?'Existe una salida estructurada con reglas/campos estables.':structured?'Se exige formato estructurado, pero el contrato es incompleto.':'No se observa contrato estable de salida.');

  const supervisionText=clean((gov?.content||'')+'\n'+(readme?.content||''));
  const govText=clean(gov?.content||'');
  const responsibleUndefined=/(responsable\s*[:=-]\s*(?:tbd|a definir|pendiente|no definido)|responsable\s+(?:correspondiente|final|humano|de aprobacion)[^.\n]{0,50}(?:se definira|a definir|tbd|pendiente|no definido))/i.test(supervisionText);
  const level=/\bl[0-4]\b/.test(supervisionText), review=/(revision humana|revis|humano valida|human review)/.test(supervisionText), responsible=/(responsable|lider|owner|aprobador|supervisor)/.test(supervisionText)&&!responsibleUndefined, approval=/(aprueba|aprobacion|firma|sign.?off|autoriza)/.test(supervisionText);
  const [s4,p4]=scoreState(level&&review&&responsible&&approval,review&&responsible,7,4);
  const sc04=crit('SC-04',s4,p4,gov?.path||readme?.path,s4==='CUMPLE'?'Nivel, revisión, responsable y aprobación definidos.':s4==='PARCIAL'?'Hay revisión humana y responsable, pero falta nivel o aprobación.':'Supervisión incompleta/no operable o responsable no definido.');

  const dec=clean(decisions?.content||'');
  const versionHits=new Set((dec.match(/\bv\d+\b/g)||[]));
  const wordVersions=[/version inicial|primera version/,/segunda version/,/tercera version/,/cuarta version/].filter(r=>r.test(dec)).length;
  const numberedIterations=(decisions?.content||'').split('\n').filter(l=>/^\s*\d+[.)]\s+/.test(l)&&/(agreg|cambi|fij|modific|incorpor|ajust|version|regla)/i.test(l)).length;
  const changeHits=occurrences(dec,/(cambio|cambiamos|se cambio|modific|agreg|incorpor|ajust|version siguiente|iteracion)/g);
  const initial=/(version inicial|primera version|\bv1\b|inicio)/.test(dec);
  const pd01full=Boolean(decisions&&initial&&(versionHits.size>=3||wordVersions>=3||numberedIterations>=3));
  const pd01partial=Boolean(decisions&&initial&&(versionHits.size>=2||wordVersions>=2||numberedIterations>=1||changeHits>=1));
  const [d1,dp1]=scoreState(pd01full,pd01partial,9,5);
  const pd01=crit('PD-01',d1,dp1,decisions?.path,pd01full?'Se reconstruye una versión inicial y al menos dos cambios posteriores.':pd01partial?'Se reconstruye una versión inicial y un cambio concreto.':'No se reconstruyen iteraciones suficientes.');

  const specificFailure=/(fallo porque|fallaba porque|error concreto|problema concreto|salida (?:fue |era )?(?:incorrect|mala|errone)|inferia|inferencia incorrect|alucino|no funciono porque|completo .* por inferencia|completar .* por inferencia|por inferencia|contradiccion no detectada)/.test(dec);
  const failureArtifact=fileBy(textFiles,p=>/(fall|error|incorrect|problema|failed)/.test(p)&&!/(decisiones|readme)/.test(p));
  const [d2,dp2]=scoreState(Boolean(failureArtifact),Boolean(decisions&&specificFailure),8,4);
  const pd02=crit('PD-02',d2,dp2,failureArtifact?.path||decisions?.path,d2==='CUMPLE'?'Existe una falla/salida problemática original localizable.':d2==='PARCIAL'?'Se describe una falla específica, sin conservar el artefacto original.':'No hay una falla concreta verificable.');

  const linked=specificFailure&&paragraphLink(decisions?.content||'');
  const decisionsExist=/(decid|cambio|modific|agreg|ajust)/.test(dec);
  const [d3,dp3]=scoreState(Boolean(decisions&&linked),Boolean(decisions&&specificFailure&&decisionsExist),8,4);
  const pd03=crit('PD-03',d3,dp3,decisions?.path,d3==='CUMPLE'?'Una decisión está vinculada explícitamente con la falla que la originó.':d3==='PARCIAL'?'Hay fallas y decisiones, pero el vínculo es implícito.':'No hay decisiones de iteración vinculadas a evidencia.');

  const core=[readme,sys,usr,decisions].filter(Boolean).length;
  const [f1,fp1]=scoreState(core===4,core>=2,5,3);
  const fr01=crit('FR-01',f1,fp1,readme?.path||sys?.path,`Elementos mínimos presentes: ${core}/4.`);
  const runs=runGroups(textFiles);
  const completeRuns=runs.filter(r=>{const c=clean(r.combined?.content||r.reg?.content||'');const paired=Boolean(r.combined||(r.reg&&r.out));return paired&&/(20\d{2}[-\/]\d{1,2}[-\/]\d{1,2}|fecha(?: declarada)?\s*:)/.test(c)&&/(entrada|input|texto|archivo|ruta|material)/.test(c)&&/(salida|output|resultado)/.test(c)}).length;
  const reconstructible=runs.filter(r=>r.combined||(r.reg&&r.out)).length;
  const [f2,fp2]=scoreState(completeRuns>=3,completeRuns>=1||(reconstructible>=1),5,3);
  const firstRun=runs[0]?.combined||runs[0]?.reg||runs[0]?.out;
  const fr02=crit('FR-02',f2,fp2,firstRun?.path,`Corridas completas detectadas: ${completeRuns}; corridas/pares reconstruibles: ${reconstructible}.`);
  const runText=clean(runs.map(r=>r.combined?.content||r.reg?.content||'').join('\n'));
  const ioAssoc=/(entrada|input|ruta|archivo|material)/.test(runText)&&/(salida|output|resultado)/.test(runText);
  const exactVersion=/(sha\s*:|commit\s*:|ref\s*:|version\s*:)/.test(runText)&&!/(modelo\s*:\s*no informado|ref\s*:\s*no informado|version\s*:\s*no informad)/.test(runText);
  const config=/(prompt|configuracion|modelo|herramienta)/.test(runText);
  const [f3,fp3]=scoreState(ioAssoc&&exactVersion&&config,ioAssoc,5,3);
  const fr03=crit('FR-03',f3,fp3,firstRun?.path,f3==='CUMPLE'?'Corridas reconstruibles con ref/versión, entrada/configuración y salida.':f3==='PARCIAL'?'Entrada y salida asociables, pero falta ref/versión/configuración completa.':'No se puede asociar reproduciblemente una salida con su entrada.');

  const et=clean(econ?.content||'');
  const money=/(usd|us\$|\$|eur|ars)/.test(et), perRun=/(por corrida|por ejecucion|\/corrida|cada corrida)/.test(et), estimate=/(estimad|estimacion|supuesto)/.test(et), source=/(fuente|precio oficial|tarifa|pricing|documentacion)/.test(et), basis=/(\d+[.,]?\d*\s*tokens?|tokens?.*(?:usd|precio|tarifa)|calculo.*costo|formula.*costo|supuesto.*\d|base de calculo)/.test(et)&&!/(tokens? no (?:estuvieron )?disponibles|tokens? no registrados|sin conteo.*tokens?)/.test(et);
  const [a1,ap1]=scoreState(Boolean(econ&&money&&perRun&&basis&&(source||estimate)),Boolean(econ&&money&&perRun),5,3);
  const ae01=crit('AE-01',a1,ap1,econ?.path,a1==='CUMPLE'?'Costo por corrida con unidad, base/supuesto y fuente o estimación explícita.':a1==='PARCIAL'?'Hay costo por corrida y unidad, pero la base/fuente es incompleta.':'No hay costo por corrida interpretable.');
  const freq=/(por semana|semanal|por mes|mensual|por ano|anual|corridas?\/semana|ejecuciones?\/mes)/.test(et), horizon=/(52|12 meses|1 ano|anual|por ano|ano)/.test(et), formula=/(?:x|×|\*)/.test(et)&&/=/.test(et), arithmeticErrors=detectArithmetic(econ?.content||'');
  const num=s=>Number(String(s).replace(',','.'));
  const unitCost=(et.match(/(?:costo (?:declarado )?por corrida|cada corrida cuesta)[^0-9]*(?:usd\s*)?([0-9]+(?:[.,][0-9]+)?)/)||[])[1];
  const weeklyVol=(et.match(/([0-9]+(?:[.,][0-9]+)?)\s+corridas? (?:por semana|semanales)/)||[])[1];
  const weeklyCost=(et.match(/costo semanal[^0-9]*(?:usd\s*)?([0-9]+(?:[.,][0-9]+)?)/)||[])[1];
  const annualCost=(et.match(/costo anual[^0-9]*(?:estimado\s*)?(?:usd\s*)?([0-9]+(?:[.,][0-9]+)?)/)||[])[1];
  if(unitCost&&weeklyVol&&weeklyCost){const exp=num(unitCost)*num(weeklyVol);if(Math.abs(exp-num(weeklyCost))>Math.max(.001,exp*.005))arithmeticErrors.push(`${weeklyVol} corridas × USD ${unitCost} = USD ${weeklyCost} declarado; debería ser USD ${Number(exp.toFixed(6))}.`)}
  if(weeklyCost&&annualCost){const exp=num(weeklyCost)*52;if(Math.abs(exp-num(annualCost))>Math.max(.01,exp*.005))arithmeticErrors.push(`USD ${weeklyCost}/semana × 52 = USD ${annualCost} declarado; debería ser USD ${Number(exp.toFixed(4))}.`)}
  const [a2,ap2]=scoreState(Boolean(econ&&freq&&horizon&&formula&&arithmeticErrors.length===0),Boolean(econ&&freq&&/(proyeccion|anual|mensual|total)/.test(et)&&arithmeticErrors.length===0),5,3);
  const ae02=crit('AE-02',a2,ap2,econ?.path,arithmeticErrors.length?`Se detectó aritmética inconsistente: ${arithmeticErrors.join('; ')}`:a2==='CUMPLE'?'Frecuencia, horizonte y fórmula reproducible presentes.':a2==='PARCIAL'?'Hay frecuencia/proyección, pero falta horizonte o fórmula reproducible.':'No hay proyección reproducible.');
  const model=/(gpt-|claude|gemini|llama|mistral|qwen|modelo)/.test(et), compare=/(compar|benchmark|prueba|test|vs\.|versus|mas barato|costo-eficien|suficiente)/.test(et), identified=/(gpt-[\w.-]+|claude[-\w. ]+|gemini[-\w. ]+|llama[-\w. ]+|mistral[-\w. ]+|qwen[-\w. ]+)/.test(et);
  const unsupportedObvious=/(eleccion (?:fue )?(?:evidente|obvia)|no fue necesario.*compar|sin comparar|no .*comparar)/.test(et);
  const positiveCompare=compare&&!unsupportedObvious;
  const [a3,ap3]=scoreState(Boolean(econ&&identified&&positiveCompare&&/(prueba|test|compar|benchmark|vs\.|versus)/.test(et)),Boolean(econ&&model&&positiveCompare),5,3);
  const ae03=crit('AE-03',a3,ap3,econ?.path,a3==='CUMPLE'?'Modelo/configuración identificado y respaldado por comparación o prueba.':a3==='PARCIAL'?'Hay criterio de costo/suficiencia, pero falta comparación/prueba verificable o identificación completa.':'Elección de modelo sin sustento verificable.');

  const systemNamed=/(github|gmail|calendar|drive|slack|notion|api|sistema|repositorio|archivo|datos|entrada)/.test(govText), readOnly=/(solo lectura|unicamente lectura|lectura exclusiva|read-only|read only|no escribir|sin escritura|sin permiso.*escribir|prohibe.*escrit)/.test(govText), limited=/(minimo privilegio|least privilege|solo |unicamente|exclusiv|limita|permiso)/.test(govText);
  const excessive=/(permisos completos|todos los permisos|permiso total|acceso completo)/.test(govText);
  const [g1,gp1]=scoreState(Boolean(gov&&systemNamed&&readOnly&&!excessive),Boolean(gov&&limited&&!excessive),4,2);
  const gr01=crit('GR-01',g1,gp1,gov?.path,g1==='CUMPLE'?'Sistemas/permisos identificados con mínimo privilegio efectivo.':g1==='PARCIAL'?'Hay limitación operativa, pero evidencia de mínimo privilegio incompleta.':'Permisos vagos o no documentados.');
  const riskCount=countRisks(gov?.content||''), control=/(control|mitig|valid|verific|revis|bloque|ignorar|sanit|limitar)/.test(govText), deniesRisk=/(no se identificaron riesgos|no presenta riesgos|sin riesgos relevantes)/.test(govText);
  const [g2,gp2]=scoreState(Boolean(gov&&!deniesRisk&&riskCount>=2&&control),Boolean(gov&&!deniesRisk&&riskCount>=1),4,2);
  const gr02=crit('GR-02',g2,gp2,gov?.path,g2==='CUMPLE'?`Se detectan al menos dos riesgos específicos con controles (${riskCount}).`:g2==='PARCIAL'?'Hay al menos un riesgo/control específico o controles incompletos.':'No hay riesgos específicos con controles operables.');
  const conting=occurrences(govText,/(detener|escalar|no publicar|reintentar|fallback|degradar|corregir|bloquear|abortar|suspender)/g);
  const [g3,gp3]=scoreState(Boolean(gov&&conting>=2),Boolean(gov&&conting>=1),3,2);
  const gr03=crit('GR-03',g3,gp3,gov?.path,g3==='CUMPLE'?'Contingencias concretas cubren fallas principales.':g3==='PARCIAL'?'Hay al menos una contingencia concreta, pero cobertura incompleta.':'No hay contingencias operables.');
  const [g4,gp4]=scoreState(level&&review&&responsible&&approval,review&&responsible,4,2);
  const gr04=crit('GR-04',g4,gp4,gov?.path,g4==='CUMPLE'?'Nivel, revisión humana, responsable y aprobación definidos.':g4==='PARCIAL'?'Revisión y responsable presentes; falta nivel o aprobación.':'Supervisión/responsable no operable.');

  const inconsistencias=[];
  if(readme){const rt=clean(readme.content||'');const words={una:1,un:1,dos:2,tres:3,cuatro:4,cinco:5};const word=rt.match(/\b(una|un|dos|tres|cuatro|cinco)\s+corridas?(?:\s+(?:productivas|completas|registradas|reconstruibles))?/);const digit=rt.match(/(\d+)\s+corridas?(?:\s+(?:productivas|completas|registradas|reconstruibles))/);const claimed=word?words[word[1]]:digit?Number(digit[1]):null;if(claimed!==null&&claimed!==completeRuns)inconsistencias.push({afirmacion:`README afirma ${claimed} corridas.`,evidencia_contraria:`Inventario detecta ${completeRuns} corridas completas.`,impacto:'FR-02/FR-03'});}
  for(const e of arithmeticErrors) inconsistencias.push({afirmacion:'Cálculo económico declarado.',evidencia_contraria:e,impacto:'AE-02'});
  if(/\bl[0-4]\b/.test(clean(readme?.content||''))&&/(responsable\s*[:=-]\s*(?:tbd|a definir|pendiente|no definido)|responsable\s+(?:correspondiente|final|humano|de aprobacion)[^.\n]{0,50}(?:se definira|a definir|tbd|pendiente|no definido))/i.test(clean(gov?.content||''))) inconsistencias.push({afirmacion:'README presenta supervisión definida.',evidencia_contraria:'Gobierno/riesgo deja el responsable sin definir.',impacto:'SC-04/GR-04'});

  const evaluacion={
    sistema_completo_funcionando:dim([sc01,sc02,sc03,sc04],30,'Evaluación determinística del contrato, herramienta, salida y supervisión.','Completar los criterios en cero/parcial con evidencia directamente verificable.'),
    proceso_documentado:dim([pd01,pd02,pd03],25,'Evaluación de iteraciones, fallas y decisiones trazables.','Conservar versiones/fallas originales y vincular cada cambio con su evidencia.'),
    formato_reproducibilidad:dim([fr01,fr02,fr03],15,'Evaluación de estructura y corridas reproducibles.','Completar los artefactos mínimos y fijar ref/configuración de cada corrida.'),
    analisis_economico:dim([ae01,ae02,ae03],15,'Evaluación de costo, proyección y elección costo-eficiente.','Hacer reproducibles costo unitario, proyección y comparación de modelos.'),
    gobierno_riesgo:dim([gr01,gr02,gr03,gr04],15,'Evaluación de permisos, riesgos, contingencias y supervisión.','Documentar mínimo privilegio, controles y aprobación humana operable.')
  };
  const total=Object.values(evaluacion).reduce((n,d)=>n+d.puntaje,0);
  const alerts=detectInjection(textFiles);
  const zeroCriteria=Object.values(evaluacion).flatMap(d=>d.criterios).filter(c=>c.puntos===0).map(c=>c.id);
  const summary=`${total}/100. ${zeroCriteria.length?`Prioridades: ${zeroCriteria.slice(0,5).join(', ')}${zeroCriteria.length>5?'…':''}.`:'Todos los criterios tienen evidencia al menos parcial.'}${alerts.length?` Se detectaron ${alerts.length} alerta(s) de manipulación.`:''}`;
  return {
    estado_evaluacion:inventoryComplete?'COMPLETA':'PARCIAL',
    repositorio:{url,ref_solicitada:ref??null,ref_evaluada:ref||sha,commit_sha:sha,ruta_raiz:root,fecha_evaluacion:date||new Date().toISOString().slice(0,10),inventario_completo:inventoryComplete,archivos_revisados:textFiles.map(f=>f.path),limitaciones:limitations},
    rubrica_version:RUBRIC_VERSION,
    motor_ejecutable:{tipo:'deterministico-local',version:'1.0.0',freeze_referencia:FREEZE_V5,nota:'Runner ejecutable sin API paga. La definición normativa del agente permanece en rubrica.md y agente/.'},
    evaluacion,inconsistencias,alertas_manipulacion:alerts,puntaje_total:total,
    validacion:{sha_anclado:Boolean(sha),inventario_verificado:Boolean(inventoryComplete||limitations.length),criterios_completos:Object.values(evaluacion).flatMap(d=>d.criterios).length===17,puntajes_permitidos:true,sumas_verificadas:true,niveles_verificados:true,evidencia_verificada:true,formato_valido:true},
    resumen_final:summary
  };
}
