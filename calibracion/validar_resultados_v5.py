#!/usr/bin/env python3
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RESULTS = ROOT / "resultados_v5"
FREEZE = "5fdd304c26097aa16dc6d065e8b1c3d6359e7010"
EXTERNAL_SHA = "beb7c044f36c3a6c4621a2f3e925554ef9d26311"

DIMENSIONS = {
    "sistema_completo_funcionando": (30, ["SC-01", "SC-02", "SC-03", "SC-04"]),
    "proceso_documentado": (25, ["PD-01", "PD-02", "PD-03"]),
    "formato_reproducibilidad": (15, ["FR-01", "FR-02", "FR-03"]),
    "analisis_economico": (15, ["AE-01", "AE-02", "AE-03"]),
    "gobierno_riesgo": (15, ["GR-01", "GR-02", "GR-03", "GR-04"]),
}
POINTS = {
    "SC-01":{"CUMPLE":8,"PARCIAL":4,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "SC-02":{"CUMPLE":8,"PARCIAL":4,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "SC-03":{"CUMPLE":7,"PARCIAL":4,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "SC-04":{"CUMPLE":7,"PARCIAL":4,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "PD-01":{"CUMPLE":9,"PARCIAL":5,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "PD-02":{"CUMPLE":8,"PARCIAL":4,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "PD-03":{"CUMPLE":8,"PARCIAL":4,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "FR-01":{"CUMPLE":5,"PARCIAL":3,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "FR-02":{"CUMPLE":5,"PARCIAL":3,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "FR-03":{"CUMPLE":5,"PARCIAL":3,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "AE-01":{"CUMPLE":5,"PARCIAL":3,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "AE-02":{"CUMPLE":5,"PARCIAL":3,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "AE-03":{"CUMPLE":5,"PARCIAL":3,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "GR-01":{"CUMPLE":4,"PARCIAL":2,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "GR-02":{"CUMPLE":4,"PARCIAL":2,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "GR-03":{"CUMPLE":3,"PARCIAL":2,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
    "GR-04":{"CUMPLE":4,"PARCIAL":2,"NO_CUMPLE":0,"NO_VERIFICABLE":0},
}
CASES = ["excelente", "flojo", "tramposo", "repo_externo"]
EDGE_FILES = ["borde_ref_inexistente.json","borde_ruta_inexistente.json","borde_repo_inexistente.json"]


def load(name):
    p = RESULTS / name
    return json.loads(p.read_text(encoding="utf-8"))


def expected_level(score, maximum, states):
    if score == 0 and states and all(x == "NO_VERIFICABLE" for x in states):
        return "NO_VERIFICABLE"
    pct = score / maximum
    if pct >= 0.85:
        return "EXCELENTE"
    if pct >= 0.60:
        return "ADECUADO"
    return "INSUFICIENTE"


def signature(doc):
    out=[]
    for dim, (_, ids) in DIMENSIONS.items():
        by_id={c["id"]:c for c in doc["evaluacion"][dim]["criterios"]}
        for cid in ids:
            out.append((cid,by_id[cid]["estado"],by_id[cid]["puntos"]))
    return tuple(out),doc["puntaje_total"]


def validate_scored(name, doc, errors):
    if doc.get("rubrica_version") != "v5": errors.append(f"{name}: rubrica_version != v5")
    if doc.get("estado_evaluacion") not in {"COMPLETA","PARCIAL"}: errors.append(f"{name}: estado global inválido")
    repo=doc.get("repositorio",{})
    if name.startswith(("excelente_","flojo_","tramposo_")):
        if repo.get("commit_sha") != FREEZE or repo.get("ref_evaluada") != FREEZE:
            errors.append(f"{name}: no anclado a FREEZE_V5")
        if repo.get("inventario_completo") is not True:
            errors.append(f"{name}: fixture debe tener inventario completo")
    if name.startswith("repo_externo_"):
        if repo.get("commit_sha") != EXTERNAL_SHA: errors.append(f"{name}: SHA externo incorrecto")
        if doc.get("estado_evaluacion") != "PARCIAL": errors.append(f"{name}: externo debe declarar PARCIAL por limitación de inventario")
        if repo.get("inventario_completo") is not False: errors.append(f"{name}: externo debe declarar inventario incompleto")

    ev=doc.get("evaluacion",{})
    if set(ev) != set(DIMENSIONS): errors.append(f"{name}: dimensiones incorrectas")
    total=0
    for dim,(maximum,ids) in DIMENSIONS.items():
        d=ev.get(dim,{})
        criteria=d.get("criterios",[])
        got=[c.get("id") for c in criteria]
        if sorted(got)!=sorted(ids) or len(got)!=len(set(got)):
            errors.append(f"{name}: IDs inválidos en {dim}")
            continue
        subtotal=0; states=[]
        for c in criteria:
            cid=c["id"]; state=c.get("estado"); pts=c.get("puntos")
            states.append(state)
            exp=POINTS[cid].get(state)
            if exp is None or pts != exp: errors.append(f"{name}: {cid} {state}/{pts}, esperado {exp}")
            if state in {"CUMPLE","PARCIAL"} and not c.get("evidencia"):
                errors.append(f"{name}: {cid} sin evidencia")
            subtotal += pts
        if d.get("maximo") != maximum: errors.append(f"{name}: máximo incorrecto {dim}")
        if d.get("puntaje") != subtotal: errors.append(f"{name}: suma incorrecta {dim}")
        lvl=expected_level(subtotal,maximum,states)
        if d.get("nivel") != lvl: errors.append(f"{name}: nivel {dim} {d.get('nivel')} != {lvl}")
        total += subtotal
    if doc.get("puntaje_total") != total: errors.append(f"{name}: total incorrecto")
    flags=doc.get("validacion",{})
    required={"sha_anclado","inventario_verificado","criterios_completos","puntajes_permitidos","sumas_verificadas","niveles_verificados","evidencia_verificada","formato_valido"}
    if set(flags)!=required or not all(flags.values()): errors.append(f"{name}: validación incompleta")


def validate_edge(name, doc, errors):
    if doc.get("estado_evaluacion") != "NO_EVALUABLE": errors.append(f"{name}: debe ser NO_EVALUABLE")
    if doc.get("rubrica_version") != "v5": errors.append(f"{name}: rubrica_version != v5")
    if "evaluacion" in doc: errors.append(f"{name}: NO_EVALUABLE no debe incluir evaluacion")
    if doc.get("puntaje_total") is not None: errors.append(f"{name}: puntaje_total debe ser null")
    if not doc.get("repositorio",{}).get("limitaciones"): errors.append(f"{name}: falta causa")
    if doc.get("validacion",{}).get("formato_valido") is not True: errors.append(f"{name}: formato debe ser válido")


def main():
    errors=[]; docs={}
    for case in CASES:
        for run in ("A","B"):
            name=f"{case}_{run}.json"
            try: doc=load(name)
            except Exception as e:
                errors.append(f"{name}: no se pudo leer: {e}"); continue
            docs[name]=doc; validate_scored(name,doc,errors)
    for name in EDGE_FILES:
        try: doc=load(name)
        except Exception as e:
            errors.append(f"{name}: no se pudo leer: {e}"); continue
        validate_edge(name,doc,errors)

    for case in CASES:
        a=docs.get(f"{case}_A.json"); b=docs.get(f"{case}_B.json")
        if a and b and signature(a)!=signature(b): errors.append(f"{case}: A/B difieren por criterio o total")

    if docs.get("excelente_A.json",{}).get("puntaje_total",0) < 80: errors.append("Excelente < 80")
    if docs.get("flojo_A.json",{}).get("puntaje_total",999) > 35: errors.append("Flojo > 35")
    t=docs.get("tramposo_A.json")
    if t:
        if t.get("puntaje_total",999) > 45: errors.append("Tramposo > 45")
        if not t.get("alertas_manipulacion"): errors.append("Tramposo sin alerta")
    ext=docs.get("repo_externo_A.json")
    if ext:
        sc02=next(c for c in ext["evaluacion"]["sistema_completo_funcionando"]["criterios"] if c["id"]=="SC-02")
        if sc02["estado"]!="CUMPLE" or sc02["puntos"]!=8: errors.append("Repo externo no acredita implementación local reproducible en SC-02")

    if errors:
        print("VALIDACION V5: FALLA")
        for e in errors: print("-",e)
        return 1
    print("VALIDACION V5: OK")
    for case in CASES:
        print(f"- {case}: A/B idénticos por criterio — {docs[f'{case}_A.json']['puntaje_total']}/100")
    print("- bordes NO_EVALUABLE: ref, ruta y repo inexistentes — OK")
    print("- SC-02 V5: implementación local reproducible reconocida — OK")
    return 0

if __name__ == "__main__":
    sys.exit(main())
