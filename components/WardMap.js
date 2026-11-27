'use client';
// Map of Siaya County's 30 county assembly wards (data/siaya-wards-geo.json), drawn as inline SVG.
// Zoom with the buttons or +/- keys, pan by dragging (mouse, pen or touch) or with the arrow keys, 0 resets.
// Each ward is focusable and names itself (ward, constituency, IEBC code, and the value when `values` is given).
// With `values` ({ ward_id or ward_code: number | null }) the wards are shaded on a single-hue scale of five equal
// steps with a legend; wards without a value are hatched and say "not available". "View as table" lists all 30.
// No network requests, no cookies or storage. Colour is never the only signal: values are in labels and the table.
import { useCallback, useMemo, useRef, useState } from 'react';
import geo from '../data/siaya-wards-geo.json';
import { fmtFixed } from '../lib/format';

const W = 600;
const PAD = 10;
const STEPS = 5;
const K_MIN = 1;
const K_MAX = 8;
const LABEL_K = 2; // labels appear at this zoom and above

// ---- Projection (equirectangular scaled by cos(latitude of centre), as in scripts/make-siaya-map.js) ----
const [BX0, BY0, BX1, BY1] = (() => {
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  geo.features.forEach((f) => f.geometry.coordinates.forEach((p) => p.forEach((r) => r.forEach(([x, y]) => {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }))));
  return [x0, y0, x1, y1];
})();
const KCOS = Math.cos((((BY0 + BY1) / 2) * Math.PI) / 180);
const SCALE = (W - 2 * PAD) / ((BX1 - BX0) * KCOS);
const H = Math.ceil(2 * PAD + (BY1 - BY0) * SCALE);
const px = (x) => PAD + (x - BX0) * KCOS * SCALE;
const py = (y) => PAD + (BY1 - y) * SCALE;

