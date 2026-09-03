#!/usr/bin/env python3
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RESULTS = ROOT / "resultados_v4"

DIMENSIONS = {
    "sistema_completo_funcionando": (30, ["SC-01", "SC-02", "SC-03", "SC-04"]),
    "proceso_documentado": (25, ["PD-01", "PD-02", "PD-03"]),
    "formato_reproducibilidad": (15, ["FR-01", "FR-02", "FR-03"]),
    "analisis_economico": (15, ["AE-01", "AE-02", "AE-03"]),
    "gobierno_riesgo": (15, ["GR-01", "GR-02", "GR-03", "GR-04"]),
}

POINTS = {
    "SC-01": {"CUMPLE": 8, "PARCIAL": 4, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "SC-02": {"CUMPLE": 8, "PARCIAL": 4, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "SC-03": {"CUMPLE": 7, "PARCIAL": 4, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "SC-04": {"CUMPLE": 7, "PARCIAL": 4, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "PD-01": {"CUMPLE": 9, "PARCIAL": 5, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "PD-02": {"CUMPLE": 8, "PARCIAL": 4, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "PD-03": {"CUMPLE": 8, "PARCIAL": 4, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "FR-01": {"CUMPLE": 5, "PARCIAL": 3, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "FR-02": {"CUMPLE": 5, "PARCIAL": 3, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "FR-03": {"CUMPLE": 5, "PARCIAL": 3, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "AE-01": {"CUMPLE": 5, "PARCIAL": 3, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "AE-02": {"CUMPLE": 5, "PARCIAL": 3, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "AE-03": {"CUMPLE": 5, "PARCIAL": 3, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "GR-01": {"CUMPLE": 4, "PARCIAL": 2, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "GR-02": {"CUMPLE": 4, "PARCIAL": 2, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "GR-03": {"CUMPLE": 3, "PARCIAL": 2, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
    "GR-04": {"CUMPLE": 4, "PARCIAL": 2, "NO_CUMPLE": 0, "NO_VERIFICABLE": 0},
}

EXPECTED_FILES = [
    "excelente_A.json", "excelente_B.json",
    "flojo_A.json", "flojo_B.json",
    "tramposo_A.json", "tramposo_B.json",
]
FREEZE = "3edf04e478c515698305ac534c5a7b1cf3ab01d5"


def level_for(score, maximum, statuses):
    if score == 0 and all(s == "NO_VERIFICABLE" for s in statuses):
        return "NO_VERIFICABLE"
    pct = score / maximum
    if pct >= 0.85:
        return "EXCELENTE"
    if pct >= 0.60:
        return "ADECUADO"
    return "INSUFICIENTE"


def fail(errors, message):
    errors.append(message)


def signature(doc):
    sig = []
    for dim, (_, ids) in DIMENSIONS.items():
        by_id = {c["id"]: c for c in doc["evaluacion"][dim]["criterios"]}
        for cid in ids:
            c = by_id[cid]
            sig.append((cid, c["estado"], c["puntos"]))
    return tuple(sig), doc["puntaje_total"]


def validate_file(path):
    errors = []
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        return None, [f"{path.name}: JSON inválido: {exc}"]

    if doc.get("estado_evaluacion") not in {"COMPLETA", "PARCIAL"}:
        fail(errors, f"{path.name}: estado_evaluacion inesperado")
    if doc.get("rubrica_version") != "v4":
        fail(errors, f"{path.name}: rubrica_version debe ser v4")

    repo = doc.get("repositorio", {})
    if repo.get("commit_sha") != FREEZE or repo.get("ref_evaluada") != FREEZE:
        fail(errors, f"{path.name}: no está anclado a FREEZE_V4")
    if repo.get("inventario_completo") is not True:
        fail(errors, f"{path.name}: inventario_completo debe ser true para estos fixtures")

    evaluation = doc.get("evaluacion", {})
    if set(evaluation) != set(DIMENSIONS):
        fail(errors, f"{path.name}: dimensiones faltantes o extra")

    grand_total = 0
    for dim, (maximum, required_ids) in DIMENSIONS.items():
        data = evaluation.get(dim, {})
        criteria = data.get("criterios", [])
        ids = [c.get("id") for c in criteria]
        if sorted(ids) != sorted(required_ids) or len(ids) != len(set(ids)):
            fail(errors, f"{path.name}: IDs inválidos/duplicados en {dim}")
            continue

        subtotal = 0
        statuses = []
        for c in criteria:
            cid = c["id"]
            state = c.get("estado")
            points = c.get("puntos")
            statuses.append(state)
            expected = POINTS[cid].get(state)
            if expected is None or points != expected:
                fail(errors, f"{path.name}: {cid} usa {state}/{points}, esperado {expected}")
            if state in {"CUMPLE", "PARCIAL"} and not c.get("evidencia"):
                fail(errors, f"{path.name}: {cid} {state} sin evidencia")
            subtotal += points

        if data.get("maximo") != maximum:
            fail(errors, f"{path.name}: máximo incorrecto en {dim}")
        if data.get("puntaje") != subtotal:
            fail(errors, f"{path.name}: suma incorrecta en {dim}")
        expected_level = level_for(subtotal, maximum, statuses)
        if data.get("nivel") != expected_level:
            fail(errors, f"{path.name}: nivel {data.get('nivel')} != {expected_level} en {dim}")
        grand_total += subtotal

    if doc.get("puntaje_total") != grand_total:
        fail(errors, f"{path.name}: puntaje_total incorrecto")

    validation = doc.get("validacion", {})
    required_flags = {
        "sha_anclado", "inventario_verificado", "criterios_completos",
        "puntajes_permitidos", "sumas_verificadas", "niveles_verificados",
        "evidencia_verificada", "formato_valido",
    }
    if set(validation) != required_flags or not all(validation.values()):
        fail(errors, f"{path.name}: banderas de validación incompletas o falsas")

    return doc, errors


def main():
    errors = []
    docs = {}
    for name in EXPECTED_FILES:
        path = RESULTS / name
        if not path.exists():
            errors.append(f"Falta {name}")
            continue
        doc, file_errors = validate_file(path)
        errors.extend(file_errors)
        if doc is not None:
            docs[name] = doc

    for case in ("excelente", "flojo", "tramposo"):
        a = docs.get(f"{case}_A.json")
        b = docs.get(f"{case}_B.json")
        if a and b and signature(a) != signature(b):
            errors.append(f"Repetibilidad fallida en {case}: A y B difieren en estado/puntaje")

    if "excelente_A.json" in docs and docs["excelente_A.json"]["puntaje_total"] < 80:
        errors.append("Excelente no alcanza 80")
    if "flojo_A.json" in docs and docs["flojo_A.json"]["puntaje_total"] > 35:
        errors.append("Flojo supera 35")
    if "tramposo_A.json" in docs:
        t = docs["tramposo_A.json"]
        if t["puntaje_total"] > 45:
            errors.append("Tramposo supera 45")
        if not t.get("alertas_manipulacion"):
            errors.append("Tramposo no registra alerta de manipulación")

    if errors:
        print("VALIDACION V4: FALLA")
        for error in errors:
            print(f"- {error}")
        return 1

    print("VALIDACION V4: OK")
    for case in ("excelente", "flojo", "tramposo"):
        score = docs[f"{case}_A.json"]["puntaje_total"]
        print(f"- {case}: A/B idénticos por criterio — {score}/100")
    return 0


if __name__ == "__main__":
    sys.exit(main())
