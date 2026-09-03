import './ConditionCompare.css';

interface Props {
  referenceUrl?: string;
  returnUrl?: string;
  referenceLabel?: string;
  returnLabel?: string;
}

// The most characteristic object in this product's world: two photos,
// side by side, with a labeled seam between them — the literal
// before/after an inspection produces. This is the hero treatment used
// on the landing page (illustrative) and on every rental detail page
// (real evidence).
export function ConditionCompare({
  referenceUrl,
  returnUrl,
  referenceLabel = 'Pre-rental reference',
  returnLabel = 'Post-rental return',
}: Props) {
  return (
    <div className="compare">
      <div className="compare-pane">
        <div className="compare-image">
          {referenceUrl ? (
            <img src={referenceUrl} alt="Pre-rental reference evidence" />
          ) : (
            <div className="compare-placeholder">Not yet locked</div>
          )}
        </div>
        <div className="compare-label">{referenceLabel}</div>
      </div>
      <div className="compare-seam" aria-hidden="true" />
      <div className="compare-pane">
        <div className="compare-image">
          {returnUrl ? (
            <img src={returnUrl} alt="Post-rental return evidence" />
          ) : (
            <div className="compare-placeholder">Not yet locked</div>
          )}
        </div>
        <div className="compare-label">{returnLabel}</div>
      </div>
    </div>
  );
}
