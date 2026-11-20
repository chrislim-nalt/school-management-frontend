import React, { useEffect, useMemo, useRef, useState } from "react";

// DashboardCharts.jsx — AUCA-style charts for SchoolDashboard (pure SVG, no extra library).
// Keep this file in the SAME folder as SchoolDashboard.jsx.

const C = { bar: "#5b9bdc", navy: "#0b4a8a", blue: "#2f74c9", purple: "#7c3aed", green: "#10b981", amber: "#f59e0b", rose: "#f43f5e", grid: "#d5dce8", axis: "#1e293b", text: "#334155" };
const GRADES = { A: C.green, B: "#3b82f6", C: C.amber, D: "#f97316", F: C.rose };
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const cut = (s, n) => { const t = String(s ?? ""); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const pct = (v) => `${v}%`;

// "2026-10-27" -> { short: "27 Oct", long: "Tue, 27 Oct 2026" }; other text is shown as is
export function formatDay(value) {
  const raw = String(value ?? "");
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = m && new Date(+m[1], +m[2] - 1, +m[3]);
  if (!d || isNaN(d)) return { short: raw, long: raw };
  return {
    short: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    long: d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }),
  };
}

// Round axis ticks for counts: 0, 5, 10, 15 ...
function niceTicks(max) {
  if (!(max > 0)) return [0, 1, 2, 3, 4];
  const rough = max / 4, pow = 10 ** Math.floor(Math.log10(rough)), f = rough / pow;
  const step = Math.max(1, (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow);
  const ticks = [];
  for (let v = 0; v <= Math.ceil(max / step) * step + 1e-9; v += step) ticks.push(Math.round(v * 1000) / 1000);
  if (ticks.length < 3) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

// % axis for trend lines: 0-100 for low values, zoomed (e.g. 70-100) for high ones
function percentAxis(values) {
  const lo = Math.min(...values);
  if (!values.length || lo < 50) return { min: 0, max: 100, ticks: [0, 25, 50, 75, 100], fmt: pct };
  const min = Math.max(0, Math.floor((lo - 5) / 10) * 10), range = 100 - min, step = range <= 10 ? 5 : range <= 40 ? 10 : 20;
  const ticks = [];
  for (let t = min; t <= 100; t += step) ticks.push(t);
  return { min, max: 100, ticks, fmt: pct };
}

// Smooth monotone curve through the points
function curve(p) {
  const n = p.length;
  if (n < 2) return n ? `M${p[0].x},${p[0].y}` : "";
  if (n === 2) return `M${p[0].x},${p[0].y}L${p[1].x},${p[1].y}`;
  const dx = [], m = [], t = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = p[i + 1].x - p[i].x; m[i] = (p[i + 1].y - p[i].y) / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    t[i] = m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  }
  let d = `M${p[0].x},${p[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${p[i].x + h},${p[i].y + t[i] * h},${p[i + 1].x - h},${p[i + 1].y - t[i + 1] * h},${p[i + 1].x},${p[i + 1].y}`;
  }
  return d;
}

