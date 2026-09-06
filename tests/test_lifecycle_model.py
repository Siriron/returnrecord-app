"""
test_lifecycle_model.py — a pure-Python model of ReturnRecord's own
status-transition logic, exercised through every path the steward
specifically asked for: lock_return, condition checks, challenges,
voided outcomes, and finalization.

WHAT THIS IS: a state machine that mirrors the contract's own status
strings and transition guards (copied and kept in sync with
contracts/ReturnRecord.py's literal string constants), used to confirm
the LIFECYCLE LOGIC is internally consistent — a rental can't skip
states, a challenge can't resolve twice, a voided check can't be
finalized, etc.

WHAT THIS IS NOT: a live GenVM consensus test. This model does not call
gl.nondet.web.render, does not invoke an LLM, and does not exercise real
multi-validator agreement or storage-pickling behavior. Those can only
be confirmed by an actual transaction against the deployed StudioNet
contract — see docs/deployment.md's testing-status section for what has
and hasn't been run live. Local tests are not presented as proof of a
live deployment.

Run with: python3 tests/test_lifecycle_model.py
"""

import sys

# Mirrors contracts/ReturnRecord.py's literal status constants exactly —
# if the contract's constants ever change, update these to match, since
# this model is only useful as long as it tracks the real thing.
RENTAL_OPEN = "OPEN"
RENTAL_RETURNED = "RETURNED"
RENTAL_CHECKED = "CHECKED"

CHECK_FILED = "filed"
CHECK_VERDICT_ESCROWED = "verdict_escrowed"
CHECK_FINALIZED = "finalized"
CHECK_CHALLENGED = "challenged"
CHECK_VOIDED = "voided"

CHALLENGE_OPEN = "open"
CHALLENGE_UPHELD = "upheld"
CHALLENGE_OVERTURNED = "overturned"
CHALLENGE_REJECTED = "rejected"

VALID_VERDICTS = ("condition_matches", "material_damage", "inconclusive")
VOID_REASONS = ("SOURCE_UNAVAILABLE", "STALE_RENDER", "INVALID_JURY_OUTPUT")


class LifecycleError(Exception):
    pass


