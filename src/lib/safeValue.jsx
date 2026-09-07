/**
 * Rendering a value the API sent, without assuming it is a scalar.
 *
 * WHY THIS EXISTS
 * ---------------
 * React throws "Objects are not valid as a React child" (minified error #31)
 * the moment a plain object reaches a JSX slot. The profile page had a dozen
 * leaf slots written as `{v || '—'}`, which is safe for a string and fatal for
 * an object — and an object is truthy, so the `||` guard does not catch it.
 *
 * That is not a hypothetical. `industry_and_market_research.market_sizing.tam`
 * is ALWAYS an object on the wire — `_data_market_research` in
 * `spec_serializer.py` wraps every figure as `{value, source, assumptions}`,
 * converting the legacy scalar form on read. The section only has to be
 * non-empty for the whole Company Profile page to go to the error boundary.
 *
 * The lesson is not "add a guard at the crash site". A profile section is
 * free-form JSON assembled by a model, and the schema will keep growing
 * provenance wrappers because that is the direction the backend is moving. So
 * every leaf slot goes through here, and an unrecognised shape degrades to
 * something readable instead of taking the page down.
 */

/** Nothing worth rendering: null, undefined, empty string, empty array/object. */
export function isEmptyValue(v) {
  if (v === null || v === undefined || v === '') return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') {
    // A provenance wrapper whose value is blank is blank, whatever else it carries.
    if ('value' in v) return isEmptyValue(v.value);
    return Object.keys(v).length === 0;
  }
  return false;
}

/**
 * True for the `{value, source, assumptions}` wrapper the serializer emits.
 *
 * Matched structurally rather than by an exact key set: the backend has said
 * more than once that provenance is the direction of travel, so a wrapper that
 * later gains `retrieved_at` or `confidence` should still be recognised.
 */
export function isProvenanceValue(v) {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v) && 'value' in v;
}

/** The bare value out of a wrapper, or the value itself. */
export function plainValue(v) {
  return isProvenanceValue(v) ? v.value : v;
}

/** A string for any value — for titles, tooltips and anywhere JSX is not an option. */
export function valueToText(v) {
  if (isEmptyValue(v)) return '';
  if (isProvenanceValue(v)) return valueToText(v.value);
  if (Array.isArray(v)) return v.map(valueToText).filter(Boolean).join(', ');
  if (typeof v === 'object') {
    return Object.entries(v)
      .filter(([, x]) => !isEmptyValue(x))
      .map(([k, x]) => `${humanKey(k)}: ${valueToText(x)}`)
      .join(' · ');
  }
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  return String(v);
}

export function humanKey(k) {
  return String(k).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Render any value as JSX. Never throws, never returns a bare object.
 *
 * `showProvenance` renders the source and assumption under the figure rather
 * than discarding them — a TAM with no stated source is a different claim from
 * one traceable to a named report, and the wrapper exists so the reader can
 * tell them apart.
 */
export function SafeValue({ value, empty = '—', showProvenance = true, inline = false }) {
  if (isEmptyValue(value)) {
    return <span className="cp-empty-field">{empty}</span>;
  }

  if (isProvenanceValue(value)) {
    const { source, assumptions } = value;
    return (
      <>
        <SafeValue value={value.value} empty={empty} showProvenance={false} inline={inline} />
        {showProvenance && (source || assumptions) && (
          <span className="cp-provenance">
            {source
              ? <span className="cp-provenance-source">Source: {valueToText(source)}</span>
              : <span className="cp-provenance-unsourced">No source recorded</span>}
            {assumptions && <span className="cp-provenance-assump">{valueToText(assumptions)}</span>}
          </span>
        )}
        {showProvenance && !source && !assumptions && (
          <span className="cp-provenance">
            <span className="cp-provenance-unsourced">No source recorded</span>
          </span>
        )}
      </>
    );
  }

  if (Array.isArray(value)) {
    if (inline) return <>{valueToText(value)}</>;
    return (
      <ul className="cp-value-list">
        {value.map((item, i) => (
          <li key={i}><SafeValue value={item} empty={empty} showProvenance={showProvenance} inline /></li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object') {
    if (inline) return <>{valueToText(value)}</>;
    const entries = Object.entries(value).filter(([, v]) => !isEmptyValue(v));
    if (!entries.length) return <span className="cp-empty-field">{empty}</span>;
    return (
      <dl className="cp-value-object">
        {entries.map(([k, v]) => (
          <div key={k}>
            <dt>{humanKey(k)}</dt>
            <dd><SafeValue value={v} empty={empty} showProvenance={showProvenance} inline /></dd>
          </div>
        ))}
      </dl>
    );
  }

  if (value === true) return <>Yes</>;
  if (value === false) return <>No</>;
  return <>{String(value)}</>;
}

/**
 * A value that must be editable in a form input.
 *
 * An object-valued field cannot be typed into a text box without flattening it
 * and losing the provenance on save, so the editors edit the inner `value` and
 * leave the wrapper intact. `unwrapForEdit` / `rewrapAfterEdit` are the pair.
 */
export function unwrapForEdit(v) {
  const inner = plainValue(v);
  if (inner === null || inner === undefined) return '';
  if (typeof inner === 'object') return JSON.stringify(inner);
  return inner;
}

export function rewrapAfterEdit(original, edited) {
  if (isProvenanceValue(original)) {
    // The figure changed; the source no longer describes it. Say so rather
    // than leaving a stale citation attached to a hand-typed number.
    return { ...original, value: edited, source: '', assumptions: original.assumptions || '' };
  }
  return edited;
}
