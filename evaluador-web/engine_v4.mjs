import { evaluateEvidence as evaluateV3, FREEZE_V5, RUBRIC_VERSION } from './engine_v3.mjs?core=1';

export { FREEZE_V5, RUBRIC_VERSION };

const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function criterion(result,id){
  return Object.values(result.evaluacion||{}).flatMap(d=>d.criterios||[]).find(c=>c.id===id);
}

function setCriterion(result,id,estado,puntos,file,detalle){
  const c=criterion(result,id); if(!c)return;
  c.estado=estado;c.puntos=puntos;c.evidencia=file?[{ruta:file.path,detalle}]:[];
}

function recalc(result){
  for(const d of Object.values(result.evaluacion||{})){
    d.puntaje=d.criterios.reduce((n,c)=>n+c.puntos,0);
    if(d.puntaje===0&&d.criterios.every(c=>c.estado==='NO_VERIFICABLE')) d.nivel='NO_VERIFICABLE';
    else { const q=d.maximo?d.puntaje/d.maximo:0; d.nivel=d.puntaje===0?'INSUFICIENTE':q>=.85?'EXCELENTE':q>=.60?'ADECUADO':'INSUFICIENTE'; }
  }
  result.puntaje_total=Object.values(result.evaluacion||{}).reduce((n,d)=>n+d.puntaje,0);
  const zero=Object.values(result.evaluacion||{}).flatMap(d=>d.criterios||[]).filter(c=>c.puntos===0).map(c=>c.id);
  result.resumen_final=`${result.puntaje_total}/100. ${zero.length?`Prioridades: ${zero.slice(0,5).join(', ')}${zero.length>5?'…':''}.`:'Todos los criterios tienen evidencia al menos parcial.'}${result.alertas_manipulacion?.length?` Se detectaron ${result.alertas_manipulacion.length} alerta(s) de manipulación.`:''}`;
  if(result.motor_ejecutable){
    result.motor_ejecutable.version='1.3.0';
    result.motor_ejecutable.nota='Motor determinístico complementario al agente V5. Busca evidencia por contenido y estructura semántica, usando rutas solo como señal auxiliar. La fuente normativa sigue siendo rubrica.md y agente/.';
  }
}

function bestFile(files,tests){
  let best=null,bestScore=0;
  for(const f of files){
    const t=norm(f.content||''); let score=0;
    for(const [re,w=1] of tests) if(re.test(t)) score+=w;
    if(score>bestScore){best=f;bestScore=score;}
  }
  return {file:best,score:bestScore};
}

function upgradeEconomicEvidence(result,files){
  const {file:econ,score}=bestFile(files,[
    [/(costo por corrida|costo\/corrida|por ejecucion)/,3],
    [/(usd|us\$|ars|eur|moneda)/,1],
    [/(token|precio unitario|tarifa|pricing|fuente)/,2],
    [/(proyeccion|mensual|anual|frecuencia|horizonte)/,2],
    [/(modelo|model).*(costo|econom|barato|eficien)/,1]
  ]);
  if(!econ||score<3)return;
  const t=norm(econ.content||'');
  const ae1=criterion(result,'AE-01');
  const perRun=/(costo por corrida|costo\/corrida|por ejecucion)/.test(t);
  const unit=/(usd|us\$|ars|eur|\$)/.test(t);
  const basis=/(tokens?|cantidad|precio unitario|tarifa|supuesto|estimad|medid)/.test(t);
  const source=/(fuente|pricing|precio oficial|tarifa oficial|documentacion)/.test(t);
  if(ae1&&ae1.puntos<5&&perRun&&unit&&basis&&source) setCriterion(result,'AE-01','CUMPLE',5,econ,'Costo por corrida con moneda/unidad, base de cálculo o supuesto y fuente/carácter estimado verificable en el contenido.');
  else if(ae1&&ae1.puntos===0&&perRun&&unit) setCriterion(result,'AE-01','PARCIAL',3,econ,'Existe costo por corrida y unidad, pero falta base/fuente suficiente.');

  const ae2=criterion(result,'AE-02');
  const frequency=/(por mes|mensual|diari|semanal|corridas? por|veces por)/.test(t);
  const horizon=/(anual|12 meses|por ano|por año|horizonte|meses)/.test(t);
  const formula=/(\*|×|x\s*\d|=\s*(?:usd|ars|eur|\$)?\s*\d|formula|c[aá]lculo)/.test(t);
  if(ae2&&ae2.puntos<5&&frequency&&horizon&&formula) setCriterion(result,'AE-02','CUMPLE',5,econ,'Frecuencia, horizonte y cálculo reproducible aparecen en la evidencia económica, independientemente del nombre del archivo.');
  else if(ae2&&ae2.puntos===0&&frequency&&/(proyeccion|anual|mensual)/.test(t)) setCriterion(result,'AE-02','PARCIAL',3,econ,'Hay frecuencia y proyección, pero falta fórmula u horizonte completo.');

  const ae3=criterion(result,'AE-03');
  const chosen=/(modelo elegido|elegimos|seleccionamos|modelo recomendado|model:|modelo:)/.test(t);
  const rationale=/(costo[- ]?eficien|mas barato|más barato|menor costo|suficiente|compar|trade.?off)/.test(t);
  if(ae3&&ae3.puntos<5&&chosen&&rationale&&/(prueba|compar|resultado|suficiente)/.test(t)) setCriterion(result,'AE-03','CUMPLE',5,econ,'Modelo/configuración identificada y justificada mediante comparación o criterio verificable de suficiencia y costo-eficiencia.');
  else if(ae3&&ae3.puntos===0&&chosen&&rationale) setCriterion(result,'AE-03','PARCIAL',3,econ,'Existe una elección costo-eficiente razonada, pero falta evidencia comparativa suficiente.');
}

