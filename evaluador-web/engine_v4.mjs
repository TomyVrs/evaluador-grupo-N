import { evaluateEvidence as evaluateV3, FREEZE_V5, RUBRIC_VERSION } from './engine_v3.mjs?core=1';

export { FREEZE_V5, RUBRIC_VERSION };

const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function criterion(result,id){return Object.values(result.evaluacion||{}).flatMap(d=>d.criterios||[]).find(c=>c.id===id);}
function setCriterion(result,id,estado,puntos,file,detalle){const c=criterion(result,id);if(!c)return;c.estado=estado;c.puntos=puntos;c.evidencia=file?[{ruta:file.path,detalle}]:[];}

function recalc(result){
  for(const d of Object.values(result.evaluacion||{})){
    d.puntaje=d.criterios.reduce((n,c)=>n+c.puntos,0);
    if(d.puntaje===0&&d.criterios.every(c=>c.estado==='NO_VERIFICABLE')) d.nivel='NO_VERIFICABLE';
    else {const q=d.maximo?d.puntaje/d.maximo:0;d.nivel=d.puntaje===0?'INSUFICIENTE':q>=.85?'EXCELENTE':q>=.60?'ADECUADO':'INSUFICIENTE';}
  }
  result.puntaje_total=Object.values(result.evaluacion||{}).reduce((n,d)=>n+d.puntaje,0);
  const zero=Object.values(result.evaluacion||{}).flatMap(d=>d.criterios||[]).filter(c=>c.puntos===0).map(c=>c.id);
  result.resumen_final=`${result.puntaje_total}/100. ${zero.length?`Prioridades: ${zero.slice(0,5).join(', ')}${zero.length>5?'…':''}.`:'Todos los criterios tienen evidencia al menos parcial.'}${result.alertas_manipulacion?.length?` Se detectaron ${result.alertas_manipulacion.length} alerta(s) de manipulación.`:''}`;
  if(result.motor_ejecutable){result.motor_ejecutable.version='1.3.2';result.motor_ejecutable.nota='Motor determinístico local complementario al agente V5. No reemplaza al agente ni redefine la rúbrica. Corrige NO_VERIFICABLE y reconoce evidencia económica positiva por contenido, sin depender del nombre del archivo.';}
}

function economicCandidate(files){
  return files.find(f=>{
    const t=norm(f.content||'');
    const positive=/(costo por corrida|costo\/corrida|por ejecucion)/.test(t)&&/(usd|us\$|ars|eur|\$)/.test(t);
    const negated=/(no (?:se )?(?:calculo|calculó|documento|documentó|registro|registró)|sin (?:costo|calculo|cálculo)|falta (?:el )?(?:costo|calculo|cálculo))/.test(t);
    return positive&&!negated;
  });
}

function upgradeEconomicEvidence(result,files){
  const econ=economicCandidate(files);if(!econ)return;const t=norm(econ.content||'');
  const ae1=criterion(result,'AE-01');
  const basis=/(tokens?|cantidad|precio unitario|tarifa|supuesto|estimad|medid)/.test(t),source=/(fuente|pricing|precio oficial|tarifa oficial|documentacion)/.test(t);
  if(ae1?.puntos===0&&basis&&source)setCriterion(result,'AE-01','CUMPLE',5,econ,'Costo por corrida con moneda/unidad, base de cálculo o supuesto y fuente/carácter estimado verificable en el contenido.');
  else if(ae1?.puntos===0)setCriterion(result,'AE-01','PARCIAL',3,econ,'Existe costo por corrida y unidad, pero falta base/fuente suficiente.');

  const ae2=criterion(result,'AE-02');
  const frequency=/(por mes|mensual|diari|semanal|corridas? por|veces por)/.test(t),horizon=/(anual|12 meses|por ano|por año|horizonte|meses)/.test(t),formula=/(\*|×|x\s*\d|=\s*(?:usd|ars|eur|\$)?\s*\d|formula|c[aá]lculo)/.test(t);
  if(ae2?.puntos===0&&frequency&&horizon&&formula)setCriterion(result,'AE-02','CUMPLE',5,econ,'Frecuencia, horizonte y cálculo reproducible aparecen en la evidencia económica.');

  const ae3=criterion(result,'AE-03');
  const chosen=/(modelo elegido|elegimos|seleccionamos|modelo recomendado|model:|modelo:)/.test(t),rationale=/(costo[- ]?eficien|mas barato|más barato|menor costo|suficiente|compar|trade.?off)/.test(t);
  if(ae3?.puntos===0&&chosen&&rationale&&/(prueba|compar|resultado|suficiente)/.test(t))setCriterion(result,'AE-03','CUMPLE',5,econ,'Modelo/configuración identificada y justificada mediante comparación o criterio verificable de suficiencia y costo-eficiencia.');
  else if(ae3?.puntos===0&&chosen&&rationale)setCriterion(result,'AE-03','PARCIAL',3,econ,'Existe una elección costo-eficiente razonada, pero falta evidencia comparativa suficiente.');
}

export function evaluateEvidence(input){
  const result=evaluateV3(input);if(!result?.evaluacion)return result;
  const files=(input.files||[]).filter(f=>typeof f.content==='string');
  upgradeEconomicEvidence(result,files);
  recalc(result);
  return result;
}
