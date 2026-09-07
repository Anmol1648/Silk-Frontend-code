import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Right-hand slide-over.
 *
 * Used wherever a row needs explaining without losing the table behind it —
 * the scorecard's reasoning drawer and the investor profile. A modal would
 * force the reader to memorise the row they came from; a drawer keeps the
 * comparison on screen, which is the whole point of opening it.
 *
 * Keyboard: Escape closes, focus moves into the panel on open and returns to
 * the trigger on close.
 */
export default function Drawer({ open, onClose, title, eyebrow, width = 560, footer, children }) {
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);

    // Defer so the panel exists before we move focus into it.
    const t = setTimeout(() => panelRef.current?.focus(), 0);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
      if (returnFocusRef.current?.focus) returnFocusRef.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="drawer-scrim" onClick={onClose}>
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="drawer-panel"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-head">
          <div style={{ minWidth: 0 }}>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h2 className="drawer-title">{title}</h2>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-foot">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
}

/** Labelled block inside a drawer. */
export function DrawerBlock({ label, hint, children }) {
  return (
    <section className="drawer-block">
      <div className="drawer-block-label">{label}</div>
      {hint && <p className="hint" style={{ marginTop: -2 }}>{hint}</p>}
      {children}
    </section>
  );
}
