import { evaluateEvidence as evaluateV3, FREEZE_V5, RUBRIC_VERSION } from './engine_v3.mjs?core=1';

export { FREEZE_V5, RUBRIC_VERSION };

const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function criterion(result,id){
  return Object.values(result.evaluacion||{}).flatMap(d=>d.criterios||[]).find(c=>c.id===id);
}

function recalc(result){
  for(const d of Object.values(result.evaluacion||{})){
    d.puntaje=d.criterios.reduce((n,c)=>n+c.puntos,0);
    const q=d.maximo?d.puntaje/d.maximo:0;
    d.nivel=d.puntaje===0?'INSUFICIENTE':q>=.85?'EXCELENTE':q>=.60?'ADECUADO':'INSUFICIENTE';
  }
  result.puntaje_total=Object.values(result.evaluacion||{}).reduce((n,d)=>n+d.puntaje,0);
  const zero=Object.values(result.evaluacion||{}).flatMap(d=>d.criterios||[]).filter(c=>c.puntos===0).map(c=>c.id);
  result.resumen_final=`${result.puntaje_total}/100. ${zero.length?`Prioridades: ${zero.slice(0,5).join(', ')}${zero.length>5?'…':''}.`:'Todos los criterios tienen evidencia al menos parcial.'}${result.alertas_manipulacion?.length?` Se detectaron ${result.alertas_manipulacion.length} alerta(s) de manipulación.`:''}`;
  if(result.motor_ejecutable){result.motor_ejecutable.version='1.2.1';}
}

function upgradeEconomicEvidence(result,files){
  const econ=files.find(f=>/(analisis.*econom|econom.*\.md|costos.*\.md)/.test(norm(f.path)));
  if(!econ)return;
  const t=norm(econ.content||'');
  const c=criterion(result,'AE-01');
  const perRun=/(costo por corrida|costo\/corrida|por ejecucion)/.test(t);
  const unit=/(usd|us\$|\$|eur|ars)/.test(t);
  const measuredBasis=/(tokens entrada|tokens salida|input tokens|output tokens)/.test(t)&&/\b\d+[.,]?\d*\b/.test(t);
  const source=/(precios oficiales|documentacion de .*pricing|fuente|tarifa oficial|pricing)/.test(t);
  if(c&&c.puntos<5&&perRun&&unit&&measuredBasis&&source){
    c.estado='CUMPLE';c.puntos=5;c.evidencia=[{ruta:econ.path,detalle:'Costo por corrida con moneda/unidad, conteos reales de tokens como base de cálculo y fuente oficial de precios.'}];
  }
}

export function evaluateEvidence(input){
  const result=evaluateV3(input);
  if(!result?.evaluacion)return result;
  const files=(input.files||[]).filter(f=>typeof f.content==='string');
  upgradeEconomicEvidence(result,files);
  recalc(result);
  return result;
}
