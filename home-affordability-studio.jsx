import React, { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Home, Wallet, PiggyBank, ShieldAlert, Calculator, Clock,
  ChevronDown, AlertTriangle, CheckCircle2, TrendingDown, Banknote,
  Baby, BookOpen, Car, KeyRound, Save,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  palette — teal = the "home" identity; green/amber/coral = health  */
/* ------------------------------------------------------------------ */
const C = {
  ink: "#17262B", inkSoft: "#5C6E70", line: "#DCE3DE",
  paper: "#FFFFFF", ground: "#EAEEEA",
  teal: "#16635A", tealDeep: "#0E4A43", tealSoft: "#E2EDEA",
  emerald: "#3F9D6D", amber: "#D9962E", coral: "#D8553F",
  childcare: "#6B8F9C", groceries: "#8AA67E", transport: "#C2A06B",
  debt: "#B5746A", fun: "#9A7AA0", savings: "#3F9D6D",
};

/* ------------------------------------------------------------------ */
/*  helpers                                                           */
/* ------------------------------------------------------------------ */
const num = (v) => {
  const n = parseFloat(String(v).replace(/,/g, ""));
  return isFinite(n) ? n : 0;
};
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const usd = (n, dp = 0) =>
  !isFinite(n)
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency", currency: "USD",
        maximumFractionDigits: dp, minimumFractionDigits: dp,
      });
const usd0 = (n) => usd(Math.round(n));
const pct = (n, dp = 1) => (isFinite(n) ? `${n.toFixed(dp)}%` : "—");

function monthlyPI(loan, annualRatePct, years) {
  const n = years * 12;
  const r = annualRatePct / 100 / 12;
  if (n <= 0 || loan <= 0) return 0;
  if (r === 0) return loan / n;
  const f = Math.pow(1 + r, n);
  return (loan * (r * f)) / (f - 1);
}

function monthlyLoanPayment(loan, annualRatePct, months) {
  const n = Math.round(months);
  const r = annualRatePct / 100 / 12;
  if (n <= 0 || loan <= 0) return 0;
  if (r === 0) return loan / n;
  const f = Math.pow(1 + r, n);
  return (loan * (r * f)) / (f - 1);
}

function healthOf(rate) {
  if (rate < 0) return { label: "Over budget", tone: "bad", color: C.coral };
  if (rate < 5) return { label: "Very tight", tone: "warn", color: C.amber };
  if (rate < 10) return { label: "Tight", tone: "warn", color: C.amber };
  if (rate < 20) return { label: "Healthy", tone: "ok", color: C.emerald };
  return { label: "Strong", tone: "ok", color: C.emerald };
}

const HEALTHY_FLOOR = 10; // % of income we treat as a healthy savings floor
const STORAGE_KEY = "life-move-studio:v1";

const DEFAULT_APP_STATE = {
  life: {
    earner1: "5200",
    earner2: "3800",
    housingType: "rent",
    rent: "2200",
    committedHomeCost: "0",
    utilities: "350",
    internet: "80",
    streaming: "60",
    cable: "0",
    subscriptions: "75",
    groceries: "850",
    childcare: "1400",
    transport: "650",
    carPayment: "0",
    carInsurance: "165",
    carMaintenance: "90",
    homeMaintenance: "0",
    debt: "450",
    fun: "600",
    savingsBalance: "38000",
    emergencyKeep: "15000",
  },
  home: {
    homePrice: "465000",
    downMode: "pct",
    downPct: "10",
    term: "30",
    rate: "6.75",
    pmiRate: "0.6",
    inspection: "500",
    commissionPct: "0",
    closingPct: "2.5",
    propTaxPct: "1.1",
    insuranceYr: "1800",
    hoa: "0",
  },
  car: {
    price: "28000",
    downPayment: "3000",
    tradeIn: "0",
    rate: "8.5",
    termMonths: "72",
    salesTaxPct: "7",
    fees: "900",
    insurance: "165",
    fuel: "180",
    maintenance: "90",
  },
  rentMove: {
    newRent: "2400",
    deposit: "2400",
    movingCosts: "1200",
    furniture: "1800",
    newUtilities: "375",
    roommateShare: "0",
  },
  child: {
    path: "birth",
    childcare: "1200",
    healthInsurance: "250",
    supplies: "250",
    food: "150",
    clothing: "75",
    collegeSavings: "100",
    medicalOrAdoption: "4500",
    nurseryGear: "2500",
    leaveIncomeLoss: "3000",
  },
  enabledMoves: {
    home: true,
    rent: true,
    car: true,
    child: true,
  },
  stackMoves: {
    home: false,
    rent: false,
    car: false,
    child: false,
  },
  committed: [],
};

const GLOSSARY = {
  mortgage: "A loan used to buy a home. You pay it back monthly, usually over 15 or 30 years.",
  "cash to close": "The total money you need upfront to complete a home purchase, including down payment and closing costs.",
  "down payment": "Money you pay upfront toward the purchase price. A larger down payment usually means a smaller loan.",
  pmi: "Private mortgage insurance. An extra monthly cost usually required when the down payment is under 20%.",
  "property tax": "Taxes paid to the local government based on the value of the home.",
  "closing costs": "Fees paid when finalizing a home purchase, such as lender, title, and transaction fees.",
  "monthly cushion": "Money left after income minus regular monthly costs. This is your breathing room.",
  runway: "How long savings would last if income dropped or stopped.",
  "stress test": "A check that shows what happens if income falls or costs rise.",
  scenario: "A what-if plan. It lets you test a decision without changing your real life snapshot.",
  committed: "A plan you mark as real. It updates your saved life snapshot.",
  "life snapshot": "Your current financial picture: income, savings, housing, bills, debts, and monthly cushion.",
  "upfront cost": "Money needed before or at the start of a decision, like a deposit, down payment, or moving cost.",
  "ongoing cost": "A repeating cost, usually monthly.",
  "emergency fund": "Savings set aside for unexpected problems like job loss, urgent repairs, or medical costs.",
  "car insurance": "Insurance that helps cover damage, liability, or losses related to a vehicle.",
  "car maintenance": "Routine vehicle costs like oil changes, tires, brakes, repairs, and inspections.",
  "trade-in value": "Money a dealer gives you for your current vehicle, usually applied against the next car purchase.",
  "sales tax": "Tax charged on the vehicle purchase. It can add thousands to the amount paid or financed.",
  "amount financed": "The part of the vehicle cost that becomes the loan after down payment, trade-in, taxes, and fees.",
  "loan term": "How long the loan lasts. A longer term lowers the monthly payment but usually increases total interest.",
  "home maintenance": "Money set aside for repairs and upkeep, like appliances, roof work, plumbing, or yard care.",
  internet: "Monthly home internet service.",
  "streaming services": "Monthly video, music, or entertainment subscriptions like Netflix, Hulu, Spotify, or similar services.",
  "cable tv": "Monthly cable or live TV package costs.",
  subscriptions: "Recurring memberships or app charges that renew automatically.",
  childcare: "Care costs like daycare, nanny, babysitter, preschool, or after-school care.",
  "parental leave": "Time away from work after having or adopting a child. It may be paid, partially paid, or unpaid.",
  "medical out-of-pocket": "Health costs you pay yourself, even when you have insurance.",
  adoption: "The legal process of becoming a child's parent. It can include agency, legal, travel, and court costs.",
};

function mergeDefaults(base, saved) {
  if (!saved || typeof saved !== "object") return base;
  return {
    ...base,
    ...saved,
    life: { ...base.life, ...(saved.life || {}) },
    home: { ...base.home, ...(saved.home || {}) },
    car: { ...base.car, ...(saved.car || {}) },
    rentMove: { ...base.rentMove, ...(saved.rentMove || {}) },
    child: { ...base.child, ...(saved.child || {}) },
    enabledMoves: { ...base.enabledMoves, ...(saved.enabledMoves || {}) },
    stackMoves: { ...base.stackMoves, ...(saved.stackMoves || {}) },
    committed: Array.isArray(saved.committed) ? saved.committed : base.committed,
  };
}