function useWidth(ref) {
  const [w, setW] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => { const x = Math.floor(el.getBoundingClientRect().width); if (x > 0) setW(x); };
    read();
    if (typeof ResizeObserver === "undefined") { window.addEventListener("resize", read); return () => window.removeEventListener("resize", read); }
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/* One chart for lines, bars, stacked bars, or bars + line.
   cats: [{label, full}]  bars/lines: [{name, color, colors?, v: [values], fmt?}]
   y: { min, max, ticks, fmt }   extra(i) -> [[label, value]] shown in the tooltip */
function Chart({ cats = [], bars = [], lines = [], y = {}, height = 260, vGrid, values, label, empty = "No data available", extra }) {
  const ref = useRef(null);
  const width = useWidth(ref);
  const [on, setOn] = useState(null);

  useEffect(() => {
    if (on === null) return undefined;
    const away = (e) => ref.current && !ref.current.contains(e.target) && setOn(null);
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [on]);

  const n = cats.length, small = width < 420, fs = small ? 11 : 12;
  const g = useMemo(() => {
    const tops = cats.map((_, i) => bars.reduce((s, b) => s + num(b.v[i]), 0));
    const ticks = y.ticks || niceTicks(Math.max(0, ...tops, ...lines.flatMap((l) => l.v.map(num))));
    const fmt = y.fmt || String, lo = y.min ?? 0, hi = ticks[ticks.length - 1];
    const mt = values ? 28 : 14, mr = 14;
    let ml = Math.max(34, Math.max(...ticks.map((t) => String(fmt(t)).length)) * fs * 0.62 + 18);
    const longest = Math.max(0, ...cats.map((c) => String(c.label).length));
    const band0 = Math.max(40, width - ml - mr) / (n || 1);
    const rot = n > 1 && longest * (fs * 0.55) > band0 - 6, maxCh = rot ? 16 : Math.max(3, Math.floor((band0 - 6) / (fs * 0.55)));
    if (rot) ml = Math.max(ml, Math.ceil(Math.min(longest, maxCh) * fs * 0.55 * 0.82 - band0 / 2 + 8)); // room for a tilted first label
    const bottom = rot ? Math.min(96, 24 + Math.min(longest, 16) * 4.2) : 34;
    const H = small ? Math.round(height * 0.85) : height, pw = Math.max(40, width - ml - mr), ph = Math.max(80, H - mt - bottom);
    return { ticks, fmt, lo, hi, mt, ml, pw, ph, band: pw / (n || 1), rot, maxCh, total: mt + ph + bottom };
  }, [cats, bars, lines, y, width, height, values, n, small, fs]);

  if (!n) return <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm italic text-slate-400" style={{ height: small ? Math.round(height * 0.85) : height }}>{empty}</div>;

  const { ticks, fmt, lo, hi, mt, ml, pw, ph, band, rot, maxCh, total } = g;
  const Y = (v) => mt + ph * (1 - (num(v) - lo) / (hi - lo || 1));
  const X = (i) => ml + band * (i + 0.5);
  const base = mt + ph, bw = Math.min(band * 0.58, 64);

  const tip = on !== null && on < n && [
    ...bars.map((b) => [b.name, (b.fmt || String)(num(b.v[on])), b.colors ? b.colors[on] : b.color]),
    ...(bars.length > 1 ? [["Total", String(bars.reduce((s, b) => s + num(b.v[on]), 0)), null, true]] : []),
    ...lines.map((l) => [l.name, (l.fmt || String)(num(l.v[on])), l.color]),
  ];
  const more = on !== null && extra ? extra(on) || [] : [];

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height: total }}>
      <svg width={width} height={total} viewBox={`0 0 ${width} ${total}`} role="img" aria-label={label} style={{ display: "block", overflow: "visible", fontFamily: "inherit", fontVariantNumeric: "tabular-nums" }}
        onPointerLeave={(e) => e.pointerType === "mouse" && setOn(null)}>
        {on !== null && <rect x={ml + band * on} y={mt} width={band} height={ph} fill="#2563eb" opacity=".06" />}
        {ticks.map((t) => <line key={t} x1={ml} x2={ml + pw} y1={Y(t)} y2={Y(t)} stroke={C.grid} strokeDasharray="2 3" />)}
        {vGrid && cats.map((_, i) => <line key={i} x1={X(i)} x2={X(i)} y1={mt} y2={base} stroke={C.grid} strokeDasharray="2 3" />)}

        {bars.map((b, bi) => cats.map((_, i) => {
          const v = Math.max(0, num(b.v[i])), below = bars.slice(0, bi).reduce((s, x) => s + Math.max(0, num(x.v[i])), 0), h = Y(below) - Y(below + v);
          return h > 0 ? <rect key={`${bi}-${i}`} x={X(i) - bw / 2} y={Y(below + v)} width={bw} height={h} fill={b.colors ? b.colors[i] : b.color} /> : null;
        }))}
        {values && cats.map((_, i) => <text key={i} x={X(i)} y={Y(num(bars[0].v[i])) - 6} textAnchor="middle" fontSize={fs} fontWeight="600" fill={C.text}>{num(bars[0].v[i])}</text>)}

        <path d={`M${ml},${mt}V${base}H${ml + pw}`} fill="none" stroke={C.axis} />
        {ticks.map((t) => <g key={t}><line x1={ml - 5} x2={ml} y1={Y(t)} y2={Y(t)} stroke={C.axis} /><text x={ml - 9} y={Y(t) + 4} textAnchor="end" fontSize={fs} fill={C.text}>{fmt(t)}</text></g>)}
        {cats.map((c, i) => (
          <g key={i}>
            <line x1={X(i)} x2={X(i)} y1={base} y2={base + 5} stroke={C.axis} />
            <text x={X(i) + (rot ? 4 : 0)} y={base + (rot ? 14 : 21)} textAnchor={rot ? "end" : "middle"} fontSize={fs} fill={C.text} transform={rot ? `rotate(-35 ${X(i) + 4} ${base + 14})` : undefined}>{cut(c.label, maxCh)}</text>
          </g>
        ))}

        {lines.map((l, li) => {
          const pts = cats.map((_, i) => ({ x: X(i), y: Y(l.v[i]) }));
          return (
            <g key={li}>
              <path d={curve(pts)} fill="none" stroke={l.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={on === i ? 5.5 : 4} fill={l.color} stroke="#fff" strokeWidth="1.5" />)}
            </g>
          );
        })}

        {cats.map((_, i) => <rect key={i} x={ml + band * i} y={mt} width={band} height={ph + 34} fill="transparent" style={{ cursor: "pointer" }}
          onPointerEnter={(e) => e.pointerType === "mouse" && setOn(i)} onPointerDown={() => setOn((c) => (c === i ? null : i))} />)}
      </svg>

      {tip && (
        <div className="pointer-events-none absolute z-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={small ? { top: 4, left: "50%", transform: "translateX(-50%)", width: Math.min(220, width - 16) }
            : { top: 6, left: X(on), width: 210, transform: X(on) > width * 0.58 ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}>
          <p className="mb-1 break-words text-[13px] font-semibold text-slate-800">{cats[on].full || cats[on].label}</p>
          {tip.map(([name, val, color, strong]) => (
            <div key={name} className={`flex justify-between gap-3 ${strong ? "mt-1 border-t border-slate-100 pt-1 font-semibold" : ""}`}>
              <span className="flex items-center gap-1.5 text-slate-600">{color && <i className="inline-block h-2 w-2 rounded-sm" style={{ background: color }} />}{name}</span>
              <span className="font-semibold tabular-nums text-slate-800">{val}</span>
            </div>
          ))}
          {more.length > 0 && <div className="mt-1 space-y-0.5 border-t border-slate-100 pt-1 text-slate-500">{more.map(([k, v]) => <div key={k} className="flex justify-between gap-3"><span>{k}</span><span className="font-medium tabular-nums text-slate-700">{v}</span></div>)}</div>}
        </div>
      )}
    </div>
  );
}