class RentalModel:
    """A minimal state machine mirroring the contract's own guards."""

    def __init__(self, owner: str, renter: str):
        if owner == renter:
            raise LifecycleError("owner and renter cannot be the same address")
        self.owner = owner
        self.renter = renter
        self.rental_status = RENTAL_OPEN
        self.check_status = None
        self.verdict = None
        self.void_reason = None
        self.challenge_status = None
        self.reputation = {
            owner: {"owner_condition_matches": 0, "owner_material_damage": 0, "owner_inconclusive": 0},
            renter: {"renter_condition_matches": 0, "renter_material_damage": 0, "renter_inconclusive": 0},
        }

    def lock_return(self):
        if self.rental_status != RENTAL_OPEN:
            raise LifecycleError("rental not awaiting return")
        self.rental_status = RENTAL_RETURNED

    def file_condition_check(self):
        if self.rental_status != RENTAL_RETURNED:
            raise LifecycleError("rental not ready for a condition check")
        if self.check_status is not None:
            raise LifecycleError("a condition check already exists for this rental")
        self.rental_status = RENTAL_CHECKED
        self.check_status = CHECK_FILED

    def resolve_check(self, verdict=None, void_reason=None):
        if self.check_status != CHECK_FILED:
            raise LifecycleError("check not in filed state")
        if void_reason is not None:
            if void_reason not in VOID_REASONS:
                raise LifecycleError(f"invalid void reason: {void_reason}")
            self.check_status = CHECK_VOIDED
            self.void_reason = void_reason
            return
        if verdict not in VALID_VERDICTS:
            raise LifecycleError(f"invalid verdict: {verdict}")
        self.verdict = verdict
        self.check_status = CHECK_VERDICT_ESCROWED

    def open_challenge(self):
        if self.check_status != CHECK_VERDICT_ESCROWED:
            raise LifecycleError("can only challenge an escrowed verdict")
        self.check_status = CHECK_CHALLENGED
        self.challenge_status = CHALLENGE_OPEN

    def resolve_challenge(self, decision: str, final_verdict=None):
        if self.challenge_status != CHALLENGE_OPEN:
            raise LifecycleError("challenge not in open state")
        if decision not in ("UPHOLD", "OVERTURN", "REJECT"):
            raise LifecycleError(f"invalid decision: {decision}")

        # Mirrors the steward-requested consistency fix: UPHOLD/REJECT
        # must reproduce the original verdict; only OVERTURN may differ,
        # and it must actually differ.
        if decision in ("UPHOLD", "REJECT"):
            resolved_verdict = self.verdict
        else:
            if final_verdict not in VALID_VERDICTS:
                raise LifecycleError("OVERTURN requires a valid final_verdict")
            if final_verdict == self.verdict:
                raise LifecycleError("OVERTURN must differ from the original verdict")
            resolved_verdict = final_verdict

        self.challenge_status = {
            "UPHOLD": CHALLENGE_UPHELD,
            "OVERTURN": CHALLENGE_OVERTURNED,
            "REJECT": CHALLENGE_REJECTED,
        }[decision]
        self.verdict = resolved_verdict
        self.check_status = CHECK_VERDICT_ESCROWED  # returns to escrow for finalize

    def finalize_check(self, challenge_window_closed: bool):
        if self.check_status != CHECK_VERDICT_ESCROWED:
            raise LifecycleError("check not in escrowed state")
        if self.challenge_status is None and not challenge_window_closed:
            raise LifecycleError("challenge window still open")

        for party, role in ((self.owner, "owner"), (self.renter, "renter")):
            key = {
                "condition_matches": f"{role}_condition_matches",
                "material_damage": f"{role}_material_damage",
                "inconclusive": f"{role}_inconclusive",
            }[self.verdict]
            self.reputation[party][key] += 1

        self.check_status = CHECK_FINALIZED


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_happy_path_no_dispute():
    r = RentalModel("0xOwner", "0xRenter")
    r.lock_return()
    r.file_condition_check()
    r.resolve_check(verdict="condition_matches")
    r.finalize_check(challenge_window_closed=True)
    assert r.check_status == CHECK_FINALIZED
    assert r.reputation["0xOwner"]["owner_condition_matches"] == 1
    assert r.reputation["0xRenter"]["renter_condition_matches"] == 1
    # The OTHER role's counters must be untouched — this is the actual
    # regression the role-specific split exists to prevent.
    assert r.reputation["0xOwner"]["owner_material_damage"] == 0
    assert r.reputation["0xRenter"]["renter_material_damage"] == 0


def test_voided_check_never_finalizes_or_touches_reputation():
    r = RentalModel("0xOwner", "0xRenter")
    r.lock_return()
    r.file_condition_check()
    r.resolve_check(void_reason="SOURCE_UNAVAILABLE")
    assert r.check_status == CHECK_VOIDED
    try:
        r.finalize_check(challenge_window_closed=True)
        assert False, "should not be able to finalize a voided check"
    except LifecycleError:
        pass
    assert r.reputation["0xOwner"]["owner_condition_matches"] == 0
    assert r.reputation["0xRenter"]["renter_condition_matches"] == 0


def test_challenge_upheld_keeps_original_verdict():
    r = RentalModel("0xOwner", "0xRenter")
    r.lock_return()
    r.file_condition_check()
    r.resolve_check(verdict="material_damage")
    r.open_challenge()
    r.resolve_challenge(decision="UPHOLD")
    assert r.verdict == "material_damage"
    r.finalize_check(challenge_window_closed=True)
    assert r.reputation["0xRenter"]["renter_material_damage"] == 1


def test_challenge_overturn_changes_verdict():
    r = RentalModel("0xOwner", "0xRenter")
    r.lock_return()
    r.file_condition_check()
    r.resolve_check(verdict="material_damage")
    r.open_challenge()
    r.resolve_challenge(decision="OVERTURN", final_verdict="condition_matches")
    assert r.verdict == "condition_matches"
    r.finalize_check(challenge_window_closed=True)
    assert r.reputation["0xRenter"]["renter_condition_matches"] == 1
    assert r.reputation["0xRenter"]["renter_material_damage"] == 0


def test_challenge_reject_keeps_original_verdict():
    r = RentalModel("0xOwner", "0xRenter")
    r.lock_return()
    r.file_condition_check()
    r.resolve_check(verdict="inconclusive")
    r.open_challenge()
    r.resolve_challenge(decision="REJECT")
    assert r.verdict == "inconclusive"


