import React, { useEffect, useMemo, useRef, useState } from "react";

/* ==========================================================================
   DashboardCharts.jsx
   AUCA-style charts for the School Dashboard (pure SVG — no extra library).
   Look: white cards, dotted grid, smooth line with dots, light-blue bars,
   legend underneath and a row of key numbers at the bottom of each card.
   ========================================================================== */

const COLORS = {
  bar: "#5b9bdc", // AUCA light blue bars
  navy: "#0b4a8a", // AUCA dark blue line
  blue: "#2f74c9", // AUCA trend line
  purple: "#7c3aed",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  orange: "#f97316",
  grid: "#d5dce8",
  axis: "#1e293b",
  text: "#334155",
};

const GRADE_COLORS = {
  A: COLORS.emerald,
  B: "#3b82f6",
  C: COLORS.amber,
  D: COLORS.orange,
  F: COLORS.rose,
};

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const truncate = (s, n) => {
  const str = s === null || s === undefined ? "" : String(s);
  return str.length > n ? `${str.slice(0, Math.max(1, n - 1))}…` : str;
};

// "2026-10-27" -> { short: "27 Oct", long: "Tue, 27 Oct 2026" }. Anything else is shown as is.
export function formatDay(value) {
  const raw = value === null || value === undefined ? "" : String(value);
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (!isNaN(d.getTime())) {
      return {
        short: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        long: d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }),
      };
    }
  }
  return { short: raw, long: raw };
}

// Round, easy-to-read axis ticks for counts (0, 5, 10, 15 ...)
export function niceTicks(maxVal, target = 4) {
  const max = Math.max(0, num(maxVal));
  if (max === 0) return [0, 1, 2, 3, 4];
  const rough = max / target;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const frac = rough / pow;
  const nf = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  let step = nf * pow;
  if (step < 1) step = 1; // counts are whole numbers
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= niceMax + 1e-9; v += step) ticks.push(Math.round(v * 1000) / 1000);
  if (ticks.length < 3) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

// Percentage axis for trend lines: 0-100 when values are low, zoomed (e.g. 70-100) when they are high.
export function percentDomain(values) {
  const v = values.filter((x) => Number.isFinite(x));
  const full = { min: 0, max: 100, ticks: [0, 25, 50, 75, 100] };
  if (v.length === 0) return full;
  const lo = Math.min(...v);
  if (lo < 50) return full;
  const min = Math.max(0, Math.floor((lo - 5) / 10) * 10);
  const range = 100 - min;
  const step = range <= 10 ? 5 : range <= 40 ? 10 : 20;
  const ticks = [];
  for (let t = min; t <= 100; t += step) ticks.push(t);
  return { min, max: 100, ticks };
}