/* ---------- card pieces ---------- */
const ICONS = { trend: "M3 17l6-6 4 4 8-8M15 7h6v6", bars: "M4 20V10M10 20V4M16 20v-7M22 20H2", book: "M4 5a2 2 0 012-2h5v17H6a2 2 0 00-2 2V5zM20 5a2 2 0 00-2-2h-5v17h5a2 2 0 012 2V5z" };

function Card({ icon, title, sub, items, stats, children }) {
  const cols = stats.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : stats.length === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[icon]} /></svg>
        <div className="min-w-0"><h3 className="text-sm font-semibold tracking-tight text-[#12305c] sm:text-[15px]">{title}</h3><p className="text-[11px] text-slate-400">{sub}</p></div>
      </div>
      {children}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600">
        {items.map(([name, color, line]) => (
          <span key={name} className="inline-flex items-center gap-1.5">
            {line ? <svg width="20" height="8" aria-hidden="true"><line x1="0" x2="20" y1="4" y2="4" stroke={color} strokeWidth="2.5" /><circle cx="10" cy="4" r="3" fill={color} /></svg> : <i className="inline-block h-3 w-3 rounded-sm" style={{ background: color }} />}
            {name}
          </span>
        ))}
      </div>
      <div className={`mt-4 grid gap-x-2 gap-y-3 border-t border-slate-200 pt-3 text-center ${cols}`}>
        {stats.map(([label, value, color, hint]) => (
          <div key={label} className="min-w-0">
            <p className="truncate text-[11px] text-slate-500 sm:text-xs">{label}</p>
            <p className="truncate text-base font-semibold tabular-nums sm:text-lg" style={{ color: color || "#0f2a52" }}>{value}</p>
            {hint && <p className="truncate text-[10px] text-slate-400">{hint}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

// Table of the exact numbers behind the charts. cols: [header, (row) => cell, cellClass]
function Details({ title, hint, open, cols, rows, empty }) {
  return (
    <details open={open} className="rounded-xl border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-[#12305c]">
        <span>{title}</span><span className="hidden text-xs font-normal text-slate-400 sm:inline">{hint}</span>
      </summary>
      <div className="max-h-72 overflow-auto border-t border-slate-100">
        <table className="min-w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>{cols.map(([h], i) => <th key={h} className={`whitespace-nowrap px-3 py-2 font-semibold ${i ? "text-center" : "text-left"}`}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? <tr><td colSpan={cols.length} className="px-3 py-4 text-center italic text-slate-400">{empty}</td></tr>
              : rows.map((r, i) => <tr key={i} className="hover:bg-slate-50">{cols.map(([h, get, cls]) => <td key={h} className={`px-3 py-2 tabular-nums ${cls || "text-center text-slate-600"}`}>{get(r)}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </details>
  );
}

const level = (p) => (p >= 80 ? "text-emerald-600" : p >= 60 ? "text-blue-600" : p >= 40 ? "text-amber-600" : "text-rose-600");
const two = "grid grid-cols-1 gap-4 xl:grid-cols-2";

/* ---------- Academic performance ---------- */
export function PerformanceCharts({ performance = {}, slowLearnersTotal = 0 }) {
  const courses = Array.isArray(performance.coursePerformance) ? performance.coursePerformance : [];
  const dist = performance.gradeDistribution || {};
  const keys = ["A", "B", "C", "D", "F", ...Object.keys(dist).filter((k) => !"ABCDF".includes(k) && num(dist[k]) > 0)];
  const counts = keys.map((k) => num(dist[k])), sum = counts.reduce((a, b) => a + b, 0);
  const top = sum > 0 ? keys[counts.indexOf(Math.max(...counts))] : "—";
  const share = (v) => (sum ? `${Math.round((v / sum) * 100)}%` : "0%");

  return (
    <div className="mb-4 space-y-4">
      <div className={two}>
        <Card icon="book" title="Course Performance" sub="Class average and pass rate per course"
          items={[["Class average", C.bar], ["Pass rate", C.navy, true]]}
          stats={[["Average score", pct(num(performance.averageScore)), "#4f46e5"], ["Pass rate", pct(num(performance.passRate)), C.green], ["Marks recorded", num(performance.marksCount)], ["Slow learners", num(slowLearnersTotal), "#d97706"]]}>
          <Chart label="Class average and pass rate per course" empty="No course performance data available"
            cats={courses.map((c) => ({ label: c.name || "—" }))}
            bars={[{ name: "Class average", color: C.bar, v: courses.map((c) => num(c.average)), fmt: pct }]}
            lines={[{ name: "Pass rate", color: C.navy, v: courses.map((c) => num(c.passRate)), fmt: pct }]}
            y={{ min: 0, max: 100, ticks: [0, 25, 50, 75, 100], fmt: pct }}
            extra={(i) => { const c = courses[i] || {}; return [["Students", num(c.students)], ["Passed / Failed", `${num(c.passCount)} / ${num(c.failCount)}`], ["Best / Worst", `${num(c.bestScore)}% / ${num(c.worstScore)}%`]]; }} />
        </Card>

        <Card icon="bars" title="Grade Distribution" sub="Number of recorded marks per grade"
          items={keys.map((k) => [`Grade ${k}`, GRADES[k] || "#94a3b8"])}
          stats={[["Marks graded", sum], ["Most common", top], ["Grade F", num(dist.F), C.rose, sum ? `${share(num(dist.F))} of marks` : undefined]]}>
          <Chart label="Number of marks per grade" empty="No grade data available" values
            cats={sum > 0 ? keys.map((k) => ({ label: k, full: `Grade ${k}` })) : []}
            bars={[{ name: "Marks", v: counts, colors: keys.map((k) => GRADES[k] || "#94a3b8") }]}
            extra={(i) => [["Share of all marks", share(counts[i])]]} />
        </Card>
      </div>

      <Details open title="📚 Course details" hint={`${courses.length} course${courses.length === 1 ? "" : "s"} · tap to show / hide`} rows={courses} empty="No course performance data available"
        cols={[["Course", (c) => c.name, "font-medium text-slate-700"], ["Students", (c) => num(c.students)],
          ["Average", (c) => <span className={level(num(c.average))}>{pct(num(c.average))}</span>, "text-center font-semibold"],
          ["Pass %", (c) => pct(num(c.passRate)), "text-center text-emerald-600"], ["Fail %", (c) => pct(num(c.failRate)), "text-center text-rose-600"],
          ["Best", (c) => pct(num(c.bestScore))], ["Worst", (c) => pct(num(c.worstScore))],
          ["Passed", (c) => num(c.passCount), "text-center text-emerald-600"], ["Failed", (c) => num(c.failCount), "text-center text-rose-600"]]} />
    </div>
  );
}

/* ---------- Attendance (students or teachers) ----------
   `data` = stats.studentAttendance / stats.teacherAttendance (dailyBreakdown is newest-first) */
export function AttendanceCharts({ data = {}, accent = "blue", who = "Student" }) {
  const days = useMemo(() => (Array.isArray(data.dailyBreakdown) ? data.dailyBreakdown.slice(0, 7).reverse() : []), [data.dailyBreakdown]);
  const color = accent === "purple" ? C.purple : accent === "emerald" ? C.green : C.blue;
  const cats = days.map((d) => { const f = formatDay(d.date); return { label: f.short, full: f.long }; });
  const [p, l, a] = [days.map((d) => num(d.present)), days.map((d) => num(d.late)), days.map((d) => num(d.absent))];
  const total = days.map((d, i) => num(d.total) || p[i] + l[i] + a[i]);
  const rate = days.map((_, i) => (total[i] ? Math.round((p[i] / total[i]) * 100) : 0));
  const low = rate.reduce((m, r, i) => (total[i] && (m === null || r < rate[m]) ? i : m), null);

  return (
    <div className="mb-4 space-y-4">
      <div className={two}>
        <Card icon="trend" title={`${who} Attendance Rate`} sub="Share of records marked present, per day" items={[["Attendance rate", color, true]]}
          stats={[["Overall rate", pct(num(data.rate)), color], ["Days recorded", days.length], ["Lowest day", low === null ? "—" : pct(rate[low]), low === null ? undefined : C.rose, low === null ? undefined : cats[low].label]]}>
          <Chart label={`${who} attendance rate per day`} empty="No attendance data available" vGrid cats={cats}
            lines={[{ name: "Attendance rate", color, v: rate, fmt: pct }]} y={percentAxis(rate)} extra={(i) => [["Records that day", total[i]]]} />
        </Card>

        <Card icon="bars" title="Daily Attendance" sub="Present, late and absent per day"
          items={[["Present", C.green], ["Late", C.amber], ["Absent", C.rose]]}
          stats={[["Present", num(data.present), C.green], ["Late", num(data.late), "#d97706"], ["Absent", num(data.absent), C.rose]]}>
          <Chart label={`${who} present, late and absent per day`} empty="No attendance data available" cats={cats}
            bars={[{ name: "Present", color: C.green, v: p }, { name: "Late", color: C.amber, v: l }, { name: "Absent", color: C.rose, v: a }]}
            extra={(i) => [["Attendance rate", pct(rate[i])]]} />
        </Card>
      </div>

      <Details title={`📅 Daily ${who.toLowerCase()} attendance — numbers (last 7 days)`} hint="tap to show / hide" empty="No attendance data available"
        rows={days.map((_, i) => i).reverse()}
        cols={[["Date", (i) => cats[i].full, "whitespace-nowrap text-slate-600"], ["Present", (i) => p[i], "text-center font-medium text-emerald-600"],
          ["Late", (i) => l[i], "text-center font-medium text-amber-600"], ["Absent", (i) => a[i], "text-center font-medium text-rose-600"],
          ["Total", (i) => total[i], "text-center text-slate-700"], ["Rate", (i) => pct(rate[i]), "text-center font-semibold text-slate-700"]]} />
    </div>
  );
}