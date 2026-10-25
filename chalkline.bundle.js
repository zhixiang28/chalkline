// chalkline.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { BetaField, BetaPlayer, drawBeta, drawStickFrame, groupMoves, hasBeta } from "./beta.js";
import { TechniqueSheet } from "./technique.js";
import {
  Mountain,
  Camera,
  CalendarDays,
  Plus,
  MessageCircle,
  X,
  Check,
  Send,
  ChevronRight,
  ChevronDown,
  Link2,
  Undo2,
  Heart,
  Trash2,
  Search,
  Lock,
  Globe,
  GraduationCap,
  LogOut,
  MapPin,
  Clock,
  Filter,
  CircleDot,
  ArrowUpFromLine,
  Flag,
  MoreHorizontal,
  CheckCircle2,
  Hourglass,
  Layers,
  CalendarRange,
  Bookmark,
  UserPlus,
  UserMinus,
  Ban,
  QrCode,
  ArrowLeft,
  UserSearch,
  Tag as TagIcon,
  ExternalLink,
  Anchor,
  Repeat,
  Compass,
  Award,
  Settings,
  TrendingUp,
  Maximize2,
  Zap,
  Star,
  Share2,
  Coffee,
  Download,
  AlertTriangle,
  Images,
  LayoutGrid,
  Pencil,
  Bell,
  Video as VideoIcon,
  Play,
  Menu as MenuIcon,
  Home as HomeIcon,
  List as ListIcon
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell, AreaChart, Area, CartesianGrid } from "recharts";
var BOULDER_GRADES = ["VB", ...Array.from({ length: 13 }, (_, i) => `V${i}`)];
var BOULDER_COLORS = {
  VB: { hex: "#C2568B", label: "Pink tag" },
  V0: { hex: "#3A6EA5", label: "Blue tag" },
  V1: { hex: "#D4A017", label: "Yellow tag" },
  V2: { hex: "#C4501F", label: "Orange tag" },
  V3: { hex: "#6B8E4E", label: "Green tag" },
  V4: { hex: "#6B4C93", label: "Purple tag" },
  V5: { hex: "#B33A3A", label: "Red tag" }
};
function boulderGradeInfo(grade) {
  if (!grade || grade === "NA") return { hex: "#8A8578", label: "N/A" };
  if (BOULDER_COLORS[grade]) return BOULDER_COLORS[grade];
  return { hex: "#2A2A28", label: "Black tag" };
}
var ROUTE_GRADES = (() => {
  const out = ["4"];
  [5, 6, 7, 8].forEach((n) => {
    ["a", "b", "c"].forEach((l) => {
      out.push(`${n}${l}`);
      out.push(`${n}${l}+`);
    });
  });
  return out;
})();
var ROUTE_EQUIV = {
  "4": "5.4",
  "5a": "5.6",
  "5a+": "5.6",
  "5b": "5.7",
  "5b+": "5.7",
  "5c": "5.8",
  "5c+": "5.8",
  "6a": "5.9",
  "6a+": "5.10a",
  "6b": "5.10b",
  "6b+": "5.10c",
  "6c": "5.10d",
  "6c+": "5.11a",
  "7a": "5.11b",
  "7a+": "5.11c",
  "7b": "5.11d",
  "7b+": "5.12a",
  "7c": "5.12b",
  "7c+": "5.12c",
  "8a": "5.12d",
  "8a+": "5.13a",
  "8b": "5.13b",
  "8b+": "5.13c",
  "8c": "5.13d",
  "8c+": "5.14a"
};
function routeGradeLabel(g) {
  if (!g || g === "NA") return "N/A / \u2013";
  return ROUTE_EQUIV[g] ? `${ROUTE_EQUIV[g]}  (French ${g})` : g;
}
var BOULDER_SCALE = "v";
var FONT_OF_V = { VB: "3", V0: "4", V1: "5", V2: "5+", V3: "6A", V4: "6B", V5: "6C", V6: "7A", V7: "7A+", V8: "7B", V9: "7C", V10: "7C+", V11: "8A", V12: "8A+" };
function boulderLabel(g) {
  return BOULDER_SCALE === "font" && FONT_OF_V[g] ? FONT_OF_V[g] : g;
}
function boulderOptionLabel(g) {
  if (g === "NA") return "N/A / \u2013";
  return BOULDER_SCALE === "font" && FONT_OF_V[g] ? `${FONT_OF_V[g]}  (${g})` : g;
}
var SEND_STYLE_LABELS = { flash: "Flash", onsight: "Onsight", redpoint: "Redpoint" };
var SEND_STYLE_RANK = { onsight: 3, flash: 2, redpoint: 1 };
function sendStyleLabel(type, style) {
  if (!style) return "";
  return type === "boulder" && style === "redpoint" ? "Send" : SEND_STYLE_LABELS[style] || "";
}
function sentLabel(climbs) {
  const sent = (climbs || []).filter((c) => c.status === "sent");
  if (sent.length === 0) return "Trying";
  const best = [...sent].sort((a, b) => (SEND_STYLE_RANK[b.style] || 0) - (SEND_STYLE_RANK[a.style] || 0))[0];
  return best.style && best.style !== "redpoint" ? SEND_STYLE_LABELS[best.style] : "Sent";
}
var PROFILE_BOULDER_OPTIONS = ["NA", ...BOULDER_GRADES];
var PROFILE_ROUTE_OPTIONS = ["NA", ...ROUTE_GRADES];
var QUALIFICATION_PRESETS = ["Bouldering", "Top rope", "Lead", "Belayer", "Auto belay", "Outdoor leader", "Free solo"];
var QUALIFICATION_ICONS = {
  "Bouldering": CircleDot,
  "Top rope": ArrowUpFromLine,
  "Lead": Flag,
  "Belayer": Anchor,
  "Auto belay": Repeat,
  "Outdoor leader": Compass,
  "Free solo": AlertTriangle
};
var TYPE_LABELS = { boulder: "Boulder", toprope: "Top rope", lead: "Lead", other: "Other" };
var TYPES = ["boulder", "toprope", "lead", "other"];
var TYPE_ICONS = { boulder: CircleDot, toprope: ArrowUpFromLine, lead: Flag, other: MoreHorizontal };
var STATUS_LABELS = { sent: "Sent", trying: "Trying" };
var TRACKABLE_TYPES = ["boulder", "toprope", "lead"];
var DEFAULT_TRACKED_TYPES = ["boulder"];
var DEFAULT_STAT_METRIC = "both";
var GYM_OPTIONS = [
  "Camp5 1Utama",
  "Camp5 Jumpa",
  "Camp5 KL East",
  "Camp5 Eco City",
  "Camp5 Paradigm JB",
  "Camp5 Utropolis",
  "Climb Central (Singapore)",
  "Climb Asia (Singapore)",
  "Climb Central (Bangkok)",
  "Urban Climb (Bangkok)",
  "Climb Central (Manila)",
  "Power Up Climbing Gym (Manila)",
  "The BHive (Makati)",
  "Boulder World Philippines (Manila)",
  "Bali Climbing (Bali)",
  "Tokei Ubud (Bali)",
  "Saigon Climbing Centre (Ho Chi Minh City)",
  "VietClimb (Hanoi)",
  "Railay Beach, Krabi (Thailand)",
  "Tonsai Beach, Krabi (Thailand)",
  "Batu Caves (Malaysia)",
  "Bukit Takun (Malaysia)",
  "Dairy Farm Quarry, Bukit Timah (Singapore)",
  "Vang Vieng (Laos)",
  "Cat Ba Island (Vietnam)"
];
function usGrade(g) {
  return ROUTE_EQUIV[g] || g;
}
var BADGE_DEFS = [
  { id: "finish-10", label: "10 sent", icon: CheckCircle2, test: (s2) => s2.totalSent >= 10 },
  { id: "finish-50", label: "50 sent", icon: CheckCircle2, test: (s2) => s2.totalSent >= 50 },
  { id: "finish-100", label: "100 sent", icon: CheckCircle2, test: (s2) => s2.totalSent >= 100 },
  { id: "finish-250", label: "250 sent", icon: CheckCircle2, test: (s2) => s2.totalSent >= 250 },
  { id: "hours-10", label: "10 hours", icon: Clock, test: (s2) => s2.totalMinutes >= 600 },
  { id: "hours-100", label: "100 hours", icon: Clock, test: (s2) => s2.totalMinutes >= 6e3 },
  { id: "hours-500", label: "500 hours", icon: Clock, test: (s2) => s2.totalMinutes >= 3e4 },
  ...["V1", "V3", "V5", "V7", "V9"].map((g) => ({
    id: `boulder-${g}`,
    label: `Boulder ${g}`,
    icon: CircleDot,
    test: (s2) => s2.boulderRank >= gradeRank("boulder", g)
  })),
  ...["5b", "6a", "6b", "6c", "7a", "7b", "7c"].map((g) => ({
    id: `route-${g}`,
    label: `Route ${usGrade(g)}`,
    icon: Flag,
    test: (s2) => s2.routeRank >= gradeRank("toprope", g)
  }))
];
function gradeOptionsFor(type) {
  if (type === "boulder") return BOULDER_GRADES;
  if (type === "toprope" || type === "lead") return ROUTE_GRADES;
  return null;
}
function gradeColor(type, grade) {
  if (type === "other" || !grade || grade === "NA") return "#8A8578";
  if (type === "boulder") return boulderGradeInfo(grade).hex;
  const n = parseInt(grade, 10) || 0;
  if (n <= 5) return "#6B8E4E";
  if (n === 6) return "#D4A017";
  if (n === 7) return "#C4501F";
  return "#6B4C93";
}
function boulderBand(grade) {
  return boulderGradeInfo(grade).label;
}
function gradeRank(type, grade) {
  if (!grade || grade === "NA") return -2;
  if (type === "boulder") {
    if (grade === "VB") return -1;
    return parseInt(grade.replace("V", ""), 10) || 0;
  }
  return ROUTE_GRADES.indexOf(grade);
}
function hardestSentRank(types, mine) {
  let best = -Infinity;
  mine.forEach((l) => {
    if (l.kind === "deal") return;
    (l.updates || []).forEach((u) => {
      (u.climbs || []).forEach((c) => {
        if (types.includes(c.type) && c.status === "sent") {
          const r = gradeRank(types[0] === "boulder" ? "boulder" : "toprope", c.grade);
          if (r > best) best = r;
        }
      });
    });
  });
  return best;
}
function effectiveGrade(kind, profileGrade, myLogs, publicOnly) {
  const relevantTypes = kind === "boulder" ? ["boulder"] : ["toprope", "lead"];
  const rankType = kind === "boulder" ? "boulder" : "toprope";
  let hardest = null;
  myLogs.forEach((l) => {
    if (l.kind === "deal") return;
    if (publicOnly && l.privacy === "private") return;
    (l.updates || []).forEach((u) => {
      (u.climbs || []).forEach((c) => {
        if (relevantTypes.includes(c.type) && c.status === "sent" && gradeRank(rankType, c.grade) > gradeRank(rankType, hardest)) hardest = c.grade;
      });
    });
  });
  if (!hardest) return profileGrade;
  return gradeRank(rankType, hardest) > gradeRank(rankType, profileGrade) ? hardest : profileGrade;
}
function gradeDistributionData(mine, type = "boulder") {
  const gradeList = type === "boulder" ? BOULDER_GRADES : ROUTE_GRADES;
  const counts = {};
  gradeList.forEach((g) => counts[g] = 0);
  mine.forEach((l) => {
    if (l.kind !== "climb") return;
    wallsFromEntry(l).forEach((w) => {
      if (w.type === type && counts[w.grade] !== void 0) counts[w.grade]++;
    });
  });
  const idx = gradeList.map((g, i) => counts[g] > 0 ? i : -1).filter((i) => i >= 0);
  let lo = 0, hi = Math.min(gradeList.length - 1, 7);
  if (idx.length) {
    lo = Math.max(0, idx[0] - 1);
    hi = Math.min(gradeList.length - 1, idx[idx.length - 1] + 1);
    while (hi - lo + 1 < 6 && (lo > 0 || hi < gradeList.length - 1)) {
      if (hi < gradeList.length - 1) hi++;
      if (hi - lo + 1 < 6 && lo > 0) lo--;
    }
  }
  return gradeList.slice(lo, hi + 1).map((g) => ({ grade: type === "boulder" ? boulderLabel(g) : usGrade(g), count: counts[g], color: gradeColor(type, g) }));
}
function monthlyProgressData(mine, type = null) {
  const now = /* @__PURE__ */ new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: d.toLocaleDateString(void 0, { month: "short" }), year: d.getFullYear(), month: d.getMonth(), count: 0 });
  }
  mine.forEach((l) => {
    if (l.kind !== "climb") return;
    buckets.forEach((b) => {
      const inMonth = (u) => {
        const d = new Date(u.timestamp);
        return d.getFullYear() === b.year && d.getMonth() === b.month;
      };
      b.count += wallsFromEntry(l, inMonth).filter((w) => !type || w.type === type).length;
    });
  });
  return buckets.map((b) => ({ month: b.key, count: b.count }));
}
function ProgressCharts({ mine, onShare }) {
  const [chartType, setChartType] = useState("boulder");
  const walls = mine.filter((l) => l.kind === "climb").flatMap((l) => wallsFromEntry(l)).filter((w) => w.type === chartType);
  const sent = walls.filter((w) => w.sent);
  let top = null;
  sent.forEach((w) => {
    if (!top || gradeRank(w.type, w.grade) > gradeRank(top.type, top.grade)) top = w;
  });
  const gradeData = gradeDistributionData(mine, chartType);
  const monthData = monthlyProgressData(mine, chartType);
  const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12.5 }, labelStyle: { color: "var(--ink)", fontWeight: 700 }, itemStyle: { color: "var(--ink)" }, cursor: { fill: "rgba(0,0,0,0.04)" } };
  const axis = { tick: { fontSize: 11, fill: "var(--ink-soft)" }, axisLine: false, tickLine: false };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-chart-card" }, /* @__PURE__ */ React.createElement("div", { className: "cl-tabbar cl-tabbar-even", style: { marginTop: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "cl-tabs", role: "tablist" }, [["boulder", "Boulder"], ["toprope", "Top rope"], ["lead", "Lead"]].map(([val, lbl]) => /* @__PURE__ */ React.createElement("button", { key: val, className: chartType === val ? "cl-tbtab active" : "cl-tbtab", onClick: () => setChartType(val), role: "tab", "aria-selected": chartType === val }, lbl))), onShare && /* @__PURE__ */ React.createElement("div", { className: "cl-tabbar-tools" }, /* @__PURE__ */ React.createElement("button", { className: "cl-tabbar-icon", "aria-label": "Share progress", onClick: () => onShare({ chartType, climbed: walls.length, sent: sent.length, topText: top ? chartType === "boulder" ? boulderLabel(top.grade) : usGrade(top.grade) : "", topColor: top ? gradeColor(top.type, top.grade) : null, bars: gradeData.map((d) => ({ label: d.grade, count: d.count, color: d.color })) }) }, /* @__PURE__ */ React.createElement(Share2, { size: 18 })))), /* @__PURE__ */ React.createElement("div", { className: "cl-chart-summary" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, walls.length), /* @__PURE__ */ React.createElement("span", null, "climbed")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, sent.length), /* @__PURE__ */ React.createElement("span", null, "sent")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", { style: top ? { color: gradeColor(top.type, top.grade) } : void 0 }, top ? chartType === "boulder" ? boulderLabel(top.grade) : usGrade(top.grade) : "\u2014"), React.createElement("span", null, "hardest sent"))), walls.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "cl-empty", style: { padding: "18px 0" } }, "No ", TYPE_LABELS[chartType].toLowerCase(), " climbs logged yet.") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "cl-chart-block" }, /* @__PURE__ */ React.createElement("p", { className: "cl-chart-title" }, "Walls by grade"), /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 180 }, /* @__PURE__ */ React.createElement(BarChart, { data: gradeData, margin: { top: 8, right: 4, left: -18, bottom: 0 } }, /* @__PURE__ */ React.createElement(CartesianGrid, { vertical: false, stroke: "var(--line)", strokeDasharray: "3 4" }), /* @__PURE__ */ React.createElement(XAxis, { dataKey: "grade", interval: 0, ...axis }), /* @__PURE__ */ React.createElement(YAxis, { allowDecimals: false, width: 30, ...axis }), /* @__PURE__ */ React.createElement(Tooltip, { ...tip, formatter: (v) => [v, "walls"] }), /* @__PURE__ */ React.createElement(Bar, { dataKey: "count", radius: [7, 7, 2, 2], maxBarSize: 34 }, gradeData.map((d, i) => /* @__PURE__ */ React.createElement(Cell, { key: i, fill: d.color })))))), /* @__PURE__ */ React.createElement("div", { className: "cl-chart-block" }, /* @__PURE__ */ React.createElement("p", { className: "cl-chart-title" }, "Last 6 months"), /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 150 }, /* @__PURE__ */ React.createElement(AreaChart, { data: monthData, margin: { top: 8, right: 8, left: -18, bottom: 0 } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "clAreaFill", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#C4501F", stopOpacity: 0.35 }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#C4501F", stopOpacity: 0 }))), /* @__PURE__ */ React.createElement(CartesianGrid, { vertical: false, stroke: "var(--line)", strokeDasharray: "3 4" }), /* @__PURE__ */ React.createElement(XAxis, { dataKey: "month", ...axis }), /* @__PURE__ */ React.createElement(YAxis, { allowDecimals: false, width: 30, ...axis }), /* @__PURE__ */ React.createElement(Tooltip, { ...tip, cursor: { stroke: "var(--line)" }, formatter: (v) => [v, "walls"] }), /* @__PURE__ */ React.createElement(Area, { type: "monotone", dataKey: "count", stroke: "#C4501F", strokeWidth: 2.5, fill: "url(#clAreaFill)", dot: { r: 3.5, fill: "#C4501F", strokeWidth: 0 }, activeDot: { r: 5 } }))))));
}
function wallsFromEntry(entry, updateFilter) {
  const ups = (entry.updates || []).filter((u) => !updateFilter || updateFilter(u));
  if (ups.length === 0) return [];
  if (entry.postType === "project") {
    let best = null, bestScore = -Infinity, anySent = false, sentStyle;
    ups.forEach((u) => (u.climbs || []).forEach((c) => {
      if (!c.type) return;
      if (c.status === "sent") { anySent = true; if ((SEND_STYLE_RANK[c.style] || 0) > (SEND_STYLE_RANK[sentStyle] || 0)) sentStyle = c.style; }
      const sc = (c.status === "sent" ? 1e3 : 0) + gradeRank(c.type, c.grade);
      if (sc > bestScore) { bestScore = sc; best = c; }
    }));
    return best ? [{ type: best.type, grade: best.grade, sent: anySent, style: sentStyle }] : [];
  }
  const out = [];
  ups.forEach((u) => (u.climbs || []).forEach((c) => { if (c.type) out.push({ type: c.type, grade: c.grade, sent: c.status === "sent", style: c.status === "sent" ? c.style : void 0 }); }));
  return out;
}
function computeTrends(mine) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const weekStart = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const days = /* @__PURE__ */ new Set();
  const monthStats = {};
  const mk = (d) => `${d.getFullYear()}-${d.getMonth()}`;
  let hardestBoulder = null, hardestRoute = null;
  mine.forEach((l) => {
    if (l.kind !== "climb") return;
    const monthKeys = /* @__PURE__ */ new Set((l.updates || []).map((u) => mk(new Date(u.timestamp))));
    monthKeys.forEach((k) => {
      const m = monthStats[k] || (monthStats[k] = { days: /* @__PURE__ */ new Set(), climbs: 0, minutes: 0, attempts: 0, projects: 0 });
      m.projects += wallsFromEntry(l, (u) => mk(new Date(u.timestamp)) === k).length;
    });
    (l.updates || []).forEach((u) => {
      const d = new Date(u.timestamp);
      days.add(dayKey(d));
      const k = mk(d);
      const m = monthStats[k] || (monthStats[k] = { days: /* @__PURE__ */ new Set(), climbs: 0, minutes: 0, attempts: 0, projects: 0 });
      m.attempts += updateAttempts(u);
      m.days.add(dayKey(d));
      m.minutes += Number(u.minutes) || 0;
      m.climbs += (u.climbs || []).length;
      if (d.getFullYear() === now.getFullYear()) {
        (u.climbs || []).forEach((c) => {
          if (c.status !== "sent" || !c.type) return;
          if (c.type === "boulder") { if (!hardestBoulder || gradeRank("boulder", c.grade) > gradeRank("boulder", hardestBoulder)) hardestBoulder = c.grade; }
          else if (c.type === "toprope" || c.type === "lead") { if (!hardestRoute || gradeRank("toprope", c.grade) > gradeRank("toprope", hardestRoute)) hardestRoute = c.grade; }
        });
      }
    });
  });
  const weeks = /* @__PURE__ */ new Set();
  days.forEach((k) => { const [y, mo, da] = k.split("-").map(Number); weeks.add(dayKey(weekStart(new Date(y, mo - 1, da)))); });
  let streak = 0;
  const cur = weekStart(now);
  if (!weeks.has(dayKey(cur))) cur.setDate(cur.getDate() - 7);
  while (weeks.has(dayKey(cur))) { streak++; cur.setDate(cur.getDate() - 7); }
  const thisM = monthStats[mk(now)] || { days: /* @__PURE__ */ new Set(), climbs: 0, minutes: 0, attempts: 0, projects: 0 };
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastM = monthStats[mk(prev)] || { days: /* @__PURE__ */ new Set(), climbs: 0, minutes: 0, attempts: 0, projects: 0 };
  return { sessions: thisM.days.size, lastSessions: lastM.days.size, climbs: thisM.climbs, projects: thisM.projects, attempts: thisM.attempts, minutes: thisM.minutes, streak, hardestBoulder, hardestRoute };
}
function computeStats(mine) {
  let totalClimbs = 0, totalSent = 0, totalMinutes = 0, flashCount = 0, onsightCount = 0;
  const counts = { boulder: 0, toprope: 0, lead: 0, other: 0 };
  const minutesByType = { boulder: 0, toprope: 0, lead: 0, other: 0 };
  mine.forEach((l) => {
    if (l.kind !== "climb") return;
    (l.updates || []).forEach((u) => {
      totalMinutes += Number(u.minutes) || 0;
      const perClimbMinutes = (u.climbs || []).length ? (Number(u.minutes) || 0) / u.climbs.length : 0;
      (u.climbs || []).forEach((c) => { minutesByType[c.type] = (minutesByType[c.type] || 0) + perClimbMinutes; });
    });
    wallsFromEntry(l).forEach((w) => {
      totalClimbs++;
      if (w.sent) totalSent++;
      if (w.style === "flash") flashCount++;
      if (w.style === "onsight") onsightCount++;
      counts[w.type] = (counts[w.type] || 0) + 1;
    });
  });
  return {
    totalTries: totalClimbs,
    totalSent,
    flashCount,
    onsightCount,
    totalMinutes,
    boulderCount: counts.boulder,
    topropeCount: counts.toprope,
    leadCount: counts.lead,
    otherCount: counts.other,
    minutesByType,
    boulderRank: hardestSentRank(["boulder"], mine),
    routeRank: hardestSentRank(["toprope", "lead"], mine)
  };
}
function computeBadges(stats) {
  return BADGE_DEFS.map((b) => ({ ...b, earned: b.test(stats) }));
}
function bestInCategory(prefix, computedBadges) {
  const items = computedBadges.filter((b) => b.id.startsWith(prefix));
  const earnedItems = items.filter((b) => b.earned);
  if (earnedItems.length > 0) return earnedItems[earnedItems.length - 1];
  return items[0];
}
function computeDisplayBadges(stats) {
  const all = computeBadges(stats);
  return [bestInCategory("boulder-", all), bestInCategory("route-", all), bestInCategory("hours-", all), bestInCategory("finish-", all)].filter(Boolean);
}
function formatDuration(mins) {
  const m = Number(mins) || 0;
  if (m <= 0) return null;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}min`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}min`;
}
function summarizeClimbs(climbs) {
  return (climbs || []).map((c) => `${TYPE_LABELS[c.type]} ${c.type === "boulder" ? boulderLabel(c.grade) : c.grade} (${STATUS_LABELS[c.status]})`).join(", ");
}
function normalizeClimbEntry(e) {
  if (!e || e.kind !== "climb") return e;
  const ups = e.updates || [];
  const hasPts = (p) => p && ((p.start && (Array.isArray(p.start) ? p.start.length : 1)) || (p.end && (Array.isArray(p.end) ? p.end.length : 1)) || (p.fall && p.fall.length));
  if (!e.photo) {
    const withPhoto = [...ups].reverse().find((u) => u.photo);
    if (withPhoto) return { ...e, photo: withPhoto.photo, points: e.points || withPhoto.points || null };
  }
  if (e.photo && !hasPts(e.points)) {
    const withPts = [...ups].reverse().find((u) => hasPts(u.points));
    if (withPts) return { ...e, points: withPts.points };
  }
  return e;
}
function bestUpdate(updates) {
  if (!updates || updates.length === 0) return { climbs: [] };
  const sentOnes = updates.filter((u) => (u.climbs || []).some((c) => c.status === "sent"));
  if (sentOnes.length > 0) return sentOnes[sentOnes.length - 1];
  return updates[updates.length - 1];
}
function updateAttempts(u) {
  if (u.attemptLog && u.attemptLog.length) return u.attemptLog.length;
  const cs = u.climbs || [];
  if (cs.length === 0) return 1;
  return cs.reduce((n, c) => n + (Number(c.attempts) > 0 ? Number(c.attempts) : 1), 0);
}
function computeEntryTotals(updates) {
  const list = updates || [];
  let totalMinutes = 0, totalTries = 0, sentCount = 0;
  list.forEach((u) => {
    totalMinutes += Number(u.minutes) || 0;
    totalTries += updateAttempts(u);
    if ((u.climbs || []).some((c) => c.status === "sent")) sentCount++;
  });
  return { totalMinutes, totalTries, sentCount, logCount: list.length };
}
function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1e3);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}
function climbingDuration(monthStr) {
  if (!monthStr) return null;
  const [y, m] = monthStr.split("-").map(Number);
  const now = /* @__PURE__ */ new Date();
  let months = (now.getFullYear() - y) * 12 + (now.getMonth() - (m - 1));
  if (months < 0) months = 0;
  const yrs = Math.floor(months / 12);
  const mos = months % 12;
  if (yrs === 0) return `${mos}mo`;
  if (mos === 0) return `${yrs}y`;
  return `${yrs}y ${mos}mo`;
}
function formatDayHeader(ts) {
  const d = new Date(ts);
  const today = /* @__PURE__ */ new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  const opts = { weekday: "short", month: "short", day: "numeric" };
  if (d.getFullYear() !== today.getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString(void 0, opts);
}
function groupRecordsByDay(entries) {
  const groups = [];
  let lastKey = null;
  entries.forEach((entry) => {
    const best = bestUpdate(entry.updates);
    const ts = best.timestamp || entry.createdAt;
    const key = new Date(ts).toDateString();
    if (key !== lastKey) {
      groups.push({ label: formatDayHeader(ts), items: [], dateKey: key, ts });
      lastKey = key;
    }
    groups[groups.length - 1].items.push(entry);
  });
  return groups;
}
function resolveEntryTimestamp(entryDate) {
  if (!entryDate) return Date.now();
  const now = /* @__PURE__ */ new Date();
  const [y, m, d] = entryDate.split("-").map(Number);
  if (!y || !m || !d) return Date.now();
  const dt = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return dt.getTime();
}
function formatDateBadge(dateStr) {
  if (!dateStr) return { day: "\u2013", mon: "" };
  const d = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
  return { day: d.getDate(), mon: d.toLocaleDateString(void 0, { month: "short" }) };
}
function formatDateLong(dateStr) {
  if (!dateStr) return "";
  const d = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(void 0, { weekday: "short", day: "numeric", month: "short" });
}
function isFriend(a, b) {
  if (!a || !b) return false;
  return (a.following || []).includes(b.slug) && (b.following || []).includes(a.slug);
}
function isBlockedEitherWay(a, b) {
  if (!a || !b) return false;
  return (a.blocked || []).includes(b.slug) || (b.blocked || []).includes(a.slug);
}
function followerSlugsFor(targetSlug, allProfiles) {
  return Object.values(allProfiles).filter((p) => (p.following || []).includes(targetSlug)).map((p) => p.slug);
}
async function safeGet(key, shared) {
  try {
    const r = await window.storage.get(key, shared);
    return r ? r.value : null;
  } catch {
    return null;
  }
}
async function safeSet(key, value, shared) {
  try {
    await window.storage.set(key, value, shared);
    return true;
  } catch (err) {
    console.error("Chalkline: failed to save", key, err);
    return false;
  }
}
async function safeList(prefix, shared) {
  try {
    const r = await window.storage.list(prefix, shared);
    return r ? r.keys : [];
  } catch {
    return [];
  }
}
function resizeImage(file, maxWidth = 900, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function Avatar({ name, photo, size = 40 }) {
  if (photo) {
    return /* @__PURE__ */ React.createElement("img", { src: photo, alt: name || "", className: "cl-avatar-img", style: { width: size, height: size } });
  }
  const initials = (name || "?").trim().slice(0, 2).toUpperCase();
  return /* @__PURE__ */ React.createElement("div", { className: "cl-avatar", style: { width: size, height: size, fontSize: size * 0.38 } }, initials);
}
function ClickableIdentity({ name, photo, size, onClick, sub }) {
  return /* @__PURE__ */ React.createElement("button", { className: "cl-identity", onClick }, /* @__PURE__ */ React.createElement(Avatar, { name, photo, size }), /* @__PURE__ */ React.createElement("span", { className: "cl-identity-text" }, /* @__PURE__ */ React.createElement("span", { className: "cl-identity-name" }, name), sub && /* @__PURE__ */ React.createElement("span", { className: "cl-identity-sub" }, sub)));
}
function PhotoAddButtons({ onFile, idBase, changeLabel }) {
  return /* @__PURE__ */ React.createElement("div", { className: "cl-photo-add-row" }, /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*", capture: "environment", onChange: onFile, className: "cl-file-hidden", id: `${idBase}-cam` }), /* @__PURE__ */ React.createElement("label", { htmlFor: `${idBase}-cam`, className: "cl-photo-btn" }, /* @__PURE__ */ React.createElement(Camera, { size: 16 }), " ", changeLabel ? "Retake" : "Camera"), /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*", onChange: onFile, className: "cl-file-hidden", id: `${idBase}-gal` }), /* @__PURE__ */ React.createElement("label", { htmlFor: `${idBase}-gal`, className: "cl-photo-btn" }, /* @__PURE__ */ React.createElement(Images, { size: 16 }), " ", changeLabel ? "Change" : "Gallery"));
}
function PhotoPicker({ value, onChange, idSuffix, label = "Add a profile pic" }) {
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onChange(await resizeImage(f, 400, 0.7));
    e.target.value = "";
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(PhotoAddButtons, { onFile, idBase: `photo-${idSuffix}`, changeLabel: !!value }), value && /* @__PURE__ */ React.createElement("img", { src: value, alt: "preview", className: "cl-photo-preview cl-photo-preview-round" }));
}
function GradeChip({ type, grade, label, status }) {
  const StatusIcon = status === "sent" ? CheckCircle2 : status === "trying" ? Hourglass : null;
  if (!grade || grade === "NA") {
    return /* @__PURE__ */ React.createElement("span", { className: "cl-chip cl-chip-na" }, label || TYPE_LABELS[type], ": N/A");
  }
  const displayGrade = type === "boulder" ? boulderLabel(grade) : usGrade(grade);
  return /* @__PURE__ */ React.createElement("span", { className: "cl-chip", style: { borderColor: gradeColor(type, grade) }, title: type !== "boulder" ? `French ${grade}` : grade }, /* @__PURE__ */ React.createElement("span", { className: "cl-chip-dot", style: { background: gradeColor(type, grade) } }), label || TYPE_LABELS[type], " ", displayGrade, StatusIcon && /* @__PURE__ */ React.createElement(StatusIcon, { size: 11 }));
}
function ConfirmButton({ onConfirm, icon, title, label = "Delete" }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return /* @__PURE__ */ React.createElement("span", { className: "cl-confirm-inline" }, /* @__PURE__ */ React.createElement("button", { className: "cl-confirm-yes", onClick: () => {
      setConfirming(false);
      onConfirm();
    } }, label, "?"), /* @__PURE__ */ React.createElement("button", { className: "cl-confirm-no", onClick: () => setConfirming(false) }, /* @__PURE__ */ React.createElement(X, { size: 12 })));
  }
  return /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", title, onClick: () => setConfirming(true) }, icon);
}
function TechniqueGuideLink() {
  const [open, setOpen] = useState(false);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { type: "button", className: "cl-tech-link", onClick: () => setOpen(true) }, "Not sure what these mean? See the drawings"), open && /* @__PURE__ */ React.createElement(TechniqueSheet, { id: "heel-hook", onClose: () => setOpen(false) }));
}
function TagEditor({ options, selected, setSelected, allowCustom = true, placeholder, iconMap }) {
  const [val, setVal] = useState("");
  const toggle = (opt) => {
    setSelected(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]);
  };
  const addCustom = () => {
    if (val.trim() && !selected.includes(val.trim())) setSelected([...selected, val.trim()]);
    setVal("");
  };
  const customTags = selected.filter((s) => !options.includes(s));
  const Icon = (opt) => iconMap && iconMap[opt] || iconMap && GraduationCap;
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "cl-qual-row" }, options.map((opt) => {
    const Ic = iconMap ? iconMap[opt] || GraduationCap : null;
    return /* @__PURE__ */ React.createElement("button", { key: opt, type: "button", className: selected.includes(opt) ? "cl-qual-chip active" : "cl-qual-chip", onClick: () => toggle(opt) }, Ic && /* @__PURE__ */ React.createElement(Ic, { size: 12 }), " ", opt, " ", selected.includes(opt) && /* @__PURE__ */ React.createElement(Check, { size: 12 }));
  }), customTags.map((opt) => /* @__PURE__ */ React.createElement("button", { key: opt, type: "button", className: "cl-qual-chip active", onClick: () => toggle(opt) }, iconMap && /* @__PURE__ */ React.createElement(GraduationCap, { size: 12 }), " ", opt, " ", /* @__PURE__ */ React.createElement(Check, { size: 12 })))), allowCustom && /* @__PURE__ */ React.createElement("div", { className: "cl-inline-add" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "cl-input",
      placeholder,
      value: val,
      onChange: (e) => setVal(e.target.value),
      onKeyDown: (e) => e.key === "Enter" && addCustom()
    }
  ), /* @__PURE__ */ React.createElement("button", { type: "button", className: "cl-btn-ghost", onClick: addCustom }, /* @__PURE__ */ React.createElement(Plus, { size: 16 }))));
}
function IconControls({ onSearch, onFilter, onAdd, searchOn, filterOn, leftLabel, onLeftAction, leftActionIcon }) {
  return /* @__PURE__ */ React.createElement("div", { className: "cl-icon-controls" }, leftLabel ? /* @__PURE__ */ React.createElement("div", { className: "cl-icon-controls-label" }, /* @__PURE__ */ React.createElement("span", { className: "cl-day-header", style: { margin: 0 } }, leftLabel), onLeftAction && /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", title: "Share", onClick: onLeftAction }, leftActionIcon || /* @__PURE__ */ React.createElement(Share2, { size: 14 }))) : /* @__PURE__ */ React.createElement("div", { className: "cl-controls-spacer" }), onSearch && /* @__PURE__ */ React.createElement("button", { className: searchOn ? "cl-icon-btn active" : "cl-icon-btn", title: "Search", onClick: onSearch }, /* @__PURE__ */ React.createElement(Search, { size: 18 })), onFilter && /* @__PURE__ */ React.createElement("button", { className: filterOn ? "cl-icon-btn active" : "cl-icon-btn", title: "Filter", onClick: onFilter }, /* @__PURE__ */ React.createElement(Filter, { size: 18 })), onAdd && /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn cl-add-btn", title: "Add", onClick: onAdd }, /* @__PURE__ */ React.createElement(Plus, { size: 20 })));
}
function TypeSelector({ value, onChange, disabled }) {
  return /* @__PURE__ */ React.createElement("div", { className: "cl-type-grid" }, TYPES.map((t) => {
    const Icon = TYPE_ICONS[t];
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: t,
        type: "button",
        disabled,
        title: TYPE_LABELS[t],
        className: value === t ? "cl-type-btn active" : "cl-type-btn",
        onClick: () => !disabled && onChange(t)
      },
      /* @__PURE__ */ React.createElement(Icon, { size: 16 }),
      " ",
      /* @__PURE__ */ React.createElement("span", null, TYPE_LABELS[t])
    );
  }));
}
function GradeSelector({ type, grade, onChange, disabled }) {
  const options = gradeOptionsFor(type);
  if (!options) {
    return /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: grade, onChange: (e) => onChange(e.target.value), disabled, placeholder: "Describe it (optional)" });
  }
  return /* @__PURE__ */ React.createElement("div", { className: "cl-grade-grid" }, options.map((g) => {
    const color = gradeColor(type, g);
    const active = grade === g;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: g,
        type: "button",
        disabled,
        title: type !== "boulder" ? `French ${g}` : boulderOptionLabel(g),
        className: active ? "cl-grade-swatch active" : "cl-grade-swatch",
        style: { borderColor: color, background: active ? color : "transparent", color: active ? "#fff" : "var(--ink)" },
        onClick: () => !disabled && onChange(g)
      },
      type === "boulder" ? boulderLabel(g) : usGrade(g)
    );
  }));
}
function StatusSelector({ value, onChange, type, style, onStyle }) {
  const styles = type === "boulder" ? ["flash", "redpoint"] : ["onsight", "flash", "redpoint"];
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "cl-status-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: value === "sent" ? "cl-status-pick sent active" : "cl-status-pick sent", onClick: () => onChange("sent") }, /* @__PURE__ */ React.createElement(CheckCircle2, { size: 16 }), " Sent"), /* @__PURE__ */ React.createElement("button", { type: "button", className: value === "trying" ? "cl-status-pick trying active" : "cl-status-pick trying", onClick: () => onChange("trying") }, /* @__PURE__ */ React.createElement(Hourglass, { size: 16 }), " Trying")), value === "sent" && onStyle && /* @__PURE__ */ React.createElement("div", { className: "cl-style-row" }, /* @__PURE__ */ React.createElement("span", { className: "cl-style-caption" }, "How?"), styles.map((st) => /* @__PURE__ */ React.createElement("button", { key: st, type: "button", className: style === st ? "cl-style-chip active" : "cl-style-chip", onClick: () => onStyle(style === st ? void 0 : st) }, sendStyleLabel(type, st)))));
}
function ClimbRow({ climb, onChange, onRemove, locked, attemptsLocked }) {
  const n = Number(climb.attempts) > 0 ? Number(climb.attempts) : 1;
  const setN = (v) => onChange({ ...climb, attempts: Math.max(1, Math.min(99, v)) });
  return /* @__PURE__ */ React.createElement("div", { className: "cl-climb-row" }, /* @__PURE__ */ React.createElement("div", { className: "cl-climb-row-top" }, /* @__PURE__ */ React.createElement(TypeSelector, { value: climb.type, onChange: (t) => onChange({ ...climb, type: t, style: void 0, grade: gradeOptionsFor(t) ? gradeOptionsFor(t)[0] : "" }), disabled: locked }), onRemove && /* @__PURE__ */ React.createElement("button", { type: "button", className: "cl-icon-btn", onClick: onRemove }, /* @__PURE__ */ React.createElement(Trash2, { size: 14 }))), /* @__PURE__ */ React.createElement(GradeSelector, { type: climb.type, grade: climb.grade, onChange: (g) => onChange({ ...climb, grade: g }), disabled: locked }), /* @__PURE__ */ React.createElement(StatusSelector, { value: climb.status, type: climb.type, style: climb.style, onChange: (st) => onChange({ ...climb, status: st, style: st === "sent" ? climb.style : void 0 }), onStyle: (st) => onChange({ ...climb, style: st }) }), !attemptsLocked && /* @__PURE__ */ React.createElement("div", { className: "cl-attempts-row" }, /* @__PURE__ */ React.createElement("span", { className: "cl-style-caption" }, "Attempts"), /* @__PURE__ */ React.createElement("div", { className: "cl-stepper" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setN(n - 1), "aria-label": "Fewer attempts" }, "\u2212"), /* @__PURE__ */ React.createElement("b", null, n), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setN(n + 1), "aria-label": "More attempts" }, "+"))));
}
function ScrollPicker({ value, onChange, max, step = 1, label }) {
  const ref = useRef();
  const timeoutRef = useRef();
  const itemHeight = 36;
  const options = [];
  for (let i = 0; i <= max; i += step) options.push(i);
  useEffect(() => {
    const idx = options.indexOf(Number(value) || 0);
    if (ref.current && idx >= 0) ref.current.scrollTop = idx * itemHeight;
  }, []);
  const commitScroll = () => {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollTop / itemHeight);
    const val = options[Math.max(0, Math.min(options.length - 1, idx))];
    if (val !== void 0) onChange(val);
  };
  const onScroll = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(commitScroll, 120);
  };
  const selectValue = (v) => {
    onChange(v);
    const idx = options.indexOf(v);
    if (ref.current && idx >= 0) ref.current.scrollTo({ top: idx * itemHeight, behavior: "smooth" });
  };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-scroll-picker-wrap" }, /* @__PURE__ */ React.createElement("div", { className: "cl-scroll-picker-highlight" }), /* @__PURE__ */ React.createElement("div", { className: "cl-scroll-picker", ref, onScroll }, /* @__PURE__ */ React.createElement("div", { style: { height: itemHeight } }), options.map((o) => /* @__PURE__ */ React.createElement("div", { key: o, className: Number(value) === o ? "cl-scroll-picker-item active" : "cl-scroll-picker-item", onClick: () => selectValue(o) }, String(o).padStart(2, "0"))), /* @__PURE__ */ React.createElement("div", { style: { height: itemHeight } })), /* @__PURE__ */ React.createElement("span", { className: "cl-scroll-picker-label" }, label));
}
function DurationInput({ hours, minutes, setHours, setMinutes }) {
  return /* @__PURE__ */ React.createElement("div", { className: "cl-duration-row" }, /* @__PURE__ */ React.createElement(ScrollPicker, { value: Number(hours) || 0, onChange: (v) => setHours(String(v)), max: 12, step: 1, label: "hr" }), /* @__PURE__ */ React.createElement(ScrollPicker, { value: Number(minutes) || 0, onChange: (v) => setMinutes(String(v)), max: 59, step: 1, label: "min" }));
}
function Onboarding({ onCreate, onResume, checkingSlug, authedUid }) {
  const [mode, setMode] = useState(authedUid ? "finish-profile" : "choice");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [photo, setPhoto] = useState(null);
  const [since, setSince] = useState("");
  const [boulder, setBoulder] = useState("V0");
  const [route, setRoute] = useState("NA");
  const [qualifications, setQualifications] = useState([]);
  const [mainGym, setMainGym] = useState(GYM_OPTIONS[0]);
  const [stepError, setStepError] = useState("");
  const TOTAL_STEPS = 6;
  const next = () => {
    if (step === 0) {
      if (!name.trim()) {
        setStepError("Tell us what to call you.");
        return;
      }
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (cleanUsername.length < 3) {
        setStepError("Pick a username with at least 3 letters/numbers.");
        return;
      }
      if (!authedUid) {
        if (!email.trim() || !email.includes("@")) {
          setStepError("Enter a valid email.");
          return;
        }
        if (!password || password.length < 6) {
          setStepError("Pick a password with at least 6 characters.");
          return;
        }
        if (password !== password2) {
          setStepError("Passwords don't match.");
          return;
        }
      }
    }
    setStepError("");
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else finish();
  };
  const back = () => {
    if (step > 0) {
      setStep(step - 1);
      return;
    }
    if (!authedUid) setMode("choice");
  };
  const finish = async () => {
    setStepError("");
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (authedUid) {
      await onCreate({ uid: authedUid, name: name.trim(), username: cleanUsername, photo, since, boulder, route, qualifications, mainGym });
      return;
    }
    const { data, error } = await window.supabaseAuth.signUp(email.trim(), password);
    if (error) {
      setStepError(error.message);
      return;
    }
    if (data && data.session && data.user) {
      await onCreate({ uid: data.user.id, name: name.trim(), username: cleanUsername, photo, since, boulder, route, qualifications, mainGym });
    } else {
      setStepError("Account created \u2014 check your email to confirm it, then log in.");
    }
  };
  const attemptLogin = async () => {
    setLoginError("");
    setLoggingIn(true);
    const { data, error } = await window.supabaseAuth.signIn(loginEmail.trim(), loginPassword);
    setLoggingIn(false);
    if (error) {
      setLoginError(error.message);
      return;
    }
    const uid2 = data && data.user && data.user.id;
    if (uid2) onResume(uid2);
  };
  if (mode === "choice") {
    return /* @__PURE__ */ React.createElement("div", { className: "cl-onboard" }, /* @__PURE__ */ React.createElement("div", { className: "cl-onboard-card" }, /* @__PURE__ */ React.createElement(Mountain, { size: 30, strokeWidth: 2.2 }), /* @__PURE__ */ React.createElement("h1", null, "Chalkline"), /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, "Your climbing tag, log, and crew \u2014 in one place."), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary cl-full", onClick: () => setMode("login") }, "Log in"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost cl-full", style: { marginTop: 8 }, onClick: () => setMode("signup") }, "Sign up")));
  }
  if (mode === "login") {
    return /* @__PURE__ */ React.createElement("div", { className: "cl-onboard" }, /* @__PURE__ */ React.createElement("div", { className: "cl-onboard-card" }, /* @__PURE__ */ React.createElement(Mountain, { size: 30, strokeWidth: 2.2 }), /* @__PURE__ */ React.createElement("h1", null, "Log in"), /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, "Welcome back."), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Email"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", type: "email", value: loginEmail, onChange: (e) => setLoginEmail(e.target.value), autoFocus: true, placeholder: "you@example.com" }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Password"), /* @__PURE__ */ React.createElement(
      "input",
      {
        className: "cl-input",
        type: "password",
        value: loginPassword,
        onChange: (e) => setLoginPassword(e.target.value),
        onKeyDown: (e) => e.key === "Enter" && attemptLogin(),
        placeholder: "Password"
      }
    ), loginError && /* @__PURE__ */ React.createElement("p", { className: "cl-error" }, loginError), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: attemptLogin, disabled: loggingIn }, loggingIn ? "Logging in\u2026" : "Log in"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost cl-full", style: { marginTop: 8 }, onClick: () => setMode("choice") }, "Back")));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "cl-onboard" }, /* @__PURE__ */ React.createElement("div", { className: "cl-onboard-card" }, /* @__PURE__ */ React.createElement("div", { className: "cl-step-dots" }, Array.from({ length: TOTAL_STEPS }).map((_, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: i === step ? "cl-dot active" : "cl-dot" }))), step === 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Mountain, { size: 26, strokeWidth: 2.2 }), /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 24 } }, authedUid ? "Finish your tag" : "Welcome"), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "What should we call you on the wall?"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g. Aiman" }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Pick a username"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: username, onChange: (e) => setUsername(e.target.value), placeholder: "e.g. aiman_climbs" }), /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "This is your short, shareable ID \u2014 letters, numbers, and underscores only."), !authedUid && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Email"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@example.com" }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Password"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "At least 6 characters" }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Confirm password"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", type: "password", value: password2, onChange: (e) => setPassword2(e.target.value), placeholder: "Type it again" }))), step === 1 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 22 } }, "Add a photo"), /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, "Optional, but makes you easier to spot in the feed."), /* @__PURE__ */ React.createElement(PhotoPicker, { value: photo, onChange: setPhoto, idSuffix: "signup" }), /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "Photos are resized automatically \u2014 up to about 900px wide, so any size you upload works fine.")), step === 2 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 22 } }, "When did you start?"), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Climbing since"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", type: "month", value: since, onChange: (e) => setSince(e.target.value) })), step === 3 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 22 } }, "Your current level"), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Boulder level"), /* @__PURE__ */ React.createElement("select", { className: "cl-input", value: boulder, onChange: (e) => setBoulder(e.target.value) }, PROFILE_BOULDER_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }, boulderOptionLabel(g)))), /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "Camp5 colour: ", boulderBand(boulder)), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Route level"), /* @__PURE__ */ React.createElement("select", { className: "cl-input", value: route, onChange: (e) => setRoute(e.target.value) }, PROFILE_ROUTE_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }, routeGradeLabel(g)))), /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "French grade (US equivalent)")), step === 4 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 22 } }, "Qualifications"), /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, "Anything you're certified or trained for."), /* @__PURE__ */ React.createElement(
    TagEditor,
    {
      options: QUALIFICATION_PRESETS,
      selected: qualifications,
      setSelected: setQualifications,
      placeholder: "Add your own",
      iconMap: QUALIFICATION_ICONS
    }
  )), step === 5 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 22 } }, "Your main gym"), /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, "We'll use this as the default when you log a climb. Don't see yours? Just type it in."), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: mainGym, onChange: (e) => setMainGym(e.target.value), list: "cl-gyms-wizard", placeholder: "Search or type your gym\u2026" }), /* @__PURE__ */ React.createElement("datalist", { id: "cl-gyms-wizard" }, GYM_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g })))), stepError && /* @__PURE__ */ React.createElement("p", { className: "cl-error" }, stepError), /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons" }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: back }, "Back"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", style: { marginTop: 0 }, onClick: next, disabled: checkingSlug }, step === TOTAL_STEPS - 1 ? checkingSlug ? "Setting up\u2026" : "Create my tag" : "Next"))));
}
function autoTitle(climbs, gym, postType) {
  const c = (climbs || [])[0];
  if (postType === "day") return `Day at ${gym || "the gym"}`;
  if (!c) return "Untitled project";
  const g = c.type === "boulder" ? boulderLabel(c.grade) : usGrade(c.grade);
  return `${TYPE_LABELS[c.type] || "Climb"} ${g}`.trim();
}
function TimeChips({ hours, minutes, setHours, setMinutes }) {
  const total = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
  const set = (m) => { setHours(String(Math.floor(m / 60))); setMinutes(String(m % 60)); };
  const quick = [1, 2, 5, 10, 20, 30, 60];
  return /* @__PURE__ */ React.createElement("div", { className: "cl-timechips" }, quick.map((m) => /* @__PURE__ */ React.createElement("button", { key: m, type: "button", className: total === m ? "cl-timechip active" : "cl-timechip", onClick: () => set(total === m ? 0 : m) }, m >= 60 ? "1h" : `${m}m`)), /* @__PURE__ */ React.createElement("label", { className: "cl-timechip-other" }, /* @__PURE__ */ React.createElement("input", { type: "number", inputMode: "numeric", min: "0", className: "cl-input", placeholder: "min", value: total > 0 ? total : "", onChange: (e) => set(Math.max(0, Math.min(1440, Number(e.target.value) || 0))) })));
}
function QuickEditSheet({ item, onClose, onSave, onDelete, onOpenLog }) {
  const h = React.createElement;
  const c0 = item.update.climbs[0];
  const [type, setType] = useState(c0.type);
  const [grade, setGrade] = useState(c0.grade);
  const [result, setResult] = useState(c0.status !== "sent" ? "trying" : c0.style === "flash" ? "flash" : "sent");
  const [attempts, setAttempts] = useState(c0.attempts || 1);
  const changeType = (t) => { setType(t); const opts = gradeOptionsFor(t); if (opts && !opts.includes(grade)) setGrade(opts[Math.min(2, opts.length - 1)]); };
  const save = () => {
    const climb = { ...c0, type, grade, status: result === "trying" ? "trying" : "sent", attempts: result === "flash" ? 1 : attempts };
    if (result === "flash") climb.style = "flash"; else delete climb.style;
    onSave(item.log.id, item.update.id, climb);
  };
  return h("div", { className: "cl-sheet-backdrop cl-layer-top", onClick: onClose }, h("div", { className: "cl-sheet cl-ql-sheet", onClick: (e) => e.stopPropagation(), role: "dialog", "aria-modal": "true" },
    h("div", { className: "cl-sheet-handle" }),
    h("div", { className: "cl-ql-head" }, h("div", null, h("b", null, "Edit climb"), h("span", { className: "cl-ql-gym" }, item.log.title, " · ", new Date(item.update.timestamp).toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" }))), h("button", { type: "button", className: "cl-icon-btn", onClick: onClose, "aria-label": "Close" }, h(X, { size: 18 }))),
    h(TypeSelector, { value: type, onChange: changeType }),
    h(GradeSelector, { type, grade, onChange: setGrade }),
    h("div", { className: "cl-ql-result" }, [["flash", "Flash", "first try"], ["sent", "Sent", "got it"], ["trying", "Not yet", "still trying"]].map(([v, l, sub]) => h("button", { key: v, type: "button", className: result === v ? `cl-ql-res active ${v}` : "cl-ql-res", onClick: () => setResult(v) }, h("b", null, l), h("small", null, sub)))),
    result !== "flash" && h("div", { className: "cl-ql-row" }, h("span", null, "Tries"), h("div", { className: "cl-stepper" }, h("button", { type: "button", onClick: () => setAttempts(Math.max(1, attempts - 1)), "aria-label": "Fewer tries" }, "−"), h("b", null, attempts), h("button", { type: "button", onClick: () => setAttempts(attempts + 1), "aria-label": "More tries" }, "+"))),
    h("div", { className: "cl-ql-actions" }, h(ConfirmButton, { onConfirm: () => onDelete(item.log.id, item.update.id), icon: h(Trash2, { size: 14 }), label: "Delete", confirmLabel: "Really delete?" }), h("button", { type: "button", className: "cl-btn-primary", style: { marginTop: 0 }, onClick: save }, "Save")),
    h("button", { type: "button", className: "cl-ql-link", onClick: () => onOpenLog(item.log) }, "Add photo, beta or notes ›")));
}
function QuickLogSheet({ me, logs, session, gymDefault, onClose, onLog, onAddTry, onLogged, onUndo, onEditItem, onPatch, onFull, onPost }) {
  const h = React.createElement;
  const read = (k, d) => { try { return localStorage.getItem("chalkline_ql_" + k) || d; } catch { return d; } };
  const [page, setPage] = useState("grade");
  const [type, setType] = useState(read("type", "boulder"));
  const [grade, setGrade] = useState(read("grade", "V2"));
  const [attempts, setAttempts] = useState(1);
  const [gym, setGym] = useState(session ? session.gym : read("gym", gymDefault || GYM_OPTIONS[0]));
  const [editGym, setEditGym] = useState(false);
  const [project, setProject] = useState(null);
  const [done, setDone] = useState(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const today = new Date().toDateString();
  const mine = logs.filter((l) => l.authorSlug === me && l.kind === "climb");
  const recent = mine.filter((l) => l.postType === "project" && Date.now() - (l.updatedAt || l.createdAt || 0) < 60 * 864e5).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 12);
  const todays = mine.flatMap((l) => (l.updates || []).filter((u) => u.climbs && u.climbs[0] && new Date(u.timestamp).toDateString() === today).map((u) => ({ log: l, update: u }))).sort((a, b) => b.update.timestamp - a.update.timestamp);
  const gl = (c) => c.type === "boulder" ? boulderLabel(c.grade) : usGrade(c.grade);
  const options = gradeOptionsFor(type);
  const pickGrade = (g) => { setGrade(g); setProject(null); setAttempts(1); setPage("result"); };
  const pickProject = (l) => {
    const last = (l.updates || [])[l.updates.length - 1];
    const c = last && last.climbs && last.climbs[0];
    setProject(l);
    if (c) { setType(c.type); setGrade(c.grade); }
    setGym(l.gym || gym);
    setAttempts(1);
    setPage("result");
  };
  const save = async (result) => {
    if (busy) return;
    setBusy(true); setFailed(false);
    const climb = { type, grade, status: result === "trying" ? "trying" : "sent", attempts: result === "flash" ? 1 : attempts };
    if (result === "flash") climb.style = "flash";
    const minutes = session && session.lastAt ? Math.max(0, Math.round((Date.now() - session.lastAt) / 6e4)) : 0;
    try {
      const ref = project ? await onAddTry(project.id, { note: "", minutes, climbs: [climb], extra: {} }) : await onLog({ postType: "project", title: name.trim(), gym, privacy: "public", climbs: [climb], note: "", photo: null, minutes, extra: void 0 });
      try { localStorage.setItem("chalkline_ql_type", type); localStorage.setItem("chalkline_ql_grade", grade); localStorage.setItem("chalkline_ql_gym", gym); } catch {}
      const delta = { attempts: climb.attempts, sent: climb.status === "sent" ? 1 : 0, gym };
      onLogged(delta);
      setDone({ msg: `${gl(climb)} · ${result === "flash" ? "flashed" : result === "sent" ? `sent in ${climb.attempts} ${climb.attempts === 1 ? "try" : "tries"}` : `${climb.attempts} ${climb.attempts === 1 ? "try" : "tries"} so far`}`, result, ref, delta, photo: null, linked: !!project });
      setPage("done");
    } catch { setFailed(true); }
    setBusy(false);
  };
  const undo = async () => { const d = done; if (d && d.ref) await onUndo(d.ref, d.delta); setDone(null); setName(""); setProject(null); setPage("grade"); };
  const next = () => { setDone(null); setName(""); setProject(null); setAttempts(1); setPage("grade"); };
  const addPhoto = async (e) => { const f = e.target.files && e.target.files[0]; if (!f || !done || !done.ref) return; const img = await resizeImage(f, 1200, 0.85); await onPatch(done.ref.logId, { photo: img }); setDone({ ...done, photo: img }); e.target.value = ""; };
  const saveName = async () => { if (!name.trim() || !done || !done.ref) return; await onPatch(done.ref.logId, { title: name.trim() }); setDone({ ...done, named: name.trim() }); };
  const titles = { grade: "Log a climb", wall: "Same wall as before", result: "How did it go?", done: "Logged", today: "Today" };
  const back = page === "wall" || page === "today" ? "grade" : page === "result" ? "grade" : null;
  const head = h("div", { className: "cl-qp-head" },
    back ? h("button", { type: "button", className: "cl-icon-btn", onClick: () => setPage(back), "aria-label": "Back" }, h(ArrowLeft, { size: 20 })) : h("span", { style: { width: 32 } }),
    h("b", null, titles[page]),
    h("button", { type: "button", className: "cl-icon-btn", onClick: onClose, "aria-label": "Close" }, h(X, { size: 18 })));
  const chip = h("button", { type: "button", className: "cl-qp-chip", onClick: () => setPage("grade") }, h("b", { style: { background: gradeColor(type, grade) } }, gl({ type, grade })), project ? project.title : TYPE_LABELS[type], " · ", gym);
  let body;
  if (page === "grade") {
    body = h(React.Fragment, null,
      editGym ? h("input", { className: "cl-input cl-ql-gyminput", value: gym, list: "cl-gyms-ql", autoFocus: true, onChange: (e) => setGym(e.target.value), onBlur: () => setEditGym(false) }) : h("button", { type: "button", className: "cl-ql-gym", onClick: () => setEditGym(true) }, h(MapPin, { size: 12 }), " ", gym, " ✎"),
      h("datalist", { id: "cl-gyms-ql" }, GYM_OPTIONS.map((g) => h("option", { key: g, value: g }))),
      h("div", { className: "cl-qp-types" }, TYPES.map((t) => h("button", { key: t, type: "button", className: type === t ? "active" : "", onClick: () => { setType(t); const o = gradeOptionsFor(t); if (o && !o.includes(grade)) setGrade(o[Math.min(2, o.length - 1)]); } }, TYPE_LABELS[t]))),
      h("p", { className: "cl-ql-cap" }, "Grade — tap to continue"),
      options ? h("div", { className: "cl-qp-grades" }, options.map((g) => h("button", { key: g, type: "button", className: grade === g ? "active" : "", style: { borderColor: gradeColor(type, g), background: grade === g ? gradeColor(type, g) : void 0 }, onClick: () => pickGrade(g) }, type === "boulder" ? boulderLabel(g) : usGrade(g))))
        : h("div", { className: "cl-qp-other" }, h("input", { className: "cl-input", value: grade, onChange: (e) => setGrade(e.target.value), placeholder: "Describe it (optional)" }), h("button", { type: "button", className: "cl-btn-primary", style: { marginTop: 0 }, onClick: () => pickGrade(grade) }, "Next")),
      h("div", { className: "cl-qp-links" },
        recent.length > 0 && h("button", { type: "button", onClick: () => setPage("wall") }, h(Link2, { size: 16 }), " Same wall as before ", h("em", null, "›")),
        todays.length > 0 && h("button", { type: "button", onClick: () => setPage("today") }, h(Check, { size: 16 }), " Today · ", todays.length, " logged — fix ", h("em", null, "›")),
        h("button", { type: "button", onClick: onFull }, h(Layers, { size: 16 }), " Full log — photo, beta, notes ", h("em", null, "›")),
        h("button", { type: "button", onClick: onPost }, h(Camera, { size: 16 }), " New post ", h("em", null, "›"))));
  } else if (page === "wall") {
    body = h("div", { className: "cl-qp-list" }, recent.map((l) => { const c = ((l.updates || [])[l.updates.length - 1] || {}).climbs; const c0 = c && c[0]; return h("button", { key: l.id, type: "button", onClick: () => pickProject(l) }, l.photo ? h("img", { src: l.photo, alt: "" }) : h("span", { className: "cl-qp-badge", style: c0 ? { background: gradeColor(c0.type, c0.grade) } : void 0 }, c0 ? gl(c0) : "—"), h("span", { className: "cl-qp-lt" }, h("b", null, l.title), h("small", null, l.gym, " · ", new Date(l.updatedAt || l.createdAt).toLocaleDateString(void 0, { month: "short", day: "numeric" }))), h("em", null, "›")); }));
  } else if (page === "today") {
    body = h("div", { className: "cl-qp-list" }, todays.map((it) => { const c = it.update.climbs[0]; return h("button", { key: it.update.id, type: "button", onClick: () => onEditItem(it) }, h("span", { className: "cl-qp-badge", style: { background: gradeColor(c.type, c.grade) } }, gl(c)), h("span", { className: "cl-qp-lt" }, h("b", null, it.log.title), h("small", null, new Date(it.update.timestamp).toLocaleTimeString(void 0, { hour: "numeric", minute: "2-digit" }), " · ", c.status === "sent" ? (c.style === "flash" ? "flash" : `sent in ${c.attempts || 1}`) : `${c.attempts || 1} tries, not yet`)), h("em", null, "Edit ›")); }));
  } else if (page === "result") {
    body = h(React.Fragment, null, chip,
      h("div", { className: "cl-qp-tries" }, h("span", null, "Tries so far"), h("button", { type: "button", onClick: () => setAttempts(Math.max(1, attempts - 1)), "aria-label": "Fewer tries" }, "−"), h("b", null, attempts), h("button", { type: "button", onClick: () => setAttempts(attempts + 1), "aria-label": "More tries" }, "+")),
      h("div", { className: "cl-qp-results" }, [["flash", "Flash", "first try"], ["sent", "Sent", "topped it"], ["trying", "Not yet", "still working on it"]].map(([v, l, sub]) => h("button", { key: v, type: "button", className: `cl-qp-res ${v}`, disabled: busy, onClick: () => save(v) }, h("b", null, l), h("small", null, sub)))),
      failed && h("p", { className: "cl-hint", style: { color: "var(--danger, #e5484d)", textAlign: "center" } }, "Couldn't save — try again"),
      !project && h("input", { className: "cl-input", value: name, onChange: (e) => setName(e.target.value), placeholder: "Name or colour (optional) — e.g. orange slab" }));
  } else {
    body = h(React.Fragment, null,
      h("div", { className: "cl-qp-done" }, h("span", null, h(Check, { size: 34 })), h("b", null, done ? done.msg : ""), session && h("small", null, "Session · ", session.n, session.n === 1 ? " problem" : " problems", " · ", session.sent, " sent")),
      h("button", { type: "button", className: "cl-btn-primary cl-qp-next", onClick: next }, "Log next climb"),
      h("div", { className: "cl-qp-after" },
        h("input", { type: "file", accept: "image/*", id: "cl-qp-photo", className: "cl-file-hidden", onChange: addPhoto }),
        done && done.photo ? h("span", { className: "cl-qp-photook" }, h("img", { src: done.photo, alt: "" }), " Photo added — build the beta from the log") : h("label", { htmlFor: "cl-qp-photo", className: "cl-qp-act" }, h(Camera, { size: 18 }), " Add a wall photo"),
        done && !done.linked && !done.named && h("div", { className: "cl-qp-namerow" }, h("input", { className: "cl-input", value: name, onChange: (e) => setName(e.target.value), placeholder: "Name it, e.g. orange slab" }), h("button", { type: "button", className: "cl-btn-ghost", onClick: saveName, disabled: !name.trim() }, "Save")),
        done && done.named && h("p", { className: "cl-hint" }, "Named “", done.named, "”"),
        h("button", { type: "button", className: "cl-qp-act", onClick: undo }, h(Undo2, { size: 18 }), " Undo this log"),
        h("button", { type: "button", className: "cl-qp-act muted", onClick: onClose }, "Done for now")));
  }
  return h("div", { className: "cl-sheet-backdrop", onClick: onClose }, h("div", { className: "cl-sheet cl-qp-sheet", onClick: (e) => e.stopPropagation(), role: "dialog", "aria-modal": "true" }, head, h("div", { className: "cl-qp-body" }, body)));
}
function LogForm({ initial, onCancel, onSave, saveLabel = "Save to log" }) {
  const [postType, setPostType] = useState(initial.postType || "project");
  const [title, setTitle] = useState(initial.title || "");
  const [gym, setGym] = useState(initial.gym || GYM_OPTIONS[0]);
  const [climbRows, setClimbRows] = useState(initial.climbs || [{ type: "boulder", grade: "VB", status: "trying" }]);
  const [note, setNote] = useState(initial.note || "");
  const [photo, setPhoto] = useState(initial.photo || null);
  const [points, setPoints] = useState(() => normalizePoints(initial.points));
  const [technique, setTechnique] = useState(initial.technique || []);
  const [satisfaction, setSatisfaction] = useState(initial.satisfaction || 0);
  const [beta, setBeta] = useState(initial.beta || null);
  const [moreOpen, setMoreOpen] = useState(!!(initial.editLog && (initial.note || (initial.technique && initial.technique.length) || initial.satisfaction || initial.nextTime || initial.wall || initial.goal)));
  const [wall, setWall] = useState(initial.wall || "");
  const [goal, setGoal] = useState(initial.goal || "");
  const [nextTime, setNextTime] = useState(initial.nextTime || "");
  const [hours, setHours] = useState(initial.minutes ? String(Math.floor(initial.minutes / 60)) : "");
  const [minutes, setMinutes] = useState(initial.minutes ? String(initial.minutes % 60) : "");
  const [entryDate, setEntryDate] = useState(() => {
    const d = initial.timestamp ? new Date(initial.timestamp) : /* @__PURE__ */ new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [privacy, setPrivacy] = useState(initial.privacy || "public");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const locked = !!initial.lockClimb;
  const showGymTitle = !initial.lockPost;
  const showTitleGym = showGymTitle || !!initial.editLog;
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(await resizeImage(f));
    e.target.value = "";
  };
  const updateRow = (i, next) => setClimbRows((rows) => rows.map((r, idx) => idx === i ? next : r));
  const addRow = () => setClimbRows((rows) => [...rows, { type: "boulder", grade: "VB", status: "trying" }]);
  const removeRow = (i) => setClimbRows((rows) => rows.filter((_, idx) => idx !== i));
  const submit = async () => {
    setError("");
    setSaving(true);
    const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
    const hasPoints = points.start.length > 0 || points.end.length > 0 || points.fall.length > 0;
    const extra = {};
    if (hasPoints) extra.points = points;
    if (technique.length > 0) extra.technique = technique;
    if (satisfaction > 0) extra.satisfaction = satisfaction;
    if (nextTime.trim()) extra.nextTime = nextTime.trim();
    if (hasBeta(beta)) extra.beta = beta;
    await onSave({
      wall: wall.trim(),
      goal: goal.trim(),
      postType,
      title: title.trim(),
      gym,
      privacy,
      climbs: climbRows,
      note: note.trim(),
      photo,
      minutes: totalMinutes,
      entryDate,
      extra: Object.keys(extra).length > 0 ? extra : void 0
    });
    setSaving(false);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-card cl-form-card" }, showTitleGym && /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, showGymTitle && /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Post type"), showGymTitle && /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, /* @__PURE__ */ React.createElement("button", { className: postType === "project" ? "cl-toggle active" : "cl-toggle", onClick: () => setPostType("project") }, /* @__PURE__ */ React.createElement(Layers, { size: 14 }), " One wall / project"), /* @__PURE__ */ React.createElement("button", { className: postType === "day" ? "cl-toggle active" : "cl-toggle", onClick: () => {
    setPostType("day");
    if (climbRows.length < 1) addRow();
  } }, /* @__PURE__ */ React.createElement(CalendarRange, { size: 14 }), " Full day log")), postType === "project" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Name (optional)"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "e.g. Blue arete by the window" })), postType === "day" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Title (optional)"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: title, onChange: (e) => setTitle(e.target.value), placeholder: `Day at ${gym}` })), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Gym or crag"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: gym, onChange: (e) => setGym(e.target.value), list: "cl-gyms" }), /* @__PURE__ */ React.createElement("datalist", { id: "cl-gyms" }, GYM_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }))), moreOpen && postType === "project" && React.createElement(React.Fragment, null, React.createElement("label", { className: "cl-label" }, "Wall or section (optional)"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: wall, onChange: (e) => setWall(e.target.value), placeholder: "e.g. Cave, north wall" }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Goal (optional)"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: goal, onChange: (e) => setGoal(e.target.value), placeholder: "e.g. Send by December" }))), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, postType === "day" ? "Climbs done" : "Climb"), climbRows.map((c, i) => /* @__PURE__ */ React.createElement(
    ClimbRow,
    {
      key: i,
      climb: c,
      onChange: (next) => updateRow(i, next),
      onRemove: postType === "day" && climbRows.length > 1 ? () => removeRow(i) : null,
      locked,
      attemptsLocked: !!initial.hasAttemptLog
    }
  )), postType === "day" && /* @__PURE__ */ React.createElement("button", { type: "button", className: "cl-btn-ghost cl-full", style: { marginTop: 6 }, onClick: addRow }, /* @__PURE__ */ React.createElement(Plus, { size: 14, style: { marginRight: 4 } }), " Add another climb")), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Date"), /* @__PURE__ */ React.createElement("input", { type: "date", className: "cl-input", value: entryDate, max: (() => {
    const d = /* @__PURE__ */ new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })(), onChange: (e) => setEntryDate(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Time spent (optional)"), React.createElement(TimeChips, { hours, minutes, setHours, setMinutes })), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, React.createElement("p", { className: "cl-section-caption" }, "Photo (optional \u2014 add it later if you like)"), photo && React.createElement("img", { src: photo, alt: "", className: "cl-form-photo" }), React.createElement(PhotoAddButtons, { onFile, idBase: `photo-log-${initial.formId || "new"}`, changeLabel: !!photo }), photo && React.createElement(BetaField, { photo, beta, onChange: setBeta })), React.createElement("button", { type: "button", className: "cl-more-toggle", onClick: () => setMoreOpen((v) => !v) }, moreOpen ? "Hide details" : "More details \u2014 notes, technique, rating, goal"), moreOpen && React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Notes"), /* @__PURE__ */ React.createElement("textarea", { className: "cl-input cl-textarea", placeholder: "Beta, how it felt, what to try next\u2026", value: note, onChange: (e) => setNote(e.target.value) }), /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption", style: { marginTop: 14 } }, "Next time try (optional)"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: nextTime, onChange: (e) => setNextTime(e.target.value), placeholder: "e.g. Left heel hook on move 3" })), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Technique used (optional)"), /* @__PURE__ */ React.createElement(TagEditor, { options: TECHNIQUE_PRESETS, selected: technique, setSelected: setTechnique, placeholder: "Add your own" }), React.createElement(TechniqueGuideLink, null), /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption", style: { marginTop: 14 } }, "How satisfied are you? (optional)"), /* @__PURE__ */ React.createElement(StarRating, { value: satisfaction, onChange: setSatisfaction })), ), showGymTitle && /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Who can see this?"), /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, /* @__PURE__ */ React.createElement("button", { className: privacy === "public" ? "cl-toggle active" : "cl-toggle", onClick: () => setPrivacy("public") }, /* @__PURE__ */ React.createElement(Globe, { size: 13 }), " Public"), /* @__PURE__ */ React.createElement("button", { className: privacy === "private" ? "cl-toggle active" : "cl-toggle", onClick: () => setPrivacy("private") }, /* @__PURE__ */ React.createElement(Lock, { size: 13 }), " Private"))), error && /* @__PURE__ */ React.createElement("p", { className: "cl-error" }, error), React.createElement("div", { className: "cl-row-buttons cl-form-bar" }, React.createElement("button", { className: "cl-btn-ghost", onClick: onCancel }, "Cancel"), React.createElement("button", { className: "cl-btn-primary", onClick: submit, disabled: saving }, saving ? "Saving\u2026" : saveLabel)));
}
function SameWallPicker({ logs, linked, onPick }) {
  const [open, setOpen] = useState(false);
  const list = (logs || []).filter((l) => l.kind === "climb" && l.postType === "project").sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 15);
  if (!list.length) return null;
  const fmt = (l) => new Date(l.updatedAt || l.createdAt).toLocaleDateString(void 0, { month: "short", day: "numeric" });
  const tries = (l) => (l.updates || []).reduce((n, u) => n + (u.climbs || []).reduce((m, c) => m + (c.attempts || 1), 0), 0);
  if (linked) return React.createElement("div", { className: "cl-samewall linked" }, React.createElement(Link2, { size: 15 }), React.createElement("span", null, "Counts as a new attempt on ", React.createElement("b", null, linked.title), " (same wall)"), React.createElement("button", { type: "button", onClick: () => onPick(null) }, "Unlink"));
  return React.createElement("div", { className: "cl-samewall" }, React.createElement("button", { type: "button", className: "cl-samewall-toggle", onClick: () => setOpen(!open) }, React.createElement(Link2, { size: 15 }), " Same wall as a previous log?", React.createElement(ChevronDown, { size: 15, style: { marginLeft: "auto", transform: open ? "rotate(180deg)" : "none" } })), open && React.createElement("div", { className: "cl-attach-log-list" }, list.map((l) => React.createElement("button", { key: l.id, type: "button", className: "cl-attach-log-row", onClick: () => { onPick(l); setOpen(false); } }, l.photo ? React.createElement("img", { src: l.photo, alt: "", className: "cl-attach-log-thumb" }) : React.createElement("div", { className: "cl-attach-log-thumb cl-attach-log-thumb-empty" }, React.createElement(Mountain, { size: 16 })), React.createElement("div", { className: "cl-attach-log-info" }, React.createElement("span", { className: "cl-attach-log-title" }, l.title), React.createElement("span", { className: "cl-attach-log-meta" }, l.gym, " \u00B7 ", fmt(l), " \u00B7 ", tries(l), " tries"))))));
}
function NewPostForm({ defaultGym, logs, onCancel, onSaveLog, onAddTry }) {
  const [linked, setLinked] = useState(null);
  const last = linked && (linked.updates || [])[linked.updates.length - 1];
  const lc = last && last.climbs && last.climbs[0];
  const initial = linked ? { gym: linked.gym, title: linked.title, wall: linked.wall, photo: linked.photo, ...lc ? { climbs: [{ ...lc, status: "trying", attempts: 1 }] } : {} } : { gym: defaultGym };
  return React.createElement(React.Fragment, null, React.createElement(SameWallPicker, { logs, linked, onPick: setLinked }), React.createElement(LogForm, { key: linked ? linked.id : "new", initial, onCancel, onSave: (data) => linked ? onAddTry(linked.id, { ...data, photo: void 0 }) : onSaveLog(data) }));
}
function GearEditor({ gear, setGear }) {
  const [val, setVal] = useState("");
  const add = () => {
    if (val.trim()) {
      setGear([...gear, val.trim()]);
      setVal("");
    }
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "cl-gear-row" }, gear.map((g, i) => /* @__PURE__ */ React.createElement("span", { className: "cl-gear-pill", key: i }, g, /* @__PURE__ */ React.createElement("button", { onClick: () => setGear(gear.filter((_, idx) => idx !== i)) }, /* @__PURE__ */ React.createElement(X, { size: 12 }))))), /* @__PURE__ */ React.createElement("div", { className: "cl-inline-add" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "cl-input",
      placeholder: "Add gear",
      value: val,
      onChange: (e) => setVal(e.target.value),
      onKeyDown: (e) => e.key === "Enter" && add()
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: add }, /* @__PURE__ */ React.createElement(Plus, { size: 16 }))));
}
function WallLogCard({ entry, profile, comments, me, defaultGym, onComment, onKudo, onDelete, onAddTry, onTogglePrivacy, onToggleSave, onOpenProfile, onEnlarge, onLiveLog, onShare, hideLogActions }) {
  const [text, setText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [addingTry, setAddingTry] = useState(false);
  const kudos = entry.kudos || [];
  const kudoed = kudos.includes(me);
  const saved = (entry.savedBy || []).includes(me);
  const isMine = entry.authorSlug === me;
  const updates = entry.updates || [];
  const latest = updates[updates.length - 1] || { climbs: [] };
  const history = updates.slice(0, -1).reverse();
  const overallStatus = (latest.climbs || []).some((c) => c.status === "sent") ? "sent" : "trying";
  const submitComment = async () => {
    if (!text.trim()) return;
    await onComment(entry.id, text.trim());
    setText("");
  };
  const tryInitial = entry.postType === "project" ? { lockClimb: true, lockPost: true, climbs: [{ ...latest.climbs[0], attempts: 1, style: void 0 }], formId: entry.id, photo: entry.photo, points: entry.points, beta: entry.beta } : { lockClimb: false, lockPost: true, climbs: [{ type: "boulder", grade: "VB", status: "trying" }], formId: entry.id, photo: entry.photo, points: entry.points, beta: entry.beta };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-card" }, /* @__PURE__ */ React.createElement("div", { className: "cl-card-head" }, /* @__PURE__ */ React.createElement(
    ClickableIdentity,
    {
      name: profile?.name || entry.authorName,
      photo: profile?.photo,
      size: 34,
      onClick: () => onOpenProfile(entry.authorSlug),
      sub: `${entry.gym} \xB7 ${timeAgo(latest.timestamp || entry.createdAt)}`
    }
  ), /* @__PURE__ */ React.createElement("span", { className: `cl-status cl-status-${overallStatus}` }, overallStatus === "sent" ? sentLabel(updates.flatMap((u) => u.climbs || [])) : STATUS_LABELS[overallStatus]), isMine && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => onTogglePrivacy(entry.id), title: entry.privacy === "private" ? "Private \u2014 tap to make public" : "Public \u2014 tap to make private" }, entry.privacy === "private" ? /* @__PURE__ */ React.createElement(Lock, { size: 14 }) : /* @__PURE__ */ React.createElement(Globe, { size: 14 })), /* @__PURE__ */ React.createElement(ConfirmButton, { onConfirm: () => onDelete(entry.id), icon: /* @__PURE__ */ React.createElement(Trash2, { size: 14 }), title: "Delete log" }))), entry.photo && /* @__PURE__ */ React.createElement("div", { className: "cl-photo-wrap", onClick: () => onEnlarge(entry.photo, entry.points) }, /* @__PURE__ */ React.createElement("img", { src: entry.photo, alt: "climb", className: "cl-photo-full" }), /* @__PURE__ */ React.createElement("span", { className: "cl-enlarge-hint" }, /* @__PURE__ */ React.createElement(Maximize2, { size: 13 }))), /* @__PURE__ */ React.createElement("div", { className: "cl-ig-actions" }, /* @__PURE__ */ React.createElement("button", { className: kudoed ? "cl-ig-icon active" : "cl-ig-icon", onClick: () => onKudo(entry.id), title: "Nice" }, /* @__PURE__ */ React.createElement(Heart, { size: 22, fill: kudoed ? "currentColor" : "none" })), /* @__PURE__ */ React.createElement("button", { className: "cl-ig-icon", onClick: () => setShowComments((v) => !v), title: "Comment" }, /* @__PURE__ */ React.createElement(MessageCircle, { size: 22 })), /* @__PURE__ */ React.createElement("button", { className: "cl-ig-icon", onClick: () => onShare(entry), title: "Share" }, /* @__PURE__ */ React.createElement(Share2, { size: 22 })), /* @__PURE__ */ React.createElement("div", { className: "cl-controls-spacer" })), kudos.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-ig-likes" }, kudos.length, " ", kudos.length === 1 ? "like" : "likes"), /* @__PURE__ */ React.createElement("div", { className: "cl-card-body" }, /* @__PURE__ */ React.createElement("p", { className: "cl-ig-caption" }, /* @__PURE__ */ React.createElement("b", null, profile?.name || entry.authorName), " ", entry.title || "Untitled", latest.note ? ` \u2014 ${latest.note}` : ""), /* @__PURE__ */ React.createElement("div", { className: "cl-chip-row", style: { marginTop: 6 } }, (latest.climbs || []).map((c, i) => /* @__PURE__ */ React.createElement(GradeChip, { key: i, type: c.type, grade: c.grade, status: c.status })), latest.minutes > 0 && /* @__PURE__ */ React.createElement("span", { className: "cl-chip cl-chip-na" }, /* @__PURE__ */ React.createElement(Clock, { size: 11 }), " ", formatDuration(latest.minutes))), updates.length > 1 && /* @__PURE__ */ React.createElement("button", { className: "cl-history-toggle", onClick: () => setShowHistory((v) => !v) }, /* @__PURE__ */ React.createElement(ChevronDown, { size: 13, style: { transform: showHistory ? "rotate(180deg)" : "none" } }), updates.length, " entries logged on this one"), showHistory && /* @__PURE__ */ React.createElement("div", { className: "cl-timeline" }, history.map((u) => /* @__PURE__ */ React.createElement("div", { className: "cl-timeline-item", key: u.id }, /* @__PURE__ */ React.createElement("span", { className: "cl-timeline-note" }, /* @__PURE__ */ React.createElement("b", null, summarizeClimbs(u.climbs)), u.note ? ` \u2014 ${u.note}` : "", u.minutes > 0 ? ` \xB7 ${formatDuration(u.minutes)}` : ""), /* @__PURE__ */ React.createElement("span", { className: "cl-timeline-time" }, timeAgo(u.timestamp))))), !showComments && /* @__PURE__ */ React.createElement("button", { className: "cl-ig-viewcomments", onClick: () => setShowComments(true) }, comments.length > 0 ? `View all ${comments.length} comment${comments.length === 1 ? "" : "s"}` : "Add a comment\u2026"), showComments && /* @__PURE__ */ React.createElement("div", { className: "cl-comments" }, comments.map((c, i) => /* @__PURE__ */ React.createElement("div", { className: "cl-comment", key: i }, /* @__PURE__ */ React.createElement("b", null, c.authorName), " ", c.text)), /* @__PURE__ */ React.createElement("div", { className: "cl-comment-input" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "cl-input",
      placeholder: "Say something\u2026",
      value: text,
      onChange: (e) => setText(e.target.value),
      onKeyDown: (e) => e.key === "Enter" && submitComment()
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: submitComment }, /* @__PURE__ */ React.createElement(Send, { size: 15 })))), /* @__PURE__ */ React.createElement("p", { className: "cl-ig-timestamp" }, timeAgo(latest.timestamp || entry.createdAt))), isMine && !hideLogActions && /* @__PURE__ */ React.createElement("div", { className: "cl-ig-utility" }, !addingTry && /* @__PURE__ */ React.createElement("button", { className: "cl-kudo-btn", onClick: () => setAddingTry(true) }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), " Log another entry"), entry.postType === "project" && entry.kind !== "deal" && /* @__PURE__ */ React.createElement("button", { className: "cl-kudo-btn", onClick: () => onLiveLog(entry) }, /* @__PURE__ */ React.createElement(Zap, { size: 14 }), " Live log")), addingTry && !hideLogActions && /* @__PURE__ */ React.createElement(
    LogForm,
    {
      initial: tryInitial,
      saveLabel: "Save entry",
      onCancel: () => setAddingTry(false),
      onSave: async (data) => {
        await onAddTry(entry.id, { note: data.note, photo: data.photo, minutes: data.minutes, climbs: data.climbs, entryDate: data.entryDate, extra: data.extra });
        setAddingTry(false);
      }
    }
  ));
}
function PostCard(props) {
  if (props.entry.kind === "post") return /* @__PURE__ */ React.createElement(SocialPostCard, { ...props });
  return /* @__PURE__ */ React.createElement(WallLogCard, { ...props });
}
function RecordRow({ entry, onOpen }) {
  const updates = entry.updates || [];
  const best = bestUpdate(updates);
  const totals = computeEntryTotals(updates);
  const overallStatus = updates.some((u) => (u.climbs || []).some((c) => c.status === "sent")) ? "sent" : "trying";
  const primaryClimb = (best.climbs || [])[0];
  const Icon = primaryClimb ? TYPE_ICONS[primaryClimb.type] : Mountain;
  const iconColor = primaryClimb ? gradeColor(primaryClimb.type, primaryClimb.grade) : "#8A8578";
  return /* @__PURE__ */ React.createElement("button", { className: "cl-lrow", onClick: () => onOpen(entry) }, entry.photo ? /* @__PURE__ */ React.createElement("img", { src: entry.photo, alt: "", className: "cl-lrow-media" }) : /* @__PURE__ */ React.createElement("div", { className: "cl-lrow-media cl-lrow-media-empty", style: { background: iconColor } }, /* @__PURE__ */ React.createElement(Icon, { size: 26, color: "#fff" })), /* @__PURE__ */ React.createElement("div", { className: "cl-lrow-body" }, /* @__PURE__ */ React.createElement("div", { className: "cl-lrow-top" }, /* @__PURE__ */ React.createElement("span", { className: "cl-lrow-title" }, entry.title || "Untitled"), /* @__PURE__ */ React.createElement("span", { className: `cl-status cl-status-${overallStatus}` }, overallStatus === "sent" ? sentLabel(updates.flatMap((u) => u.climbs || [])) : STATUS_LABELS[overallStatus])), /* @__PURE__ */ React.createElement("div", { className: "cl-lrow-mid" }, (best.climbs || []).slice(0, 2).map((c, i) => /* @__PURE__ */ React.createElement(GradeChip, { key: i, type: c.type, grade: c.grade }))), /* @__PURE__ */ React.createElement("div", { className: "cl-lrow-stats cl-lrow-meta" }, [totals.totalMinutes > 0 ? formatDuration(totals.totalMinutes) : null, `${totals.totalTries} ${totals.totalTries === 1 ? "try" : "tries"}`, entry.gym].filter(Boolean).join("  \u00B7  "))));
}
function RecordGridItem({ entry, onOpen }) {
  const updates = entry.updates || [];
  const best = bestUpdate(updates);
  const totals = computeEntryTotals(updates);
  const overallStatus = (best.climbs || []).some((c) => c.status === "sent") ? "sent" : "trying";
  const primaryClimb = (best.climbs || [])[0];
  const Icon = primaryClimb ? TYPE_ICONS[primaryClimb.type] : Mountain;
  const iconColor = primaryClimb ? gradeColor(primaryClimb.type, primaryClimb.grade) : "#8A8578";
  return /* @__PURE__ */ React.createElement("button", { className: "cl-record-grid-item", onClick: () => onOpen(entry) }, entry.photo ? /* @__PURE__ */ React.createElement("img", { src: entry.photo, alt: "", className: "cl-record-grid-photo" }) : /* @__PURE__ */ React.createElement("div", { className: "cl-record-grid-photo cl-record-grid-photo-empty", style: { background: iconColor } }, /* @__PURE__ */ React.createElement(Icon, { size: 28, color: "#fff" })), /* @__PURE__ */ React.createElement("div", { className: "cl-record-grid-overlay" }, /* @__PURE__ */ React.createElement("span", { className: `cl-status cl-status-${overallStatus}` }, overallStatus === "sent" ? sentLabel(updates.flatMap((u) => u.climbs || [])) : STATUS_LABELS[overallStatus])), /* @__PURE__ */ React.createElement("div", { className: "cl-record-grid-info" }, /* @__PURE__ */ React.createElement("div", { className: "cl-record-grid-title" }, entry.title || "Untitled"), /* @__PURE__ */ React.createElement("div", { className: "cl-chip-row", style: { marginTop: 3 } }, (best.climbs || []).slice(0, 1).map((c, i) => /* @__PURE__ */ React.createElement(GradeChip, { key: i, type: c.type, grade: c.grade }))), /* @__PURE__ */ React.createElement("div", { className: "cl-record-grid-stats" }, totals.totalMinutes > 0 && /* @__PURE__ */ React.createElement("span", null, formatDuration(totals.totalMinutes)), /* @__PURE__ */ React.createElement("span", null, totals.totalTries, " tries"))));
}
function computeDaySummary(allLogs, me, targetDate) {
  const target = targetDate ? new Date(targetDate) : /* @__PURE__ */ new Date();
  const targetStr = target.toDateString();
  const isToday = targetStr === (/* @__PURE__ */ new Date()).toDateString();
  const mine = allLogs.filter((l) => l.authorSlug === me && l.kind === "climb");
  const onDay = (u) => new Date(u.timestamp).toDateString() === targetStr;
  let best = null, bestScore = -1;
  let totalMinutes = 0, totalClimbs = 0, totalSent = 0, totalAttempts = 0;
  const byType = {}, byGrade = {};
  const entries = [];
  const gymCounts = {};
  mine.forEach((l) => {
    const dayUpdates = (l.updates || []).filter(onDay);
    if (dayUpdates.length === 0) return;
    dayUpdates.forEach((u) => { totalMinutes += Number(u.minutes) || 0; totalAttempts += updateAttempts(u); });
    if (l.gym) gymCounts[l.gym] = (gymCounts[l.gym] || 0) + dayUpdates.length;
    const ws = wallsFromEntry(l, onDay);
    let sentThatDay = false;
    ws.forEach((c) => {
      totalClimbs++;
      if (c.sent) { totalSent++; sentThatDay = true; }
      byType[c.type] = (byType[c.type] || 0) + 1;
      const gradeText = c.type === "boulder" ? boulderLabel(c.grade) : usGrade(c.grade);
      const gKey = `${c.type}|${c.grade}`;
      if (!byGrade[gKey]) byGrade[gKey] = { type: c.type, grade: c.grade, label: `${TYPE_LABELS[c.type]} ${gradeText}`, count: 0 };
      byGrade[gKey].count++;
      const score = (c.sent ? 1e3 : 0) + gradeRank(c.type, c.grade);
      if (score > bestScore) {
        bestScore = score;
        best = { entry: l, type: c.type, grade: c.grade, gradeText, sent: c.sent };
      }
    });
    entries.push({ entry: l, sentThatDay, walls: ws.length });
  });
  const typeBreakdown = TYPES.filter((t) => byType[t] > 0).map((t) => ({ type: t, label: TYPE_LABELS[t], count: byType[t] }));
  const gradeBreakdown = Object.values(byGrade).sort((a, b) => b.count - a.count || gradeRank(b.type, b.grade) - gradeRank(a.type, a.grade));
  const bestClimbLabel = best ? `${best.entry.title ? best.entry.title + " \u2014 " : ""}${TYPE_LABELS[best.type]} ${best.gradeText}${best.sent ? " \u2014 Sent" : ""}` : "";
  const dateLabel = target.toLocaleDateString(void 0, isToday ? { weekday: "long", month: "short", day: "numeric" } : { weekday: "long", month: "short", day: "numeric", year: "numeric" });
  const gym = Object.keys(gymCounts).sort((a, b) => gymCounts[b] - gymCounts[a]).slice(0, 2).join(" & ");
  return { target, targetStr, isToday, gym, best, bestClimbLabel, totalClimbs, totalSent, totalAttempts, totalMinutes, typeBreakdown, gradeBreakdown, entries, dateLabel };
}
function DayConclusionModal({ targetDate, logs, me, onClose, onShareDay, onOpenLogDetail, readOnly }) {
  const d = computeDaySummary(logs, me, targetDate);
  const best = d.best;
  const bestIcon = best ? TYPE_ICONS[best.type] : Mountain;
  const bestColor = best ? gradeColor(best.type, best.grade) : "#8A8578";
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay cl-layer-day" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose, "aria-label": "Back" }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, d.dateLabel), readOnly ? React.createElement("div", { style: { width: 40 } }) : /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn cl-icon-btn-boxed", onClick: () => onShareDay(d.target.getTime()), "aria-label": "Share this day" }, /* @__PURE__ */ React.createElement(Share2, { size: 18 }))), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body" }, d.entries.length === 0 ? /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "Nothing was logged on this day.") : /* @__PURE__ */ React.createElement(React.Fragment, null, best && /* @__PURE__ */ React.createElement("button", { className: "cl-day-best", onClick: () => onOpenLogDetail(best.entry) }, best.entry.photo ? /* @__PURE__ */ React.createElement("img", { src: best.entry.photo, alt: "", className: "cl-day-best-photo" }) : /* @__PURE__ */ React.createElement("div", { className: "cl-day-best-photo cl-day-best-photo-empty", style: { background: bestColor } }, React.createElement(bestIcon, { size: 30, color: "#fff" })), /* @__PURE__ */ React.createElement("span", { className: "cl-day-best-badge" }, "Best climb"), /* @__PURE__ */ React.createElement("div", { className: "cl-day-best-info" }, /* @__PURE__ */ React.createElement("div", { className: "cl-day-best-name" }, best.entry.title || "Untitled"), /* @__PURE__ */ React.createElement("div", { className: "cl-chip-row", style: { marginTop: 4 } }, /* @__PURE__ */ React.createElement(GradeChip, { type: best.type, grade: best.grade }), /* @__PURE__ */ React.createElement("span", { className: best.sent ? "cl-status cl-status-sent" : "cl-status cl-status-trying" }, best.sent ? "Sent" : "Trying")), best.entry.gym && /* @__PURE__ */ React.createElement("div", { className: "cl-day-best-gym" }, /* @__PURE__ */ React.createElement(MapPin, { size: 12 }), " ", best.entry.gym))), /* @__PURE__ */ React.createElement("div", { className: "cl-day-stats" }, React.createElement("div", { className: "cl-day-stat" }, React.createElement("b", null, d.totalClimbs), React.createElement("span", null, d.totalClimbs === 1 ? "project" : "projects")), React.createElement("div", { className: "cl-day-stat" }, React.createElement("b", null, d.totalAttempts), React.createElement("span", null, d.totalAttempts === 1 ? "attempt" : "attempts")), /* @__PURE__ */ React.createElement("div", { className: "cl-day-stat" }, /* @__PURE__ */ React.createElement("b", null, formatDuration(d.totalMinutes) || "0min"), /* @__PURE__ */ React.createElement("span", null, "total time")), /* @__PURE__ */ React.createElement("div", { className: "cl-day-stat" }, /* @__PURE__ */ React.createElement("b", null, d.totalSent), /* @__PURE__ */ React.createElement("span", null, "sent"))), d.gradeBreakdown.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption", style: { marginTop: 18 } }, "By grade"), d.gradeBreakdown.map((g) => /* @__PURE__ */ React.createElement("div", { key: g.type + g.grade, className: "cl-day-grade-row" }, /* @__PURE__ */ React.createElement(GradeChip, { type: g.type, grade: g.grade }), /* @__PURE__ */ React.createElement("span", { className: "cl-day-grade-type" }, TYPE_LABELS[g.type]), /* @__PURE__ */ React.createElement("span", { className: "cl-day-grade-count" }, "\xD7", g.count))), /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption", style: { marginTop: 18 } }, "Logs from this day"), d.entries.map(({ entry }) => /* @__PURE__ */ React.createElement(RecordRow, { key: entry.id, entry, onOpen: onOpenLogDetail })))));
}
function BottomSheet({ title, message, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
  return /* @__PURE__ */ React.createElement("div", { className: "cl-sheet-backdrop", onClick: onCancel }, /* @__PURE__ */ React.createElement("div", { className: "cl-sheet", onClick: (e) => e.stopPropagation(), role: "dialog", "aria-modal": "true" }, /* @__PURE__ */ React.createElement("div", { className: "cl-sheet-handle" }), /* @__PURE__ */ React.createElement("p", { className: "cl-sheet-title" }, title), message && /* @__PURE__ */ React.createElement("p", { className: "cl-sheet-message" }, message), /* @__PURE__ */ React.createElement("div", { className: "cl-sheet-buttons" }, /* @__PURE__ */ React.createElement("button", { className: "cl-sheet-btn", onClick: onCancel }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: danger ? "cl-sheet-btn danger" : "cl-sheet-btn primary", onClick: onConfirm }, confirmLabel))));
}
var CLIP_DB = "chalkline-clips";
function openClipDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(CLIP_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("clips");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function clipTx(mode, fn) {
  const d = await openClipDB();
  return new Promise((resolve, reject) => {
    const t = d.transaction("clips", mode);
    const r = fn(t.objectStore("clips"));
    t.oncomplete = () => resolve(r && r.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}
async function saveClip(file) {
  const id = uid();
  await clipTx("readwrite", (st) => st.put(file, id));
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch {}
  return id;
}
const getClip = (id) => clipTx("readonly", (st) => st.get(id));
const deleteClip = (id) => clipTx("readwrite", (st) => st.delete(id));
function formatBytes(n) {
  if (!n) return "";
  return n > 1048576 ? `${(n / 1048576).toFixed(n > 1.04858e8 ? 0 : 1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}
function VideoClips({ update, canEdit, onChange }) {
  const [open, setOpen] = useState(null);
  const [url, setUrl] = useState(null);
  const [missing, setMissing] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const videos = update.videos || [];
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  if (!canEdit) return null;
  const play = async (v) => {
    if (open === v.id) { setOpen(null); setUrl(null); return; }
    try {
      const blob = await getClip(v.id);
      if (!blob) { setMissing((m) => ({ ...m, [v.id]: true })); return; }
      setUrl(URL.createObjectURL(blob));
      setOpen(v.id);
    } catch { setMissing((m) => ({ ...m, [v.id]: true })); }
  };
  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      const id = await saveClip(f);
      await onChange([...videos, { id, name: f.name || "Video", size: f.size, addedAt: Date.now() }]);
    } catch {
      setErr("Couldn't save that video on this device \u2014 storage may be full.");
    }
    setBusy(false);
  };
  const remove = async (v) => {
    try { await deleteClip(v.id); } catch {}
    if (open === v.id) { setOpen(null); setUrl(null); }
    await onChange(videos.filter((x) => x.id !== v.id));
  };
  const inputId = `clip-${update.id}`;
  return /* @__PURE__ */ React.createElement("div", { className: "cl-clips" }, videos.map((v) => /* @__PURE__ */ React.createElement("div", { key: v.id, className: "cl-clip" }, /* @__PURE__ */ React.createElement("div", { className: "cl-clip-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "cl-clip-play", onClick: () => play(v) }, /* @__PURE__ */ React.createElement(Play, { size: 14 }), /* @__PURE__ */ React.createElement("span", null, open === v.id ? "Close video" : "Play video"), /* @__PURE__ */ React.createElement("small", null, formatBytes(v.size))), /* @__PURE__ */ React.createElement(ConfirmButton, { onConfirm: () => remove(v), icon: /* @__PURE__ */ React.createElement(Trash2, { size: 13 }), title: "Remove video" })), missing[v.id] && /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "This video isn't on this device \u2014 it was saved on another phone or the browser data was cleared."), open === v.id && url && /* @__PURE__ */ React.createElement("video", { className: "cl-clip-video", src: url, controls: true, playsInline: true, autoPlay: true }))), /* @__PURE__ */ React.createElement("input", { id: inputId, type: "file", accept: "video/*", className: "cl-file-hidden", onChange: onFile }), /* @__PURE__ */ React.createElement("label", { htmlFor: inputId, className: "cl-clip-add" }, /* @__PURE__ */ React.createElement(VideoIcon, { size: 14 }), busy ? " Saving\u2026" : " Add video"), videos.length === 0 && !err && /* @__PURE__ */ React.createElement("p", { className: "cl-hint", style: { marginTop: 4 } }, "Videos stay on this phone only \u2014 they aren't uploaded."), err && /* @__PURE__ */ React.createElement("p", { className: "cl-error" }, err));
}
function LogDetailModal({ entry, onClose, onEnlarge, me, onDelete, onTogglePrivacy, onAddTry, onEditEntry, onQuickEdit, onUpdateVideos, onLiveLog, onShare, onShareToPost }) {
  const [addingTry, setAddingTry] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const updates = [...entry.updates || []].reverse();
  const isMine = !!me && entry.authorSlug === me;
  const latest = entry.updates[entry.updates.length - 1] || { climbs: [] };
  const totals = computeEntryTotals(entry.updates);
  const pts = normalizePoints(entry.points);
  const hasPoints = pts.start.length > 0 || pts.end.length > 0 || pts.fall.length > 0;
  const tryInitial = entry.postType === "project" ? { lockClimb: true, lockPost: true, climbs: [{ ...latest.climbs[0], attempts: 1, style: void 0 }], formId: entry.id, photo: entry.photo, points: entry.points, beta: entry.beta } : { lockClimb: false, lockPost: true, climbs: [{ type: "boulder", grade: "VB", status: "trying" }], formId: entry.id, photo: entry.photo, points: entry.points, beta: entry.beta };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay cl-layer-log" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }), /* @__PURE__ */ React.createElement("div", { className: "cl-header-actions" }, onShare && /* @__PURE__ */ React.createElement("button", { className: "cl-header-icon", onClick: () => onShare(entry), "aria-label": "Share as picture", title: "Share" }, /* @__PURE__ */ React.createElement(Share2, { size: 17 })), onShareToPost && /* @__PURE__ */ React.createElement("button", { className: "cl-header-icon", onClick: () => onShareToPost(entry), "aria-label": "Share to a post", title: "Post" }, /* @__PURE__ */ React.createElement(Mountain, { size: 17 })), isMine && onTogglePrivacy && /* @__PURE__ */ React.createElement("button", { className: "cl-header-icon", onClick: () => setConfirm("privacy"), "aria-label": entry.privacy === "private" ? "Private — make public" : "Public — make private", title: entry.privacy === "private" ? "Private" : "Public" }, entry.privacy === "private" ? /* @__PURE__ */ React.createElement(Lock, { size: 17 }) : /* @__PURE__ */ React.createElement(Globe, { size: 17 })), isMine && onDelete && /* @__PURE__ */ React.createElement("button", { className: "cl-header-icon danger", onClick: () => setConfirm("delete"), "aria-label": "Delete log", title: "Delete" }, /* @__PURE__ */ React.createElement(Trash2, { size: 17 })))), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body" }, /* @__PURE__ */ React.createElement("div", { className: "cl-log-title-block" }, /* @__PURE__ */ React.createElement("h1", { className: "cl-log-title" }, entry.title || "Untitled"), /* @__PURE__ */ React.createElement("div", { className: "cl-log-title-meta" }, (bestUpdate(entry.updates).climbs || []).slice(0, 2).map((c, i) => /* @__PURE__ */ React.createElement(GradeChip, { key: i, type: c.type, grade: c.grade })), entry.gym && /* @__PURE__ */ React.createElement("span", { className: "cl-record-detail-gym" }, /* @__PURE__ */ React.createElement(MapPin, { size: 13 }), " ", entry.gym, entry.wall ? ` \u00B7 ${entry.wall}` : "")), entry.goal && /* @__PURE__ */ React.createElement("div", { className: "cl-goal-strip" }, /* @__PURE__ */ React.createElement(Flag, { size: 13 }), /* @__PURE__ */ React.createElement("span", null, "Goal: ", entry.goal), (entry.updates || []).some((u) => (u.climbs || []).some((c) => c.status === "sent")) && /* @__PURE__ */ React.createElement("b", null, "Done")), !(entry.updates || []).some((u) => (u.climbs || []).some((c) => c.status === "sent")) && latest.nextTime && /* @__PURE__ */ React.createElement("div", { className: "cl-next-strip" }, /* @__PURE__ */ React.createElement("small", null, "Next time"), /* @__PURE__ */ React.createElement("span", null, latest.nextTime))), isMine && !entry.photo && onEditEntry && React.createElement("button", { type: "button", className: "cl-addphoto", onClick: () => setEditingId(latest.id) }, React.createElement(Camera, { size: 16 }), " Add a photo or build a beta for this climb"), entry.photo && (hasBeta(entry.beta) ? React.createElement(BetaPlayer, { photo: entry.photo, beta: entry.beta, title: entry.title, subtitle: [entry.gym, new Date(entry.updatedAt || Date.now()).toLocaleDateString(void 0, { month: "short", day: "numeric" })].filter(Boolean).join(" \u00B7 "), onShare: onShare ? () => onShare(entry) : null }) : /* @__PURE__ */ React.createElement("div", { className: "cl-log-detail-photo-wrap", onClick: () => onEnlarge(entry.photo, entry.points) }, /* @__PURE__ */ React.createElement("img", { src: entry.photo, alt: "", className: "cl-log-detail-photo", style: { cursor: "zoom-in" } }), hasPoints && pts.start.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `s${i}`, className: "cl-point-marker start", style: { left: `${p.x}%`, top: `${p.y}%` } }, "S")), hasPoints && pts.end.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `e${i}`, className: "cl-point-marker end", style: { left: `${p.x}%`, top: `${p.y}%` } }, "E")), hasPoints && pts.fall.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `f${i}`, className: "cl-point-marker fall", style: { left: `${p.x}%`, top: `${p.y}%` } }, i + 1)))), isMine && onAddTry && !addingTry && /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons cl-log-top-actions" }, React.createElement("button", { className: "cl-btn-primary cl-log-try", onClick: () => setAddingTry(true) }, React.createElement(Plus, { size: 16 }), " Log another try"), entry.postType === "project" && onLiveLog && /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: () => onLiveLog(entry) }, React.createElement(Zap, { size: 14 }), " Live timer")), addingTry && /* @__PURE__ */ React.createElement(LogForm, { initial: tryInitial, saveLabel: "Save entry", onCancel: () => setAddingTry(false), onSave: async (data) => {
    await onAddTry(entry.id, { note: data.note, photo: data.photo, minutes: data.minutes, climbs: data.climbs, entryDate: data.entryDate, extra: data.extra });
    setAddingTry(false);
  } }), /* @__PURE__ */ React.createElement("div", { className: "cl-record-summary" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, totals.logCount), React.createElement("span", null, totals.logCount === 1 ? "session" : "sessions")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, totals.totalTries), /* @__PURE__ */ React.createElement("span", null, "tries")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, totals.sentCount), /* @__PURE__ */ React.createElement("span", null, "sent")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, formatDuration(totals.totalMinutes) || "0min"), /* @__PURE__ */ React.createElement("span", null, "total time"))), /* @__PURE__ */ React.createElement("div", { className: "cl-log-detail-list" }, updates.map((u) => {
    const attemptCount = updateAttempts(u);
    const success = (u.climbs || []).some((c) => c.status === "sent");
    if (editingId === u.id) {
      return /* @__PURE__ */ React.createElement(LogForm, { key: u.id, saveLabel: "Save changes", initial: { editLog: true, lockPost: true, postType: entry.postType, title: entry.title, gym: entry.gym, wall: entry.wall, goal: entry.goal, nextTime: u.nextTime, hasAttemptLog: !!(u.attemptLog && u.attemptLog.length), climbs: (u.climbs || []).map((c) => ({ ...c })), note: u.note, minutes: u.minutes, timestamp: u.timestamp, technique: u.technique, satisfaction: u.satisfaction, formId: `edit-${u.id}`, photo: entry.photo, points: entry.points, beta: entry.beta }, onCancel: () => setEditingId(null), onSave: async (data) => {
        await onEditEntry(entry.id, u.id, data);
        setEditingId(null);
      } });
    }
    return /* @__PURE__ */ React.createElement("div", { className: "cl-log-detail-item", key: u.id }, /* @__PURE__ */ React.createElement("div", { className: "cl-log-detail-row-top" }, /* @__PURE__ */ React.createElement("span", { className: "cl-log-cell-date" }, new Date(u.timestamp).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" })), /* @__PURE__ */ React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 8 } }, isMine && onQuickEdit && u.climbs && u.climbs[0] && React.createElement("button", { className: "cl-chip-btn", onClick: () => onQuickEdit({ log: entry, update: u }), title: "Quick change (grade, result, tries)", "aria-label": "Quick change" }, React.createElement(Zap, { size: 13 }), " Quick fix"), isMine && onEditEntry && /* @__PURE__ */ React.createElement("button", { className: "cl-chip-btn", onClick: () => setEditingId(u.id), title: "Edit this entry", "aria-label": "Edit this entry" }, React.createElement(Pencil, { size: 13 }), " Edit"), /* @__PURE__ */ React.createElement("span", { className: success ? "cl-status cl-status-sent" : "cl-status cl-status-trying" }, success ? sentLabel(u.climbs) : "Trying"))), /* @__PURE__ */ React.createElement("div", { className: "cl-log-detail-stats" }, (u.climbs || []).map((c, i) => /* @__PURE__ */ React.createElement(GradeChip, { key: i, type: c.type, grade: c.grade })), u.minutes > 0 && /* @__PURE__ */ React.createElement("span", { className: "cl-log-stat" }, /* @__PURE__ */ React.createElement(Clock, { size: 11 }), " ", formatDuration(u.minutes)), /* @__PURE__ */ React.createElement("span", { className: "cl-log-stat" }, /* @__PURE__ */ React.createElement(Repeat, { size: 11 }), " ", attemptCount, " attempt", attemptCount === 1 ? "" : "s")), u.attemptLog && u.attemptLog.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "cl-try-breakdown", style: { margin: "8px 0 0" } }, u.attemptLog.map((a) => /* @__PURE__ */ React.createElement("div", { key: a.attemptNumber }, /* @__PURE__ */ React.createElement("div", { className: "cl-attempt-line" }, /* @__PURE__ */ React.createElement("span", null, "Attempt ", a.attemptNumber), /* @__PURE__ */ React.createElement("span", null, formatDuration(Math.round(a.durationMs / 6e4)) || "<1min"), /* @__PURE__ */ React.createElement("span", { className: "cl-attempt-outcome" }, a.endType === "fall" ? `Fell at ${a.fallPosition}` : a.endType === "complete" ? "Completed" : "Stopped")), a.note && /* @__PURE__ */ React.createElement("p", { className: "cl-attempt-note" }, a.note)))), u.technique && u.technique.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "cl-gear-row", style: { marginTop: 4 } }, u.technique.map((t, i) => /* @__PURE__ */ React.createElement("span", { className: "cl-gear-pill", key: i }, t))), u.satisfaction > 0 && /* @__PURE__ */ React.createElement("div", { className: "cl-star-row", style: { justifyContent: "flex-start", marginTop: 4 } }, [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ React.createElement(Star, { key: n, size: 13, fill: n <= u.satisfaction ? "#D4A017" : "none", color: n <= u.satisfaction ? "#D4A017" : "var(--line)" }))), u.note && /* @__PURE__ */ React.createElement("p", { className: "cl-note" }, u.note), u.nextTime && /* @__PURE__ */ React.createElement("p", { className: "cl-note cl-next-note" }, /* @__PURE__ */ React.createElement("b", null, "Next: "), u.nextTime), isMine && onUpdateVideos && /* @__PURE__ */ React.createElement(VideoClips, { update: u, canEdit: true, onChange: (vids) => onUpdateVideos(entry.id, u.id, vids) }));
  })), confirm === "delete" && /* @__PURE__ */ React.createElement(BottomSheet, { title: "Delete this log?", message: "This removes the log and every attempt in it. You can't undo this.", confirmLabel: "Delete", danger: true, onCancel: () => setConfirm(null), onConfirm: () => { setConfirm(null); onDelete(entry.id); onClose(); } }), confirm === "privacy" && /* @__PURE__ */ React.createElement(BottomSheet, { title: entry.privacy === "private" ? "Make this log public?" : "Make this log private?", message: entry.privacy === "private" ? "Anyone on Chalkline will be able to see it." : "Only you will be able to see it.", confirmLabel: entry.privacy === "private" ? "Make public" : "Make private", onCancel: () => setConfirm(null), onConfirm: () => { setConfirm(null); onTogglePrivacy(entry.id); } })));
}
function RecordDetail({ entry, me, onDelete, onTogglePrivacy, onAddTry, onLiveLog, onEnlarge, onShare, onShareToPost, onOpenLogDetail }) {
  const [addingTry, setAddingTry] = useState(false);
  const [expandedTry, setExpandedTry] = useState(null);
  const updates = [...entry.updates || []].reverse();
  const isMine = entry.authorSlug === me;
  const latest = entry.updates[entry.updates.length - 1] || { climbs: [] };
  const totals = computeEntryTotals(entry.updates);
  const pts = normalizePoints(entry.points);
  const hasPoints = pts.start.length > 0 || pts.end.length > 0 || pts.fall.length > 0;
  const tryInitial = entry.postType === "project" ? { lockClimb: true, lockPost: true, climbs: [{ ...latest.climbs[0], attempts: 1, style: void 0 }], formId: entry.id, photo: entry.photo, points: entry.points, beta: entry.beta } : { lockClimb: false, lockPost: true, climbs: [{ type: "boulder", grade: "VB", status: "trying" }], formId: entry.id, photo: entry.photo, points: entry.points, beta: entry.beta };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-record-detail" }, /* @__PURE__ */ React.createElement("div", { className: "cl-record-detail-head" }, /* @__PURE__ */ React.createElement("span", { className: "cl-record-detail-gym" }, /* @__PURE__ */ React.createElement(MapPin, { size: 12 }), " ", entry.gym), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => onOpenLogDetail(entry), title: "Open full page" }, /* @__PURE__ */ React.createElement(Maximize2, { size: 14 })), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => onShareToPost(entry), title: "Share to post" }, /* @__PURE__ */ React.createElement(Mountain, { size: 14 })), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => onShare(entry), title: "Share as picture" }, /* @__PURE__ */ React.createElement(Share2, { size: 14 })), isMine && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => onTogglePrivacy(entry.id), title: entry.privacy === "private" ? "Private \u2014 tap to make public" : "Public \u2014 tap to make private" }, entry.privacy === "private" ? /* @__PURE__ */ React.createElement(Lock, { size: 14 }) : /* @__PURE__ */ React.createElement(Globe, { size: 14 })), /* @__PURE__ */ React.createElement(ConfirmButton, { onConfirm: () => onDelete(entry.id), icon: /* @__PURE__ */ React.createElement(Trash2, { size: 14 }), title: "Delete" }))), entry.photo && /* @__PURE__ */ React.createElement("div", { className: "cl-log-detail-photo-wrap", onClick: () => onEnlarge(entry.photo, entry.points) }, /* @__PURE__ */ React.createElement("img", { src: entry.photo, alt: "", className: "cl-log-detail-photo", style: { cursor: "zoom-in" } }), hasPoints && pts.start.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `s${i}`, className: "cl-point-marker start", style: { left: `${p.x}%`, top: `${p.y}%` } }, "S")), hasPoints && pts.end.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `e${i}`, className: "cl-point-marker end", style: { left: `${p.x}%`, top: `${p.y}%` } }, "E")), hasPoints && pts.fall.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `f${i}`, className: "cl-point-marker fall", style: { left: `${p.x}%`, top: `${p.y}%` } }, i + 1))), /* @__PURE__ */ React.createElement("div", { className: "cl-record-summary" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, totals.logCount), /* @__PURE__ */ React.createElement("span", null, "logs")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, totals.totalTries), /* @__PURE__ */ React.createElement("span", null, "tries")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, totals.sentCount), /* @__PURE__ */ React.createElement("span", null, "sent")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, formatDuration(totals.totalMinutes) || "0min"), /* @__PURE__ */ React.createElement("span", null, "total time"))), /* @__PURE__ */ React.createElement("div", { className: "cl-log-table" }, /* @__PURE__ */ React.createElement("div", { className: "cl-log-table-head" }, /* @__PURE__ */ React.createElement("span", null, "Date"), /* @__PURE__ */ React.createElement("span", null, "Grade"), /* @__PURE__ */ React.createElement("span", null, "Time"), /* @__PURE__ */ React.createElement("span", null, "Tries"), /* @__PURE__ */ React.createElement("span", null, "Result")), updates.map((u) => {
    const attemptCount = updateAttempts(u);
    const success = (u.climbs || []).some((c) => c.status === "sent");
    const hasExtra = u.technique && u.technique.length > 0 || u.satisfaction > 0 || u.note;
    const isExpanded = expandedTry === u.id;
    return /* @__PURE__ */ React.createElement("div", { key: u.id }, /* @__PURE__ */ React.createElement("button", { className: "cl-log-table-row cl-log-table-row-btn", onClick: () => setExpandedTry(isExpanded ? null : u.id) }, /* @__PURE__ */ React.createElement("span", { className: "cl-log-cell-date" }, new Date(u.timestamp).toLocaleDateString(void 0, { month: "short", day: "numeric" })), /* @__PURE__ */ React.createElement("span", { className: "cl-log-cell-grade" }, (u.climbs || []).map((c, i) => /* @__PURE__ */ React.createElement(GradeChip, { key: i, type: c.type, grade: c.grade }))), /* @__PURE__ */ React.createElement("span", { className: "cl-log-cell-time" }, u.minutes > 0 ? formatDuration(u.minutes) : "\u2014"), /* @__PURE__ */ React.createElement("span", { className: "cl-log-cell-tries" }, attemptCount), /* @__PURE__ */ React.createElement("span", { className: success ? "cl-status cl-status-sent" : "cl-status cl-status-trying" }, success ? sentLabel(u.climbs) : "Trying")), hasExtra && /* @__PURE__ */ React.createElement("div", { className: "cl-log-extra" }, u.technique && u.technique.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "cl-log-extra-item" }, u.technique.join(", ")), u.satisfaction > 0 && /* @__PURE__ */ React.createElement("span", { className: "cl-log-extra-item" }, "\u2605".repeat(u.satisfaction), "\u2606".repeat(5 - u.satisfaction)), u.note && /* @__PURE__ */ React.createElement("span", { className: "cl-log-extra-item" }, u.note)), isExpanded && /* @__PURE__ */ React.createElement("div", { className: "cl-try-breakdown" }, u.attemptLog && u.attemptLog.length > 0 ? u.attemptLog.map((a) => /* @__PURE__ */ React.createElement("div", { key: a.attemptNumber }, /* @__PURE__ */ React.createElement("div", { className: "cl-attempt-line" }, /* @__PURE__ */ React.createElement("span", null, "Attempt ", a.attemptNumber), /* @__PURE__ */ React.createElement("span", null, formatDuration(Math.round(a.durationMs / 6e4)) || "<1min"), /* @__PURE__ */ React.createElement("span", { className: "cl-attempt-outcome" }, a.endType === "fall" ? `Fell at ${a.fallPosition}` : a.endType === "complete" ? "Completed" : "Stopped")), a.note && /* @__PURE__ */ React.createElement("p", { className: "cl-attempt-note" }, a.note))) : /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "No attempt-by-attempt breakdown for this entry \u2014 it wasn't logged with Live Log.")));
  })), isMine && !addingTry && /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons", style: { marginTop: 4 } }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: () => setAddingTry(true) }, "Log another entry"), entry.postType === "project" && /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: () => onLiveLog(entry) }, /* @__PURE__ */ React.createElement(Zap, { size: 13 }), " Live log")), addingTry && /* @__PURE__ */ React.createElement(
    LogForm,
    {
      initial: tryInitial,
      saveLabel: "Save entry",
      onCancel: () => setAddingTry(false),
      onSave: async (data) => {
        await onAddTry(entry.id, { note: data.note, photo: data.photo, minutes: data.minutes, climbs: data.climbs, entryDate: data.entryDate, extra: data.extra });
        setAddingTry(false);
      }
    }
  ));
}
function ProfileView({ slug, me, profiles, logs, commentsMap, onClose, onToggleFollow, onToggleBlock, addComment, toggleKudo, toggleSave, onShare, onShareToPost, onOpenLogDetail, onOpenDay, onEnlarge, onShareProfile }) {
  const [showFollowers, setShowFollowers] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [view, setView] = useState("log");
  const target = profiles[slug];
  const myProfile = profiles[me];
  if (!target) return null;
  const following = (myProfile.following || []).includes(slug);
  const friend = isFriend(myProfile, target);
  const blocked = isBlockedEitherWay(myProfile, target);
  const theirLogs = logs.filter((l) => l.authorSlug === slug);
  const publicLogs = theirLogs.filter((l) => l.privacy !== "private");
  const publicClimbs = publicLogs.filter((l) => l.kind === "climb");
  const theirStats = computeStats(publicClimbs);
  const theirTrends = computeTrends(publicClimbs);
  const theirBadges = computeBadges(theirStats);
  const theirEarned = computeDisplayBadges(theirStats).filter((b) => b.earned);
  const followerSlugs = followerSlugsFor(slug, profiles);
  const boulderShown = effectiveGrade("boulder", target.boulder, theirLogs, true);
  const routeShown = effectiveGrade("route", target.route, theirLogs, true);
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, target.name), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => onShareProfile(target), title: "Share their profile" }, /* @__PURE__ */ React.createElement(Share2, { size: 18 }))), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body" }, /* @__PURE__ */ React.createElement("div", { className: "cl-badge" }, /* @__PURE__ */ React.createElement("div", { className: "cl-badge-top" }, /* @__PURE__ */ React.createElement(Avatar, { name: target.name, photo: target.photo, size: 56 }), /* @__PURE__ */ React.createElement("div", { className: "cl-badge-id" }, /* @__PURE__ */ React.createElement("h2", null, target.name), /* @__PURE__ */ React.createElement("p", { className: "cl-sub cl-nowrap" }, "Since ", target.since ? (/* @__PURE__ */ new Date(target.since + "-01")).toLocaleDateString(void 0, { month: "short", year: "2-digit" }) : "\u2014"), /* @__PURE__ */ React.createElement("p", { className: "cl-id-text" }, "@", target.username || target.slug.slice(0, 8)))), /* @__PURE__ */ React.createElement("div", { className: "cl-chip-row" }, /* @__PURE__ */ React.createElement(GradeChip, { type: "boulder", grade: boulderShown }), /* @__PURE__ */ React.createElement(GradeChip, { type: "toprope", grade: routeShown, label: "Route" })), target.qualifications && target.qualifications.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "cl-gear-row" }, target.qualifications.map((q, i) => {
    const Ic = QUALIFICATION_ICONS[q] || GraduationCap;
    return /* @__PURE__ */ React.createElement("span", { className: "cl-gear-pill cl-qual-pill", key: i }, /* @__PURE__ */ React.createElement(Ic, { size: 11 }), " ", q);
  })), target.gear && target.gear.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "cl-gear-row" }, target.gear.map((g, i) => /* @__PURE__ */ React.createElement("span", { className: "cl-gear-pill", key: i }, g))), /* @__PURE__ */ React.createElement("div", { className: "cl-stats-row" }, /* @__PURE__ */ React.createElement("div", { className: "cl-stat" }, /* @__PURE__ */ React.createElement("b", null, publicLogs.length), /* @__PURE__ */ React.createElement("span", null, "posts")), /* @__PURE__ */ React.createElement("button", { className: "cl-stat cl-stat-btn", onClick: () => setShowFollowers((v) => !v) }, /* @__PURE__ */ React.createElement("b", null, followerSlugs.length), /* @__PURE__ */ React.createElement("span", null, "followers")), /* @__PURE__ */ React.createElement("div", { className: "cl-stat" }, /* @__PURE__ */ React.createElement("b", null, (target.following || []).length), /* @__PURE__ */ React.createElement("span", null, "following"))), showFollowers && (friend ? /* @__PURE__ */ React.createElement("div", { className: "cl-crew-grid", style: { marginTop: 10 } }, followerSlugs.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "No followers yet."), followerSlugs.map((s) => {
    const p = profiles[s];
    return p ? /* @__PURE__ */ React.createElement("div", { className: "cl-crew-card", key: s }, /* @__PURE__ */ React.createElement(Avatar, { name: p.name, photo: p.photo, size: 30 }), /* @__PURE__ */ React.createElement("div", { className: "cl-crew-name" }, p.name)) : null;
  })) : /* @__PURE__ */ React.createElement("p", { className: "cl-hint", style: { marginTop: 8 } }, "Follow each other to see ", target.name, "'s followers.")), !blocked ? /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons" }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: () => onToggleFollow(slug) }, following ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(UserMinus, { size: 14, style: { marginRight: 4 } }), " Unfollow") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(UserPlus, { size: 14, style: { marginRight: 4 } }), " Follow"))) : /* @__PURE__ */ React.createElement("p", { className: "cl-hint", style: { marginTop: 10 } }, "You or ", target.name, " have blocked each other."), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost cl-full", style: { marginTop: 8, color: "var(--accent2)" }, onClick: () => onToggleBlock(slug) }, /* @__PURE__ */ React.createElement(Ban, { size: 14, style: { marginRight: 4 } }), " ", blocked ? "Unblock" : "Block")), !blocked && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "cl-tabbar", style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "cl-tabs", role: "tablist" }, React.createElement("button", { className: view === "log" ? "cl-tbtab active" : "cl-tbtab", onClick: () => setView("log"), role: "tab" }, "Log"), React.createElement("button", { className: view === "progress" ? "cl-tbtab active" : "cl-tbtab", onClick: () => setView("progress"), role: "tab" }, "Progress"), React.createElement("button", { className: view === "posts" ? "cl-tbtab active" : "cl-tbtab", onClick: () => setView("posts"), role: "tab" }, "Posts"))), view === "log" && React.createElement("div", { style: { marginTop: 12 } }, publicClimbs.length === 0 && React.createElement("p", { className: "cl-empty" }, "No public log entries yet."), groupRecordsByDay(publicClimbs).map((group) => React.createElement(DayRow, { key: group.dateKey, group, summary: computeDaySummary(publicLogs, slug, group.ts), onOpen: (ts) => onOpenDay(ts, slug) }))), view === "progress" && React.createElement("div", { className: "cl-progress-view", style: { paddingLeft: 0, paddingRight: 0 } }, publicClimbs.length === 0 ? React.createElement("p", { className: "cl-empty" }, "No public climbs to show progress from yet.") : React.createElement(React.Fragment, null, React.createElement("p", { className: "cl-section-caption cl-pv-caption", style: { marginTop: 6 } }, "This month"), React.createElement("div", { className: "cl-trend-grid" }, [[theirTrends.sessions, theirTrends.sessions === 1 ? "session" : "sessions", `${theirTrends.lastSessions} last month`], [theirTrends.projects, theirTrends.projects === 1 ? "project" : "projects", ""], [theirTrends.attempts, theirTrends.attempts === 1 ? "attempt" : "attempts", ""], [formatDuration(theirTrends.minutes) || "0min", "time", ""]].map(([v, l, sub]) => React.createElement("div", { className: "cl-trend-card", key: l }, React.createElement("b", null, v), React.createElement("span", null, l), sub && React.createElement("small", null, sub)))), theirTrends.streak > 0 && React.createElement("p", { className: "cl-hint", style: { margin: "8px 0 0" } }, `${theirTrends.streak}-week streak`), React.createElement(ProgressCharts, { mine: publicClimbs }), React.createElement("p", { className: "cl-section-caption cl-pv-caption" }, "Badges  ", theirBadges.filter((b) => b.earned).length, "/", theirBadges.length), theirEarned.length > 0 ? React.createElement("div", { className: "cl-badges-grid" }, theirEarned.map((b) => { const Icon = b.icon; return React.createElement("div", { key: b.id, className: "cl-badge-item earned" }, React.createElement(Icon, { size: 20 }), React.createElement("span", null, b.label)); })) : React.createElement("p", { className: "cl-hint" }, "No badges earned yet."), React.createElement("p", { className: "cl-hint", style: { marginTop: 12 } }, "Based on ", target.name, "'s public logs."))), view === "posts" && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, display: "flex", flexDirection: "column", gap: 12 } }, publicLogs.filter((l) => l.kind === "post").length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "No public posts yet."), publicLogs.filter((l) => l.kind === "post").map((entry) => /* @__PURE__ */ React.createElement(
    SocialPostCard,
    {
      key: entry.id,
      entry,
      profile: target,
      comments: commentsMap[entry.id] || [],
      me,
      allLogs: logs,
      onComment: addComment,
      onKudo: toggleKudo,
      onDelete: () => {
      },
      onToggleSave: toggleSave,
      onOpenProfile: () => {
      },
      onEnlarge,
      onShare,
      onOpenLogDetail
    }
  ))))));
}
function normalizePoints(points) {
  if (!points) return { start: [], end: [], fall: [] };
  const norm = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return [v];
  };
  return { start: norm(points.start), end: norm(points.end), fall: norm(points.fall) };
}
function loadScriptOnce(src, globalCheck) {
  return new Promise((resolve, reject) => {
    if (globalCheck()) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
function PeopleSearch({ me, profiles, onClose, onOpenProfile }) {
  const [query, setQuery] = useState("");
  const [manualCode, setManualCode] = useState("");
  const results = Object.values(profiles).filter((p) => p.slug !== me && (p.name.toLowerCase().includes(query.toLowerCase()) || (p.username || "").toLowerCase().includes(query.toLowerCase())));
  const goToCode = () => {
    const target = manualCode.trim();
    const code = target.toLowerCase();
    const match = Object.values(profiles).find((p) => p.username === code) || profiles[target];
    if (match) {
      onOpenProfile(match.slug);
      onClose();
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, "Find people"), /* @__PURE__ */ React.createElement("div", { style: { width: 32 } })), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body" }, /* @__PURE__ */ React.createElement("div", { className: "cl-search-wrap" }, /* @__PURE__ */ React.createElement(Search, { size: 15 }), /* @__PURE__ */ React.createElement("input", { className: "cl-input", style: { paddingLeft: 30 }, placeholder: "Search by name or username\u2026", value: query, onChange: (e) => setQuery(e.target.value), autoFocus: true })), /* @__PURE__ */ React.createElement("div", { className: "cl-resume-list" }, results.map((p) => /* @__PURE__ */ React.createElement("button", { key: p.slug, className: "cl-resume-item", onClick: () => {
    onOpenProfile(p.slug);
    onClose();
  } }, /* @__PURE__ */ React.createElement(Avatar, { name: p.name, photo: p.photo, size: 32 }), /* @__PURE__ */ React.createElement("span", null, p.name), /* @__PURE__ */ React.createElement(ChevronRight, { size: 16 }))), query && results.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "No match."))));
}
var TECHNIQUE_PRESETS = ["Heel hook", "Toe hook", "Dyno", "Mantle", "Crimp", "Sloper", "Flag", "Drop knee", "Compression", "Smearing"];
var FALL_POSITIONS = ["1/4", "1/2", "3/4"];
function formatMs(ms) {
  const totalSec = Math.floor(ms / 1e3);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function summarizeAttempts(attempts) {
  const falls = {};
  attempts.forEach((a) => {
    if (a.endType === "fall") falls[a.fallPosition] = (falls[a.fallPosition] || 0) + 1;
  });
  const fallText = Object.entries(falls).map(([pos, n]) => `${pos} (x${n})`).join(", ");
  return `${attempts.length} attempt${attempts.length === 1 ? "" : "s"}${fallText ? ` \xB7 fell at ${fallText}` : ""}`;
}
function PhotoPointPicker({ photo, points, onChange }) {
  const [mode, setMode] = useState("start");
  const imgRef = useRef();
  const safePoints = normalizePoints(points);
  const handleClick = (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100));
    const y = Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100));
    const current = safePoints[mode];
    if (current.length >= (mode === "fall" ? 9 : 2)) return;
    onChange({ ...safePoints, [mode]: [...current, { x, y }] });
  };
  const removePoint = (type, idx, e) => {
    e.stopPropagation();
    onChange({ ...safePoints, [type]: safePoints[type].filter((_, i) => i !== idx) });
  };
  const anyPoints = safePoints.start.length > 0 || safePoints.end.length > 0 || safePoints.fall.length > 0;
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row", style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: mode === "start" ? "cl-toggle active" : "cl-toggle", onClick: () => setMode("start") }, "Mark start (", safePoints.start.length, "/2)"), /* @__PURE__ */ React.createElement("button", { type: "button", className: mode === "end" ? "cl-toggle active" : "cl-toggle", onClick: () => setMode("end") }, "Mark end (", safePoints.end.length, "/2)"), /* @__PURE__ */ React.createElement("button", { type: "button", className: mode === "fall" ? "cl-toggle active" : "cl-toggle", onClick: () => setMode("fall") }, "Add 1, 2, 3 (", safePoints.fall.length, ")"), anyPoints && /* @__PURE__ */ React.createElement("button", { type: "button", className: "cl-btn-ghost", style: { flex: "0 0 auto" }, onClick: () => onChange({ start: [], end: [], fall: [] }) }, /* @__PURE__ */ React.createElement(X, { size: 13 }))), /* @__PURE__ */ React.createElement("div", { className: "cl-point-photo-wrap", onClick: handleClick }, /* @__PURE__ */ React.createElement("img", { ref: imgRef, src: photo, alt: "mark climb points", className: "cl-point-photo" }), safePoints.start.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `s${i}`, className: "cl-point-marker start", style: { left: `${p.x}%`, top: `${p.y}%` }, onClick: (e) => removePoint("start", i, e) }, "S")), safePoints.end.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `e${i}`, className: "cl-point-marker end", style: { left: `${p.x}%`, top: `${p.y}%` }, onClick: (e) => removePoint("end", i, e) }, "E")), safePoints.fall.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `f${i}`, className: "cl-point-marker fall", style: { left: `${p.x}%`, top: `${p.y}%` }, onClick: (e) => removePoint("fall", i, e) }, i + 1))), /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "Optional \u2014 tap the photo to mark where you start and finish. Use \"Add 1, 2, 3\" to number stops along the route; tap a marker to remove it."));
}
function StarRating({ value, onChange }) {
  return /* @__PURE__ */ React.createElement("div", { className: "cl-star-row" }, [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ React.createElement("button", { key: n, type: "button", className: "cl-star-btn", onClick: () => onChange(n) }, /* @__PURE__ */ React.createElement(Star, { size: 24, fill: n <= value ? "#D4A017" : "none", color: n <= value ? "#D4A017" : "var(--line)" }))));
}
function LiveLogOverlay({ continueEntry, defaultGym, onClose, onSaveNew, onSaveContinue }) {
  const [phase, setPhase] = useState(continueEntry ? "ready" : "setup");
  const [title, setTitle] = useState("");
  const [gym, setGym] = useState(continueEntry ? continueEntry.gym : defaultGym);
  const [climb, setClimb] = useState(
    continueEntry ? { ...continueEntry.updates[continueEntry.updates.length - 1].climbs[0] } : { type: "boulder", grade: "VB", status: "trying" }
  );
  const [setupError, setSetupError] = useState("");
  const [sessionStart, setSessionStart] = useState(null);
  const [attemptStart, setAttemptStart] = useState(null);
  const [restStart, setRestStart] = useState(null);
  const [restNote, setRestNote] = useState("");
  const [attempts, setAttempts] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [endTime, setEndTime] = useState(null);
  const [technique, setTechnique] = useState([]);
  const [satisfaction, setSatisfaction] = useState(0);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(continueEntry?.photo || null);
  const [points, setPoints] = useState(() => normalizePoints(continueEntry?.points));
  const [beta, setBeta] = useState(continueEntry?.beta || null);
  const [fallPoints, setFallPoints] = useState([]);
  const [privacy, setPrivacy] = useState("public");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (phase !== "climbing" && phase !== "resting") return;
    const id = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(id);
  }, [phase]);
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(await resizeImage(f));
    e.target.value = "";
  };
  const startSession = () => {
    setSetupError("");
    const t = Date.now();
    setSessionStart(t);
    setAttemptStart(t);
    setNow(t);
    setPhase("climbing");
  };
  const recordFall = (position) => {
    const end = Date.now();
    setAttempts((prev) => [...prev, { attemptNumber: prev.length + 1, startTime: attemptStart, endTime: end, endType: "fall", fallPosition: position, durationMs: end - attemptStart }]);
    setAttemptStart(null);
    setRestStart(end);
    setNow(end);
    setPhase("resting");
  };
  const startAgain = () => {
    if (restNote.trim()) {
      setAttempts((prev) => prev.map((a, i) => i === prev.length - 1 ? { ...a, note: restNote.trim() } : a));
    }
    setRestNote("");
    const t = Date.now();
    setRestStart(null);
    setAttemptStart(t);
    setNow(t);
    setPhase("climbing");
  };
  const complete = () => {
    const end = Date.now();
    if (attemptStart) {
      setAttempts((prev) => [...prev, { attemptNumber: prev.length + 1, startTime: attemptStart, endTime: end, endType: "complete", durationMs: end - attemptStart }]);
    }
    setEndTime(end);
    setPhase("ended-complete");
  };
  const stopHere = () => {
    const end = Date.now();
    if (attemptStart) {
      setAttempts((prev) => [...prev, { attemptNumber: prev.length + 1, startTime: attemptStart, endTime: end, endType: "stopped", durationMs: end - attemptStart }]);
    } else if (restNote.trim()) {
      setAttempts((prev) => prev.map((a, i) => i === prev.length - 1 ? { ...a, note: restNote.trim() } : a));
    }
    setEndTime(end);
    setPhase("ended-stopped");
  };
  const save = async () => {
    setSaving(true);
    const totalMinutes = Math.round(((endTime || now) - sessionStart) / 6e4);
    const finalStatus = phase === "ended-complete" ? "sent" : "trying";
    const climbs = [{ ...climb, status: finalStatus }];
    const hasAnyPoints = points.start.length > 0 || points.end.length > 0 || fallPoints.length > 0;
    const extra = { technique, satisfaction, attemptLog: attempts, points: hasAnyPoints ? { ...points, fall: fallPoints } : null, beta: hasBeta(beta) ? beta : null };
    if (continueEntry) {
      await onSaveContinue(continueEntry.id, { note: note.trim(), photo, minutes: totalMinutes, climbs, extra });
    } else {
      await onSaveNew({ postType: "project", title: title.trim(), gym, privacy, note: note.trim(), photo, minutes: totalMinutes, climbs, extra });
    }
    setSaving(false);
    onClose();
  };
  const elapsedCurrent = attemptStart ? now - attemptStart : 0;
  const elapsedRest = restStart ? now - restStart : 0;
  const elapsedTotal = sessionStart ? (endTime || now) - sessionStart : 0;
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay cl-layer-top" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, /* @__PURE__ */ React.createElement(Zap, { size: 16, style: { verticalAlign: -2 } }), " Live Log"), /* @__PURE__ */ React.createElement("div", { style: { width: 32 } })), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body" }, phase === "setup" && /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "What are you climbing?"), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Name (optional)"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "e.g. Blue arete by the window" }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Gym or crag"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: gym, onChange: (e) => setGym(e.target.value), list: "cl-gyms-live" }), /* @__PURE__ */ React.createElement("datalist", { id: "cl-gyms-live" }, GYM_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }))), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Type & grade"), /* @__PURE__ */ React.createElement(TypeSelector, { value: climb.type, onChange: (t) => setClimb({ type: t, grade: gradeOptionsFor(t) ? gradeOptionsFor(t)[0] : "" }) }), /* @__PURE__ */ React.createElement(GradeSelector, { type: climb.type, grade: climb.grade, onChange: (g) => setClimb({ ...climb, grade: g }) }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Photo of the wall (optional)"), /* @__PURE__ */ React.createElement(PhotoAddButtons, { onFile, idBase: "live-photo-setup", changeLabel: !!photo }), /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "Resized automatically \u2014 any size you upload works fine."), photo && React.createElement(BetaField, { photo, beta, onChange: setBeta }), setupError && /* @__PURE__ */ React.createElement("p", { className: "cl-error" }, setupError), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: startSession }, /* @__PURE__ */ React.createElement(Zap, { size: 16 }), " Start climbing")), phase === "ready" && /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Ready to go again"), /* @__PURE__ */ React.createElement("div", { className: "cl-chip-row", style: { marginTop: 0 } }, /* @__PURE__ */ React.createElement(GradeChip, { type: climb.type, grade: climb.grade })), /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, continueEntry.title, " \xB7 ", gym), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Photo of the wall (optional)"), /* @__PURE__ */ React.createElement(PhotoAddButtons, { onFile, idBase: "live-photo-ready", changeLabel: !!photo }), /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "Resized automatically \u2014 any size you upload works fine."), photo && React.createElement(BetaField, { photo, beta, onChange: setBeta }), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: startSession }, /* @__PURE__ */ React.createElement(Zap, { size: 16 }), " Start climbing")), (phase === "climbing" || phase === "resting") && /* @__PURE__ */ React.createElement("div", { className: "cl-live-tracker" }, /* @__PURE__ */ React.createElement("div", { className: "cl-live-timer" }, formatMs(phase === "climbing" ? elapsedCurrent : elapsedRest)), /* @__PURE__ */ React.createElement("p", { className: "cl-live-sub" }, phase === "climbing" ? `Attempt ${attempts.length + 1} \xB7 climbing` : "Resting"), /* @__PURE__ */ React.createElement("p", { className: "cl-live-total" }, "Total time: ", formatMs(elapsedTotal)), phase === "climbing" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption", style: { marginTop: 16 } }, "Fell at"), /* @__PURE__ */ React.createElement("div", { className: "cl-fall-row" }, FALL_POSITIONS.map((pos) => /* @__PURE__ */ React.createElement("button", { key: pos, className: "cl-fall-btn", onClick: () => recordFall(pos) }, pos))), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", style: { background: "var(--accent)" }, onClick: complete }, /* @__PURE__ */ React.createElement(CheckCircle2, { size: 16 }), " Complete!"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost cl-full", style: { marginTop: 8 }, onClick: stopHere }, "Stop here")) : /* @__PURE__ */ React.createElement(React.Fragment, null, photo && /* @__PURE__ */ React.createElement("div", { className: "cl-form-section", style: { padding: 0, marginBottom: 12 } }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Where did you fall? (optional)"), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "cl-point-photo-wrap",
      onClick: (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100));
        const y = Math.max(0, Math.min(100, (e.clientY - rect.top) / rect.height * 100));
        setFallPoints((prev) => [...prev, { x, y, attemptNumber: attempts.length }]);
      }
    },
    /* @__PURE__ */ React.createElement("img", { src: photo, alt: "mark fall point", className: "cl-point-photo" }),
    normalizePoints(points).start.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `s${i}`, className: "cl-point-marker start", style: { left: `${p.x}%`, top: `${p.y}%` } }, "S")),
    normalizePoints(points).end.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `e${i}`, className: "cl-point-marker end", style: { left: `${p.x}%`, top: `${p.y}%` } }, "E")),
    fallPoints.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `f${i}`, className: "cl-point-marker fall", style: { left: `${p.x}%`, top: `${p.y}%` } }, i + 1))
  ), fallPoints.length > 0 && /* @__PURE__ */ React.createElement("button", { type: "button", className: "cl-btn-ghost", style: { marginTop: 6, width: "auto", padding: "4px 12px", fontSize: 11 }, onClick: () => setFallPoints((prev) => prev.slice(0, -1)) }, "Undo last mark")), /* @__PURE__ */ React.createElement("textarea", { className: "cl-input cl-textarea", style: { marginBottom: 10 }, placeholder: "Notes while resting \u2014 what to adjust next try (optional)", value: restNote, onChange: (e) => setRestNote(e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: startAgain }, /* @__PURE__ */ React.createElement(Repeat, { size: 16 }), " Start again"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost cl-full", style: { marginTop: 8 }, onClick: stopHere }, "Stop here")), attempts.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-hint", style: { marginTop: 12 } }, summarizeAttempts(attempts))), (phase === "ended-complete" || phase === "ended-stopped") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, phase === "ended-complete" ? "Sent it! \u{1F389}" : "Session stopped"), /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, formatMs(elapsedTotal), " total \xB7 ", summarizeAttempts(attempts))), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Technique used"), /* @__PURE__ */ React.createElement(TagEditor, { options: TECHNIQUE_PRESETS, selected: technique, setSelected: setTechnique, placeholder: "Add your own" }), React.createElement(TechniqueGuideLink, null)), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "How satisfied are you?"), /* @__PURE__ */ React.createElement(StarRating, { value: satisfaction, onChange: setSatisfaction })), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Notes"), /* @__PURE__ */ React.createElement("textarea", { className: "cl-input cl-textarea", placeholder: "Anything else to remember\u2026", value: note, onChange: (e) => setNote(e.target.value) })), !continueEntry && /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Who can see this?"), /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, /* @__PURE__ */ React.createElement("button", { className: privacy === "public" ? "cl-toggle active" : "cl-toggle", onClick: () => setPrivacy("public") }, /* @__PURE__ */ React.createElement(Globe, { size: 13 }), " Public"), /* @__PURE__ */ React.createElement("button", { className: privacy === "private" ? "cl-toggle active" : "cl-toggle", onClick: () => setPrivacy("private") }, /* @__PURE__ */ React.createElement(Lock, { size: 13 }), " Private"))), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: save, disabled: saving }, saving ? "Saving\u2026" : "Save & post"))));
}
var SHARE_DESIGNS = [
  { id: "badge", label: "Achievement" },
  { id: "stats", label: "Stats card" },
  { id: "photo", label: "Full photo" }
];
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, align = "left") {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  const lines = [];
  words.forEach((w) => {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line.trim());
      line = w + " ";
    } else {
      line = test;
    }
  });
  lines.push(line.trim());
  lines.forEach((l) => {
    if (align === "center") ctx.fillText(l, x, curY, maxWidth);
    else ctx.fillText(l, x, curY);
    curY += lineHeight;
  });
  return curY;
}
function drawBadgeDesign(ctx, W, H, data, img) {
  ctx.fillStyle = "#161712";
  ctx.fillRect(0, 0, W, H);
  if (img) {
    ctx.save();
    ctx.filter = "blur(10px) brightness(0.45)";
    const scale = Math.max(W / img.width, H / img.height) * 1.1;
    const sw = img.width * scale, sh = img.height * scale;
    ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
    ctx.restore();
  }
  const cx = W / 2, topY = H * 0.32;
  ctx.textAlign = "center";
  ctx.font = "800 30px sans-serif";
  ctx.fillStyle = "#D9D4C4";
  ctx.fillText((data.statusLabel || "Achievement").toUpperCase(), cx, topY);
  ctx.font = "800 68px sans-serif";
  ctx.fillStyle = "#FBFAF6";
  ctx.fillText(data.achievement || "", cx, topY + 70);
  ctx.font = "600 26px sans-serif";
  ctx.fillStyle = "#D9D4C4";
  let y = topY + 130;
  (data.statsLines || []).slice(0, 2).forEach((line) => {
    ctx.fillText(line, cx, y);
    y += 36;
  });
  ctx.textAlign = "left";
  ctx.font = "700 28px sans-serif";
  ctx.fillStyle = "#FBFAF6";
  ctx.fillText(data.name || "", 40, H - 90);
  ctx.font = "400 20px sans-serif";
  ctx.fillStyle = "#8A8578";
  ctx.fillText(`${data.place || ""}${data.date ? " \xB7 " + data.date : ""}`, 40, H - 58);
  ctx.textAlign = "right";
  ctx.fillText("Chalkline", W - 40, H - 58);
  ctx.textAlign = "left";
}
function drawStatsDesign(ctx, W, H, data, img) {
  ctx.fillStyle = "#22241F";
  ctx.fillRect(0, 0, W, H);
  const ph = H * 0.42;
  if (img) {
    const scale = Math.max(W / img.width, ph / img.height);
    const sw = img.width * scale, sh = img.height * scale;
    ctx.drawImage(img, (W - sw) / 2, (ph - sh) / 2, sw, sh);
  } else {
    ctx.fillStyle = data.accentColor || "#C4501F";
    ctx.fillRect(0, 0, W, ph);
  }
  ctx.fillStyle = "#22241F";
  ctx.fillRect(0, ph, W, H - ph);
  ctx.textAlign = "left";
  ctx.font = "800 44px sans-serif";
  ctx.fillStyle = "#FBFAF6";
  ctx.fillText(data.name || "", 40, ph + 70);
  ctx.font = "400 22px sans-serif";
  ctx.fillStyle = "#D9D4C4";
  ctx.fillText(data.place || "", 40, ph + 105);
  ctx.font = "800 50px sans-serif";
  ctx.fillStyle = data.accentColor || "#C4501F";
  ctx.fillText(data.achievement || "", 40, ph + 175);
  let y = ph + 230;
  ctx.font = "600 26px sans-serif";
  (data.statsLines || []).forEach((line) => {
    ctx.fillStyle = "#FBFAF6";
    ctx.fillText(line, 40, y);
    y += 42;
  });
  ctx.font = "400 18px sans-serif";
  ctx.fillStyle = "#8A8578";
  ctx.fillText(data.date || "", 40, H - 30);
  ctx.textAlign = "right";
  ctx.fillText("Chalkline", W - 40, H - 30);
  ctx.textAlign = "left";
}
function clDrawBars(ctx, bars, x, y, w, h, t) {
  const n = bars.length;
  if (!n) return;
  const gap = 12;
  const bw = Math.min(64, (w - gap * (n - 1)) / n);
  const total = bw * n + gap * (n - 1);
  let bx = x + (w - total) / 2;
  const max = Math.max(1, ...bars.map((b) => b.count));
  const top = y + 30, bottom = y + h - 30, span = bottom - top;
  ctx.textAlign = "center";
  bars.forEach((b) => {
    const bh = b.count > 0 ? Math.max(10, span * b.count / max) : 4;
    clRoundRect(ctx, bx, bottom - bh, bw, bh, Math.min(10, bw / 2));
    ctx.fillStyle = b.count > 0 ? b.color : t.neutral;
    ctx.fill();
    if (b.count > 0 && t.text === "#FFFFFF") {
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.stroke();
    }
    if (b.count > 0) {
      ctx.font = "800 22px sans-serif";
      ctx.fillStyle = t.text;
      ctx.fillText(String(b.count), bx + bw / 2, bottom - bh - 8);
    }
    ctx.font = "700 18px sans-serif";
    ctx.fillStyle = t.soft;
    clFitText(ctx, b.label, bw + 8, 18, 11, 700);
    ctx.fillText(b.label, bx + bw / 2, bottom + 24);
    bx += bw + gap;
  });
}
function clDrawMedal(ctx, cx, cy, r, color, text, sub) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  [[-1, "#FFFFFF"], [1, "#FFFFFF"]].forEach(([side]) => {
    ctx.beginPath();
    ctx.moveTo(cx + side * r * 0.25, cy + r * 0.55);
    ctx.lineTo(cx + side * r * 0.75, cy + r * 0.45);
    ctx.lineTo(cx + side * r * 0.95, cy + r * 1.3);
    ctx.lineTo(cx + side * r * 0.62, cy + r * 1.12);
    ctx.lineTo(cx + side * r * 0.45, cy + r * 1.42);
    ctx.closePath();
    ctx.fill();
  });
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.84, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  clFitText(ctx, text, r * 1.25, sub ? 66 : 76, 24, 800);
  ctx.fillText(text, cx, cy + (sub ? 12 : 24));
  if (sub) {
    ctx.font = "800 17px sans-serif";
    ctx.fillText(sub, cx, cy + 42);
  }
  ctx.restore();
}
function clBadgeMeta(id) {
  if (id.startsWith("boulder-")) {
    const g = id.slice(8);
    return { text: g, sub: "BOULDER", color: gradeColor("boulder", g), category: "Boulder grade" };
  }
  if (id.startsWith("route-")) {
    const g = id.slice(6);
    return { text: usGrade(g), sub: "ROUTE", color: gradeColor("toprope", g), category: "Route grade" };
  }
  if (id.startsWith("hours-")) return { text: `${id.slice(6)}h`, sub: "CLIMBED", color: "#D4A017", category: "Climbing time" };
  if (id.startsWith("finish-")) return { text: id.slice(7), sub: "SENT", color: "#6B8E4E", category: "Sends" };
  return { text: "\u2605", sub: "", color: "#D4A017", category: "Badge" };
}
function clBadgeModel(d) {
  const meta = clBadgeMeta(d.badgeId || "");
  return {
    kicker: "BADGE UNLOCKED",
    kickerColor: "#D4A017",
    date: d.date,
    title: d.badgeLabel,
    subline: `${meta.category}  \xB7  ${d.earnedCount}/${d.totalBadges} badges`,
    stats: [
      { value: d.totalClimbs || 0, label: (d.totalClimbs || 0) === 1 ? "climb" : "climbs" },
      { value: d.totalSent || 0, label: "sent" },
      { value: formatDuration(d.totalMinutes) || "0min", label: "time" }
    ],
    chipsTitle: "BADGES EARNED",
    chips: (d.earnedLabels || []).map((t) => ({ prefix: "", text: t, color: null })),
    hero: { value: meta.text, label: meta.category.toUpperCase() },
    heroLine: `${d.earnedCount}/${d.totalBadges} badges earned`,
    clearKicker: "BADGE UNLOCKED",
    clearSubline: d.place || "",
    medal: { color: meta.color, text: meta.text, sub: meta.sub },
    name: d.name,
    place: d.place,
    fallbackColor: "#2E3028"
  };
}
function clProgressModel(d) {
  const tl = TYPE_LABELS[d.chartType] || "Climbing";
  return {
    kicker: "MY PROGRESS",
    kickerColor: "#C4501F",
    date: d.date,
    title: `${tl} progress`,
    subline: d.topText ? `Hardest sent  ${d.topText}` : "Keep climbing!",
    stats: [
      { value: d.climbed || 0, label: "climbed" },
      { value: d.sent || 0, label: "sent" },
      { value: d.topText || "\u2014", label: "hardest" }
    ],
    chipsTitle: "WALLS BY GRADE",
    chips: [],
    bars: d.bars || [],
    hero: { value: d.climbed || 0, label: `${tl.toUpperCase()} CLIMBS` },
    heroLine: `${d.sent || 0} sent   \xB7   hardest ${d.topText || "\u2014"}`,
    clearKicker: "MY PROGRESS",
    clearSubline: d.place || "",
    medal: { color: d.topColor || "#C4501F", text: d.topText || String(d.climbed || 0), sub: d.topText ? "HARDEST" : "CLIMBS" },
    name: d.name,
    place: d.place,
    fallbackColor: "#2E3028"
  };
}
function drawFullPhotoDesign(ctx, W, H, data, img, bg, strip) {
  const m = clLogModel(data);
  const base = bg || "#161712";
  const t = clTheme(clIsLight(base));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  const showStrip = !!(strip && img && hasBeta(data.beta));
  const areaX = 30, areaY = 30, areaW = W - 60, areaH = showStrip ? 400 : 590;
  if (img) {
    const scale = Math.min(areaW / img.width, areaH / img.height);
    const sw = img.width * scale, sh = img.height * scale;
    const sx = areaX + (areaW - sw) / 2, sy = areaY + (areaH - sh) / 2;
    clDrawCover(ctx, img, sx, sy, sw, sh, 18);
    const pts = hasBeta(data.beta) ? { start: [], end: [], fall: [] } : normalizePoints(data.points);
    if (hasBeta(data.beta)) drawBeta(ctx, { x: sx, y: sy, w: sw, h: sh }, { x: sx, y: sy, w: sw, h: sh }, data.beta, 1);
    const drawDot = (px, py, label, color) => {
      const cx = sx + px / 100 * sw, cy = sy + py / 100 * sh;
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "800 15px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, cx, cy + 5);
    };
    pts.start.forEach((p) => drawDot(p.x, p.y, "S", "#6B8E4E"));
    pts.end.forEach((p) => drawDot(p.x, p.y, "E", "#C4501F"));
    (pts.fall || []).forEach((p, i) => drawDot(p.x, p.y, String(i + 1), "#D4A017"));
    if (showStrip) {
      const n = groupMoves(data.beta.moves).length;
      const picks = n <= 3 ? Array.from({ length: n }, (_, i) => i + 1) : [1, Math.ceil(n / 2), n];
      const gap = 10, fw = (areaW - gap * (picks.length - 1)) / picks.length, fy = areaY + areaH + 12;
      picks.forEach((s, i) => drawStickFrame(ctx, areaX + i * (fw + gap), fy, fw, 178, img, data.beta, s, `Step ${s}`));
    }
  } else {
    clRoundRect(ctx, areaX, areaY, areaW, areaH, 18);
    ctx.fillStyle = m.fallbackColor;
    ctx.fill();
  }
  ctx.font = "800 18px sans-serif";
  const kw = ctx.measureText(m.kicker).width + 30;
  clRoundRect(ctx, areaX, 648, kw, 36, 18);
  ctx.fillStyle = m.kickerColor;
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText(m.kicker, areaX + 15, 672);
  ctx.textAlign = "right";
  ctx.font = "700 19px sans-serif";
  ctx.fillStyle = t.soft;
  ctx.fillText((m.date || "").toUpperCase(), W - areaX, 672);
  ctx.textAlign = "left";
  ctx.fillStyle = t.text;
  clFitText(ctx, m.title, areaW, 44, 26, 800);
  ctx.fillText(m.title, areaX, 734);
  ctx.font = "600 23px sans-serif";
  ctx.fillStyle = t.soft;
  ctx.fillText(m.subline, areaX, 770);
  clDrawStatBoxes(ctx, m.stats, areaX, 796, areaW, 112, { fill: t.box, stroke: t.boxStroke, value: t.text, label: t.soft });
  ctx.textAlign = "left";
  ctx.font = "700 20px sans-serif";
  ctx.fillStyle = t.text;
  ctx.fillText(m.name || "", areaX, H - 36);
  ctx.textAlign = "right";
  ctx.fillStyle = t.soft;
  ctx.fillText("CHALKLINE", W - areaX, H - 36);
  ctx.textAlign = "left";
}
var DAY_TYPE_COLORS = { boulder: "#C4501F", toprope: "#6B8E4E", lead: "#3A4A63", other: "#8A8578" };
var SUMMARY_DESIGNS = [
  { id: "strava", label: "Overlay stats" },
  { id: "blur", label: "Blurred" },
  { id: "clear", label: "Transparent" }
];
var LOG_DESIGNS = [
  { id: "strava", label: "Overlay stats" },
  { id: "full", label: "Photo" },
  { id: "clear", label: "Transparent" }
];
function clRenderSummaryDesign(ctx, W, H, design, model, data, img, cardBg) {
  if (design === "full") drawFullPhotoDesign(ctx, W, H, data, img, cardBg, true);
  else if (design === "clear") drawSummaryClear(ctx, W, H, model, img, cardBg);
  else if (design === "strava") drawSummaryOverlay(ctx, W, H, model, img);
  else drawSummaryBlurred(ctx, W, H, model, img, cardBg);
}
var CARD_SWATCHES = [null, "#F4F1E8", "#FFFFFF", "#22241F", "#1F3A5F", "#6B4C93", "#C4501F", "#D4A017"];
function clIsLight(hex) {
  if (!hex) return false;
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}
function clHexA(hex, a) {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}
function clTheme(light) {
  return light ? { text: "#22241F", soft: "#5B5A50", box: "#FFFFFF", boxStroke: "#D9D4C4", chipFill: "#FFFFFF", chipText: "#22241F", neutral: "#BDB6A3" } : { text: "#FFFFFF", soft: "rgba(255,255,255,0.75)", box: "rgba(255,255,255,0.13)", boxStroke: null, chipFill: "rgba(255,255,255,0.13)", chipText: "#FFFFFF", neutral: "rgba(255,255,255,0.5)" };
}
function clRoundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function clDrawCover(ctx, img, x, y, w, h, r) {
  ctx.save();
  clRoundRect(ctx, x, y, w, h, r || 0);
  ctx.clip();
  const scale = Math.max(w / img.width, h / img.height);
  const sw = img.width * scale, sh = img.height * scale;
  ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
  ctx.restore();
}
function clFitText(ctx, text, maxW, startPx, minPx, weight) {
  let px = startPx;
  ctx.font = `${weight || 800} ${px}px sans-serif`;
  while (px > minPx && ctx.measureText(text).width > maxW) {
    px -= 2;
    ctx.font = `${weight || 800} ${px}px sans-serif`;
  }
  return px;
}
function clDrawChips(ctx, items, cx, y, maxW, opts) {
  const o = Object.assign({ font: "700 24px sans-serif", h: 50, gap: 12, rowGap: 12, fill: "rgba(255,255,255,0.12)", text: "#FFFFFF", neutral: null, maxRows: 3 }, opts || {});
  ctx.font = o.font;
  const measured = items.map((it) => ({ ...it, label: (it.prefix || "") + it.text, w: ctx.measureText((it.prefix || "") + it.text).width + (it.color ? 62 : 40) }));
  const rows = [[]];
  let rowW = 0;
  measured.forEach((it) => {
    if (rows[rows.length - 1].length && rowW + o.gap + it.w > maxW) {
      rows.push([]);
      rowW = 0;
    }
    rows[rows.length - 1].push(it);
    rowW += (rowW ? o.gap : 0) + it.w;
  });
  const shownRows = rows.slice(0, o.maxRows);
  const hidden = measured.length - shownRows.reduce((n, r) => n + r.length, 0);
  let cy = y;
  shownRows.forEach((row, ri) => {
    let row2 = row;
    if (ri === shownRows.length - 1 && hidden > 0) row2 = [...row, { label: `+${hidden} more`, w: ctx.measureText(`+${hidden} more`).width + 40, color: null }];
    const total = row2.reduce((n, it) => n + it.w, 0) + o.gap * (row2.length - 1);
    let x = cx - total / 2;
    row2.forEach((it) => {
      clRoundRect(ctx, x, cy, it.w, o.h, o.h / 2);
      ctx.fillStyle = o.fill;
      ctx.fill();
      if (it.color || o.neutral) {
        ctx.lineWidth = it.color ? 3 : 2;
        ctx.strokeStyle = it.color || o.neutral;
        ctx.stroke();
      }
      if (it.color) {
        ctx.beginPath();
        ctx.arc(x + 26, cy + o.h / 2, 8, 0, Math.PI * 2);
        ctx.fillStyle = it.color;
        ctx.fill();
      }
      ctx.fillStyle = o.text;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(it.label, x + (it.color ? 44 : 20), cy + o.h / 2 + 1);
      ctx.textBaseline = "alphabetic";
      x += it.w + o.gap;
    });
    cy += o.h + o.rowGap;
  });
  return cy;
}
function clDrawStatBoxes(ctx, stats, x, y, w, h, opts) {
  const o = Object.assign({ fill: "rgba(255,255,255,0.12)", stroke: null, value: "#FFFFFF", label: "rgba(255,255,255,0.75)", gap: 14 }, opts || {});
  const bw = (w - o.gap * (stats.length - 1)) / stats.length;
  stats.forEach((st, i) => {
    const bx = x + i * (bw + o.gap);
    clRoundRect(ctx, bx, y, bw, h, 22);
    ctx.fillStyle = o.fill;
    ctx.fill();
    if (o.stroke) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = o.stroke;
      ctx.stroke();
    }
    ctx.textAlign = "center";
    ctx.fillStyle = o.value;
    clFitText(ctx, String(st.value), bw - 24, 54, 26, 800);
    const short = h < 130;
    if (short) clFitText(ctx, String(st.value), bw - 24, 40, 22, 800);
    ctx.fillText(String(st.value), bx + bw / 2, y + h / 2 + (short ? 4 : 10));
    ctx.font = short ? "600 17px sans-serif" : "600 21px sans-serif";
    ctx.fillStyle = o.label;
    ctx.fillText(st.label.toUpperCase(), bx + bw / 2, y + h / 2 + (short ? 32 : 46));
  });
}
function clGradeText(type, grade) {
  return type === "boulder" ? boulderLabel(grade) : usGrade(grade);
}
function clDayModel(d) {
  const best = d.bestType ? `${TYPE_LABELS[d.bestType]} ${clGradeText(d.bestType, d.bestGrade)}  \xB7  ${d.bestSent ? "Sent" : "Trying"}` : "";
  return {
    kicker: "BEST CLIMB",
    kickerColor: "#D4A017",
    date: d.date,
    title: d.bestTitle || "No climbs logged",
    subline: best,
    stats: [
      { value: d.totalClimbs || 0, label: (d.totalClimbs || 0) === 1 ? "climb" : "climbs" },
      { value: formatDuration(d.totalMinutes) || "0min", label: "time" },
      { value: d.totalSent || 0, label: "sent" }
    ],
    chipsTitle: "BY GRADE",
    chips: (d.byGrade || []).map((g) => ({ prefix: g.type === "boulder" ? "" : g.type === "toprope" ? "TR " : g.type === "lead" ? "Lead " : "", text: `${clGradeText(g.type, g.grade)}  \xD7${g.count}`, color: gradeColor(g.type, g.grade) })),
    points: d.points,
    beta: d.beta,
    hero: { value: d.totalClimbs || 0, label: (d.totalClimbs || 0) === 1 ? "CLIMB" : "CLIMBS" },
    heroLine: `${formatDuration(d.totalMinutes) || "0min"}   \xB7   ${d.totalSent || 0} sent`,
    name: d.name,
    place: d.place,
    fallbackColor: d.bestType ? gradeColor(d.bestType, d.bestGrade) : "#8A8578"
  };
}
function clLogModel(d) {
  const g = d.bestType ? clGradeText(d.bestType, d.bestGrade) : "";
  const gradeLabel = d.bestType ? `${TYPE_LABELS[d.bestType]} ${g}` : "";
  return {
    kicker: d.bestSent ? "SENT" : "PROJECT",
    kickerColor: d.bestSent ? "#6B8E4E" : "#D4A017",
    date: d.date,
    title: d.title || "Untitled",
    subline: [gradeLabel, d.gym].filter(Boolean).join("  \xB7  "),
    stats: [
      { value: d.totalTries || 0, label: d.totalTries === 1 ? "try" : "tries" },
      { value: formatDuration(d.totalMinutes) || "0min", label: "time" },
      { value: d.sessions || 1, label: (d.sessions || 1) === 1 ? "session" : "sessions" }
    ],
    chipsTitle: (d.techniques || []).length ? "TECHNIQUE" : "",
    chips: (d.techniques || []).map((t) => ({ prefix: "", text: t, color: null })),
    points: d.points,
    beta: d.beta,
    hero: { value: d.bestSent ? "SENT" : g || "\u2014", label: d.bestSent ? gradeLabel.toUpperCase() : "PROJECT" },
    clearKicker: "",
    clearSubline: d.gym || "",
    heroLine: `${d.totalTries || 0} ${d.totalTries === 1 ? "try" : "tries"}   \xB7   ${formatDuration(d.totalMinutes) || "0min"}`,
    name: d.name,
    place: d.place,
    fallbackColor: d.bestType ? gradeColor(d.bestType, d.bestGrade) : "#8A8578"
  };
}
function clDrawRouteLine(ctx, rx, ry, rw, rh, img, points, k, beta) {
  if (img && hasBeta(beta)) {
    const sc0 = Math.max(rw / img.width, rh / img.height);
    const sw0 = img.width * sc0, sh0 = img.height * sc0;
    drawBeta(ctx, { x: rx + (rw - sw0) / 2, y: ry + (rh - sh0) / 2, w: sw0, h: sh0 }, { x: rx, y: ry, w: rw, h: rh }, beta, k);
    return;
  }
  const pts = normalizePoints(points);
  if (!img || pts.start.length === 0 || pts.end.length === 0) return;
  const sc = Math.max(rw / img.width, rh / img.height);
  const sw = img.width * sc, sh = img.height * sc;
  const ox = rx + (rw - sw) / 2, oy = ry + (rh - sh) / 2;
  const clampP = (p) => ({ x: Math.min(rx + rw - 14 * k, Math.max(rx + 14 * k, ox + p.x / 100 * sw)), y: Math.min(ry + rh - 14 * k, Math.max(ry + 14 * k, oy + p.y / 100 * sh)) });
  const falls = pts.fall.map(clampP);
  const path = [...pts.start.map(clampP), ...falls, ...pts.end.map(clampP)];
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length - 1; i++) {
    const mx = (path[i].x + path[i + 1].x) / 2, my = (path[i].y + path[i + 1].y) / 2;
    ctx.quadraticCurveTo(path[i].x, path[i].y, mx, my);
  }
  const last = path[path.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.shadowColor = "rgba(255,75,31,0.9)";
  ctx.shadowBlur = 16 * k;
  ctx.strokeStyle = "#FF4B1F";
  ctx.lineWidth = 7 * k;
  ctx.stroke();
  ctx.shadowBlur = 0;
  const dot = (p, label, color) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 14 * k, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 3 * k;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 ${14 * k}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(label, p.x, p.y + 5 * k);
  };
  pts.start.map(clampP).forEach((p) => dot(p, "S", "#6B8E4E"));
  falls.forEach((p, i) => dot(p, String(i + 1), "#D4A017"));
  pts.end.map(clampP).forEach((p) => dot(p, "E", "#C4501F"));
  ctx.restore();
}
function drawSummaryOverlay(ctx, W, H, m, img) {
  const cx = W / 2;
  const pts = normalizePoints(m.points);
  const hasRoute = !!img && (hasBeta(m.beta) || pts.start.length > 0 && pts.end.length > 0);
  ctx.fillStyle = m.fallbackColor || "#2E3028";
  ctx.fillRect(0, 0, W, H);
  if (img) {
    ctx.save();
    ctx.filter = hasRoute ? "blur(22px)" : "none";
    clDrawCover(ctx, img, -30, -30, W + 60, H + 60, 0);
    ctx.restore();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(0,0,0," + (hasRoute ? 0.6 : 0.6) + ")");
    g.addColorStop(0.35, "rgba(0,0,0," + (hasRoute ? 0.5 : 0.3) + ")");
    g.addColorStop(0.6, "rgba(0,0,0," + (hasRoute ? 0.55 : 0.45) + ")");
    g.addColorStop(1, "rgba(0,0,0,0.78)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "800 56px sans-serif";
  if ("letterSpacing" in ctx) ctx.letterSpacing = "10px";
  ctx.fillText("CHALKLINE", cx + 5, 120);
  if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  ctx.font = "600 26px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(m.place || m.subline || "", cx, 166);
  ctx.shadowBlur = 0;
  const rows = (m.stats || []).slice(0, 3);
  if (hasRoute) {
    const tw = 360, th = 450, tx = (W - tw) / 2, ty = 225;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 30;
    clRoundRect(ctx, tx, ty, tw, th, 22);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.restore();
    clDrawCover(ctx, img, tx, ty, tw, th, 22);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    clRoundRect(ctx, tx, ty, tw, th, 22);
    ctx.fill();
    clDrawRouteLine(ctx, tx, ty, tw, th, img, m.points, 1, m.beta);
    const colW = (W - 100) / Math.max(rows.length, 1);
    rows.forEach((st, i) => {
      const x = 50 + colW * i + colW / 2;
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "700 54px sans-serif";
      ctx.fillText(String(st.value), x, 775);
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "600 22px sans-serif";
      ctx.fillText(st.label.toUpperCase(), x, 815);
    });
  } else {
    const top = H * 0.5;
    rows.forEach((st, i) => {
      const y = top + i * 120;
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "700 34px sans-serif";
      ctx.fillText(st.label.charAt(0).toUpperCase() + st.label.slice(1), cx, y);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "500 44px sans-serif";
      ctx.fillText(String(st.value), cx, y + 50);
    });
  }
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 14;
  ctx.font = "700 24px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "center";
  ctx.fillText([m.name, m.date].filter(Boolean).join("   \u00B7   "), cx, H - 44);
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.textAlign = "left";
}
function drawSummaryBlurred(ctx, W, H, m, img, bg) {
  const light = clIsLight(bg);
  const t = clTheme(light);
  ctx.fillStyle = bg || "#161712";
  ctx.fillRect(0, 0, W, H);
  if (img) {
    ctx.save();
    ctx.filter = light ? "blur(18px) brightness(1.05)" : "blur(18px) brightness(0.42)";
    const scale = Math.max(W / img.width, H / img.height) * 1.15;
    ctx.drawImage(img, (W - img.width * scale) / 2, (H - img.height * scale) / 2, img.width * scale, img.height * scale);
    ctx.restore();
    if (bg) {
      ctx.fillStyle = clHexA(bg, light ? 0.74 : 0.55);
      ctx.fillRect(0, 0, W, H);
    }
  }
  const cx = W / 2;
  ctx.textAlign = "center";
  ctx.font = "700 22px sans-serif";
  ctx.fillStyle = t.soft;
  ctx.fillText((m.date || "").toUpperCase(), cx, 96);
  ctx.font = "800 24px sans-serif";
  ctx.fillStyle = bg && !light && m.kickerColor === "#C4501F" ? "#F2B84B" : m.kickerColor;
  ctx.fillText(m.kicker, cx, 206);
  ctx.fillStyle = t.text;
  clFitText(ctx, m.title, W - 110, 60, 30, 800);
  ctx.fillText(m.title, cx, 276);
  ctx.font = "600 28px sans-serif";
  ctx.fillStyle = t.soft;
  ctx.fillText(m.subline, cx, 324);
  clDrawStatBoxes(ctx, m.stats, 50, 390, W - 100, 190, { fill: t.box, stroke: t.boxStroke, value: t.text, label: t.soft });
  if (m.bars && m.bars.length) {
    ctx.textAlign = "center";
    ctx.font = "700 20px sans-serif";
    ctx.fillStyle = t.soft;
    ctx.fillText(m.chipsTitle, cx, 656);
    clDrawBars(ctx, m.bars, 50, 668, W - 100, 186, t);
  } else if (m.chips.length) {
    ctx.textAlign = "center";
    ctx.font = "700 20px sans-serif";
    ctx.fillStyle = t.soft;
    ctx.fillText(m.chipsTitle, cx, 656);
    clDrawChips(ctx, m.chips, cx, 684, W - 100, { maxRows: 3, h: 54, font: "700 26px sans-serif", fill: t.chipFill, text: t.chipText, neutral: t.neutral });
  }
  ctx.textAlign = "center";
  ctx.font = "700 28px sans-serif";
  ctx.fillStyle = t.text;
  ctx.fillText(m.name || "", cx, H - 80);
  ctx.font = "500 20px sans-serif";
  ctx.fillStyle = t.soft;
  ctx.fillText(`${m.place ? m.place + "  \xB7  " : ""}CHALKLINE`, cx, H - 46);
  ctx.textAlign = "left";
}
function drawSummaryPhotoCard(ctx, W, H, m, img, bg) {
  const base = bg || "#F4F1E8";
  const t = clTheme(clIsLight(base));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  const px = 40, pw = W - 80, ph = 440;
  if (img) clDrawCover(ctx, img, px, 40, pw, ph, 28);
  else {
    clRoundRect(ctx, px, 40, pw, ph, 28);
    ctx.fillStyle = m.fallbackColor;
    ctx.fill();
    if (m.medal) clDrawMedal(ctx, W / 2, 40 + ph / 2 - 58, 112, m.medal.color, m.medal.text, m.medal.sub);
  }
  ctx.save();
  clRoundRect(ctx, px, 40, pw, ph, 28);
  ctx.clip();
  const grad = ctx.createLinearGradient(0, 40 + ph - 200, 0, 40 + ph);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.8)");
  ctx.fillStyle = grad;
  ctx.fillRect(px, 40 + ph - 200, pw, 200);
  ctx.restore();
  ctx.font = "800 20px sans-serif";
  const bw = ctx.measureText(m.kicker).width + 36;
  clRoundRect(ctx, px + 22, 62, bw, 42, 21);
  ctx.fillStyle = m.kickerColor;
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "left";
  ctx.fillText(m.kicker, px + 40, 90);
  clFitText(ctx, m.title, pw - 48, 46, 26, 800);
  ctx.fillText(m.title, px + 26, 40 + ph - 62);
  ctx.font = "600 24px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText(m.subline, px + 26, 40 + ph - 26);
  ctx.font = "700 21px sans-serif";
  ctx.fillStyle = t.soft;
  ctx.fillText((m.date || "").toUpperCase(), px, 526);
  ctx.textAlign = "right";
  ctx.fillText("CHALKLINE", px + pw, 526);
  clDrawStatBoxes(ctx, m.stats, px, 552, pw, 150, { fill: t.box, stroke: t.boxStroke, value: t.text, label: t.soft });
  if (m.bars && m.bars.length) {
    ctx.textAlign = "center";
    ctx.font = "700 20px sans-serif";
    ctx.fillStyle = t.soft;
    ctx.fillText(m.chipsTitle, W / 2, 752);
    clDrawBars(ctx, m.bars, px, 760, pw, 146, t);
  } else if (m.chips.length) {
    ctx.textAlign = "center";
    ctx.font = "700 20px sans-serif";
    ctx.fillStyle = t.soft;
    ctx.fillText(m.chipsTitle, W / 2, 752);
    clDrawChips(ctx, m.chips, W / 2, 774, pw, { fill: t.chipFill, text: t.chipText, neutral: t.neutral, maxRows: 2, h: 48 });
  }
  ctx.textAlign = "center";
  ctx.font = "700 26px sans-serif";
  ctx.fillStyle = t.text;
  ctx.fillText(`${m.name || ""}${m.place ? "  \xB7  " + m.place : ""}`, W / 2, H - 44);
  ctx.textAlign = "left";
}
function drawSummaryClear(ctx, W, H, m, bgImg, bg) {
  ctx.clearRect(0, 0, W, H);
  let light = false;
  if (bgImg) {
    clDrawCover(ctx, bgImg, 0, 0, W, H, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0.25)");
    g.addColorStop(0.5, "rgba(0,0,0,0.35)");
    g.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    light = clIsLight(bg);
  }
  const t = clTheme(light);
  const shadow = () => {
    if (light) return;
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 2;
  };
  const cx = W / 2;
  ctx.save();
  shadow();
  ctx.textAlign = "center";
  ctx.fillStyle = t.text;
  ctx.font = "700 24px sans-serif";
  ctx.fillText((m.date || "").toUpperCase(), cx, 96);
  clFitText(ctx, String(m.hero.value), W - 120, 200, 60, 800);
  ctx.fillText(String(m.hero.value), cx, 318);
  clFitText(ctx, m.hero.label, W - 120, 32, 20, 800);
  ctx.fillText(m.hero.label, cx, 368);
  ctx.font = "600 30px sans-serif";
  ctx.fillText(m.heroLine, cx, 424);
  ctx.font = "700 22px sans-serif";
  ctx.fillStyle = light ? t.soft : t.text;
  const ck = m.clearKicker !== void 0 ? m.clearKicker : m.kicker;
  if (ck) ctx.fillText(ck, cx, 520);
  ctx.fillStyle = t.text;
  clFitText(ctx, m.title, W - 120, 46, 26, 800);
  ctx.fillText(m.title, cx, 572);
  ctx.font = "600 26px sans-serif";
  ctx.fillText(m.clearSubline !== void 0 ? m.clearSubline : m.subline, cx, 612);
  ctx.restore();
  if (m.bars && m.bars.length) {
    ctx.save();
    shadow();
    clDrawBars(ctx, m.bars, 50, 648, W - 100, 190, light ? t : clTheme(false));
    ctx.restore();
  }
  else if (m.chips.length) clDrawChips(ctx, m.chips, cx, 668, W - 100, { fill: light ? t.chipFill : "rgba(0,0,0,0.28)", text: t.chipText, neutral: light ? t.neutral : "rgba(255,255,255,0.55)", maxRows: 2, h: 48 });
  ctx.save();
  shadow();
  ctx.textAlign = "center";
  ctx.fillStyle = t.text;
  ctx.font = "700 28px sans-serif";
  ctx.fillText(m.name || "", cx, H - 82);
  ctx.font = "600 20px sans-serif";
  ctx.fillText("CHALKLINE", cx, H - 48);
  ctx.restore();
  ctx.textAlign = "left";
}
function generateQRDataUrl(text, size) {
  return new Promise((resolve, reject) => {
    loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js", () => !!window.QRCode).then(() => {
      const div = document.createElement("div");
      new window.QRCode(div, { text, width: size, height: size, colorDark: "#22241F", colorLight: "#FFFFFF" });
      setTimeout(() => {
        const img = div.querySelector("img");
        const canvas = div.querySelector("canvas");
        if (img && img.src) resolve(img.src);
        else if (canvas) resolve(canvas.toDataURL());
        else reject(new Error("QR generation failed"));
      }, 60);
    }).catch(reject);
  });
}
var NAME_TAG_DESIGNS = [
  { id: "blurred", label: "Blurred" },
  { id: "classic", label: "Classic" }
];
function drawNameTagBlurred(ctx, W, H, data, img, qrImg) {
  ctx.fillStyle = "#161712";
  ctx.fillRect(0, 0, W, H);
  if (img) {
    ctx.save();
    ctx.filter = "blur(24px) brightness(0.45)";
    const scale = Math.max(W / img.width, H / img.height) * 1.15;
    const sw = img.width * scale, sh = img.height * scale;
    ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
    ctx.restore();
  }
  const cx = W / 2, photoR = 140, photoCy = H * 0.34;
  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, photoCy, photoR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const scale2 = Math.max(photoR * 2 / img.width, photoR * 2 / img.height);
    const sw2 = img.width * scale2, sh2 = img.height * scale2;
    ctx.drawImage(img, cx - sw2 / 2, photoCy - sh2 / 2, sw2, sh2);
    ctx.restore();
  }
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx, photoCy, photoR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = "800 54px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(data.name || "", cx, photoCy + photoR + 74);
  ctx.font = "600 23px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(`@${data.username || ""}`, cx, photoCy + photoR + 110);
  ctx.font = "500 19px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  let y = photoCy + photoR + 146;
  (data.statsLines || []).slice(0, 2).forEach((line) => {
    ctx.fillText(line, cx, y);
    y += 28;
  });
  drawNameTagFooter(ctx, W, H, qrImg);
}
function drawNameTagClassic(ctx, W, H, data, img, qrImg) {
  ctx.fillStyle = data.accentColor || "#22241F";
  ctx.fillRect(0, 0, W, H);
  const cx = W / 2, photoR = 150, photoCy = H * 0.32;
  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, photoCy, photoR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const scale = Math.max(photoR * 2 / img.width, photoR * 2 / img.height);
    const sw = img.width * scale, sh = img.height * scale;
    ctx.drawImage(img, cx - sw / 2, photoCy - sh / 2, sw, sh);
    ctx.restore();
  }
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx, photoCy, photoR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = "800 56px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(data.name || "", cx, photoCy + photoR + 80);
  ctx.font = "600 24px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(`@${data.username || ""}`, cx, photoCy + photoR + 118);
  ctx.font = "500 20px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  let y = photoCy + photoR + 156;
  (data.statsLines || []).slice(0, 2).forEach((line) => {
    ctx.fillText(line, cx, y);
    y += 30;
  });
  drawNameTagFooter(ctx, W, H, qrImg);
}
function drawNameTagFooter(ctx, W, H, qrImg) {
  if (qrImg) {
    const qs = 130, margin = 34;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(W - qs - margin - 10, H - qs - margin - 10, qs + 20, qs + 20);
    ctx.drawImage(qrImg, W - qs - margin, H - qs - margin, qs, qs);
  }
  ctx.textAlign = "left";
  ctx.font = "700 16px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("CHALKLINE", 34, H - 34);
}
function clSummarySrc(design, customBg, heroPhoto, data) {
  return design === "clear" ? customBg : design === "blur" || design === "strava" ? heroPhoto || data.photo : design === "full" ? data.photo : heroPhoto;
}
function ShareCardModal({ data, onClose }) {
  const [thumbs, setThumbs] = useState({});
  const canvasRef = useRef();
  const [imgUrl, setImgUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const isProfile = data.variant === "profile";
  const isToday = data.variant === "today";
  const isLog = data.variant === "log";
  const isBadgeCard = data.variant === "badge";
  const isProgress = data.variant === "progress";
  const isSummary = isToday || isLog || isBadgeCard || isProgress;
  const designs = isProfile ? NAME_TAG_DESIGNS : isLog ? (hasBeta(data.beta) ? LOG_DESIGNS.map((d) => d.id === "full" ? { ...d, label: "Beta" } : d) : LOG_DESIGNS) : isSummary ? SUMMARY_DESIGNS : SHARE_DESIGNS;
  const [design, setDesign] = useState(isProfile ? "blurred" : isLog && hasBeta(data.beta) ? "full" : isToday || isLog ? "strava" : isSummary ? "blur" : "badge");
  const [customBg, setCustomBg] = useState(null);
  const [cardBg, setCardBg] = useState(null);
  useEffect(() => {
    if (!data.username || !navigator.clipboard) return;
    const link = `${window.location.origin}${window.location.pathname}?u=${encodeURIComponent(data.username)}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    }).catch(() => {
    });
  }, [data.username]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = 800, H = 1e3;
    canvas.width = W;
    canvas.height = H;
    const finish = () => setImgUrl(canvas.toDataURL("image/png"));
    if (isProfile) {
      const link = `${window.location.origin}${window.location.pathname}?u=${encodeURIComponent(data.username || "")}`;
      const loadPhoto = data.photo ? new Promise((resolve) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => resolve(null);
        im.src = data.photo;
      }) : Promise.resolve(null);
      const loadQr = generateQRDataUrl(link, 260).then((url) => new Promise((resolve) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => resolve(null);
        im.src = url;
      })).catch(() => null);
      Promise.all([loadPhoto, loadQr]).then(([photoImg, qrImg]) => {
        if (design === "classic") drawNameTagClassic(ctx, W, H, data, photoImg, qrImg);
        else drawNameTagBlurred(ctx, W, H, data, photoImg, qrImg);
        finish();
      });
      return;
    }
    if (isSummary) {
      const model = isToday ? clDayModel(data) : isBadgeCard ? clBadgeModel(data) : isProgress ? clProgressModel(data) : clLogModel(data);
      const heroPhoto = isToday ? data.bestPhoto : isLog ? data.photo : null;
      const renderCard = (img2) => {
        clRenderSummaryDesign(ctx, W, H, design, model, data, img2, cardBg);
        finish();
      };
      const src = clSummarySrc(design, customBg, heroPhoto, data);
      if (src) {
        const img = new Image();
        img.onload = () => renderCard(img);
        img.onerror = () => renderCard(null);
        img.src = src;
      } else {
        renderCard(null);
      }
      return;
    }
    const render = (img) => {
      if (design === "stats") drawStatsDesign(ctx, W, H, data, img);
      else if (design === "photo") drawFullPhotoDesign(ctx, W, H, data, img);
      else drawBadgeDesign(ctx, W, H, data, img);
      finish();
    };
    if (data.photo) {
      const img = new Image();
      img.onload = () => render(img);
      img.onerror = () => render(null);
      img.src = data.photo;
    } else {
      render(null);
    }
  }, [data, design, customBg, cardBg]);
  useEffect(() => {
    if (!isSummary) return void 0;
    let dead = false;
    const model = isToday ? clDayModel(data) : isBadgeCard ? clBadgeModel(data) : isProgress ? clProgressModel(data) : clLogModel(data);
    const heroPhoto = isToday ? data.bestPhoto : isLog ? data.photo : null;
    designs.forEach((d) => {
      const go = (img) => {
        if (dead) return;
        const full = document.createElement("canvas");
        full.width = 800; full.height = 1e3;
        clRenderSummaryDesign(full.getContext("2d"), 800, 1e3, d.id, model, data, img, cardBg);
        const sm = document.createElement("canvas");
        sm.width = 160; sm.height = 200;
        const sc = sm.getContext("2d");
        sc.fillStyle = "#2a2a2a"; sc.fillRect(0, 0, 160, 200);
        sc.drawImage(full, 0, 0, 160, 200);
        setThumbs((t) => ({ ...t, [d.id]: sm.toDataURL("image/jpeg", 0.8) }));
      };
      const src = clSummarySrc(d.id, customBg, heroPhoto, data);
      if (src) { const im = new Image(); im.onload = () => go(im); im.onerror = () => go(null); im.src = src; } else go(null);
    });
    return () => { dead = true; };
  }, [data, customBg, cardBg]);
  const download = async () => {
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "chalkline-share.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2e3);
    } catch {
      window.open(imgUrl, "_blank");
    }
  };
  const shareImage = async () => {
    const link = isProfile ? `${window.location.origin}${window.location.pathname}?u=${encodeURIComponent(data.username || "")}` : null;
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const file = new File([blob], "chalkline-share.png", { type: "image/png" });
      const shareOpts = { files: [file], title: "Chalkline", text: data.achievement || "" };
      if (link) shareOpts.url = link;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareOpts);
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: "Chalkline", text: data.achievement || "", ...link ? { url: link } : {} });
        return;
      }
      download();
    } catch {
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay cl-layer-top" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, "Share"), /* @__PURE__ */ React.createElement("div", { style: { width: 32 } })), copied && /* @__PURE__ */ React.createElement("p", { className: "cl-copied-toast" }, "Link copied to clipboard"), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body", style: { textAlign: "center" } }, !isSummary && /* @__PURE__ */ React.createElement("div", { className: "cl-segmented cl-design-picker", role: "tablist" }, designs.map((d) => /* @__PURE__ */ React.createElement("button", { key: d.id, className: design === d.id ? "cl-segment active" : "cl-segment", onClick: () => setDesign(d.id), role: "tab", "aria-selected": design === d.id }, d.label))), isSummary && React.createElement("div", { className: "cl-design-thumbs" }, designs.map((d) => React.createElement("button", { key: d.id, type: "button", className: design === d.id ? "cl-design-thumb active" : "cl-design-thumb", onClick: () => setDesign(d.id), "aria-label": d.label }, thumbs[d.id] ? React.createElement("img", { src: thumbs[d.id], alt: d.label }) : React.createElement("span", null, "\u2026"), React.createElement("small", null, d.label)))), /* @__PURE__ */ React.createElement("canvas", { ref: canvasRef, style: { display: "none" } }), imgUrl ? /* @__PURE__ */ React.createElement("img", { src: imgUrl, alt: "share card", className: isSummary && design === "clear" && !customBg && !cardBg ? "cl-share-preview cl-share-transparent" : "cl-share-preview" }) : /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, "Rendering\u2026"), isSummary && /* @__PURE__ */ React.createElement("div", { className: "cl-swatches", role: "radiogroup", "aria-label": "Card background color" }, CARD_SWATCHES.map((c) => /* @__PURE__ */ React.createElement("button", { key: c || "auto", className: (cardBg === c ? "cl-swatch active" : "cl-swatch") + (c ? "" : " cl-swatch-auto"), style: c ? { background: c } : void 0, role: "radio", "aria-checked": cardBg === c, "aria-label": c ? `Background ${c}` : design === "clear" ? "No background" : "Default background", onClick: () => { setCardBg(c); if (c) setCustomBg(null); } }))), isSummary && design === "clear" && /* @__PURE__ */ React.createElement("div", { className: "cl-bg-options" }, /* @__PURE__ */ React.createElement("p", { className: "cl-hint", style: { margin: "0 0 8px" } }, customBg ? customBg === data.photo ? "Using the climb's wall photo." : "Using your photo as the background." : cardBg ? "Solid color background." : "Transparent PNG \u2014 place it over any photo or story."), /* @__PURE__ */ React.createElement("div", { className: "cl-bg-buttons" }, /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*", id: "cl-card-bg", className: "cl-file-hidden", onChange: async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; setCustomBg(await resizeImage(f, 1200, 0.85)); setCardBg(null); e.target.value = ""; } }), /* @__PURE__ */ React.createElement("label", { htmlFor: "cl-card-bg", className: "cl-bg-btn" }, /* @__PURE__ */ React.createElement(Images, { size: 16 }), customBg && customBg !== data.photo ? " Change photo" : " My photo"), isLog && data.photo && customBg !== data.photo && /* @__PURE__ */ React.createElement("button", { className: "cl-bg-btn", onClick: () => { setCustomBg(data.photo); setCardBg(null); } }, /* @__PURE__ */ React.createElement(Mountain, { size: 16 }), " Wall photo"), customBg && /* @__PURE__ */ React.createElement("button", { className: "cl-bg-btn", onClick: () => setCustomBg(null) }, "Transparent"))), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: shareImage, disabled: !imgUrl }, /* @__PURE__ */ React.createElement(Share2, { size: 15, style: { marginRight: 6 } }), " Share"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost cl-share-download-btn", onClick: download, disabled: !imgUrl }, /* @__PURE__ */ React.createElement(Download, { size: 13, style: { marginRight: 4 } }), " Download image")));
}
function GuestProfileView({ username, onGoToLogin }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await window.chalklineGuest.getProfileByUsername(username);
      if (cancelled) return;
      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(p);
      const posts2 = await window.chalklineGuest.getPublicPosts(p.slug);
      if (cancelled) return;
      setPosts((posts2 || []).map(normalizeClimbEntry));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);
  return /* @__PURE__ */ React.createElement("div", { className: "cl-onboard", style: { alignItems: "flex-start", paddingTop: 40 } }, /* @__PURE__ */ React.createElement("div", { className: "cl-onboard-card", style: { maxWidth: 460 } }, /* @__PURE__ */ React.createElement("div", { className: "cl-guest-banner" }, /* @__PURE__ */ React.createElement(Mountain, { size: 16 }), /* @__PURE__ */ React.createElement("span", null, "Viewing on Chalkline"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", style: { marginTop: 0, width: "auto", padding: "6px 14px", fontSize: 12 }, onClick: onGoToLogin }, "Log in / Sign up")), loading && /* @__PURE__ */ React.createElement("p", { className: "cl-sub", style: { marginTop: 16 } }, "Loading\u2026"), notFound && /* @__PURE__ */ React.createElement("p", { className: "cl-empty", style: { marginTop: 16 } }, "Couldn't find that profile."), profile && /* @__PURE__ */ React.createElement("div", { className: "cl-guest-clickable", onClick: onGoToLogin }, /* @__PURE__ */ React.createElement("div", { className: "cl-badge-top", style: { marginTop: 16 } }, /* @__PURE__ */ React.createElement(Avatar, { name: profile.name, photo: profile.photo, size: 56 }), /* @__PURE__ */ React.createElement("div", { className: "cl-badge-id" }, /* @__PURE__ */ React.createElement("h2", null, profile.name), /* @__PURE__ */ React.createElement("p", { className: "cl-sub cl-nowrap" }, profile.since ? `Since ${(/* @__PURE__ */ new Date(profile.since + "-01")).toLocaleDateString(void 0, { month: "short", year: "2-digit" })}` : ""), /* @__PURE__ */ React.createElement("p", { className: "cl-id-text" }, "@", profile.username))), /* @__PURE__ */ React.createElement("div", { className: "cl-chip-row" }, /* @__PURE__ */ React.createElement(GradeChip, { type: "boulder", grade: profile.boulder }), /* @__PURE__ */ React.createElement(GradeChip, { type: "toprope", grade: profile.route, label: "Route" })), profile.qualifications && profile.qualifications.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "cl-gear-row" }, profile.qualifications.map((q, i) => {
    const Ic = QUALIFICATION_ICONS[q] || GraduationCap;
    return /* @__PURE__ */ React.createElement("span", { className: "cl-gear-pill cl-qual-pill", key: i }, /* @__PURE__ */ React.createElement(Ic, { size: 11 }), " ", q);
  }))), profile && posts.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "cl-guest-posts", onClick: onGoToLogin }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption", style: { marginTop: 18 } }, "Public posts"), posts.slice(0, 8).map((entry) => {
    const isDeal = entry.kind === "deal";
    const latest = !isDeal && entry.updates ? entry.updates[entry.updates.length - 1] : null;
    const photo = entry.photo;
    return /* @__PURE__ */ React.createElement("div", { className: "cl-guest-post", key: entry.id }, photo && /* @__PURE__ */ React.createElement("img", { src: photo, alt: "", className: "cl-guest-post-photo" }), /* @__PURE__ */ React.createElement("div", { className: "cl-guest-post-title" }, entry.title), !isDeal && latest && /* @__PURE__ */ React.createElement("div", { className: "cl-chip-row", style: { marginTop: 4 } }, (latest.climbs || []).map((c, i) => /* @__PURE__ */ React.createElement(GradeChip, { key: i, type: c.type, grade: c.grade, status: c.status }))));
  })), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", style: { marginTop: 18 }, onClick: onGoToLogin }, "Log in or sign up to see more")));
}
function SocialPostForm({ myLogs, onCancel, onSave, initialAttachedLogId }) {
  const [caption, setCaption] = useState("");
  const [photos, setPhotos] = useState([]);
  const [attachedLogId, setAttachedLogId] = useState(initialAttachedLogId || null);
  const [privacy, setPrivacy] = useState("public");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const addPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const dataUrl = await resizeImage(f);
    setPhotos((prev) => [...prev, dataUrl]);
    e.target.value = "";
  };
  const removePhoto = (i) => setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  const submit = async () => {
    if (photos.length === 0 && !caption.trim()) {
      setError("Add a photo or write something.");
      return;
    }
    setError("");
    setSaving(true);
    await onSave({ caption: caption.trim(), photos, attachedLogId, privacy });
    setSaving(false);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-card cl-form-card" }, /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Photos"), /* @__PURE__ */ React.createElement("div", { className: "cl-multi-photo-row" }, photos.map((p, i) => /* @__PURE__ */ React.createElement("div", { className: "cl-multi-photo-thumb", key: i }, /* @__PURE__ */ React.createElement("img", { src: p, alt: "" }), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => removePhoto(i) }, /* @__PURE__ */ React.createElement(X, { size: 12 })))), /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*", onChange: addPhoto, className: "cl-file-hidden", id: "social-photo-add" }), /* @__PURE__ */ React.createElement("label", { htmlFor: "social-photo-add", className: "cl-multi-photo-add" }, /* @__PURE__ */ React.createElement(Plus, { size: 18 }))), /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "Add as many as you like \u2014 each is resized automatically, up to ~900px wide.")), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Caption"), /* @__PURE__ */ React.createElement("textarea", { className: "cl-input cl-textarea", placeholder: "Share what's on your mind\u2026", value: caption, onChange: (e) => setCaption(e.target.value) })), myLogs.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Attach a climb (optional)"), /* @__PURE__ */ React.createElement("div", { className: "cl-attach-log-list" }, myLogs.slice().sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)).map((l) => {
    const best = bestUpdate(l.updates);
    const success = (best.climbs || []).some((c) => c.status === "sent");
    const selected = attachedLogId === l.id;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: l.id,
        type: "button",
        className: selected ? "cl-attach-log-row selected" : "cl-attach-log-row",
        onClick: () => setAttachedLogId(selected ? null : l.id)
      },
      /* @__PURE__ */ React.createElement("div", { className: "cl-attach-log-check" }, selected && /* @__PURE__ */ React.createElement(Check, { size: 13 })),
      best.photo ? /* @__PURE__ */ React.createElement("img", { src: best.photo, alt: "", className: "cl-attach-log-thumb" }) : /* @__PURE__ */ React.createElement("div", { className: "cl-attach-log-thumb cl-attach-log-thumb-empty" }, /* @__PURE__ */ React.createElement(Mountain, { size: 14 })),
      /* @__PURE__ */ React.createElement("div", { className: "cl-attach-log-info" }, /* @__PURE__ */ React.createElement("span", { className: "cl-attach-log-title" }, l.title), /* @__PURE__ */ React.createElement("span", { className: "cl-attach-log-meta" }, l.gym, " \xB7 ", timeAgo(best.timestamp || l.createdAt))),
      /* @__PURE__ */ React.createElement("div", { className: "cl-attach-log-right" }, (best.climbs || []).slice(0, 1).map((c, i) => /* @__PURE__ */ React.createElement(GradeChip, { key: i, type: c.type, grade: c.grade })), /* @__PURE__ */ React.createElement("span", { className: success ? "cl-status cl-status-sent" : "cl-status cl-status-trying" }, success ? sentLabel(best.climbs) : "Trying"))
    );
  }))), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Who can see this?"), /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, /* @__PURE__ */ React.createElement("button", { className: privacy === "public" ? "cl-toggle active" : "cl-toggle", onClick: () => setPrivacy("public") }, /* @__PURE__ */ React.createElement(Globe, { size: 13 }), " Public"), /* @__PURE__ */ React.createElement("button", { className: privacy === "private" ? "cl-toggle active" : "cl-toggle", onClick: () => setPrivacy("private") }, /* @__PURE__ */ React.createElement(Lock, { size: 13 }), " Private"))), error && /* @__PURE__ */ React.createElement("p", { className: "cl-error" }, error), /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons" }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: onCancel }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: submit, disabled: saving }, saving ? "Posting\u2026" : "Post")));
}
function SocialPostOverlay({ myLogs, onClose, onSavePost, initialAttachedLogId }) {
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay cl-layer-top" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, "New post"), /* @__PURE__ */ React.createElement("div", { style: { width: 32 } })), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body" }, /* @__PURE__ */ React.createElement(SocialPostForm, { myLogs, onCancel: onClose, onSave: async (data) => {
    await onSavePost(data);
    onClose();
  }, initialAttachedLogId })));
}
function SharePostModal({ entry, profile, me, profiles, onClose }) {
  const [copied, setCopied] = useState(false);
  const isDeal = entry.kind === "deal";
  const shareText = isDeal ? entry.title : entry.caption;
  const noun = isDeal ? "deal" : "post";
  const link = `${window.location.origin}${window.location.pathname}?u=${encodeURIComponent(profile && profile.username || profile && profile.slug || "")}&post=${encodeURIComponent(entry.id)}`;
  useEffect(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2e3);
      }).catch(() => {
      });
    }
  }, [link]);
  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Chalkline", text: shareText || "Check this out on Chalkline", url: link });
        return;
      } catch {
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }).catch(() => {
      });
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay cl-layer-top" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, "Share ", noun), /* @__PURE__ */ React.createElement("div", { style: { width: 32 } })), copied && /* @__PURE__ */ React.createElement("p", { className: "cl-copied-toast" }, "Link copied to clipboard"), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body" }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: shareLink }, /* @__PURE__ */ React.createElement(ExternalLink, { size: 14, style: { marginRight: 6 } }), " ", copied ? "Link copied!" : "Share link"), /* @__PURE__ */ React.createElement("p", { className: "cl-hint", style: { marginTop: 6 } }, "Opens your device's share sheet \u2014 WhatsApp, Messages, or anywhere else. Copies the link if that's not available.")));
}
function SocialPostCard({ entry, profile, comments, me, allLogs, onComment, onKudo, onDelete, onToggleSave, onOpenProfile, onEnlarge, onShare, onOpenLogDetail }) {
  const [text, setText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(1.25);
  const scrollRef = useRef();
  const kudos = entry.kudos || [];
  const kudoed = kudos.includes(me);
  const saved = (entry.savedBy || []).includes(me);
  const isMine = entry.authorSlug === me;
  const photos = entry.photos || [];
  const attachedLog = entry.attachedLogId ? (allLogs || []).find((l) => l.id === entry.attachedLogId) : null;
  const attachedUpdate = attachedLog && attachedLog.updates && attachedLog.updates.length > 0 ? attachedLog.updates[attachedLog.updates.length - 1] : null;
  const attachedClimb = attachedUpdate && attachedUpdate.climbs && attachedUpdate.climbs.length > 0 ? attachedUpdate.climbs[0] : null;
  useEffect(() => {
    if (!photos[0]) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) setAspectRatio(img.naturalWidth / img.naturalHeight);
    };
    img.src = photos[0];
  }, [photos[0]]);
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || !el.clientWidth) return;
    setPhotoIdx(Math.round(el.scrollLeft / el.clientWidth));
  };
  const submitComment = async () => {
    if (!text.trim()) return;
    await onComment(entry.id, text.trim());
    setText("");
  };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-card" }, /* @__PURE__ */ React.createElement("div", { className: "cl-card-head" }, /* @__PURE__ */ React.createElement(
    ClickableIdentity,
    {
      name: profile?.name || entry.authorName,
      photo: profile?.photo,
      size: 34,
      onClick: () => onOpenProfile(entry.authorSlug),
      sub: timeAgo(entry.createdAt)
    }
  ), isMine && /* @__PURE__ */ React.createElement(ConfirmButton, { onConfirm: () => onDelete(entry.id), icon: /* @__PURE__ */ React.createElement(Trash2, { size: 14 }), title: "Delete" })), photos.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "cl-photo-wrap", style: { aspectRatio, cursor: "default" } }, /* @__PURE__ */ React.createElement("div", { className: "cl-photo-scroll", ref: scrollRef, onScroll }, photos.map((p, i) => /* @__PURE__ */ React.createElement("img", { key: i, src: p, alt: "", className: "cl-photo-slide", style: { cursor: "default" } }))), photos.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "cl-photo-dots" }, photos.map((_, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: i === photoIdx ? "cl-photo-dot active" : "cl-photo-dot" })))), /* @__PURE__ */ React.createElement("div", { className: "cl-ig-actions" }, /* @__PURE__ */ React.createElement("button", { className: kudoed ? "cl-ig-icon active" : "cl-ig-icon", onClick: () => onKudo(entry.id), title: "Nice" }, /* @__PURE__ */ React.createElement(Heart, { size: 22, fill: kudoed ? "currentColor" : "none" })), /* @__PURE__ */ React.createElement("button", { className: "cl-ig-icon", onClick: () => setShowComments((v) => !v), title: "Comment" }, /* @__PURE__ */ React.createElement(MessageCircle, { size: 22 })), /* @__PURE__ */ React.createElement("button", { className: "cl-ig-icon", onClick: () => onShare(entry), title: "Share" }, /* @__PURE__ */ React.createElement(Share2, { size: 22 })), /* @__PURE__ */ React.createElement("div", { className: "cl-controls-spacer" })), kudos.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-ig-likes" }, kudos.length, " ", kudos.length === 1 ? "like" : "likes"), /* @__PURE__ */ React.createElement("div", { className: "cl-card-body" }, entry.caption && /* @__PURE__ */ React.createElement("p", { className: "cl-ig-caption" }, /* @__PURE__ */ React.createElement("b", null, profile?.name || entry.authorName), " ", entry.caption), attachedLog && /* @__PURE__ */ React.createElement("button", { className: "cl-attached-log", onClick: () => onOpenLogDetail(attachedLog) }, /* @__PURE__ */ React.createElement(Layers, { size: 13 }), /* @__PURE__ */ React.createElement("span", null, attachedLog.title), attachedClimb && /* @__PURE__ */ React.createElement(GradeChip, { type: attachedClimb.type, grade: attachedClimb.grade, status: attachedClimb.status }), /* @__PURE__ */ React.createElement(ChevronRight, { size: 14, style: { marginLeft: "auto" } })), !showComments && /* @__PURE__ */ React.createElement("button", { className: "cl-ig-viewcomments", onClick: () => setShowComments(true) }, comments.length > 0 ? `View all ${comments.length} comment${comments.length === 1 ? "" : "s"}` : "Add a comment\u2026"), showComments && /* @__PURE__ */ React.createElement("div", { className: "cl-comments" }, comments.map((c, i) => /* @__PURE__ */ React.createElement("div", { className: "cl-comment", key: i }, /* @__PURE__ */ React.createElement("b", null, c.authorName), " ", c.text)), /* @__PURE__ */ React.createElement("div", { className: "cl-comment-input" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "cl-input",
      placeholder: "Say something\u2026",
      value: text,
      onChange: (e) => setText(e.target.value),
      onKeyDown: (e) => e.key === "Enter" && submitComment()
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: submitComment }, /* @__PURE__ */ React.createElement(Send, { size: 15 }))))));
}
function NewPostOverlay({ defaultGym, logs, onClose, onSaveLog, onAddTry }) {
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay cl-layer-top" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, "New log"), /* @__PURE__ */ React.createElement("div", { style: { width: 32 } })), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body" }, /* @__PURE__ */ React.createElement(
    NewPostForm,
    {
      defaultGym,
      logs,
      onCancel: onClose,
      onAddTry: async (id, data) => {
        await onAddTry(id, data);
        onClose();
      },
      onSaveLog: async (data) => {
        await onSaveLog(data);
        onClose();
      }
    }
  )));
}
function SettingsOverlay({ profile, onSave, onClose, onDeleteAccount }) {
  const [draft, setDraft] = useState(profile);
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteError, setDeleteError] = useState("");
  const save = async () => {
    await onSave(draft);
    onClose();
  };
  const toggleTracked = (t) => {
    const cur = draft.trackedTypes && draft.trackedTypes.length > 0 ? draft.trackedTypes : DEFAULT_TRACKED_TYPES;
    setDraft({ ...draft, trackedTypes: cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t] });
  };
  const confirmDelete = async () => {
    setDeleteError("");
    setDeleteStep(2);
    const result = await onDeleteAccount();
    if (result && result.error) {
      setDeleteError(result.error);
      setDeleteStep(1);
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, "Settings"), /* @__PURE__ */ React.createElement("div", { style: { width: 32 } })), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body" }, /* @__PURE__ */ React.createElement("div", { className: "cl-set-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-set-title" }, "Profile"), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Profile picture"), /* @__PURE__ */ React.createElement(PhotoPicker, { value: draft.photo, onChange: (p) => setDraft({ ...draft, photo: p }), idSuffix: "settings" }), /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "Resized automatically \u2014 any size you upload works fine."), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Name"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: draft.name, onChange: (e) => setDraft({ ...draft, name: e.target.value }) }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Username"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: draft.username || "", onChange: (e) => setDraft({ ...draft, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }), placeholder: "e.g. aiman_climbs" }), /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "Your short, shareable ID \u2014 used for search and QR."), ), /* @__PURE__ */ React.createElement("div", { className: "cl-set-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-set-title" }, "Climbing"), /* @__PURE__ */ React.createElement("div", { className: "cl-two-col" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Boulder level"), /* @__PURE__ */ React.createElement("select", { className: "cl-input", value: draft.boulder, onChange: (e) => setDraft({ ...draft, boulder: e.target.value }) }, PROFILE_BOULDER_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }, boulderOptionLabel(g))))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Route level"), /* @__PURE__ */ React.createElement("select", { className: "cl-input", value: draft.route || "NA", onChange: (e) => setDraft({ ...draft, route: e.target.value }) }, PROFILE_ROUTE_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }, routeGradeLabel(g)))))), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Climbing since"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", type: "month", value: draft.since, onChange: (e) => setDraft({ ...draft, since: e.target.value }) }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Qualifications"), /* @__PURE__ */ React.createElement(
    TagEditor,
    {
      options: QUALIFICATION_PRESETS,
      selected: draft.qualifications || [],
      setSelected: (q) => setDraft({ ...draft, qualifications: q }),
      placeholder: "Add your own",
      iconMap: QUALIFICATION_ICONS
    }
  ), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Gear"), /* @__PURE__ */ React.createElement(GearEditor, { gear: draft.gear || [], setGear: (gear) => setDraft({ ...draft, gear }) }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Main gym"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: draft.mainGym || "", onChange: (e) => setDraft({ ...draft, mainGym: e.target.value }), list: "cl-gyms-settings", placeholder: "Search or type your gym\u2026" }), /* @__PURE__ */ React.createElement("datalist", { id: "cl-gyms-settings" }, GYM_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }))), ), /* @__PURE__ */ React.createElement("div", { className: "cl-set-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-set-title" }, "Preferences"), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Appearance"), /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, [["light", "Light"], ["dark", "Dark"], ["system", "Match device"]].map(([val, lbl]) => /* @__PURE__ */ React.createElement("button", { key: val, className: (draft.themeMode || "dark") === val ? "cl-toggle active" : "cl-toggle", onClick: () => setDraft({ ...draft, themeMode: val }) }, lbl))), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Boulder grades"), /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, [["v", "V-scale (V4)"], ["font", "Font (6B)"]].map(([val, lbl]) => /* @__PURE__ */ React.createElement("button", { key: val, className: (draft.boulderScale || "v") === val ? "cl-toggle active" : "cl-toggle", onClick: () => setDraft({ ...draft, boulderScale: val }) }, lbl)))), /* @__PURE__ */ React.createElement("div", { className: "cl-set-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-set-title" }, "Account"), /* @__PURE__ */ React.createElement("p", { className: "cl-hint", style: { marginTop: 0 } }, "Your password is managed securely through your account \u2014 there's no separate passcode to set here anymore."), /* @__PURE__ */ React.createElement("div", { className: "cl-danger-zone" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption", style: { color: "var(--accent2)" } }, "Danger zone"), deleteStep === 0 && /* @__PURE__ */ React.createElement("button", { className: "cl-btn-danger", onClick: () => setDeleteStep(1) }, /* @__PURE__ */ React.createElement(Trash2, { size: 14, style: { marginRight: 6 } }), " Delete my account"), deleteStep === 1 && /* @__PURE__ */ React.createElement("div", { className: "cl-danger-confirm" }, /* @__PURE__ */ React.createElement("p", { className: "cl-note" }, "This permanently deletes your profile, posts, and hosted sessions, and removes your login. This can't be undone."), deleteError && /* @__PURE__ */ React.createElement("p", { className: "cl-error" }, deleteError), /* @__PURE__ */ React.createElement("p", { className: "cl-note", style: { fontWeight: 700 } }, "Are you sure you want to continue?"), /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons" }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: () => {
    setDeleteStep(0);
    setDeleteError("");
  } }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", style: { marginTop: 0, background: "var(--accent2)" }, onClick: () => setDeleteStep(1.5) }, "Yes, continue"))), deleteStep === 1.5 && /* @__PURE__ */ React.createElement("div", { className: "cl-danger-confirm" }, /* @__PURE__ */ React.createElement("p", { className: "cl-note", style: { fontWeight: 700 } }, "Last chance \u2014 this really cannot be undone. Delete your account for good?"), /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons" }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: () => {
    setDeleteStep(0);
    setDeleteError("");
  } }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", style: { marginTop: 0, background: "var(--accent2)" }, onClick: confirmDelete }, /* @__PURE__ */ React.createElement(Trash2, { size: 14, style: { marginRight: 6 } }), " Yes, delete everything"))), deleteStep === 2 && /* @__PURE__ */ React.createElement("p", { className: "cl-note" }, "Deleting your account\u2026")), ), /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons cl-sticky-actions" }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: onClose }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", style: { marginTop: 0 }, onClick: save }, "Save settings"))));
}
function DayRow({ group, summary: d, onOpen }) {
  const best = d.best;
  const Icon = best ? TYPE_ICONS[best.type] : Mountain;
  const color = best ? gradeColor(best.type, best.grade) : "#8A8578";
  const logs = d.entries.length;
  const meta = [`${d.totalClimbs} ${d.totalClimbs === 1 ? "project" : "projects"}`, `${d.totalAttempts} ${d.totalAttempts === 1 ? "attempt" : "attempts"}`, d.totalMinutes > 0 ? formatDuration(d.totalMinutes) : null, d.gym].filter(Boolean).join("  ·  ");
  return /* @__PURE__ */ React.createElement("button", { className: "cl-lrow cl-dayrow", onClick: () => onOpen(group.ts), "aria-label": `Open ${group.label}` }, best && best.entry.photo ? /* @__PURE__ */ React.createElement("img", { src: best.entry.photo, alt: "", className: "cl-lrow-media" }) : /* @__PURE__ */ React.createElement("div", { className: "cl-lrow-media cl-lrow-media-empty", style: { background: color } }, /* @__PURE__ */ React.createElement(Icon, { size: 26, color: "#fff" })), /* @__PURE__ */ React.createElement("div", { className: "cl-lrow-body" }, /* @__PURE__ */ React.createElement("div", { className: "cl-lrow-top" }, /* @__PURE__ */ React.createElement("span", { className: "cl-lrow-title" }, group.label), d.totalSent > 0 && /* @__PURE__ */ React.createElement("span", { className: "cl-status cl-status-sent" }, d.totalSent, " sent")), /* @__PURE__ */ React.createElement("div", { className: "cl-lrow-mid" }, best && /* @__PURE__ */ React.createElement(GradeChip, { type: best.type, grade: best.grade }), best && /* @__PURE__ */ React.createElement("span", { className: "cl-lrow-gym" }, "Best: ", best.entry.title || "Untitled")), /* @__PURE__ */ React.createElement("div", { className: "cl-lrow-stats cl-lrow-meta" }, meta)), /* @__PURE__ */ React.createElement(ChevronRight, { size: 18, className: "cl-lrow-chev" }));
}
function nextChallenges(stats) {
  const list = [];
  const all = BADGE_DEFS;
  const firstUnearned = (prefix) => all.filter((b) => b.id.startsWith(prefix)).find((b) => !b.test(stats));
  const sentB = firstUnearned("finish-");
  if (sentB) {
    const target = Number(sentB.id.split("-")[1]);
    list.push({ id: sentB.id, icon: CheckCircle2, title: `Send ${target} climbs`, frac: stats.totalSent / target, text: `${stats.totalSent} / ${target} sent` });
  }
  const hoursB = firstUnearned("hours-");
  if (hoursB) {
    const target = Number(hoursB.id.split("-")[1]);
    const cur = stats.totalMinutes / 60;
    list.push({ id: hoursB.id, icon: Clock, title: `Climb ${target} hours`, frac: cur / target, text: `${cur < 10 ? cur.toFixed(1) : Math.floor(cur)} / ${target} hours` });
  }
  const boulderB = firstUnearned("boulder-");
  if (boulderB) {
    const g = boulderB.id.slice(8);
    const t = gradeRank("boulder", g);
    const cur = Number.isFinite(stats.boulderRank) ? stats.boulderRank : -2;
    const hardest = cur >= 0 ? boulderLabel(`V${cur}`) : cur === -1 ? boulderLabel("VB") : null;
    list.push({ id: boulderB.id, icon: CircleDot, title: `Send ${boulderLabel(g)}`, frac: Math.max(0, (cur + 2) / (t + 2)), text: hardest ? `Hardest boulder so far: ${hardest}` : "No boulder sends yet" });
  }
  const routeB = firstUnearned("route-");
  if (routeB) {
    const g = routeB.id.slice(6);
    const t = gradeRank("toprope", g);
    const cur = Number.isFinite(stats.routeRank) ? stats.routeRank : -1;
    list.push({ id: routeB.id, icon: Flag, title: `Send ${usGrade(g)}`, frac: Math.max(0, (cur + 1) / (t + 1)), text: cur >= 0 ? `Hardest route so far: ${usGrade(ROUTE_GRADES[cur])}` : "No route sends yet" });
  }
  return list.sort((a, b) => b.frac - a.frac).slice(0, 3);
}
function NextChallenges({ stats }) {
  const items = nextChallenges(stats);
  if (items.length === 0) return /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "Every badge unlocked — impressive.");
  return /* @__PURE__ */ React.createElement("div", { className: "cl-challenges" }, /* @__PURE__ */ React.createElement("p", { className: "cl-pv-sub" }, "Next to unlock"), items.map((c, i) => {
    const Icon = c.icon;
    return /* @__PURE__ */ React.createElement("div", { key: c.id, className: i === 0 ? "cl-challenge first" : "cl-challenge" }, /* @__PURE__ */ React.createElement("div", { className: "cl-challenge-icon" }, /* @__PURE__ */ React.createElement(Icon, { size: 18 })), /* @__PURE__ */ React.createElement("div", { className: "cl-challenge-main" }, /* @__PURE__ */ React.createElement("b", null, c.title), /* @__PURE__ */ React.createElement("div", { className: "cl-goal-bar" }, /* @__PURE__ */ React.createElement("i", { style: { width: `${Math.min(100, Math.max(3, c.frac * 100))}%` } })), /* @__PURE__ */ React.createElement("small", null, c.text)));
  }));
}
function notifText(e, profiles) {
  const who = (profiles[e.actor] && profiles[e.actor].name) || "Someone";
  const t = (e.title || "").slice(0, 40);
  if (e.type === "like") return `${who} liked ${e.targetKind === "log" ? `your log "${t}"` : "your post"}`;
  if (e.type === "comment") return `${who} commented: "${(e.text || "").slice(0, 60)}"`;
  if (e.type === "follow") return `${who} started following you`;
  if (e.type === "join") return `${who} joined your session${t ? ` at ${t}` : ""}`;
  if (e.type === "invite") return `${who} invited you to a session${t ? ` at ${t}` : ""}`;
  return who;
}
function NotificationsTab({ events, profiles, viewReadAt, perm, onEnable, onOpen }) {
  const icons = { like: Heart, comment: MessageCircle, follow: UserPlus, join: CalendarDays, invite: CalendarDays };
  const row = (e) => {
    const Ic = icons[e.type] || Bell;
    const p = profiles[e.actor];
    return /* @__PURE__ */ React.createElement("button", { key: e.id, className: e.ts > viewReadAt ? "cl-notif unread" : "cl-notif", onClick: () => onOpen(e) }, /* @__PURE__ */ React.createElement("div", { className: "cl-notif-ava" }, /* @__PURE__ */ React.createElement(Avatar, { name: (p && p.name) || "?", photo: p && p.photo, size: 38 }), /* @__PURE__ */ React.createElement("span", { className: `cl-notif-type ${e.type}` }, /* @__PURE__ */ React.createElement(Ic, { size: 10 }))), /* @__PURE__ */ React.createElement("div", { className: "cl-notif-body" }, /* @__PURE__ */ React.createElement("span", null, notifText(e, profiles)), /* @__PURE__ */ React.createElement("small", null, timeAgo(e.ts))), e.ts > viewReadAt && /* @__PURE__ */ React.createElement("i", { className: "cl-notif-dot" }));
  };
  const fresh = events.filter((e) => e.ts > viewReadAt);
  const older = events.filter((e) => e.ts <= viewReadAt);
  return /* @__PURE__ */ React.createElement("div", { className: "cl-tab" }, /* @__PURE__ */ React.createElement("div", { className: "cl-notif-head" }, /* @__PURE__ */ React.createElement("h2", null, "Notifications")), perm === "default" && /* @__PURE__ */ React.createElement("div", { className: "cl-notif-enable" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "Get alerts on this phone"), /* @__PURE__ */ React.createElement("small", null, "Likes, comments and session updates, while the app is open or in the background.")), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", style: { marginTop: 0, width: "auto", padding: "9px 14px" }, onClick: onEnable }, "Turn on")), perm === "denied" && /* @__PURE__ */ React.createElement("p", { className: "cl-hint", style: { padding: "0 16px" } }, "Alerts are blocked in your browser settings for this app."), events.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "Nothing yet. Likes, comments, new followers and session updates will show up here."), fresh.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption cl-notif-cap" }, "New"), fresh.map(row), older.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption cl-notif-cap" }, "Earlier"), older.map(row));
}
function HomeTab({ me, profile, saveProfile, allProfiles, refreshAll, logs, commentsMap, addLog, addComment, toggleKudo, deleteLog, addTry, togglePrivacy, toggleSave, loading, onOpenProfile, onOpenQR, onOpenSettings, onEnlarge, onOpenNewPost, onOpenNewSocialPost, onLiveLog, onShare, onShareProfile, onShareBadge, onShareToday, onShareDay, onShareProgress, onOpenDay, onShareToPost, onOpenLogDetail }) {
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [view, setView] = useState("records");
  const [showFollowers, setShowFollowers] = useState(null);
  const [showBadges, setShowBadges] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [logViewMode, setLogViewModeState] = useState(() => {
    try { return localStorage.getItem("chalkline_logViewMode") === "grid" ? "grid" : "list"; } catch { return "list"; }
  });
  const setLogViewMode = (mode) => {
    setLogViewModeState(mode);
    try { localStorage.setItem("chalkline_logViewMode", mode); } catch {}
  };
  if (!profile) return null;
  const mine = logs.filter((l) => l.authorSlug === me);
  const climbLogs = mine.filter((l) => l.kind === "climb");
  const stats = computeStats(mine);
  const badges = computeBadges(stats);
  const earnedCount = badges.filter((b) => b.earned).length;
  const boulderShown = effectiveGrade("boulder", profile.boulder, mine, false);
  const routeShown = effectiveGrade("route", profile.route, mine, false);
  const followerSlugs = followerSlugsFor(me, allProfiles);
  const followingSlugs = profile.following || [];
  const trackedTypes = profile.trackedTypes && profile.trackedTypes.length > 0 ? profile.trackedTypes : DEFAULT_TRACKED_TYPES;
  const statMetric = profile.statMetric || DEFAULT_STAT_METRIC;
  const logHasType = (l, t) => (l.updates || []).some((u) => (u.climbs || []).some((c) => c.type === t));
  const logHasStatus = (l, s) => {
    const latest = (l.updates || [])[l.updates.length - 1];
    return latest && (latest.climbs || []).some((c) => c.status === s);
  };
  const savedPosts = logs.filter((l) => (l.savedBy || []).includes(me));
  const publicPosts = mine.filter((l) => l.kind !== "climb" && l.privacy !== "private");
  const baseList = view === "saved" ? savedPosts : view === "posts" ? publicPosts : climbLogs;
  const filteredLogs = baseList.filter(
    (l) => (query.trim() === "" || (l.title || "").toLowerCase().includes(query.toLowerCase()) || (l.gym || "").toLowerCase().includes(query.toLowerCase())) && (l.kind !== "climb" || statusFilter === "all" || logHasStatus(l, statusFilter)) && (l.kind !== "climb" || typeFilter === "all" || logHasType(l, typeFilter))
  ).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  const h = React.createElement;
  const trends = computeTrends(climbLogs);
  const goalN = Number(profile.goalSessions) || 0;
  const setGoalN = (n) => saveProfile({ ...profile, goalSessions: Math.max(0, Math.min(31, n)) });
  const infoLine = [boulderShown && boulderShown !== "NA" ? boulderLabel(boulderShown) : null, routeShown && routeShown !== "NA" ? usGrade(routeShown) : null].filter(Boolean).join("  \u00B7  ");
  const infoParts = [infoLine, profile.mainGym].filter(Boolean).join("   \u00B7   ");
  const recordGroups = view === "records" ? groupRecordsByDay(filteredLogs.filter((l) => l.kind === "climb")) : [];
  return /* @__PURE__ */ React.createElement("div", { className: "cl-tab" }, h("div", { className: "cl-profile" }, h("div", { className: "cl-profile-top" }, h(Avatar, { name: profile.name, photo: profile.photo, size: 78 }), h("div", { className: "cl-profile-stats" }, h("div", { className: "cl-id-stat" }, h("b", null, climbLogs.length), h("span", null, "logs")), h("button", { className: "cl-id-stat cl-stat-btn", onClick: () => setShowFollowers(showFollowers === "followers" ? null : "followers") }, h("b", null, followerSlugs.length), h("span", null, "followers")), h("button", { className: "cl-id-stat cl-stat-btn", onClick: () => setShowFollowers(showFollowers === "following" ? null : "following") }, h("b", null, followingSlugs.length), h("span", null, "following")))), h("div", { className: "cl-profile-name" }, profile.name), infoParts && h("div", { className: "cl-profile-line" }, infoParts), h("div", { className: "cl-profile-actions" }, h("button", { className: "cl-btn-ghost", onClick: onOpenSettings }, "Edit profile"), h("button", { className: "cl-btn-ghost", onClick: onShareProfile }, "Share profile"))), showFollowers && /* @__PURE__ */ React.createElement("div", { className: "cl-crew-grid", style: { marginTop: 10 } }, (showFollowers === "followers" ? followerSlugs : followingSlugs).length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "Nobody yet."), (showFollowers === "followers" ? followerSlugs : followingSlugs).map((s) => {
    const p = allProfiles[s];
    return p ? /* @__PURE__ */ React.createElement("button", { className: "cl-crew-card", key: s, onClick: () => onOpenProfile(s), style: { textAlign: "left", cursor: "pointer", border: "1px solid var(--line)" } }, /* @__PURE__ */ React.createElement(Avatar, { name: p.name, photo: p.photo, size: 30 }), /* @__PURE__ */ React.createElement("div", { className: "cl-crew-name" }, p.name)) : null;
  })), /* @__PURE__ */ React.createElement("div", { className: "cl-tabbar" }, /* @__PURE__ */ React.createElement("div", { className: "cl-tabs", role: "tablist" }, /* @__PURE__ */ React.createElement("button", { className: view === "records" ? "cl-tbtab active" : "cl-tbtab", onClick: () => setView("records"), role: "tab", "aria-selected": view === "records" }, "Log"), /* @__PURE__ */ React.createElement("button", { className: view === "progress" ? "cl-tbtab active" : "cl-tbtab", onClick: () => setView("progress"), role: "tab", "aria-selected": view === "progress" }, "Progress")), null), view === "progress" && h("div", { className: "cl-progress-view" }, h("p", { className: "cl-section-caption cl-pv-caption", style: { marginTop: 6 } }, "This month"), h("div", { className: "cl-trend-grid" }, [[trends.sessions, trends.sessions === 1 ? "session" : "sessions", `${trends.lastSessions} last month`], [trends.projects, trends.projects === 1 ? "project" : "projects", ""], [trends.attempts, trends.attempts === 1 ? "attempt" : "attempts", ""], [formatDuration(trends.minutes) || "0min", "time", ""]].map(([v, l, sub]) => h("div", { className: "cl-trend-card", key: l }, h("b", null, v), h("span", null, l), sub && h("small", null, sub)))), trends.streak > 0 && h("p", { className: "cl-hint", style: { margin: "8px 0 0" } }, `${trends.streak}-week streak`), h("div", { className: "cl-goal-box" }, h("div", { className: "cl-goal-head" }, h("span", null, "Monthly goal"), h("div", { className: "cl-stepper" }, h("button", { type: "button", onClick: () => setGoalN(goalN - 1), "aria-label": "Fewer sessions" }, "\u2212"), h("b", null, goalN > 0 ? `${goalN} sessions` : "Not set"), h("button", { type: "button", onClick: () => setGoalN(goalN + 1), "aria-label": "More sessions" }, "+"))), goalN > 0 && h("div", { className: "cl-goal-bar" }, h("i", { style: { width: `${Math.min(100, trends.sessions / goalN * 100)}%` } })), goalN > 0 && h("small", { className: "cl-hint" }, trends.sessions >= goalN ? "Goal reached \u2014 nice." : `${goalN - trends.sessions} to go this month`)), h(ProgressCharts, { mine: climbLogs, onShare: onShareProgress }), h("p", { className: "cl-section-caption cl-pv-caption" }, "Badges  ", earnedCount, "/", badges.length), h(NextChallenges, { stats }), h("p", { className: "cl-section-caption cl-pv-caption" }, "About"), h("div", { className: "cl-about" }, h("p", { className: "cl-sub" }, "@", profile.username || profile.slug.slice(0, 8), profile.since ? `  \u00B7  Climbing since ${new Date(profile.since + "-01").toLocaleDateString(void 0, { month: "short", year: "numeric" })} (${climbingDuration(profile.since)})` : ""), profile.qualifications && profile.qualifications.length > 0 && h("div", { className: "cl-gear-row" }, profile.qualifications.map((q, i) => { const Ic = QUALIFICATION_ICONS[q] || GraduationCap; return h("span", { className: "cl-gear-pill cl-qual-pill", key: i }, h(Ic, { size: 11 }), " ", q); })), profile.gear && profile.gear.length > 0 && h("div", { className: "cl-gear-row" }, profile.gear.map((g, i) => h("span", { className: "cl-gear-pill", key: i }, g))))), view !== "progress" && filteredLogs.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, view === "saved" ? "No saved posts yet." : "Nothing logged yet. Tap the logo below to start."), view === "records" && recordGroups.map((group) => React.createElement(DayRow, { key: group.dateKey, group, summary: computeDaySummary(logs, me, group.ts), onOpen: onOpenDay })), (view === "posts" || view === "saved") && filteredLogs.map((entry) => /* @__PURE__ */ React.createElement(
    PostCard,
    {
      key: entry.id,
      entry,
      profile: allProfiles[entry.authorSlug] || profile,
      comments: commentsMap[entry.id] || [],
      me,
      defaultGym: profile.mainGym,
      onComment: addComment,
      onKudo: toggleKudo,
      onDelete: deleteLog,
      onAddTry: addTry,
      onTogglePrivacy: togglePrivacy,
      onToggleSave: toggleSave,
      onOpenProfile,
      onEnlarge,
      onLiveLog,
      onShare,
      allLogs: logs,
      onOpenLogDetail
    }
  )));
}
function FeedTab({ me, profile, logs, profiles, commentsMap, addComment, toggleKudo, deleteLog, addTry, togglePrivacy, toggleSave, onOpenProfile, onEnlarge, onOpenNewPost, onShare, allLogs, onOpenLogDetail }) {
  const [feedTab, setFeedTab] = useState("suggested");
  const notBlocked = (l) => !isBlockedEitherWay(profile, profiles[l.authorSlug]);
  const visible = logs.filter((l) => l.kind !== "climb" && l.kind !== "deal" && (l.privacy !== "private" || l.authorSlug === me) && notBlocked(l));
  let scoped = visible;
  if (feedTab === "following") scoped = visible.filter((l) => (profile.following || []).includes(l.authorSlug));
  const filtered = scoped.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  return /* @__PURE__ */ React.createElement("div", { className: "cl-tab", style: { position: "relative", minHeight: "60vh" } }, /* @__PURE__ */ React.createElement("div", { className: "cl-tabbar cl-tabbar-even" }, /* @__PURE__ */ React.createElement("div", { className: "cl-tabs", role: "tablist" }, /* @__PURE__ */ React.createElement("button", { className: feedTab === "following" ? "cl-tbtab active" : "cl-tbtab", role: "tab", onClick: () => setFeedTab("following") }, "Following"), /* @__PURE__ */ React.createElement("button", { className: feedTab === "suggested" ? "cl-tbtab active" : "cl-tbtab", role: "tab", onClick: () => setFeedTab("suggested") }, "Suggested"))), filtered.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "Nothing here yet."), filtered.map((entry) => /* @__PURE__ */ React.createElement(
    PostCard,
    {
      key: entry.id,
      entry,
      profile: profiles[entry.authorSlug],
      comments: commentsMap[entry.id] || [],
      me,
      onComment: addComment,
      onKudo: toggleKudo,
      onDelete: deleteLog,
      onAddTry: addTry,
      onTogglePrivacy: togglePrivacy,
      onToggleSave: toggleSave,
      onOpenProfile,
      onEnlarge,
      onShare,
      allLogs,
      hideLogActions: true,
      onOpenLogDetail
    }
  )));
}
function downloadSessionICS(session, hostName) {
  const pad = (n) => String(n).padStart(2, "0");
  const [y, m, d] = (session.date || "").split("-").map(Number);
  if (!y) return;
  let start, end;
  if (session.time) {
    const [hh, mm] = session.time.split(":").map(Number);
    const dt = new Date(y, m - 1, d, hh, mm);
    const en = new Date(dt.getTime() + 2 * 36e5);
    const f = (x) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
    start = `DTSTART:${f(dt)}`;
    end = `DTEND:${f(en)}`;
  } else {
    const nx = new Date(y, m - 1, d + 1);
    start = `DTSTART;VALUE=DATE:${y}${pad(m)}${pad(d)}`;
    end = `DTEND;VALUE=DATE:${nx.getFullYear()}${pad(nx.getMonth() + 1)}${pad(nx.getDate())}`;
  }
  const esc = (t) => String(t || "").replace(/[\\,;]/g, (c) => "\\" + c).replace(/\n/g, "\\n");
  const title = session.kind === "course" ? `Climbing course \u2014 ${hostName}` : `Climb with ${hostName}`;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Chalkline//EN", "BEGIN:VEVENT", `UID:${session.id}@chalkline`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`, start, end, `SUMMARY:${esc(title)}`, `LOCATION:${esc(session.gym)}`, session.note ? `DESCRIPTION:${esc(session.note)}` : null, "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", "DESCRIPTION:Climbing session soon", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].filter(Boolean);
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "chalkline-session.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2e3);
}
function SessionCard({ session, profiles, me, onJoin, onLeave, onDelete, onOpenProfile, comments, onComment }) {
  const [showComments, setShowComments] = useState(false);
  const [text, setText] = useState("");
  const joined = session.participants.includes(me);
  const creator = profiles[session.creatorSlug];
  const otherJoined = session.participants.length - 1;
  const spotsLeft = session.capacity - otherJoined;
  const isMine = session.creatorSlug === me;
  const invitedNotJoined = (session.invited || []).filter((s) => !session.participants.includes(s));
  const iAmInvited = (session.invited || []).includes(me) && !joined;
  const badge = formatDateBadge(session.date);
  const commentList = comments || [];
  const submitComment = async () => {
    if (!text.trim()) return;
    await onComment(session.id, text.trim());
    setText("");
  };
  return /* @__PURE__ */ React.createElement("div", { className: iAmInvited ? "cl-card cl-invited" : "cl-card" }, /* @__PURE__ */ React.createElement("div", { className: "cl-session-top" }, /* @__PURE__ */ React.createElement("div", { className: "cl-date-badge" }, /* @__PURE__ */ React.createElement("span", { className: "cl-date-day" }, badge.day), /* @__PURE__ */ React.createElement("span", { className: "cl-date-mon" }, badge.mon)), /* @__PURE__ */ React.createElement("button", { className: "cl-session-avatar-btn", onClick: () => onOpenProfile(session.creatorSlug) }, /* @__PURE__ */ React.createElement(Avatar, { name: creator?.name || session.creatorName, photo: creator?.photo, size: 30 })), /* @__PURE__ */ React.createElement("div", { className: "cl-session-main" }, /* @__PURE__ */ React.createElement("button", { className: "cl-session-title-btn", onClick: () => onOpenProfile(session.creatorSlug) }, session.kind === "course" ? `${creator?.name || session.creatorName}'s course` : `Climb with ${creator?.name || session.creatorName}`), /* @__PURE__ */ React.createElement("div", { className: "cl-session-meta-line" }, /* @__PURE__ */ React.createElement(MapPin, { size: 11 }), " ", session.gym, " \xB7 ", formatDateLong(session.date), session.time ? ` \xB7 ${session.time}` : "")), /* @__PURE__ */ React.createElement("span", { className: `cl-status cl-status-${session.kind === "course" ? "trying" : "sent"}` }, session.kind === "course" ? "Course" : "Climb"), isMine && /* @__PURE__ */ React.createElement(ConfirmButton, { onConfirm: () => onDelete(session.id), icon: /* @__PURE__ */ React.createElement(Trash2, { size: 14 }), title: "Delete" })), (iAmInvited || session.kind === "course" && session.level || session.note) && /* @__PURE__ */ React.createElement("div", { className: "cl-card-body", style: { paddingTop: 0, paddingBottom: 4 } }, iAmInvited && /* @__PURE__ */ React.createElement("p", { className: "cl-invite-note" }, "You're invited \u2014 join below"), session.kind === "course" && session.level && /* @__PURE__ */ React.createElement("p", { className: "cl-note" }, /* @__PURE__ */ React.createElement("b", null, "Level:"), " ", session.level), session.note && /* @__PURE__ */ React.createElement("p", { className: "cl-note" }, session.note)), /* @__PURE__ */ React.createElement("div", { className: "cl-session-footer-row" }, /* @__PURE__ */ React.createElement("div", { className: "cl-participants" }, session.participants.map((slug) => {
    const p = profiles[slug];
    return /* @__PURE__ */ React.createElement("button", { key: slug, className: "cl-participant-btn", onClick: () => onOpenProfile(slug), title: p?.name || "?" }, /* @__PURE__ */ React.createElement(Avatar, { name: p?.name || "?", photo: p?.photo, size: 24 }));
  })), /* @__PURE__ */ React.createElement("span", { className: "cl-session-spots" }, spotsLeft > 0 ? `${spotsLeft}/${session.capacity} left` : "Full"), !isMine && (joined ? /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost cl-session-btn", onClick: () => onLeave(session.id) }, "Leave") : /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary cl-session-btn", style: { marginTop: 0 }, onClick: () => onJoin(session.id), disabled: spotsLeft <= 0 }, spotsLeft <= 0 ? "Full" : "Join"))), invitedNotJoined.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-hint", style: { padding: "0 12px 10px" } }, "Invited: ", invitedNotJoined.map((s) => profiles[s]?.name || s).join(", ")), /* @__PURE__ */ (joined || isMine) && React.createElement("button", { className: "cl-ig-viewcomments cl-cal-btn", style: { padding: "0 14px 8px" }, onClick: () => downloadSessionICS(session, creator?.name || session.creatorName) }, React.createElement(CalendarDays, { size: 13 }), " Add to calendar (reminds you 1h before)"), React.createElement("button", { className: "cl-ig-viewcomments", style: { padding: "0 14px 8px" }, onClick: () => setShowComments((v) => !v) }, commentList.length > 0 ? `View all ${commentList.length} comment${commentList.length === 1 ? "" : "s"}` : "Add a comment\u2026"), showComments && /* @__PURE__ */ React.createElement("div", { className: "cl-comments", style: { paddingBottom: 12 } }, commentList.map((c, i) => /* @__PURE__ */ React.createElement("div", { className: "cl-comment", key: i }, /* @__PURE__ */ React.createElement("b", null, c.authorName), " ", c.text)), /* @__PURE__ */ React.createElement("div", { className: "cl-comment-input" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "cl-input",
      placeholder: "Say something\u2026",
      value: text,
      onChange: (e) => setText(e.target.value),
      onKeyDown: (e) => e.key === "Enter" && submitComment()
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: submitComment }, /* @__PURE__ */ React.createElement(Send, { size: 15 })))));
}
function SessionsTab({ me, profile, sessions, profiles, addSession, joinSession, leaveSession, deleteSession, onOpenProfile, commentsMap, addComment }) {
  const [showForm, setShowForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [kind, setKind] = useState("climb");
  const [gym, setGym] = useState(profile.mainGym || GYM_OPTIONS[0]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [level, setLevel] = useState("");
  const [note, setNote] = useState("");
  const [invited, setInvited] = useState([]);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [gymFilter, setGymFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const crew = Object.values(profiles).filter((p) => p.slug !== me);
  const toggleInvite = (slug) => {
    setInvited(invited.includes(slug) ? invited.filter((s) => s !== slug) : [...invited, slug]);
  };
  const create = async () => {
    if (!date) return;
    await addSession({
      id: uid(),
      creatorSlug: me,
      creatorName: profile.name,
      kind,
      gym,
      date,
      time,
      capacity: Number(capacity) || 1,
      level: level.trim(),
      note: note.trim(),
      invited,
      participants: [me],
      createdAt: Date.now()
    });
    setShowForm(false);
    setDate("");
    setTime("");
    setNote("");
    setLevel("");
    setInvited([]);
  };
  const gyms = [...new Set(sessions.map((s) => s.gym))];
  const upcoming = sessions.filter(
    (s) => (query.trim() === "" || s.gym.toLowerCase().includes(query.toLowerCase()) || (s.note || "").toLowerCase().includes(query.toLowerCase()) || (s.creatorName || "").toLowerCase().includes(query.toLowerCase())) && (kindFilter === "all" || s.kind === kindFilter) && (gymFilter === "all" || s.gym === gymFilter) && (fromDate === "" || s.date >= fromDate)
  ).sort((a, b) => a.date.localeCompare(b.date));
  return /* @__PURE__ */ React.createElement("div", { className: "cl-tab" }, /* @__PURE__ */ React.createElement("div", { className: "cl-tabbar" }, /* @__PURE__ */ React.createElement("div", { className: "cl-tabs", role: "tablist" }, /* @__PURE__ */ React.createElement("button", { className: kindFilter === "all" ? "cl-tbtab active" : "cl-tbtab", onClick: () => setKindFilter("all"), role: "tab" }, "All"), /* @__PURE__ */ React.createElement("button", { className: kindFilter === "climb" ? "cl-tbtab active" : "cl-tbtab", onClick: () => setKindFilter("climb"), role: "tab" }, "Climb together"), /* @__PURE__ */ React.createElement("button", { className: kindFilter === "course" ? "cl-tbtab active" : "cl-tbtab", onClick: () => setKindFilter("course"), role: "tab" }, "Courses")), /* @__PURE__ */ React.createElement("div", { className: "cl-tabbar-tools" }, /* @__PURE__ */ React.createElement("button", { className: showSearch ? "cl-tabbar-icon active" : "cl-tabbar-icon", onClick: () => setShowSearch((v) => !v), "aria-label": "Search sessions" }, /* @__PURE__ */ React.createElement(Search, { size: 18 })))), showSearch && /* @__PURE__ */ React.createElement("div", { className: "cl-nice-search" }, /* @__PURE__ */ React.createElement(Search, { size: 16 }), /* @__PURE__ */ React.createElement("input", { className: "cl-input cl-nice-search-input", placeholder: "Search by gym, host, or note\u2026", value: query, onChange: (e) => setQuery(e.target.value), autoFocus: true })), showSearch && /* @__PURE__ */ React.createElement("div", { className: "cl-filter-bar-row" }, /* @__PURE__ */ React.createElement("select", { className: "cl-input cl-select", value: gymFilter, onChange: (e) => setGymFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All gyms"), gyms.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }, g))), /* @__PURE__ */ React.createElement("div", { className: "cl-date-filter" }, /* @__PURE__ */ React.createElement(CalendarDays, { size: 14 }), /* @__PURE__ */ React.createElement("input", { className: "cl-input", type: "date", value: fromDate, onChange: (e) => setFromDate(e.target.value) }), fromDate && /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => setFromDate("") }, /* @__PURE__ */ React.createElement(X, { size: 13 })))), !showForm && /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary cl-new-session", onClick: () => setShowForm(true) }, /* @__PURE__ */ React.createElement(Plus, { size: 16 }), " Plan a session"), showForm && /* @__PURE__ */ React.createElement("div", { className: "cl-card cl-form-card" }, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "What is this?"), /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, /* @__PURE__ */ React.createElement("button", { className: kind === "climb" ? "cl-toggle active" : "cl-toggle", onClick: () => setKind("climb") }, "Climb together"), /* @__PURE__ */ React.createElement("button", { className: kind === "course" ? "cl-toggle active" : "cl-toggle", onClick: () => setKind("course") }, "Host a course")), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Gym or crag"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: gym, onChange: (e) => setGym(e.target.value), list: "cl-gyms2" }), /* @__PURE__ */ React.createElement("datalist", { id: "cl-gyms2" }, GYM_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }))), /* @__PURE__ */ React.createElement("div", { className: "cl-two-col" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Date"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", type: "date", value: date, onChange: (e) => setDate(e.target.value) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Time"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", type: "time", value: time, onChange: (e) => setTime(e.target.value) }))), kind === "course" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Who's it for"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: level, onChange: (e) => setLevel(e.target.value), placeholder: "e.g. Beginners, basic belay certification" })), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "How many friends can join (not counting you)?"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", type: "number", min: "1", value: capacity, onChange: (e) => setCapacity(e.target.value) }), crew.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Invite specific friends (optional)"), /* @__PURE__ */ React.createElement("div", { className: "cl-invite-list" }, crew.map((p) => /* @__PURE__ */ React.createElement("button", { key: p.slug, type: "button", className: invited.includes(p.slug) ? "cl-qual-chip active" : "cl-qual-chip", onClick: () => toggleInvite(p.slug) }, invited.includes(p.slug) && /* @__PURE__ */ React.createElement(Check, { size: 12 }), " ", p.name)))), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Note"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: note, onChange: (e) => setNote(e.target.value), placeholder: "Meet at the entrance, bring shoes\u2026" }), /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons" }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: () => setShowForm(false) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: create, disabled: !date }, kind === "course" ? "Create course" : "Create session"))), upcoming.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "Nothing matches. Tap + to plan one."), upcoming.map((s) => /* @__PURE__ */ React.createElement(SessionCard, { key: s.id, session: s, profiles, me, onJoin: joinSession, onLeave: leaveSession, onDelete: deleteSession, onOpenProfile, comments: commentsMap[s.id] || [], onComment: addComment })));
}
function ChalklineApp() {
  const [me, setMe] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState("home");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [quickEdit, setQuickEdit] = useState(null);
  const [showQuick, setShowQuick] = useState(false);
  const [session, setSession] = useState(null);
  const [sessionTick, setSessionTick] = useState(0);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [notifs, setNotifs] = useState({ events: [], readAt: 0 });
  const [viewReadAt, setViewReadAt] = useState(0);
  const [notifPerm, setNotifPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const notifState = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [showPeopleSearch, setShowPeopleSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showSocialPost, setShowSocialPost] = useState(null);
  const [liveLogState, setLiveLogState] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [sharePostData, setSharePostData] = useState(null);
  const [viewingLogDetail, setViewingLogDetail] = useState(null);
  const [viewingDay, setViewingDay] = useState(null);
  const [viewingSharedPost, setViewingSharedPost] = useState(null);
  const [sharedPostError, setSharedPostError] = useState("");
  const [systemDark, setSystemDark] = useState(false);
  const [guestUsername, setGuestUsername] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("u");
    } catch {
      return null;
    }
  });
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler);
    return () => mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler);
  }, []);
  const [profiles, setProfiles] = useState({});
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [commentsMap, setCommentsMap] = useState({});
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  useEffect(() => {
    if (!me || !hasLoadedOnce || !guestUsername) return;
    const match = Object.values(profiles).find((p) => p.username === guestUsername);
    if (match) {
      if (match.slug !== me) setViewingProfile(match.slug);
      setGuestUsername(null);
      try {
        window.history.replaceState({}, "", window.location.pathname);
      } catch {
      }
    }
  }, [me, hasLoadedOnce, guestUsername, profiles]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await window.supabaseAuth.getSession();
        if (data && data.session && data.session.user) setMe(data.session.user.id);
      } catch {
      }
      setBootstrapping(false);
    })();
  }, []);
  const loadProfiles = useCallback(async () => {
    const keys = await safeList("profile:", true);
    const vals = await Promise.all(keys.map((k) => safeGet(k, true)));
    const map = {};
    vals.forEach((v) => {
      if (v) {
        const p = JSON.parse(v);
        map[p.slug] = p;
      }
    });
    setProfiles(map);
    return map;
  }, []);
  const loadLogs = useCallback(async () => {
    const keys = await safeList("log:", true);
    const vals = await Promise.all(keys.map((k) => safeGet(k, true)));
    const arr = vals.filter(Boolean).map((v) => normalizeClimbEntry(JSON.parse(v)));
    setLogs(arr);
    const cKeys = arr.map((l) => `comments:${l.id}`);
    const cVals = await Promise.all(cKeys.map((k) => safeGet(k, true)));
    const cMap = {};
    arr.forEach((l, i) => {
      cMap[l.id] = cVals[i] ? JSON.parse(cVals[i]) : [];
    });
    setCommentsMap((prev) => ({ ...prev, ...cMap }));
    return arr;
  }, []);
  const loadSessions = useCallback(async () => {
    const keys = await safeList("session:", true);
    const vals = await Promise.all(keys.map((k) => safeGet(k, true)));
    const arr = vals.filter(Boolean).map((v) => JSON.parse(v));
    setSessions(arr);
    const cKeys = arr.map((s) => `comments:${s.id}`);
    const cVals = await Promise.all(cKeys.map((k) => safeGet(k, true)));
    const cMap = {};
    arr.forEach((s, i) => {
      cMap[s.id] = cVals[i] ? JSON.parse(cVals[i]) : [];
    });
    setCommentsMap((prev) => ({ ...prev, ...cMap }));
  }, []);
  const refreshAll = useCallback(async () => {
    setLoadingFeed(true);
    await Promise.all([loadProfiles(), loadLogs(), loadSessions()]);
    setLoadingFeed(false);
    setHasLoadedOnce(true);
  }, [loadProfiles, loadLogs, loadSessions, me]);
  useEffect(() => {
    if (!bootstrapping) refreshAll();
  }, [bootstrapping, refreshAll]);
  useEffect(() => {
    if (bootstrapping || !me) return;
    const id = setInterval(() => refreshAll(), 2e4);
    return () => clearInterval(id);
  }, [bootstrapping, me, refreshAll]);
  const createProfile = async ({ uid: uid2, name, username, photo, since, boulder, route, qualifications, mainGym }) => {
    setCreating(true);
    const profile = {
      slug: uid2,
      name,
      username,
      photo,
      since,
      boulder,
      route,
      qualifications,
      gear: [],
      mainGym,
      trackedTypes: DEFAULT_TRACKED_TYPES,
      statMetric: DEFAULT_STAT_METRIC,
      following: [],
      blocked: [],
      createdAt: Date.now()
    };
    await safeSet(`profile:${uid2}`, JSON.stringify(profile), true);
    setProfiles((p) => ({ ...p, [uid2]: profile }));
    setMe(uid2);
    setCreating(false);
  };
  const resumeProfile = async (uid2) => {
    setMe(uid2);
  };
  const saveProfile = async (draft) => {
    await safeSet(`profile:${draft.slug}`, JSON.stringify(draft), true);
    setProfiles((p) => ({ ...p, [draft.slug]: draft }));
  };
  const toggleFollow = async (targetSlug) => {
    const mine = profiles[me];
    const following = mine.following || [];
    const next = { ...mine, following: following.includes(targetSlug) ? following.filter((s) => s !== targetSlug) : [...following, targetSlug] };
    await safeSet(`profile:${me}`, JSON.stringify(next), true);
    setProfiles((p) => ({ ...p, [me]: next }));
  };
  const toggleBlock = async (targetSlug) => {
    const mine = profiles[me];
    const blocked = mine.blocked || [];
    const next = { ...mine, blocked: blocked.includes(targetSlug) ? blocked.filter((s) => s !== targetSlug) : [...blocked, targetSlug] };
    await safeSet(`profile:${me}`, JSON.stringify(next), true);
    setProfiles((p) => ({ ...p, [me]: next }));
  };
  const addLog = async (entry) => {
    await safeSet(`log:${entry.id}`, JSON.stringify(entry), true);
    setLogs((prev) => [entry, ...prev]);
  };
  const createClimbPost = async (data) => {
    const author = profiles[me];
    const finalTitle = data.title || autoTitle(data.climbs, data.gym, data.postType);
    const ts = resolveEntryTimestamp(data.entryDate);
    const extra = data.extra || {};
    const firstUpdate = { id: uid(), timestamp: ts, note: data.note, minutes: data.minutes, climbs: data.climbs, ...extra };
    const newId = uid();
    await addLog({
      id: newId,
      authorSlug: me,
      authorName: author.name,
      kind: "climb",
      postType: data.postType,
      title: finalTitle,
      gym: data.gym,
      wall: data.wall || void 0,
      goal: data.goal || void 0,
      privacy: data.privacy,
      photo: data.photo || null,
      points: extra.points || null,
      beta: extra.beta || null,
      createdAt: ts,
      updatedAt: ts,
      updates: [firstUpdate],
      kudos: [],
      savedBy: []
    });
    return { logId: newId, updateId: firstUpdate.id, created: true };
  };
  const createSocialPost = async (data) => {
    const author = profiles[me];
    await addLog({
      id: uid(),
      authorSlug: me,
      authorName: author.name,
      kind: "post",
      caption: data.caption,
      photos: data.photos,
      attachedLogId: data.attachedLogId,
      privacy: data.privacy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      kudos: [],
      savedBy: []
    });
  };
  const onShare = (entry) => {
    const author = profiles[entry.authorSlug] || profiles[me];
    if (entry.kind === "post" || entry.kind === "deal") {
      setSharePostData({ entry, profile: author });
      return;
    }
    const latest = entry.updates[entry.updates.length - 1];
    const primary = (latest.climbs || [])[0];
    const finished = entry.updates.some((u) => (u.climbs || []).some((c) => c.status === "sent"));
    const gradeText = primary ? primary.type === "boulder" ? boulderLabel(primary.grade) : usGrade(primary.grade) : "";
    const gradeLabel = primary ? `${TYPE_LABELS[primary.type]} ${gradeText}` : entry.title;
    const totals = computeEntryTotals(entry.updates);
    const wall = wallsFromEntry(entry)[0] || (primary ? { type: primary.type, grade: primary.grade, sent: finished } : null);
    const techniques = [...new Set(entry.updates.flatMap((u) => u.technique || []))];
    setShareData({
      variant: "log",
      title: entry.title || "Untitled",
      gym: entry.gym || "",
      bestType: wall ? wall.type : null,
      bestGrade: wall ? wall.grade : null,
      bestSent: finished,
      totalTries: totals.totalTries,
      totalMinutes: totals.totalMinutes,
      sessions: totals.logCount,
      techniques,
      name: author.name,
      username: author.username,
      place: entry.gym || "",
      achievement: finished ? "Sent!" : "Trying",
      statusLabel: gradeLabel,
      statsLines: [
        entry.title,
        totals.totalMinutes > 0 ? `Time: ${formatDuration(totals.totalMinutes)}` : null,
        `${totals.totalTries} attempt${totals.totalTries === 1 ? "" : "s"} total`
      ].filter(Boolean),
      photo: entry.photo,
      points: entry.points,
      beta: entry.beta || null,
      accentColor: finished ? "#6B8E4E" : "#C4501F",
      date: new Date(latest.timestamp).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" })
    });
  };
  const shareAnyProfile = (targetProfile) => {
    const theirLogs = logs.filter((l) => l.authorSlug === targetProfile.slug);
    const stats = computeStats(theirLogs);
    setShareData({
      variant: "profile",
      name: targetProfile.name,
      username: targetProfile.username,
      place: targetProfile.mainGym || "",
      achievement: `${stats.totalSent} sends`,
      statusLabel: "All-time stats",
      statsLines: [`${stats.totalTries} climbs logged`, `${formatDuration(stats.totalMinutes) || "0min"} climbed`],
      photo: targetProfile.photo,
      accentColor: "#22241F",
      date: targetProfile.since ? `Climbing since ${targetProfile.since}` : ""
    });
  };
  const shareProfileStats = () => shareAnyProfile(profiles[me]);
  const shareBadge = (badge) => {
    const st = computeStats(logs.filter((l) => l.authorSlug === me));
    const shown = computeDisplayBadges(st).filter((b) => b.earned);
    setShareData({
      variant: "badge",
      badgeId: badge.id,
      badgeLabel: badge.label,
      earnedCount: computeBadges(st).filter((b) => b.earned).length,
      totalBadges: BADGE_DEFS.length,
      earnedLabels: shown.map((b) => b.label),
      totalClimbs: st.totalTries,
      totalSent: st.totalSent,
      totalMinutes: st.totalMinutes,
      name: profiles[me].name,
      username: profiles[me].username,
      place: profiles[me].mainGym || "",
      achievement: badge.label,
      photo: profiles[me].photo,
      date: (/* @__PURE__ */ new Date()).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" })
    });
  };
  const shareProgress = (p) => {
    setShareData({
      variant: "progress",
      ...p,
      name: profiles[me].name,
      username: profiles[me].username,
      place: profiles[me].mainGym || "",
      achievement: `${TYPE_LABELS[p.chartType]} progress`,
      photo: profiles[me].photo,
      date: (/* @__PURE__ */ new Date()).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" })
    });
  };
  const shareDay = (targetDate) => {
    const d = computeDaySummary(logs, me, targetDate);
    setShareData({
      variant: "today",
      name: profiles[me].name,
      username: profiles[me].username,
      place: d.gym || "",
      bestClimbLabel: d.bestClimbLabel || (d.isToday ? "No climbs yet today" : "No climbs logged that day"),
      totalClimbs: d.totalClimbs,
      totalSent: d.totalSent,
      totalMinutes: d.totalMinutes,
      bestTitle: d.best ? d.best.entry.title || "Untitled" : "",
      bestType: d.best ? d.best.type : null,
      bestGrade: d.best ? d.best.grade : null,
      bestSent: d.best ? d.best.sent : false,
      bestPhoto: d.best && d.best.entry.photo || null,
      byType: d.typeBreakdown,
      byGrade: d.gradeBreakdown,
      photo: d.best && d.best.entry.photo || profiles[me].photo,
      points: d.best ? d.best.entry.points : null,
      beta: d.best ? d.best.entry.beta || null : null,
      accentColor: "#6B4C93",
      date: d.dateLabel
    });
  };
  const shareToday = () => shareDay();
  const addTry = async (logId, data) => {
    const entry = logs.find((l) => l.id === logId);
    if (!entry) return;
    const ts = resolveEntryTimestamp(data.entryDate);
    const extra = data.extra || {};
    const update = { id: uid(), timestamp: ts, note: data.note, minutes: data.minutes, climbs: data.climbs, ...extra };
    const next = {
      ...entry,
      updatedAt: ts,
      photo: data.photo || entry.photo || null,
      points: data.photo ? extra.points || null : entry.points || null,
      beta: data.photo ? extra.beta || null : entry.beta || null,
      updates: [...entry.updates || [], update]
    };
    await safeSet(`log:${logId}`, JSON.stringify(next), true);
    setLogs((prev) => prev.map((l) => l.id === logId ? next : l));
    return { logId, updateId: update.id };
  };
  const patchLog = async (logId, patch) => {
    const entry = logs.find((l) => l.id === logId);
    if (!entry) return;
    const next = { ...entry, ...patch };
    await safeSet(`log:${logId}`, JSON.stringify(next), true);
    setLogs((prev) => prev.map((l) => l.id === logId ? next : l));
  };
  const deleteUpdate = async (logId, updateId) => {
    const entry = logs.find((l) => l.id === logId);
    if (!entry) return;
    if ((entry.updates || []).length <= 1) { await deleteLog(logId); return; }
    const next = { ...entry, updates: entry.updates.filter((u) => u.id !== updateId) };
    next.updatedAt = Math.max(...next.updates.map((u) => u.timestamp));
    await safeSet(`log:${logId}`, JSON.stringify(next), true);
    setLogs((prev) => prev.map((l) => l.id === logId ? next : l));
  };
  const editClimbQuick = async (logId, updateId, climb) => {
    const entry = logs.find((l) => l.id === logId);
    if (!entry) return;
    const next = { ...entry, updates: entry.updates.map((u) => u.id === updateId ? { ...u, climbs: [climb, ...(u.climbs || []).slice(1)] } : u) };
    await safeSet(`log:${logId}`, JSON.stringify(next), true);
    setLogs((prev) => prev.map((l) => l.id === logId ? next : l));
  };
  const editEntry = async (logId, updateId, data) => {
    const entry = logs.find((l) => l.id === logId);
    if (!entry) return;
    const old = (entry.updates || []).find((u) => u.id === updateId);
    if (!old) return;
    const extra = data.extra || {};
    const pad = (n) => String(n).padStart(2, "0");
    const od = new Date(old.timestamp);
    const sameDay = data.entryDate === `${od.getFullYear()}-${pad(od.getMonth() + 1)}-${pad(od.getDate())}`;
    const ts = sameDay ? old.timestamp : resolveEntryTimestamp(data.entryDate);
    const { technique: _t, satisfaction: _s, ...rest } = old;
    const update = { ...rest, timestamp: ts, note: data.note, minutes: data.minutes, climbs: data.climbs, ...extra };
    const updates = entry.updates.map((u) => u.id === updateId ? update : u);
    const next = {
      ...entry,
      title: data.title || entry.title,
      gym: data.gym || entry.gym,
      wall: data.wall || void 0,
      goal: data.goal || void 0,
      photo: data.photo || null,
      points: data.photo ? extra.points || null : null,
      beta: data.photo ? extra.beta || null : null,
      updates,
      updatedAt: Math.max(entry.updatedAt || 0, ts)
    };
    await safeSet(`log:${logId}`, JSON.stringify(next), true);
    setLogs((prev) => prev.map((l) => l.id === logId ? next : l));
  };
  const setUpdateVideos = async (logId, updateId, videos) => {
    const entry = logs.find((l) => l.id === logId);
    if (!entry) return;
    const next = { ...entry, updates: (entry.updates || []).map((u) => u.id === updateId ? { ...u, videos } : u) };
    await safeSet(`log:${logId}`, JSON.stringify(next), true);
    setLogs((prev) => prev.map((l) => l.id === logId ? next : l));
  };
  const togglePrivacy = async (logId) => {
    const entry = logs.find((l) => l.id === logId);
    if (!entry) return;
    const next = { ...entry, privacy: entry.privacy === "private" ? "public" : "private" };
    await safeSet(`log:${logId}`, JSON.stringify(next), true);
    setLogs((prev) => prev.map((l) => l.id === logId ? next : l));
  };
  const addComment = async (logId, text) => {
    const author = profiles[me];
    const current = commentsMap[logId] || [];
    const next = [...current, { authorSlug: me, authorName: author.name, text, timestamp: Date.now() }];
    await safeSet(`comments:${logId}`, JSON.stringify(next), true);
    setCommentsMap((m) => ({ ...m, [logId]: next }));
  };
  const toggleKudo = async (logId) => {
    const entry = logs.find((l) => l.id === logId);
    if (!entry) return;
    const kudos = entry.kudos || [];
    const nextKudos = kudos.includes(me) ? kudos.filter((s) => s !== me) : [...kudos, me];
    const next = { ...entry, kudos: nextKudos };
    await safeSet(`log:${logId}`, JSON.stringify(next), true);
    setLogs((prev) => prev.map((l) => l.id === logId ? next : l));
  };
  const toggleSave = async (logId) => {
    const entry = logs.find((l) => l.id === logId);
    if (!entry) return;
    const savedBy = entry.savedBy || [];
    const next = { ...entry, savedBy: savedBy.includes(me) ? savedBy.filter((s) => s !== me) : [...savedBy, me] };
    await safeSet(`log:${logId}`, JSON.stringify(next), true);
    setLogs((prev) => prev.map((l) => l.id === logId ? next : l));
  };
  const deleteLog = async (logId) => {
    try {
      const gone = logs.find((l) => l.id === logId);
      ((gone && gone.updates) || []).forEach((u) => (u.videos || []).forEach((v) => deleteClip(v.id).catch(() => {})));
    } catch {}
    setLogs((prev) => prev.filter((l) => l.id !== logId));
    try {
      await window.storage.delete(`log:${logId}`, true);
    } catch {
    }
    try {
      await window.storage.delete(`comments:${logId}`, true);
    } catch {
    }
  };
  const addSession = async (session) => {
    await safeSet(`session:${session.id}`, JSON.stringify(session), true);
    setSessions((prev) => [...prev, session]);
  };
  const joinSession = async (id) => {
    const s = sessions.find((x) => x.id === id);
    if (!s || s.participants.includes(me)) return;
    const next = { ...s, participants: [...s.participants, me] };
    await safeSet(`session:${id}`, JSON.stringify(next), true);
    setSessions((prev) => prev.map((x) => x.id === id ? next : x));
  };
  const leaveSession = async (id) => {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    const next = { ...s, participants: s.participants.filter((p) => p !== me) };
    await safeSet(`session:${id}`, JSON.stringify(next), true);
    setSessions((prev) => prev.map((x) => x.id === id ? next : x));
  };
  const deleteSession = async (id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    try {
      await window.storage.delete(`session:${id}`, true);
    } catch {
    }
  };
  const logOut = async () => {
    try {
      await window.supabaseAuth.signOut();
    } catch {
    }
    setMenuOpen(false);
    setMe(null);
  };
  const deleteAccount = async () => {
    try {
      const result = await window.supabaseAuth.deleteAccount();
      if (result && result.error) return { error: result.error };
      setShowSettings(false);
      setMe(null);
      return { success: true };
    } catch (err) {
      return { error: err && err.message ? err.message : "Something went wrong. Try again." };
    }
  };
  const openProfile = (slug) => {
    if (slug === me) {
      setTab("home");
    } else {
      setViewingProfile(slug);
    }
  };
  const openSharedPost = (postId, username) => {
    const post = logs.find((l) => l.id === postId);
    if (post) {
      setSharedPostError("");
      setViewingSharedPost(post);
      return;
    }
    const match = username ? Object.values(profiles).find((p) => p.username === username) : null;
    if (match) {
      setViewingProfile(match.slug);
    } else {
      setSharedPostError("That post isn't available anymore.");
      setTimeout(() => setSharedPostError(""), 3e3);
    }
  };
  const notifKey = me ? `chalkline_notif:${me}` : null;
  useEffect(() => {
    if (!notifKey) return;
    let st = null;
    try { st = JSON.parse(localStorage.getItem(notifKey) || "null"); } catch {}
    notifState.current = st;
    setNotifs(st ? { events: st.events || [], readAt: st.readAt || 0 } : { events: [], readAt: 0 });
  }, [notifKey]);
  useEffect(() => {
    if (!notifKey || !hasLoadedOnce || !profiles[me]) return;
    const prev = notifState.current;
    const old = prev && prev.snap;
    const now = Date.now();
    const union = (a, b) => [.../* @__PURE__ */ new Set([...(a || []), ...(b || [])])];
    const snap = { kudos: {}, followers: [], parts: {}, invited: [], cids: [] };
    const found = [];
    const mineLogs = logs.filter((l) => l.authorSlug === me && l.kind !== "deal");
    mineLogs.forEach((l) => {
      const cur = (l.kudos || []).filter((k) => k !== me);
      const before = (old && old.kudos[l.id]) || [];
      snap.kudos[l.id] = union(before, cur);
      if (old) cur.filter((k) => !before.includes(k)).forEach((k) => found.push({ id: `like:${l.id}:${k}`, type: "like", ts: now, actor: k, targetId: l.id, targetKind: l.kind === "climb" ? "log" : "post", title: l.title || l.caption || "" }));
    });
    const followers = Object.values(profiles).filter((pr) => pr.slug !== me && (pr.following || []).includes(me)).map((pr) => pr.slug);
    snap.followers = union(old && old.followers, followers);
    if (old) followers.filter((f) => !old.followers.includes(f)).forEach((f) => found.push({ id: `follow:${f}`, type: "follow", ts: now, actor: f }));
    sessions.forEach((sn) => {
      if (sn.creatorSlug === me) {
        const cur = (sn.participants || []).filter((x) => x !== me);
        const before = (old && old.parts[sn.id]) || [];
        snap.parts[sn.id] = union(before, cur);
        if (old) cur.filter((x) => !before.includes(x)).forEach((x) => found.push({ id: `join:${sn.id}:${x}`, type: "join", ts: now, actor: x, targetId: sn.id, title: sn.gym }));
      } else if ((sn.invited || []).includes(me)) {
        snap.invited.push(sn.id);
        if (old && !old.invited.includes(sn.id)) found.push({ id: `invite:${sn.id}`, type: "invite", ts: sn.createdAt || now, actor: sn.creatorSlug, targetId: sn.id, title: sn.gym });
      }
    });
    snap.invited = union(old && old.invited, snap.invited);
    const targets = [...mineLogs.map((l) => ({ id: l.id, kind: l.kind === "climb" ? "log" : "post", title: l.title || l.caption || "" })), ...sessions.filter((sn) => sn.creatorSlug === me).map((sn) => ({ id: sn.id, kind: "session", title: sn.gym }))];
    const cids = [];
    targets.forEach((t) => (commentsMap[t.id] || []).forEach((c) => {
      if (c.authorSlug === me) return;
      const cid = `${t.id}:${c.timestamp}:${c.authorSlug}`;
      cids.push(cid);
      if (old && !old.cids.includes(cid)) found.push({ id: `comment:${cid}`, type: "comment", ts: c.timestamp || now, actor: c.authorSlug, targetId: t.id, targetKind: t.kind, title: t.title, text: c.text });
    }));
    snap.cids = union(old && old.cids, cids);
    const have = new Set(((prev && prev.events) || []).map((e) => e.id));
    const fresh = found.filter((e) => !have.has(e.id));
    const events = [...fresh, ...((prev && prev.events) || [])].sort((a, b) => b.ts - a.ts).slice(0, 100);
    const next = { since: prev && prev.since || now, readAt: prev ? prev.readAt || 0 : now, events, snap };
    notifState.current = next;
    try { localStorage.setItem(notifKey, JSON.stringify(next)); } catch {}
    setNotifs({ events, readAt: next.readAt });
    if (fresh.length && document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted" && navigator.serviceWorker) {
      fresh.slice(0, 3).forEach((e) => navigator.serviceWorker.ready.then((reg) => reg.showNotification("Chalkline", { body: notifText(e, profiles), icon: "icons/icon-192.png", tag: e.id })).catch(() => {}));
    }
  }, [logs, commentsMap, sessions, profiles, hasLoadedOnce, me]);
  useEffect(() => {
    if (tab !== "alerts" || !notifState.current) return;
    setViewReadAt(notifState.current.readAt || 0);
    const next = { ...notifState.current, readAt: Date.now() };
    notifState.current = next;
    try { localStorage.setItem(notifKey, JSON.stringify(next)); } catch {}
    setNotifs((n) => ({ ...n, readAt: next.readAt }));
  }, [tab]);
  const unreadCount = notifs.events.filter((e) => e.ts > notifs.readAt).length;
  const openNotif = (e) => {
    if (e.type === "follow") return openProfile(e.actor);
    if (e.type === "join" || e.type === "invite" || e.targetKind === "session") return setTab("sessions");
    const target = logs.find((l) => l.id === e.targetId);
    if (!target) return;
    if (target.kind === "climb") setViewingLogDetail(target);
    else setViewingSharedPost(target);
  };
  const enableAlerts = async () => {
    try { setNotifPerm(await Notification.requestPermission()); } catch {}
  };
  const sessionKey = me ? `chalkline_session:${me}` : null;
  useEffect(() => {
    if (!sessionKey) return;
    try {
      const st = JSON.parse(localStorage.getItem(sessionKey) || "null");
      if (st && Date.now() - st.start < 12 * 36e5) setSession(st);
      else localStorage.removeItem(sessionKey);
    } catch {}
  }, [sessionKey]);
  useEffect(() => {
    if (!session) return undefined;
    const id = setInterval(() => setSessionTick((n) => n + 1), 1e3);
    return () => clearInterval(id);
  }, [!!session]);
  const saveSession = (st) => {
    setSession(st);
    try { if (st) localStorage.setItem(sessionKey, JSON.stringify(st)); else localStorage.removeItem(sessionKey); } catch {}
  };
  const startSession = () => {
    let gym = profiles[me] && profiles[me].mainGym || GYM_OPTIONS[0];
    try { gym = localStorage.getItem("chalkline_ql_gym") || gym; } catch {}
    saveSession({ gym, start: Date.now(), lastAt: null, n: 0, attempts: 0, sent: 0 });
  };
  const endSession = () => {
    if (!session) return;
    setSessionSummary({ ...session, end: Date.now() });
    saveSession(null);
  };
  const quickLogged = ({ attempts, sent, gym, n = 1 }) => {
    const now = Date.now();
    // the first logged climb starts a session by itself; a long gap starts a new one
    const base = session && now - (session.lastAt || session.start) < 3 * 36e5 ? session : { gym: gym || (session && session.gym) || GYM_OPTIONS[0], start: now, lastAt: null, n: 0, attempts: 0, sent: 0 };
    saveSession({ ...base, gym: gym || base.gym, lastAt: now, n: Math.max(0, base.n + n), attempts: Math.max(0, base.attempts + attempts), sent: Math.max(0, base.sent + sent) });
  };
  const undoQuick = async (ref, delta) => {
    if (ref.created) await deleteLog(ref.logId); else await deleteUpdate(ref.logId, ref.updateId);
    if (session && delta) saveSession({ ...session, n: Math.max(0, session.n - 1), attempts: Math.max(0, session.attempts - delta.attempts), sent: Math.max(0, session.sent - delta.sent) });
  };
  const fmtClock = (ms) => { const t = Math.max(0, Math.floor(ms / 1e3)), hh = Math.floor(t / 3600), mm = Math.floor(t % 3600 / 60), ss = t % 60; return hh > 0 ? `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : `${mm}:${String(ss).padStart(2, "0")}`; };
  const myProfile = me ? profiles[me] : null;
  const themeMode = myProfile && myProfile.themeMode || "dark";
  const isDark = themeMode === "dark" || themeMode === "system" && systemDark;
  const themeColor = myProfile && myProfile.themeColor;
  const accentOverride = themeColor === "boulder" && myProfile ? gradeColor("boulder", myProfile.boulder) : null;
  BOULDER_SCALE = myProfile && myProfile.boulderScale === "font" ? "font" : "v";
  const rootStyle = accentOverride ? { "--accent2": accentOverride } : void 0;
  return /* @__PURE__ */ React.createElement("div", { className: isDark ? "cl-app cl-dark" : "cl-app", style: rootStyle }, /* @__PURE__ */ React.createElement("style", null, `
        .cl-app {
          --bg: #F1EFE9;
          --surface: #FFFFFF;
          --ink: #14150F;
          --ink-soft: #62665B;
          --line: #E0DDD2;
          --accent: #4F7F3A;
          --accent2: #D2491F;
          --radius: 12px;
          --card: #FFFFFF;
          font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          width: 100%;
          position: relative;
          -webkit-font-smoothing: antialiased;
        }
        .cl-app.cl-dark {
          --card: #161714;
          --bg: #0C0D0B;
          --surface: #161714;
          --ink: #F2F0E9;
          --ink-soft: #9EA195;
          --line: #272923;
          --accent: #86B26E;
          --accent2: #F25A2C;
        }
        .cl-app h1, .cl-app h2, .cl-app h3 {
          font-family: 'Barlow Condensed', 'Arial Narrow', sans-serif;
          font-weight: 800;
          letter-spacing: 0.01em;
          margin: 0;
        }
        .cl-app * { box-sizing: border-box; }
        .cl-header {
          position: sticky; top: 0; z-index: 30; background: var(--bg);
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 18px; border-bottom: 1px solid var(--line);
        }
        .cl-wordmark { display: flex; align-items: center; gap: 8px; color: var(--ink); }
        .cl-wordmark h1 { font-size: 20px; }
        .cl-header-right { display: flex; align-items: center; gap: 6px; }
        .cl-me-wrap { position: relative; }
        .cl-me { display: flex; align-items: center; gap: 8px; cursor: pointer; background: none; border: none; }
        .cl-me-menu {
          position: absolute; right: 0; top: 42px; background: var(--surface); border: 1px solid var(--line);
          border-radius: 8px; padding: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.12); z-index: 40; min-width: 150px;
        }
        .cl-me-menu button {
          width: 100%; text-align: left; background: none; border: none; padding: 8px 10px; border-radius: 6px;
          font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; color: var(--ink);
        }
        .cl-me-menu button:hover { background: var(--bg); }

        .cl-nav {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
          display: flex; justify-content: center; gap: 6px; background: var(--surface);
          border-top: 1px solid var(--line); padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
        }
        .cl-nav-inner { display: flex; align-items: center; gap: 6px; max-width: 380px; width: 100%; justify-content: space-around; }
        .cl-nav button {
          background: none; border: none; padding: 8px 14px; border-radius: 10px; cursor: pointer;
          color: var(--ink-soft); display: flex; align-items: center; justify-content: center;
        }
        .cl-nav button.active { background: var(--bg); color: var(--ink); }
        .cl-nav button.active .cl-avatar, .cl-nav button.active .cl-avatar-img { outline: 2px solid var(--accent2); outline-offset: 1px; }
        .cl-nav-fab {
          background: var(--accent2) !important; color: white !important; border-radius: 50% !important;
          width: 46px; height: 46px; margin-top: -18px; box-shadow: 0 3px 10px rgba(0,0,0,0.25);
          flex-shrink: 0; padding: 0 !important;
        }

        .cl-main { max-width: 680px; margin: 0 auto; padding: 12px 10px 100px; }
        .cl-tab { display: flex; flex-direction: column; gap: 14px; }

        .cl-onboard { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .cl-guest-banner { display: flex; align-items: center; gap: 8px; background: var(--bg); border-radius: 8px; padding: 8px 10px; font-size: 12px; color: var(--ink-soft); }
        .cl-guest-banner span { flex: 1; }
        .cl-guest-clickable { cursor: pointer; }
        .cl-guest-posts { display: flex; flex-direction: column; gap: 10px; cursor: pointer; }
        .cl-guest-post { border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
        .cl-guest-post-photo { width: 100%; max-height: 180px; object-fit: cover; display: block; }
        .cl-guest-post-title { font-size: 13px; font-weight: 700; padding: 8px 10px 4px; }
        .cl-guest-post .cl-chip-row { padding: 0 10px 8px; margin-top: 0 !important; }
        .cl-onboard-card { background: var(--surface); border-radius: var(--radius); padding: 28px 24px; max-width: 380px; width: 100%; border: 1px solid var(--line); }
        .cl-onboard-card h1 { font-size: 30px; margin: 10px 0 2px; }
        .cl-sub { color: var(--ink-soft); font-size: 13px; margin: 0 0 14px; }
        .cl-hint { color: var(--ink-soft); font-size: 11.5px; margin: 6px 0 0; }
        .cl-id-text { font-size: 11px; color: var(--ink-soft); font-family: monospace; margin: 4px 0 0; }

        .cl-step-dots { display: flex; gap: 5px; justify-content: center; margin-bottom: 14px; }
        .cl-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--line); }
        .cl-dot.active { background: var(--accent2); }

        .cl-label { display: block; font-size: 12px; color: var(--ink-soft); margin: 12px 0 5px; }
        .cl-input { width: 100%; padding: 9px 11px; border: 1px solid var(--line); border-radius: 7px; background: var(--surface); color: var(--ink); font-size: 14px; font-family: inherit; }
        .cl-textarea { min-height: 64px; resize: vertical; }
        .cl-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

        .cl-error { color: var(--accent2); font-size: 12px; margin: 8px 0 0; }
        .cl-btn-primary {
          margin-top: 18px; width: 100%; background: var(--ink); color: var(--surface); border: none;
          border-radius: 7px; padding: 11px; font-size: 14px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .cl-btn-primary:disabled { opacity: 0.5; cursor: default; }
        .cl-btn-primary.cl-full { margin-top: 0; }
        .cl-btn-ghost { background: none; border: 1px solid var(--line); border-radius: 7px; padding: 10px 14px; color: var(--ink); cursor: pointer; font-size: 13px; flex: 1; }
        .cl-icon-btn { background: none; border: none; color: var(--ink-soft); cursor: pointer; display: flex; align-items: center; justify-content: center; min-width: 40px; min-height: 40px; padding: 8px; border-radius: 10px; }
        .cl-icon-btn:active { background: var(--line); }
        .cl-icon-btn-boxed { background: var(--surface); border: 1px solid var(--line); color: var(--ink); }
        .cl-icon-btn.active { color: var(--accent2); background: var(--bg); }
        .cl-row-buttons { display: flex; gap: 8px; margin-top: 14px; }

        .cl-confirm-inline { display: inline-flex; align-items: center; gap: 4px; }
        .cl-confirm-yes { background: var(--accent2); color: white; border: none; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer; }
        .cl-confirm-no { background: none; border: 1px solid var(--line); border-radius: 6px; padding: 4px 6px; cursor: pointer; color: var(--ink-soft); }

        .cl-avatar { border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; flex-shrink: 0; background: #8A8578; }
        .cl-avatar-img { border-radius: 50%; object-fit: cover; flex-shrink: 0; }

        .cl-identity { display: flex; align-items: center; gap: 10px; background: none; border: none; cursor: pointer; padding: 0; flex: 1; min-width: 0; text-align: left; }
        .cl-identity-text { display: flex; flex-direction: column; min-width: 0; }
        .cl-identity-name { font-weight: 700; font-size: 14px; color: var(--ink); }
        .cl-identity-sub { font-size: 11px; color: var(--ink-soft); }

        .cl-icon-controls { display: flex; align-items: center; gap: 4px; }
        .cl-icon-controls-label { flex: 1; display: flex; align-items: center; gap: 6px; }
        .cl-controls-spacer { flex: 1; }
        .cl-add-btn { background: var(--ink); color: var(--surface); }

        .cl-badge { background: var(--surface); border: 1.5px solid var(--line); border-radius: var(--radius); padding: 16px; }
        .cl-badge-top { display: flex; align-items: center; gap: 12px; }
        .cl-badge-top { align-items: flex-start; }
        .cl-badge-id { flex: 1; min-width: 0; }
        .cl-badge-id h2 { font-size: 22px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cl-badge { position: relative; }
        .cl-badge-actions { position: absolute; top: 12px; right: 12px; display: flex; flex-direction: column; background: var(--bg); border-radius: 12px; padding: 2px; }
        .cl-badge-top, .cl-identity-stats { padding-right: 50px; }
        .cl-badge-action { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border: none; background: none; border-radius: 10px; color: var(--ink); cursor: pointer; }
        .cl-badge-action:active { background: var(--line); }
        .cl-name-row { display: flex; align-items: center; gap: 6px; }
        .cl-badge-toggles { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; align-items: center; }
        .cl-identity-stats { display: flex; gap: 18px; margin-top: 10px; }
        .cl-id-stat { display: flex; flex-direction: column; align-items: center; background: none; border: none; cursor: default; font-family: inherit; }
        .cl-id-stat b { font-size: 15px; font-family: 'Barlow Condensed', sans-serif; }
        .cl-id-stat span { font-size: 11px; color: var(--ink-soft); }
        .cl-training-stats { display: flex; flex-wrap: wrap; gap: 6px; width: 100%; margin: 2px 0 6px; }
        .cl-training-stat { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--ink-soft); background: var(--bg); border-radius: 20px; padding: 4px 10px; }
        .cl-training-stat b { color: var(--ink); font-weight: 700; }

        .cl-chip-row { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; align-items: center; }
        .cl-chip { display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid; border-radius: 20px; padding: 4px 10px; font-size: 12px; font-weight: 600; }
        .cl-chip-dot { width: 8px; height: 8px; min-width: 8px; min-height: 8px; border-radius: 50%; flex-shrink: 0; }
        .cl-chip-na { border: 1.5px solid var(--line); color: var(--ink-soft); font-weight: 500; }

        .cl-qual-row, .cl-invite-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
        .cl-qual-chip {
          border: 1px solid var(--line); background: var(--surface); border-radius: 20px; padding: 5px 11px;
          font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; color: var(--ink);
        }
        .cl-qual-chip.active { background: var(--accent); border-color: var(--accent); color: white; }
        .cl-qual-pill { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px !important; font-size: 10.5px !important; }
        .cl-nowrap { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .cl-gear-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .cl-gear-pill { background: var(--bg); border: 1px solid var(--line); border-radius: 20px; padding: 2px 8px; font-size: 10.5px; display: inline-flex; align-items: center; gap: 4px; }
        .cl-gear-pill button { background: none; border: none; cursor: pointer; color: var(--ink-soft); display: flex; }
        .cl-inline-add { display: flex; gap: 6px; margin-top: 8px; }
        .cl-inline-add .cl-input { flex: 1; }

        .cl-empty { color: var(--ink-soft); font-size: 13px; line-height: 1.5; text-align: center; padding: 6px 0; }

        .cl-crew-grid { display: flex; flex-direction: column; gap: 8px; }
        .cl-crew-card { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; gap: 10px; font-family: inherit; }
        .cl-crew-name { font-weight: 600; font-size: 14px; }
        .cl-crew-sub { font-size: 12px; color: var(--ink-soft); }

        .cl-card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; }
        .cl-card.cl-invited { border-color: var(--accent2); box-shadow: 0 0 0 1px var(--accent2); }
        .cl-invite-note { font-size: 12px; font-weight: 700; color: var(--accent2); margin: 0 0 6px; }
        .cl-form-card { padding: 18px; }
        .cl-form-section { padding: 12px 0; border-bottom: 1px solid var(--line); }
        .cl-form-section:first-child { padding-top: 0; }
        .cl-form-section:last-of-type { border-bottom: none; padding-bottom: 4px; }
        .cl-section-caption { font-size: 12px; font-weight: 700; color: var(--ink); margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.03em; }
        .cl-form-section .cl-label:first-of-type { margin-top: 0; }
        .cl-card-head { display: flex; align-items: center; gap: 10px; padding: 14px 16px 10px; }
        .cl-card-title { font-weight: 700; font-size: 14px; }
        .cl-status { font-size: 10px; padding: 3px 9px; border-radius: 20px; background: var(--bg); color: var(--ink-soft); align-self: flex-start; white-space: nowrap; display: inline-flex; align-items: center; gap: 3px; }
        .cl-status-sent { background: #E4EDD9; color: #4C6A34; }
        .cl-status-trying { background: #F5E6C8; color: #8A6416; }
        .cl-status-deal { background: #E3E8EF; color: #3A4A63; }
        .cl-photo-wrap { position: relative; cursor: zoom-in; background: #00000010; overflow: hidden; }
        .cl-photo-full { width: 100%; display: block; max-height: 210px; object-fit: contain; background: #1a1a1a08; }
        .cl-enlarge-hint { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.55); color: white; border-radius: 6px; padding: 4px 6px; display: flex; }
        .cl-photo-preview { width: 100%; border-radius: 8px; margin-top: 8px; max-height: 260px; object-fit: cover; }
        .cl-photo-preview-round { max-width: 96px; max-height: 96px; border-radius: 50%; }
        .cl-card-body { padding: 12px 16px 8px; }
        .cl-note { font-size: 13px; margin: 8px 0 0; line-height: 1.4; }
        .cl-deal-price { font-size: 15px; font-weight: 700; color: var(--accent2); margin: 6px 0 0; }
        .cl-deal-link { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--ink); margin-top: 8px; text-decoration: underline; }

        .cl-file-hidden { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; }
        .cl-photo-btn {
          display: inline-flex; align-items: center; gap: 8px; margin-top: 4px; border: 1.5px dashed var(--line);
          border-radius: 8px; padding: 10px 14px; font-size: 13px; color: var(--ink); cursor: pointer; background: var(--bg);
        }
        .cl-photo-btn:hover { border-color: var(--accent2); color: var(--accent2); }
        .cl-photo-add-row { display: flex; gap: 8px; }
        .cl-photo-add-row .cl-photo-btn { flex: 1; justify-content: center; }

        .cl-toggle-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .cl-toggle {
          flex: 1; min-width: 70px; padding: 8px; border-radius: 7px; border: 1px solid var(--line); background: var(--surface);
          font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 5px;
        }
        .cl-toggle.active { background: var(--ink); color: var(--surface); border-color: var(--ink); }

        .cl-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .cl-type-btn {
          padding: 8px 6px; border-radius: 7px; border: 1px solid var(--line); background: var(--surface);
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; color: var(--ink-soft); font-size: 12px;
        }
        .cl-type-btn.active { background: var(--ink); color: var(--surface); border-color: var(--ink); }
        .cl-type-btn:disabled { opacity: 0.6; cursor: default; }

        .cl-grade-grid { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
        .cl-grade-swatch {
          border: 1.5px solid; border-radius: 6px; padding: 5px 9px; font-size: 11.5px; font-weight: 700;
          cursor: pointer; background: transparent; min-width: 36px;
        }
        .cl-grade-swatch:disabled { opacity: 0.6; cursor: default; }

        .cl-status-row { display: flex; gap: 6px; margin-top: 8px; }
        .cl-status-pick {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px; border-radius: 7px; border: 1px solid var(--line); background: var(--surface);
          font-size: 12px; cursor: pointer; color: var(--ink-soft);
        }
        .cl-status-pick.sent.active { background: #E4EDD9; border-color: #4C6A34; color: #4C6A34; }
        .cl-status-pick.trying.active { background: #F5E6C8; border-color: #8A6416; color: #8A6416; }

        .cl-climb-row { border: 1px dashed var(--line); border-radius: 8px; padding: 10px; margin-top: 8px; }
        .cl-climb-row-top { display: flex; gap: 6px; align-items: center; }
        .cl-climb-row-top .cl-type-grid { flex: 1; }

        .cl-duration-row { display: flex; gap: 20px; justify-content: center; padding: 6px 0 20px; }
        .cl-scroll-picker-wrap { position: relative; width: 70px; }
        .cl-scroll-picker { height: 108px; overflow-y: scroll; scroll-snap-type: y mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .cl-scroll-picker::-webkit-scrollbar { display: none; }
        .cl-scroll-picker-item {
          height: 36px; display: flex; align-items: center; justify-content: center; scroll-snap-align: center;
          font-size: 16px; color: var(--ink-soft); font-family: 'Barlow Condensed', sans-serif; cursor: pointer;
        }
        .cl-scroll-picker-item.active { color: var(--ink); font-weight: 800; font-size: 22px; }
        .cl-scroll-picker-highlight { position: absolute; top: 36px; left: 0; right: 0; height: 36px; border-top: 1.5px solid var(--accent2); border-bottom: 1.5px solid var(--accent2); pointer-events: none; }
        .cl-scroll-picker-label { position: absolute; bottom: -20px; left: 0; right: 0; text-align: center; font-size: 11px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.03em; }
        .cl-duration-field span { font-size: 12px; color: var(--ink-soft); }

        .cl-history-toggle { background: none; border: none; color: var(--ink-soft); font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 8px 0 4px; }
        .cl-timeline { display: flex; flex-direction: column; gap: 8px; padding: 4px 0 8px; border-top: 1px dashed var(--line); margin-top: 4px; }
        .cl-timeline-item { display: flex; flex-direction: column; gap: 2px; font-size: 12px; }
        .cl-timeline-note { color: var(--ink); }
        .cl-timeline-time { color: var(--ink-soft); font-size: 11px; }

        .cl-kudos-row { padding: 4px 14px 8px; display: flex; gap: 8px; }
        .cl-ig-actions { display: flex; align-items: center; gap: 4px; padding: 10px 12px 2px; }
        .cl-ig-icon { background: none; border: none; color: var(--ink); cursor: pointer; display: flex; align-items: center; padding: 4px; }
        .cl-ig-icon.active { color: var(--accent2); }
        .cl-ig-likes { font-size: 12.5px; font-weight: 700; padding: 2px 14px 0; margin: 0; }
        .cl-ig-caption { font-size: 13px; line-height: 1.4; margin: 0; }
        .cl-ig-viewcomments { display: block; background: none; border: none; padding: 6px 0 0; font-size: 12px; color: var(--ink-soft); cursor: pointer; text-align: left; font-family: inherit; }
        .cl-ig-timestamp { font-size: 11px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.03em; margin: 8px 0 0; }
        .cl-multi-photo-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
        .cl-multi-photo-thumb { position: relative; width: 64px; height: 64px; border-radius: 8px; overflow: hidden; }
        .cl-multi-photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .cl-multi-photo-thumb button { position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.6); border: none; color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .cl-multi-photo-add { width: 64px; height: 64px; border: 1.5px dashed var(--line); border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink-soft); background: var(--bg); }
        .cl-attach-log-list { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; border: 1px solid var(--line); border-radius: 10px; padding: 6px; }
        .cl-attach-log-row { display: flex; align-items: center; gap: 8px; background: none; border: 1px solid transparent; border-radius: 8px; padding: 6px; cursor: pointer; text-align: left; font-family: inherit; color: var(--ink); width: 100%; }
        .cl-attach-log-row.selected { background: var(--bg); border-color: var(--accent2); }
        .cl-attach-log-check { width: 16px; height: 16px; border: 1.5px solid var(--line); border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--accent2); }
        .cl-attach-log-row.selected .cl-attach-log-check { border-color: var(--accent2); }
        .cl-attach-log-thumb { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; flex-shrink: 0; background: var(--bg); }
        .cl-attach-log-thumb-empty { display: flex; align-items: center; justify-content: center; color: var(--ink-soft); }
        .cl-attach-log-info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .cl-attach-log-title { font-size: 12.5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cl-attach-log-meta { font-size: 11.5px; color: var(--ink-soft); }
        .cl-attach-log-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }
        .cl-photo-scroll { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; width: 100%; height: 100%; scrollbar-width: none; }
        .cl-photo-scroll::-webkit-scrollbar { display: none; }
        .cl-photo-slide { flex: 0 0 100%; width: 100%; height: 100%; object-fit: cover; scroll-snap-align: start; cursor: zoom-in; }
        .cl-photo-dots { position: absolute; bottom: 8px; left: 0; right: 0; display: flex; justify-content: center; gap: 5px; pointer-events: none; }
        .cl-photo-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.5); display: block; }
        .cl-photo-dot.active { background: #FFFFFF; }
        .cl-attached-log { display: flex; align-items: center; gap: 6px; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; margin-top: 8px; font-size: 12px; font-weight: 600; color: var(--ink-soft); width: 100%; cursor: pointer; font-family: inherit; text-align: left; }
        .cl-attached-log span { flex: 1; }
        .cl-ig-utility { display: flex; gap: 8px; padding: 8px 14px 12px; border-top: 1px solid var(--line); }
        .cl-kudo-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: 1px solid var(--line); border-radius: 20px; padding: 5px 12px; font-size: 12px; color: var(--ink-soft); cursor: pointer; }
        .cl-kudo-btn.active { color: var(--accent2); border-color: var(--accent2); }

        .cl-comment-toggle { width: 100%; background: none; border: none; border-top: 1px solid var(--line); padding: 9px 14px; font-size: 12px; color: var(--ink-soft); cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .cl-comments { padding: 0 14px 12px; display: flex; flex-direction: column; gap: 6px; }
        .cl-comment { font-size: 12.5px; line-height: 1.4; }
        .cl-comment-input { display: flex; gap: 6px; margin-top: 4px; }
        .cl-comment-input .cl-input { flex: 1; }

        .cl-participants { display: flex; }
        .cl-participant-btn { background: none; border: none; padding: 0; cursor: pointer; }
        .cl-participants .cl-avatar, .cl-participants .cl-avatar-img { margin-right: -8px; border: 2px solid var(--surface); }
        .cl-session-footer-row { display: flex; align-items: center; gap: 8px; padding: 8px 14px 12px; }
        .cl-session-spots { flex: 1; font-size: 11px; color: var(--ink-soft); font-weight: 600; }
        .cl-session-btn { padding: 6px 16px !important; font-size: 12.5px !important; margin-top: 0 !important; width: auto !important; }

        .cl-session-top { display: flex; align-items: center; gap: 10px; padding: 12px 14px; }
        .cl-date-badge {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: var(--ink); color: var(--surface); border-radius: 8px; width: 40px; height: 40px; flex-shrink: 0;
        }
        .cl-date-day { font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 800; line-height: 1; }
        .cl-date-mon { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.04em; }
        .cl-session-avatar-btn { background: none; border: none; padding: 0; cursor: pointer; flex-shrink: 0; }
        .cl-session-main { flex: 1; min-width: 0; }
        .cl-session-title-btn { font-weight: 700; font-size: 13.5px; background: none; border: none; padding: 0; text-align: left; cursor: pointer; color: var(--ink); font-family: inherit; display: block; }
        .cl-session-meta-line { display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--ink-soft); margin-top: 2px; flex-wrap: wrap; row-gap: 2px; }

        .cl-search-wrap { position: relative; }
        .cl-search-wrap svg { position: absolute; left: 10px; top: 11px; color: var(--ink-soft); }
        .cl-resume-list { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; max-height: 260px; overflow-y: auto; }
        .cl-resume-item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); cursor: pointer; text-align: left; font-size: 14px; color: var(--ink); font-family: inherit; }
        .cl-resume-item span { flex: 1; font-weight: 600; }

        .cl-stats-row { display: flex; gap: 6px; margin-top: 14px; border-top: 1px solid var(--line); padding-top: 12px; flex-wrap: wrap; }
        .cl-stat { flex: 1; min-width: 60px; text-align: center; display: flex; flex-direction: column; gap: 2px; }
        .cl-stat b { font-size: 15px; font-family: 'Barlow Condensed', sans-serif; }
        .cl-stat span { font-size: 11px; color: var(--ink-soft); }
        .cl-stat-btn { background: none; border: none; cursor: pointer; font-family: inherit; color: var(--ink); }

        .cl-badges-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 10px; }
        .cl-badge-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 4px; border-radius: 8px; background: var(--bg); color: var(--line); border: none; font-family: inherit; cursor: default; }
        .cl-badge-item.earned { cursor: pointer; }
        .cl-badge-item span { font-size: 8.5px; text-align: center; line-height: 1.2; color: var(--ink-soft); }
        .cl-badge-item.earned { color: var(--accent2); background: #F5E6C8; }
        .cl-badge-item.earned span { color: var(--ink); font-weight: 600; }

        .cl-charts { margin-top: 10px; }
        .cl-chart-label { font-size: 11px; color: var(--ink-soft); margin: 10px 0 2px; }

        .cl-record { border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); overflow: hidden; }
        .cl-record-row { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px; background: none; border: none; cursor: pointer; text-align: left; font-family: inherit; }
        .cl-record-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
        .cl-record-icon-photo { background: var(--bg); }
        .cl-record-icon-photo img { width: 100%; height: 100%; object-fit: cover; }
        .cl-view-mode-row { display: flex; gap: 6px; margin-top: 8px; }
        .cl-view-mode-row .cl-icon-btn { width: auto; gap: 5px; font-size: 12px; font-weight: 600; border: 1px solid var(--line); }
        .cl-view-mode-row .cl-icon-btn.active { background: var(--ink); color: var(--surface); border-color: var(--ink); }
        .cl-record-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .cl-record-grid-item {
          position: relative; display: flex; flex-direction: column; text-align: left; padding: 0; cursor: pointer;
          border: 1px solid var(--line); border-radius: 12px; overflow: hidden; background: var(--surface); font-family: inherit;
        }
        .cl-record-grid-photo { width: 100%; height: 160px; object-fit: cover; display: block; }
        .cl-record-grid-photo-empty { display: flex; align-items: center; justify-content: center; }
        .cl-record-grid-overlay { position: absolute; top: 8px; right: 8px; }
        .cl-record-grid-info { padding: 8px 10px 10px; }
        .cl-record-grid-title { font-size: 12.5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--ink); }
        .cl-record-grid-stats { display: flex; gap: 8px; margin-top: 5px; font-size: 11.5px; color: var(--ink-soft); font-weight: 600; }
        .cl-record-info { flex: 1; min-width: 0; }
        .cl-record-title { font-weight: 700; font-size: 13px; }
        .cl-record-sub { font-size: 11px; color: var(--ink-soft); }
        .cl-record-cols { display: flex; gap: 12px; flex-shrink: 0; }
        .cl-record-col { display: flex; flex-direction: column; align-items: center; }
        .cl-record-col-val { font-size: 13px; font-weight: 700; font-family: 'Barlow Condensed', sans-serif; }
        .cl-record-col-label { font-size: 10.5px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.03em; }
        .cl-record-expanded { border-top: 1px solid var(--line); }
        .cl-record-expanded .cl-card { border: none; border-radius: 0; }
        .cl-record-detail { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
        .cl-record-detail-head { display: flex; align-items: center; gap: 6px; }
        .cl-record-detail-gym { flex: 1; display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--ink-soft); }
        .cl-day-group { display: flex; flex-direction: column; gap: 10px; }
        .cl-day-header { font-size: 12px; font-weight: 700; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.04em; margin: 4px 0 0; }
        .cl-day-header-row { display: flex; align-items: center; justify-content: space-between; margin: -4px 0 -2px; }
        .cl-day-header-row .cl-day-header { margin: 4px 0; }
        .cl-tabbar { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line); margin: 6px 0 8px; }
        .cl-tabs { display: flex; gap: 2px; }
        .cl-tbtab { position: relative; display: inline-flex; align-items: center; gap: 5px; background: none; border: none; padding: 10px 10px 11px; min-height: 42px; font-size: 14px; font-weight: 600; color: var(--ink-soft); cursor: pointer; font-family: inherit; }
        .cl-tbtab.active { color: var(--ink); font-weight: 700; }
        .cl-tbtab.active::after { content: ""; position: absolute; left: 10px; right: 10px; bottom: -1px; height: 2.5px; border-radius: 2px; background: var(--accent2); }
        .cl-tabbar-tools { display: flex; align-items: center; }
        .cl-tabbar-icon { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: none; border: none; border-radius: 10px; color: var(--ink-soft); cursor: pointer; }
        .cl-tabbar-icon.active { background: var(--ink); color: var(--surface); }
        .cl-header-actions { display: flex; align-items: center; gap: 0; flex-shrink: 0; }
        .cl-header-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: none; border: none; border-radius: 9px; color: var(--ink-soft); cursor: pointer; }
        .cl-header-icon:active { background: var(--line); }
        .cl-header-icon.danger { color: var(--accent2); }
        .cl-log-top-actions { margin: 0 0 12px; }
        .cl-overlay-header .cl-overlay-title { flex: 1; min-width: 0; margin: 0 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; }
        html, body, .cl-app, .cl-app * { -webkit-tap-highlight-color: transparent; }
        .cl-app button, .cl-app label, .cl-app img { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
        .cl-app button:focus:not(:focus-visible) { outline: none; }
        .cl-app button:focus-visible { outline: 2px solid var(--accent2); outline-offset: 2px; }
        .cl-lrow { display: flex; align-items: stretch; gap: 14px; width: 100%; padding: 12px; text-align: left; border: 1px solid var(--line); border-radius: 16px; background: var(--card); cursor: pointer; font-family: inherit; color: var(--ink); }
        .cl-lrow:active { background: var(--surface); }
        .cl-lrow-media { width: 88px; height: 88px; border-radius: 12px; object-fit: cover; flex-shrink: 0; display: block; }
        .cl-lrow-media-empty { display: flex; align-items: center; justify-content: center; }
        .cl-lrow-body { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; gap: 6px; padding: 2px 0; }
        .cl-lrow-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .cl-lrow-title { font-size: 16px; font-weight: 700; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .cl-lrow-top .cl-status { flex-shrink: 0; }
        .cl-lrow-mid { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 10px; }
        .cl-lrow-gym { display: inline-flex; align-items: center; gap: 3px; font-size: 12.5px; color: var(--ink-soft); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cl-lrow-stats { display: flex; gap: 16px; font-size: 13px; font-weight: 600; color: var(--ink-soft); }
        .cl-lrow-stats span { display: inline-flex; align-items: center; gap: 5px; }
        .cl-record-grid-item { background: var(--card); border-radius: 16px; }
        .cl-record-grid-photo { height: 170px; }
        .cl-record-grid-title { font-size: 14px; }
        .cl-record-grid-info { padding: 10px 12px 12px; }
        .cl-share-transparent { background-color: #fff; background-image: linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%); background-size: 22px 22px; background-position: 0 0, 0 11px, 11px -11px, -11px 0; }
        .cl-bg-options { margin: 4px auto 6px; max-width: 340px; }
        .cl-bg-buttons { display: flex; gap: 8px; justify-content: center; }
        .cl-bg-btn { display: inline-flex; align-items: center; gap: 4px; min-height: 40px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .cl-design-picker { max-width: 460px; margin: 0 auto 10px; }
        .cl-design-picker .cl-segment { font-size: 12.5px; padding: 0 4px; }
        .cl-swatches { display: flex; flex-wrap: nowrap; justify-content: center; gap: 8px; margin: 6px auto 10px; }
        .cl-bg-buttons { flex-wrap: wrap; }
        .cl-swatch { flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; border: 2px solid var(--line); cursor: pointer; padding: 0; box-shadow: inset 0 0 0 2px rgba(255,255,255,0.35); }
        .cl-swatch.active { outline: 3px solid var(--accent2); outline-offset: 2px; }
        .cl-swatch-auto { background: linear-gradient(135deg, var(--surface) 44%, var(--accent2) 44%, var(--accent2) 56%, var(--surface) 56%); }
        .cl-log-title-block { margin: 2px 0 14px; }
        .cl-log-title { font-family: 'Barlow Condensed', sans-serif; font-size: 30px; font-weight: 800; line-height: 1.08; margin: 0 0 8px; color: var(--ink); overflow-wrap: anywhere; }
        .cl-log-title-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; }
        .cl-tabbar-even .cl-tabs { flex: 1; justify-content: space-evenly; }
        .cl-tabbar-even .cl-tbtab { justify-content: center; }
        .cl-chart-card { margin-top: 12px; background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 6px 14px 14px; }
        .cl-chart-summary { display: flex; gap: 8px; margin: 12px 0 4px; }
        .cl-chart-summary > div { flex: 1 1 0; min-width: 0; }
        .cl-chart-summary span { display: block; }
        .cl-chart-summary > div { background: var(--bg); border-radius: 12px; padding: 10px 6px; text-align: center; }
        .cl-chart-summary b { display: block; font-family: 'Barlow Condensed', sans-serif; font-size: 24px; font-weight: 800; color: var(--ink); line-height: 1.1; }
        .cl-chart-summary span { font-size: 11.5px; color: var(--ink-soft); }
        .cl-chart-block { margin-top: 14px; }
        .cl-chart-title { font-size: 12.5px; font-weight: 700; color: var(--ink); margin: 0 0 6px; }
        .cl-overlay.cl-layer-day { z-index: 105; }
        .cl-overlay.cl-layer-log { z-index: 110; }
        .cl-overlay.cl-layer-top { z-index: 120; }
        .cl-day-header-btn { display: inline-flex; align-items: center; gap: 4px; background: none; border: none; padding: 2px 4px 2px 0; min-height: 36px; color: var(--ink-soft); cursor: pointer; font-family: inherit; }
        .cl-day-header-btn .cl-day-header { margin: 0; }
        .cl-tools-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
        .cl-segmented { flex: 1; display: flex; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 3px; }
        .cl-segment { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 36px; border: none; background: none; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--ink-soft); cursor: pointer; font-family: inherit; }
        .cl-segment.active { background: var(--ink); color: var(--surface); }
        .cl-tool-btn { flex-shrink: 0; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid var(--line); background: var(--surface); color: var(--ink-soft); cursor: pointer; }
        .cl-tool-btn.active { background: var(--ink); color: var(--surface); border-color: var(--ink); }
        .cl-action-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(64px, 1fr)); gap: 8px; margin: 14px 0 4px; }
        .cl-action-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; min-height: 60px; border-radius: 12px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .cl-action-btn.danger { color: var(--accent2); }
        .cl-action-btn:active { background: var(--line); }
        .cl-sheet-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 150; display: flex; align-items: flex-end; justify-content: center; }
        .cl-sheet { width: 100%; max-width: 520px; background: var(--surface); border-radius: 18px 18px 0 0; padding: 10px 18px calc(18px + env(safe-area-inset-bottom)); animation: cl-sheet-up 0.2s ease-out; }
        @keyframes cl-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .cl-sheet { animation: none; } }
        .cl-sheet-handle { width: 38px; height: 4px; border-radius: 4px; background: var(--line); margin: 0 auto 14px; }
        .cl-sheet-title { font-size: 16px; font-weight: 700; margin: 0 0 6px; color: var(--ink); }
        .cl-sheet-message { font-size: 13.5px; color: var(--ink-soft); margin: 0 0 16px; line-height: 1.45; }
        .cl-sheet-buttons { display: flex; gap: 10px; }
        .cl-sheet-btn { flex: 1; min-height: 46px; border-radius: 10px; border: 1px solid var(--line); background: var(--bg); color: var(--ink); font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .cl-sheet-btn.primary { background: var(--ink); color: var(--surface); border-color: var(--ink); }
        .cl-sheet-btn.danger { background: var(--accent2); color: #fff; border-color: var(--accent2); }
        .cl-day-best { position: relative; display: block; width: 100%; padding: 0; text-align: left; border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: var(--surface); cursor: pointer; font-family: inherit; }
        .cl-day-best-photo { width: 100%; height: 190px; object-fit: cover; display: block; }
        .cl-day-best-photo-empty { display: flex; align-items: center; justify-content: center; }
        .cl-day-best-badge { position: absolute; top: 10px; left: 10px; background: #D4A017; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; }
        .cl-day-best-info { padding: 12px 14px; }
        .cl-day-best-name { font-size: 16px; font-weight: 700; color: var(--ink); }
        .cl-day-best-gym { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--ink-soft); margin-top: 6px; }
        .cl-day-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
        .cl-day-stat { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 12px 6px; text-align: center; }
        .cl-day-stat b { display: block; font-size: 22px; font-weight: 800; font-family: 'Barlow Condensed', sans-serif; color: var(--ink); }
        .cl-day-stat span { font-size: 11.5px; color: var(--ink-soft); }
        .cl-day-grade-row { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 9px 12px; margin-bottom: 6px; }
        .cl-day-grade-type { flex: 1; font-size: 13px; color: var(--ink-soft); }
        .cl-day-grade-count { font-size: 14px; font-weight: 700; color: var(--ink); }
        .cl-record-summary { display: flex; gap: 0; border: 1px solid var(--line); border-radius: 14px; padding: 14px 0; background: var(--card); }
        .cl-log-detail-list { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
        .cl-log-detail-item { border: 1px solid var(--line); border-radius: 14px; padding: 14px 16px; background: var(--card); }
        .cl-log-detail-photo-wrap { position: relative; margin-bottom: 8px; border-radius: 8px; overflow: hidden; background: #00000010; }
        .cl-log-detail-photo { width: 100%; max-height: 480px; object-fit: contain; display: block; }
        .cl-log-detail-row-top { display: flex; align-items: center; justify-content: space-between; }
        .cl-log-detail-stats { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 6px; }
        .cl-record-summary div { flex: 1; text-align: center; display: flex; flex-direction: column; gap: 1px; }
        .cl-record-summary b { font-size: 15px; font-family: 'Barlow Condensed', sans-serif; }
        .cl-record-summary span { font-size: 11px; color: var(--ink-soft); }
        .cl-log-table { display: flex; flex-direction: column; }
        .cl-log-table-head { display: grid; grid-template-columns: 44px 1fr 44px 40px 60px; gap: 6px; padding: 4px 6px; font-size: 11px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.03em; }
        .cl-log-table-row { display: grid; grid-template-columns: 44px 1fr 44px 40px 60px; gap: 6px; align-items: center; padding: 7px 6px; border-top: 1px solid var(--line); font-size: 11.5px; }
        .cl-log-table-row-btn { width: 100%; background: none; border: none; border-top: 1px solid var(--line); cursor: pointer; text-align: left; font-family: inherit; color: var(--ink); }
        .cl-try-breakdown { padding: 4px 6px 10px 6px; display: flex; flex-direction: column; gap: 4px; background: var(--bg); border-radius: 6px; margin: 0 6px 6px; }
        .cl-attempt-line { display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-soft); padding: 2px 6px; }
        .cl-attempt-outcome { font-weight: 600; color: var(--ink); }
        .cl-attempt-note { font-size: 11.5px; color: var(--ink-soft); padding: 0 6px 4px; margin: 0; font-style: italic; }
        .cl-log-cell-date { color: var(--ink-soft); }
        .cl-log-cell-grade { overflow: hidden; }
        .cl-log-cell-time, .cl-log-cell-tries { text-align: center; font-weight: 600; }
        .cl-log-table-row .cl-status { justify-self: start; }
        .cl-log-extra { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 0 6px 8px 56px; font-size: 11px; color: var(--ink-soft); }
        .cl-log-extra-item { white-space: nowrap; }
        .cl-log-thumb-tiny { width: 28px; height: 28px; object-fit: cover; border-radius: 4px; }

        .cl-filter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .cl-select { width: 100%; }

        .cl-feed-tabs { display: flex; gap: 6px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 4px; }
        .cl-fab-add {
          position: fixed; right: 20px; bottom: calc(78px + env(safe-area-inset-bottom));
          width: 52px; height: 52px; border-radius: 50%; background: var(--ink); color: var(--surface);
          border: none; display: flex; align-items: center; justify-content: center; cursor: pointer;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25); z-index: 40;
        }
        .cl-feed-tab { flex: 1; background: none; border: none; padding: 8px; border-radius: 7px; font-size: 12px; cursor: pointer; color: var(--ink-soft); display: flex; align-items: center; justify-content: center; gap: 4px; }
        .cl-feed-tab.active { background: var(--ink); color: var(--surface); font-weight: 600; }

        .cl-section-head { display: flex; align-items: center; gap: 4px; }
        .cl-page-icon { flex: 1; display: flex; align-items: center; color: var(--ink-soft); }

        .cl-nice-search { display: flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--line); border-radius: 24px; padding: 6px 14px; }
        .cl-nice-search svg { color: var(--ink-soft); flex-shrink: 0; }
        .cl-nice-search-input { border: none; padding: 4px 0; }
        .cl-filter-bar { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
        .cl-pill-row { display: flex; gap: 6px; overflow-x: auto; }
        .cl-pill { flex-shrink: 0; background: var(--bg); border: 1px solid var(--line); border-radius: 20px; padding: 6px 12px; font-size: 12px; cursor: pointer; color: var(--ink); }
        .cl-pill.active { background: var(--ink); color: var(--surface); border-color: var(--ink); }
        .cl-filter-bar-row { display: flex; gap: 8px; }
        .cl-date-filter { flex: 1; display: flex; align-items: center; gap: 6px; background: var(--bg); border: 1px solid var(--line); border-radius: 7px; padding: 0 8px; }
        .cl-date-filter svg { color: var(--ink-soft); flex-shrink: 0; }
        .cl-date-filter .cl-input { border: none; background: none; padding: 8px 4px; }

        .cl-overlay { position: fixed; inset: 0; background: var(--bg); z-index: 100; display: flex; flex-direction: column; }
        .cl-overlay-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid var(--line); background: var(--surface); }
        .cl-overlay-title { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 17px; }
        .cl-overlay-body { flex: 1; overflow-y: auto; padding: 12px 10px 28px; max-width: 680px; margin: 0 auto; width: 100%; }

        .cl-qr-box { display: flex; justify-content: center; margin: 16px 0; }
        .cl-qr-code { font-family: monospace; font-size: 13px; background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 8px; word-break: break-all; }
        .cl-qr-scan-section { margin-top: 18px; border-top: 1px solid var(--line); padding-top: 14px; }
        .cl-qr-video { width: 100%; border-radius: 8px; margin: 8px 0; background: #000; }

        .cl-thread-row { width: 100%; display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; cursor: pointer; font-family: inherit; text-align: left; }
        .cl-thread-text { flex: 1; min-width: 0; }
        .cl-thread-name { font-weight: 700; font-size: 14px; }
        .cl-thread-preview { font-size: 12px; color: var(--ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cl-thread-time { font-size: 11px; color: var(--ink-soft); flex-shrink: 0; }
        .cl-chat-scroll { display: flex; flex-direction: column; gap: 8px; min-height: 200px; }
        .cl-bubble { align-self: flex-start; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 8px 13px; font-size: 13px; max-width: 80%; }
        .cl-chat-link { display: inline-flex; align-items: center; gap: 4px; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 4px 10px; margin-top: 4px; font-size: 12px; font-weight: 700; color: var(--accent2); cursor: pointer; font-family: inherit; }
        .cl-bubble.mine { align-self: flex-end; background: var(--ink); color: var(--surface); border: none; }

        .cl-live-tracker { text-align: center; padding: 20px 0; }
        .cl-live-timer { font-family: 'Barlow Condensed', sans-serif; font-size: 56px; font-weight: 800; line-height: 1; }
        .cl-live-sub { color: var(--ink-soft); font-size: 13px; margin: 6px 0 0; }
        .cl-live-total { color: var(--ink-soft); font-size: 11px; margin: 2px 0 0; }
        .cl-fall-row { display: flex; gap: 8px; margin: 10px 0 16px; }
        .cl-fall-btn { flex: 1; padding: 14px; border-radius: 10px; border: 1.5px solid var(--line); background: var(--surface); font-size: 15px; font-weight: 700; cursor: pointer; color: var(--ink); }
        .cl-fall-btn:active { background: var(--bg); }
        .cl-star-row { display: flex; gap: 6px; justify-content: center; margin-top: 6px; }
        .cl-star-btn { background: none; border: none; cursor: pointer; padding: 4px; }
        .cl-point-photo-wrap { position: relative; margin-top: 8px; cursor: crosshair; border-radius: 8px; overflow: hidden; }
        .cl-point-photo { width: 100%; display: block; max-height: 320px; object-fit: contain; background: #1a1a1a08; }
        .cl-point-marker {
          position: absolute; transform: translate(-50%, -50%); width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white;
          border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }
        .cl-point-marker.start { background: #6B8E4E; }
        .cl-point-marker.end { background: #C4501F; }
        .cl-point-marker.fall { background: #D4A017; }

        .cl-share-preview { width: 100%; max-width: 340px; border-radius: 0; margin: 10px 0; box-shadow: 0 6px 20px rgba(0,0,0,0.18); }
        .cl-share-download-btn { display: inline-flex; margin: 10px auto 0; width: auto !important; padding: 6px 14px !important; font-size: 12px !important; }
        .cl-danger-zone { margin-top: 28px; padding: 14px; border-radius: 12px; background: rgba(196,80,31,0.08); border: 1px solid rgba(196,80,31,0.35); }
        .cl-btn-danger { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 44px; border: none; border-radius: 9px; background: var(--accent2); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .cl-danger-confirm { background: var(--bg); border: 1px solid var(--accent2); border-radius: 10px; padding: 12px; margin-top: 8px; }
        .cl-copied-toast { text-align: center; font-size: 12px; font-weight: 600; color: var(--accent); background: var(--bg); padding: 6px; margin: 0; }


        .cl-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 200; display: flex; align-items: center; justify-content: center; }
        .cl-lightbox-imgwrap { position: relative; max-width: 94vw; max-height: 88vh; }
        .cl-lightbox-imgwrap img { max-width: 94vw; max-height: 88vh; object-fit: contain; display: block; }
        .cl-lightbox-close { position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.15); border: none; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        .cl-spin { animation: cl-spin 0.8s linear infinite; }
        @keyframes cl-spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        /* ---------- pro look + dark-mode legibility ---------- */
        :where(.cl-app) button, :where(.cl-app) input, :where(.cl-app) select, :where(.cl-app) textarea { color: inherit; font-family: inherit; }
        .cl-app select, .cl-app textarea, .cl-app input { color: var(--ink); }
        .cl-app input::placeholder, .cl-app textarea::placeholder { color: var(--ink-soft); opacity: 0.7; }
        .cl-app.cl-dark { color-scheme: dark; }
        .cl-app h1, .cl-app h2, .cl-app h3 { text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700; }
        .cl-app .cl-log-title, .cl-app .cl-lrow-title, .cl-app .cl-badge-id h2 { text-transform: none; letter-spacing: 0.01em; }
        .cl-header { background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 10px 16px; }
        .cl-wordmark h1 { font-size: 19px; letter-spacing: 0.14em; font-weight: 800; }
        .cl-main { padding-top: 14px; }
        .cl-card, .cl-badge, .cl-lrow, .cl-crew-card, .cl-thread-row { border-radius: 12px; box-shadow: none; }
        .cl-badge { border-width: 1px; background: var(--surface); }
        .cl-app:not(.cl-dark) .cl-card, .cl-app:not(.cl-dark) .cl-lrow { box-shadow: 0 1px 2px rgba(20,21,15,0.04); }
        .cl-nav { background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); padding-top: 6px; }
        .cl-nav button { border-radius: 8px; position: relative; }
        .cl-nav button.active { background: none; color: var(--ink); }
        .cl-nav button.active::before { content: ""; position: absolute; top: -7px; left: 30%; right: 30%; height: 2px; background: var(--accent2); border-radius: 0 0 2px 2px; }
        .cl-nav-fab { border-radius: 14px !important; width: 48px; height: 48px; margin-top: -14px; box-shadow: 0 6px 18px rgba(242,90,44,0.35); }
        .cl-nav-fab::before { display: none; }
        .cl-fab-add { background: var(--accent2) !important; color: #fff !important; border-radius: 14px !important; box-shadow: 0 8px 22px rgba(0,0,0,0.35); }
        .cl-chip { border-radius: 6px; border-width: 1px; padding: 3px 9px; font-size: 11.5px; letter-spacing: 0.02em; }
        .cl-chip-na { border-width: 1px; }
        .cl-chip-dot { border-radius: 2px; width: 7px; height: 7px; min-width: 7px; min-height: 7px; }
        .cl-status { border-radius: 4px; text-transform: uppercase; letter-spacing: 0.07em; font-size: 9.5px; font-weight: 700; padding: 3px 7px; }
        .cl-training-stat, .cl-gear-pill, .cl-pill, .cl-qual-chip { border-radius: 6px; }
        .cl-btn-primary, .cl-btn-ghost, .cl-toggle, .cl-type-btn, .cl-status-pick, .cl-input, .cl-photo-btn, .cl-kudo-btn { border-radius: 8px; }
        .cl-btn-primary { background: var(--accent2); color: #fff; text-transform: uppercase; letter-spacing: 0.06em; font-size: 12.5px; font-weight: 700; padding: 12px; }
        .cl-btn-ghost { font-weight: 600; letter-spacing: 0.02em; }
        .cl-toggle.active, .cl-type-btn.active, .cl-tabbar-icon.active, .cl-add-btn { background: var(--accent2); color: #fff; border-color: var(--accent2); }
        .cl-toggle, .cl-type-btn { font-weight: 600; }
        .cl-input:focus, .cl-app textarea:focus, .cl-app select:focus { outline: none; border-color: var(--accent2); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent2) 22%, transparent); }
        .cl-label, .cl-section-caption { text-transform: uppercase; letter-spacing: 0.08em; font-size: 10.5px; font-weight: 700; color: var(--ink-soft); }
        .cl-tbtab { text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; font-weight: 700; }
        .cl-tbtab.active::after { border-radius: 0; height: 2px; }
        .cl-id-stat b, .cl-stat b, .cl-chart-summary b, .cl-day-stat b, .cl-record-col-val { font-weight: 700; letter-spacing: 0.02em; }
        .cl-id-stat b { font-size: 20px; }
        .cl-id-stat span, .cl-stat span { text-transform: uppercase; letter-spacing: 0.08em; font-size: 9.5px; }
        .cl-chart-summary > div { border-radius: 8px; border: 1px solid var(--line); background: var(--bg); }
        .cl-chart-summary b { font-size: 26px; }
        .cl-lrow { padding: 10px; gap: 12px; }
        .cl-lrow-title { font-size: 17px; letter-spacing: 0.01em; font-weight: 700; }
        .cl-sheet { border-radius: 16px 16px 0 0; }
        .cl-sheet-btn { border-radius: 8px; text-transform: uppercase; letter-spacing: 0.05em; font-size: 12.5px; font-weight: 700; }
        .cl-sheet-btn.primary { background: var(--accent2); color: #fff; border-color: var(--accent2); }
        .cl-overlay-header { background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .cl-overlay-title { text-transform: uppercase; letter-spacing: 0.12em; font-size: 15px; }
        .cl-avatar { background: #3A3C34; color: #F2F0E9; letter-spacing: 0.03em; }
        .cl-status-sent { background: rgba(79,127,58,0.14); color: #3F6B2C; }
        .cl-status-trying { background: rgba(200,138,18,0.16); color: #8A5F08; }
        .cl-status-deal { background: rgba(58,74,99,0.12); color: #3A4A63; }
        .cl-dark .cl-status-sent { background: rgba(134,178,110,0.16); color: #A9D58E; }
        .cl-dark .cl-status-trying { background: rgba(240,184,75,0.15); color: #F3BE55; }
        .cl-dark .cl-status-deal { background: rgba(140,160,200,0.16); color: #AEBFE0; }
        .cl-dark .cl-status-pick.sent.active { background: rgba(134,178,110,0.16); border-color: #A9D58E; color: #A9D58E; }
        .cl-dark .cl-status-pick.trying.active { background: rgba(240,184,75,0.15); border-color: #F3BE55; color: #F3BE55; }
        .cl-dark .cl-badge-item.earned { background: rgba(240,184,75,0.14); color: #F3BE55; }
        /* grade colours that are too dark to see on a dark surface (black tag, navy lead) */
        .cl-dark [style*="rgb(42, 42, 40)"] { border-color: #D8D5CA !important; }
        .cl-dark .cl-chip-dot[style*="rgb(42, 42, 40)"], .cl-dark .cl-record-grid-photo-empty[style*="rgb(42, 42, 40)"], .cl-dark .cl-lrow-icon[style*="rgb(42, 42, 40)"] { background: #D8D5CA !important; }
        .cl-dark [fill="#2A2A28"] { fill: #D8D5CA; }
        .cl-dark [style*="color: rgb(42, 42, 40)"] { color: #D8D5CA !important; }
        .cl-dark [fill="#3A4A63"] { fill: #8FA3C9; }
        .cl-dark [style*="rgb(58, 74, 99)"] { border-color: #8FA3C9 !important; }
        .cl-dark .cl-chip-dot[style*="rgb(58, 74, 99)"] { background: #8FA3C9 !important; }
        .cl-dark .cl-grade-swatch { color: var(--ink); }
        .cl-dark .cl-photo-full, .cl-dark .cl-point-photo { background: #000; }
        .cl-dark .cl-qual-chip.active { color: #0C0D0B; font-weight: 600; }
        .cl-dark .cl-me-menu { box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
        /* ---------- simplified layout ---------- */
        .cl-profile { padding: 4px 16px 14px; }
        .cl-profile-top { display: flex; align-items: center; gap: 22px; }
        .cl-profile-stats { flex: 1; display: flex; justify-content: space-around; }
        .cl-profile-stats .cl-id-stat { background: none; border: none; color: var(--ink); padding: 4px 6px; }
        .cl-profile-stats .cl-id-stat b { font-size: 22px; }
        .cl-profile-name { font-weight: 700; font-size: 16px; margin-top: 12px; }
        .cl-profile-line { color: var(--ink-soft); font-size: 13px; margin-top: 2px; }
        .cl-profile-actions { display: flex; gap: 8px; margin-top: 14px; }
        .cl-profile-actions .cl-btn-ghost { flex: 1; padding: 8px 10px; font-size: 13px; font-weight: 600; background: var(--surface); }
        .cl-menu-backdrop { position: fixed; inset: 0; z-index: 39; }
        .cl-me-menu { min-width: 190px; padding: 6px; }
        .cl-me-menu button, .cl-me-link { width: 100%; text-align: left; background: none; border: none; padding: 11px 12px; border-radius: 8px; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 10px; color: var(--ink); text-decoration: none; }
        .cl-me-menu button:hover, .cl-me-link:hover { background: var(--bg); }
        .cl-add-option { width: 100%; display: flex; align-items: center; gap: 14px; text-align: left; background: none; border: none; border-top: 1px solid var(--line); padding: 14px 4px; cursor: pointer; color: var(--ink); }
        .cl-add-option svg { color: var(--accent2); flex-shrink: 0; }
        .cl-add-option b { display: block; font-size: 15px; font-weight: 600; }
        .cl-add-option small { display: block; font-size: 12px; color: var(--ink-soft); margin-top: 1px; }
        .cl-lrow-meta { font-size: 12.5px; color: var(--ink-soft); margin-top: 6px; }
        .cl-view-toggle { flex: none; align-self: flex-start; margin: 4px 16px 8px; padding: 7px 12px; font-size: 12px; }
        .cl-progress-view { padding: 8px 16px 12px; }
        .cl-pv-caption { margin: 18px 0 8px; }
        .cl-about .cl-sub { margin-bottom: 8px; }
        .cl-tbtab { padding-left: 8px; padding-right: 8px; }
        .cl-tabbar .cl-tabs { overflow-x: auto; }
        /* ---------- secondary screens ---------- */
        .cl-toggle.active, .cl-type-btn.active, .cl-tabbar-icon.active, .cl-qual-chip.active, .cl-dark .cl-qual-chip.active {
          background: color-mix(in srgb, var(--accent2) 16%, transparent); color: var(--ink); border-color: var(--accent2); font-weight: 700;
        }
        .cl-status-pick.sent.active, .cl-status-pick.trying.active { font-weight: 700; }
        .cl-toggle-row + .cl-label, .cl-type-grid + .cl-label, .cl-qual-row + .cl-label, .cl-toggle-row + .cl-section-caption { margin-top: 16px; }
        .cl-form-section .cl-toggle-row { margin-bottom: 10px; }
        .cl-form-section .cl-toggle-row + .cl-label, .cl-form-card .cl-toggle-row + .cl-label { margin-top: 16px; }
        .cl-chat-composer, .cl-chat-input-row { padding: 10px 12px; }
        .cl-input, .cl-select, .cl-app select { min-height: 44px; }
        .cl-inline-add { gap: 8px; }
        .cl-inline-add .cl-btn-ghost, .cl-inline-add .cl-icon-btn-boxed { flex: 0 0 44px; width: 44px; min-height: 44px; padding: 0; display: flex; align-items: center; justify-content: center; color: var(--accent2); background: var(--surface); }
        .cl-gear-pill { padding: 4px 10px; font-size: 12px; }
        .cl-photo-btn { border-style: solid; background: var(--surface); }
        .cl-set-section { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 14px; }
        .cl-set-title { font-family: 'Barlow Condensed', 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; font-size: 15px; margin: 0 0 4px; color: var(--ink); }
        .cl-set-section .cl-label:first-of-type { margin-top: 10px; }
        .cl-overlay-body .cl-sticky-actions { position: sticky; bottom: 0; margin: 8px -10px -28px; padding: 12px 10px calc(14px + env(safe-area-inset-bottom)); background: color-mix(in srgb, var(--bg) 94%, transparent); backdrop-filter: blur(10px); border-top: 1px solid var(--line); }
        .cl-sticky-actions .cl-btn-ghost { flex: 0 0 auto; padding-left: 20px; padding-right: 20px; }
        .cl-sticky-actions .cl-btn-primary { margin-top: 0; }
        .cl-danger-zone { background: transparent; border: 1px solid color-mix(in srgb, var(--accent2) 45%, transparent); border-radius: 10px; padding: 14px; margin-top: 18px; }
        .cl-btn-danger { background: transparent; color: var(--accent2); border: 1px solid var(--accent2); text-transform: none; font-weight: 600; letter-spacing: 0; }
        .cl-new-session { margin: 4px 16px 12px; width: calc(100% - 32px); }
        .cl-nice-search, .cl-search-wrap { margin: 8px 16px; }
        .cl-filter-grid, .cl-filter-bar-row { margin: 0 16px 8px; }
        .cl-overlay-body .cl-resume-list { gap: 0; margin-top: 8px; }
        .cl-resume-item { border-radius: 0; border: none; border-bottom: 1px solid var(--line); background: transparent; padding: 12px 4px; color: var(--ink); font-size: 15px; font-weight: 600; }
        .cl-resume-item span { flex: 1; text-align: left; }
        .cl-card .cl-comment-input, .cl-chat-input { border-top: 1px solid var(--line); }
        .cl-empty { padding: 28px 16px; }
        .cl-style-row { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
        .cl-style-caption { font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-soft); margin-right: 2px; }
        .cl-style-chip { border: 1px solid var(--line); background: var(--surface); color: var(--ink-soft); border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
        .cl-style-chip.active { border-color: var(--accent2); color: var(--ink); background: color-mix(in srgb, var(--accent2) 16%, transparent); }
        .cl-goal-strip { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 8px; font-size: 13px; color: var(--ink); background: var(--surface); }
        .cl-goal-strip svg { color: var(--accent2); flex-shrink: 0; }
        .cl-goal-strip b { margin-left: auto; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
        .cl-next-strip { margin-top: 8px; padding: 8px 12px; border-radius: 8px; background: color-mix(in srgb, var(--accent2) 12%, transparent); border: 1px solid color-mix(in srgb, var(--accent2) 40%, transparent); font-size: 13px; }
        .cl-next-strip small { display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent2); margin-bottom: 2px; }
        .cl-next-note b { color: var(--accent2); }
        .cl-trend-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .cl-trend-card { border: 1px solid var(--line); border-radius: 10px; padding: 10px 4px; text-align: center; background: var(--surface); }
        .cl-trend-card b { display: block; font-family: 'Barlow Condensed', 'Inter', sans-serif; font-size: 21px; line-height: 1.15; white-space: nowrap; }
        .cl-trend-card span { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--ink-soft); margin-top: 2px; }
        .cl-trend-card small { display: block; font-size: 10px; color: var(--ink-soft); margin-top: 3px; }
        .cl-goal-box { margin-top: 12px; padding: 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
        .cl-goal-head { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 600; }
        .cl-stepper { display: flex; align-items: center; gap: 10px; }
        .cl-stepper b { min-width: 76px; text-align: center; font-size: 13px; }
        .cl-stepper button { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--ink); font-size: 18px; line-height: 1; cursor: pointer; }
        .cl-goal-bar { height: 6px; border-radius: 3px; background: var(--line); margin-top: 10px; overflow: hidden; }
        .cl-goal-bar i { display: block; height: 100%; background: var(--accent2); border-radius: 3px; }
        .cl-cal-btn { display: inline-flex; align-items: center; gap: 6px; color: var(--accent2); }
        .cl-clips { margin-top: 10px; }
        .cl-clip { margin-bottom: 6px; }
        .cl-clip-row { display: flex; align-items: center; gap: 8px; }
        .cl-clip-play { flex: 1; display: flex; align-items: center; gap: 8px; text-align: left; padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); color: var(--ink); font-size: 13px; font-weight: 600; cursor: pointer; }
        .cl-clip-play svg { color: var(--accent2); }
        .cl-clip-play small { margin-left: auto; font-weight: 500; color: var(--ink-soft); font-size: 11px; }
        .cl-clip-video { width: 100%; margin-top: 6px; border-radius: 8px; background: #000; max-height: 360px; }
        .cl-clip-add { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border: 1px dashed var(--line); border-radius: 8px; font-size: 12.5px; font-weight: 600; color: var(--ink); cursor: pointer; background: transparent; }
        .cl-clip-add:hover { border-color: var(--accent2); color: var(--accent2); }
        .cl-dayrow .cl-lrow-chev { flex-shrink: 0; align-self: center; color: var(--ink-soft); }
        .cl-challenges { margin-bottom: 4px; }
        .cl-challenge { display: flex; align-items: center; gap: 12px; padding: 12px; margin-bottom: 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
        .cl-challenge.first { border-color: color-mix(in srgb, var(--accent2) 55%, transparent); background: color-mix(in srgb, var(--accent2) 8%, var(--surface)); }
        .cl-challenge-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--accent2) 16%, transparent); color: var(--accent2); flex-shrink: 0; }
        .cl-challenge-main { flex: 1; min-width: 0; }
        .cl-challenge-main b { font-size: 14px; }
        .cl-challenge-main small { display: block; margin-top: 5px; font-size: 11.5px; color: var(--ink-soft); }
        .cl-challenge-main .cl-goal-bar { margin-top: 6px; }
        .cl-nav-badge { position: absolute; top: 2px; right: 8px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; background: var(--accent2); color: #fff; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; line-height: 1; }
        .cl-nav-fab svg { display: block; }
        .cl-notif-head { padding: 4px 16px 8px; }
        .cl-notif-head h2 { font-size: 20px; }
        .cl-notif-cap { margin: 14px 16px 4px; }
        .cl-notif { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: none; border: none; border-bottom: 1px solid var(--line); text-align: left; cursor: pointer; color: var(--ink); }
        .cl-notif.unread { background: color-mix(in srgb, var(--accent2) 7%, transparent); }
        .cl-notif-ava { position: relative; flex-shrink: 0; }
        .cl-notif-type { position: absolute; right: -4px; bottom: -3px; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; background: var(--accent2); border: 2px solid var(--bg); }
        .cl-notif-type.comment { background: #5A7FB8; }
        .cl-notif-type.follow { background: var(--accent); }
        .cl-notif-type.join, .cl-notif-type.invite { background: #C88A12; }
        .cl-notif-body { flex: 1; min-width: 0; display: flex; flex-direction: column; font-size: 14px; line-height: 1.35; }
        .cl-notif-body small { color: var(--ink-soft); font-size: 11.5px; margin-top: 2px; }
        .cl-notif-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent2); flex-shrink: 0; }
        .cl-notif-enable { display: flex; align-items: center; gap: 12px; margin: 4px 16px 8px; padding: 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
        .cl-notif-enable > div { flex: 1; }
        .cl-notif-enable b { display: block; font-size: 14px; }
        .cl-notif-enable small { display: block; font-size: 12px; color: var(--ink-soft); margin-top: 2px; }
        .cl-pv-sub { margin: 4px 0 8px; font-size: 12px; font-weight: 600; color: var(--ink-soft); }
        .cl-progress-view .cl-chart-card { margin-top: 14px; }
        .cl-badges-grid { margin-bottom: 4px; }
        .cl-pv-row { display: flex; align-items: center; justify-content: space-between; margin: 18px 0 8px; }
        .cl-pv-row .cl-pv-caption { margin: 0; }
        .cl-pv-share { min-height: 34px; padding: 0 12px; gap: 6px; font-size: 12px; font-weight: 600; border-radius: 8px; }
        .cl-attempts-row { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
        /* ---------- beta builder / player ---------- */
        .cl-beta-stage { position: relative; line-height: 0; user-select: none; -webkit-user-select: none; }
        .cl-beta-stage img { width: 100%; display: block; -webkit-user-drag: none; }
        .cl-beta-player .cl-beta-stage { border-radius: 10px; overflow: hidden; }
        .cl-beta-canvas, .cl-beta-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .cl-beta-mk { position: absolute; transform: translate(-50%, -50%); width: 26px; height: 26px; border-radius: 50%; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; font: 800 11px 'Inter', sans-serif; line-height: 1; box-shadow: 0 2px 7px rgba(0,0,0,0.55); pointer-events: none; transition: left .7s cubic-bezier(.3,.7,.2,1), top .7s cubic-bezier(.3,.7,.2,1); }
        .cl-beta-mk.foot { border-radius: 7px; width: 23px; height: 23px; }
        .cl-beta-mk.small { width: 22px; height: 22px; font-size: 10px; }
        .cl-beta-mk.foot.small { width: 20px; height: 20px; }
        .cl-beta-mk i { position: absolute; top: -8px; right: -9px; font-style: normal; font-size: 9px; font-weight: 800; background: #111; color: #fff; border-radius: 8px; padding: 1px 4px; border: 1px solid #fff; }
        .cl-beta-mk.active { z-index: 3; animation: cl-beta-pulse 1.1s ease-out 1; }
        .cl-beta-mk.selected { outline: 3px solid #fff; outline-offset: 2px; }
        @keyframes cl-beta-pulse { 0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.9); } 100% { box-shadow: 0 0 0 16px rgba(255,255,255,0); } }
        .cl-beta-ping { position: absolute; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #fff; transform: translate(-50%, -50%); animation: cl-beta-ping .6s ease-out forwards; pointer-events: none; }
        @keyframes cl-beta-ping { from { opacity: 1; transform: translate(-50%, -50%) scale(.4); } to { opacity: 0; transform: translate(-50%, -50%) scale(1.3); } }
        .cl-beta-controls { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
        .cl-beta-btn { width: 38px; height: 38px; flex-shrink: 0; border-radius: 9px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .cl-beta-btn.primary { background: var(--accent2); border-color: var(--accent2); color: #fff; }
        .cl-beta-range { flex: 1; min-width: 0; accent-color: var(--accent2); }
        .cl-beta-count { font-size: 12px; color: var(--ink-soft); min-width: 36px; text-align: right; font-variant-numeric: tabular-nums; }
        .cl-beta-caption { margin-top: 8px; min-height: 34px; font-size: 13px; }
        .cl-beta-caption b { font-size: 13px; }
        .cl-beta-caption p { margin: 4px 0 0; color: var(--ink); }
        .cl-beta-chipc { display: inline-flex; align-items: center; gap: 5px; margin-left: 10px; font-size: 12px; color: var(--ink-soft); text-transform: capitalize; }
        .cl-beta-chipc i { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
        .cl-beta-legend { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 8px; font-size: 11px; color: var(--ink-soft); }
        .cl-beta-legend span { display: inline-flex; align-items: center; }
        .cl-beta-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 5px; flex-shrink: 0; }
        .cl-beta-dot.foot { border-radius: 3px; }
        .cl-beta-share { margin-top: 10px; width: 100%; flex: none; }
        .cl-beta-editor .cl-beta-body { flex: 1; overflow-y: auto; padding: 10px 12px 28px; max-width: 680px; margin: 0 auto; width: 100%; }
        .cl-beta-done { color: var(--accent2); }
        .cl-beta-tools { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
        .cl-beta-tools .cl-hint { margin: 0; display: inline-flex; align-items: center; gap: 4px; }
        .cl-beta-zoom { display: inline-flex; gap: 4px; }
        .cl-beta-zoom button { display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); color: var(--ink); font-size: 12px; font-weight: 600; cursor: pointer; }
        .cl-beta-zoom button.active { border-color: var(--accent2); background: color-mix(in srgb, var(--accent2) 16%, transparent); }
        .cl-beta-colors { display: flex; gap: 6px; overflow-x: auto; padding: 2px 0 10px; }
        .cl-beta-color { flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); color: var(--ink); font-size: 12px; font-weight: 600; text-transform: capitalize; cursor: pointer; }
        .cl-beta-color i { width: 10px; height: 10px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.5); }
        .cl-beta-color small { color: var(--ink-soft); font-size: 11px; }
        .cl-beta-color.active { border-color: var(--accent2); background: color-mix(in srgb, var(--accent2) 16%, transparent); }
        .cl-beta-scroll { overflow: auto; max-height: 58vh; border-radius: 10px; border: 1px solid var(--line); background: #000; overscroll-behavior: contain; }
        .cl-beta-stage.editing { cursor: crosshair; touch-action: pan-x pan-y; }
        .cl-beta-limbs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 12px; }
        .cl-beta-limb { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 2px; border: 1px solid var(--line); border-radius: 9px; background: var(--surface); color: var(--ink-soft); font-size: 11px; font-weight: 600; cursor: pointer; }
        .cl-beta-limb .cl-beta-dot { margin: 0; width: 14px; height: 14px; }
        .cl-beta-limb.active { background: color-mix(in srgb, currentColor 12%, transparent); }
        .cl-beta-moves { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; min-height: 34px; align-items: center; }
        .cl-beta-move { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px 4px 4px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); color: var(--ink); font-size: 12px; font-weight: 600; cursor: pointer; }
        .cl-beta-move b { width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; }
        .cl-beta-move.active { border-color: #fff; }
        .cl-beta-edit { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
        .cl-beta-edit .cl-hint { margin: 0; }
        .cl-beta-actions { display: flex; gap: 8px; margin-top: 14px; }
        .cl-beta-field { margin-top: 10px; }
        .cl-beta-field-row { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }
        .cl-beta-field-row > div { flex: 1; min-width: 0; }
        .cl-beta-field-row b { display: block; font-size: 14px; }
        .cl-beta-field-row small { display: block; font-size: 11.5px; color: var(--ink-soft); margin-top: 2px; }
        .cl-beta-field-row .cl-btn-ghost { flex: 0 0 auto; padding: 8px 14px; }
        .cl-beta-build { width: 100%; justify-content: center; color: var(--accent2); border-color: color-mix(in srgb, var(--accent2) 45%, transparent); }
        .cl-beta-stage.dim::after { content: ""; position: absolute; inset: 0; background: rgba(0,0,0,0.3); pointer-events: none; }
        .cl-beta-svg.stick { z-index: 2; }
        .cl-beta-modes { display: flex; gap: 6px; margin-top: 10px; }
        .cl-beta-mode { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); color: var(--ink-soft); font-size: 12px; font-weight: 600; cursor: pointer; }
        .cl-beta-mode.active { color: var(--ink); border-color: var(--accent2); background: color-mix(in srgb, var(--accent2) 16%, transparent); }
        .cl-beta-mline { margin-top: 6px; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; }
        .cl-beta-mline p { flex-basis: 100%; margin: 2px 0 0; }
        .cl-beta-tech { display: inline-flex; align-items: center; gap: 4px; font-weight: 700; font-size: 12.5px; color: var(--accent2); }
        .cl-tech-help { display: inline-flex; align-items: center; gap: 4px; background: none; border: none; color: var(--ink-soft); padding: 2px; cursor: pointer; }
        .cl-beta-tog { display: flex; align-items: center; gap: 6px; width: 100%; margin-top: 10px; padding: 9px 12px; border: 1px dashed var(--line); border-radius: 9px; background: transparent; color: var(--ink-soft); font-size: 12.5px; font-weight: 600; text-align: left; cursor: pointer; }
        .cl-beta-tog.active { border-style: solid; border-color: var(--accent2); color: var(--ink); background: color-mix(in srgb, var(--accent2) 12%, transparent); }
        .cl-beta-move em { font-style: normal; font-weight: 800; color: var(--ink-soft); margin-right: -2px; }
        .cl-beta-move small { color: var(--accent2); font-size: 10.5px; font-weight: 700; }
        .cl-tech-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .cl-tech-card { position: relative; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); overflow: hidden; }
        .cl-tech-card.active { border-color: var(--accent2); box-shadow: 0 0 0 1px var(--accent2) inset; }
        .cl-tech-pick { width: 100%; background: none; border: none; color: var(--ink); padding: 0 0 6px; cursor: pointer; display: flex; flex-direction: column; gap: 4px; font-size: 11.5px; font-weight: 600; }
        .cl-tech-mini { width: 100%; aspect-ratio: 1; }
        .cl-tech-mini svg { border-radius: 0 !important; }
        .cl-tech-q { position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; border-radius: 50%; border: none; background: rgba(0,0,0,0.55); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; }
        .cl-tech-backdrop { z-index: 400; }
        .cl-tech-sheet { max-height: 92vh; overflow-y: auto; }
        .cl-tech-head { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
        .cl-tech-head b { flex: 1; text-align: center; font-size: 17px; }
        .cl-tech-art { width: min(100%, 340px); margin: 6px auto; aspect-ratio: 1; }
        .cl-tech-what { font-size: 14px; line-height: 1.45; margin: 8px 0; }
        .cl-tech-how { margin: 4px 0 8px; padding-left: 18px; font-size: 13.5px; line-height: 1.5; }
        .cl-tech-link { display: block; margin-top: 8px; background: none; border: none; padding: 4px 0; color: var(--accent2); font-size: 12.5px; font-weight: 600; cursor: pointer; text-align: left; }
        .cl-beta-tune { margin-top: 8px; }
        .cl-beta-tunebtn { background: none; border: 1px solid var(--line); color: var(--ink-soft); border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
        .cl-beta-tunebox { margin-top: 8px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 12px; display: grid; gap: 8px; }
        .cl-beta-tunerow { display: grid; grid-template-columns: 82px 1fr 44px; align-items: center; gap: 8px; font-size: 12px; color: var(--ink-soft); }
        .cl-beta-tunerow em { font-style: normal; text-align: right; color: var(--ink); }
        .cl-beta-tunerow input { width: 100%; accent-color: var(--accent2); }
        .cl-ql-timer { background: none; border: 1px solid var(--line); color: var(--accent2); border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; margin-right: 6px; white-space: nowrap; }
        .cl-samewall { margin: 0 0 10px; border: 1px dashed var(--line); border-radius: 12px; padding: 4px 10px; }
        .cl-samewall-toggle { width: 100%; display: flex; align-items: center; gap: 8px; background: none; border: none; color: var(--accent2); font-size: 13px; font-weight: 600; padding: 8px 0; cursor: pointer; }
        .cl-samewall.linked { display: flex; align-items: center; gap: 8px; padding: 10px; font-size: 13px; color: var(--ink); border-style: solid; border-color: var(--accent2); }
        .cl-samewall.linked span { flex: 1; }
        .cl-samewall.linked button { background: none; border: none; color: var(--ink-soft); font-size: 12px; cursor: pointer; text-decoration: underline; }
        .cl-beta-mk.surf-wall { border-style: dashed; background-image: none; opacity: 0.9; }
        .cl-beta-mk.surf-volume { box-shadow: 0 0 0 4px rgba(255,255,255,0.45); }
        .cl-beta-surf { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--ink-soft); margin: 6px 0; }
        .cl-beta-surf button { background: none; border: 1px solid var(--line); color: var(--ink); border-radius: 999px; padding: 5px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
        .cl-beta-surf button.active { background: var(--accent2); border-color: var(--accent2); color: #fff; }
        .cl-design-thumbs { display: flex; gap: 10px; justify-content: center; margin: 10px 0; }
        .cl-design-thumb { background: none; border: 2px solid var(--line); border-radius: 10px; padding: 3px; cursor: pointer; width: 84px; color: var(--ink-soft); }
        .cl-design-thumb.active { border-color: var(--accent2); color: var(--ink); }
        .cl-design-thumb img { width: 100%; display: block; border-radius: 7px; }
        .cl-design-thumb small { display: block; font-size: 10.5px; font-weight: 600; margin-top: 3px; }
        .cl-beta-free { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: 12px; color: var(--ink-soft); margin: 6px 0; }
        .cl-beta-free button { background: none; border: 1px solid var(--line); color: var(--ink); border-radius: 999px; padding: 5px 11px; font-size: 12px; font-weight: 600; cursor: pointer; }
        .cl-beta-free button.active { background: var(--accent2); border-color: var(--accent2); color: #fff; }
        .cl-beta-vid { margin-top: 10px; }
        .cl-beta-vidprog { position: relative; border: 1px solid var(--line); border-radius: 12px; padding: 10px 12px; font-size: 13px; overflow: hidden; }
        .cl-beta-vidprog span { position: relative; z-index: 1; }
        .cl-beta-vidprog i { position: absolute; left: 0; top: 0; bottom: 0; background: rgba(255,107,53,0.25); }
        .cl-beta-vidout video { width: 100%; max-height: 460px; border-radius: 12px; background: #000; display: block; }
        .cl-beta-vidbtns { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 8px; }
        .cl-beta-vidbtns .cl-btn-primary, .cl-beta-vidbtns .cl-btn-ghost { width: auto; padding: 8px 14px; font-size: 13px; }
        .cl-ql-result.big .cl-ql-res { padding: 16px 4px; }
        .cl-ql-result.big .cl-ql-res b { font-size: 17px; }
        .cl-ql-result.big .cl-ql-res.flash { border-color: #F3BE55; }
        .cl-ql-result.big .cl-ql-res.sent { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
        .cl-ql-result.big .cl-ql-res:active { transform: scale(0.97); }
        .cl-ql-chip { flex-shrink: 0; padding: 6px 11px; border: 2px solid var(--line); border-radius: 999px; background: var(--bg); color: var(--ink); font-size: 13px; font-weight: 700; cursor: pointer; }
        .cl-ql-extras { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .cl-ql-extra { display: inline-flex; align-items: center; gap: 5px; padding: 7px 12px; border: 1px dashed var(--line); border-radius: 999px; color: var(--ink-soft); background: none; font-size: 12.5px; font-weight: 600; cursor: pointer; }
        .cl-ql-name { flex: 1; min-height: 36px; font-size: 13px; }
        .cl-ql-photo { position: relative; display: inline-block; }
        .cl-ql-photo img { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; display: block; }
        .cl-ql-photo button { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; border-radius: 50%; border: none; background: #111; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .cl-ql-toast button { margin-left: auto; background: none; border: 1px solid var(--line); color: var(--ink); border-radius: 999px; padding: 3px 12px; font-size: 12px; font-weight: 700; cursor: pointer; }
        .cl-ql-more { display: flex; gap: 14px; align-items: center; }
        .cl-ql-more button { background: none; border: none; color: var(--ink-soft); font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 6px 0; }
        .cl-ql-more .done { margin-left: auto; color: var(--accent2); font-size: 14px; }
        .cl-ql-link { background: none; border: none; color: var(--accent2); font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; padding: 4px; }
        .cl-qp-sheet { height: 88vh; max-height: 88vh; display: flex; flex-direction: column; padding-bottom: calc(env(safe-area-inset-bottom) + 14px); }
        .cl-qp-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 0 10px; }
        .cl-qp-head b { font-family: 'Barlow Condensed', 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.08em; font-size: 20px; }
        .cl-qp-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
        .cl-qp-types { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
        .cl-qp-types button { padding: 14px 2px; border-radius: 12px; border: 1px solid var(--line); background: var(--bg); color: var(--ink); font-size: 13px; white-space: nowrap; font-weight: 700; cursor: pointer; }
        .cl-qp-types button.active { border-color: var(--accent2); background: color-mix(in srgb, var(--accent2) 16%, transparent); }
        .cl-qp-grades { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .cl-qp-grades button { min-height: 62px; border-radius: 14px; border: 2px solid var(--line); background: transparent; color: var(--ink); font-size: 20px; font-weight: 800; cursor: pointer; }
        .cl-qp-grades button.active { color: #fff; }
        .cl-qp-grades button:active { transform: scale(0.96); }
        .cl-qp-other { display: flex; flex-direction: column; gap: 10px; }
        .cl-qp-links { margin-top: auto; display: flex; flex-direction: column; }
        .cl-qp-links button { display: flex; align-items: center; gap: 10px; padding: 14px 4px; background: none; border: none; border-top: 1px solid var(--line); color: var(--ink); font-size: 15px; font-weight: 600; cursor: pointer; text-align: left; }
        .cl-qp-links button svg { color: var(--accent2); }
        .cl-qp-links em, .cl-qp-list em { margin-left: auto; font-style: normal; color: var(--ink-soft); }
        .cl-qp-chip { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg); color: var(--ink); font-size: 14px; cursor: pointer; text-align: left; }
        .cl-qp-chip b { color: #fff; border-radius: 8px; padding: 4px 9px; font-size: 15px; }
        .cl-qp-tries { display: flex; align-items: center; gap: 14px; justify-content: center; font-size: 15px; font-weight: 600; }
        .cl-qp-tries span { margin-right: auto; }
        .cl-qp-tries button { width: 52px; height: 52px; border-radius: 14px; border: 1px solid var(--line); background: var(--bg); color: var(--ink); font-size: 26px; cursor: pointer; }
        .cl-qp-tries b { min-width: 40px; text-align: center; font-size: 28px; }
        .cl-qp-results { flex: 1; display: flex; flex-direction: column; gap: 12px; min-height: 240px; }
        .cl-qp-res { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border-radius: 18px; border: 2px solid var(--line); background: var(--bg); color: var(--ink); cursor: pointer; }
        .cl-qp-res b { font-size: 26px; font-family: 'Barlow Condensed', 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.06em; }
        .cl-qp-res small { font-size: 12.5px; color: var(--ink-soft); }
        .cl-qp-res.flash { border-color: #F3BE55; background: rgba(243,190,85,0.12); }
        .cl-qp-res.sent { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, transparent); }
        .cl-qp-res:active { transform: scale(0.98); }
        .cl-qp-list { display: flex; flex-direction: column; }
        .cl-qp-list button { display: flex; align-items: center; gap: 12px; padding: 12px 4px; background: none; border: none; border-top: 1px solid var(--line); color: var(--ink); cursor: pointer; text-align: left; }
        .cl-qp-list img, .cl-qp-badge { width: 48px; height: 48px; border-radius: 10px; object-fit: cover; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; background: var(--line); }
        .cl-qp-lt { display: flex; flex-direction: column; min-width: 0; }
        .cl-qp-lt b { font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cl-qp-lt small { font-size: 12px; color: var(--ink-soft); }
        .cl-qp-done { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px 0 8px; text-align: center; }
        .cl-qp-done span { width: 72px; height: 72px; border-radius: 50%; background: color-mix(in srgb, var(--accent) 20%, transparent); color: var(--accent); display: flex; align-items: center; justify-content: center; }
        .cl-qp-done b { font-size: 22px; }
        .cl-qp-done small { color: var(--ink-soft); }
        .cl-qp-next { margin-top: 0; padding: 18px; font-size: 17px; }
        .cl-qp-after { display: flex; flex-direction: column; gap: 6px; margin-top: auto; }
        .cl-qp-act { display: flex; align-items: center; gap: 10px; padding: 15px 4px; background: none; border: none; border-top: 1px solid var(--line); color: var(--ink); font-size: 15px; font-weight: 600; cursor: pointer; }
        .cl-qp-act svg { color: var(--accent2); }
        .cl-qp-act.muted { color: var(--ink-soft); justify-content: center; }
        .cl-qp-namerow { display: flex; gap: 8px; align-items: center; padding: 8px 0; }
        .cl-qp-namerow .cl-btn-ghost { width: auto; padding: 10px 16px; }
        .cl-qp-photook { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--ink-soft); padding: 8px 0; }
        .cl-qp-photook img { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; }
        .cl-beta-order { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0; }
        .cl-beta-order button { background: none; border: 1px solid var(--line); color: var(--ink); border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
        .cl-beta-order button:disabled { opacity: 0.35; cursor: default; }
        .cl-beta-ins { display: flex; align-items: center; gap: 8px; justify-content: space-between; padding: 8px 12px; border: 1px solid var(--accent2); border-radius: 12px; font-size: 12.5px; margin: 6px 0; }
        .cl-beta-ins button { background: var(--accent2); color: #fff; border: none; border-radius: 999px; padding: 5px 12px; font-size: 12px; font-weight: 700; cursor: pointer; }
        .cl-beta-editor .cl-beta-body.ed { display: flex; flex-direction: column; overflow: hidden; padding: 0; max-width: none; }
        .cl-beta-stagebox { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; padding: 8px 12px 0; }
        .cl-beta-scroll.fit { flex: 1 1 auto; min-height: 0; max-height: none; display: flex; align-items: flex-start; justify-content: flex-start; }
        .cl-beta-scroll.fit .cl-beta-stage { margin: 0 auto; flex: none; }
        .cl-beta-panel .compact .cl-beta-limbs { gap: 4px; }
        .cl-beta-panel .compact .cl-beta-limb { min-height: 40px; flex-direction: row; justify-content: center; padding: 6px 2px; font-size: 11px; gap: 4px; }
        .cl-beta-edhead small { font-weight: 500; color: var(--ink-soft); font-size: 11.5px; }
        .cl-beta-dock { flex: 0 0 auto; max-height: 46%; display: flex; flex-direction: column; background: var(--surface); border-top: 1px solid var(--line); border-radius: 18px 18px 0 0; margin-top: 8px; box-shadow: 0 -8px 24px rgba(0,0,0,0.25); }
        .cl-beta-dockbody { overflow-y: auto; flex: 1 1 auto; min-height: 0; padding: 4px 12px 8px; }
        .cl-beta-dockbar { display: flex; gap: 8px; padding: 8px 12px calc(env(safe-area-inset-bottom) + 10px); border-top: 1px solid var(--line); }
        .cl-beta-dockbar .cl-btn-ghost, .cl-beta-dockbar .cl-btn-primary { flex: 1; margin-top: 0; padding: 13px; }
        .cl-beta-dockbar .cl-btn-primary { flex: 2; }
        .cl-btn-ghost.danger { color: #E5484D; }
        .cl-beta-strip { display: flex; align-items: center; gap: 6px; overflow-x: auto; padding: 10px 12px 6px; flex: none; scrollbar-width: none; }
        .cl-beta-stepc { position: relative; display: inline-flex; align-items: center; gap: 4px; padding: 6px 6px 6px 22px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg); flex: none; }
        .cl-beta-stepc.active { border-color: var(--accent2); }
        .cl-beta-stepn { position: absolute; left: 6px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 800; color: var(--ink-soft); }
        .cl-beta-pill { border: 2px solid transparent; border-radius: 9px; min-width: 34px; padding: 6px 6px; font-size: 11px; font-weight: 800; cursor: pointer; }
        .cl-beta-pill.active { border-color: #fff; }
        .cl-beta-plus { flex: none; width: 28px; height: 28px; border-radius: 50%; border: 1px dashed var(--line); background: none; color: var(--ink-soft); font-size: 16px; line-height: 1; cursor: pointer; }
        .cl-beta-plus.active { background: var(--accent2); border-color: var(--accent2); color: #fff; }
        .cl-beta-panel { display: flex; flex-direction: column; gap: 8px; }
        .cl-beta-panel .cl-beta-limbs { margin-top: 0; }
        .cl-beta-limb { min-height: 54px; justify-content: center; }
        .cl-beta-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
        .cl-beta-row.free { padding-top: 2px; }
        .cl-beta-lab { font-size: 12px; color: var(--ink-soft); margin-right: 2px; }
        .cl-beta-row button, .cl-beta-chip { border: 1px solid var(--line); background: none; color: var(--ink); border-radius: 999px; padding: 8px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
        .cl-beta-row button.active, .cl-beta-chip.active { background: var(--accent2); border-color: var(--accent2); color: #fff; }
        .cl-beta-chip.wide { margin-left: auto; }
        .cl-beta-tip { margin: 0; font-size: 12.5px; color: var(--ink-soft); }
        .cl-beta-edhead { display: flex; align-items: center; justify-content: space-between; }
        .cl-beta-edhead b { font-size: 14px; }
        .cl-beta-techbtn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg); color: var(--ink); cursor: pointer; text-align: left; }
        .cl-beta-techbtn span { font-size: 12px; color: var(--ink-soft); }
        .cl-beta-techbtn b { flex: 1; font-size: 14px; color: var(--accent2); }
        .cl-log-top-actions { display: flex; gap: 8px; margin: 12px 0; }
        .cl-log-top-actions .cl-log-try { flex: 2; margin-top: 0; padding: 14px; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .cl-log-top-actions .cl-btn-ghost { flex: 1; padding: 14px 8px; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .cl-chip-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border: 1px solid var(--line); border-radius: 999px; background: none; color: var(--ink); font-size: 12px; font-weight: 600; cursor: pointer; }
        .cl-chip-btn svg { color: var(--accent2); }
        .cl-record-summary { margin: 12px 0 0; }
        .cl-form-photo { width: 100%; max-height: 240px; object-fit: cover; border-radius: 12px; display: block; margin-bottom: 8px; }
        .cl-form-bar { position: sticky; bottom: 0; z-index: 5; background: var(--card); margin: 12px -16px -16px; padding: 12px 16px calc(env(safe-area-inset-bottom) + 12px); border-top: 1px solid var(--line); border-radius: 0 0 14px 14px; }
        .cl-beta-field-row { padding: 14px; border-radius: 14px; }
        .cl-beta-build { padding: 14px; font-size: 14px; }
        .cl-beta-player .cl-beta-stage { border-radius: 16px; }
        .cl-beta-tap { position: absolute; inset: 0; width: 100%; height: 100%; background: none; border: none; padding: 0; cursor: pointer; z-index: 4; display: flex; align-items: center; justify-content: center; }
        .cl-beta-bigplay { width: 68px; height: 68px; border-radius: 50%; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px); color: #fff; display: flex; align-items: center; justify-content: center; }
        .cl-beta-badge { position: absolute; left: 10px; top: 10px; z-index: 5; display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(0,0,0,0.62); backdrop-filter: blur(6px); color: #fff; font: 700 12.5px 'Inter', sans-serif; line-height: 1.2; pointer-events: none; }
        .cl-beta-badge em { font-style: normal; color: #FFB08A; }
        .cl-beta-seg { position: absolute; right: 10px; top: 10px; z-index: 6; display: inline-flex; padding: 3px; border-radius: 999px; background: rgba(0,0,0,0.62); backdrop-filter: blur(6px); line-height: 1.2; }
        .cl-beta-seg button { display: inline-flex; align-items: center; gap: 4px; border: none; background: none; color: rgba(255,255,255,0.75); font: 700 12px 'Inter', sans-serif; padding: 6px 11px; border-radius: 999px; cursor: pointer; }
        .cl-beta-seg button.active { background: var(--accent2); color: #fff; }
        .cl-beta-player .cl-beta-controls { gap: 8px; margin-top: 12px; }
        .cl-beta-player .cl-beta-btn { width: 44px; height: 44px; border-radius: 12px; }
        .cl-beta-player .cl-beta-btn.primary { width: 52px; height: 52px; border-radius: 16px; }
        .cl-beta-player .cl-beta-btn.on { border-color: var(--accent2); color: var(--accent2); }
        .cl-beta-dots { flex: 1; min-width: 0; display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; padding: 2px; }
        .cl-beta-dots button { flex: 1 0 22px; height: 28px; border-radius: 8px; border: 1px solid var(--line); background: none; color: var(--ink-soft); font-size: 11px; font-weight: 700; cursor: pointer; }
        .cl-beta-dots button.done { background: color-mix(in srgb, var(--accent2) 22%, transparent); color: var(--ink); border-color: transparent; }
        .cl-beta-dots button.active { background: var(--accent2); border-color: var(--accent2); color: #fff; }
        .cl-beta-speed { flex: none; border: 1px solid var(--line); background: none; color: var(--ink); border-radius: 10px; padding: 0 9px; height: 34px; font-size: 12px; font-weight: 700; cursor: pointer; }
        .cl-beta-card { margin-top: 10px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); font-size: 13px; }
        .cl-beta-cardhead { display: flex; align-items: baseline; gap: 8px; }
        .cl-beta-cardhead b { font-size: 15px; }
        .cl-beta-cardhead span { color: var(--ink-soft); font-size: 12.5px; }
        .cl-beta-card .cl-beta-chipc.lim { margin-left: 0; font-weight: 700; color: var(--ink); }
        .cl-beta-card .cl-beta-mline { padding-top: 8px; border-top: 1px solid var(--line); margin-top: 8px; }
        .cl-beta-actions2 { display: flex; gap: 8px; margin-top: 10px; }
        .cl-beta-act { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: none; color: var(--ink); font-size: 13.5px; font-weight: 700; cursor: pointer; }
        .cl-beta-act svg { color: var(--accent2); }
        .cl-add-option.primary b { color: var(--accent2); }
        .cl-session-bar { position: fixed; left: 8px; right: 8px; bottom: calc(76px + env(safe-area-inset-bottom)); z-index: 49; display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 12px; border-radius: 12px; background: var(--surface); border: 1px solid color-mix(in srgb, var(--accent2) 55%, var(--line)); box-shadow: 0 8px 22px rgba(0,0,0,0.35); max-width: 664px; margin: 0 auto; }
        .cl-session-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--accent2); animation: cl-blink 1.4s ease-in-out infinite; flex-shrink: 0; }
        @keyframes cl-blink { 50% { opacity: 0.25; } }
        .cl-session-bar b { font-variant-numeric: tabular-nums; font-size: 15px; }
        .cl-session-meta { flex: 1; min-width: 0; font-size: 11.5px; color: var(--ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cl-session-bar button { border: 1px solid var(--line); background: var(--bg); color: var(--ink); border-radius: 8px; padding: 7px 12px; font-size: 12.5px; font-weight: 700; cursor: pointer; }
        .cl-session-bar button.end { color: var(--accent2); border-color: color-mix(in srgb, var(--accent2) 50%, transparent); }
        .cl-ql-sheet { max-height: 94vh; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
        .cl-ql-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .cl-ql-head b { font-size: 18px; font-family: 'Barlow Condensed', 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.08em; display: block; }
        .cl-ql-gym { background: none; border: none; padding: 2px 0; color: var(--ink-soft); font-size: 12.5px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
        .cl-ql-gyminput { margin-top: 4px; min-height: 36px; font-size: 13px; }
        .cl-ql-cap { margin: 0; font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-soft); }
        .cl-ql-recent { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; }
        .cl-ql-proj { flex-shrink: 0; max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 7px 12px; border: 1px solid var(--line); border-radius: 999px; background: var(--bg); color: var(--ink); font-size: 12.5px; font-weight: 600; cursor: pointer; }
        .cl-ql-proj.active { border-color: var(--accent2); background: color-mix(in srgb, var(--accent2) 16%, transparent); }
        .cl-ql-result { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .cl-ql-res { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 12px 4px; border: 1px solid var(--line); border-radius: 12px; background: var(--bg); color: var(--ink-soft); cursor: pointer; }
        .cl-ql-res b { font-size: 15px; color: var(--ink); }
        .cl-ql-res small { font-size: 10.5px; }
        .cl-ql-res.active { border-width: 2px; border-color: var(--accent2); background: color-mix(in srgb, var(--accent2) 14%, transparent); }
        .cl-ql-res.active.sent { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, transparent); }
        .cl-ql-res.active.flash { border-color: #F3BE55; background: rgba(243,190,85,0.16); }
        .cl-ql-row { display: flex; align-items: center; justify-content: space-between; font-size: 13.5px; font-weight: 600; }
        .cl-ql-toast { margin: 0; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--accent); }
        .cl-ql-actions { display: flex; gap: 8px; }
        .cl-ql-actions .cl-btn-ghost { flex: 0 0 auto; padding: 12px 22px; }
        .cl-ql-actions .cl-btn-primary { flex: 1; }
        .cl-timechips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        .cl-timechip { padding: 8px 12px; border: 1px solid var(--line); border-radius: 999px; background: var(--surface); color: var(--ink); font-size: 13px; font-weight: 600; cursor: pointer; }
        .cl-timechip.active { border-color: var(--accent2); background: color-mix(in srgb, var(--accent2) 16%, transparent); }
        .cl-timechip-other { width: 84px; }
        .cl-timechip-other .cl-input { min-height: 38px; padding: 6px 10px; }
        .cl-more-toggle { width: 100%; margin: 6px 0; padding: 11px 12px; border: 1px dashed var(--line); border-radius: 10px; background: transparent; color: var(--accent2); font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; }
        .cl-addphoto { display: flex; align-items: center; gap: 8px; width: 100%; margin: 10px 0 0; padding: 12px; border: 1px dashed color-mix(in srgb, var(--accent2) 50%, transparent); border-radius: 10px; background: color-mix(in srgb, var(--accent2) 8%, transparent); color: var(--ink); font-size: 13.5px; font-weight: 600; cursor: pointer; text-align: left; }
        .cl-addphoto svg { color: var(--accent2); }
      `), bootstrapping || me && !hasLoadedOnce ? /* @__PURE__ */ React.createElement("div", { className: "cl-onboard" }, /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, "Loading\u2026")) : !me && guestUsername ? /* @__PURE__ */ React.createElement(GuestProfileView, { username: guestUsername, onGoToLogin: () => {
    setGuestUsername(null);
    try {
      window.history.replaceState({}, "", window.location.pathname);
    } catch {
    }
  } }) : !me || !profiles[me] ? /* @__PURE__ */ React.createElement(Onboarding, { onCreate: createProfile, onResume: resumeProfile, checkingSlug: creating, authedUid: me && !profiles[me] ? me : null }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "cl-header" }, /* @__PURE__ */ React.createElement("div", { className: "cl-wordmark" }, /* @__PURE__ */ React.createElement(Mountain, { size: 20, strokeWidth: 2.4 }), /* @__PURE__ */ React.createElement("h1", null, "Chalkline")), /* @__PURE__ */ React.createElement("div", { className: "cl-header-right" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => setShowPeopleSearch(true), title: "Find people", "aria-label": "Find people" }, /* @__PURE__ */ React.createElement(UserSearch, { size: 20 })), /* @__PURE__ */ React.createElement("div", { className: "cl-me-wrap" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => setMenuOpen((v) => !v), "aria-label": "Menu", title: "Menu" }, /* @__PURE__ */ React.createElement(MenuIcon, { size: 21 })), menuOpen && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "cl-menu-backdrop", onClick: () => setMenuOpen(false) }), /* @__PURE__ */ React.createElement("div", { className: "cl-me-menu" }, /* @__PURE__ */ React.createElement("button", { onClick: () => { setMenuOpen(false); setShowSettings(true); } }, /* @__PURE__ */ React.createElement(Settings, { size: 15 }), " Settings"), /* @__PURE__ */ React.createElement("a", { className: "cl-me-link", href: "https://buymeacoffee.com/itszhixianv", target: "_blank", rel: "noreferrer", onClick: () => setMenuOpen(false) }, /* @__PURE__ */ React.createElement(Coffee, { size: 15 }), " Buy me a coffee"), /* @__PURE__ */ React.createElement("button", { onClick: () => { setMenuOpen(false); logOut(); } }, /* @__PURE__ */ React.createElement(LogOut, { size: 15 }), " Log out")))))),  /* @__PURE__ */ React.createElement("div", { className: "cl-main" }, tab === "home" && /* @__PURE__ */ React.createElement(
    HomeTab,
    {
      me,
      profile: profiles[me],
      saveProfile,
      allProfiles: profiles,
      refreshAll,
      logs,
      commentsMap,
      addLog,
      addComment,
      toggleKudo,
      deleteLog,
      addTry,
      togglePrivacy,
      toggleSave,
      loading: loadingFeed,
      onOpenProfile: openProfile,
      onOpenSettings: () => setShowSettings(true),
      onEnlarge: (photo, points) => setLightbox({ photo, points }),
      onOpenNewPost: () => setShowNewPost(true),
      onOpenNewSocialPost: () => setShowSocialPost({}),
      onLiveLog: (entry) => setLiveLogState({ continueEntry: entry }),
      onShare,
      onShareProfile: shareProfileStats,
      onShareBadge: shareBadge,
      onShareToday: shareToday,
      onShareDay: shareDay,
      onShareProgress: shareProgress,
      onOpenDay: setViewingDay,
      onShareToPost: (entry) => setShowSocialPost({ attachLogId: entry.id }),
      onOpenLogDetail: setViewingLogDetail
    }
  ), tab === "feed" && /* @__PURE__ */ React.createElement(
    FeedTab,
    {
      me,
      profile: profiles[me],
      logs,
      profiles,
      commentsMap,
      addComment,
      toggleKudo,
      deleteLog,
      addTry,
      togglePrivacy,
      toggleSave,
      onOpenProfile: openProfile,
      onEnlarge: (photo, points) => setLightbox({ photo, points }),
      onOpenNewPost: () => setShowSocialPost({}),
      onShare,
      allLogs: logs,
      onOpenLogDetail: setViewingLogDetail
    }
  ), tab === "sessions" && /* @__PURE__ */ React.createElement(
    SessionsTab,
    {
      me,
      profile: profiles[me],
      sessions,
      profiles,
      addSession,
      joinSession,
      leaveSession,
      deleteSession,
      onOpenProfile: openProfile,
      commentsMap,
      addComment
    }
  ), tab === "alerts" && React.createElement(NotificationsTab, { events: notifs.events, profiles, viewReadAt, perm: notifPerm, onEnable: enableAlerts, onOpen: openNotif })), session && React.createElement("div", { className: "cl-session-bar" }, React.createElement("span", { className: "cl-session-dot" }), React.createElement("b", null, fmtClock(Date.now() - session.start)), React.createElement("span", { className: "cl-session-meta" }, session.n, session.n === 1 ? " problem" : " problems", " \u00B7 ", session.attempts, " tries \u00B7 ", session.sent, " sent"), React.createElement("button", { type: "button", onClick: () => setShowQuick(true) }, "Log"), React.createElement("button", { type: "button", className: "end", onClick: endSession }, "End")), /* @__PURE__ */ React.createElement("div", { className: "cl-nav" }, /* @__PURE__ */ React.createElement("div", { className: "cl-nav-inner" }, /* @__PURE__ */ React.createElement("button", { className: tab === "feed" ? "active" : "", onClick: () => setTab("feed"), title: "Home", "aria-label": "Home" }, /* @__PURE__ */ React.createElement(HomeIcon, { size: 22 })), /* @__PURE__ */ React.createElement("button", { className: tab === "sessions" ? "active" : "", onClick: () => setTab("sessions"), title: "Sessions", "aria-label": "Sessions" }, /* @__PURE__ */ React.createElement(CalendarDays, { size: 22 })), React.createElement("button", { className: "cl-nav-fab", onClick: () => setShowQuick(true), title: "Log a climb", "aria-label": "Log a climb" }, React.createElement("svg", { width: 28, height: 24, viewBox: "0 0 24 20", fill: "currentColor", "aria-hidden": "true" }, React.createElement("path", { d: "M1 19 L8 5 L12 12.5 L15.5 7 L23 19Z" }))), React.createElement("button", { className: tab === "alerts" ? "active" : "", onClick: () => setTab("alerts"), title: "Notifications", "aria-label": "Notifications" }, React.createElement(Bell, { size: 22 }), unreadCount > 0 && React.createElement("span", { className: "cl-nav-badge" }, unreadCount > 9 ? "9+" : unreadCount)), /* @__PURE__ */ React.createElement("button", { className: tab === "home" ? "active" : "", onClick: () => setTab("home"), title: "Profile", "aria-label": "Profile" }, /* @__PURE__ */ React.createElement(Avatar, { name: profiles[me].name, photo: profiles[me].photo, size: 26 })))), showQuick && React.createElement(QuickLogSheet, { me, logs, session, gymDefault: profiles[me] && profiles[me].mainGym, onClose: () => setShowQuick(false), onLog: createClimbPost, onAddTry: addTry, onLogged: quickLogged, onUndo: undoQuick, onEditItem: setQuickEdit, onPatch: patchLog, onFull: () => { setShowQuick(false); setShowNewPost(true); }, onPost: () => { setShowQuick(false); setShowSocialPost({}); } }), quickEdit && React.createElement(QuickEditSheet, { item: quickEdit, onClose: () => setQuickEdit(null), onSave: async (lid, uid2, climb) => { await editClimbQuick(lid, uid2, climb); setQuickEdit(null); }, onDelete: async (lid, uid2) => { const gone = (logs.find((l) => l.id === lid) || { updates: [] }).updates.length <= 1; await deleteUpdate(lid, uid2); setQuickEdit(null); if (gone && viewingLogDetail && viewingLogDetail.id === lid) setViewingLogDetail(null); }, onOpenLog: (l) => { setQuickEdit(null); setShowQuick(false); setViewingLogDetail(l); } }), sessionSummary && React.createElement(BottomSheet, { title: "Session done", message: `${Math.max(1, Math.round((sessionSummary.end - sessionSummary.start) / 6e4))} min at ${sessionSummary.gym} \u00B7 ${sessionSummary.n} problems \u00B7 ${sessionSummary.attempts} tries \u00B7 ${sessionSummary.sent} sent. Open any log to add photos, beta or notes.`, confirmLabel: "Nice", onCancel: () => setSessionSummary(null), onConfirm: () => setSessionSummary(null) }), viewingProfile && /* @__PURE__ */ React.createElement(
    ProfileView,
    {
      slug: viewingProfile,
      me,
      profiles,
      logs,
      commentsMap,
      onClose: () => setViewingProfile(null),
      onToggleFollow: toggleFollow,
      onToggleBlock: toggleBlock,
      addComment,
      toggleKudo,
      toggleSave,
      onShare,
      onShareToPost: (entry) => setShowSocialPost({ attachLogId: entry.id }),
      onOpenLogDetail: setViewingLogDetail,
      onOpenDay: (ts, slug) => setViewingDay({ ts, slug }),
      onEnlarge: (photo, points) => setLightbox({ photo, points }),
      onShareProfile: shareAnyProfile
    }
  ), showPeopleSearch && /* @__PURE__ */ React.createElement(PeopleSearch, { me, profiles, onClose: () => setShowPeopleSearch(false), onOpenProfile: openProfile }), showSettings && /* @__PURE__ */ React.createElement(SettingsOverlay, { profile: profiles[me], onSave: saveProfile, onClose: () => setShowSettings(false), onDeleteAccount: deleteAccount }), showNewPost && /* @__PURE__ */ React.createElement(
    NewPostOverlay,
    {
      defaultGym: profiles[me].mainGym || GYM_OPTIONS[0],
      logs: logs.filter((l) => l.authorSlug === me),
      onClose: () => setShowNewPost(false),
      onAddTry: addTry,
      onSaveLog: createClimbPost
    }
  ), showSocialPost && /* @__PURE__ */ React.createElement(
    SocialPostOverlay,
    {
      myLogs: logs.filter((l) => l.authorSlug === me && l.kind === "climb"),
      onClose: () => setShowSocialPost(null),
      onSavePost: createSocialPost,
      initialAttachedLogId: showSocialPost.attachLogId || null
    }
  ), liveLogState && /* @__PURE__ */ React.createElement(
    LiveLogOverlay,
    {
      continueEntry: liveLogState.continueEntry,
      defaultGym: profiles[me].mainGym || GYM_OPTIONS[0],
      onClose: () => setLiveLogState(null),
      onSaveNew: createClimbPost,
      onSaveContinue: addTry
    }
  ), shareData && /* @__PURE__ */ React.createElement(ShareCardModal, { data: shareData, onClose: () => setShareData(null) }), sharePostData && /* @__PURE__ */ React.createElement(
    SharePostModal,
    {
      entry: sharePostData.entry,
      profile: sharePostData.profile,
      me,
      profiles,
      onClose: () => setSharePostData(null)
    }
  ), viewingDay && React.createElement(DayConclusionModal, { targetDate: typeof viewingDay === "object" ? viewingDay.ts : viewingDay, logs: typeof viewingDay === "object" ? logs.filter((l) => l.privacy !== "private") : logs, me: typeof viewingDay === "object" ? viewingDay.slug : me, readOnly: typeof viewingDay === "object", onClose: () => setViewingDay(null), onShareDay: shareDay, onOpenLogDetail: setViewingLogDetail }), viewingLogDetail && /* @__PURE__ */ React.createElement(LogDetailModal, { entry: logs.find((l) => l.id === viewingLogDetail.id) || viewingLogDetail, onQuickEdit: setQuickEdit, onClose: () => setViewingLogDetail(null), onEnlarge: (photo, points) => setLightbox({ photo, points }), me, onDelete: deleteLog, onTogglePrivacy: togglePrivacy, onAddTry: addTry, onEditEntry: editEntry, onUpdateVideos: setUpdateVideos, onLiveLog: (entryArg) => setLiveLogState({ continueEntry: entryArg }), onShare, onShareToPost: (entryArg) => setShowSocialPost({ attachLogId: entryArg.id }) }), viewingSharedPost && /* @__PURE__ */ React.createElement("div", { className: "cl-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => setViewingSharedPost(null) }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, "Shared post"), /* @__PURE__ */ React.createElement("div", { style: { width: 32 } })), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body" }, /* @__PURE__ */ React.createElement(
    PostCard,
    {
      entry: viewingSharedPost,
      profile: profiles[viewingSharedPost.authorSlug],
      comments: commentsMap[viewingSharedPost.id] || [],
      me,
      allLogs: logs,
      onComment: addComment,
      onKudo: toggleKudo,
      onDelete: deleteLog,
      onToggleSave: toggleSave,
      onOpenProfile: (slug) => {
        setViewingSharedPost(null);
        openProfile(slug);
      },
      onEnlarge: (photo, points) => setLightbox({ photo, points }),
      onShare,
      onOpenLogDetail: setViewingLogDetail,
      onAddTry: addTry,
      onTogglePrivacy: togglePrivacy,
      onLiveLog: () => {
      },
      hideLogActions: true
    }
  ))), sharedPostError && /* @__PURE__ */ React.createElement("p", { className: "cl-copied-toast", style: { position: "fixed", top: 8, left: 12, right: 12, zIndex: 999, borderRadius: 8 } }, sharedPostError), lightbox && /* @__PURE__ */ React.createElement("div", { className: "cl-lightbox", onClick: () => setLightbox(null) }, /* @__PURE__ */ React.createElement("button", { className: "cl-lightbox-close", onClick: () => setLightbox(null) }, /* @__PURE__ */ React.createElement(X, { size: 18 })), /* @__PURE__ */ React.createElement("div", { className: "cl-lightbox-imgwrap", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("img", { src: lightbox.photo, alt: "enlarged" }), normalizePoints(lightbox.points).start.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `ls${i}`, className: "cl-point-marker start", style: { left: `${p.x}%`, top: `${p.y}%` } }, "S")), normalizePoints(lightbox.points).end.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `le${i}`, className: "cl-point-marker end", style: { left: `${p.x}%`, top: `${p.y}%` } }, "E")), normalizePoints(lightbox.points).fall.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `lf${i}`, className: "cl-point-marker fall", style: { left: `${p.x}%`, top: `${p.y}%` } }, i + 1))))));
}
var ErrorBoundary = class extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Chalkline crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return /* @__PURE__ */ React.createElement("div", { style: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 12,
        padding: 24,
        fontFamily: "sans-serif",
        textAlign: "center",
        background: "#E7E3D8",
        color: "#22241F"
      } }, /* @__PURE__ */ React.createElement("h2", { style: { margin: 0, fontSize: 20 } }, "Something went wrong"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "#5B5A50", maxWidth: 360 } }, this.state.error.message || "An unexpected error occurred."), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => this.setState({ error: null }),
          style: { background: "#22241F", color: "#FBFAF6", border: "none", borderRadius: 7, padding: "10px 18px", fontSize: 14, cursor: "pointer" }
        },
        "Try again"
      ));
    }
    return this.props.children;
  }
};
function App() {
  return /* @__PURE__ */ React.createElement(ErrorBoundary, null, /* @__PURE__ */ React.createElement(ChalklineApp, null));
}
export {
  App as default
};
