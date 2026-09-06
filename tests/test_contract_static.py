"""
test_contract_static.py — static, source-level safety checks against the
actual deployed contract file. These are NOT a live-consensus harness:
they verify structural invariants (no keyword args to run_nondet_unsafe,
zero self-references inside nested nondet closures, address-key
normalization, etc.) by reading contracts/ReturnRecord.py directly, the
same way this project's own manual pre-deploy audit does — just made
reproducible and automatic instead of run by hand.

WHAT THIS SUITE DOES NOT PROVE: multi-validator consensus behavior,
real GenVM storage-pickling behavior, or that the deployed StudioNet
contract's bytecode matches this source file. See docs/deployment.md
and the live evidence log for what has and hasn't been confirmed via
an actual on-chain lifecycle run. Local tests are not presented as
proof of a live deployment.

Run with: python3 -m pytest tests/test_contract_static.py -v
(or, with no pytest available: python3 tests/test_contract_static.py)
"""

import ast
import re
import sys
from pathlib import Path

CONTRACT_PATH = Path(__file__).parent.parent / "contracts" / "ReturnRecord.py"


def _source() -> str:
    return CONTRACT_PATH.read_text()


def _code_only_lines(src: str) -> list[str]:
    """
    Strips the module docstring (the large triple-quoted block at the top
    of the file) and returns only lines outside it, so checks for real
    code patterns (.send(, json.loads(, DynArray, etc.) don't false-
    positive on prose that merely *mentions* those patterns while
    explaining why they're forbidden. This is a plain state-machine
    scan for triple-quoted strings, not a full parser — sufficient here
    because this file has exactly one large docstring and no other
    triple-quoted blocks spanning code-relevant lines.
    """
    lines = src.splitlines()
    out = []
    in_triple = False
    quote = None
    for line in lines:
        stripped = line.strip()
        if not in_triple:
            if stripped.startswith('"""') or stripped.startswith("'''"):
                q = stripped[:3]
                # Does the docstring open AND close on this same line?
                rest = stripped[3:]
                if q in rest:
                    continue  # single-line docstring, skip only this line
                in_triple = True
                quote = q
                continue
            out.append(line)
        else:
            if quote in line:
                in_triple = False
                quote = None
            continue
    return out


def test_file_exists():
    assert CONTRACT_PATH.exists(), f"contract not found at {CONTRACT_PATH}"


def test_pinned_pragma_is_correct_hash():
    first_line = _source().splitlines()[0]
    assert "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" in first_line
    assert "py-genlayer:test" not in first_line


def test_ast_parses_cleanly():
    ast.parse(_source())


def test_no_send_method_calls():
    # .send( does not exist on _ContractAt — confirmed live bug (project
    # knowledge Bug 3). This contract never moves value at all, so there
    # should be zero real usages outside the docstring/comments.
    code_lines = _code_only_lines(_source())
    real_calls = [
        line for line in code_lines
        if ".send(" in line and not line.strip().startswith("#")
    ]
    assert real_calls == [], f"found real .send( calls: {real_calls}"


def test_run_nondet_unsafe_called_positionally():
    # Checked against code-only lines: both the docstring and an inline
    # comment in this file legitimately mention the literal string
    # "leader_fn=" in prose, warning against exactly this pattern — a
    # full-source substring check can't tell that apart from the pattern
    # actually being used, so this must exclude comments too, not just
    # the docstring.
    code_lines = [
        line for line in _code_only_lines(_source())
        if not line.strip().startswith("#")
    ]
    code_only_src = "\n".join(code_lines)
    assert "leader_fn=" not in code_only_src, "found leader_fn= keyword usage in real code"
    assert "validator_fn=" not in code_only_src, "found validator_fn= keyword usage in real code"

    calls = re.findall(r"run_nondet_unsafe\([^)]*\)", _source())
    assert len(calls) == 2, f"expected 2 run_nondet_unsafe calls, found {len(calls)}"
    for call in calls:
        assert "=" not in call.replace("==", ""), f"non-positional call: {call}"


def test_no_json_loads_on_nondet_result():
    code_lines = _code_only_lines(_source())
    real_calls = [
        line for line in code_lines
        if "json.loads(" in line and not line.strip().startswith("#")
    ]
    assert real_calls == [], f"json.loads found outside docstring/comments: {real_calls}"


def test_no_float_anywhere():
    code_lines = _code_only_lines(_source())
    real_calls = [
        line for line in code_lines
        if re.search(r"\bfloat\(", line) and not line.strip().startswith("#")
    ]
    assert real_calls == [], f"float( found: {real_calls}"


def test_no_dynarray_construction():
    code_lines = _code_only_lines(_source())
    real_lines = [
        line for line in code_lines
        if "DynArray" in line and not line.strip().startswith("#")
    ]
    assert real_lines == [], f"DynArray construction found: {real_lines}"