// Smooth curve through the points (monotone cubic, same look as AUCA's GPA Trend)
function smoothPath(pts) {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0].x},${pts[0].y}`;
  if (n === 2) return `M${pts[0].x},${pts[0].y}L${pts[1].x},${pts[1].y}`;
  const dx = [];
  const m = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    m[i] = (pts[i + 1].y - pts[i].y) / dx[i];
  }
  const t = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t[i] = 0;
    else t[i] = (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  }
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${pts[i].x + h},${pts[i].y + t[i] * h},${pts[i + 1].x - h},${pts[i + 1].y - t[i + 1] * h},${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return d;
}

function useWidth(ref, fallback = 600) {
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => {
      const next = Math.floor(el.getBoundingClientRect().width);
      if (next > 0) setW(next);
    };
    update();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ref]);
  return w;
}

/* --------------------------------------------------------------------------
   MixedChart — one chart component for line, bar, stacked bar and bar+line.
   -------------------------------------------------------------------------- */
export function MixedChart({
  categories = [], // [{ label, fullLabel }]
  bars = [], // [{ name, color, colors?, values, format? }]
  barMode = "group", // "group" | "stack"
  lines = [], // [{ name, color, values, axis?: "left" | "right", format? }]
  left = {}, // { min, max, ticks, format }
  right = null, // same shape, for a second axis
  height = 270,
  verticalGrid = false,
  showBarValues = false,
  ariaLabel = "Chart",
  emptyText = "No data available",
  extraRows, // (index) => [{ label, value }]
}) {
  const wrapRef = useRef(null);
  const width = useWidth(wrapRef);
  const [active, setActive] = useState(null);

  // tap outside closes the tooltip on touch screens
  useEffect(() => {
    if (active === null) return undefined;
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setActive(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [active]);

  const n = categories.length;

  const layout = useMemo(() => {
    // value domains
    const stackTotals = categories.map((_, i) =>
      barMode === "stack" ? bars.reduce((s, b) => s + num(b.values[i]), 0) : Math.max(0, ...bars.map((b) => num(b.values[i])))
    );
    const leftLineVals = lines.filter((l) => (l.axis || "left") === "left").flatMap((l) => l.values.map(num));
    const rawLeftMax = Math.max(0, ...stackTotals, ...leftLineVals);
    const lMin = left.min !== undefined ? left.min : 0;
    const lTicks = left.ticks || niceTicks(left.max !== undefined ? left.max : rawLeftMax);
    const lMax = left.max !== undefined ? left.max : lTicks[lTicks.length - 1];
    let rTicks = null;
    let rMin = 0;
    let rMax = 1;
    if (right) {
      const rightVals = lines.filter((l) => l.axis === "right").flatMap((l) => l.values.map(num));
      rMin = right.min !== undefined ? right.min : 0;
      rTicks = right.ticks || niceTicks(right.max !== undefined ? right.max : Math.max(0, ...rightVals));
      rMax = right.max !== undefined ? right.max : rTicks[rTicks.length - 1];
    }
    const lFmt = left.format || String;
    const rFmt = (right && right.format) || String;
    const labelW = (ticks, fmt) => Math.max(...ticks.map((t) => String(fmt(t)).length), 1) * 7.5 + 16;

    const mt = showBarValues ? 28 : 14; // headroom for the number above the tallest bar
    const mb = 34;
    let ml = Math.max(36, labelW(lTicks, lFmt));
    const mr = right ? Math.max(36, labelW(rTicks, rFmt)) : 16;

    // x labels: rotate when they would collide
    const longest = Math.max(0, ...categories.map((c) => String(c.label || "").length));
    const firstBand = n > 0 ? Math.max(40, width - ml - mr) / n : 40;
    const rotate = n > 1 && longest * 6.3 > firstBand - 6;
    const maxChars = rotate ? 16 : Math.max(3, Math.floor((firstBand - 6) / 6.3));
    if (rotate) {
      // a rotated first label reaches to the left of its tick: make room so it is never cut off
      const reach = Math.min(longest, maxChars) * 6.3 * 0.82;
      ml = Math.max(ml, Math.ceil(reach - firstBand / 2 + 8));
    }
    const plotW = Math.max(40, width - ml - mr);
    const band = n > 0 ? plotW / n : plotW;
    const bottom = rotate ? Math.min(96, 24 + Math.min(longest, 16) * 4.2) : mb;
    const plotH = Math.max(80, height - mt - bottom);

    return { lMin, lMax, lTicks, lFmt, rMin, rMax, rTicks, rFmt, mt, ml, mr, plotW, plotH, band, rotate, maxChars, bottom };
  }, [categories, bars, barMode, lines, left, right, width, height, n, showBarValues]);

  if (n === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400 italic text-center px-4"
        style={{ height }}
      >
        {emptyText}
      </div>
    );
  }

  const { lMin, lMax, lTicks, lFmt, rMin, rMax, rTicks, rFmt, mt, ml, plotW, plotH, band, rotate, maxChars, bottom } = layout;
  const yL = (v) => mt + plotH * (1 - (num(v) - lMin) / (lMax - lMin || 1));
  const yR = (v) => mt + plotH * (1 - (num(v) - rMin) / (rMax - rMin || 1));
  const cx = (i) => ml + band * (i + 0.5);
  const baseY = mt + plotH;
  const totalHeight = mt + plotH + bottom;

  // bar geometry
  const groupCount = barMode === "group" ? Math.max(1, bars.length) : 1;
  const colW = Math.min(band * 0.58, 64);
  const barW = colW / groupCount;

  const tooltip = (() => {
    if (active === null || active >= n) return null;
    const rows = [];
    bars.forEach((b) => {
      const color = b.colors ? b.colors[active] : b.color;
      rows.push({ color, shape: "bar", label: b.name, value: (b.format || String)(num(b.values[active])) });
    });
    if (barMode === "stack" && bars.length > 1) {
      rows.push({ color: null, label: "Total", value: String(bars.reduce((s, b) => s + num(b.values[active]), 0)), strong: true });
    }
    lines.forEach((l) => {
      rows.push({ color: l.color, shape: "line", label: l.name, value: (l.format || String)(num(l.values[active])) });
    });
    const extra = extraRows ? extraRows(active) || [] : [];
    return { rows, extra };
  })();

  const onRight = active !== null && cx(active) > width * 0.58;

  return (
    <div ref={wrapRef} className="relative w-full select-none" style={{ height: totalHeight }}>
      <svg
        width={width}
        height={totalHeight}
        viewBox={`0 0 ${width} ${totalHeight}`}
        role="img"
        aria-label={ariaLabel}
        style={{ display: "block", overflow: "visible", fontFamily: "inherit" }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setActive(null);
        }}
      >
        {/* active band */}
        {active !== null && (
          <rect x={ml + band * active} y={mt} width={band} height={plotH} fill="#2563eb" opacity="0.06" />
        )}

        {/* dotted grid */}
        {lTicks.map((t) => (
          <line key={`gh${t}`} x1={ml} x2={ml + plotW} y1={yL(t)} y2={yL(t)} stroke={COLORS.grid} strokeDasharray="2 3" />
        ))}
        {verticalGrid &&
          categories.map((_, i) => (
            <line key={`gv${i}`} x1={cx(i)} x2={cx(i)} y1={mt} y2={baseY} stroke={COLORS.grid} strokeDasharray="2 3" />
          ))}

        {/* bars */}
        {bars.map((b, bi) =>
          categories.map((_, i) => {
            const v = Math.max(0, num(b.values[i]));
            const color = b.colors ? b.colors[i] : b.color;
            let y0;
            let h;
            let x;
            if (barMode === "stack") {
              const below = bars.slice(0, bi).reduce((s, bb) => s + Math.max(0, num(bb.values[i])), 0);
              y0 = yL(below + v);
              h = yL(below) - y0;
              x = cx(i) - colW / 2;
            } else {
              y0 = yL(v);
              h = baseY - y0;
              x = cx(i) - colW / 2 + bi * barW;
            }
            if (!(h > 0)) return null;
            return <rect key={`b${bi}-${i}`} x={x} y={y0} width={Math.max(2, barW - (groupCount > 1 ? 2 : 0))} height={h} fill={color} />;
          })
        )}

        {/* value labels above bars */}
        {showBarValues &&
          bars.length === 1 &&
          categories.map((_, i) => {
            const v = num(bars[0].values[i]);
            return (
              <text key={`bv${i}`} x={cx(i)} y={yL(v) - 6} textAnchor="middle" fontSize="12" fontWeight="600" fill={COLORS.text}>
                {(bars[0].format || String)(v)}
              </text>
            );
          })}

        {/* axes */}
        <line x1={ml} x2={ml} y1={mt} y2={baseY} stroke={COLORS.axis} strokeWidth="1" />
        <line x1={ml} x2={ml + plotW} y1={baseY} y2={baseY} stroke={COLORS.axis} strokeWidth="1" />
        {rTicks && <line x1={ml + plotW} x2={ml + plotW} y1={mt} y2={baseY} stroke={COLORS.axis} strokeWidth="1" />}

        {lTicks.map((t) => (
          <g key={`lt${t}`}>
            <line x1={ml - 5} x2={ml} y1={yL(t)} y2={yL(t)} stroke={COLORS.axis} />
            <text x={ml - 9} y={yL(t) + 4} textAnchor="end" fontSize="12" fill={COLORS.text}>
              {lFmt(t)}
            </text>
          </g>
        ))}
        {rTicks &&
          rTicks.map((t) => (
            <g key={`rt${t}`}>
              <line x1={ml + plotW} x2={ml + plotW + 5} y1={yR(t)} y2={yR(t)} stroke={COLORS.axis} />
              <text x={ml + plotW + 9} y={yR(t) + 4} textAnchor="start" fontSize="12" fill={COLORS.text}>
                {rFmt(t)}
              </text>
            </g>
          ))}

        {categories.map((c, i) => (
          <g key={`xt${i}`}>
            <line x1={cx(i)} x2={cx(i)} y1={baseY} y2={baseY + 5} stroke={COLORS.axis} />
            {rotate ? (
              <text x={cx(i) + 4} y={baseY + 14} textAnchor="end" fontSize="12" fill={COLORS.text} transform={`rotate(-35 ${cx(i) + 4} ${baseY + 14})`}>
                {truncate(c.label, maxChars)}
              </text>
            ) : (
              <text x={cx(i)} y={baseY + 21} textAnchor="middle" fontSize="12" fill={COLORS.text}>
                {truncate(c.label, maxChars)}
              </text>
            )}
          </g>
        ))}

        {/* lines + dots */}
        {lines.map((l, li) => {
          const toY = (l.axis || "left") === "right" ? yR : yL;
          const pts = categories.map((_, i) => ({ x: cx(i), y: toY(l.values[i]) }));
          return (
            <g key={`l${li}`}>
              <path d={smoothPath(pts)} fill="none" stroke={l.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={active === i ? 5.5 : 4} fill={l.color} stroke="#fff" strokeWidth="1.5" />
              ))}
            </g>
          );
        })}

        {/* hover / tap areas */}
        {categories.map((_, i) => (
          <rect
            key={`hit${i}`}
            x={ml + band * i}
            y={mt}
            width={band}
            height={plotH + bottom}
            fill="transparent"
            style={{ cursor: "pointer" }}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") setActive(i);
            }}
            onPointerDown={() => setActive((cur) => (cur === i ? null : i))}
          />
        ))}
      </svg>

      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none bg-white border border-slate-200 shadow-lg rounded-lg px-3 py-2 text-xs"
          style={{
            top: 6,
            left: cx(active),
            minWidth: 150,
            maxWidth: 230,
            transform: onRight ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
          }}
        >
          <p className="font-semibold text-slate-800 mb-1 break-words">{categories[active].fullLabel || categories[active].label}</p>
          {tooltip.rows.map((r, i) => (
            <div key={i} className={`flex items-center justify-between gap-3 ${r.strong ? "border-t border-slate-100 mt-1 pt-1 font-semibold" : ""}`}>
              <span className="flex items-center gap-1.5 text-slate-600">
                {r.color && (
                  <span
                    className="inline-block"
                    style={{ width: r.shape === "line" ? 10 : 8, height: r.shape === "line" ? 3 : 8, background: r.color, borderRadius: r.shape === "line" ? 2 : 1 }}
                  />
                )}
                {r.label}
              </span>
              <span className="font-semibold text-slate-800">{r.value}</span>
            </div>
          ))}
          {tooltip.extra.length > 0 && (
            <div className="border-t border-slate-100 mt-1 pt-1 space-y-0.5">
              {tooltip.extra.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-slate-500">
                  <span>{r.label}</span>
                  <span className="font-medium text-slate-700">{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Card pieces
   -------------------------------------------------------------------------- */
export function ChartLegend({ items }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mt-2 text-xs text-slate-600">
      {items.map((it) => (
        <span key={it.name} className="inline-flex items-center gap-1.5">
          {it.type === "line" ? (
            <svg width="20" height="8" aria-hidden="true">
              <line x1="0" x2="20" y1="4" y2="4" stroke={it.color} strokeWidth="2.5" />
              <circle cx="10" cy="4" r="3" fill={it.color} />
            </svg>
          ) : (
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: it.color }} />
          )}
          {it.name}
        </span>
      ))}
    </div>
  );
}

export function ChartFooter({ stats }) {
  return (
    <div
      className="grid gap-2 mt-4 pt-3 border-t border-slate-200 text-center"
      style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}
    >
      {stats.map((s) => (
        <div key={s.label} className="min-w-0">
          <p className="text-[11px] sm:text-xs text-slate-500 truncate">{s.label}</p>
          <p className="text-base sm:text-lg font-bold truncate" style={{ color: s.color || "#0f2a52" }}>
            {s.value}
          </p>
          {s.hint && <p className="text-[10px] text-slate-400 truncate">{s.hint}</p>}
        </div>
      ))}
    </div>
  );
}

const ICONS = {
  trend: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  bars: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  book: <path d="M4 5a2 2 0 012-2h5v17H6a2 2 0 00-2 2V5zM20 5a2 2 0 00-2-2h-5v17h5a2 2 0 012 2V5z" />,
};

export function ChartCard({ icon = "trend", title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={COLORS.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {ICONS[icon]}
        </svg>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm sm:text-base text-[#12305c]">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

const perfText = (p) => (p >= 80 ? "text-emerald-600" : p >= 60 ? "text-blue-600" : p >= 40 ? "text-amber-600" : "text-rose-600");

/* --------------------------------------------------------------------------
   Academic performance: course chart + grade chart + full course table
   -------------------------------------------------------------------------- */
export function PerformanceCharts({ performance = {}, slowLearnersTotal = 0 }) {
  const courses = Array.isArray(performance.coursePerformance) ? performance.coursePerformance : [];
  const dist = performance.gradeDistribution || {};

  const courseCats = courses.map((c) => ({ label: c.name || "—", fullLabel: c.name || "—" }));
  const courseBars = [{ name: "Class average", color: COLORS.bar, values: courses.map((c) => num(c.average)), format: (v) => `${v}%` }];
  const courseLines = [{ name: "Pass rate", color: COLORS.navy, values: courses.map((c) => num(c.passRate)), axis: "left", format: (v) => `${v}%` }];

  const gradeKeys = ["A", "B", "C", "D", "F", ...Object.keys(dist).filter((k) => !["A", "B", "C", "D", "F"].includes(k))].filter(
    (k, i, arr) => arr.indexOf(k) === i && (["A", "B", "C", "D", "F"].includes(k) || num(dist[k]) > 0)
  );
  const gradeCounts = gradeKeys.map((k) => num(dist[k]));
  const gradeTotal = gradeCounts.reduce((s, v) => s + v, 0);
  // no marks at all -> show the empty message instead of a chart full of zeros
  const gradeCats = gradeTotal > 0 ? gradeKeys.map((k) => ({ label: k, fullLabel: `Grade ${k}` })) : [];
  const gradeBars = [
    {
      name: "Marks",
      color: COLORS.bar,
      colors: gradeKeys.map((k) => GRADE_COLORS[k] || "#94a3b8"),
      values: gradeCounts,
      format: (v) => String(v),
    },
  ];
  const topIdx = gradeCounts.indexOf(Math.max(...gradeCounts, 0));
  const mostCommon = gradeTotal > 0 && topIdx >= 0 ? gradeKeys[topIdx] : "—";
  const failCount = num(dist.F);

  return (
    <div className="space-y-4 mb-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard icon="book" title="Course Performance" subtitle="Class average and pass rate per course">
          <MixedChart
            categories={courseCats}
            bars={courseBars}
            lines={courseLines}
            left={{ min: 0, max: 100, ticks: [0, 25, 50, 75, 100], format: (v) => `${v}%` }}
            ariaLabel="Class average and pass rate per course"
            emptyText="No course performance data available"
            extraRows={(i) => {
              const c = courses[i] || {};
              return [
                { label: "Students", value: num(c.students) },
                { label: "Passed / Failed", value: `${num(c.passCount)} / ${num(c.failCount)}` },
                { label: "Best / Worst", value: `${num(c.bestScore)}% / ${num(c.worstScore)}%` },
              ];
            }}
          />
          <ChartLegend
            items={[
              { name: "Class average", color: COLORS.bar, type: "bar" },
              { name: "Pass rate", color: COLORS.navy, type: "line" },
            ]}
          />
          <ChartFooter
            stats={[
              { label: "Average score", value: `${num(performance.averageScore)}%`, color: "#4f46e5" },
              { label: "Pass rate", value: `${num(performance.passRate)}%`, color: COLORS.emerald },
              { label: "Marks recorded", value: num(performance.marksCount) },
              { label: "Slow learners", value: num(slowLearnersTotal), color: "#d97706" },
            ]}
          />
        </ChartCard>

        <ChartCard icon="bars" title="Grade Distribution" subtitle="Number of recorded marks per grade">
          <MixedChart
            categories={gradeCats}
            bars={gradeBars}
            showBarValues
            left={{}}
            ariaLabel="Number of marks per grade"
            emptyText="No grade data available"
            extraRows={(i) => [{ label: "Share of all marks", value: gradeTotal > 0 ? `${Math.round((gradeCounts[i] / gradeTotal) * 100)}%` : "0%" }]}
          />
          <ChartLegend items={gradeKeys.map((k) => ({ name: `Grade ${k}`, color: GRADE_COLORS[k] || "#94a3b8", type: "bar" }))} />
          <ChartFooter
            stats={[
              { label: "Marks graded", value: gradeTotal },
              { label: "Most common grade", value: mostCommon },
              {
                label: "Grade F",
                value: failCount,
                color: COLORS.rose,
                hint: gradeTotal > 0 ? `${Math.round((failCount / gradeTotal) * 100)}% of marks` : undefined,
              },
            ]}
          />
        </ChartCard>
      </div>

      {/* Every number of the old course breakdown is kept here */}
      <details open className="bg-white rounded-xl border border-slate-200 group">
        <summary className="cursor-pointer select-none list-none px-4 py-3 flex items-center justify-between text-sm font-semibold text-[#12305c]">
          <span>📚 Course details</span>
          <span className="text-xs font-normal text-slate-400">{courses.length} course{courses.length === 1 ? "" : "s"} · tap to show / hide</span>
        </summary>
        <div className="overflow-auto max-h-72 border-t border-slate-100">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 sticky top-0">
              <tr className="text-slate-500">
                {["Course", "Students", "Average", "Pass %", "Fail %", "Best", "Worst", "Passed", "Failed"].map((h, i) => (
                  <th key={h} className={`px-3 py-2 font-semibold ${i === 0 ? "text-left" : "text-center"} whitespace-nowrap`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-4 text-center text-slate-400 italic">
                    No course performance data available
                  </td>
                </tr>
              ) : (
                courses.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">{c.name}</td>
                    <td className="px-3 py-2 text-center text-slate-600">{num(c.students)}</td>
                    <td className={`px-3 py-2 text-center font-bold ${perfText(num(c.average))}`}>{num(c.average)}%</td>
                    <td className="px-3 py-2 text-center text-emerald-600">{num(c.passRate)}%</td>
                    <td className="px-3 py-2 text-center text-rose-600">{num(c.failRate)}%</td>
                    <td className="px-3 py-2 text-center text-slate-600">{num(c.bestScore)}%</td>
                    <td className="px-3 py-2 text-center text-slate-600">{num(c.worstScore)}%</td>
                    <td className="px-3 py-2 text-center text-emerald-600">{num(c.passCount)}</td>
                    <td className="px-3 py-2 text-center text-rose-600">{num(c.failCount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Attendance (students or teachers): rate trend + daily stacked bars
   `data` is the existing stats.studentAttendance / stats.teacherAttendance
   (dailyBreakdown is newest-first there, so it is reversed here).
   -------------------------------------------------------------------------- */
export function AttendanceCharts({ data = {}, accent = "blue", who = "Student" }) {
  const days = useMemo(
    () => (Array.isArray(data.dailyBreakdown) ? data.dailyBreakdown.slice(0, 7).slice().reverse() : []),
    [data.dailyBreakdown]
  );
  const lineColor = accent === "purple" ? COLORS.purple : accent === "emerald" ? COLORS.emerald : COLORS.blue;

  const cats = days.map((d) => {
    const f = formatDay(d.date);
    return { label: f.short, fullLabel: f.long };
  });
  const present = days.map((d) => num(d.present));
  const late = days.map((d) => num(d.late));
  const absent = days.map((d) => num(d.absent));
  const totals = days.map((d, i) => (num(d.total) > 0 ? num(d.total) : present[i] + late[i] + absent[i]));
  const rates = days.map((_, i) => (totals[i] > 0 ? Math.round((present[i] / totals[i]) * 100) : 0));

  const domain = percentDomain(rates);
  let lowest = null;
  rates.forEach((r, i) => {
    if (totals[i] > 0 && (lowest === null || r < lowest.rate)) lowest = { rate: r, label: cats[i].label };
  });

  return (
    <div className="space-y-4 mb-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard icon="trend" title={`${who} Attendance Rate`} subtitle="Share of records marked present, per day">
          <MixedChart
            categories={cats}
            lines={[{ name: "Attendance rate", color: lineColor, values: rates, format: (v) => `${v}%` }]}
            left={{ min: domain.min, max: domain.max, ticks: domain.ticks, format: (v) => `${v}%` }}
            verticalGrid
            ariaLabel={`${who} attendance rate per day`}
            emptyText="No attendance data available"
            extraRows={(i) => [{ label: "Records that day", value: totals[i] }]}
          />
          <ChartLegend items={[{ name: "Attendance rate", color: lineColor, type: "line" }]} />
          <ChartFooter
            stats={[
              { label: "Overall rate", value: `${num(data.rate)}%`, color: lineColor },
              { label: "Days recorded", value: days.length },
              { label: "Lowest day", value: lowest ? `${lowest.rate}%` : "—", hint: lowest ? lowest.label : undefined, color: lowest ? COLORS.rose : undefined },
            ]}
          />
        </ChartCard>

        <ChartCard icon="bars" title="Daily Attendance" subtitle="Present, late and absent per day">
          <MixedChart
            categories={cats}
            bars={[
              { name: "Present", color: COLORS.emerald, values: present },
              { name: "Late", color: COLORS.amber, values: late },
              { name: "Absent", color: COLORS.rose, values: absent },
            ]}
            barMode="stack"
            left={{}}
            ariaLabel={`${who} present, late and absent per day`}
            emptyText="No attendance data available"
            extraRows={(i) => [{ label: "Attendance rate", value: `${rates[i]}%` }]}
          />
          <ChartLegend
            items={[
              { name: "Present", color: COLORS.emerald, type: "bar" },
              { name: "Late", color: COLORS.amber, type: "bar" },
              { name: "Absent", color: COLORS.rose, type: "bar" },
            ]}
          />
          <ChartFooter
            stats={[
              { label: "Present", value: num(data.present), color: COLORS.emerald },
              { label: "Late", value: num(data.late), color: "#d97706" },
              { label: "Absent", value: num(data.absent), color: COLORS.rose },
            ]}
          />
        </ChartCard>
      </div>

      {/* The old day-by-day numbers, kept as a table */}
      <details className="bg-white rounded-xl border border-slate-200">
        <summary className="cursor-pointer select-none list-none px-4 py-3 flex items-center justify-between text-sm font-semibold text-[#12305c]">
          <span>📅 Daily {who.toLowerCase()} attendance — numbers (last 7 days)</span>
          <span className="text-xs font-normal text-slate-400">tap to show / hide</span>
        </summary>
        <div className="overflow-auto border-t border-slate-100">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50">
              <tr className="text-slate-500">
                {["Date", "Present", "Late", "Absent", "Total", "Rate"].map((h, i) => (
                  <th key={h} className={`px-3 py-2 font-semibold ${i === 0 ? "text-left" : "text-center"}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {days.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-slate-400 italic">
                    No attendance data available
                  </td>
                </tr>
              ) : (
                days
                  .map((d, i) => ({ d, i }))
                  .reverse() // newest first, like the old list
                  .map(({ d, i }) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{cats[i].fullLabel}</td>
                      <td className="px-3 py-2 text-center font-medium text-emerald-600">{present[i]}</td>
                      <td className="px-3 py-2 text-center font-medium text-amber-600">{late[i]}</td>
                      <td className="px-3 py-2 text-center font-medium text-rose-600">{absent[i]}</td>
                      <td className="px-3 py-2 text-center text-slate-700">{totals[i]}</td>
                      <td className="px-3 py-2 text-center font-semibold text-slate-700">{rates[i]}%</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}