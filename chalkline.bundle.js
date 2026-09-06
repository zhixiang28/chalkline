// chalkline.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mountain,
  Camera,
  CalendarDays,
  Plus,
  MessageCircle,
  X,
  Check,
  Send,
  RefreshCw,
  ChevronRight,
  ChevronDown,
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
  Coffee
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
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
function boulderOptionLabel(g) {
  return g === "NA" ? "N/A / \u2013" : g;
}
var PROFILE_BOULDER_OPTIONS = ["NA", ...BOULDER_GRADES];
var PROFILE_ROUTE_OPTIONS = ["NA", ...ROUTE_GRADES];
var QUALIFICATION_PRESETS = ["Bouldering", "Top rope", "Lead", "Belayer", "Auto belay", "Outdoor leader"];
var QUALIFICATION_ICONS = {
  "Bouldering": CircleDot,
  "Top rope": ArrowUpFromLine,
  "Lead": Flag,
  "Belayer": Anchor,
  "Auto belay": Repeat,
  "Outdoor leader": Compass
};
var TYPE_LABELS = { boulder: "Boulder", toprope: "Top rope", lead: "Lead", other: "Other" };
var TYPES = ["boulder", "toprope", "lead", "other"];
var TYPE_ICONS = { boulder: CircleDot, toprope: ArrowUpFromLine, lead: Flag, other: MoreHorizontal };
var STATUS_LABELS = { sent: "Finished", trying: "Trying" };
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
  { id: "first-post", label: "First post", icon: Mountain, test: (s) => s.totalTries >= 1 },
  { id: "finish-10", label: "10 finished", icon: CheckCircle2, test: (s) => s.totalSent >= 10 },
  { id: "finish-50", label: "50 finished", icon: CheckCircle2, test: (s) => s.totalSent >= 50 },
  { id: "hours-10", label: "10 hours", icon: Clock, test: (s) => s.totalMinutes >= 600 },
  { id: "hours-50", label: "50 hours", icon: Clock, test: (s) => s.totalMinutes >= 3e3 },
  { id: "hours-100", label: "100 hours", icon: Clock, test: (s) => s.totalMinutes >= 6e3 },
  { id: "hours-500", label: "500 hours", icon: Clock, test: (s) => s.totalMinutes >= 3e4 },
  { id: "hours-1000", label: "1000 hours", icon: Clock, test: (s) => s.totalMinutes >= 6e4 },
  ...BOULDER_GRADES.map((g) => ({
    id: `boulder-${g}`,
    label: `Boulder ${g}`,
    icon: CircleDot,
    test: (s) => s.boulderRank >= gradeRank("boulder", g)
  })),
  ...ROUTE_GRADES.map((g) => ({
    id: `route-${g}`,
    label: `Route ${usGrade(g)}`,
    icon: Flag,
    test: (s) => s.routeRank >= gradeRank("toprope", g)
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
function computeStats(mine) {
  let totalClimbs = 0, totalSent = 0, totalMinutes = 0;
  const counts = { boulder: 0, toprope: 0, lead: 0, other: 0 };
  const minutesByType = { boulder: 0, toprope: 0, lead: 0, other: 0 };
  mine.forEach((l) => {
    if (l.kind === "deal") return;
    (l.updates || []).forEach((u) => {
      totalMinutes += Number(u.minutes) || 0;
      const perClimbMinutes = (u.climbs || []).length ? (Number(u.minutes) || 0) / u.climbs.length : 0;
      (u.climbs || []).forEach((c) => {
        totalClimbs++;
        if (c.status === "sent") totalSent++;
        counts[c.type] = (counts[c.type] || 0) + 1;
        minutesByType[c.type] = (minutesByType[c.type] || 0) + perClimbMinutes;
      });
    });
  });
  return {
    totalTries: totalClimbs,
    totalSent,
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
  const firstPost = all.find((b) => b.id === "first-post");
  return [firstPost, bestInCategory("boulder-", all), bestInCategory("route-", all), bestInCategory("hours-", all), bestInCategory("finish-", all)].filter(Boolean);
}
function gradeDistributionData(mine) {
  const counts = {};
  BOULDER_GRADES.forEach((g) => counts[g] = 0);
  mine.forEach((l) => {
    if (l.kind === "deal") return;
    (l.updates || []).forEach((u) => {
      (u.climbs || []).forEach((c) => {
        if (c.type === "boulder" && counts[c.grade] !== void 0) counts[c.grade]++;
      });
    });
  });
  return BOULDER_GRADES.map((g) => ({ grade: g, count: counts[g] }));
}
function monthlyProgressData(mine) {
  const now = /* @__PURE__ */ new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: d.toLocaleDateString(void 0, { month: "short" }), year: d.getFullYear(), month: d.getMonth(), count: 0 });
  }
  mine.forEach((l) => {
    if (l.kind === "deal") return;
    (l.updates || []).forEach((u) => {
      const d = new Date(u.timestamp);
      const b = buckets.find((b2) => b2.year === d.getFullYear() && b2.month === d.getMonth());
      if (b) b.count += (u.climbs || []).length;
    });
  });
  return buckets.map((b) => ({ month: b.key, count: b.count }));
}
function formatDuration(mins) {
  const m = Number(mins) || 0;
  if (m <= 0) return null;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}
function summarizeClimbs(climbs) {
  return (climbs || []).map((c) => `${TYPE_LABELS[c.type]} ${c.grade} (${STATUS_LABELS[c.status]})`).join(", ");
}
function bestUpdate(updates) {
  if (!updates || updates.length === 0) return { climbs: [] };
  const sentOnes = updates.filter((u) => (u.climbs || []).some((c) => c.status === "sent"));
  if (sentOnes.length > 0) return sentOnes[sentOnes.length - 1];
  return updates[updates.length - 1];
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
      groups.push({ label: formatDayHeader(ts), items: [] });
      lastKey = key;
    }
    groups[groups.length - 1].items.push(entry);
  });
  return groups;
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
  } catch {
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
function PhotoPicker({ value, onChange, idSuffix, label = "Add a profile pic" }) {
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onChange(await resizeImage(f, 400, 0.7));
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*", onChange: onFile, className: "cl-file-hidden", id: `photo-${idSuffix}` }), /* @__PURE__ */ React.createElement("label", { htmlFor: `photo-${idSuffix}`, className: "cl-photo-btn" }, /* @__PURE__ */ React.createElement(Camera, { size: 16 }), " ", value ? "Change photo" : label), value && /* @__PURE__ */ React.createElement("img", { src: value, alt: "preview", className: "cl-photo-preview cl-photo-preview-round" }));
}
function GradeChip({ type, grade, label, status }) {
  const StatusIcon = status === "sent" ? CheckCircle2 : status === "trying" ? Hourglass : null;
  if (!grade || grade === "NA") {
    return /* @__PURE__ */ React.createElement("span", { className: "cl-chip cl-chip-na" }, label || TYPE_LABELS[type], ": N/A");
  }
  const displayGrade = type === "boulder" ? grade : usGrade(grade);
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
function SaveButton({ saved, onToggle }) {
  return /* @__PURE__ */ React.createElement("button", { className: saved ? "cl-kudo-btn active" : "cl-kudo-btn", onClick: onToggle, title: saved ? "Remove from saved" : "Save post" }, /* @__PURE__ */ React.createElement(Bookmark, { size: 14, fill: saved ? "currentColor" : "none" }));
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
function IconControls({ onSearch, onFilter, onAdd, searchOn, filterOn, refresh, loading }) {
  return /* @__PURE__ */ React.createElement("div", { className: "cl-icon-controls" }, /* @__PURE__ */ React.createElement("div", { className: "cl-controls-spacer" }), refresh && /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", title: "Refresh", onClick: refresh }, /* @__PURE__ */ React.createElement(RefreshCw, { size: 17, className: loading ? "cl-spin" : "" })), onSearch && /* @__PURE__ */ React.createElement("button", { className: searchOn ? "cl-icon-btn active" : "cl-icon-btn", title: "Search", onClick: onSearch }, /* @__PURE__ */ React.createElement(Search, { size: 18 })), onFilter && /* @__PURE__ */ React.createElement("button", { className: filterOn ? "cl-icon-btn active" : "cl-icon-btn", title: "Filter", onClick: onFilter }, /* @__PURE__ */ React.createElement(Filter, { size: 18 })), onAdd && /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn cl-add-btn", title: "Add", onClick: onAdd }, /* @__PURE__ */ React.createElement(Plus, { size: 20 })));
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
        title: type !== "boulder" ? `French ${g}` : g,
        className: active ? "cl-grade-swatch active" : "cl-grade-swatch",
        style: { borderColor: color, background: active ? color : "transparent", color: active ? "#fff" : "var(--ink)" },
        onClick: () => !disabled && onChange(g)
      },
      type === "boulder" ? g : usGrade(g)
    );
  }));
}
function StatusSelector({ value, onChange }) {
  return /* @__PURE__ */ React.createElement("div", { className: "cl-status-row" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: value === "sent" ? "cl-status-pick sent active" : "cl-status-pick sent", onClick: () => onChange("sent") }, /* @__PURE__ */ React.createElement(CheckCircle2, { size: 16 }), " Finished"), /* @__PURE__ */ React.createElement("button", { type: "button", className: value === "trying" ? "cl-status-pick trying active" : "cl-status-pick trying", onClick: () => onChange("trying") }, /* @__PURE__ */ React.createElement(Hourglass, { size: 16 }), " Trying"));
}
function ClimbRow({ climb, onChange, onRemove, locked }) {
  return /* @__PURE__ */ React.createElement("div", { className: "cl-climb-row" }, /* @__PURE__ */ React.createElement("div", { className: "cl-climb-row-top" }, /* @__PURE__ */ React.createElement(TypeSelector, { value: climb.type, onChange: (t) => onChange({ ...climb, type: t, grade: gradeOptionsFor(t) ? gradeOptionsFor(t)[0] : "" }), disabled: locked }), onRemove && /* @__PURE__ */ React.createElement("button", { type: "button", className: "cl-icon-btn", onClick: onRemove }, /* @__PURE__ */ React.createElement(Trash2, { size: 14 }))), /* @__PURE__ */ React.createElement(GradeSelector, { type: climb.type, grade: climb.grade, onChange: (g) => onChange({ ...climb, grade: g }), disabled: locked }), /* @__PURE__ */ React.createElement(StatusSelector, { value: climb.status, onChange: (s) => onChange({ ...climb, status: s }) }));
}
function DurationInput({ hours, minutes, setHours, setMinutes }) {
  return /* @__PURE__ */ React.createElement("div", { className: "cl-duration-row" }, /* @__PURE__ */ React.createElement("div", { className: "cl-duration-field" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", className: "cl-input", value: hours, onChange: (e) => setHours(e.target.value), placeholder: "0" }), /* @__PURE__ */ React.createElement("span", null, "hr")), /* @__PURE__ */ React.createElement("div", { className: "cl-duration-field" }, /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", max: "59", className: "cl-input", value: minutes, onChange: (e) => setMinutes(e.target.value), placeholder: "0" }), /* @__PURE__ */ React.createElement("span", null, "min")));
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
      placeholder: "Add another qualification",
      iconMap: QUALIFICATION_ICONS
    }
  )), step === 5 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 22 } }, "Your main gym"), /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, "We'll use this as the default when you log a climb. Don't see yours? Just type it in."), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: mainGym, onChange: (e) => setMainGym(e.target.value), list: "cl-gyms-wizard", placeholder: "Search or type your gym\u2026" }), /* @__PURE__ */ React.createElement("datalist", { id: "cl-gyms-wizard" }, GYM_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g })))), stepError && /* @__PURE__ */ React.createElement("p", { className: "cl-error" }, stepError), /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons" }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: back }, "Back"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", style: { marginTop: 0 }, onClick: next, disabled: checkingSlug }, step === TOTAL_STEPS - 1 ? checkingSlug ? "Setting up\u2026" : "Create my tag" : "Next"))));
}
function LogForm({ initial, onCancel, onSave, saveLabel = "Save to log" }) {
  const [postType, setPostType] = useState(initial.postType || "project");
  const [title, setTitle] = useState(initial.title || "");
  const [gym, setGym] = useState(initial.gym || GYM_OPTIONS[0]);
  const [climbRows, setClimbRows] = useState(initial.climbs || [{ type: "boulder", grade: "VB", status: "trying" }]);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [points, setPoints] = useState({ start: [], end: [] });
  const [technique, setTechnique] = useState([]);
  const [satisfaction, setSatisfaction] = useState(0);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [privacy, setPrivacy] = useState(initial.privacy || "public");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();
  const locked = !!initial.lockClimb;
  const showGymTitle = !initial.lockPost;
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(await resizeImage(f));
  };
  const updateRow = (i, next) => setClimbRows((rows) => rows.map((r, idx) => idx === i ? next : r));
  const addRow = () => setClimbRows((rows) => [...rows, { type: "boulder", grade: "VB", status: "trying" }]);
  const removeRow = (i) => setClimbRows((rows) => rows.filter((_, idx) => idx !== i));
  const submit = async () => {
    if (showGymTitle && postType === "project" && !title.trim()) {
      setError("Give this project a name so you and your crew can find it again.");
      return;
    }
    setError("");
    setSaving(true);
    const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
    const hasPoints = points.start.length > 0 || points.end.length > 0;
    const extra = {};
    if (hasPoints) extra.points = points;
    if (technique.length > 0) extra.technique = technique;
    if (satisfaction > 0) extra.satisfaction = satisfaction;
    await onSave({
      postType,
      title: title.trim(),
      gym,
      privacy,
      climbs: climbRows,
      note: note.trim(),
      photo,
      minutes: totalMinutes,
      extra: Object.keys(extra).length > 0 ? extra : void 0
    });
    setSaving(false);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-card cl-form-card" }, showGymTitle && /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Post type"), /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, /* @__PURE__ */ React.createElement("button", { className: postType === "project" ? "cl-toggle active" : "cl-toggle", onClick: () => setPostType("project") }, /* @__PURE__ */ React.createElement(Layers, { size: 14 }), " One wall / project"), /* @__PURE__ */ React.createElement("button", { className: postType === "day" ? "cl-toggle active" : "cl-toggle", onClick: () => {
    setPostType("day");
    if (climbRows.length < 1) addRow();
  } }, /* @__PURE__ */ React.createElement(CalendarRange, { size: 14 }), " Full day log")), postType === "project" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Name this project *"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "e.g. Blue arete by the window" })), postType === "day" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Title (optional)"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: title, onChange: (e) => setTitle(e.target.value), placeholder: `Day at ${gym}` })), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Gym or crag"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: gym, onChange: (e) => setGym(e.target.value), list: "cl-gyms" }), /* @__PURE__ */ React.createElement("datalist", { id: "cl-gyms" }, GYM_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g })))), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, postType === "day" ? "Climbs done" : "Climb"), climbRows.map((c, i) => /* @__PURE__ */ React.createElement(
    ClimbRow,
    {
      key: i,
      climb: c,
      onChange: (next) => updateRow(i, next),
      onRemove: postType === "day" && climbRows.length > 1 ? () => removeRow(i) : null,
      locked
    }
  )), postType === "day" && /* @__PURE__ */ React.createElement("button", { type: "button", className: "cl-btn-ghost cl-full", style: { marginTop: 6 }, onClick: addRow }, /* @__PURE__ */ React.createElement(Plus, { size: 14, style: { marginRight: 4 } }), " Add another climb")), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Time & photo"), /* @__PURE__ */ React.createElement(DurationInput, { hours, minutes, setHours, setMinutes }), /* @__PURE__ */ React.createElement("input", { ref: fileRef, type: "file", accept: "image/*", capture: "environment", onChange: onFile, className: "cl-file-hidden", id: `photo-log-${initial.formId || "new"}` }), /* @__PURE__ */ React.createElement("label", { htmlFor: `photo-log-${initial.formId || "new"}`, className: "cl-photo-btn", style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement(Camera, { size: 16 }), " ", photo ? "Change photo" : "Add a photo"), photo && /* @__PURE__ */ React.createElement(PhotoPointPicker, { photo, points, onChange: setPoints })), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Notes"), /* @__PURE__ */ React.createElement("textarea", { className: "cl-input cl-textarea", placeholder: "Beta, how it felt, what to try next\u2026", value: note, onChange: (e) => setNote(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Technique used (optional)"), /* @__PURE__ */ React.createElement(TagEditor, { options: TECHNIQUE_PRESETS, selected: technique, setSelected: setTechnique, placeholder: "Add another technique" }), /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption", style: { marginTop: 14 } }, "How satisfied are you? (optional)"), /* @__PURE__ */ React.createElement(StarRating, { value: satisfaction, onChange: setSatisfaction })), showGymTitle && /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Who can see this?"), /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, /* @__PURE__ */ React.createElement("button", { className: privacy === "public" ? "cl-toggle active" : "cl-toggle", onClick: () => setPrivacy("public") }, /* @__PURE__ */ React.createElement(Globe, { size: 13 }), " Public"), /* @__PURE__ */ React.createElement("button", { className: privacy === "private" ? "cl-toggle active" : "cl-toggle", onClick: () => setPrivacy("private") }, /* @__PURE__ */ React.createElement(Lock, { size: 13 }), " Private"))), error && /* @__PURE__ */ React.createElement("p", { className: "cl-error" }, error), /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons" }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: onCancel }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: submit, disabled: saving }, saving ? "Saving\u2026" : saveLabel)));
}
function DealForm({ onCancel, onSave }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [link, setLink] = useState("");
  const [photo, setPhoto] = useState(null);
  const [privacy, setPrivacy] = useState("public");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(await resizeImage(f));
  };
  const submit = async () => {
    if (!title.trim()) {
      setError("Give your item a title.");
      return;
    }
    setError("");
    setSaving(true);
    await onSave({ title: title.trim(), description: description.trim(), price: price.trim(), link: link.trim(), photo, privacy });
    setSaving(false);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-card cl-form-card" }, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "What are you selling? *"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "e.g. Climbing shoes, size 42" }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Photo"), /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*", onChange: onFile, className: "cl-file-hidden", id: "deal-photo" }), /* @__PURE__ */ React.createElement("label", { htmlFor: "deal-photo", className: "cl-photo-btn" }, /* @__PURE__ */ React.createElement(Camera, { size: 16 }), " ", photo ? "Change photo" : "Add a photo"), photo && /* @__PURE__ */ React.createElement("img", { src: photo, alt: "preview", className: "cl-photo-preview" }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Price"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: price, onChange: (e) => setPrice(e.target.value), placeholder: "e.g. RM80 or Negotiable" }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Link (optional)"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: link, onChange: (e) => setLink(e.target.value), placeholder: "https://\u2026" }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Description"), /* @__PURE__ */ React.createElement("textarea", { className: "cl-input cl-textarea", placeholder: "Condition, size, why you're selling\u2026", value: description, onChange: (e) => setDescription(e.target.value) }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Who can see this?"), /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, /* @__PURE__ */ React.createElement("button", { className: privacy === "public" ? "cl-toggle active" : "cl-toggle", onClick: () => setPrivacy("public") }, /* @__PURE__ */ React.createElement(Globe, { size: 13 }), " Public"), /* @__PURE__ */ React.createElement("button", { className: privacy === "private" ? "cl-toggle active" : "cl-toggle", onClick: () => setPrivacy("private") }, /* @__PURE__ */ React.createElement(Lock, { size: 13 }), " Private")), error && /* @__PURE__ */ React.createElement("p", { className: "cl-error" }, error), /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons" }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: onCancel }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: submit, disabled: saving }, saving ? "Posting\u2026" : "Post deal")));
}
function NewPostForm({ defaultGym, onCancel, onSaveLog, onSaveDeal }) {
  const [kind, setKind] = useState("climb");
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row", style: { marginBottom: 10 } }, /* @__PURE__ */ React.createElement("button", { className: kind === "climb" ? "cl-toggle active" : "cl-toggle", onClick: () => setKind("climb") }, /* @__PURE__ */ React.createElement(Mountain, { size: 14 }), " Climb log"), /* @__PURE__ */ React.createElement("button", { className: kind === "deal" ? "cl-toggle active" : "cl-toggle", onClick: () => setKind("deal") }, /* @__PURE__ */ React.createElement(TagIcon, { size: 14 }), " Gear deal")), kind === "climb" ? /* @__PURE__ */ React.createElement(LogForm, { initial: { gym: defaultGym }, onCancel, onSave: onSaveLog }) : /* @__PURE__ */ React.createElement(DealForm, { onCancel, onSave: onSaveDeal }));
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
      placeholder: "Add gear e.g. La Sportiva Katana",
      value: val,
      onChange: (e) => setVal(e.target.value),
      onKeyDown: (e) => e.key === "Enter" && add()
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: add }, /* @__PURE__ */ React.createElement(Plus, { size: 16 }))));
}
function WallLogCard({ entry, profile, comments, me, defaultGym, onComment, onKudo, onDelete, onAddTry, onTogglePrivacy, onToggleSave, onOpenProfile, onEnlarge, onLiveLog, onShare }) {
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
  const tryInitial = entry.postType === "project" ? { lockClimb: true, lockPost: true, climbs: [{ ...latest.climbs[0] }], formId: entry.id } : { lockClimb: false, lockPost: true, climbs: [{ type: "boulder", grade: "VB", status: "trying" }], formId: entry.id };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-card" }, /* @__PURE__ */ React.createElement("div", { className: "cl-card-head" }, /* @__PURE__ */ React.createElement(
    ClickableIdentity,
    {
      name: profile?.name || entry.authorName,
      photo: profile?.photo,
      size: 34,
      onClick: () => onOpenProfile(entry.authorSlug),
      sub: `${entry.gym} \xB7 ${timeAgo(latest.timestamp || entry.createdAt)}`
    }
  ), /* @__PURE__ */ React.createElement("span", { className: `cl-status cl-status-${overallStatus}` }, STATUS_LABELS[overallStatus]), isMine && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => onTogglePrivacy(entry.id), title: entry.privacy === "private" ? "Private \u2014 tap to make public" : "Public \u2014 tap to make private" }, entry.privacy === "private" ? /* @__PURE__ */ React.createElement(Lock, { size: 14 }) : /* @__PURE__ */ React.createElement(Globe, { size: 14 })), /* @__PURE__ */ React.createElement(ConfirmButton, { onConfirm: () => onDelete(entry.id), icon: /* @__PURE__ */ React.createElement(Trash2, { size: 14 }), title: "Delete log" }))), latest.photo && /* @__PURE__ */ React.createElement("div", { className: "cl-photo-wrap", onClick: () => onEnlarge(latest.photo, latest.points) }, /* @__PURE__ */ React.createElement("img", { src: latest.photo, alt: "climb", className: "cl-photo-full" }), /* @__PURE__ */ React.createElement("span", { className: "cl-enlarge-hint" }, /* @__PURE__ */ React.createElement(Maximize2, { size: 13 }))), /* @__PURE__ */ React.createElement("div", { className: "cl-ig-actions" }, /* @__PURE__ */ React.createElement("button", { className: kudoed ? "cl-ig-icon active" : "cl-ig-icon", onClick: () => onKudo(entry.id), title: "Nice" }, /* @__PURE__ */ React.createElement(Heart, { size: 22, fill: kudoed ? "currentColor" : "none" })), /* @__PURE__ */ React.createElement("button", { className: "cl-ig-icon", onClick: () => setShowComments((v) => !v), title: "Comment" }, /* @__PURE__ */ React.createElement(MessageCircle, { size: 22 })), /* @__PURE__ */ React.createElement("button", { className: "cl-ig-icon", onClick: () => onShare(entry), title: "Share" }, /* @__PURE__ */ React.createElement(Share2, { size: 22 })), /* @__PURE__ */ React.createElement("div", { className: "cl-controls-spacer" }), /* @__PURE__ */ React.createElement(SaveButton, { saved, onToggle: () => onToggleSave(entry.id) })), kudos.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-ig-likes" }, kudos.length, " ", kudos.length === 1 ? "like" : "likes"), /* @__PURE__ */ React.createElement("div", { className: "cl-card-body" }, /* @__PURE__ */ React.createElement("p", { className: "cl-ig-caption" }, /* @__PURE__ */ React.createElement("b", null, profile?.name || entry.authorName), " ", entry.title || "Untitled", latest.note ? ` \u2014 ${latest.note}` : ""), /* @__PURE__ */ React.createElement("div", { className: "cl-chip-row", style: { marginTop: 6 } }, (latest.climbs || []).map((c, i) => /* @__PURE__ */ React.createElement(GradeChip, { key: i, type: c.type, grade: c.grade, status: c.status })), latest.minutes > 0 && /* @__PURE__ */ React.createElement("span", { className: "cl-chip cl-chip-na" }, /* @__PURE__ */ React.createElement(Clock, { size: 11 }), " ", formatDuration(latest.minutes))), updates.length > 1 && /* @__PURE__ */ React.createElement("button", { className: "cl-history-toggle", onClick: () => setShowHistory((v) => !v) }, /* @__PURE__ */ React.createElement(ChevronDown, { size: 13, style: { transform: showHistory ? "rotate(180deg)" : "none" } }), updates.length, " entries logged on this one"), showHistory && /* @__PURE__ */ React.createElement("div", { className: "cl-timeline" }, history.map((u) => /* @__PURE__ */ React.createElement("div", { className: "cl-timeline-item", key: u.id }, /* @__PURE__ */ React.createElement("span", { className: "cl-timeline-note" }, /* @__PURE__ */ React.createElement("b", null, summarizeClimbs(u.climbs)), u.note ? ` \u2014 ${u.note}` : "", u.minutes > 0 ? ` \xB7 ${formatDuration(u.minutes)}` : ""), /* @__PURE__ */ React.createElement("span", { className: "cl-timeline-time" }, timeAgo(u.timestamp))))), !showComments && /* @__PURE__ */ React.createElement("button", { className: "cl-ig-viewcomments", onClick: () => setShowComments(true) }, comments.length > 0 ? `View all ${comments.length} comment${comments.length === 1 ? "" : "s"}` : "Add a comment\u2026"), showComments && /* @__PURE__ */ React.createElement("div", { className: "cl-comments" }, comments.map((c, i) => /* @__PURE__ */ React.createElement("div", { className: "cl-comment", key: i }, /* @__PURE__ */ React.createElement("b", null, c.authorName), " ", c.text)), /* @__PURE__ */ React.createElement("div", { className: "cl-comment-input" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "cl-input",
      placeholder: "Say something\u2026",
      value: text,
      onChange: (e) => setText(e.target.value),
      onKeyDown: (e) => e.key === "Enter" && submitComment()
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: submitComment }, /* @__PURE__ */ React.createElement(Send, { size: 15 })))), /* @__PURE__ */ React.createElement("p", { className: "cl-ig-timestamp" }, timeAgo(latest.timestamp || entry.createdAt))), isMine && /* @__PURE__ */ React.createElement("div", { className: "cl-ig-utility" }, !addingTry && /* @__PURE__ */ React.createElement("button", { className: "cl-kudo-btn", onClick: () => setAddingTry(true) }, /* @__PURE__ */ React.createElement(Plus, { size: 14 }), " Log another entry"), entry.postType === "project" && entry.kind !== "deal" && /* @__PURE__ */ React.createElement("button", { className: "cl-kudo-btn", onClick: () => onLiveLog(entry) }, /* @__PURE__ */ React.createElement(Zap, { size: 14 }), " Live log")), addingTry && /* @__PURE__ */ React.createElement(
    LogForm,
    {
      initial: tryInitial,
      saveLabel: "Save entry",
      onCancel: () => setAddingTry(false),
      onSave: async (data) => {
        await onAddTry(entry.id, { note: data.note, photo: data.photo, minutes: data.minutes, climbs: data.climbs });
        setAddingTry(false);
      }
    }
  ));
}
function DealCard({ entry, profile, comments, me, onComment, onKudo, onDelete, onToggleSave, onOpenProfile, onEnlarge, onShare }) {
  const [text, setText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const kudos = entry.kudos || [];
  const kudoed = kudos.includes(me);
  const saved = (entry.savedBy || []).includes(me);
  const isMine = entry.authorSlug === me;
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
  ), /* @__PURE__ */ React.createElement("span", { className: "cl-status cl-status-deal" }, /* @__PURE__ */ React.createElement(TagIcon, { size: 10 }), " Deal"), isMine && /* @__PURE__ */ React.createElement(ConfirmButton, { onConfirm: () => onDelete(entry.id), icon: /* @__PURE__ */ React.createElement(Trash2, { size: 14 }), title: "Delete" })), entry.photo && /* @__PURE__ */ React.createElement("div", { className: "cl-photo-wrap", onClick: () => onEnlarge(entry.photo) }, /* @__PURE__ */ React.createElement("img", { src: entry.photo, alt: "item", className: "cl-photo-full" }), /* @__PURE__ */ React.createElement("span", { className: "cl-enlarge-hint" }, /* @__PURE__ */ React.createElement(Maximize2, { size: 13 }))), /* @__PURE__ */ React.createElement("div", { className: "cl-ig-actions" }, /* @__PURE__ */ React.createElement("button", { className: kudoed ? "cl-ig-icon active" : "cl-ig-icon", onClick: () => onKudo(entry.id), title: "Interested" }, /* @__PURE__ */ React.createElement(Heart, { size: 22, fill: kudoed ? "currentColor" : "none" })), /* @__PURE__ */ React.createElement("button", { className: "cl-ig-icon", onClick: () => setShowComments((v) => !v), title: "Comment" }, /* @__PURE__ */ React.createElement(MessageCircle, { size: 22 })), /* @__PURE__ */ React.createElement("button", { className: "cl-ig-icon", onClick: () => onShare(entry), title: "Share" }, /* @__PURE__ */ React.createElement(Share2, { size: 22 })), /* @__PURE__ */ React.createElement("div", { className: "cl-controls-spacer" }), /* @__PURE__ */ React.createElement(SaveButton, { saved, onToggle: () => onToggleSave(entry.id) })), kudos.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-ig-likes" }, kudos.length, " interested"), /* @__PURE__ */ React.createElement("div", { className: "cl-card-body" }, /* @__PURE__ */ React.createElement("p", { className: "cl-ig-caption" }, /* @__PURE__ */ React.createElement("b", null, profile?.name || entry.authorName), " ", entry.title), entry.price && /* @__PURE__ */ React.createElement("p", { className: "cl-deal-price" }, entry.price), entry.description && /* @__PURE__ */ React.createElement("p", { className: "cl-note" }, entry.description), entry.link && /* @__PURE__ */ React.createElement("a", { className: "cl-deal-link", href: entry.link, target: "_blank", rel: "noreferrer" }, /* @__PURE__ */ React.createElement(ExternalLink, { size: 13 }), " View listing"), !showComments && /* @__PURE__ */ React.createElement("button", { className: "cl-ig-viewcomments", onClick: () => setShowComments(true) }, comments.length > 0 ? `View all ${comments.length} comment${comments.length === 1 ? "" : "s"}` : "Ask a question\u2026"), showComments && /* @__PURE__ */ React.createElement("div", { className: "cl-comments" }, comments.map((c, i) => /* @__PURE__ */ React.createElement("div", { className: "cl-comment", key: i }, /* @__PURE__ */ React.createElement("b", null, c.authorName), " ", c.text)), /* @__PURE__ */ React.createElement("div", { className: "cl-comment-input" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "cl-input",
      placeholder: "Ask a question\u2026",
      value: text,
      onChange: (e) => setText(e.target.value),
      onKeyDown: (e) => e.key === "Enter" && submitComment()
    }
  ), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: submitComment }, /* @__PURE__ */ React.createElement(Send, { size: 15 })))), /* @__PURE__ */ React.createElement("p", { className: "cl-ig-timestamp" }, timeAgo(entry.createdAt))));
}
function PostCard(props) {
  return props.entry.kind === "deal" ? /* @__PURE__ */ React.createElement(DealCard, { ...props }) : /* @__PURE__ */ React.createElement(WallLogCard, { ...props });
}
function RecordRow({ entry, expanded, onToggle, children }) {
  const updates = entry.updates || [];
  const best = bestUpdate(updates);
  const overallStatus = (best.climbs || []).some((c) => c.status === "sent") ? "sent" : "trying";
  const attemptCount = best.attemptLog ? best.attemptLog.length : 1;
  const primaryClimb = (best.climbs || [])[0];
  const Icon = primaryClimb ? TYPE_ICONS[primaryClimb.type] : Mountain;
  const iconColor = primaryClimb ? gradeColor(primaryClimb.type, primaryClimb.grade) : "#8A8578";
  return /* @__PURE__ */ React.createElement("div", { className: "cl-record" }, /* @__PURE__ */ React.createElement("button", { className: "cl-record-row", onClick: onToggle }, best.photo ? /* @__PURE__ */ React.createElement("span", { className: "cl-record-icon cl-record-icon-photo" }, /* @__PURE__ */ React.createElement("img", { src: best.photo, alt: "" })) : /* @__PURE__ */ React.createElement("span", { className: "cl-record-icon", style: { background: iconColor } }, /* @__PURE__ */ React.createElement(Icon, { size: 16, color: "#fff" })), /* @__PURE__ */ React.createElement("div", { className: "cl-record-info" }, /* @__PURE__ */ React.createElement("div", { className: "cl-record-title" }, entry.title || "Untitled"), /* @__PURE__ */ React.createElement("div", { className: "cl-record-sub" }, entry.gym, " \xB7 best try ", timeAgo(best.timestamp || entry.createdAt))), /* @__PURE__ */ React.createElement("div", { className: "cl-record-cols" }, /* @__PURE__ */ React.createElement("div", { className: "cl-record-col" }, /* @__PURE__ */ React.createElement("span", { className: "cl-record-col-val" }, best.minutes > 0 ? formatDuration(best.minutes) : "\u2014"), /* @__PURE__ */ React.createElement("span", { className: "cl-record-col-label" }, "time")), /* @__PURE__ */ React.createElement("div", { className: "cl-record-col" }, /* @__PURE__ */ React.createElement("span", { className: "cl-record-col-val" }, attemptCount), /* @__PURE__ */ React.createElement("span", { className: "cl-record-col-label" }, "tries"))), /* @__PURE__ */ React.createElement("span", { className: `cl-status cl-status-${overallStatus}` }, STATUS_LABELS[overallStatus]), /* @__PURE__ */ React.createElement(ChevronDown, { size: 16, style: { transform: expanded ? "rotate(180deg)" : "none", flexShrink: 0 } })), expanded && /* @__PURE__ */ React.createElement("div", { className: "cl-record-expanded" }, children));
}
function RecordDetail({ entry, me, onDelete, onTogglePrivacy, onAddTry, onLiveLog, onEnlarge, onShare }) {
  const [addingTry, setAddingTry] = useState(false);
  const [expandedTry, setExpandedTry] = useState(null);
  const updates = [...entry.updates || []].reverse();
  const isMine = entry.authorSlug === me;
  const latest = entry.updates[entry.updates.length - 1] || { climbs: [] };
  const totalTries = entry.updates.reduce((s, u) => s + (u.attemptLog ? u.attemptLog.length : 1), 0);
  const sentCount = entry.updates.filter((u) => (u.climbs || []).some((c) => c.status === "sent")).length;
  const totalMinutes = entry.updates.reduce((s, u) => s + (Number(u.minutes) || 0), 0);
  const tryInitial = entry.postType === "project" ? { lockClimb: true, lockPost: true, climbs: [{ ...latest.climbs[0] }], formId: entry.id } : { lockClimb: false, lockPost: true, climbs: [{ type: "boulder", grade: "VB", status: "trying" }], formId: entry.id };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-record-detail" }, /* @__PURE__ */ React.createElement("div", { className: "cl-record-detail-head" }, /* @__PURE__ */ React.createElement("span", { className: "cl-record-detail-gym" }, /* @__PURE__ */ React.createElement(MapPin, { size: 12 }), " ", entry.gym), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => onShare(entry), title: "Share" }, /* @__PURE__ */ React.createElement(Share2, { size: 14 })), isMine && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => onTogglePrivacy(entry.id), title: entry.privacy === "private" ? "Private \u2014 tap to make public" : "Public \u2014 tap to make private" }, entry.privacy === "private" ? /* @__PURE__ */ React.createElement(Lock, { size: 14 }) : /* @__PURE__ */ React.createElement(Globe, { size: 14 })), /* @__PURE__ */ React.createElement(ConfirmButton, { onConfirm: () => onDelete(entry.id), icon: /* @__PURE__ */ React.createElement(Trash2, { size: 14 }), title: "Delete" }))), /* @__PURE__ */ React.createElement("div", { className: "cl-record-summary" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, entry.updates.length), /* @__PURE__ */ React.createElement("span", null, "logs")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, totalTries), /* @__PURE__ */ React.createElement("span", null, "tries")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, sentCount), /* @__PURE__ */ React.createElement("span", null, "finished")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, formatDuration(totalMinutes) || "0m"), /* @__PURE__ */ React.createElement("span", null, "total time"))), /* @__PURE__ */ React.createElement("div", { className: "cl-log-table" }, /* @__PURE__ */ React.createElement("div", { className: "cl-log-table-head" }, /* @__PURE__ */ React.createElement("span", null, "Date"), /* @__PURE__ */ React.createElement("span", null, "Grade"), /* @__PURE__ */ React.createElement("span", null, "Time"), /* @__PURE__ */ React.createElement("span", null, "Tries"), /* @__PURE__ */ React.createElement("span", null, "Result")), updates.map((u) => {
    const attemptCount = u.attemptLog ? u.attemptLog.length : 1;
    const success = (u.climbs || []).some((c) => c.status === "sent");
    const hasExtra = u.technique && u.technique.length > 0 || u.satisfaction > 0 || u.note || u.photo;
    const isExpanded = expandedTry === u.id;
    return /* @__PURE__ */ React.createElement("div", { key: u.id }, /* @__PURE__ */ React.createElement("button", { className: "cl-log-table-row cl-log-table-row-btn", onClick: () => setExpandedTry(isExpanded ? null : u.id) }, /* @__PURE__ */ React.createElement("span", { className: "cl-log-cell-date" }, new Date(u.timestamp).toLocaleDateString(void 0, { month: "short", day: "numeric" })), /* @__PURE__ */ React.createElement("span", { className: "cl-log-cell-grade" }, (u.climbs || []).map((c, i) => /* @__PURE__ */ React.createElement(GradeChip, { key: i, type: c.type, grade: c.grade }))), /* @__PURE__ */ React.createElement("span", { className: "cl-log-cell-time" }, u.minutes > 0 ? formatDuration(u.minutes) : "\u2014"), /* @__PURE__ */ React.createElement("span", { className: "cl-log-cell-tries" }, attemptCount), /* @__PURE__ */ React.createElement("span", { className: success ? "cl-status cl-status-sent" : "cl-status cl-status-trying" }, success ? "Finished" : "Trying")), hasExtra && /* @__PURE__ */ React.createElement("div", { className: "cl-log-extra" }, u.technique && u.technique.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "cl-log-extra-item" }, u.technique.join(", ")), u.satisfaction > 0 && /* @__PURE__ */ React.createElement("span", { className: "cl-log-extra-item" }, "\u2605".repeat(u.satisfaction), "\u2606".repeat(5 - u.satisfaction)), u.note && /* @__PURE__ */ React.createElement("span", { className: "cl-log-extra-item" }, u.note), u.photo && /* @__PURE__ */ React.createElement("img", { src: u.photo, alt: "", className: "cl-log-thumb-tiny", style: { cursor: "zoom-in" }, onClick: () => onEnlarge(u.photo, u.points) })), isExpanded && /* @__PURE__ */ React.createElement("div", { className: "cl-try-breakdown" }, u.attemptLog && u.attemptLog.length > 0 ? u.attemptLog.map((a) => /* @__PURE__ */ React.createElement("div", { key: a.attemptNumber }, /* @__PURE__ */ React.createElement("div", { className: "cl-attempt-line" }, /* @__PURE__ */ React.createElement("span", null, "Attempt ", a.attemptNumber), /* @__PURE__ */ React.createElement("span", null, formatDuration(Math.round(a.durationMs / 6e4)) || "<1m"), /* @__PURE__ */ React.createElement("span", { className: "cl-attempt-outcome" }, a.endType === "fall" ? `Fell at ${a.fallPosition}` : a.endType === "complete" ? "Completed" : "Stopped")), a.note && /* @__PURE__ */ React.createElement("p", { className: "cl-attempt-note" }, a.note))) : /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "No attempt-by-attempt breakdown for this entry \u2014 it wasn't logged with Live Log.")));
  })), isMine && !addingTry && /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons", style: { marginTop: 4 } }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: () => setAddingTry(true) }, "Log another entry"), entry.postType === "project" && /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: () => onLiveLog(entry) }, /* @__PURE__ */ React.createElement(Zap, { size: 13 }), " Live log")), addingTry && /* @__PURE__ */ React.createElement(
    LogForm,
    {
      initial: tryInitial,
      saveLabel: "Save entry",
      onCancel: () => setAddingTry(false),
      onSave: async (data) => {
        await onAddTry(entry.id, { note: data.note, photo: data.photo, minutes: data.minutes, climbs: data.climbs });
        setAddingTry(false);
      }
    }
  ));
}
function BadgesGrid({ stats }) {
  const badges = computeDisplayBadges(stats);
  return /* @__PURE__ */ React.createElement("div", { className: "cl-badges-grid" }, badges.map((b) => {
    const Icon = b.icon;
    return /* @__PURE__ */ React.createElement("div", { key: b.id, className: b.earned ? "cl-badge-item earned" : "cl-badge-item", title: b.label }, /* @__PURE__ */ React.createElement(Icon, { size: 20 }), /* @__PURE__ */ React.createElement("span", null, b.label));
  }));
}
function ProgressCharts({ mine }) {
  const gradeData = gradeDistributionData(mine).filter((d, i) => i < 10 || d.count > 0);
  const monthData = monthlyProgressData(mine);
  return /* @__PURE__ */ React.createElement("div", { className: "cl-charts" }, /* @__PURE__ */ React.createElement("p", { className: "cl-chart-label" }, "Boulder grades logged"), /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 140 }, /* @__PURE__ */ React.createElement(BarChart, { data: gradeData, margin: { top: 4, right: 4, left: -20, bottom: 0 } }, /* @__PURE__ */ React.createElement(XAxis, { dataKey: "grade", tick: { fontSize: 9 }, interval: 0 }), /* @__PURE__ */ React.createElement(YAxis, { allowDecimals: false, tick: { fontSize: 9 }, width: 24 }), /* @__PURE__ */ React.createElement(Tooltip, null), /* @__PURE__ */ React.createElement(Bar, { dataKey: "count", fill: "#6B8E4E", radius: [3, 3, 0, 0] }))), /* @__PURE__ */ React.createElement("p", { className: "cl-chart-label" }, "Last 6 months"), /* @__PURE__ */ React.createElement(ResponsiveContainer, { width: "100%", height: 120 }, /* @__PURE__ */ React.createElement(LineChart, { data: monthData, margin: { top: 4, right: 8, left: -20, bottom: 0 } }, /* @__PURE__ */ React.createElement(XAxis, { dataKey: "month", tick: { fontSize: 9 } }), /* @__PURE__ */ React.createElement(YAxis, { allowDecimals: false, tick: { fontSize: 9 }, width: 24 }), /* @__PURE__ */ React.createElement(Tooltip, null), /* @__PURE__ */ React.createElement(Line, { type: "monotone", dataKey: "count", stroke: "#C4501F", strokeWidth: 2, dot: { r: 3 } }))));
}
function ProfileView({ slug, me, profiles, logs, onClose, onToggleFollow, onToggleBlock, onMessage }) {
  const [showFollowers, setShowFollowers] = useState(false);
  const target = profiles[slug];
  const myProfile = profiles[me];
  if (!target) return null;
  const following = (myProfile.following || []).includes(slug);
  const friend = isFriend(myProfile, target);
  const blocked = isBlockedEitherWay(myProfile, target);
  const theirLogs = logs.filter((l) => l.authorSlug === slug);
  const publicLogs = theirLogs.filter((l) => l.privacy !== "private");
  const followerSlugs = followerSlugsFor(slug, profiles);
  const boulderShown = effectiveGrade("boulder", target.boulder, theirLogs, true);
  const routeShown = effectiveGrade("route", target.route, theirLogs, true);
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, target.name), /* @__PURE__ */ React.createElement("div", { style: { width: 32 } })), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body" }, /* @__PURE__ */ React.createElement("div", { className: "cl-badge" }, /* @__PURE__ */ React.createElement("div", { className: "cl-badge-top" }, /* @__PURE__ */ React.createElement(Avatar, { name: target.name, photo: target.photo, size: 56 }), /* @__PURE__ */ React.createElement("div", { className: "cl-badge-id" }, /* @__PURE__ */ React.createElement("h2", null, target.name), /* @__PURE__ */ React.createElement("p", { className: "cl-sub cl-nowrap" }, "Since ", target.since ? (/* @__PURE__ */ new Date(target.since + "-01")).toLocaleDateString(void 0, { month: "short", year: "2-digit" }) : "\u2014"), /* @__PURE__ */ React.createElement("p", { className: "cl-id-text" }, "@", target.username || target.slug.slice(0, 8)))), /* @__PURE__ */ React.createElement("div", { className: "cl-chip-row" }, /* @__PURE__ */ React.createElement(GradeChip, { type: "boulder", grade: boulderShown }), /* @__PURE__ */ React.createElement(GradeChip, { type: "toprope", grade: routeShown, label: "Route" })), target.qualifications && target.qualifications.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "cl-gear-row" }, target.qualifications.map((q, i) => {
    const Ic = QUALIFICATION_ICONS[q] || GraduationCap;
    return /* @__PURE__ */ React.createElement("span", { className: "cl-gear-pill cl-qual-pill", key: i }, /* @__PURE__ */ React.createElement(Ic, { size: 11 }), " ", q);
  })), target.gear && target.gear.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "cl-gear-row" }, target.gear.map((g, i) => /* @__PURE__ */ React.createElement("span", { className: "cl-gear-pill", key: i }, g))), /* @__PURE__ */ React.createElement("div", { className: "cl-stats-row" }, /* @__PURE__ */ React.createElement("div", { className: "cl-stat" }, /* @__PURE__ */ React.createElement("b", null, publicLogs.length), /* @__PURE__ */ React.createElement("span", null, "posts")), /* @__PURE__ */ React.createElement("button", { className: "cl-stat cl-stat-btn", onClick: () => setShowFollowers((v) => !v) }, /* @__PURE__ */ React.createElement("b", null, followerSlugs.length), /* @__PURE__ */ React.createElement("span", null, "followers")), /* @__PURE__ */ React.createElement("div", { className: "cl-stat" }, /* @__PURE__ */ React.createElement("b", null, (target.following || []).length), /* @__PURE__ */ React.createElement("span", null, "following"))), showFollowers && (friend ? /* @__PURE__ */ React.createElement("div", { className: "cl-crew-grid", style: { marginTop: 10 } }, followerSlugs.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "No followers yet."), followerSlugs.map((s) => {
    const p = profiles[s];
    return p ? /* @__PURE__ */ React.createElement("div", { className: "cl-crew-card", key: s }, /* @__PURE__ */ React.createElement(Avatar, { name: p.name, photo: p.photo, size: 30 }), /* @__PURE__ */ React.createElement("div", { className: "cl-crew-name" }, p.name)) : null;
  })) : /* @__PURE__ */ React.createElement("p", { className: "cl-hint", style: { marginTop: 8 } }, "Follow each other to see ", target.name, "'s followers.")), !blocked ? /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons" }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: () => onToggleFollow(slug) }, following ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(UserMinus, { size: 14, style: { marginRight: 4 } }), " Unfollow") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(UserPlus, { size: 14, style: { marginRight: 4 } }), " Follow")), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", style: { marginTop: 0 }, onClick: () => onMessage(slug) }, /* @__PURE__ */ React.createElement(MessageCircle, { size: 14, style: { marginRight: 4 } }), " Message")) : /* @__PURE__ */ React.createElement("p", { className: "cl-hint", style: { marginTop: 10 } }, "You or ", target.name, " have blocked each other."), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost cl-full", style: { marginTop: 8, color: "var(--accent2)" }, onClick: () => onToggleBlock(slug) }, /* @__PURE__ */ React.createElement(Ban, { size: 14, style: { marginRight: 4 } }), " ", blocked ? "Unblock" : "Block"))));
}
function normalizePoints(points) {
  if (!points) return { start: [], end: [] };
  const norm = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return [v];
  };
  return { start: norm(points.start), end: norm(points.end) };
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
function MyQRModal({ me, username, onClose }) {
  const ref = useRef();
  const [failed, setFailed] = useState(false);
  const code = username || me;
  useEffect(() => {
    let cancelled = false;
    loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js", () => !!window.QRCode).then(() => {
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = "";
      new window.QRCode(ref.current, { text: `CHALKLINE:${code}`, width: 180, height: 180 });
    }).catch(() => setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [code]);
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, "My QR code"), /* @__PURE__ */ React.createElement("div", { style: { width: 32 } })), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body", style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, "Let a friend scan this, or share your username below."), /* @__PURE__ */ React.createElement("div", { ref, className: "cl-qr-box" }), failed && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "Couldn't load the QR code generator \u2014 share the username below instead."), /* @__PURE__ */ React.createElement("p", { className: "cl-qr-code" }, "@", code)));
}
function PeopleSearch({ me, profiles, onClose, onOpenProfile }) {
  const [query, setQuery] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [scanState, setScanState] = useState("idle");
  const [scanError, setScanError] = useState("");
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();
  const rafRef = useRef();
  const results = Object.values(profiles).filter((p) => p.slug !== me && (p.name.toLowerCase().includes(query.toLowerCase()) || (p.username || "").toLowerCase().includes(query.toLowerCase())));
  const goToSlug = (slug) => {
    const p = profiles[slug];
    if (p) {
      onOpenProfile(p.slug);
      onClose();
    }
  };
  const stopScan = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanState("idle");
  };
  const tick = (jsQR) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(() => tick(jsQR));
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code && code.data) {
      const raw = code.data.trim();
      const scanned = raw.startsWith("CHALKLINE:") ? raw.slice("CHALKLINE:".length) : raw;
      const match = Object.values(profiles).find((p) => p.username === scanned.toLowerCase()) || profiles[scanned];
      if (match) {
        stopScan();
        goToSlug(match.slug);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(() => tick(jsQR));
  };
  const startScan = async () => {
    setScanError("");
    if (!window.isSecureContext) {
      setScanState("failed");
      setScanError("Camera access needs a secure (https) page \u2014 this should already be the case, but double-check your URL starts with https://.");
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScanState("failed");
      setScanError("This browser doesn't support camera access.");
      return;
    }
    setScanState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanState("active");
      const jsQR = await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.js", () => !!window.jsQR).then(() => window.jsQR);
      rafRef.current = requestAnimationFrame(() => tick(jsQR));
    } catch (err) {
      setScanState("failed");
      if (err && err.name === "NotAllowedError") setScanError("Camera permission was denied. Check your browser's site settings (usually the padlock icon next to the address bar) and allow camera access for this site, then try again.");
      else if (err && err.name === "NotFoundError") setScanError("No camera was found on this device.");
      else if (err && err.name === "NotReadableError") setScanError("Your camera is already in use by another app.");
      else setScanError("Couldn't load the QR scanner. You can still enter their code manually below.");
    }
  };
  useEffect(() => () => stopScan(), []);
  const goToCode = () => {
    const target = manualCode.trim();
    const code = (target.startsWith("CHALKLINE:") ? target.slice("CHALKLINE:".length) : target).toLowerCase();
    const match = Object.values(profiles).find((p) => p.username === code) || profiles[target];
    if (match) {
      onOpenProfile(match.slug);
      onClose();
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => {
    stopScan();
    onClose();
  } }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, "Find people"), /* @__PURE__ */ React.createElement("div", { style: { width: 32 } })), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body" }, /* @__PURE__ */ React.createElement("div", { className: "cl-search-wrap" }, /* @__PURE__ */ React.createElement(Search, { size: 15 }), /* @__PURE__ */ React.createElement("input", { className: "cl-input", style: { paddingLeft: 30 }, placeholder: "Search by name or username\u2026", value: query, onChange: (e) => setQuery(e.target.value), autoFocus: true })), /* @__PURE__ */ React.createElement("div", { className: "cl-resume-list" }, results.map((p) => /* @__PURE__ */ React.createElement("button", { key: p.slug, className: "cl-resume-item", onClick: () => {
    onOpenProfile(p.slug);
    onClose();
  } }, /* @__PURE__ */ React.createElement(Avatar, { name: p.name, photo: p.photo, size: 32 }), /* @__PURE__ */ React.createElement("span", null, p.name), /* @__PURE__ */ React.createElement(ChevronRight, { size: 16 }))), query && results.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "No match.")), /* @__PURE__ */ React.createElement("div", { className: "cl-qr-scan-section" }, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Scan a friend's QR code"), scanState !== "active" && /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost cl-full", onClick: startScan }, /* @__PURE__ */ React.createElement(QrCode, { size: 14, style: { marginRight: 6 } }), " ", scanState === "starting" ? "Requesting camera\u2026" : "Scan QR code"), scanState === "active" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("video", { ref: videoRef, className: "cl-qr-video", muted: true, playsInline: true }), /* @__PURE__ */ React.createElement("canvas", { ref: canvasRef, style: { display: "none" } }), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost cl-full", style: { marginTop: 8 }, onClick: stopScan }, "Cancel scan"), /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "Point your camera at their QR code.")), scanState === "failed" && /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, scanError || "Camera isn't available here \u2014 enter their code below instead."), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Or enter their username"), /* @__PURE__ */ React.createElement("div", { className: "cl-inline-add" }, /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: manualCode, onChange: (e) => setManualCode(e.target.value), placeholder: "Their username" }), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: goToCode }, /* @__PURE__ */ React.createElement(ChevronRight, { size: 16 }))))));
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
    if (current.length >= 2) return;
    onChange({ ...safePoints, [mode]: [...current, { x, y }] });
  };
  const removePoint = (type, idx, e) => {
    e.stopPropagation();
    onChange({ ...safePoints, [type]: safePoints[type].filter((_, i) => i !== idx) });
  };
  const anyPoints = safePoints.start.length > 0 || safePoints.end.length > 0;
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row", style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("button", { type: "button", className: mode === "start" ? "cl-toggle active" : "cl-toggle", onClick: () => setMode("start") }, "Mark start (", safePoints.start.length, "/2)"), /* @__PURE__ */ React.createElement("button", { type: "button", className: mode === "end" ? "cl-toggle active" : "cl-toggle", onClick: () => setMode("end") }, "Mark end (", safePoints.end.length, "/2)"), anyPoints && /* @__PURE__ */ React.createElement("button", { type: "button", className: "cl-btn-ghost", style: { flex: "0 0 auto" }, onClick: () => onChange({ start: [], end: [] }) }, /* @__PURE__ */ React.createElement(X, { size: 13 }))), /* @__PURE__ */ React.createElement("div", { className: "cl-point-photo-wrap", onClick: handleClick }, /* @__PURE__ */ React.createElement("img", { ref: imgRef, src: photo, alt: "mark climb points", className: "cl-point-photo" }), safePoints.start.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `s${i}`, className: "cl-point-marker start", style: { left: `${p.x}%`, top: `${p.y}%` }, onClick: (e) => removePoint("start", i, e) }, "S")), safePoints.end.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `e${i}`, className: "cl-point-marker end", style: { left: `${p.x}%`, top: `${p.y}%` }, onClick: (e) => removePoint("end", i, e) }, "E"))), /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "Optional \u2014 tap the photo to mark where you start and finish the climb."));
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
  const [photo, setPhoto] = useState(null);
  const [points, setPoints] = useState({ start: [], end: [] });
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
  };
  const startSession = () => {
    if (!continueEntry && !title.trim()) {
      setSetupError("Give this project a name.");
      return;
    }
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
    const extra = { technique, satisfaction, attemptLog: attempts, points: points.start.length > 0 || points.end.length > 0 ? points : null };
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
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, /* @__PURE__ */ React.createElement(Zap, { size: 16, style: { verticalAlign: -2 } }), " Live Log"), /* @__PURE__ */ React.createElement("div", { style: { width: 32 } })), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body" }, phase === "setup" && /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "What are you climbing?"), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Name this project *"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: title, onChange: (e) => setTitle(e.target.value), placeholder: "e.g. Blue arete by the window" }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Gym or crag"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: gym, onChange: (e) => setGym(e.target.value), list: "cl-gyms-live" }), /* @__PURE__ */ React.createElement("datalist", { id: "cl-gyms-live" }, GYM_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }))), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Type & grade"), /* @__PURE__ */ React.createElement(TypeSelector, { value: climb.type, onChange: (t) => setClimb({ type: t, grade: gradeOptionsFor(t) ? gradeOptionsFor(t)[0] : "" }) }), /* @__PURE__ */ React.createElement(GradeSelector, { type: climb.type, grade: climb.grade, onChange: (g) => setClimb({ ...climb, grade: g }) }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Photo of the wall (optional)"), /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*", capture: "environment", onChange: onFile, className: "cl-file-hidden", id: "live-photo-setup" }), /* @__PURE__ */ React.createElement("label", { htmlFor: "live-photo-setup", className: "cl-photo-btn" }, /* @__PURE__ */ React.createElement(Camera, { size: 16 }), " ", photo ? "Change photo" : "Add a photo"), photo && /* @__PURE__ */ React.createElement(PhotoPointPicker, { photo, points, onChange: setPoints }), setupError && /* @__PURE__ */ React.createElement("p", { className: "cl-error" }, setupError), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: startSession }, /* @__PURE__ */ React.createElement(Zap, { size: 16 }), " Start climbing")), phase === "ready" && /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Ready to go again"), /* @__PURE__ */ React.createElement("div", { className: "cl-chip-row", style: { marginTop: 0 } }, /* @__PURE__ */ React.createElement(GradeChip, { type: climb.type, grade: climb.grade })), /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, continueEntry.title, " \xB7 ", gym), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Photo of the wall (optional)"), /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*", capture: "environment", onChange: onFile, className: "cl-file-hidden", id: "live-photo-ready" }), /* @__PURE__ */ React.createElement("label", { htmlFor: "live-photo-ready", className: "cl-photo-btn" }, /* @__PURE__ */ React.createElement(Camera, { size: 16 }), " ", photo ? "Change photo" : "Add a photo"), photo && /* @__PURE__ */ React.createElement(PhotoPointPicker, { photo, points, onChange: setPoints }), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: startSession }, /* @__PURE__ */ React.createElement(Zap, { size: 16 }), " Start climbing")), (phase === "climbing" || phase === "resting") && /* @__PURE__ */ React.createElement("div", { className: "cl-live-tracker" }, /* @__PURE__ */ React.createElement("div", { className: "cl-live-timer" }, formatMs(phase === "climbing" ? elapsedCurrent : elapsedRest)), /* @__PURE__ */ React.createElement("p", { className: "cl-live-sub" }, phase === "climbing" ? `Attempt ${attempts.length + 1} \xB7 climbing` : "Resting"), /* @__PURE__ */ React.createElement("p", { className: "cl-live-total" }, "Total time: ", formatMs(elapsedTotal)), phase === "climbing" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption", style: { marginTop: 16 } }, "Fell at"), /* @__PURE__ */ React.createElement("div", { className: "cl-fall-row" }, FALL_POSITIONS.map((pos) => /* @__PURE__ */ React.createElement("button", { key: pos, className: "cl-fall-btn", onClick: () => recordFall(pos) }, pos))), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", style: { background: "var(--accent)" }, onClick: complete }, /* @__PURE__ */ React.createElement(CheckCircle2, { size: 16 }), " Complete!"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost cl-full", style: { marginTop: 8 }, onClick: stopHere }, "Stop here")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("textarea", { className: "cl-input cl-textarea", style: { marginBottom: 10 }, placeholder: "Notes while resting \u2014 what to adjust next try (optional)", value: restNote, onChange: (e) => setRestNote(e.target.value) }), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: startAgain }, /* @__PURE__ */ React.createElement(Repeat, { size: 16 }), " Start again"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost cl-full", style: { marginTop: 8 }, onClick: stopHere }, "Stop here")), attempts.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-hint", style: { marginTop: 12 } }, summarizeAttempts(attempts))), (phase === "ended-complete" || phase === "ended-stopped") && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, phase === "ended-complete" ? "Sent it! \u{1F389}" : "Session stopped"), /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, formatMs(elapsedTotal), " total \xB7 ", summarizeAttempts(attempts))), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Technique used"), /* @__PURE__ */ React.createElement(TagEditor, { options: TECHNIQUE_PRESETS, selected: technique, setSelected: setTechnique, placeholder: "Add another technique" })), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "How satisfied are you?"), /* @__PURE__ */ React.createElement(StarRating, { value: satisfaction, onChange: setSatisfaction })), /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Notes"), /* @__PURE__ */ React.createElement("textarea", { className: "cl-input cl-textarea", placeholder: "Anything else to remember\u2026", value: note, onChange: (e) => setNote(e.target.value) })), !continueEntry && /* @__PURE__ */ React.createElement("div", { className: "cl-form-section" }, /* @__PURE__ */ React.createElement("p", { className: "cl-section-caption" }, "Who can see this?"), /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, /* @__PURE__ */ React.createElement("button", { className: privacy === "public" ? "cl-toggle active" : "cl-toggle", onClick: () => setPrivacy("public") }, /* @__PURE__ */ React.createElement(Globe, { size: 13 }), " Public"), /* @__PURE__ */ React.createElement("button", { className: privacy === "private" ? "cl-toggle active" : "cl-toggle", onClick: () => setPrivacy("private") }, /* @__PURE__ */ React.createElement(Lock, { size: 13 }), " Private"))), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: save, disabled: saving }, saving ? "Saving\u2026" : "Save & post"))));
}
var SHARE_DESIGNS = [
  { id: "badge", label: "Achievement" },
  { id: "stats", label: "Stats card" },
  { id: "minimal", label: "Minimal" }
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
function drawMinimalDesign(ctx, W, H, data) {
  ctx.fillStyle = data.accentColor || "#6B8E4E";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.font = "700 28px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText((data.statusLabel || "").toUpperCase(), W / 2, H * 0.32);
  ctx.font = "800 100px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  drawWrappedText(ctx, data.achievement || "", W / 2, H * 0.32 + 90, W - 80, 96, "center");
  ctx.font = "600 26px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  let y = H * 0.62;
  (data.statsLines || []).slice(0, 2).forEach((line) => {
    ctx.fillText(line, W / 2, y);
    y += 38;
  });
  ctx.font = "700 30px sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(data.name || "", W / 2, H - 110);
  ctx.font = "400 20px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(`${data.place || ""}${data.date ? " \xB7 " + data.date : ""}`, W / 2, H - 76);
  ctx.font = "700 18px sans-serif";
  ctx.fillText("CHALKLINE", W / 2, H - 34);
  ctx.textAlign = "left";
}
function ShareCardModal({ data, onClose }) {
  const canvasRef = useRef();
  const [imgUrl, setImgUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [design, setDesign] = useState("badge");
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = 800, H = 1e3;
    canvas.width = W;
    canvas.height = H;
    const render = (img) => {
      if (design === "badge") drawBadgeDesign(ctx, W, H, data, img);
      else if (design === "stats") drawStatsDesign(ctx, W, H, data, img);
      else drawMinimalDesign(ctx, W, H, data);
      setImgUrl(canvas.toDataURL("image/png"));
    };
    if (data.photo && design !== "minimal") {
      const img = new Image();
      img.onload = () => render(img);
      img.onerror = () => render(null);
      img.src = data.photo;
    } else {
      render(null);
    }
  }, [data, design]);
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
  const copyText = () => {
    const link = `${window.location.origin}${window.location.pathname}?u=${encodeURIComponent(data.username || "")}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }).catch(() => {
      });
    }
  };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, "Share"), /* @__PURE__ */ React.createElement("div", { style: { width: 32 } })), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body", style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { className: "cl-pill-row", style: { justifyContent: "center", marginBottom: 10 } }, SHARE_DESIGNS.map((d) => /* @__PURE__ */ React.createElement("button", { key: d.id, className: design === d.id ? "cl-pill active" : "cl-pill", onClick: () => setDesign(d.id) }, d.label))), /* @__PURE__ */ React.createElement("canvas", { ref: canvasRef, style: { display: "none" } }), imgUrl ? /* @__PURE__ */ React.createElement("img", { src: imgUrl, alt: "share card", className: "cl-share-preview" }) : /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, "Rendering\u2026"), /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons" }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: copyText }, copied ? "Copied!" : "Copy link"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", style: { marginTop: 0 }, onClick: download, disabled: !imgUrl }, "Download image"))));
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
      setPosts(posts2);
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
    const photo = isDeal ? entry.photo : latest && latest.photo;
    return /* @__PURE__ */ React.createElement("div", { className: "cl-guest-post", key: entry.id }, photo && /* @__PURE__ */ React.createElement("img", { src: photo, alt: "", className: "cl-guest-post-photo" }), /* @__PURE__ */ React.createElement("div", { className: "cl-guest-post-title" }, entry.title), !isDeal && latest && /* @__PURE__ */ React.createElement("div", { className: "cl-chip-row", style: { marginTop: 4 } }, (latest.climbs || []).map((c, i) => /* @__PURE__ */ React.createElement(GradeChip, { key: i, type: c.type, grade: c.grade, status: c.status }))));
  })), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", style: { marginTop: 18 }, onClick: onGoToLogin }, "Log in or sign up to see more")));
}
function NewPostOverlay({ defaultGym, onClose, onSaveLog, onSaveDeal }) {
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, "New post"), /* @__PURE__ */ React.createElement("div", { style: { width: 32 } })), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body" }, /* @__PURE__ */ React.createElement(
    NewPostForm,
    {
      defaultGym,
      onCancel: onClose,
      onSaveLog: async (data) => {
        await onSaveLog(data);
        onClose();
      },
      onSaveDeal: async (data) => {
        await onSaveDeal(data);
        onClose();
      }
    }
  )));
}
function SettingsOverlay({ profile, onSave, onClose }) {
  const [draft, setDraft] = useState(profile);
  const save = async () => {
    await onSave(draft);
    onClose();
  };
  const toggleTracked = (t) => {
    const cur = draft.trackedTypes && draft.trackedTypes.length > 0 ? draft.trackedTypes : DEFAULT_TRACKED_TYPES;
    setDraft({ ...draft, trackedTypes: cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t] });
  };
  return /* @__PURE__ */ React.createElement("div", { className: "cl-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header" }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onClose }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: "cl-overlay-title" }, "Settings"), /* @__PURE__ */ React.createElement("div", { style: { width: 32 } })), /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-body" }, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Profile picture"), /* @__PURE__ */ React.createElement(PhotoPicker, { value: draft.photo, onChange: (p) => setDraft({ ...draft, photo: p }), idSuffix: "settings" }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Name"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: draft.name, onChange: (e) => setDraft({ ...draft, name: e.target.value }) }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Username"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: draft.username || "", onChange: (e) => setDraft({ ...draft, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }), placeholder: "e.g. aiman_climbs" }), /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "Your short, shareable ID \u2014 used for search and QR."), /* @__PURE__ */ React.createElement("div", { className: "cl-two-col" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Boulder level"), /* @__PURE__ */ React.createElement("select", { className: "cl-input", value: draft.boulder, onChange: (e) => setDraft({ ...draft, boulder: e.target.value }) }, PROFILE_BOULDER_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }, boulderOptionLabel(g))))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Route level"), /* @__PURE__ */ React.createElement("select", { className: "cl-input", value: draft.route || "NA", onChange: (e) => setDraft({ ...draft, route: e.target.value }) }, PROFILE_ROUTE_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }, routeGradeLabel(g)))))), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Climbing since"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", type: "month", value: draft.since, onChange: (e) => setDraft({ ...draft, since: e.target.value }) }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Qualifications"), /* @__PURE__ */ React.createElement(
    TagEditor,
    {
      options: QUALIFICATION_PRESETS,
      selected: draft.qualifications || [],
      setSelected: (q) => setDraft({ ...draft, qualifications: q }),
      placeholder: "Add another qualification",
      iconMap: QUALIFICATION_ICONS
    }
  ), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Gear"), /* @__PURE__ */ React.createElement(GearEditor, { gear: draft.gear || [], setGear: (gear) => setDraft({ ...draft, gear }) }), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Main gym"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: draft.mainGym || "", onChange: (e) => setDraft({ ...draft, mainGym: e.target.value }), list: "cl-gyms-settings", placeholder: "Search or type your gym\u2026" }), /* @__PURE__ */ React.createElement("datalist", { id: "cl-gyms-settings" }, GYM_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }))), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Track stats for which climb type(s)?"), /* @__PURE__ */ React.createElement("div", { className: "cl-qual-row" }, TRACKABLE_TYPES.map((t) => {
    const Icon = TYPE_ICONS[t];
    const active = (draft.trackedTypes && draft.trackedTypes.length > 0 ? draft.trackedTypes : DEFAULT_TRACKED_TYPES).includes(t);
    return /* @__PURE__ */ React.createElement("button", { key: t, type: "button", className: active ? "cl-qual-chip active" : "cl-qual-chip", onClick: () => toggleTracked(t) }, /* @__PURE__ */ React.createElement(Icon, { size: 13 }), " ", TYPE_LABELS[t], " ", active && /* @__PURE__ */ React.createElement(Check, { size: 12 }));
  })), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Show for those types"), /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, [["count", "How many"], ["hours", "Time"], ["both", "Both"]].map(([val, lbl]) => /* @__PURE__ */ React.createElement("button", { key: val, className: (draft.statMetric || DEFAULT_STAT_METRIC) === val ? "cl-toggle active" : "cl-toggle", onClick: () => setDraft({ ...draft, statMetric: val }) }, lbl))), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Appearance"), /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, [["light", "Light"], ["dark", "Dark"], ["system", "Match device"]].map(([val, lbl]) => /* @__PURE__ */ React.createElement("button", { key: val, className: (draft.themeMode || "light") === val ? "cl-toggle active" : "cl-toggle", onClick: () => setDraft({ ...draft, themeMode: val }) }, lbl))), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Accent colour"), /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, /* @__PURE__ */ React.createElement("button", { className: (draft.themeColor || "accent") === "accent" ? "cl-toggle active" : "cl-toggle", onClick: () => setDraft({ ...draft, themeColor: "accent" }) }, "Default"), /* @__PURE__ */ React.createElement("button", { className: draft.themeColor === "boulder" ? "cl-toggle active" : "cl-toggle", onClick: () => setDraft({ ...draft, themeColor: "boulder" }) }, "Match my boulder grade")), /* @__PURE__ */ React.createElement("p", { className: "cl-hint", style: { marginTop: 14 } }, "Your password is managed securely through your account \u2014 there's no separate passcode to set here anymore."), /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons" }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: onClose }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", style: { marginTop: 0 }, onClick: save }, "Save settings"))));
}
function HomeTab({ me, profile, saveProfile, allProfiles, refreshAll, logs, commentsMap, addLog, addComment, toggleKudo, deleteLog, addTry, togglePrivacy, toggleSave, loading, onOpenProfile, onOpenQR, onOpenSettings, onEnlarge, onOpenNewPost, onLiveLog, onShare, onShareProfile, onShareBadges, onShareToday }) {
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
  if (!profile) return null;
  const mine = logs.filter((l) => l.authorSlug === me);
  const climbLogs = mine.filter((l) => l.kind !== "deal");
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
  const publicPosts = mine.filter((l) => l.privacy !== "private");
  const baseList = view === "saved" ? savedPosts : view === "posts" ? publicPosts : climbLogs;
  const filteredLogs = baseList.filter(
    (l) => (query.trim() === "" || (l.title || "").toLowerCase().includes(query.toLowerCase()) || (l.gym || "").toLowerCase().includes(query.toLowerCase())) && (l.kind === "deal" || statusFilter === "all" || logHasStatus(l, statusFilter)) && (l.kind === "deal" || typeFilter === "all" || logHasType(l, typeFilter))
  ).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  return /* @__PURE__ */ React.createElement("div", { className: "cl-tab" }, /* @__PURE__ */ React.createElement("div", { className: "cl-badge" }, /* @__PURE__ */ React.createElement("div", { className: "cl-badge-top" }, /* @__PURE__ */ React.createElement(Avatar, { name: profile.name, photo: profile.photo, size: 56 }), /* @__PURE__ */ React.createElement("div", { className: "cl-badge-id" }, /* @__PURE__ */ React.createElement("div", { className: "cl-name-row" }, /* @__PURE__ */ React.createElement("h2", null, profile.name), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onOpenQR, title: "My QR code" }, /* @__PURE__ */ React.createElement(QrCode, { size: 16 }))), /* @__PURE__ */ React.createElement("p", { className: "cl-sub cl-nowrap" }, profile.since ? `Since ${(/* @__PURE__ */ new Date(profile.since + "-01")).toLocaleDateString(void 0, { month: "short", year: "2-digit" })} \xB7 ${climbingDuration(profile.since)}` : "Since \u2014"), /* @__PURE__ */ React.createElement("p", { className: "cl-id-text" }, "@", profile.username || profile.slug.slice(0, 8))), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onShareProfile, title: "Share your tag" }, /* @__PURE__ */ React.createElement(Share2, { size: 17 })), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onOpenSettings, title: "Settings" }, /* @__PURE__ */ React.createElement(Settings, { size: 18 }))), /* @__PURE__ */ React.createElement("div", { className: "cl-identity-stats" }, /* @__PURE__ */ React.createElement("div", { className: "cl-id-stat" }, /* @__PURE__ */ React.createElement("b", null, climbLogs.length), /* @__PURE__ */ React.createElement("span", null, "posts")), /* @__PURE__ */ React.createElement("button", { className: "cl-id-stat cl-stat-btn", onClick: () => setShowFollowers(showFollowers === "followers" ? null : "followers") }, /* @__PURE__ */ React.createElement("b", null, followerSlugs.length), /* @__PURE__ */ React.createElement("span", null, "followers")), /* @__PURE__ */ React.createElement("button", { className: "cl-id-stat cl-stat-btn", onClick: () => setShowFollowers(showFollowers === "following" ? null : "following") }, /* @__PURE__ */ React.createElement("b", null, followingSlugs.length), /* @__PURE__ */ React.createElement("span", null, "following"))), showFollowers && /* @__PURE__ */ React.createElement("div", { className: "cl-crew-grid", style: { marginTop: 10 } }, (showFollowers === "followers" ? followerSlugs : followingSlugs).length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "Nobody yet."), (showFollowers === "followers" ? followerSlugs : followingSlugs).map((s) => {
    const p = allProfiles[s];
    return p ? /* @__PURE__ */ React.createElement("button", { className: "cl-crew-card", key: s, onClick: () => onOpenProfile(s), style: { textAlign: "left", cursor: "pointer", border: "1px solid var(--line)" } }, /* @__PURE__ */ React.createElement(Avatar, { name: p.name, photo: p.photo, size: 30 }), /* @__PURE__ */ React.createElement("div", { className: "cl-crew-name" }, p.name)) : null;
  })), /* @__PURE__ */ React.createElement("div", { className: "cl-chip-row" }, /* @__PURE__ */ React.createElement(GradeChip, { type: "boulder", grade: boulderShown }), /* @__PURE__ */ React.createElement(GradeChip, { type: "toprope", grade: routeShown, label: "Route" })), profile.qualifications && profile.qualifications.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "cl-gear-row" }, profile.qualifications.map((q, i) => {
    const Ic = QUALIFICATION_ICONS[q] || GraduationCap;
    return /* @__PURE__ */ React.createElement("span", { className: "cl-gear-pill cl-qual-pill", key: i }, /* @__PURE__ */ React.createElement(Ic, { size: 11 }), " ", q);
  })), profile.gear && profile.gear.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "cl-gear-row" }, profile.gear.map((g, i) => /* @__PURE__ */ React.createElement("span", { className: "cl-gear-pill", key: i }, g))), /* @__PURE__ */ React.createElement("div", { className: "cl-badge-toggles" }, /* @__PURE__ */ React.createElement("div", { className: "cl-training-stats" }, /* @__PURE__ */ React.createElement("span", { className: "cl-training-stat" }, /* @__PURE__ */ React.createElement(CheckCircle2, { size: 12 }), " ", stats.totalSent, " finished"), trackedTypes.map((t) => {
    const count = stats[`${t}Count`];
    const mins = stats.minutesByType[t];
    let val;
    if (statMetric === "count") val = count;
    else if (statMetric === "hours") val = formatDuration(mins) || "0m";
    else val = `${count} \xB7 ${formatDuration(mins) || "0m"}`;
    const Icon = TYPE_ICONS[t];
    return /* @__PURE__ */ React.createElement("span", { className: "cl-training-stat", key: t }, /* @__PURE__ */ React.createElement(Icon, { size: 12 }), " ", TYPE_LABELS[t], " ", val);
  })), /* @__PURE__ */ React.createElement("button", { className: "cl-kudo-btn", onClick: () => setShowBadges((v) => !v) }, /* @__PURE__ */ React.createElement(Award, { size: 14 }), " ", earnedCount, "/", badges.length, " badges"), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: onShareBadges, title: "Share badges" }, /* @__PURE__ */ React.createElement(Share2, { size: 13 })), /* @__PURE__ */ React.createElement("button", { className: "cl-kudo-btn", onClick: () => setShowCharts((v) => !v) }, /* @__PURE__ */ React.createElement(TrendingUp, { size: 14 }), " Progress"), /* @__PURE__ */ React.createElement("button", { className: "cl-kudo-btn", onClick: onShareToday }, /* @__PURE__ */ React.createElement(Zap, { size: 14 }), " Share today")), showBadges && /* @__PURE__ */ React.createElement(BadgesGrid, { stats }), showCharts && /* @__PURE__ */ React.createElement(ProgressCharts, { mine: climbLogs })), /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, /* @__PURE__ */ React.createElement("button", { className: view === "records" ? "cl-toggle active" : "cl-toggle", onClick: () => setView("records") }, /* @__PURE__ */ React.createElement(Layers, { size: 13 }), " Climb records"), /* @__PURE__ */ React.createElement("button", { className: view === "posts" ? "cl-toggle active" : "cl-toggle", onClick: () => setView("posts") }, /* @__PURE__ */ React.createElement(Mountain, { size: 13 }), " My posts"), /* @__PURE__ */ React.createElement("button", { className: view === "saved" ? "cl-toggle active" : "cl-toggle", onClick: () => setView("saved") }, /* @__PURE__ */ React.createElement(Bookmark, { size: 13 }), " Saved")), /* @__PURE__ */ React.createElement(
    IconControls,
    {
      onSearch: () => setShowSearch((v) => !v),
      searchOn: showSearch,
      onFilter: () => setShowFilters((v) => !v),
      filterOn: showFilters,
      refresh: refreshAll,
      loading,
      onAdd: view !== "saved" ? onOpenNewPost : null
    }
  ), showSearch && /* @__PURE__ */ React.createElement("div", { className: "cl-search-wrap" }, /* @__PURE__ */ React.createElement(Search, { size: 15 }), /* @__PURE__ */ React.createElement("input", { className: "cl-input", style: { paddingLeft: 30 }, placeholder: "Search by title or gym\u2026", value: query, onChange: (e) => setQuery(e.target.value) })), showFilters && /* @__PURE__ */ React.createElement("div", { className: "cl-filter-grid" }, /* @__PURE__ */ React.createElement("select", { className: "cl-input cl-select", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "Any status"), Object.keys(STATUS_LABELS).map((s) => /* @__PURE__ */ React.createElement("option", { key: s, value: s }, STATUS_LABELS[s]))), /* @__PURE__ */ React.createElement("select", { className: "cl-input cl-select", value: typeFilter, onChange: (e) => setTypeFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All types"), TYPES.map((t) => /* @__PURE__ */ React.createElement("option", { key: t, value: t }, TYPE_LABELS[t])))), filteredLogs.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, view === "saved" ? "No saved posts yet." : "Nothing logged yet. Tap + to start."), view === "records" && groupRecordsByDay(filteredLogs.filter((l) => l.kind !== "deal")).map((group) => /* @__PURE__ */ React.createElement("div", { key: group.label, className: "cl-day-group" }, /* @__PURE__ */ React.createElement("p", { className: "cl-day-header" }, group.label), group.items.map((entry) => /* @__PURE__ */ React.createElement(RecordRow, { key: entry.id, entry, expanded: expandedRecord === entry.id, onToggle: () => setExpandedRecord(expandedRecord === entry.id ? null : entry.id) }, /* @__PURE__ */ React.createElement(RecordDetail, { entry, me, onDelete: deleteLog, onTogglePrivacy: togglePrivacy, onAddTry: addTry, onLiveLog, onEnlarge, onShare }))))), view !== "records" && filteredLogs.map((entry) => /* @__PURE__ */ React.createElement(
    PostCard,
    {
      key: entry.id,
      entry,
      profile,
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
      onShare
    }
  )));
}
function FeedTab({ me, profile, logs, profiles, commentsMap, addComment, refresh, loading, toggleKudo, deleteLog, addTry, togglePrivacy, toggleSave, onOpenProfile, onEnlarge, onOpenNewPost, onLiveLog, onShare }) {
  const [feedTab, setFeedTab] = useState("suggested");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");
  const [climberFilter, setClimberFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gymFilter, setGymFilter] = useState("all");
  const notBlocked = (l) => !isBlockedEitherWay(profile, profiles[l.authorSlug]);
  const visible = logs.filter((l) => (l.privacy !== "private" || l.authorSlug === me) && notBlocked(l));
  const logHasType = (l, t) => (l.updates || []).some((u) => (u.climbs || []).some((c) => c.type === t));
  const logHasStatus = (l, s) => {
    const latest = (l.updates || [])[l.updates.length - 1];
    return latest && (latest.climbs || []).some((c) => c.status === s);
  };
  let scoped = visible;
  if (feedTab === "following") scoped = visible.filter((l) => (profile.following || []).includes(l.authorSlug));
  if (feedTab === "deals") scoped = visible.filter((l) => l.kind === "deal");
  const gyms = [...new Set(scoped.filter((l) => l.kind !== "deal").map((l) => l.gym))];
  const filtered = scoped.filter(
    (l) => (query.trim() === "" || (l.title || "").toLowerCase().includes(query.toLowerCase()) || (l.gym || "").toLowerCase().includes(query.toLowerCase())) && (climberFilter === "all" || l.authorSlug === climberFilter) && (l.kind === "deal" || typeFilter === "all" || logHasType(l, typeFilter)) && (l.kind === "deal" || statusFilter === "all" || logHasStatus(l, statusFilter)) && (l.kind === "deal" || gymFilter === "all" || l.gym === gymFilter)
  ).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  return /* @__PURE__ */ React.createElement("div", { className: "cl-tab" }, /* @__PURE__ */ React.createElement("div", { className: "cl-feed-tabs" }, /* @__PURE__ */ React.createElement("button", { className: feedTab === "following" ? "cl-feed-tab active" : "cl-feed-tab", onClick: () => setFeedTab("following") }, "Following"), /* @__PURE__ */ React.createElement("button", { className: feedTab === "suggested" ? "cl-feed-tab active" : "cl-feed-tab", onClick: () => setFeedTab("suggested") }, "Suggested"), /* @__PURE__ */ React.createElement("button", { className: feedTab === "deals" ? "cl-feed-tab active" : "cl-feed-tab", onClick: () => setFeedTab("deals") }, /* @__PURE__ */ React.createElement(TagIcon, { size: 12 }), " Good deals")), /* @__PURE__ */ React.createElement(
    IconControls,
    {
      onSearch: () => setShowSearch((v) => !v),
      searchOn: showSearch,
      onFilter: () => setShowFilters((v) => !v),
      filterOn: showFilters,
      refresh,
      loading,
      onAdd: onOpenNewPost
    }
  ), showSearch && /* @__PURE__ */ React.createElement("div", { className: "cl-search-wrap" }, /* @__PURE__ */ React.createElement(Search, { size: 15 }), /* @__PURE__ */ React.createElement("input", { className: "cl-input", style: { paddingLeft: 30 }, placeholder: "Search by title or gym\u2026", value: query, onChange: (e) => setQuery(e.target.value) })), showFilters && /* @__PURE__ */ React.createElement("div", { className: "cl-filter-grid" }, /* @__PURE__ */ React.createElement("select", { className: "cl-input cl-select", value: climberFilter, onChange: (e) => setClimberFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "Everyone"), Object.values(profiles).map((p) => /* @__PURE__ */ React.createElement("option", { key: p.slug, value: p.slug }, p.name))), feedTab !== "deals" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("select", { className: "cl-input cl-select", value: typeFilter, onChange: (e) => setTypeFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All types"), TYPES.map((t) => /* @__PURE__ */ React.createElement("option", { key: t, value: t }, TYPE_LABELS[t]))), /* @__PURE__ */ React.createElement("select", { className: "cl-input cl-select", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "Any status"), Object.keys(STATUS_LABELS).map((s) => /* @__PURE__ */ React.createElement("option", { key: s, value: s }, STATUS_LABELS[s]))), /* @__PURE__ */ React.createElement("select", { className: "cl-input cl-select", value: gymFilter, onChange: (e) => setGymFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All gyms"), gyms.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }, g))))), filtered.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "Nothing here yet."), filtered.map((entry) => /* @__PURE__ */ React.createElement(
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
      onLiveLog,
      onShare
    }
  )));
}
function SessionCard({ session, profiles, me, onJoin, onLeave, onDelete, onOpenProfile }) {
  const joined = session.participants.includes(me);
  const creator = profiles[session.creatorSlug];
  const otherJoined = session.participants.length - 1;
  const spotsLeft = session.capacity - otherJoined;
  const isMine = session.creatorSlug === me;
  const invitedNotJoined = (session.invited || []).filter((s) => !session.participants.includes(s));
  const iAmInvited = (session.invited || []).includes(me) && !joined;
  const badge = formatDateBadge(session.date);
  return /* @__PURE__ */ React.createElement("div", { className: iAmInvited ? "cl-card cl-invited" : "cl-card" }, /* @__PURE__ */ React.createElement("div", { className: "cl-session-top" }, /* @__PURE__ */ React.createElement("div", { className: "cl-date-badge" }, /* @__PURE__ */ React.createElement("span", { className: "cl-date-day" }, badge.day), /* @__PURE__ */ React.createElement("span", { className: "cl-date-mon" }, badge.mon)), /* @__PURE__ */ React.createElement("div", { className: "cl-session-main" }, /* @__PURE__ */ React.createElement("button", { className: "cl-session-title-btn", onClick: () => onOpenProfile(session.creatorSlug) }, session.kind === "course" ? `${creator?.name || session.creatorName}'s course` : `Climb with ${creator?.name || session.creatorName}`), /* @__PURE__ */ React.createElement("button", { className: "cl-session-host", onClick: () => onOpenProfile(session.creatorSlug) }, /* @__PURE__ */ React.createElement(Avatar, { name: creator?.name || session.creatorName, photo: creator?.photo, size: 18 }), " Hosted by ", creator?.name || session.creatorName), /* @__PURE__ */ React.createElement("div", { className: "cl-session-gym" }, /* @__PURE__ */ React.createElement(MapPin, { size: 14 }), " ", session.gym), /* @__PURE__ */ React.createElement("div", { className: "cl-session-when" }, /* @__PURE__ */ React.createElement("span", { className: "cl-session-date" }, formatDateLong(session.date)), session.time && /* @__PURE__ */ React.createElement("span", { className: "cl-session-time-chip" }, /* @__PURE__ */ React.createElement(Clock, { size: 12 }), " ", session.time))), /* @__PURE__ */ React.createElement("span", { className: `cl-status cl-status-${session.kind === "course" ? "trying" : "sent"}` }, session.kind === "course" ? "Course" : "Climb"), isMine && /* @__PURE__ */ React.createElement(ConfirmButton, { onConfirm: () => onDelete(session.id), icon: /* @__PURE__ */ React.createElement(Trash2, { size: 14 }), title: "Cancel", label: "Cancel" })), /* @__PURE__ */ React.createElement("div", { className: "cl-card-body" }, iAmInvited && /* @__PURE__ */ React.createElement("p", { className: "cl-invite-note" }, "You're invited \u2014 join below"), session.kind === "course" && session.level && /* @__PURE__ */ React.createElement("p", { className: "cl-note" }, /* @__PURE__ */ React.createElement("b", null, "Level:"), " ", session.level), session.note && /* @__PURE__ */ React.createElement("p", { className: "cl-note" }, session.note), /* @__PURE__ */ React.createElement("div", { className: "cl-session-footer" }, /* @__PURE__ */ React.createElement("div", { className: "cl-participants" }, session.participants.map((slug) => {
    const p = profiles[slug];
    return /* @__PURE__ */ React.createElement(Avatar, { key: slug, name: p?.name || "?", photo: p?.photo, size: 26 });
  })), /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, spotsLeft > 0 ? `${spotsLeft} of ${session.capacity} spots left` : "Full")), invitedNotJoined.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "Invited: ", invitedNotJoined.map((s) => profiles[s]?.name || s).join(", "))), joined ? /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: () => onLeave(session.id) }, "Leave") : /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: () => onJoin(session.id), disabled: spotsLeft <= 0 }, spotsLeft <= 0 ? "Full" : session.kind === "course" ? "Join course" : "Join & climb together"));
}
function SessionsTab({ me, profile, sessions, profiles, addSession, joinSession, leaveSession, deleteSession, refresh, loading, onOpenProfile }) {
  const [showForm, setShowForm] = useState(false);
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
  return /* @__PURE__ */ React.createElement("div", { className: "cl-tab" }, /* @__PURE__ */ React.createElement("div", { className: "cl-section-head" }, /* @__PURE__ */ React.createElement("span", { className: "cl-page-icon" }, /* @__PURE__ */ React.createElement(CalendarDays, { size: 18 })), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", title: "Refresh", onClick: refresh }, /* @__PURE__ */ React.createElement(RefreshCw, { size: 17, className: loading ? "cl-spin" : "" })), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn cl-add-btn", title: "Plan", onClick: () => setShowForm((v) => !v) }, /* @__PURE__ */ React.createElement(Plus, { size: 20 }))), /* @__PURE__ */ React.createElement("div", { className: "cl-nice-search" }, /* @__PURE__ */ React.createElement(Search, { size: 16 }), /* @__PURE__ */ React.createElement("input", { className: "cl-input cl-nice-search-input", placeholder: "Search by gym, host, or note\u2026", value: query, onChange: (e) => setQuery(e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "cl-filter-bar" }, /* @__PURE__ */ React.createElement("div", { className: "cl-pill-row" }, [["all", "All"], ["climb", "Climb together"], ["course", "Courses"]].map(([val, lbl]) => /* @__PURE__ */ React.createElement("button", { key: val, className: kindFilter === val ? "cl-pill active" : "cl-pill", onClick: () => setKindFilter(val) }, lbl))), /* @__PURE__ */ React.createElement("div", { className: "cl-filter-bar-row" }, /* @__PURE__ */ React.createElement("select", { className: "cl-input cl-select", value: gymFilter, onChange: (e) => setGymFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "All gyms"), gyms.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }, g))), /* @__PURE__ */ React.createElement("div", { className: "cl-date-filter" }, /* @__PURE__ */ React.createElement(CalendarDays, { size: 14 }), /* @__PURE__ */ React.createElement("input", { className: "cl-input", type: "date", value: fromDate, onChange: (e) => setFromDate(e.target.value) }), fromDate && /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => setFromDate("") }, /* @__PURE__ */ React.createElement(X, { size: 13 }))))), showForm && /* @__PURE__ */ React.createElement("div", { className: "cl-card cl-form-card" }, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "What is this?"), /* @__PURE__ */ React.createElement("div", { className: "cl-toggle-row" }, /* @__PURE__ */ React.createElement("button", { className: kind === "climb" ? "cl-toggle active" : "cl-toggle", onClick: () => setKind("climb") }, "Climb together"), /* @__PURE__ */ React.createElement("button", { className: kind === "course" ? "cl-toggle active" : "cl-toggle", onClick: () => setKind("course") }, "Host a course")), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Gym or crag"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: gym, onChange: (e) => setGym(e.target.value), list: "cl-gyms2" }), /* @__PURE__ */ React.createElement("datalist", { id: "cl-gyms2" }, GYM_OPTIONS.map((g) => /* @__PURE__ */ React.createElement("option", { key: g, value: g }))), /* @__PURE__ */ React.createElement("div", { className: "cl-two-col" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Date"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", type: "date", value: date, onChange: (e) => setDate(e.target.value) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Time"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", type: "time", value: time, onChange: (e) => setTime(e.target.value) }))), kind === "course" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Who's it for"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: level, onChange: (e) => setLevel(e.target.value), placeholder: "e.g. Beginners, basic belay certification" })), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "How many friends can join (not counting you)?"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", type: "number", min: "1", value: capacity, onChange: (e) => setCapacity(e.target.value) }), crew.length > 0 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Invite specific friends (optional)"), /* @__PURE__ */ React.createElement("div", { className: "cl-invite-list" }, crew.map((p) => /* @__PURE__ */ React.createElement("button", { key: p.slug, type: "button", className: invited.includes(p.slug) ? "cl-qual-chip active" : "cl-qual-chip", onClick: () => toggleInvite(p.slug) }, invited.includes(p.slug) && /* @__PURE__ */ React.createElement(Check, { size: 12 }), " ", p.name)))), /* @__PURE__ */ React.createElement("label", { className: "cl-label" }, "Note"), /* @__PURE__ */ React.createElement("input", { className: "cl-input", value: note, onChange: (e) => setNote(e.target.value), placeholder: "Meet at the entrance, bring shoes\u2026" }), /* @__PURE__ */ React.createElement("div", { className: "cl-row-buttons" }, /* @__PURE__ */ React.createElement("button", { className: "cl-btn-ghost", onClick: () => setShowForm(false) }, "Cancel"), /* @__PURE__ */ React.createElement("button", { className: "cl-btn-primary", onClick: create, disabled: !date }, kind === "course" ? "Create course" : "Create session"))), upcoming.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "Nothing matches. Tap + to plan one."), upcoming.map((s) => /* @__PURE__ */ React.createElement(SessionCard, { key: s.id, session: s, profiles, me, onJoin: joinSession, onLeave: leaveSession, onDelete: deleteSession, onOpenProfile })));
}
function ChatTab({ me, profile, profiles, threads, sendMessage, refresh, loading, onOpenProfile, onToggleBlock, openWith, onConsumeOpenWith }) {
  const [activeWith, setActiveWith] = useState(null);
  const [text, setText] = useState("");
  useEffect(() => {
    if (openWith) {
      setActiveWith(openWith);
      onConsumeOpenWith();
    }
  }, [openWith]);
  const sorted = [...threads].sort((a, b) => {
    const at = a.messages.length ? a.messages[a.messages.length - 1].timestamp : a.createdAt || 0;
    const bt = b.messages.length ? b.messages[b.messages.length - 1].timestamp : b.createdAt || 0;
    return bt - at;
  });
  if (activeWith) {
    const other = profiles[activeWith];
    const thread = threads.find((t) => t.participants.includes(activeWith)) || { messages: [] };
    const friend = isFriend(profile, other);
    const blocked = isBlockedEitherWay(profile, other);
    const canSend = friend || thread.messages.length === 0 || thread.messages.some((m) => m.from === activeWith);
    const submit = async () => {
      if (!text.trim() || !canSend || blocked) return;
      await sendMessage(activeWith, text.trim());
      setText("");
    };
    return /* @__PURE__ */ React.createElement("div", { className: "cl-tab" }, /* @__PURE__ */ React.createElement("div", { className: "cl-overlay-header", style: { position: "static", border: "none", padding: "0 0 8px" } }, /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => setActiveWith(null) }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement(ClickableIdentity, { name: other?.name || "?", photo: other?.photo, size: 28, onClick: () => onOpenProfile(activeWith) }), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => onToggleBlock(activeWith), title: "Block" }, /* @__PURE__ */ React.createElement(Ban, { size: 16 }))), /* @__PURE__ */ React.createElement("div", { className: "cl-chat-scroll" }, thread.messages.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "Say hi to ", other?.name, "."), thread.messages.map((m, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: m.from === me ? "cl-bubble mine" : "cl-bubble" }, m.text))), blocked ? /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "You or ", other?.name, " have blocked each other.") : !canSend ? /* @__PURE__ */ React.createElement("p", { className: "cl-hint" }, "Waiting for ", other?.name, " to reply before you can send more messages.") : /* @__PURE__ */ React.createElement("div", { className: "cl-comment-input" }, /* @__PURE__ */ React.createElement("input", { className: "cl-input", placeholder: "Message\u2026", value: text, onChange: (e) => setText(e.target.value), onKeyDown: (e) => e.key === "Enter" && submit() }), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: submit }, /* @__PURE__ */ React.createElement(Send, { size: 16 }))));
  }
  return /* @__PURE__ */ React.createElement("div", { className: "cl-tab" }, /* @__PURE__ */ React.createElement("div", { className: "cl-section-head" }, /* @__PURE__ */ React.createElement("span", { className: "cl-page-icon" }, /* @__PURE__ */ React.createElement(MessageCircle, { size: 18 })), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: refresh }, /* @__PURE__ */ React.createElement(RefreshCw, { size: 17, className: loading ? "cl-spin" : "" }))), sorted.length === 0 && /* @__PURE__ */ React.createElement("p", { className: "cl-empty" }, "No conversations yet. Message someone from their profile."), sorted.map((t) => {
    const otherSlug = t.participants.find((p) => p !== me);
    const other = profiles[otherSlug];
    const last = t.messages[t.messages.length - 1];
    if (!other) return null;
    return /* @__PURE__ */ React.createElement("button", { key: otherSlug, className: "cl-thread-row", onClick: () => setActiveWith(otherSlug) }, /* @__PURE__ */ React.createElement(Avatar, { name: other.name, photo: other.photo, size: 40 }), /* @__PURE__ */ React.createElement("div", { className: "cl-thread-text" }, /* @__PURE__ */ React.createElement("div", { className: "cl-thread-name" }, other.name), /* @__PURE__ */ React.createElement("div", { className: "cl-thread-preview" }, last ? last.text : "No messages yet")), last && /* @__PURE__ */ React.createElement("span", { className: "cl-thread-time" }, timeAgo(last.timestamp)));
  }));
}
function ChalklineApp() {
  const [me, setMe] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [showPeopleSearch, setShowPeopleSearch] = useState(false);
  const [showMyQR, setShowMyQR] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [pendingChatWith, setPendingChatWith] = useState(null);
  const [liveLogState, setLiveLogState] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [shareData, setShareData] = useState(null);
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
  const [threads, setThreads] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
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
    const arr = vals.filter(Boolean).map((v) => JSON.parse(v));
    setLogs(arr);
    const cKeys = arr.map((l) => `comments:${l.id}`);
    const cVals = await Promise.all(cKeys.map((k) => safeGet(k, true)));
    const cMap = {};
    arr.forEach((l, i) => {
      cMap[l.id] = cVals[i] ? JSON.parse(cVals[i]) : [];
    });
    setCommentsMap(cMap);
    return arr;
  }, []);
  const loadSessions = useCallback(async () => {
    const keys = await safeList("session:", true);
    const vals = await Promise.all(keys.map((k) => safeGet(k, true)));
    setSessions(vals.filter(Boolean).map((v) => JSON.parse(v)));
  }, []);
  const loadThreads = useCallback(async (myMe) => {
    const keys = await safeList("thread:", true);
    const vals = await Promise.all(keys.map((k) => safeGet(k, true)));
    const arr = vals.filter(Boolean).map((v) => JSON.parse(v)).filter((t) => myMe && t.participants.includes(myMe));
    setThreads(arr);
  }, []);
  const refreshAll = useCallback(async () => {
    setLoadingFeed(true);
    await Promise.all([loadProfiles(), loadLogs(), loadSessions(), loadThreads(me)]);
    setLoadingFeed(false);
    setHasLoadedOnce(true);
  }, [loadProfiles, loadLogs, loadSessions, loadThreads, me]);
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
    const finalTitle = data.title || (data.postType === "day" ? `Day at ${data.gym}` : "Untitled project");
    const firstUpdate = { id: uid(), timestamp: Date.now(), note: data.note, photo: data.photo, minutes: data.minutes, climbs: data.climbs, ...data.extra || {} };
    await addLog({
      id: uid(),
      authorSlug: me,
      authorName: author.name,
      kind: "climb",
      postType: data.postType,
      title: finalTitle,
      gym: data.gym,
      privacy: data.privacy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      updates: [firstUpdate],
      kudos: [],
      savedBy: []
    });
  };
  const createDealPost = async (data) => {
    const author = profiles[me];
    await addLog({
      id: uid(),
      authorSlug: me,
      authorName: author.name,
      kind: "deal",
      title: data.title,
      description: data.description,
      price: data.price,
      link: data.link,
      photo: data.photo,
      privacy: data.privacy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      kudos: [],
      savedBy: []
    });
  };
  const onShare = (entry) => {
    const author = profiles[entry.authorSlug] || profiles[me];
    if (entry.kind === "deal") {
      setShareData({
        name: author.name,
        username: author.username,
        place: "For sale",
        achievement: entry.title,
        statsLines: [entry.price || "", entry.description ? entry.description.slice(0, 60) : ""].filter(Boolean),
        photo: entry.photo,
        accentColor: "#3A4A63",
        date: new Date(entry.createdAt).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" })
      });
      return;
    }
    const latest = entry.updates[entry.updates.length - 1];
    const primary = (latest.climbs || [])[0];
    const finished = (latest.climbs || []).some((c) => c.status === "sent");
    const gradeText = primary ? primary.type === "boulder" ? primary.grade : usGrade(primary.grade) : "";
    const achievement = primary ? `${TYPE_LABELS[primary.type]} ${gradeText}` : entry.title;
    const attemptSummary = latest.attemptLog && latest.attemptLog.length > 0 ? summarizeAttempts(latest.attemptLog) : null;
    setShareData({
      name: author.name,
      username: author.username,
      place: entry.gym,
      achievement,
      statusLabel: finished ? "Finished" : "Trying",
      statsLines: [
        entry.title,
        latest.minutes > 0 ? `Time: ${formatDuration(latest.minutes)}` : null,
        attemptSummary
      ].filter(Boolean),
      photo: latest.photo,
      accentColor: "#C4501F",
      date: new Date(latest.timestamp).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" })
    });
  };
  const shareProfileStats = () => {
    const mine = logs.filter((l) => l.authorSlug === me);
    const stats = computeStats(mine);
    setShareData({
      name: profiles[me].name,
      username: profiles[me].username,
      place: profiles[me].mainGym || "",
      achievement: `${stats.totalSent} sends`,
      statusLabel: "All-time stats",
      statsLines: [`${stats.totalTries} climbs logged`, `${formatDuration(stats.totalMinutes) || "0m"} climbed`],
      photo: profiles[me].photo,
      accentColor: "#6B8E4E",
      date: profiles[me].since ? `Climbing since ${profiles[me].since}` : ""
    });
  };
  const shareBadges = () => {
    const mine = logs.filter((l) => l.authorSlug === me);
    const stats = computeStats(mine);
    const earned = computeDisplayBadges(stats).filter((b) => b.earned);
    setShareData({
      name: profiles[me].name,
      username: profiles[me].username,
      place: profiles[me].mainGym || "",
      achievement: `${earned.length} badges`,
      statusLabel: "Badges earned",
      statsLines: earned.slice(0, 3).map((b) => b.label),
      photo: profiles[me].photo,
      accentColor: "#D4A017",
      date: ""
    });
  };
  const shareToday = () => {
    const todayStr = (/* @__PURE__ */ new Date()).toDateString();
    const mine = logs.filter((l) => l.authorSlug === me && l.kind !== "deal");
    let tries = 0, sent = 0, minutes = 0;
    mine.forEach((l) => {
      (l.updates || []).forEach((u) => {
        if (new Date(u.timestamp).toDateString() !== todayStr) return;
        minutes += Number(u.minutes) || 0;
        (u.climbs || []).forEach((c) => {
          tries++;
          if (c.status === "sent") sent++;
        });
      });
    });
    setShareData({
      name: profiles[me].name,
      username: profiles[me].username,
      place: profiles[me].mainGym || "",
      achievement: `${sent} sent today`,
      statusLabel: "Today's session",
      statsLines: [`${tries} climbs tried`, `${formatDuration(minutes) || "0m"} climbed`],
      photo: profiles[me].photo,
      accentColor: "#6B4C93",
      date: (/* @__PURE__ */ new Date()).toLocaleDateString(void 0, { weekday: "long", month: "short", day: "numeric" })
    });
  };
  const addTry = async (logId, data) => {
    const entry = logs.find((l) => l.id === logId);
    if (!entry) return;
    const update = { id: uid(), timestamp: Date.now(), note: data.note, photo: data.photo, minutes: data.minutes, climbs: data.climbs, ...data.extra || {} };
    const next = { ...entry, updatedAt: Date.now(), updates: [...entry.updates || [], update] };
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
  const sendMessage = async (otherSlug, text) => {
    const key = `thread:${[me, otherSlug].sort().join("__")}`;
    const existing = threads.find((t) => t.participants.includes(otherSlug)) || { participants: [me, otherSlug].sort(), messages: [], createdAt: Date.now() };
    const next = { ...existing, messages: [...existing.messages, { from: me, text, timestamp: Date.now() }] };
    await safeSet(key, JSON.stringify(next), true);
    setThreads((prev) => {
      const idx = prev.findIndex((t) => t.participants.includes(otherSlug));
      if (idx === -1) return [...prev, next];
      const copy = [...prev];
      copy[idx] = next;
      return copy;
    });
  };
  const logOut = async () => {
    try {
      await window.supabaseAuth.signOut();
    } catch {
    }
    setMenuOpen(false);
    setMe(null);
  };
  const openProfile = (slug) => {
    if (slug === me) {
      setTab("home");
    } else {
      setViewingProfile(slug);
    }
  };
  const goToChat = (slug) => {
    setViewingProfile(null);
    setPendingChatWith(slug);
    setTab("chat");
  };
  const myProfile = me ? profiles[me] : null;
  const themeMode = myProfile && myProfile.themeMode || "light";
  const isDark = themeMode === "dark" || themeMode === "system" && systemDark;
  const themeColor = myProfile && myProfile.themeColor;
  const accentOverride = themeColor === "boulder" && myProfile ? gradeColor("boulder", myProfile.boulder) : null;
  const rootStyle = accentOverride ? { "--accent2": accentOverride } : void 0;
  return /* @__PURE__ */ React.createElement("div", { className: isDark ? "cl-app cl-dark" : "cl-app", style: rootStyle }, /* @__PURE__ */ React.createElement("style", null, `
        .cl-app {
          --bg: #E7E3D8;
          --surface: #FBFAF6;
          --ink: #22241F;
          --ink-soft: #5B5A50;
          --line: #D9D4C4;
          --accent: #6B8E4E;
          --accent2: #C4501F;
          --radius: 10px;
          font-family: 'Work Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          width: 100%;
          position: relative;
        }
        .cl-app.cl-dark {
          --bg: #1A1B17;
          --surface: #24261F;
          --ink: #EDEAE1;
          --ink-soft: #A8A395;
          --line: #3A3C33;
        }
        .cl-app h1, .cl-app h2, .cl-app h3 {
          font-family: 'Big Shoulders Display', 'Arial Narrow', sans-serif;
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

        .cl-main { max-width: 620px; margin: 0 auto; padding: 16px 14px 90px; }
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
        .cl-icon-btn { background: none; border: none; color: var(--ink-soft); cursor: pointer; display: flex; align-items: center; padding: 6px; border-radius: 6px; }
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
        .cl-controls-spacer { flex: 1; }
        .cl-add-btn { background: var(--ink); color: var(--surface); }

        .cl-badge { background: var(--surface); border: 1.5px solid var(--line); border-radius: var(--radius); padding: 16px; }
        .cl-badge-top { display: flex; align-items: center; gap: 12px; }
        .cl-badge-id { flex: 1; }
        .cl-badge-id h2 { font-size: 22px; }
        .cl-name-row { display: flex; align-items: center; gap: 6px; }
        .cl-badge-toggles { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; align-items: center; }
        .cl-identity-stats { display: flex; gap: 18px; margin-top: 10px; }
        .cl-id-stat { display: flex; flex-direction: column; align-items: center; background: none; border: none; cursor: default; font-family: inherit; }
        .cl-id-stat b { font-size: 15px; font-family: 'Big Shoulders Display', sans-serif; }
        .cl-id-stat span { font-size: 10px; color: var(--ink-soft); }
        .cl-training-stats { display: flex; gap: 10px; flex-wrap: wrap; width: 100%; margin-bottom: 4px; }
        .cl-training-stat { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--ink-soft); }

        .cl-chip-row { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; align-items: center; }
        .cl-chip { display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid; border-radius: 20px; padding: 4px 10px; font-size: 12px; font-weight: 600; }
        .cl-chip-dot { width: 8px; height: 8px; border-radius: 50%; }
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
        .cl-gear-pill { background: var(--bg); border: 1px solid var(--line); border-radius: 20px; padding: 4px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; }
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
        .cl-form-card { padding: 16px; }
        .cl-form-section { padding: 12px 0; border-bottom: 1px solid var(--line); }
        .cl-form-section:first-child { padding-top: 0; }
        .cl-form-section:last-of-type { border-bottom: none; padding-bottom: 4px; }
        .cl-section-caption { font-size: 12px; font-weight: 700; color: var(--ink); margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.03em; }
        .cl-form-section .cl-label:first-of-type { margin-top: 0; }
        .cl-card-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px 8px; }
        .cl-card-title { font-weight: 700; font-size: 14px; }
        .cl-status { font-size: 10px; padding: 3px 9px; border-radius: 20px; background: var(--bg); color: var(--ink-soft); align-self: flex-start; white-space: nowrap; display: inline-flex; align-items: center; gap: 3px; }
        .cl-status-sent { background: #E4EDD9; color: #4C6A34; }
        .cl-status-trying { background: #F5E6C8; color: #8A6416; }
        .cl-status-deal { background: #E3E8EF; color: #3A4A63; }
        .cl-photo-wrap { position: relative; cursor: zoom-in; background: #00000010; }
        .cl-photo-full { width: 100%; display: block; max-height: 210px; object-fit: contain; background: #1a1a1a08; }
        .cl-enlarge-hint { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.55); color: white; border-radius: 6px; padding: 4px 6px; display: flex; }
        .cl-photo-preview { width: 100%; border-radius: 8px; margin-top: 8px; max-height: 260px; object-fit: cover; }
        .cl-photo-preview-round { max-width: 96px; max-height: 96px; border-radius: 50%; }
        .cl-card-body { padding: 10px 14px 4px; }
        .cl-note { font-size: 13px; margin: 8px 0 0; line-height: 1.4; }
        .cl-deal-price { font-size: 15px; font-weight: 700; color: var(--accent2); margin: 6px 0 0; }
        .cl-deal-link { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--ink); margin-top: 8px; text-decoration: underline; }

        .cl-file-hidden { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; }
        .cl-photo-btn {
          display: inline-flex; align-items: center; gap: 8px; margin-top: 4px; border: 1.5px dashed var(--line);
          border-radius: 8px; padding: 10px 14px; font-size: 13px; color: var(--ink); cursor: pointer; background: var(--bg);
        }
        .cl-photo-btn:hover { border-color: var(--accent2); color: var(--accent2); }

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

        .cl-duration-row { display: flex; gap: 10px; }
        .cl-duration-field { flex: 1; display: flex; align-items: center; gap: 6px; }
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
        .cl-ig-timestamp { font-size: 10px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.03em; margin: 8px 0 0; }
        .cl-ig-utility { display: flex; gap: 8px; padding: 8px 14px 12px; border-top: 1px solid var(--line); }
        .cl-kudo-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: 1px solid var(--line); border-radius: 20px; padding: 5px 12px; font-size: 12px; color: var(--ink-soft); cursor: pointer; }
        .cl-kudo-btn.active { color: var(--accent2); border-color: var(--accent2); }

        .cl-comment-toggle { width: 100%; background: none; border: none; border-top: 1px solid var(--line); padding: 9px 14px; font-size: 12px; color: var(--ink-soft); cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .cl-comments { padding: 0 14px 12px; display: flex; flex-direction: column; gap: 6px; }
        .cl-comment { font-size: 12.5px; line-height: 1.4; }
        .cl-comment-input { display: flex; gap: 6px; margin-top: 4px; }
        .cl-comment-input .cl-input { flex: 1; }

        .cl-participants { display: flex; }
        .cl-participants .cl-avatar, .cl-participants .cl-avatar-img { margin-right: -8px; border: 2px solid var(--surface); }
        .cl-session-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }

        .cl-session-top { display: flex; align-items: flex-start; gap: 12px; padding: 14px; }
        .cl-date-badge {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: var(--ink); color: var(--surface); border-radius: 8px; width: 48px; height: 48px; flex-shrink: 0;
        }
        .cl-date-day { font-family: 'Big Shoulders Display', sans-serif; font-size: 20px; font-weight: 800; line-height: 1; }
        .cl-date-mon { font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
        .cl-session-main { flex: 1; min-width: 0; }
        .cl-session-title-btn { font-weight: 700; font-size: 15px; margin-bottom: 3px; background: none; border: none; padding: 0; text-align: left; cursor: pointer; color: var(--ink); font-family: inherit; }
        .cl-session-host { display: flex; align-items: center; gap: 5px; background: none; border: none; padding: 0; margin-bottom: 4px; font-size: 11px; color: var(--ink-soft); cursor: pointer; font-family: inherit; }
        .cl-session-gym { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 3px; }
        .cl-session-when { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .cl-session-date { font-size: 12px; color: var(--ink-soft); }
        .cl-session-time-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; background: var(--bg); border-radius: 12px; padding: 2px 8px; color: var(--ink); font-weight: 600; }

        .cl-search-wrap { position: relative; }
        .cl-search-wrap svg { position: absolute; left: 10px; top: 11px; color: var(--ink-soft); }
        .cl-resume-list { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; max-height: 260px; overflow-y: auto; }
        .cl-resume-item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); cursor: pointer; text-align: left; font-size: 14px; color: var(--ink); font-family: inherit; }
        .cl-resume-item span { flex: 1; font-weight: 600; }

        .cl-stats-row { display: flex; gap: 6px; margin-top: 14px; border-top: 1px solid var(--line); padding-top: 12px; flex-wrap: wrap; }
        .cl-stat { flex: 1; min-width: 60px; text-align: center; display: flex; flex-direction: column; gap: 2px; }
        .cl-stat b { font-size: 15px; font-family: 'Big Shoulders Display', sans-serif; }
        .cl-stat span { font-size: 9.5px; color: var(--ink-soft); }
        .cl-stat-btn { background: none; border: none; cursor: pointer; font-family: inherit; color: var(--ink); }

        .cl-badges-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 10px; }
        .cl-badge-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 4px; border-radius: 8px; background: var(--bg); color: var(--line); }
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
        .cl-record-info { flex: 1; min-width: 0; }
        .cl-record-title { font-weight: 700; font-size: 13px; }
        .cl-record-sub { font-size: 11px; color: var(--ink-soft); }
        .cl-record-cols { display: flex; gap: 12px; flex-shrink: 0; }
        .cl-record-col { display: flex; flex-direction: column; align-items: center; }
        .cl-record-col-val { font-size: 13px; font-weight: 700; font-family: 'Big Shoulders Display', sans-serif; }
        .cl-record-col-label { font-size: 8.5px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.03em; }
        .cl-record-expanded { border-top: 1px solid var(--line); }
        .cl-record-expanded .cl-card { border: none; border-radius: 0; }
        .cl-record-detail { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
        .cl-record-detail-head { display: flex; align-items: center; gap: 6px; }
        .cl-record-detail-gym { flex: 1; display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--ink-soft); }
        .cl-day-group { display: flex; flex-direction: column; gap: 8px; }
        .cl-day-header { font-size: 12px; font-weight: 700; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.04em; margin: 4px 0 0; }
        .cl-record-summary { display: flex; gap: 0; border: 1px solid var(--line); border-radius: 8px; padding: 8px 0; background: var(--bg); }
        .cl-record-summary div { flex: 1; text-align: center; display: flex; flex-direction: column; gap: 1px; }
        .cl-record-summary b { font-size: 15px; font-family: 'Big Shoulders Display', sans-serif; }
        .cl-record-summary span { font-size: 9px; color: var(--ink-soft); }
        .cl-log-table { display: flex; flex-direction: column; }
        .cl-log-table-head { display: grid; grid-template-columns: 44px 1fr 44px 40px 60px; gap: 6px; padding: 4px 6px; font-size: 9.5px; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.03em; }
        .cl-log-table-row { display: grid; grid-template-columns: 44px 1fr 44px 40px 60px; gap: 6px; align-items: center; padding: 7px 6px; border-top: 1px solid var(--line); font-size: 11.5px; }
        .cl-log-table-row-btn { width: 100%; background: none; border: none; border-top: 1px solid var(--line); cursor: pointer; text-align: left; font-family: inherit; color: var(--ink); }
        .cl-try-breakdown { padding: 4px 6px 10px 6px; display: flex; flex-direction: column; gap: 4px; background: var(--bg); border-radius: 6px; margin: 0 6px 6px; }
        .cl-attempt-line { display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-soft); padding: 2px 6px; }
        .cl-attempt-outcome { font-weight: 600; color: var(--ink); }
        .cl-attempt-note { font-size: 10.5px; color: var(--ink-soft); padding: 0 6px 4px; margin: 0; font-style: italic; }
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
        .cl-overlay-title { font-family: 'Big Shoulders Display', sans-serif; font-weight: 800; font-size: 17px; }
        .cl-overlay-body { flex: 1; overflow-y: auto; padding: 14px; max-width: 620px; margin: 0 auto; width: 100%; }

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
        .cl-bubble.mine { align-self: flex-end; background: var(--ink); color: var(--surface); border: none; }

        .cl-live-tracker { text-align: center; padding: 20px 0; }
        .cl-live-timer { font-family: 'Big Shoulders Display', sans-serif; font-size: 56px; font-weight: 800; line-height: 1; }
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

        .cl-share-preview { width: 100%; max-width: 340px; border-radius: 10px; margin: 10px 0; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }

        .cl-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 200; display: flex; align-items: center; justify-content: center; }
        .cl-lightbox-imgwrap { position: relative; max-width: 94vw; max-height: 88vh; }
        .cl-lightbox-imgwrap img { max-width: 94vw; max-height: 88vh; object-fit: contain; display: block; }
        .cl-lightbox-close { position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.15); border: none; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        .cl-spin { animation: cl-spin 0.8s linear infinite; }
        @keyframes cl-spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
      `), bootstrapping || me && !hasLoadedOnce ? /* @__PURE__ */ React.createElement("div", { className: "cl-onboard" }, /* @__PURE__ */ React.createElement("p", { className: "cl-sub" }, "Loading\u2026")) : !me && guestUsername ? /* @__PURE__ */ React.createElement(GuestProfileView, { username: guestUsername, onGoToLogin: () => {
    setGuestUsername(null);
    try {
      window.history.replaceState({}, "", window.location.pathname);
    } catch {
    }
  } }) : !me || !profiles[me] ? /* @__PURE__ */ React.createElement(Onboarding, { onCreate: createProfile, onResume: resumeProfile, checkingSlug: creating, authedUid: me && !profiles[me] ? me : null }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "cl-header" }, /* @__PURE__ */ React.createElement("div", { className: "cl-wordmark" }, /* @__PURE__ */ React.createElement(Mountain, { size: 20, strokeWidth: 2.4 }), /* @__PURE__ */ React.createElement("h1", null, "Chalkline")), /* @__PURE__ */ React.createElement("div", { className: "cl-header-right" }, /* @__PURE__ */ React.createElement("a", { className: "cl-icon-btn", href: "https://buymeacoffee.com/yourusername", target: "_blank", rel: "noreferrer", title: "Buy me a coffee" }, /* @__PURE__ */ React.createElement(Coffee, { size: 19 })), /* @__PURE__ */ React.createElement("button", { className: "cl-icon-btn", onClick: () => setShowPeopleSearch(true), title: "Find people" }, /* @__PURE__ */ React.createElement(UserSearch, { size: 20 })), /* @__PURE__ */ React.createElement("div", { className: "cl-me-wrap" }, /* @__PURE__ */ React.createElement("button", { className: "cl-me", onClick: () => setMenuOpen((v) => !v) }, /* @__PURE__ */ React.createElement(Avatar, { name: profiles[me].name, photo: profiles[me].photo, size: 30 })), menuOpen && /* @__PURE__ */ React.createElement("div", { className: "cl-me-menu" }, /* @__PURE__ */ React.createElement("button", { onClick: logOut }, /* @__PURE__ */ React.createElement(LogOut, { size: 14 }), " Log out"))))), /* @__PURE__ */ React.createElement("div", { className: "cl-main" }, tab === "home" && /* @__PURE__ */ React.createElement(
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
      onOpenQR: () => setShowMyQR(true),
      onOpenSettings: () => setShowSettings(true),
      onEnlarge: (photo, points) => setLightbox({ photo, points }),
      onOpenNewPost: () => setShowNewPost(true),
      onLiveLog: (entry) => setLiveLogState({ continueEntry: entry }),
      onShare,
      onShareProfile: shareProfileStats,
      onShareBadges: shareBadges,
      onShareToday: shareToday
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
      refresh: refreshAll,
      loading: loadingFeed,
      toggleKudo,
      deleteLog,
      addTry,
      togglePrivacy,
      toggleSave,
      onOpenProfile: openProfile,
      onEnlarge: (photo, points) => setLightbox({ photo, points }),
      onOpenNewPost: () => setShowNewPost(true),
      onLiveLog: (entry) => setLiveLogState({ continueEntry: entry }),
      onShare
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
      refresh: refreshAll,
      loading: loadingFeed,
      onOpenProfile: openProfile
    }
  ), tab === "chat" && /* @__PURE__ */ React.createElement(
    ChatTab,
    {
      me,
      profile: profiles[me],
      profiles,
      threads,
      sendMessage,
      refresh: refreshAll,
      loading: loadingFeed,
      onOpenProfile: openProfile,
      onToggleBlock: toggleBlock,
      openWith: pendingChatWith,
      onConsumeOpenWith: () => setPendingChatWith(null)
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "cl-nav" }, /* @__PURE__ */ React.createElement("div", { className: "cl-nav-inner" }, /* @__PURE__ */ React.createElement("button", { className: tab === "home" ? "active" : "", onClick: () => setTab("home"), title: "Profile & log" }, /* @__PURE__ */ React.createElement(Avatar, { name: profiles[me].name, photo: profiles[me].photo, size: 26 })), /* @__PURE__ */ React.createElement("button", { className: tab === "feed" ? "active" : "", onClick: () => setTab("feed"), title: "Feed" }, /* @__PURE__ */ React.createElement(Globe, { size: 22 })), /* @__PURE__ */ React.createElement("button", { className: "cl-nav-fab", onClick: () => setLiveLogState({ continueEntry: null }), title: "Live Log" }, /* @__PURE__ */ React.createElement(Zap, { size: 22 })), /* @__PURE__ */ React.createElement("button", { className: tab === "sessions" ? "active" : "", onClick: () => setTab("sessions"), title: "Sessions" }, /* @__PURE__ */ React.createElement(CalendarDays, { size: 22 })), /* @__PURE__ */ React.createElement("button", { className: tab === "chat" ? "active" : "", onClick: () => setTab("chat"), title: "Chat" }, /* @__PURE__ */ React.createElement(MessageCircle, { size: 22 })))), viewingProfile && /* @__PURE__ */ React.createElement(
    ProfileView,
    {
      slug: viewingProfile,
      me,
      profiles,
      logs,
      onClose: () => setViewingProfile(null),
      onToggleFollow: toggleFollow,
      onToggleBlock: toggleBlock,
      onMessage: goToChat
    }
  ), showPeopleSearch && /* @__PURE__ */ React.createElement(PeopleSearch, { me, profiles, onClose: () => setShowPeopleSearch(false), onOpenProfile: openProfile }), showMyQR && /* @__PURE__ */ React.createElement(MyQRModal, { me, username: profiles[me] && profiles[me].username, onClose: () => setShowMyQR(false) }), showSettings && /* @__PURE__ */ React.createElement(SettingsOverlay, { profile: profiles[me], onSave: saveProfile, onClose: () => setShowSettings(false) }), showNewPost && /* @__PURE__ */ React.createElement(
    NewPostOverlay,
    {
      defaultGym: profiles[me].mainGym || GYM_OPTIONS[0],
      onClose: () => setShowNewPost(false),
      onSaveLog: createClimbPost,
      onSaveDeal: createDealPost
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
  ), shareData && /* @__PURE__ */ React.createElement(ShareCardModal, { data: shareData, onClose: () => setShareData(null) }), lightbox && /* @__PURE__ */ React.createElement("div", { className: "cl-lightbox", onClick: () => setLightbox(null) }, /* @__PURE__ */ React.createElement("button", { className: "cl-lightbox-close", onClick: () => setLightbox(null) }, /* @__PURE__ */ React.createElement(X, { size: 18 })), /* @__PURE__ */ React.createElement("div", { className: "cl-lightbox-imgwrap", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("img", { src: lightbox.photo, alt: "enlarged" }), normalizePoints(lightbox.points).start.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `ls${i}`, className: "cl-point-marker start", style: { left: `${p.x}%`, top: `${p.y}%` } }, "S")), normalizePoints(lightbox.points).end.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: `le${i}`, className: "cl-point-marker end", style: { left: `${p.x}%`, top: `${p.y}%` } }, "E"))))));
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