function upgradeProcessByContent(result,files){
  const {file:doc,score}=bestFile(files,[
    [/(iteracion|version inicial|\bv1\b|\bv2\b|\bv3\b)/,2],
    [/(que fallo|falla|error|problema|salida incorrect|salida incomplet)/,2],
    [/(se cambio|se modific|se agreg|cambio realizado|decision|por eso|para evitar)/,2]
  ]);
  if(!doc||score<4)return;
  const t=norm(doc.content||'');
  const versions=new Set(t.match(/\bv\d+\b/g)||[]);
  const iterationCount=(t.match(/iteracion\s+\d+/g)||[]).length;
  const changes=(t.match(/(se cambio|se modific|se agreg|se incorpor|se reemplaz|cambio realizado)/g)||[]).length;
  const failures=/(que fallo|falla observada|error|problema observado|salida .*?(incorrect|incomplet|errone|mala))/.test(t);
  const linked=failures&&/(por eso|por lo tanto|para evitar|debido|como consecuencia|se cambio|se modific|se agreg)/.test(t);
  const pd1=criterion(result,'PD-01');
  if(pd1&&pd1.puntos<9&&(versions.size>=3||iterationCount>=3)&&changes>=2) setCriterion(result,'PD-01','CUMPLE',9,doc,'Se reconstruye una versión inicial y al menos dos cambios posteriores a partir del contenido, sin exigir un nombre de archivo específico.');
  else if(pd1&&pd1.puntos===0&&(versions.size>=2||iterationCount>=2)&&changes>=1) setCriterion(result,'PD-01','PARCIAL',5,doc,'Se reconstruye una versión inicial y al menos un cambio concreto.');
  const pd2=criterion(result,'PD-02');
  if(pd2&&pd2.puntos===0&&failures) setCriterion(result,'PD-02','PARCIAL',4,doc,'Se documenta al menos una falla específica con detalle suficiente, aunque no se pudo vincular inequívocamente a una salida fallida original.');
  const pd3=criterion(result,'PD-03');
  if(pd3&&pd3.puntos<8&&linked) setCriterion(result,'PD-03','CUMPLE',8,doc,'La evidencia vincula explícitamente una falla con el cambio o decisión aplicado.');
}