const WARDS = geo.features.map((f) => {
  const p = f.properties;
  const d = f.geometry.coordinates.map((poly) => poly.map((ring) => `M${ring.slice(0, -1).map(([x, y]) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`).join('L')}Z`).join('')).join('');
  return { id: p.ward_id, code: p.ward_code, name: p.ward_name, con: p.constituency_name, conCode: p.constituency_code, d, lx: px(p.label[0]), ly: py(p.label[1]) };
});
const BY_CODE = [...WARDS].sort((a, b) => a.code.localeCompare(b.code));

const show = (v, dec) => fmtFixed(v, dec);

function scaleOf(vals) {
  const xs = vals.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (!xs.length) return null;
  const min = Math.min(...xs); const max = Math.max(...xs);
  const step = (max - min) / STEPS;
  const bin = (v) => (typeof v !== 'number' || !Number.isFinite(v) ? null : step === 0 ? STEPS : Math.min(STEPS, Math.floor((v - min) / step) + 1));
  return { bin, bins: Array.from({ length: STEPS }, (_, i) => [min + step * i, i === STEPS - 1 ? max : min + step * (i + 1)]) };
}

const clampView = (v) => {
  const k = Math.min(K_MAX, Math.max(K_MIN, v.k));
  const hw = W / (2 * k); const hh = H / (2 * k);
  return { k, cx: Math.min(W - hw, Math.max(hw, v.cx)), cy: Math.min(H - hh, Math.max(hh, v.cy)) };
};
const HOME = { k: 1, cx: W / 2, cy: H / 2 };

const CSS = `
.wmap{margin:0}
.wmap-stage{position:relative;border:1px solid var(--rule);border-radius:14px;background:var(--surface);overflow:hidden;max-width:720px}
.wmap-svg{display:block;width:100%;height:auto;max-height:80vh;cursor:grab;user-select:none;-webkit-user-select:none}
.wmap-svg.drag{cursor:grabbing}
.wmap-svg:focus-visible{outline:3px solid var(--accent);outline-offset:-3px}
.wmap-ward{stroke:var(--surface);stroke-width:1;transition:fill .12s}
.wmap-ward.base{fill:var(--s1);fill-opacity:.28}
.wmap-ward.q1{fill:var(--q1)}.wmap-ward.q2{fill:var(--q2)}.wmap-ward.q3{fill:var(--q3)}.wmap-ward.q4{fill:var(--q4)}.wmap-ward.q5{fill:var(--q5)}
.wmap-ward.on{stroke:var(--ink);stroke-width:2}
.wmap-ward.base.on{fill-opacity:.5}
.wmap-ward:focus{outline:none}
.wmap-ward:focus-visible{stroke:var(--brand-orange,var(--accent));stroke-width:3}
.wmap-na-bg{fill:var(--qna-bg,var(--recess))}.wmap-na-line{stroke:var(--qna-line,var(--ink-faint))}
.wmap-lab{fill:var(--ink);font-family:var(--sans);font-weight:600;pointer-events:none;paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round}
.wmap-ctl{position:absolute;top:8px;right:8px;display:flex;flex-direction:column;gap:6px}
.wmap-ctl button{min-width:44px;min-height:44px;border-radius:10px;border:1px solid var(--rule);background:var(--surface);color:var(--ink);font:inherit;font-size:18px;font-weight:700;cursor:pointer}
.wmap-ctl button.rs{font-size:12px}
.wmap-ctl button:hover{background:var(--recess)}
.wmap-ctl button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.wmap-ctl button:disabled{opacity:.45;cursor:default}
.wmap-tip{position:absolute;transform:translate(-50%,calc(-100% - 10px));pointer-events:none;background:var(--ink);color:var(--surface);border-radius:8px;padding:6px 10px;font-size:12px;line-height:1.4;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.wmap-tip b{display:block;font-size:13px}
.wmap-help{margin:0 0 8px;font-size:13px;color:var(--ink-soft);max-width:var(--measure)}
.wmap-detail{margin:8px 0 0;max-width:720px;border:1px solid var(--rule);border-radius:10px;padding:8px 12px;font-size:14px;background:var(--surface)}
.wmap-legend{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin-top:8px;font-size:12px;color:var(--ink-soft)}
.wmap-sw{display:inline-block;width:14px;height:14px;border-radius:3px;margin-right:6px;vertical-align:-2px;border:1px solid var(--rule)}
.wmap-attr{margin-top:8px;font-size:12px;color:var(--ink-muted)}
@media (prefers-reduced-motion: reduce){.wmap *{transition:none!important}}
`;

export default function WardMap({
  values,
  valueLabel = '',
  valueUnit = '',
  valueDec = 0,
  valueNotes = {},
  ariaLabel = 'Map of the 30 county assembly wards of Siaya County',
  caption,
  mapId = 'wmap',
}) {
  const svgRef = useRef(null);
  const ptrs = useRef(new Map());
  const gesture = useRef(null);
  const [view, setView] = useState(HOME);
  const [active, setActive] = useState(null);
  // Click, Enter or Space on a ward shows its details below the map (owner decision U7).
  const [sel, setSel] = useState(null);
  const [dragging, setDragging] = useState(false);

  const valOf = useCallback((w) => {
    if (!values) return undefined;
    if (w.id in values) return values[w.id];
    if (w.code in values) return values[w.code];
    return null;
  }, [values]);
  const scale = useMemo(() => (values ? scaleOf(WARDS.map(valOf)) : null), [values, valOf]);
  const unitSfx = valueUnit === '%' ? '%' : valueUnit ? ` ${valueUnit}` : '';
  const fmtV = (v) => (typeof v === 'number' && Number.isFinite(v) ? `${show(v, valueDec)}${unitSfx}` : 'not available');
  const describe = (w) => {
    let s = `${w.name} ward, ${w.con} constituency, IEBC ward code ${w.code}`;
    if (values) s += `. ${valueLabel ? `${valueLabel}: ` : ''}${fmtV(valOf(w))}`;
    if (valueNotes[w.id] || valueNotes[w.code]) s += `. Note: ${valueNotes[w.id] || valueNotes[w.code]}`;
    return s;
  };

  const vbW = W / view.k; const vbH = H / view.k;
  const vbX = view.cx - vbW / 2; const vbY = view.cy - vbH / 2;
  const zoom = (f) => setView((v) => clampView({ ...v, k: v.k * f }));
  const pan = (dx, dy) => setView((v) => clampView({ ...v, cx: v.cx + dx / v.k, cy: v.cy + dy / v.k }));
  const reset = () => setView(HOME);

  // Pixels on screen to SVG units at the current zoom.
  const unitsPerPx = () => {
    const r = svgRef.current && svgRef.current.getBoundingClientRect();
    return r && r.width ? W / view.k / r.width : 1;
  };

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { /* not supported */ }
    gesture.current = null;
  };
  const onPointerMove = (e) => {
    const prev = ptrs.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    const pts = [...ptrs.current.entries()];
    if (pts.length === 2) {
      const other = pts.find(([id]) => id !== e.pointerId)[1];
      const d0 = Math.hypot(prev.x - other.x, prev.y - other.y);
      const d1 = Math.hypot(cur.x - other.x, cur.y - other.y);
      if (d0 > 0) setView((v) => clampView({ ...v, k: v.k * (d1 / d0) }));
    } else {
      const u = unitsPerPx();
      const dx = cur.x - prev.x; const dy = cur.y - prev.y;
      if (!gesture.current && Math.hypot(dx, dy) < 3) return; // ignore jitter so taps still focus a ward
      gesture.current = 'pan';
      setDragging(true);
      setView((v) => clampView({ ...v, cx: v.cx - dx * u, cy: v.cy - dy * u }));
    }
    ptrs.current.set(e.pointerId, cur);
  };
  const onPointerUp = (e) => {
    ptrs.current.delete(e.pointerId);
    if (!ptrs.current.size) { setDragging(false); gesture.current = null; }
  };

  const onKeyDown = (e) => {
    const step = 40;
    const keys = {
      ArrowLeft: () => pan(-step, 0), ArrowRight: () => pan(step, 0), ArrowUp: () => pan(0, -step), ArrowDown: () => pan(0, step),
      '+': () => zoom(1.5), '=': () => zoom(1.5), '-': () => zoom(1 / 1.5), _: () => zoom(1 / 1.5), 0: () => reset(),
    };
    const fn = keys[e.key];
    if (fn && !e.altKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); fn(); }
  };

  // Keep a keyboard-focused ward in view.
  const onWardFocus = (w) => {
    setActive(w.id);
    setView((v) => {
      const hw = W / (2 * v.k); const hh = H / (2 * v.k);
      const inside = Math.abs(w.lx - v.cx) < hw * 0.85 && Math.abs(w.ly - v.cy) < hh * 0.85;
      return inside ? v : clampView({ ...v, cx: w.lx, cy: w.ly });
    });
  };

  const act = WARDS.find((w) => w.id === active);
  const tipLeft = act ? ((act.lx - vbX) / vbW) * 100 : 0;
  const tipTop = act ? ((act.ly - vbY) / vbH) * 100 : 0;
  const tipVisible = act && tipLeft >= 0 && tipLeft <= 100 && tipTop >= 0 && tipTop <= 100;
  const fontSize = 12 / view.k;
  const helpId = `${mapId}-help`;

  return (
    <figure className="wmap">
      <style>{CSS}</style>
      <p id={helpId} className="wmap-help">
        Drag to move the map, or use the arrow keys when it is selected. Zoom with the buttons or the + and − keys; 0 resets. Ward names appear when zoomed in. Tab moves between wards; click a ward or press Enter to see its details below the map.
      </p>

      <div className="wmap-stage">
        <svg
          ref={svgRef}
          viewBox={`${vbX.toFixed(2)} ${vbY.toFixed(2)} ${vbW.toFixed(2)} ${vbH.toFixed(2)}`}
          className={`wmap-svg${dragging ? ' drag' : ''}`}
          role="group"
          aria-label={ariaLabel}
          aria-describedby={helpId}
          tabIndex={0}
          style={{ touchAction: view.k > 1 ? 'none' : 'pan-y' }}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {values ? (
            <defs>
              <pattern id={`${mapId}-na`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" className="wmap-na-bg" />
                <line x1="0" y1="0" x2="0" y2="6" className="wmap-na-line" strokeWidth="2" />
              </pattern>
            </defs>
          ) : null}
          {WARDS.map((w) => {
            const b = values && scale ? scale.bin(valOf(w)) : null;
            const cls = values ? (b ? `q${b}` : 'na') : 'base';
            return (
              <path
                key={w.id}
                d={w.d}
                data-ward={w.id}
                className={`wmap-ward ${cls}${active === w.id ? ' on' : ''}`}
                style={values && !b ? { fill: `url(#${mapId}-na)` } : undefined}
                vectorEffect="non-scaling-stroke"
                fillRule="evenodd"
                tabIndex={0}
                role="img"
                aria-label={describe(w)}
                onPointerEnter={() => setActive(w.id)}
                onPointerLeave={(e) => { const el = e.currentTarget; setActive((a) => (a === w.id && document.activeElement !== el ? null : a)); }}
                onClick={() => setSel(w.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setSel(w.id); } }}
                onFocus={() => onWardFocus(w)}
                onBlur={() => setActive((a) => (a === w.id ? null : a))}
              />
            );
          })}
          {view.k >= LABEL_K ? WARDS.map((w) => (
            <text key={`l-${w.id}`} x={w.lx} y={w.ly} textAnchor="middle" dominantBaseline="middle" className="wmap-lab" style={{ fontSize: `${fontSize}px`, strokeWidth: `${3 / view.k}px` }} aria-hidden="true">
              {w.name}
            </text>
          )) : null}
        </svg>
        <div className="wmap-ctl">
          <button type="button" onClick={() => zoom(1.5)} disabled={view.k >= K_MAX} aria-label="Zoom in">+</button>
          <button type="button" onClick={() => zoom(1 / 1.5)} disabled={view.k <= K_MIN} aria-label="Zoom out">−</button>
          <button type="button" className="rs" onClick={reset} aria-label="Reset map view">Reset</button>
        </div>
        {tipVisible ? (
          <div className="wmap-tip" style={{ left: `${tipLeft}%`, top: `${tipTop}%` }} aria-hidden="true">
            <b>{act.name}</b>
            {act.con} constituency · code {act.code}
            {values ? <><br />{valueLabel ? `${valueLabel}: ` : ''}{fmtV(valOf(act))}</> : null}
          </div>
        ) : null}
      </div>
      <div className="wmap-detail" role="status" aria-live="polite">
        {(() => { const w = WARDS.find((x) => x.id === sel); return w ? <><b>{w.name}</b> ward, {w.con} constituency, IEBC code {w.code}{values ? <>. {valueLabel ? `${valueLabel}: ` : ''}{fmtV(valOf(w))}</> : null}.</> : 'Select a ward to see its name, constituency and IEBC code here.'; })()}
      </div>
      {values ? (
        <div className="wmap-legend">
          {valueLabel ? <b>{valueLabel}</b> : null}
          {scale ? scale.bins.map(([lo, hi], i) => (
            <span key={i}><i className="wmap-sw" style={{ background: `var(--q${i + 1})` }} aria-hidden="true" />{fmtV(lo)} to {fmtV(hi)}</span>
          )) : null}
          <span><i className="wmap-sw" style={{ background: `repeating-linear-gradient(45deg, var(--qna-bg, var(--recess)) 0 3px, var(--qna-line, var(--ink-faint)) 3px 5px)` }} aria-hidden="true" />Not available</span>
          {scale ? <span>Five equal steps from the lowest to the highest value; no shade means better or worse.</span> : null}
        </div>
      ) : null}
      <details className="tableview">
        <summary>View as table</summary>
        <div className="tablewrap">
          <table className="data">
            <caption className="sr-only">{`Siaya County wards${values && valueLabel ? `: ${valueLabel}` : ''}`}</caption>
            <thead>
              <tr>
                <th scope="col">IEBC code</th>
                <th scope="col">Ward</th>
                <th scope="col">Constituency</th>
                {values ? <th scope="col">{valueLabel || 'Value'}{unitSfx ? ` (${valueUnit})` : ''}</th> : null}
              </tr>
            </thead>
            <tbody>
              {BY_CODE.map((w) => (
                <tr key={w.id}>
                  <td>{w.code}</td>
                  <th scope="row">{w.name}</th>
                  <td>{w.con} ({w.conCode})</td>
                  {values ? <td>{typeof valOf(w) === 'number' ? show(valOf(w), valueDec) : 'Not available'}{valueNotes[w.id] || valueNotes[w.code] ? ` (${valueNotes[w.id] || valueNotes[w.code]})` : ''}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <figcaption className="wmap-attr">
        {caption ? <>{caption} </> : null}
        {geo.meta.attribution}. Simplified for display; not for measuring area or distance.
      </figcaption>
    </figure>
  );
}