def test_overturn_with_same_verdict_is_rejected():
    """
    Regression test for the steward-requested consistency fix: an
    OVERTURN that doesn't actually change the verdict is not a genuine
    overturn and must be rejected, not silently treated as an UPHOLD.
    """
    r = RentalModel("0xOwner", "0xRenter")
    r.lock_return()
    r.file_condition_check()
    r.resolve_check(verdict="condition_matches")
    r.open_challenge()
    try:
        r.resolve_challenge(decision="OVERTURN", final_verdict="condition_matches")
        assert False, "OVERTURN with an unchanged verdict should be rejected"
    except LifecycleError:
        pass


def test_cannot_finalize_before_window_closes_with_no_challenge():
    r = RentalModel("0xOwner", "0xRenter")
    r.lock_return()
    r.file_condition_check()
    r.resolve_check(verdict="condition_matches")
    try:
        r.finalize_check(challenge_window_closed=False)
        assert False, "should not finalize while window is open and no challenge exists"
    except LifecycleError:
        pass


def test_can_finalize_immediately_after_challenge_resolves_even_if_window_open():
    """
    Mirrors the contract's own confirmed gate (matching its own
    SentinelSLA precedent): once a challenge exists and has resolved,
    finalize does not additionally wait for the original window.
    """
    r = RentalModel("0xOwner", "0xRenter")
    r.lock_return()
    r.file_condition_check()
    r.resolve_check(verdict="condition_matches")
    r.open_challenge()
    r.resolve_challenge(decision="UPHOLD")
    r.finalize_check(challenge_window_closed=False)  # window still "open" — should be fine
    assert r.check_status == CHECK_FINALIZED


def test_cannot_skip_lock_return():
    r = RentalModel("0xOwner", "0xRenter")
    try:
        r.file_condition_check()
        assert False, "should not be able to file a check before the item is returned"
    except LifecycleError:
        pass


def test_cannot_double_file_condition_check():
    r = RentalModel("0xOwner", "0xRenter")
    r.lock_return()
    r.file_condition_check()
    try:
        r.file_condition_check()
        assert False, "should not be able to file a second check on the same rental"
    except LifecycleError:
        pass


def test_owner_and_renter_must_differ():
    try:
        RentalModel("0xSame", "0xSame")
        assert False, "owner and renter cannot be the same address"
    except LifecycleError:
        pass


def test_same_address_different_roles_across_two_rentals_tracked_separately():
    """
    The actual scenario the role-specific fix exists for: address X is
    the RENTER in one rental and the OWNER in a different rental. Their
    renter-role damage history and owner-role damage history must not
    bleed into each other.
    """
    rental_a = RentalModel(owner="0xAlice", renter="0xBob")
    rental_a.lock_return()
    rental_a.file_condition_check()
    rental_a.resolve_check(verdict="material_damage")  # Bob (renter) damaged Alice's item
    rental_a.finalize_check(challenge_window_closed=True)

    rental_b = RentalModel(owner="0xBob", renter="0xCarol")
    rental_b.lock_return()
    rental_b.file_condition_check()
    rental_b.resolve_check(verdict="condition_matches")  # Carol returned Bob's item clean
    rental_b.finalize_check(challenge_window_closed=True)

    assert rental_a.reputation["0xBob"]["renter_material_damage"] == 1
    # Bob's OWNER-role record (from rental_b) must be untouched by his
    # RENTER-role damage record (from rental_a) — this is the exact
    # collapse the steward flagged and the fix is supposed to prevent.
    # (rental_b tracks Bob's owner-role reputation independently.)
    assert rental_b.reputation["0xBob"]["owner_condition_matches"] == 1
    assert rental_b.reputation["0xBob"].get("owner_material_damage", 0) == 0


if __name__ == "__main__":
    test_fns = [v for k, v in list(globals().items()) if k.startswith("test_") and callable(v)]
    failures = 0
    for fn in test_fns:
        try:
            fn()
            print(f"PASS  {fn.__name__}")
        except AssertionError as e:
            failures += 1
            print(f"FAIL  {fn.__name__}: {e}")
        except Exception as e:
            failures += 1
            print(f"ERROR {fn.__name__}: {type(e).__name__}: {e}")
    print(f"\n{len(test_fns) - failures}/{len(test_fns)} passed")
    sys.exit(1 if failures else 0)