function runLike(files){
  const items=[];
  for(const f of files){
    const p=norm(f.path),t=norm(f.content||'');
    let json=null; try{json=JSON.parse(f.content||'');}catch{}
    const id=(p.match(/(?:corrida|run|salida|output|entrada|input)[_-]?(\d+)/)||p.match(/(?:^|\/)(\d+)[_-]/)||[])[1];
    const hasDate=Boolean(json?.fecha||json?.date||json?.timestamp)||/\b20\d{2}[-\/]\d{1,2}[-\/]\d{1,2}\b/.test(t);
    const hasInput=Boolean(json?.entrada||json?.input||json?.reproducibilidad?.entrada||json?.reproducibilidad?.ruta)||/(^|\n)\s*(#+\s*)?(entrada|input)\b/.test(t)||/(entrada|input|registro)/.test(p);
    const hasOutput=Boolean(json&&('salida' in json||'output' in json||'resultado' in json||'salida_parseada' in json))||/(^|\n)\s*(#+\s*)?(salida|output|resultado)\b/.test(t)||/(salida|output|resultado)/.test(p);
    const hasConfig=Boolean(json?.modelo||json?.model||json?.reproducibilidad?.modelo||json?.reproducibilidad?.version_agente||json?.reproducibilidad?.sha)||/(system prompt|user prompt|configuracion|modelo|version|\bv\d+\b)/.test(t);
    if(id&&(hasInput||hasOutput)) items.push({id,f,hasDate,hasInput,hasOutput,hasConfig});
  }
  const groups=new Map();
  for(const x of items){const g=groups.get(x.id)||{id:x.id,files:[],hasDate:false,hasInput:false,hasOutput:false,hasConfig:false};g.files.push(x.f);g.hasDate||=x.hasDate;g.hasInput||=x.hasInput;g.hasOutput||=x.hasOutput;g.hasConfig||=x.hasConfig;groups.set(x.id,g);}
  return [...groups.values()];
}

function upgradeRunsByAssociation(result,files){
  const runs=runLike(files); const complete=runs.filter(r=>r.hasDate&&r.hasInput&&r.hasOutput);
  const fr2=criterion(result,'FR-02');
  if(fr2&&fr2.puntos<5&&complete.length>=3) setCriterion(result,'FR-02','CUMPLE',5,complete[0].files[0],`${complete.length} corridas asociables conservan fecha, entrada y salida; no se exige convención fija de nombres.`);
  else if(fr2&&fr2.puntos===0&&complete.length>=1) setCriterion(result,'FR-02','PARCIAL',3,complete[0].files[0],`${complete.length} corrida(s) reconstruible(s) con fecha, entrada y salida.`);
  const fr3=criterion(result,'FR-03'); const rep=complete.filter(r=>r.hasConfig);
  if(fr3&&fr3.puntos<5&&rep.length>=1) setCriterion(result,'FR-03','CUMPLE',5,rep[0].files[0],'Puede asociarse entrada, salida, configuración relevante y referencia/versión a partir de los artefactos de la corrida.');
}

function upgradeGovernanceByContent(result,files){
  const {file:gov,score}=bestFile(files,[
    [/(\bl[0-4]\b|supervision|revision humana|human review)/,2],
    [/(responsable|owner|aprobador|manager|jefe|director)/,1],
    [/(aprueba|aprobacion|firma|sign.?off|autoriza)/,1],
    [/(riesgo|permiso|minimo privilegio|contingencia|escalar|detener)/,2]
  ]);
  if(!gov||score<3)return;
  const t=norm(gov.content||'');
  const level=/\bl[0-4]\b/.test(t),review=/(revision humana|human review|revisado por|valida.*humano|humano.*valida)/.test(t),role=/(responsable|owner|aprobador|manager|jefe|director|supervisor)/.test(t),approval=/(aprueba|aprobacion|firma|sign.?off|autoriza)/.test(t);
  if(level&&review&&role&&approval){
    if(criterion(result,'SC-04')?.puntos<7)setCriterion(result,'SC-04','CUMPLE',7,gov,'Nivel L0–L4, revisión humana, responsable y aprobación/firma definidos en evidencia material.');
    if(criterion(result,'GR-04')?.puntos<4)setCriterion(result,'GR-04','CUMPLE',4,gov,'Supervisión, responsable y aprobación definidos de forma operable.');
  }
  const risks=(t.match(/\briesg(?:o|os)\b/g)||[]).length;
  const controls=(t.match(/(control|mitig|valid|bloque|limita|solo lectura|read.?only|minimo privilegio)/g)||[]).length;
  if(criterion(result,'GR-02')?.puntos<4&&risks>=2&&controls>=2)setCriterion(result,'GR-02','CUMPLE',4,gov,'Se identifican al menos dos riesgos específicos con controles concretos asociados.');
  const contingency=/(si falla|ante falla|contingencia|detener|degradar|escalar|fallback|reintentar)/.test(t);
  if(criterion(result,'GR-03')?.puntos<3&&contingency)setCriterion(result,'GR-03','CUMPLE',3,gov,'Existe una respuesta operable ante fallas con acción de detener, degradar, reintentar o escalar.');
}

export function evaluateEvidence(input){
  const result=evaluateV3(input);
  if(!result?.evaluacion)return result;
  const files=(input.files||[]).filter(f=>typeof f.content==='string');
  upgradeEconomicEvidence(result,files);
  upgradeProcessByContent(result,files);
  upgradeRunsByAssociation(result,files);
  upgradeGovernanceByContent(result,files);
  recalc(result);
  return result;
}