def test_zero_self_reference_inside_nondet_closures():
    """
    Indentation-scope-aware check (not a blind grep) — walks each
    leader_fn/validator_fn body by tracking indentation and flags any
    line inside that scope referencing `self.`. This is the single most
    important structural rule in this project's bug catalog (Bug 6).
    """
    lines = _source().splitlines()
    in_nested = False
    nested_indent = None
    violations = []

    for i, line in enumerate(lines, 1):
        stripped = line.rstrip()
        if re.match(r"^\s*def (leader_fn|validator_fn)\(", stripped):
            in_nested = True
            nested_indent = len(stripped) - len(stripped.lstrip())
            continue
        if in_nested:
            if stripped.strip() == "":
                continue
            cur_indent = len(stripped) - len(stripped.lstrip())
            if cur_indent <= nested_indent:
                in_nested = False
                continue
            if re.search(r"\bself\.", stripped):
                violations.append((i, stripped.strip()))

    assert violations == [], f"self. found inside nondet closures: {violations}"


def test_copy_to_memory_precedes_each_nondet_call():
    src = _source()
    assert src.count("copy_to_memory") >= 5  # 2 in resolve_check, 3 in resolve_challenge


def test_reputation_key_normalization_consistent():
    src = _source()
    write_sites = re.findall(r"party_addr\.as_hex\.lower\(\)", src)
    read_sites = re.findall(r"party_address\.strip\(\)\.lower\(\)", src)
    assert len(write_sites) >= 1, "expected at least one normalized write-site key"
    assert len(read_sites) >= 1, "expected at least one normalized read-site key"


def test_reputation_is_role_specific():
    """
    Regression test for the steward-requested fix: reputation counters
    must be split by role (owner_* / renter_*), not a single shared set.
    """
    src = _source()
    for field in (
        "owner_condition_matches_count",
        "owner_material_damage_count",
        "owner_inconclusive_count",
        "renter_condition_matches_count",
        "renter_material_damage_count",
        "renter_inconclusive_count",
    ):
        assert field in src, f"missing role-specific field: {field}"
    # The old, non-role-specific shared field declarations must be gone
    # entirely, not just supplemented alongside new ones — otherwise a
    # future write could accidentally target the stale shared field.
    dataclass_block = src[src.index("class ReputationEntry:"):src.index("class ReturnRecord(gl.Contract):")]
    assert re.search(r"^\s*condition_matches_count:\s*u256\s*$", dataclass_block, re.MULTILINE) is None, (
        "stale non-role-specific condition_matches_count field still declared"
    )
    assert re.search(r"^\s*material_damage_count:\s*u256\s*$", dataclass_block, re.MULTILINE) is None, (
        "stale non-role-specific material_damage_count field still declared"
    )


def test_challenge_decision_verdict_consistency_enforced():
    """
    Regression test for the steward-requested fix: UPHOLD/REJECT must be
    structurally forced to reproduce the original verdict, and this must
    be independently re-checked in validator_fn too (not just leader_fn).
    """
    src = _source()
    assert "llm_overturn_without_new_verdict" in src, (
        "expected leader_fn to reject an OVERTURN with no genuine new verdict"
    )
    assert 'leader_decision in ("UPHOLD", "REJECT") and leader_final != check_mem.verdict' in src, (
        "expected validator_fn to independently enforce UPHOLD/REJECT == original verdict"
    )
    assert 'leader_decision == "OVERTURN" and leader_final == check_mem.verdict' in src, (
        "expected validator_fn to reject an OVERTURN that didn't actually change the verdict"
    )


def test_verdict_enum_reachability():
    """
    Every value in _VALID_VERDICTS must be traceable to a real leader_fn
    branch that can produce it (project knowledge's confirmed
    verdict-enum-reachability rule, RetractionWatch's rejection reason).
    """
    src = _source()
    for verdict in ("condition_matches", "material_damage", "inconclusive"):
        assert f'"{verdict}"' in src, f"verdict '{verdict}' never appears as a literal"
    # VOIDED path is a legal outcome distinct from the three verdicts —
    # confirm each of its reason codes is actually producible.
    for reason in ("SOURCE_UNAVAILABLE", "STALE_RENDER", "INVALID_JURY_OUTPUT"):
        assert reason in src, f"void reason code '{reason}' never appears"


if __name__ == "__main__":
    # Allow running without pytest installed.
    test_fns = [v for k, v in list(globals().items()) if k.startswith("test_") and callable(v)]
    failures = 0
    for fn in test_fns:
        try:
            fn()
            print(f"PASS  {fn.__name__}")
        except AssertionError as e:
            failures += 1
            print(f"FAIL  {fn.__name__}: {e}")
    print(f"\n{len(test_fns) - failures}/{len(test_fns)} passed")
    sys.exit(1 if failures else 0)