function usePersistentState(key, fallback) {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return fallback;
    try {
      return mergeDefaults(fallback, JSON.parse(window.localStorage.getItem(key)));
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

/* ------------------------------------------------------------------ */
/*  small UI atoms                                                    */
/* ------------------------------------------------------------------ */
function Term({ term, children }) {
  const body = GLOSSARY[String(term || children).toLowerCase()];
  if (!body) return children;
  return (
    <span className="haf-term" title={body}>
      {children}
    </span>
  );
}

function Field({ label, hint, prefix, suffix, value, onChange, step, term }) {
  return (
    <label className="haf-field">
      <span className="haf-field-label">
        <Term term={term || label}>{label}</Term>
        {hint && <span className="haf-field-hint">{hint}</span>}
      </span>
      <span className="haf-input">
        {prefix && <span className="haf-affix">{prefix}</span>}
        <input
          type="text" inputMode="decimal" value={value} step={step}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        {suffix && <span className="haf-affix haf-affix-r">{suffix}</span>}
      </span>
    </label>
  );
}

function Group({ icon: Icon, title, open, onToggle, children }) {
  return (
    <section className={`haf-group ${open ? "is-open" : ""}`}>
      <button className="haf-group-head" onClick={onToggle} aria-expanded={open}>
        <span className="haf-group-title">
          <Icon size={16} strokeWidth={2.1} /> {title}
        </span>
        <ChevronDown size={17} className="haf-chev" />
      </button>
      {open && <div className="haf-group-body">{children}</div>}
    </section>
  );
}

function Badge({ tone, children }) {
  const map = {
    ok: { bg: "#E7F2EB", fg: C.emerald },
    warn: { bg: "#FBF1DE", fg: "#A86F12" },
    bad: { bg: "#FBE7E2", fg: C.coral },
    neutral: { bg: C.tealSoft, fg: C.tealDeep },
  };
  const s = map[tone] || map.neutral;
  return (
    <span className="haf-badge" style={{ background: s.bg, color: s.fg }}>
      {children}
    </span>
  );
}

/* income-as-100% living budget bar — the signature element */
function BudgetBar({ caption, segments, income, scaleToSpend }) {
  const denom = scaleToSpend
    ? segments.reduce((a, s) => a + s.value, 0)
    : income;
  return (
    <div className="haf-bbar-row">
      <div className="haf-bbar-cap">{caption}</div>
      <div className="haf-bbar-track">
        {segments.map((s, i) => {
          const w = denom > 0 ? (s.value / denom) * 100 : 0;
          if (w <= 0) return null;
          return (
            <div
              key={i}
              className="haf-bbar-seg"
              style={{ width: `${w}%`, background: s.color }}
              title={`${s.label}: ${usd0(s.value)}`}
            />
          );
        })}
      </div>
    </div>
  );
}

const CurrencyTip = ({ active, payload, label, suffix }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="haf-tip">
      <div className="haf-tip-x">{label}{suffix}</div>
      {payload.map((p, i) => (
        <div key={i} className="haf-tip-row">
          <span style={{ color: p.color }}>{p.name}</span>
          <b>{usd0(p.value)}</b>
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  main                                                              */
/* ------------------------------------------------------------------ */
export default function App() {
  const [saved, setSaved] = usePersistentState(STORAGE_KEY, DEFAULT_APP_STATE);
  const life = saved.life;
  const homePlan = saved.home;
  const carPlan = saved.car;
  const rentMovePlan = saved.rentMove;
  const childPlan = saved.child;
  const enabledMoves = saved.enabledMoves;
  const stackMoves = saved.stackMoves;

  const setLifeField = (key) => (value) =>
    setSaved((s) => ({ ...s, life: { ...s.life, [key]: value } }));
  const setHomeField = (key) => (value) =>
    setSaved((s) => ({ ...s, home: { ...s.home, [key]: value } }));
  const setCarField = (key) => (value) =>
    setSaved((s) => ({ ...s, car: { ...s.car, [key]: value } }));
  const setRentMoveField = (key) => (value) =>
    setSaved((s) => ({ ...s, rentMove: { ...s.rentMove, [key]: value } }));
  const setChildField = (key) => (value) =>
    setSaved((s) => ({ ...s, child: { ...s.child, [key]: value } }));
  const setMoveEnabled = (key) => (checked) =>
    setSaved((s) => ({
      ...s,
      enabledMoves: { ...s.enabledMoves, [key]: checked },
      stackMoves: checked ? s.stackMoves : { ...s.stackMoves, [key]: false },
    }));
  const setStackMove = (key) => (checked) =>
    setSaved((s) => ({
      ...s,
      stackMoves: { ...s.stackMoves, [key]: checked },
    }));

  /* --- mortgage --- */
  const { homePrice, downMode, downPct, term, rate, pmiRate } = homePlan;
  const setHomePrice = setHomeField("homePrice");
  const setDownMode = setHomeField("downMode");
  const setDownPct = setHomeField("downPct");
  const setTerm = setHomeField("term");
  const setRate = setHomeField("rate");
  const setPmiRate = setHomeField("pmiRate");
  /* one-time */
  const { inspection, commissionPct, closingPct } = homePlan;
  const setInspection = setHomeField("inspection");
  const setCommissionPct = setHomeField("commissionPct");
  const setClosingPct = setHomeField("closingPct");
  /* recurring */
  const { propTaxPct, insuranceYr, hoa } = homePlan;
  const {
    utilities, internet, streaming, cable, subscriptions,
    earner1, earner2, rent, groceries, childcare, transport,
    carPayment, carInsurance, carMaintenance, homeMaintenance,
    debt, fun, savingsBalance, emergencyKeep,
  } = life;
  const setPropTaxPct = setHomeField("propTaxPct");
  const setInsuranceYr = setHomeField("insuranceYr");
  const setHoa = setHomeField("hoa");
  const setUtilities = setLifeField("utilities");
  /* --- family --- */
  const setEarner1 = setLifeField("earner1");
  const setEarner2 = setLifeField("earner2");
  const setRent = setLifeField("rent");
  const setGroceries = setLifeField("groceries");
  const setChildcare = setLifeField("childcare");
  const setTransport = setLifeField("transport");
  const setCarPayment = setLifeField("carPayment");
  const setCarInsurance = setLifeField("carInsurance");
  const setCarMaintenance = setLifeField("carMaintenance");
  const setHomeMaintenance = setLifeField("homeMaintenance");
  const setDebt = setLifeField("debt");
  const setFun = setLifeField("fun");
  const setSavingsBalance = setLifeField("savingsBalance");
  const setEmergencyKeep = setLifeField("emergencyKeep");

  /* --- interactive controls --- */
  const [cutSpending, setCutSpending] = useState(0);
  const [module, setModule] = useState("snapshot");
  const [tab, setTab] = useState("after");
  const [stressKind, setStressKind] = useState("income");
  const [stressEarner, setStressEarner] = useState("2");
  const [stressMonths, setStressMonths] = useState(3);
  const [rateInc, setRateInc] = useState(15);
  const [insInc, setInsInc] = useState(0);
  const [revYears, setRevYears] = useState(3);
  const [revDownPct, setRevDownPct] = useState(20);

  const [groups, setGroups] = useState({
    loan: true, upfront: false, recurring: false,
  });
  const toggleGroup = (k) =>
    setGroups((g) => ({ ...g, [k]: !g[k] }));

  useEffect(() => {
    if (module !== "snapshot" && module !== "real" && !enabledMoves[module]) {
      setModule("snapshot");
    }
  }, [module, enabledMoves]);

  /* ---------------------------------------------------------------- */
  /*  the whole model                                                 */
  /* ---------------------------------------------------------------- */
  const m = useMemo(() => {
    const price = num(homePrice);
    const dPct = clamp(num(downPct), 0, 100);
    const dAmt = (price * dPct) / 100;
    const loan = Math.max(0, price - dAmt);

    const pi = monthlyPI(loan, num(rate), num(term));
    const pmiActive = dPct < 20;
    const pmiMo = pmiActive ? (loan * num(pmiRate)) / 100 / 12 : 0;
    const taxMo = (price * num(propTaxPct)) / 100 / 12;
    const insMo = num(insuranceYr) / 12;
    const hoaMo = num(hoa);
    const utilMo = num(utilities);
    const housingMo = pi + pmiMo + taxMo + insMo + hoaMo + utilMo;

    const commissionAmt = (price * num(commissionPct)) / 100;
    const closingAmt = (price * num(closingPct)) / 100;
    const upfront = num(inspection) + commissionAmt + closingAmt;
    const cashToClose = dAmt + upfront;

    const income = num(earner1) + num(earner2);
    const essentials =
      num(internet) + num(streaming) + num(cable) + num(subscriptions) +
      num(groceries) + num(childcare) + num(transport) + num(carPayment) +
      num(carInsurance) + num(carMaintenance) + num(homeMaintenance) + num(debt);
    const nowHousing = num(rent) + utilMo; // utilities both sides -> honest delta

    const savingsNow = income - nowHousing - essentials - num(fun);
    const rateNow = income > 0 ? (savingsNow / income) * 100 : 0;

    const savingsPost = income - housingMo - essentials - num(fun);
    const ratePost = income > 0 ? (savingsPost / income) * 100 : 0;
    const overBudget = savingsPost < 0;

    /* timeline: save until you can close AND keep your cushion */
    const cushion = num(emergencyKeep);
    const target = cashToClose + cushion;
    const have = num(savingsBalance);
    const gap = Math.max(0, target - have);
    const monthlySave = savingsNow + cutSpending;
    const months = monthlySave > 0 ? gap / monthlySave : Infinity;
    const readyNow = gap <= 0;

    return {
      price, dPct, dAmt, loan, pi, pmiActive, pmiMo, taxMo, insMo, hoaMo,
      utilMo, housingMo, commissionAmt, closingAmt, upfront, cashToClose,
      income, essentials, nowHousing, savingsNow, rateNow, savingsPost,
      ratePost, overBudget, cushion, target, have, gap, monthlySave,
      months, readyNow,
    };
  }, [
    homePrice, downPct, term, rate, pmiRate, inspection, commissionPct,
    closingPct, propTaxPct, insuranceYr, hoa, utilities, earner1, earner2,
    rent, groceries, childcare, transport, internet, streaming, cable,
    subscriptions, carPayment, carInsurance, carMaintenance, homeMaintenance,
    debt, fun, savingsBalance, emergencyKeep, cutSpending,
  ]);

  /* timeline chart series */
  const timelineSeries = useMemo(() => {
    const out = [];
    const horizon = m.readyNow
      ? 6
      : isFinite(m.months)
      ? Math.ceil(m.months) + 3
      : 36;
    let bal = m.have;
    for (let i = 0; i <= Math.min(horizon, 120); i++) {
      out.push({ month: i, balance: Math.round(bal), target: Math.round(m.target) });
      bal += m.monthlySave;
    }
    return out;
  }, [m]);

  /* stress model */
  const stress = useMemo(() => {
    const months = 24;
    let monthly = []; // post-buy surplus per month under scenario
    let headline = "";
    if (stressKind === "income") {
      const lost = stressEarner === "1" ? num(earner1) : num(earner2);
      const shock = m.savingsPost - lost;
      const dur = clamp(Math.round(stressMonths), 1, 12);
      for (let i = 0; i < months; i++)
        monthly.push(i < dur ? shock : m.savingsPost);
      headline = `Earner ${stressEarner} (${usd0(lost)}/mo) pauses for ${dur} months`;
    } else {
      const rate2 = num(rate) * (1 + rateInc / 100);
      const pi2 = monthlyPI(m.loan, rate2, num(term));
      const ins2 = m.insMo * (1 + insInc / 100);
      const housing2 = pi2 + m.pmiMo + m.taxMo + ins2 + m.hoaMo + m.utilMo;
      const surplus2 = m.income - housing2 - m.essentials - num(fun);
      for (let i = 0; i < months; i++) monthly.push(surplus2);
      headline = `Rate +${rateInc}% · insurance +${insInc}% → payment ${usd0(housing2)}/mo`;
    }

    // simulate buffer
    let bal = m.cushion;
    const series = [{ month: 0, buffer: Math.round(bal) }];
    let runway = Infinity;
    for (let i = 0; i < months; i++) {
      bal += monthly[i];
      if (bal < 0 && runway === Infinity) runway = i + 1;
      series.push({ month: i + 1, buffer: Math.round(bal) });
    }
    const eventLen =
      stressKind === "income" ? clamp(Math.round(stressMonths), 1, 12) : 0;
    const survivesEvent = stressKind === "income" ? runway > eventLen : runway === Infinity;
    return { series, runway, headline, survivesEvent, eventLen, monthly0: monthly[0] };
  }, [
    stressKind, stressEarner, stressMonths, rateInc, insInc, earner1, earner2,
    rate, term, fun, m,
  ]);

  /* reverse model */
  const reverse = useMemo(() => {
    const months = clamp(revYears, 1, 15) * 12;
    const reqDown = (m.price * revDownPct) / 100;
    const reqCash = reqDown + m.upfront;
    const need = Math.max(0, reqCash - m.have);
    const perMonth = need / months;
    const gapVsNow = perMonth - m.savingsNow;
    return { months, reqDown, reqCash, need, perMonth, gapVsNow };
  }, [revYears, revDownPct, m]);

  /* ---- derived display ---- */
  const ready = m.readyNow
    ? "You're ready now"
    : isFinite(m.months)
    ? `${Math.ceil(m.months)} mo`
    : "Not at this rate";
  const readyDate = (() => {
    if (m.readyNow || !isFinite(m.months)) return null;
    const d = new Date();
    d.setMonth(d.getMonth() + Math.ceil(m.months));
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  })();

  const hNow = healthOf(m.rateNow);
  const hPost = healthOf(m.ratePost);

  const downDollarDisplay = Math.round(m.dAmt).toLocaleString("en-US");

  /* budget-bar segment builders */
  const segNow = [
    { label: "Rent + utilities", value: m.nowHousing, color: C.teal },
    { label: "Internet + media", value: num(internet) + num(streaming) + num(cable) + num(subscriptions), color: C.fun },
    { label: "Childcare", value: num(childcare), color: C.childcare },
    { label: "Groceries", value: num(groceries), color: C.groceries },
    { label: "Transportation", value: num(transport), color: C.transport },
    { label: "Vehicle", value: num(carPayment) + num(carInsurance) + num(carMaintenance), color: C.childcare },
    { label: "Home upkeep", value: num(homeMaintenance), color: C.tealDeep },
    { label: "Debt", value: num(debt), color: C.debt },
    { label: "Fun", value: num(fun), color: C.fun },
    ...(m.savingsNow > 0 ? [{ label: "Savings", value: m.savingsNow, color: C.savings }] : []),
  ];
  const segPost = [
    { label: "Home (all-in)", value: m.housingMo, color: C.teal },
    { label: "Internet + media", value: num(internet) + num(streaming) + num(cable) + num(subscriptions), color: C.fun },
    { label: "Childcare", value: num(childcare), color: C.childcare },
    { label: "Groceries", value: num(groceries), color: C.groceries },
    { label: "Transportation", value: num(transport), color: C.transport },
    { label: "Vehicle", value: num(carPayment) + num(carInsurance) + num(carMaintenance), color: C.childcare },
    { label: "Home upkeep", value: num(homeMaintenance), color: C.tealDeep },
    { label: "Debt", value: num(debt), color: C.debt },
    { label: "Fun", value: num(fun), color: C.fun },
    ...(m.savingsPost > 0 ? [{ label: "Savings", value: m.savingsPost, color: C.savings }] : []),
  ];
  const legend = [
    { label: "Home", color: C.teal }, { label: "Childcare", color: C.childcare },
    { label: "Groceries", color: C.groceries }, { label: "Transport", color: C.transport },
    { label: "Media", color: C.fun },
    { label: "Vehicle", color: C.childcare }, { label: "Upkeep", color: C.tealDeep },
    { label: "Debt", color: C.debt }, { label: "Fun", color: C.fun },
    { label: "Savings", color: C.savings },
  ];

  const cutMax = Math.max(
    300,
    Math.round((num(fun) + num(groceries) * 0.4 + num(transport) * 0.4) / 50) * 50
  );

  const activeHousing = life.housingType === "owned" ? num(life.committedHomeCost) : num(rent);
  const baseMonthlySpend =
    activeHousing + num(utilities) + m.essentials + num(fun);
  const baseMonthlyCushion = m.income - baseMonthlySpend;
  const runwayMonths =
    baseMonthlySpend > 0 ? num(savingsBalance) / baseMonthlySpend : Infinity;
  const carTax = num(carPlan.price) * num(carPlan.salesTaxPct) / 100;
  const carCashDue = num(carPlan.downPayment);
  const carAmountFinanced = Math.max(
    0,
    num(carPlan.price) + carTax + num(carPlan.fees) - num(carPlan.downPayment) - num(carPlan.tradeIn)
  );
  const carLoanPayment = monthlyLoanPayment(carAmountFinanced, num(carPlan.rate), num(carPlan.termMonths));
  const carMonthly =
    carLoanPayment + num(carPlan.insurance) + num(carPlan.fuel) + num(carPlan.maintenance);
  const carSavingsAfter = num(savingsBalance) - carCashDue;
  const carCushionAfter = baseMonthlyCushion - carMonthly;
  const carTone =
    carCushionAfter < 0 || carSavingsAfter < num(emergencyKeep)
      ? "bad"
      : carCushionAfter < 500 || carSavingsAfter < num(emergencyKeep) * 1.25
      ? "warn"
      : "ok";
  const homeMonthlyDelta = m.housingMo - (activeHousing + num(utilities));
  const rentMoveNetRent = Math.max(0, num(rentMovePlan.newRent) - num(rentMovePlan.roommateShare));
  const rentMoveMonthlyDelta = rentMoveNetRent + num(rentMovePlan.newUtilities) - (activeHousing + num(utilities));
  const rentMoveUpfront =
    num(rentMovePlan.deposit) + num(rentMovePlan.movingCosts) + num(rentMovePlan.furniture);
  const childMonthly =
    num(childPlan.childcare) + num(childPlan.healthInsurance) + num(childPlan.supplies) +
    num(childPlan.food) + num(childPlan.clothing) + num(childPlan.collegeSavings);
  const childUpfront =
    num(childPlan.medicalOrAdoption) + num(childPlan.nurseryGear) + num(childPlan.leaveIncomeLoss);
  const lifeReadiness = healthOf(m.income > 0 ? (baseMonthlyCushion / m.income) * 100 : 0);
  const commitHome = () => {
    const committedHome = {
      type: "HOME_PURCHASED",
      label: `${usd0(m.price)} home`,
      date: new Date().toISOString(),
      monthlyImpact: Math.round(m.housingMo),
      cashImpact: -Math.round(m.cashToClose),
    };
    setSaved((s) => ({
      ...s,
      life: {
        ...s.life,
        housingType: "owned",
        committedHomeCost: String(Math.round(m.housingMo)),
        rent: "0",
        savingsBalance: String(Math.max(0, num(s.life.savingsBalance) - m.cashToClose)),
      },
      committed: [committedHome, ...s.committed].slice(0, 8),
    }));
    setModule("snapshot");
  };
  const commitChild = () => {
    const committedChild = {
      type: childPlan.path === "adoption" ? "CHILD_ADOPTED" : "CHILD_BORN",
      label: childPlan.path === "adoption" ? "Adopting a child" : "Having a child",
      date: new Date().toISOString(),
      monthlyImpact: Math.round(childMonthly),
      cashImpact: -Math.round(childUpfront),
    };
    setSaved((s) => ({
      ...s,
      life: {
        ...s.life,
        childcare: String(num(s.life.childcare) + num(s.child.childcare)),
        groceries: String(
          num(s.life.groceries) + num(s.child.supplies) + num(s.child.food) + num(s.child.clothing)
        ),
        savingsBalance: String(Math.max(0, num(s.life.savingsBalance) - childUpfront)),
      },
      committed: [committedChild, ...s.committed].slice(0, 8),
    }));
    setModule("snapshot");
  };

  /* ---------------------------------------------------------------- */
  return (
    <div className="haf">
      <style>{CSS}</style>
      <div className="haf-wrap">
        {/* header */}
        <header className="haf-head">
          <div className="haf-eyebrow">Life move studio</div>
          <h1 className="haf-title">What happens to your life if you do this?</h1>
          <p className="haf-lede">
            Save one life snapshot, test big decisions as scenarios, then commit
            the moves that become real so every other plan sees the new picture.
          </p>
        </header>

        <div className="haf-module-tabs">
          {[
            ["snapshot", "Life snapshot", PiggyBank],
            ["real", "Real life", Wallet],
            ["home", "Buy a home", Home],
            ["rent", "Rent / move", KeyRound],
            ["car", "Buy a car", Car],
            ["child", "Baby / child", Baby],
          ].filter(([k]) => k === "snapshot" || k === "real" || enabledMoves[k]).map(([k, label, Icon]) => (
            <button key={k} className={`haf-module-tab ${module === k ? "on" : ""}`} onClick={() => setModule(k)}>
              <Icon size={16} strokeWidth={2.1} /> {label}
            </button>
          ))}
        </div>

        {/* vitals */}
        {module === "snapshot" && (
          <SnapshotDashboard
            m={m}
            life={life}
            committed={saved.committed}
            activeHousing={activeHousing}
            baseMonthlyCushion={baseMonthlyCushion}
            baseMonthlySpend={baseMonthlySpend}
            carMonthly={carMonthly}
            carTone={carTone}
            carCashDue={carCashDue}
            homeMonthlyDelta={homeMonthlyDelta}
            rentMoveMonthlyDelta={rentMoveMonthlyDelta}
            rentMoveUpfront={rentMoveUpfront}
            childMonthly={childMonthly}
            childUpfront={childUpfront}
            runwayMonths={runwayMonths}
            lifeReadiness={lifeReadiness}
            enabledMoves={enabledMoves}
            stackMoves={stackMoves}
            setMoveEnabled={setMoveEnabled}
            setStackMove={setStackMove}
            setModule={setModule}
          />
        )}

        {module === "real" && (
          <RealLifeModule
            life={life}
            setField={setLifeField}
            m={m}
            activeHousing={activeHousing}
            baseMonthlySpend={baseMonthlySpend}
            baseMonthlyCushion={baseMonthlyCushion}
            runwayMonths={runwayMonths}
            readiness={lifeReadiness}
          />
        )}

        {module === "rent" && (
          <RentMoveModule
            plan={rentMovePlan}
            setField={setRentMoveField}
            activeHousing={activeHousing}
            currentUtilities={num(utilities)}
            monthlyDelta={rentMoveMonthlyDelta}
            upfront={rentMoveUpfront}
            baseMonthlyCushion={baseMonthlyCushion}
          />
        )}

        {module === "car" && (
          <CarModule
            plan={carPlan}
            setField={setCarField}
            monthly={carMonthly}
            loanPayment={carLoanPayment}
            amountFinanced={carAmountFinanced}
            tax={carTax}
            cashDue={carCashDue}
            cushionAfter={carCushionAfter}
            savingsAfter={carSavingsAfter}
            tone={carTone}
            baseMonthlyCushion={baseMonthlyCushion}
            emergencyKeep={num(emergencyKeep)}
            savings={num(savingsBalance)}
          />
        )}

        {module === "child" && (
          <ChildModule
            plan={childPlan}
            setField={setChildField}
            monthly={childMonthly}
            upfront={childUpfront}
            baseMonthlyCushion={baseMonthlyCushion}
            savings={num(savingsBalance)}
            onCommit={commitChild}
          />
        )}

        {module === "home" && (
          <>
        <div className="haf-vitals">
          <Vital
            icon={Home} label="Monthly home cost"
            value={usd0(m.housingMo)} sub="payment, tax, insurance, HOA, utilities"
          />
          <Vital
            icon={Banknote} label="Cash to buy"
            value={usd0(m.cashToClose)} sub={`${usd0(m.dAmt)} down + ${usd0(m.upfront)} upfront`}
          />
          <Vital
            icon={PiggyBank} label="Left to save after buying"
            value={usd0(m.savingsPost)}
            sub={<Badge tone={hPost.tone}>{hPost.label} · {pct(m.ratePost)}</Badge>}
          />
          <Vital
            icon={Clock} label="Until you're ready"
            value={ready}
            sub={readyDate ? `around ${readyDate}` : "to cover down payment + cushion"}
          />
        </div>

        <div className="haf-layout">
          {/* ---------------- inputs ---------------- */}
          <aside className="haf-inputs">
            <Group icon={Home} title="Home & loan" open={groups.loan} onToggle={() => toggleGroup("loan")}>
              <Field label="Home price" prefix="$" value={homePrice} onChange={setHomePrice} />
              <div className="haf-field">
                <span className="haf-field-label">
                  Down payment
                  <span className="haf-seg haf-seg-mini">
                    <button className={downMode === "pct" ? "on" : ""} onClick={() => setDownMode("pct")}>%</button>
                    <button className={downMode === "dollar" ? "on" : ""} onClick={() => setDownMode("dollar")}>$</button>
                  </span>
                </span>
                {downMode === "pct" ? (
                  <span className="haf-input">
                    <input type="text" inputMode="decimal" value={downPct}
                      onChange={(e) => setDownPct(e.target.value)} onFocus={(e) => e.target.select()} />
                    <span className="haf-affix haf-affix-r">%</span>
                  </span>
                ) : (
                  <span className="haf-input">
                    <span className="haf-affix">$</span>
                    <input type="text" inputMode="decimal" value={downDollarDisplay}
                      onChange={(e) => {
                        const d = num(e.target.value);
                        const p = num(homePrice) > 0 ? (d / num(homePrice)) * 100 : 0;
                        setDownPct(String(+p.toFixed(2)));
                      }}
                      onFocus={(e) => e.target.select()} />
                  </span>
                )}
                <span className="haf-field-foot">
                  {usd0(m.dAmt)} · {pct(m.dPct)} of price
                  {m.pmiActive ? (
                    <Badge tone="warn">PMI on · +{usd0(m.pmiMo)}/mo</Badge>
                  ) : (
                    <Badge tone="ok">20%+ · no PMI</Badge>
                  )}
                </span>
              </div>
              <div className="haf-grid2">
                <Field label="Loan term" suffix="yr" value={term} onChange={setTerm} />
                <Field label="Interest rate" suffix="%" value={rate} onChange={setRate} />
              </div>
              <Field label="PMI rate" hint="of loan / yr, while under 20%" suffix="%" value={pmiRate} onChange={setPmiRate} />
            </Group>

            <Group icon={Banknote} title="Upfront costs" open={groups.upfront} onToggle={() => toggleGroup("upfront")}>
              <Field label="Inspection" prefix="$" value={inspection} onChange={setInspection} />
              <Field label="Your agent commission" hint="your share, if any" suffix="%" value={commissionPct} onChange={setCommissionPct} />
              <Field label="Closing costs" hint="of price" suffix="%" value={closingPct} onChange={setClosingPct} />
              <div className="haf-field-foot haf-foot-sum">
                Cash to close: <b>{usd0(m.cashToClose)}</b>
              </div>
            </Group>

            <Group icon={Wallet} title="Monthly home costs" open={groups.recurring} onToggle={() => toggleGroup("recurring")}>
              <Field label="Property tax" hint="of home value / yr" suffix="%" value={propTaxPct} onChange={setPropTaxPct} />
              <div className="haf-field-foot">≈ {usd0(m.taxMo)}/mo</div>
              <Field label="Homeowners insurance" hint="per year" prefix="$" value={insuranceYr} onChange={setInsuranceYr} />
              <div className="haf-grid2">
                <Field label="HOA" hint="/mo" prefix="$" value={hoa} onChange={setHoa} />
                <Field label="Utilities" hint="/mo" prefix="$" value={utilities} onChange={setUtilities} />
              </div>
            </Group>

          </aside>

          {/* ---------------- analysis ---------------- */}
          <main className="haf-main">
            <div className="haf-tabs">
              {[
                ["after", "After you buy", PiggyBank],
                ["timeline", "Timeline", Clock],
                ["stress", "Stress test", ShieldAlert],
                ["reverse", "Reverse plan", Calculator],
              ].map(([k, label, Icon]) => (
                <button key={k} className={`haf-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>
                  <Icon size={15} strokeWidth={2.1} /> {label}
                </button>
              ))}
            </div>

            {/* ===== AFTER YOU BUY ===== */}
            {tab === "after" && (
              <div className="haf-panel">
                <div className="haf-verdict">
                  <div>
                    <div className="haf-verdict-k">After buying, you'd save</div>
                    <div className="haf-verdict-v" style={{ color: hPost.color }}>
                      {usd0(m.savingsPost)}<span>/mo</span>
                    </div>
                    <div className="haf-verdict-sub">
                      {pct(m.ratePost)} of income{" "}
                      <span className="haf-arrow">↓ from {pct(m.rateNow)} today</span>
                    </div>
                  </div>
                  <Badge tone={hPost.tone}>{hPost.label}</Badge>
                </div>

                {m.overBudget && (
                  <Flag tone="bad" icon={AlertTriangle}>
                    This budget goes <b>{usd0(Math.abs(m.savingsPost))}/mo over</b>.
                    The home cost plus current spending is more than your income —
                    something has to give before this works.
                  </Flag>
                )}
                {!m.overBudget && m.ratePost < HEALTHY_FLOOR && (
                  <Flag tone="warn" icon={TrendingDown}>
                    Savings drop below a {HEALTHY_FLOOR}% healthy floor. You'd still
                    be positive, but with little room for surprises.
                  </Flag>
                )}
                {!m.overBudget && m.ratePost >= HEALTHY_FLOOR && (
                  <Flag tone="ok" icon={CheckCircle2}>
                    Savings stay healthy after the purchase. Run the stress test to
                    see how a rough patch would feel.
                  </Flag>
                )}

                <div className="haf-action-row">
                  <button className="haf-primary-action" onClick={commitHome}>
                    <Save size={16} strokeWidth={2.1} /> Add this home to my life
                  </button>
                  <span>
                    This saves the home as real, subtracts {usd0(m.cashToClose)} from savings,
                    and updates your shared snapshot.
                  </span>
                </div>

                <div className="haf-bbar">
                  <BudgetBar caption="Now" income={m.income} segments={segNow} scaleToSpend={m.savingsNow < 0} />
                  <BudgetBar caption="After buying" income={m.income} segments={segPost} scaleToSpend={m.overBudget} />
                  <div className="haf-legend">
                    {legend.map((l) => (
                      <span key={l.label} className="haf-legend-i">
                        <i style={{ background: l.color }} /> {l.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="haf-rebuild">
                  <div className="haf-rebuild-col">
                    <h4>New home cost</h4>
                    <Row k="Principal & interest" v={m.pi} />
                    <Row k="Property tax" v={m.taxMo} />
                    <Row k="Insurance" v={m.insMo} />
                    <Row k="HOA" v={m.hoaMo} />
                    {m.pmiActive && <Row k="PMI" v={m.pmiMo} warn />}
                    <Row k="Utilities" v={m.utilMo} />
                    <Row k="Total" v={m.housingMo} total />
                  </div>
                  <div className="haf-rebuild-col">
                    <h4>What's left each month</h4>
                    <Row k="Household income" v={m.income} />
                    <Row k="− Home (all-in)" v={-m.housingMo} />
                    <Row k="− Childcare" v={-num(childcare)} />
                    <Row k="− Groceries" v={-num(groceries)} />
                    <Row k="− Transportation" v={-num(transport)} />
                    <Row k="− Car payment" v={-num(carPayment)} />
                    <Row k="− Car insurance" v={-num(carInsurance)} />
                    <Row k="− Car maintenance" v={-num(carMaintenance)} />
                    <Row k="− Home maintenance" v={-num(homeMaintenance)} />
                    <Row k="− Debt" v={-num(debt)} />
                    <Row k="− Fun" v={-num(fun)} />
                    <Row k="= For savings" v={m.savingsPost} total tone={hPost.tone} />
                  </div>
                </div>
              </div>
            )}

            {/* ===== TIMELINE ===== */}
            {tab === "timeline" && (
              <div className="haf-panel">
                <div className="haf-verdict">
                  <div>
                    <div className="haf-verdict-k">Time to your target</div>
                    <div className="haf-verdict-v" style={{ color: m.readyNow ? C.emerald : isFinite(m.months) ? C.teal : C.coral }}>
                      {m.readyNow ? "Ready now" : isFinite(m.months) ? `${Math.ceil(m.months)}` : "—"}
                      {!m.readyNow && isFinite(m.months) && <span>months</span>}
                    </div>
                    <div className="haf-verdict-sub">
                      {m.readyNow
                        ? `You already have ${usd0(m.have)} — enough to close and keep your cushion.`
                        : isFinite(m.months)
                        ? `On track for around ${readyDate}.`
                        : "At this savings rate you won't reach it — free up some monthly cash flow below."}
                    </div>
                  </div>
                </div>

                <div className="haf-target-grid">
                  <Mini k="Down payment" v={usd0(m.dAmt)} />
                  <Mini k="Upfront costs" v={usd0(m.upfront)} />
                  <Mini k="Cushion to keep" v={usd0(m.cushion)} />
                  <Mini k="Target" v={usd0(m.target)} accent />
                  <Mini k="Saved so far" v={usd0(m.have)} />
                  <Mini k="Still to go" v={usd0(m.gap)} />
                </div>

                <div className="haf-slider-box">
                  <div className="haf-slider-head">
                    <span>Cut monthly spending by <b>{usd0(cutSpending)}</b></span>
                    <span className="haf-slider-out">
                      saving {usd0(m.monthlySave)}/mo ·{" "}
                      {m.readyNow ? "ready now" : isFinite(m.months) ? `${Math.ceil(m.months)} mo` : "never"}
                    </span>
                  </div>
                  <input
                    type="range" min={0} max={cutMax} step={25}
                    value={cutSpending} onChange={(e) => setCutSpending(num(e.target.value))}
                    aria-label="Cut monthly spending"
                  />
                  <div className="haf-slider-scale">
                    <span>{usd0(0)}</span><span>{usd0(cutMax)}</span>
                  </div>
                </div>

                <div className="haf-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineSeries} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.teal} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={C.teal} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={C.line} vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.inkSoft }} tickLine={false} axisLine={{ stroke: C.line }}
                        tickFormatter={(v) => `${v}m`} />
                      <YAxis tick={{ fontSize: 11, fill: C.inkSoft }} tickLine={false} axisLine={false}
                        width={48} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                      <Tooltip content={<CurrencyTip suffix=" mo" />} />
                      <ReferenceLine y={m.target} stroke={C.amber} strokeDasharray="4 4"
                        label={{ value: "target", fill: C.amber, fontSize: 11, position: "insideTopRight" }} />
                      <Area name="Savings" type="monotone" dataKey="balance" stroke={C.teal} strokeWidth={2.4} fill="url(#gT)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ===== STRESS TEST ===== */}
            {tab === "stress" && (
              <div className="haf-panel">
                <div className="haf-seg haf-seg-wide">
                  <button className={stressKind === "income" ? "on" : ""} onClick={() => setStressKind("income")}>
                    Lose an income
                  </button>
                  <button className={stressKind === "costs" ? "on" : ""} onClick={() => setStressKind("costs")}>
                    Costs rise
                  </button>
                </div>

                {stressKind === "income" ? (
                  <div className="haf-stress-controls">
                    <div className="haf-field">
                      <span className="haf-field-label">Which income pauses?</span>
                      <span className="haf-seg">
                        <button className={stressEarner === "1" ? "on" : ""} onClick={() => setStressEarner("1")}>
                          Earner 1 · {usd0(num(earner1))}
                        </button>
                        <button className={stressEarner === "2" ? "on" : ""} onClick={() => setStressEarner("2")}>
                          Earner 2 · {usd0(num(earner2))}
                        </button>
                      </span>
                    </div>
                    <div className="haf-slider-box">
                      <div className="haf-slider-head">
                        <span>For <b>{stressMonths} months</b></span>
                      </div>
                      <input type="range" min={1} max={12} step={1} value={stressMonths}
                        onChange={(e) => setStressMonths(num(e.target.value))} aria-label="Months without income" />
                      <div className="haf-slider-scale"><span>1 mo</span><span>12 mo</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="haf-stress-controls">
                    <div className="haf-slider-box">
                      <div className="haf-slider-head">
                        <span>Interest rate up <b>{rateInc}%</b></span>
                        <span className="haf-slider-out">{pct(num(rate))} → {pct(num(rate) * (1 + rateInc / 100), 2)}</span>
                      </div>
                      <input type="range" min={0} max={60} step={5} value={rateInc}
                        onChange={(e) => setRateInc(num(e.target.value))} aria-label="Rate increase" />
                      <div className="haf-slider-scale"><span>+0%</span><span>+60%</span></div>
                    </div>
                    <div className="haf-slider-box">
                      <div className="haf-slider-head">
                        <span>Insurance up <b>{insInc}%</b></span>
                      </div>
                      <input type="range" min={0} max={100} step={5} value={insInc}
                        onChange={(e) => setInsInc(num(e.target.value))} aria-label="Insurance increase" />
                      <div className="haf-slider-scale"><span>+0%</span><span>+100%</span></div>
                    </div>
                  </div>
                )}

                <div className="haf-verdict haf-verdict-flush">
                  <div>
                    <div className="haf-verdict-k">Your {usd0(m.cushion)} cushion lasts</div>
                    <div className="haf-verdict-v" style={{ color: stress.survivesEvent ? C.emerald : C.coral }}>
                      {isFinite(stress.runway) ? stress.runway : "24+"}<span>months</span>
                    </div>
                    <div className="haf-verdict-sub">{stress.headline}</div>
                  </div>
                  {stress.survivesEvent ? (
                    <Badge tone="ok">Holds up</Badge>
                  ) : (
                    <Badge tone="bad">Runs dry</Badge>
                  )}
                </div>

                {stressKind === "income" && (
                  stress.survivesEvent ? (
                    <Flag tone="ok" icon={CheckCircle2}>
                      You'd clear the {stress.eventLen}-month gap with about{" "}
                      <b>{isFinite(stress.runway) ? stress.runway - stress.eventLen : "several"}</b> months
                      of cushion to spare — burning ~{usd0(Math.abs(Math.min(0, stress.monthly0)))}/mo while it lasts.
                    </Flag>
                  ) : (
                    <Flag tone="bad" icon={AlertTriangle}>
                      The cushion empties in about <b>{stress.runway}</b> months —{" "}
                      {stress.eventLen - stress.runway} month(s) short of the{" "}
                      {stress.eventLen}-month gap. A bigger cushion or lower payment closes it.
                    </Flag>
                  )
                )}
                {stressKind === "costs" && (
                  stress.survivesEvent ? (
                    <Flag tone="ok" icon={CheckCircle2}>
                      Even with higher costs you stay cash-flow positive, so the
                      cushion isn't drained.
                    </Flag>
                  ) : (
                    <Flag tone="bad" icon={AlertTriangle}>
                      Higher costs flip you to a monthly shortfall — the cushion
                      drains in about <b>{stress.runway}</b> months.
                    </Flag>
                  )
                )}

                <div className="haf-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stress.series} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.coral} stopOpacity={0.26} />
                          <stop offset="100%" stopColor={C.coral} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={C.line} vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.inkSoft }} tickLine={false}
                        axisLine={{ stroke: C.line }} tickFormatter={(v) => `${v}m`} />
                      <YAxis tick={{ fontSize: 11, fill: C.inkSoft }} tickLine={false} axisLine={false}
                        width={48} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                      <Tooltip content={<CurrencyTip suffix=" mo" />} />
                      <ReferenceLine y={0} stroke={C.coral} strokeWidth={1.4} />
                      <Area name="Cushion" type="monotone" dataKey="buffer" stroke={C.coral} strokeWidth={2.4} fill="url(#gS)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ===== REVERSE PLAN ===== */}
            {tab === "reverse" && (
              <div className="haf-panel">
                <p className="haf-rev-lead">
                  Work backward: pick a timeline and a down payment, and see the
                  monthly savings it takes to get there on this {usd0(m.price)} home.
                </p>
                <div className="haf-stress-controls">
                  <div className="haf-slider-box">
                    <div className="haf-slider-head">
                      <span>Buy in <b>{revYears} {revYears === 1 ? "year" : "years"}</b></span>
                    </div>
                    <input type="range" min={1} max={10} step={1} value={revYears}
                      onChange={(e) => setRevYears(num(e.target.value))} aria-label="Years to buy" />
                    <div className="haf-slider-scale"><span>1 yr</span><span>10 yr</span></div>
                  </div>
                  <div className="haf-slider-box">
                    <div className="haf-slider-head">
                      <span>With <b>{revDownPct}% down</b></span>
                      <span className="haf-slider-out">{usd0(reverse.reqDown)}</span>
                    </div>
                    <input type="range" min={3} max={30} step={1} value={revDownPct}
                      onChange={(e) => setRevDownPct(num(e.target.value))} aria-label="Down payment percent" />
                    <div className="haf-slider-scale"><span>3%</span><span>30%</span></div>
                  </div>
                </div>

                <div className="haf-verdict haf-verdict-flush">
                  <div>
                    <div className="haf-verdict-k">You'd need to save</div>
                    <div className="haf-verdict-v" style={{ color: C.teal }}>
                      {usd0(reverse.perMonth)}<span>/mo</span>
                    </div>
                    <div className="haf-verdict-sub">
                      to reach {usd0(reverse.reqCash)} in {revYears} {revYears === 1 ? "year" : "years"}
                      {m.have > 0 ? `, on top of your ${usd0(m.have)} saved` : ""}.
                    </div>
                  </div>
                </div>

                {reverse.gapVsNow <= 0 ? (
                  <Flag tone="ok" icon={CheckCircle2}>
                    You're already saving {usd0(m.savingsNow)}/mo — that's{" "}
                    <b>{usd0(Math.abs(reverse.gapVsNow))}/mo more</b> than you need.
                    You could hit this target sooner or aim for a larger down payment.
                  </Flag>
                ) : (
                  <Flag tone="warn" icon={TrendingDown}>
                    You're saving {usd0(m.savingsNow)}/mo — about{" "}
                    <b>{usd0(reverse.gapVsNow)}/mo short</b>. Free up that much, stretch
                    the timeline, or lower the down payment to close the gap.
                  </Flag>
                )}

                <div className="haf-rev-bars">
                  <RevBar label="Need to save" value={reverse.perMonth} max={Math.max(reverse.perMonth, m.savingsNow)} color={C.teal} />
                  <RevBar label="Saving now" value={Math.max(0, m.savingsNow)} max={Math.max(reverse.perMonth, m.savingsNow)} color={C.emerald} />
                </div>
              </div>
            )}
          </main>
        </div>
          </>
        )}

        <footer className="haf-foot">
          Estimates for planning, not a loan offer. Taxes, insurance, and PMI
          vary by lender and location — confirm real quotes before you commit.
        </footer>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  sub-components                                                    */
/* ------------------------------------------------------------------ */
function RealLifeModule({
  life,
  setField,
  m,
  activeHousing,
  baseMonthlySpend,
  baseMonthlyCushion,
  runwayMonths,
  readiness,
}) {
  const housingLabel = life.housingType === "owned" ? "Mortgage / home cost" : "Rent today";
  return (
    <div className="haf-single">
      <div className="haf-vitals">
        <Vital icon={PiggyBank} label="Monthly cushion" value={usd0(baseMonthlyCushion)} sub={<Badge tone={readiness.tone}>{readiness.label}</Badge>} />
        <Vital icon={Wallet} label="Actual monthly spending" value={usd0(baseMonthlySpend)} sub="housing, bills, debts, lifestyle" />
        <Vital icon={Clock} label="Emergency runway" value={isFinite(runwayMonths) ? `${runwayMonths.toFixed(1)} mo` : "Open"} sub={`${usd0(num(life.savingsBalance))} saved`} />
        <Vital icon={Home} label="Current housing" value={life.housingType === "owned" ? "Owned" : "Renting"} sub={`${usd0(activeHousing)}/mo`} />
      </div>

      <div className="haf-layout">
        <aside className="haf-inputs">
          <section className="haf-group is-open">
            <div className="haf-group-head">
              <span className="haf-group-title"><Wallet size={16} /> Real life / actual expenses</span>
            </div>
            <div className="haf-group-body">
              <div className="haf-field">
                <span className="haf-field-label">Housing status</span>
                <span className="haf-seg haf-seg-wide">
                  <button className={life.housingType === "rent" ? "on" : ""} onClick={() => setField("housingType")("rent")}>
                    Renting
                  </button>
                  <button className={life.housingType === "owned" ? "on" : ""} onClick={() => setField("housingType")("owned")}>
                    Own
                  </button>
                </span>
              </div>
              <div className="haf-grid2">
                <Field label="Income — earner 1" prefix="$" value={life.earner1} onChange={setField("earner1")} />
                <Field label="Income — earner 2" prefix="$" value={life.earner2} onChange={setField("earner2")} />
              </div>
              <div className="haf-field-foot">Household: <b>{usd0(m.income)}/mo</b></div>
              {life.housingType === "owned" ? (
                <Field label={housingLabel} prefix="$" value={life.committedHomeCost} onChange={setField("committedHomeCost")} />
              ) : (
                <Field label={housingLabel} prefix="$" value={life.rent} onChange={setField("rent")} />
              )}
              <Field label="Utilities" hint="/mo" prefix="$" value={life.utilities} onChange={setField("utilities")} />
              <div className="haf-grid2">
                <Field label="Internet" term="internet" prefix="$" value={life.internet} onChange={setField("internet")} />
                <Field label="Streaming services" term="streaming services" prefix="$" value={life.streaming} onChange={setField("streaming")} />
                <Field label="Cable TV" term="cable tv" prefix="$" value={life.cable} onChange={setField("cable")} />
                <Field label="Other subscriptions" term="subscriptions" prefix="$" value={life.subscriptions} onChange={setField("subscriptions")} />
                <Field label="Groceries" prefix="$" value={life.groceries} onChange={setField("groceries")} />
                <Field label="Childcare" prefix="$" value={life.childcare} onChange={setField("childcare")} />
                <Field label="Transportation" hint="gas, transit, parking" prefix="$" value={life.transport} onChange={setField("transport")} />
                <Field label="Car payment" prefix="$" value={life.carPayment} onChange={setField("carPayment")} />
                <Field label="Car insurance" term="car insurance" prefix="$" value={life.carInsurance} onChange={setField("carInsurance")} />
                <Field label="Car maintenance" term="car maintenance" prefix="$" value={life.carMaintenance} onChange={setField("carMaintenance")} />
                <Field label="Home maintenance" term="home maintenance" prefix="$" value={life.homeMaintenance} onChange={setField("homeMaintenance")} />
                <Field label="Debt payments" prefix="$" value={life.debt} onChange={setField("debt")} />
              </div>
              <Field label="Fun / discretionary" prefix="$" value={life.fun} onChange={setField("fun")} />
              <div className="haf-grid2">
                <Field label="Savings balance" prefix="$" value={life.savingsBalance} onChange={setField("savingsBalance")} />
                <Field label="Cushion to keep" hint="emergency floor" prefix="$" value={life.emergencyKeep} onChange={setField("emergencyKeep")} />
              </div>
            </div>
          </section>
        </aside>

        <main className="haf-main">
          <section className="haf-panel">
            <div className="haf-panel-head">
              <div>
                <h3>Actual monthly picture</h3>
                <p>This is the saved baseline every life move uses. Change it here first, then test scenarios.</p>
              </div>
              <Badge tone="neutral">Auto-saved</Badge>
            </div>
            <div className="haf-rebuild">
              <div className="haf-rebuild-col">
                <h4>Money in</h4>
                <Row k="Earner 1" v={num(life.earner1)} />
                <Row k="Earner 2" v={num(life.earner2)} />
                <Row k="Household income" v={m.income} total />
              </div>
              <div className="haf-rebuild-col">
                <h4>Money out</h4>
                <Row k="Housing" v={activeHousing} />
                <Row k="Utilities" v={num(life.utilities)} />
                <Row k="Internet" v={num(life.internet)} />
                <Row k="Streaming services" v={num(life.streaming)} />
                <Row k="Cable TV" v={num(life.cable)} />
                <Row k="Other subscriptions" v={num(life.subscriptions)} />
                <Row k="Groceries" v={num(life.groceries)} />
                <Row k="Childcare" v={num(life.childcare)} />
                <Row k="Transportation" v={num(life.transport)} />
                <Row k="Car payment" v={num(life.carPayment)} />
                <Row k="Car insurance" v={num(life.carInsurance)} />
                <Row k="Car maintenance" v={num(life.carMaintenance)} />
                <Row k="Home maintenance" v={num(life.homeMaintenance)} />
                <Row k="Debt" v={num(life.debt)} />
                <Row k="Fun" v={num(life.fun)} />
                <Row k="Monthly cushion" v={baseMonthlyCushion} total tone={readiness.tone} />
              </div>
            </div>
            <Flag tone={readiness.tone} icon={baseMonthlyCushion < 0 ? AlertTriangle : CheckCircle2}>
              This is your actual baseline. Life moves should be judged against this, not against numbers hidden inside one scenario.
            </Flag>
          </section>
        </main>
      </div>
    </div>
  );
}

function SnapshotDashboard({
  m,
  life,
  committed,
  activeHousing,
  baseMonthlyCushion,
  baseMonthlySpend,
  carMonthly,
  carTone,
  carCashDue,
  homeMonthlyDelta,
  rentMoveMonthlyDelta,
  rentMoveUpfront,
  childMonthly,
  childUpfront,
  runwayMonths,
  lifeReadiness,
  enabledMoves,
  stackMoves,
  setMoveEnabled,
  setStackMove,
  setModule,
}) {
  const moveOptions = [
    { key: "home", label: "Buy a home", icon: Home },
    { key: "rent", label: "Rent / move", icon: KeyRound },
    { key: "car", label: "Buy a car", icon: Car },
    { key: "child", label: "Baby / child", icon: Baby },
  ];
  const stackOptions = [
    { key: "home", label: "Buy a home", monthly: homeMonthlyDelta, upfront: m.cashToClose, icon: Home },
    { key: "rent", label: "Rent / move", monthly: rentMoveMonthlyDelta, upfront: rentMoveUpfront, icon: KeyRound },
    { key: "car", label: "Buy a car", monthly: carMonthly, upfront: carCashDue, icon: Car },
    { key: "child", label: "Baby / child", monthly: childMonthly, upfront: childUpfront, icon: Baby },
  ].filter((move) => enabledMoves[move.key]);
  const selectedStack = stackOptions.filter((move) => stackMoves[move.key]);
  const stackMonthly = selectedStack.reduce((sum, move) => sum + move.monthly, 0);
  const stackUpfront = selectedStack.reduce((sum, move) => sum + move.upfront, 0);
  const stackCushionAfter = baseMonthlyCushion - stackMonthly;
  const stackSavingsAfter = num(life.savingsBalance) - stackUpfront;
  const stackEmergencyKeep = num(life.emergencyKeep);
  const stackTone =
    !selectedStack.length
      ? "neutral"
      : stackCushionAfter < 0 || stackSavingsAfter < stackEmergencyKeep
      ? "bad"
      : stackCushionAfter < 500 || stackSavingsAfter < stackEmergencyKeep * 1.25
      ? "warn"
      : "ok";
  const stackLabel =
    !selectedStack.length
      ? "Pick moves"
      : stackTone === "ok"
      ? "Fits together"
      : stackTone === "warn"
      ? "Tight together"
      : "Too much together";
  const housingConflict = stackMoves.home && stackMoves.rent && enabledMoves.home && enabledMoves.rent;
  return (
    <div className="haf-dash">
      <div className="haf-vitals">
        <Vital icon={PiggyBank} label="Monthly cushion" value={usd0(baseMonthlyCushion)} sub={<Badge tone={lifeReadiness.tone}>{lifeReadiness.label}</Badge>} />
        <Vital icon={Wallet} label="Current commitments" value={usd0(baseMonthlySpend)} sub={`${usd0(activeHousing)} housing + bills`} />
        <Vital icon={Clock} label="Emergency runway" value={isFinite(runwayMonths) ? `${runwayMonths.toFixed(1)} mo` : "Open"} sub={`${usd0(num(life.savingsBalance))} saved`} />
        <Vital icon={Home} label="Housing status" value={life.housingType === "owned" ? "Owned" : "Renting"} sub={life.housingType === "owned" ? `${usd0(activeHousing)}/mo committed` : `${usd0(activeHousing)}/mo rent`} />
      </div>

      <div className="haf-dashboard-grid">
        <section className="haf-panel">
          <div className="haf-panel-head">
            <div>
              <h3>Choose life moves to check</h3>
              <p>Turn on only the scenarios you care about right now. Your choices are saved.</p>
            </div>
          </div>
          <div className="haf-check-grid">
            {moveOptions.map(({ key, label, icon: Icon }) => (
              <label key={key} className={`haf-check-card ${enabledMoves[key] ? "is-on" : ""}`}>
                <input
                  type="checkbox"
                  checked={!!enabledMoves[key]}
                  onChange={(e) => setMoveEnabled(key)(e.target.checked)}
                />
                <Icon size={17} strokeWidth={2.1} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="haf-panel">
          <div className="haf-panel-head">
            <div>
              <h3>Stack moves together</h3>
              <p>Mix scenarios to see whether a few big choices can fit at the same time.</p>
            </div>
            <Badge tone={stackTone}>{stackLabel}</Badge>
          </div>
          <div className="haf-check-grid">
            {stackOptions.map(({ key, label, icon: Icon }) => (
              <label key={key} className={`haf-check-card ${stackMoves[key] ? "is-on" : ""}`}>
                <input
                  type="checkbox"
                  checked={!!stackMoves[key]}
                  onChange={(e) => setStackMove(key)(e.target.checked)}
                />
                <Icon size={17} strokeWidth={2.1} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="haf-target-grid">
            <Mini k="Monthly impact" v={`${stackMonthly >= 0 ? "+" : ""}${usd0(stackMonthly)}/mo`} accent />
            <Mini k="Upfront cash" v={usd0(stackUpfront)} />
            <Mini k="Cushion after" v={usd0(stackCushionAfter)} />
            <Mini k="Savings after" v={usd0(stackSavingsAfter)} />
            <Mini k="Emergency floor" v={usd0(stackEmergencyKeep)} />
            <Mini k="Moves selected" v={`${selectedStack.length}`} />
          </div>
          {selectedStack.length ? (
            <div className="haf-rebuild">
              <div className="haf-rebuild-col">
                <h4>Monthly stack</h4>
                {selectedStack.map((move) => (
                  <Row key={move.key} k={move.label} v={move.monthly} />
                ))}
                <Row k="Total monthly impact" v={stackMonthly} total tone={stackTone} />
              </div>
              <div className="haf-rebuild-col">
                <h4>Cash stack</h4>
                {selectedStack.map((move) => (
                  <Row key={move.key} k={move.label} v={move.upfront} />
                ))}
                <Row k="Total upfront cash" v={stackUpfront} total tone={stackTone} />
              </div>
            </div>
          ) : (
            <Flag tone="warn" icon={AlertTriangle}>
              Choose two or more moves above when you want to test real-life temptation stacking.
            </Flag>
          )}
          {selectedStack.length > 0 && (
            <Flag tone={housingConflict || stackTone === "bad" ? "bad" : stackTone === "warn" ? "warn" : "ok"} icon={housingConflict || stackTone === "bad" ? AlertTriangle : CheckCircle2}>
              {housingConflict
                ? "Buying a home and renting/moving are usually alternate housing paths, so compare them separately unless you truly expect both."
                : stackTone === "bad"
                ? "This combination breaks either monthly cushion or emergency savings. It needs a smaller move, more cash, or more income."
                : stackTone === "warn"
                ? "This combination can work, but it leaves little room for surprises."
                : "This combination keeps monthly cushion and emergency savings intact."}
            </Flag>
          )}
        </section>

        <section className="haf-panel">
          <div className="haf-panel-head">
            <div>
              <h3>Your life snapshot</h3>
              <p><Term term="life snapshot">Life snapshot</Term> is the saved baseline every plan reads from.</p>
            </div>
            <Badge tone="neutral">Auto-saved</Badge>
          </div>
          <div className="haf-rebuild">
            <div className="haf-rebuild-col">
              <h4>Monthly money in</h4>
              <Row k="Earner 1" v={num(life.earner1)} />
              <Row k="Earner 2" v={num(life.earner2)} />
              <Row k="Household income" v={m.income} total />
            </div>
            <div className="haf-rebuild-col">
              <h4>Monthly money out</h4>
              <Row k="Housing" v={activeHousing} />
              <Row k="Utilities" v={num(life.utilities)} />
              <Row k="Internet" v={num(life.internet)} />
              <Row k="Streaming services" v={num(life.streaming)} />
              <Row k="Cable TV" v={num(life.cable)} />
              <Row k="Other subscriptions" v={num(life.subscriptions)} />
              <Row k="Groceries" v={num(life.groceries)} />
              <Row k="Childcare" v={num(life.childcare)} />
              <Row k="Transportation" v={num(life.transport)} />
              <Row k="Car payment" v={num(life.carPayment)} />
              <Row k="Car insurance" v={num(life.carInsurance)} />
              <Row k="Car maintenance" v={num(life.carMaintenance)} />
              <Row k="Home maintenance" v={num(life.homeMaintenance)} />
              <Row k="Debt" v={num(life.debt)} />
              <Row k="Fun" v={num(life.fun)} />
              <Row k="Monthly cushion" v={baseMonthlyCushion} total tone={lifeReadiness.tone} />
            </div>
          </div>
        </section>

        <section className="haf-panel">
          <div className="haf-panel-head">
            <div>
              <h3>Connected plans</h3>
              <p>These scenarios use your saved snapshot, so one real move changes the next one.</p>
            </div>
          </div>
          <div className="haf-plan-stack">
            {enabledMoves.home && <PlanCard icon={Home} title="Buy a home" value={m.readyNow ? "Ready now" : isFinite(m.months) ? `${Math.ceil(m.months)} mo` : "Not yet"} sub={`${usd0(m.housingMo)}/mo after purchase`} tone={m.readyNow ? "ok" : "warn"} onOpen={() => setModule("home")} />}
            {enabledMoves.rent && <PlanCard icon={KeyRound} title="Rent / move" value={`${rentMoveMonthlyDelta >= 0 ? "+" : ""}${usd0(rentMoveMonthlyDelta)}/mo`} sub={`${usd0(rentMoveUpfront)} upfront`} tone={rentMoveMonthlyDelta <= baseMonthlyCushion ? "ok" : "warn"} onOpen={() => setModule("rent")} />}
            {enabledMoves.car && <PlanCard icon={Car} title="Buy a car" value={`${usd0(carMonthly)}/mo`} sub={`Leaves ${usd0(baseMonthlyCushion - carMonthly)}/mo cushion`} tone={carTone} onOpen={() => setModule("car")} />}
            {enabledMoves.child && <PlanCard icon={Baby} title="Baby / child" value={`${usd0(childMonthly)}/mo`} sub={`${usd0(childUpfront)} upfront or leave impact`} tone={baseMonthlyCushion - childMonthly >= 0 ? "ok" : "bad"} onOpen={() => setModule("child")} />}
            {!Object.values(enabledMoves).some(Boolean) && (
              <Flag tone="warn" icon={AlertTriangle}>
                Pick at least one life move above to show connected plan cards.
              </Flag>
            )}
          </div>
        </section>

        <section className="haf-panel">
          <div className="haf-panel-head">
            <div>
              <h3>Committed moves</h3>
              <p><Term term="committed">Committed</Term> moves are real changes already applied to your snapshot.</p>
            </div>
          </div>
          {committed.length ? (
            <div className="haf-event-list">
              {committed.map((event) => (
                <div key={`${event.type}-${event.date}`} className="haf-event">
                  <b>{event.label}</b>
                  <span>{usd0(event.monthlyImpact)}/mo · {usd0(event.cashImpact)} cash</span>
                </div>
              ))}
            </div>
          ) : (
            <Flag tone="warn" icon={AlertTriangle}>
              No committed moves yet. Use a module as a <b>scenario</b>, then add it to your life when it becomes real.
            </Flag>
          )}
        </section>

        <GlossaryPanel />
      </div>
    </div>
  );
}

function RentMoveModule({ plan, setField, activeHousing, currentUtilities, monthlyDelta, upfront, baseMonthlyCushion }) {
  const netRent = Math.max(0, num(plan.newRent) - num(plan.roommateShare));
  const newMonthly = netRent + num(plan.newUtilities);
  const cushionAfter = baseMonthlyCushion - monthlyDelta;
  const tone = cushionAfter < 0 ? "bad" : cushionAfter < 500 ? "warn" : "ok";
  return (
    <div className="haf-single">
      <div className="haf-layout">
        <aside className="haf-inputs">
          <section className="haf-group is-open">
            <div className="haf-group-head"><span className="haf-group-title"><KeyRound size={16} /> Rent / move scenario</span></div>
            <div className="haf-group-body">
              <Field label="New rent" prefix="$" value={plan.newRent} onChange={setField("newRent")} />
              <Field label="Roommate share" hint="/mo" prefix="$" value={plan.roommateShare} onChange={setField("roommateShare")} />
              <Field label="New utilities" prefix="$" value={plan.newUtilities} onChange={setField("newUtilities")} />
              <Field label="Security deposit" term="upfront cost" prefix="$" value={plan.deposit} onChange={setField("deposit")} />
              <Field label="Moving costs" term="upfront cost" prefix="$" value={plan.movingCosts} onChange={setField("movingCosts")} />
              <Field label="Furniture / setup" term="upfront cost" prefix="$" value={plan.furniture} onChange={setField("furniture")} />
            </div>
          </section>
        </aside>
        <main className="haf-main">
          <section className="haf-panel">
            <div className="haf-verdict">
              <div>
                <div className="haf-verdict-k">This move changes monthly life by</div>
                <div className="haf-verdict-v" style={{ color: tone === "bad" ? C.coral : tone === "warn" ? C.amber : C.emerald }}>
                  {monthlyDelta >= 0 ? "+" : ""}{usd0(monthlyDelta)}<span>/mo</span>
                </div>
                <div className="haf-verdict-sub">Leaves {usd0(cushionAfter)}/mo after your current life snapshot.</div>
              </div>
              <Badge tone={tone}>{tone === "ok" ? "Fits" : tone === "warn" ? "Tight" : "Risky"}</Badge>
            </div>
            <div className="haf-target-grid">
              <Mini k="Current housing + utilities" v={usd0(activeHousing + currentUtilities)} />
              <Mini k="New rent after split" v={usd0(netRent)} />
              <Mini k="New utilities" v={usd0(num(plan.newUtilities))} />
              <Mini k="New monthly housing" v={usd0(newMonthly)} accent />
              <Mini k="Upfront cost" v={usd0(upfront)} />
              <Mini k="Cushion after move" v={usd0(cushionAfter)} />
            </div>
            <Flag tone={tone} icon={tone === "bad" ? AlertTriangle : CheckCircle2}>
              A move should leave enough <b>monthly cushion</b> for surprises after rent, bills, and normal life.
            </Flag>
          </section>
        </main>
      </div>
    </div>
  );
}

function CarModule({
  plan,
  setField,
  monthly,
  loanPayment,
  amountFinanced,
  tax,
  cashDue,
  cushionAfter,
  savingsAfter,
  tone,
  baseMonthlyCushion,
  emergencyKeep,
  savings,
}) {
  const termMonths = Math.max(0, Math.round(num(plan.termMonths)));
  const totalInterest = Math.max(0, loanPayment * termMonths - amountFinanced);
  const cashGap = Math.max(0, emergencyKeep - savingsAfter);
  const label =
    tone === "bad"
      ? savingsAfter < emergencyKeep
        ? "Not ready"
        : "Risky"
      : tone === "warn"
      ? "Tight"
      : "Fits";
  const flag =
    cushionAfter < 0
      ? {
          tone: "bad",
          icon: AlertTriangle,
          body: <>This car creates a monthly shortfall. The payment and car costs are more than your current <b>monthly cushion</b>.</>,
        }
      : savingsAfter < emergencyKeep
      ? {
          tone: "bad",
          icon: AlertTriangle,
          body: <>The monthly payment works, but the down payment leaves savings <b>{usd0(cashGap)} below</b> your emergency cushion.</>,
        }
      : tone === "warn"
      ? {
          tone: "warn",
          icon: TrendingDown,
          body: <>This can work, but it leaves a thin buffer. A lower price, bigger down payment, or shorter term may make it sturdier.</>,
        }
      : {
          tone: "ok",
          icon: CheckCircle2,
          body: <>This keeps your monthly cushion positive and leaves savings above your emergency floor.</>,
        };
  return (
    <div className="haf-single">
      <div className="haf-layout">
        <aside className="haf-inputs">
          <section className="haf-group is-open">
            <div className="haf-group-head"><span className="haf-group-title"><Car size={16} /> Car scenario</span></div>
            <div className="haf-group-body">
              <Field label="Car price" prefix="$" value={plan.price} onChange={setField("price")} />
              <div className="haf-grid2">
                <Field label="Down payment" term="down payment" prefix="$" value={plan.downPayment} onChange={setField("downPayment")} />
                <Field label="Trade-in value" term="trade-in value" prefix="$" value={plan.tradeIn} onChange={setField("tradeIn")} />
                <Field label="Interest rate" suffix="%" value={plan.rate} onChange={setField("rate")} />
                <Field label="Loan term" term="loan term" suffix="mo" value={plan.termMonths} onChange={setField("termMonths")} />
                <Field label="Sales tax" term="sales tax" suffix="%" value={plan.salesTaxPct} onChange={setField("salesTaxPct")} />
                <Field label="Title / dealer fees" term="upfront cost" prefix="$" value={plan.fees} onChange={setField("fees")} />
              </div>
              <Field label="Insurance" prefix="$" value={plan.insurance} onChange={setField("insurance")} />
              <Field label="Gas / charging" prefix="$" value={plan.fuel} onChange={setField("fuel")} />
              <Field label="Maintenance" prefix="$" value={plan.maintenance} onChange={setField("maintenance")} />
              <div className="haf-field-foot haf-foot-sum">
                Estimated loan payment: <b>{usd0(loanPayment)}/mo</b>
              </div>
            </div>
          </section>
        </aside>
        <main className="haf-main">
          <section className="haf-panel">
            <div className="haf-verdict">
              <div>
                <div className="haf-verdict-k">This car adds</div>
                <div className="haf-verdict-v" style={{ color: tone === "bad" ? C.coral : tone === "warn" ? C.amber : C.emerald }}>
                  {usd0(monthly)}<span>/mo</span>
                </div>
                <div className="haf-verdict-sub">
                  Leaves {usd0(cushionAfter)}/mo monthly cushion and {usd0(savingsAfter)} saved after down payment.
                </div>
              </div>
              <Badge tone={tone}>{label}</Badge>
            </div>
            <div className="haf-target-grid">
              <Mini k="Amount financed" v={usd0(amountFinanced)} accent />
              <Mini k="Cash due today" v={usd0(cashDue)} />
              <Mini k="Savings after" v={usd0(savingsAfter)} />
              <Mini k="Emergency floor" v={usd0(emergencyKeep)} />
              <Mini k="Loan interest" v={usd0(totalInterest)} />
              <Mini k="Current savings" v={usd0(savings)} />
            </div>
            <div className="haf-rebuild">
              <div className="haf-rebuild-col">
                <h4>Car cost</h4>
                <Row k="Loan payment" v={loanPayment} />
                <Row k="Insurance" v={num(plan.insurance)} />
                <Row k="Gas / charging" v={num(plan.fuel)} />
                <Row k="Maintenance" v={num(plan.maintenance)} />
                <Row k="Total" v={monthly} total />
              </div>
              <div className="haf-rebuild-col">
                <h4>Loan build</h4>
                <Row k="Car price" v={num(plan.price)} />
                <Row k="Sales tax" v={tax} />
                <Row k="Title / dealer fees" v={num(plan.fees)} />
                <Row k="Down payment" v={-num(plan.downPayment)} />
                <Row k="Trade-in value" v={-num(plan.tradeIn)} />
                <Row k="Amount financed" v={amountFinanced} total />
              </div>
              <div className="haf-rebuild-col">
                <h4>Cash flow impact</h4>
                <Row k="Current cushion" v={baseMonthlyCushion} />
                <Row k="Car monthly cost" v={-monthly} />
                <Row k="Cushion after car" v={cushionAfter} total tone={tone} />
              </div>
              <div className="haf-rebuild-col">
                <h4>Savings impact</h4>
                <Row k="Savings today" v={savings} />
                <Row k="Down payment" v={-num(plan.downPayment)} />
                <Row k="Savings after car" v={savingsAfter} />
                <Row k="Emergency cushion to keep" v={emergencyKeep} />
                <Row k={cashGap > 0 ? "Below cushion by" : "Above cushion by"} v={cashGap > 0 ? cashGap : savingsAfter - emergencyKeep} total tone={cashGap > 0 ? "bad" : tone} />
              </div>
            </div>
            <Flag tone={flag.tone} icon={flag.icon}>
              {flag.body}
            </Flag>
          </section>
        </main>
      </div>
    </div>
  );
}

function ChildModule({ plan, setField, monthly, upfront, baseMonthlyCushion, savings, onCommit }) {
  const cushionAfter = baseMonthlyCushion - monthly;
  const savingsAfter = savings - upfront;
  const tone = cushionAfter < 0 || savingsAfter < 0 ? "bad" : cushionAfter < 500 ? "warn" : "ok";
  const label = plan.path === "adoption" ? "Adopting a child" : "Having a baby";
  return (
    <div className="haf-single">
      <div className="haf-layout">
        <aside className="haf-inputs">
          <section className="haf-group is-open">
            <div className="haf-group-head"><span className="haf-group-title"><Baby size={16} /> Baby / child scenario</span></div>
            <div className="haf-group-body">
              <div className="haf-field">
                <span className="haf-field-label">Path</span>
                <span className="haf-seg haf-seg-wide">
                  <button className={plan.path === "birth" ? "on" : ""} onClick={() => setField("path")("birth")}>
                    Birth
                  </button>
                  <button className={plan.path === "adoption" ? "on" : ""} onClick={() => setField("path")("adoption")}>
                    Adoption
                  </button>
                </span>
              </div>
              <Field label="Childcare" term="childcare" prefix="$" value={plan.childcare} onChange={setField("childcare")} />
              <Field label="Health insurance" prefix="$" value={plan.healthInsurance} onChange={setField("healthInsurance")} />
              <Field label="Diapers / supplies" prefix="$" value={plan.supplies} onChange={setField("supplies")} />
              <Field label="Food / formula" prefix="$" value={plan.food} onChange={setField("food")} />
              <Field label="Clothing / extras" prefix="$" value={plan.clothing} onChange={setField("clothing")} />
              <Field label="College savings" prefix="$" value={plan.collegeSavings} onChange={setField("collegeSavings")} />
              <Field
                label={plan.path === "adoption" ? "Adoption costs" : "Medical out-of-pocket"}
                term={plan.path === "adoption" ? "adoption" : "medical out-of-pocket"}
                prefix="$"
                value={plan.medicalOrAdoption}
                onChange={setField("medicalOrAdoption")}
              />
              <Field label="Nursery / gear" term="upfront cost" prefix="$" value={plan.nurseryGear} onChange={setField("nurseryGear")} />
              <Field label="Leave income gap" term="parental leave" prefix="$" value={plan.leaveIncomeLoss} onChange={setField("leaveIncomeLoss")} />
            </div>
          </section>
        </aside>
        <main className="haf-main">
          <section className="haf-panel">
            <div className="haf-verdict">
              <div>
                <div className="haf-verdict-k">{label} adds about</div>
                <div className="haf-verdict-v" style={{ color: tone === "bad" ? C.coral : tone === "warn" ? C.amber : C.emerald }}>
                  {usd0(monthly)}<span>/mo</span>
                </div>
                <div className="haf-verdict-sub">
                  Leaves {usd0(cushionAfter)}/mo monthly cushion and {usd0(savingsAfter)} saved after upfront costs.
                </div>
              </div>
              <Badge tone={tone}>{tone === "ok" ? "Fits" : tone === "warn" ? "Tight" : "Risky"}</Badge>
            </div>
            <div className="haf-rebuild">
              <div className="haf-rebuild-col">
                <h4>Monthly child costs</h4>
                <Row k="Childcare" v={num(plan.childcare)} />
                <Row k="Health insurance" v={num(plan.healthInsurance)} />
                <Row k="Supplies" v={num(plan.supplies)} />
                <Row k="Food / formula" v={num(plan.food)} />
                <Row k="Clothing / extras" v={num(plan.clothing)} />
                <Row k="College savings" v={num(plan.collegeSavings)} />
                <Row k="Total" v={monthly} total />
              </div>
              <div className="haf-rebuild-col">
                <h4>One-time / early costs</h4>
                <Row k={plan.path === "adoption" ? "Adoption costs" : "Medical out-of-pocket"} v={num(plan.medicalOrAdoption)} />
                <Row k="Nursery / gear" v={num(plan.nurseryGear)} />
                <Row k="Leave income gap" v={num(plan.leaveIncomeLoss)} />
                <Row k="Upfront total" v={upfront} total />
              </div>
            </div>
            <div className="haf-action-row">
              <button className="haf-primary-action" onClick={onCommit}>
                <Save size={16} strokeWidth={2.1} /> Add this child plan to my life
              </button>
              <span>
                This adds childcare and child-related groceries/supplies to your saved snapshot,
                then subtracts {usd0(upfront)} from savings.
              </span>
            </div>
            <Flag tone={tone} icon={tone === "bad" ? AlertTriangle : CheckCircle2}>
              This is a planning estimate. Real costs can swing a lot by insurance, family help,
              leave policy, adoption path, and local childcare prices.
            </Flag>
          </section>
        </main>
      </div>
    </div>
  );
}

function PlanCard({ icon: Icon, title, value, sub, tone, onOpen }) {
  return (
    <button className="haf-plan-card" onClick={onOpen}>
      <Icon size={17} strokeWidth={2.1} />
      <div><b>{title}</b><span>{sub}</span></div>
      <Badge tone={tone}>{value}</Badge>
    </button>
  );
}

function GlossaryPanel() {
  return (
    <section className="haf-panel">
      <div className="haf-panel-head">
        <div>
          <h3><BookOpen size={17} strokeWidth={2.1} /> Glossary</h3>
          <p>Plain-language definitions for terms people may not know yet.</p>
        </div>
      </div>
      <div className="haf-glossary">
        {Object.entries(GLOSSARY).map(([term, definition]) => (
          <details key={term}>
            <summary>{term}</summary>
            <p>{definition}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Vital({ icon: Icon, label, value, sub }) {
  return (
    <div className="haf-vital">
      <div className="haf-vital-top">
        <Icon size={15} strokeWidth={2.1} />
        <span>{label}</span>
      </div>
      <div className="haf-vital-v">{value}</div>
      <div className="haf-vital-sub">{sub}</div>
    </div>
  );
}
function Row({ k, v, total, warn, tone }) {
  const color = tone === "bad" ? C.coral : tone === "warn" ? C.amber : tone === "ok" ? C.emerald : undefined;
  return (
    <div className={`haf-row ${total ? "is-total" : ""}`}>
      <span className={warn ? "haf-row-warn" : ""}>{k}</span>
      <b style={color ? { color } : undefined}>{v < 0 ? "−" : ""}{usd0(Math.abs(v))}</b>
    </div>
  );
}
function Mini({ k, v, accent }) {
  return (
    <div className={`haf-mini ${accent ? "is-accent" : ""}`}>
      <span>{k}</span><b>{v}</b>
    </div>
  );
}
function Flag({ tone, icon: Icon, children }) {
  const map = {
    ok: { bg: "#EAF4EE", bd: "#C4E1CF", fg: C.emerald },
    warn: { bg: "#FBF3E2", bd: "#EDD9AE", fg: "#A86F12" },
    bad: { bg: "#FBE9E4", bd: "#EFC7BB", fg: C.coral },
  }[tone];
  return (
    <div className="haf-flag" style={{ background: map.bg, borderColor: map.bd }}>
      <Icon size={17} strokeWidth={2.2} style={{ color: map.fg, flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  );
}
function RevBar({ label, value, max, color }) {
  const w = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;
  return (
    <div className="haf-revbar">
      <div className="haf-revbar-top"><span>{label}</span><b>{usd0(value)}/mo</b></div>
      <div className="haf-revbar-track">
        <div className="haf-revbar-fill" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  styles                                                            */
/* ------------------------------------------------------------------ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;450;500;600;700&display=swap');

.haf *{box-sizing:border-box;}
.haf{
  --ink:${C.ink};--soft:${C.inkSoft};--line:${C.line};--teal:${C.teal};
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  color:var(--ink);
  background:
    radial-gradient(900px 360px at 78% -8%, #DCEAE5 0%, transparent 60%),
    ${C.ground};
  min-height:100%;
  -webkit-font-smoothing:antialiased;
  font-variant-numeric:tabular-nums;
  line-height:1.45;
}
.haf-wrap{max-width:1180px;margin:0 auto;padding:30px 22px 48px;}

/* header */
.haf-eyebrow{font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${C.teal};}
.haf-title{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:clamp(28px,4.4vw,44px);
  line-height:1.04;margin:8px 0 0;letter-spacing:-.01em;}
.haf-lede{max-width:62ch;color:var(--soft);font-size:15px;margin:12px 0 0;}

.haf-module-tabs{display:flex;gap:8px;margin:24px 0 20px;overflow-x:auto;padding-bottom:2px;}
.haf-module-tab{display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid var(--line);
  background:${C.paper};color:var(--soft);font:inherit;font-size:13.5px;font-weight:600;padding:11px 14px;
  border-radius:12px;cursor:pointer;white-space:nowrap;min-width:132px;transition:.15s;}
.haf-module-tab svg{color:${C.teal};}
.haf-module-tab.on{background:${C.teal};border-color:${C.teal};color:#fff;}
.haf-module-tab.on svg{color:#fff;}

/* vitals */
.haf-vitals{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:26px 0 22px;}
.haf-vital{background:${C.paper};border:1px solid var(--line);border-radius:15px;padding:15px 16px;
  box-shadow:0 1px 0 rgba(20,40,40,.02);}
.haf-vital-top{display:flex;align-items:center;gap:7px;color:var(--soft);font-size:12.5px;font-weight:500;}
.haf-vital-top svg{color:${C.teal};}
.haf-vital-v{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:27px;margin:8px 0 4px;letter-spacing:-.01em;}
.haf-vital-sub{font-size:12px;color:var(--soft);min-height:18px;}

/* layout */
.haf-layout{display:grid;grid-template-columns:374px 1fr;gap:20px;align-items:start;}

/* input groups */
.haf-inputs{display:flex;flex-direction:column;gap:12px;position:sticky;top:14px;}
.haf-group{background:${C.paper};border:1px solid var(--line);border-radius:15px;overflow:hidden;}
.haf-group-head{width:100%;display:flex;align-items:center;justify-content:space-between;
  background:none;border:0;cursor:pointer;padding:14px 16px;font:inherit;color:var(--ink);}
.haf-group-title{display:flex;align-items:center;gap:9px;font-weight:600;font-size:14.5px;}
.haf-group-title svg{color:${C.teal};}
.haf-chev{color:var(--soft);transition:transform .2s ease;}
.haf-group.is-open .haf-chev{transform:rotate(180deg);}
.haf-group-body{padding:2px 16px 16px;display:flex;flex-direction:column;gap:13px;}

.haf-field{display:flex;flex-direction:column;gap:6px;min-width:0;}
.haf-field-label{font-size:12.5px;font-weight:500;color:var(--soft);display:flex;align-items:center;
  justify-content:space-between;gap:8px;min-width:0;}
.haf-field-hint{color:#9AA8A6;font-weight:400;font-size:11.5px;}
.haf-term{border-bottom:1px dotted #9AA8A6;cursor:help;text-underline-offset:3px;}
.haf-input{display:flex;align-items:center;border:1px solid var(--line);border-radius:10px;
  background:#FBFCFB;overflow:hidden;transition:border-color .15s,box-shadow .15s;}
.haf-input:focus-within{border-color:${C.teal};box-shadow:0 0 0 3px ${C.tealSoft};}
.haf-input input{flex:1;min-width:0;border:0;background:none;padding:9px 11px;font:inherit;
  font-size:14.5px;font-weight:550;color:var(--ink);text-align:right;outline:none;font-variant-numeric:tabular-nums;}
.haf-affix{padding:0 4px 0 11px;color:var(--soft);font-size:13.5px;}
.haf-affix-r{padding:0 11px 0 4px;}
.haf-grid2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:11px;}
.haf-field-foot{display:flex;align-items:center;gap:9px;flex-wrap:wrap;font-size:12px;color:var(--soft);margin-top:-2px;}
.haf-field-foot b{color:var(--ink);}
.haf-foot-sum{padding-top:4px;border-top:1px dashed var(--line);}

/* segmented controls */
.haf-seg{display:inline-flex;background:#EEF2EF;border-radius:9px;padding:3px;gap:2px;}
.haf-seg button{border:0;background:none;cursor:pointer;font:inherit;font-size:12.5px;font-weight:550;
  color:var(--soft);padding:6px 12px;border-radius:7px;transition:.15s;white-space:nowrap;}
.haf-seg button.on{background:${C.paper};color:${C.tealDeep};box-shadow:0 1px 2px rgba(20,40,40,.08);}
.haf-seg-mini button{padding:3px 9px;}
.haf-seg-wide{display:flex;}
.haf-seg-wide button{flex:1;padding:9px 12px;font-size:13.5px;}

/* main / tabs */
.haf-main{min-width:0;}
.haf-tabs{display:flex;gap:6px;background:${C.paper};border:1px solid var(--line);
  border-radius:13px;padding:5px;margin-bottom:16px;overflow-x:auto;}
.haf-tab{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;border:0;cursor:pointer;
  font:inherit;font-size:13.5px;font-weight:550;color:var(--soft);padding:10px 8px;border-radius:9px;
  transition:.15s;white-space:nowrap;}
.haf-tab.on{background:${C.teal};color:#fff;}
.haf-tab.on svg{color:#fff;}

.haf-panel{background:${C.paper};border:1px solid var(--line);border-radius:16px;padding:22px;
  display:flex;flex-direction:column;gap:18px;animation:fade .25s ease;}
@keyframes fade{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:none;}}
.haf-panel-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;}
.haf-panel-head h3{display:flex;align-items:center;gap:8px;font-family:'Fraunces',Georgia,serif;
  font-size:23px;line-height:1.1;margin:0 0 5px;font-weight:600;}
.haf-panel-head p{margin:0;color:var(--soft);font-size:13px;max-width:62ch;}
.haf-dashboard-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.haf-dashboard-grid .haf-panel:first-child,.haf-dashboard-grid .haf-panel:nth-child(2){grid-column:1 / -1;}
.haf-dash .haf-vitals{margin-top:0;}
.haf-single{animation:fade .25s ease;}
.haf-check-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;}
.haf-check-card{display:flex;align-items:center;gap:9px;border:1px solid var(--line);border-radius:12px;
  background:#F7F9F7;padding:12px 13px;font-size:13px;font-weight:650;color:var(--soft);cursor:pointer;
  min-width:0;}
.haf-check-card input{width:16px;height:16px;accent-color:${C.teal};flex-shrink:0;}
.haf-check-card svg{color:${C.teal};flex-shrink:0;}
.haf-check-card span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.haf-check-card.is-on{background:${C.tealSoft};border-color:#BCD8D1;color:${C.tealDeep};}
.haf-plan-stack{display:flex;flex-direction:column;gap:10px;}
.haf-plan-card{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;
  border:1px solid var(--line);border-radius:12px;padding:12px 13px;background:#F7F9F7;text-align:left;
  font:inherit;color:inherit;cursor:pointer;width:100%;}
.haf-plan-card:hover{border-color:#BCD8D1;background:#F2F7F5;}
.haf-plan-card svg{color:${C.teal};}
.haf-plan-card b{display:block;font-size:13.5px;font-weight:650;}
.haf-plan-card span{display:block;font-size:12px;color:var(--soft);margin-top:2px;}
.haf-event-list{display:flex;flex-direction:column;gap:9px;}
.haf-event{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #F0F3F0;
  padding:0 0 9px;font-size:13px;}
.haf-event b{font-weight:650;}
.haf-event span{color:var(--soft);text-align:right;}
.haf-glossary{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;}
.haf-glossary details{border:1px solid var(--line);border-radius:10px;background:#F7F9F7;padding:9px 11px;}
.haf-glossary summary{cursor:pointer;font-size:12.5px;font-weight:650;text-transform:capitalize;color:var(--ink);}
.haf-glossary p{margin:7px 0 0;color:var(--soft);font-size:12.5px;line-height:1.45;}
.haf-action-row{display:flex;align-items:center;gap:12px;border:1px solid #BCD8D1;background:${C.tealSoft};
  border-radius:13px;padding:12px 14px;}
.haf-action-row span{font-size:12.5px;color:${C.tealDeep};}
.haf-primary-action{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:10px;
  background:${C.teal};color:#fff;font:inherit;font-size:13px;font-weight:650;padding:10px 13px;cursor:pointer;
  white-space:nowrap;}

/* verdict */
.haf-verdict{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;}
.haf-verdict-flush{margin-top:-2px;}
.haf-verdict-k{font-size:13px;color:var(--soft);font-weight:500;}
.haf-verdict-v{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:42px;line-height:1;
  letter-spacing:-.015em;margin:6px 0 6px;}
.haf-verdict-v span{font-size:18px;font-weight:500;margin-left:5px;color:var(--soft);
  font-family:'Inter',sans-serif;}
.haf-verdict-sub{font-size:13px;color:var(--soft);}
.haf-arrow{color:${C.amber};font-weight:550;}

.haf-badge{display:inline-flex;align-items:center;font-size:11.5px;font-weight:600;
  padding:4px 9px;border-radius:20px;white-space:nowrap;}

/* flag callouts */
.haf-flag{display:flex;gap:10px;align-items:flex-start;border:1px solid;border-radius:12px;
  padding:12px 14px;font-size:13.5px;line-height:1.5;}
.haf-flag b{font-weight:650;}

/* budget bars (signature) */
.haf-bbar{display:flex;flex-direction:column;gap:14px;border-top:1px solid var(--line);
  border-bottom:1px solid var(--line);padding:18px 0;}
.haf-bbar-row{display:flex;align-items:center;gap:14px;}
.haf-bbar-cap{width:88px;font-size:12.5px;font-weight:600;color:var(--soft);flex-shrink:0;}
.haf-bbar-track{flex:1;height:30px;border-radius:8px;overflow:hidden;display:flex;background:#F0F3F0;
  box-shadow:inset 0 0 0 1px rgba(20,40,40,.04);}
.haf-bbar-seg{height:100%;transition:width .5s cubic-bezier(.4,0,.2,1);border-right:1.5px solid ${C.paper};}
.haf-bbar-seg:last-child{border-right:0;}
.haf-legend{display:flex;flex-wrap:wrap;gap:6px 16px;padding-left:102px;}
.haf-legend-i{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--soft);}
.haf-legend-i i{width:10px;height:10px;border-radius:3px;}

/* rebuild table */
.haf-rebuild{display:grid;grid-template-columns:1fr 1fr;gap:26px;}
.haf-rebuild-col h4{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:${C.teal};
  font-weight:600;margin:0 0 8px;}
.haf-row{display:flex;justify-content:space-between;gap:12px;font-size:13.5px;padding:5px 0;
  border-bottom:1px solid #F0F3F0;}
.haf-row span{color:var(--soft);}
.haf-row b{font-weight:600;}
.haf-row.is-total{border-bottom:0;border-top:1.5px solid var(--line);margin-top:4px;padding-top:9px;}
.haf-row.is-total span{color:var(--ink);font-weight:600;}
.haf-row.is-total b{font-size:15px;}
.haf-row-warn{color:${C.amber} !important;}

/* mini target grid */
.haf-target-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.haf-mini{background:#F7F9F7;border:1px solid var(--line);border-radius:11px;padding:11px 13px;
  display:flex;flex-direction:column;gap:3px;}
.haf-mini span{font-size:11.5px;color:var(--soft);}
.haf-mini b{font-size:16px;font-weight:600;font-family:'Fraunces',Georgia,serif;}
.haf-mini.is-accent{background:${C.tealSoft};border-color:#BCD8D1;}
.haf-mini.is-accent b{color:${C.tealDeep};}

/* sliders */
.haf-slider-box{background:#F7F9F7;border:1px solid var(--line);border-radius:13px;padding:15px 16px;}
.haf-stress-controls{display:flex;flex-direction:column;gap:12px;}
.haf-slider-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;
  font-size:13.5px;margin-bottom:11px;color:var(--ink);}
.haf-slider-head b{font-weight:650;}
.haf-slider-out{font-size:12.5px;color:var(--soft);}
.haf-slider-scale{display:flex;justify-content:space-between;font-size:11px;color:#9AA8A6;margin-top:7px;}
.haf input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:5px;border-radius:5px;
  background:#D9E2DD;outline:none;cursor:pointer;}
.haf input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:19px;height:19px;
  border-radius:50%;background:${C.teal};border:3px solid #fff;box-shadow:0 1px 4px rgba(20,40,40,.25);cursor:pointer;}
.haf input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:${C.teal};
  border:3px solid #fff;box-shadow:0 1px 4px rgba(20,40,40,.25);cursor:pointer;}
.haf input[type=range]:focus-visible{box-shadow:0 0 0 3px ${C.tealSoft};}

/* chart */
.haf-chart{height:248px;width:100%;}
.haf-tip{background:${C.ink};color:#fff;border-radius:9px;padding:9px 11px;font-size:12px;box-shadow:0 6px 20px rgba(0,0,0,.2);}
.haf-tip-x{opacity:.6;margin-bottom:4px;font-size:11px;}
.haf-tip-row{display:flex;justify-content:space-between;gap:16px;}
.haf-tip-row b{font-weight:600;}

/* reverse */
.haf-rev-lead{font-size:14px;color:var(--soft);margin:0;max-width:64ch;}
.haf-rev-bars{display:flex;flex-direction:column;gap:13px;}
.haf-revbar-top{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;}
.haf-revbar-top b{font-weight:600;}
.haf-revbar-track{height:13px;border-radius:7px;background:#EEF2EF;overflow:hidden;}
.haf-revbar-fill{height:100%;border-radius:7px;transition:width .5s cubic-bezier(.4,0,.2,1);}

.haf-foot{margin-top:24px;font-size:12px;color:#93A19F;max-width:70ch;}

/* focus */
.haf button:focus-visible,.haf a:focus-visible{outline:2px solid ${C.teal};outline-offset:2px;}

/* responsive */
@media (max-width:980px){
  .haf-layout{grid-template-columns:1fr;}
  .haf-inputs{position:static;}
  .haf-vitals{grid-template-columns:1fr 1fr;}
  .haf-dashboard-grid{grid-template-columns:1fr;}
  .haf-check-grid{grid-template-columns:1fr 1fr;}
}
@media (max-width:620px){
  .haf-wrap{padding:22px 14px 40px;}
  .haf-vitals{grid-template-columns:1fr 1fr;gap:10px;}
  .haf-vital-v{font-size:22px;}
  .haf-rebuild{grid-template-columns:1fr;gap:18px;}
  .haf-target-grid{grid-template-columns:1fr 1fr;}
  .haf-legend{padding-left:0;}
  .haf-bbar-cap{width:64px;font-size:11.5px;}
  .haf-verdict-v{font-size:34px;}
  .haf-tab span{display:none;}
  .haf-tab{flex:0 0 auto;padding:10px 14px;}
  .haf-module-tab{min-width:112px;padding:10px 12px;font-size:13px;}
  .haf-glossary{grid-template-columns:1fr;}
  .haf-check-grid{grid-template-columns:1fr;}
  .haf-action-row{align-items:flex-start;flex-direction:column;}
  .haf-primary-action{width:100%;}
}
@media (max-width:480px){
  .haf-grid2{grid-template-columns:1fr;}
}
@media (prefers-reduced-motion:reduce){
  .haf *{animation:none !important;transition:none !important;}
}
`;
