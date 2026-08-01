import React, { useContext, useEffect, useMemo, useState } from "react";
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

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "zh", label: "中文" },
  { code: "fil", label: "Filipino" },
  { code: "vi", label: "Tiếng Việt" },
];

const TRANSLATIONS = {
  es: {
    "Life move studio": "Estudio de decisiones de vida",
    "What happens to your life if you do this?": "¿Qué pasa con tu vida si haces esto?",
    "Save one life snapshot, test big decisions as scenarios, then commit the moves that become real so every other plan sees the new picture.": "Guarda una foto de tu vida financiera, prueba decisiones grandes como escenarios y confirma las que se vuelvan reales para que todos los demás planes usen la nueva realidad.",
    Language: "Idioma",
    "Life snapshot": "Foto de vida",
    "Real life": "Vida real",
    "Buy a home": "Comprar casa",
    "Rent / move": "Rentar / mudarse",
    "Buy a car": "Comprar carro",
    "Baby / child": "Bebé / hijo",
    "Home & loan": "Casa y préstamo",
    "Upfront costs": "Costos iniciales",
    "Monthly home costs": "Costos mensuales de la casa",
    "Real life / actual expenses": "Vida real / gastos actuales",
    "Car scenario": "Escenario de carro",
    "Rent / move scenario": "Escenario de renta / mudanza",
    "Baby / child scenario": "Escenario de bebé / hijo",
    "Choose life moves to check": "Elige decisiones para revisar",
    "Stack moves together": "Combinar decisiones",
    "Connected plans": "Planes conectados",
    "Committed moves": "Decisiones confirmadas",
    Glossary: "Glosario",
    "After you buy": "Después de comprar",
    Timeline: "Línea de tiempo",
    "Stress test": "Prueba de estrés",
    "Reverse plan": "Plan inverso",
    "Room for another move?": "¿Queda espacio para otra decisión?",
    "Home price": "Precio de la casa",
    "Down payment": "Enganche",
    "Loan term": "Plazo del préstamo",
    "Interest rate": "Tasa de interés",
    "Car price": "Precio del carro",
    "Trade-in value": "Valor del carro actual",
    "Sales tax": "Impuesto de venta",
    "Title / dealer fees": "Título / cargos del dealer",
    Insurance: "Seguro",
    "Gas / charging": "Gasolina / carga",
    Maintenance: "Mantenimiento",
    "Income — earner 1": "Ingreso — persona 1",
    "Income — earner 2": "Ingreso — persona 2",
    Utilities: "Servicios",
    Internet: "Internet",
    "Streaming services": "Servicios de streaming",
    "Cable TV": "Cable TV",
    Groceries: "Comida",
    Childcare: "Cuidado infantil",
    Transportation: "Transporte",
    "Car payment": "Pago del carro",
    "Car insurance": "Seguro del carro",
    "Car maintenance": "Mantenimiento del carro",
    "Home maintenance": "Mantenimiento de la casa",
    "Debt payments": "Pagos de deuda",
    "Fun / discretionary": "Gustos / flexible",
    "Savings balance": "Ahorros",
    "Cushion to keep": "Colchón a mantener",
    Fits: "Cabe",
    Tight: "Ajustado",
    Risky: "Riesgoso",
    "Not ready": "No está listo",
    "Room left": "Queda espacio",
    "Tight room": "Espacio justo",
    "No extra room": "Sin espacio extra",
    "Actual monthly picture": "Panorama mensual real",
    "Money in": "Dinero que entra",
    "Money out": "Dinero que sale",
    "Your life snapshot": "Tu foto de vida",
    "Monthly money in": "Dinero mensual que entra",
    "Monthly money out": "Dinero mensual que sale",
    "Monthly stack": "Combinación mensual",
    "Cash stack": "Combinación de efectivo",
    "New home cost": "Nuevo costo de casa",
    "What's left each month": "Lo que queda cada mes",
    "Car cost": "Costo del carro",
    "Loan build": "Cómo se arma el préstamo",
    "Cash flow impact": "Impacto mensual",
    "Savings impact": "Impacto en ahorros",
    "Monthly child costs": "Costos mensuales del hijo",
    "One-time / early costs": "Costos iniciales / únicos",
  },
  fr: {
    "Life move studio": "Studio des grands choix de vie",
    "What happens to your life if you do this?": "Qu’est-ce que ça change dans ta vie si tu fais ça ?",
    "Save one life snapshot, test big decisions as scenarios, then commit the moves that become real so every other plan sees the new picture.": "Garde une photo claire de ta situation, teste les grandes décisions comme des scénarios, puis applique celles qui deviennent réelles.",
    Language: "Langue",
    "Life snapshot": "Portrait de vie",
    "Real life": "Vie réelle",
    "Buy a home": "Acheter une maison",
    "Rent / move": "Louer / déménager",
    "Buy a car": "Acheter une voiture",
    "Baby / child": "Bébé / enfant",
    "Home & loan": "Maison et prêt",
    "Upfront costs": "Coûts au départ",
    "Monthly home costs": "Coûts mensuels du logement",
    "Car scenario": "Scénario voiture",
    "After you buy": "Après l’achat",
    Timeline: "Calendrier",
    "Stress test": "Test de résistance",
    "Reverse plan": "Plan à rebours",
    "Room for another move?": "De la place pour un autre projet ?",
    "Home price": "Prix de la maison",
    "Down payment": "Apport",
    "Loan term": "Durée du prêt",
    "Interest rate": "Taux d’intérêt",
    "Car price": "Prix de la voiture",
    "Trade-in value": "Valeur de reprise",
    "Sales tax": "Taxe de vente",
    Insurance: "Assurance",
    Maintenance: "Entretien",
    Utilities: "Services",
    Groceries: "Courses",
    Childcare: "Garde d’enfant",
    Transportation: "Transport",
    "Savings balance": "Épargne",
    Fits: "Ça passe",
    Tight: "Serré",
    Risky: "Risqué",
    "Not ready": "Pas prêt",
    "Room left": "Marge restante",
    "Tight room": "Marge serrée",
    "No extra room": "Pas de marge",
    "Actual monthly picture": "Situation mensuelle réelle",
    "Money in": "Argent qui entre",
    "Money out": "Argent qui sort",
    "Your life snapshot": "Ton portrait de vie",
    "Monthly money in": "Revenus mensuels",
    "Monthly money out": "Dépenses mensuelles",
    "Monthly stack": "Cumul mensuel",
    "Cash stack": "Cumul de cash",
    "New home cost": "Nouveau coût du logement",
    "What's left each month": "Ce qu’il reste chaque mois",
    "Car cost": "Coût de la voiture",
    "Loan build": "Construction du prêt",
    "Cash flow impact": "Impact sur le mois",
    "Savings impact": "Impact sur l’épargne",
    "Monthly child costs": "Coûts mensuels de l’enfant",
    "One-time / early costs": "Coûts initiaux / ponctuels",
  },
  zh: {
    "Life move studio": "人生决定规划室",
    "What happens to your life if you do this?": "如果这样做，你的生活会怎样变化？",
    Language: "语言",
    "Life snapshot": "生活快照",
    "Real life": "现实生活",
    "Buy a home": "买房",
    "Rent / move": "租房 / 搬家",
    "Buy a car": "买车",
    "Baby / child": "宝宝 / 孩子",
    "Home & loan": "房子和贷款",
    "Upfront costs": "前期费用",
    "Monthly home costs": "每月住房费用",
    "Car scenario": "买车方案",
    "After you buy": "购买之后",
    Timeline: "时间线",
    "Stress test": "压力测试",
    "Reverse plan": "倒推计划",
    "Room for another move?": "还有空间做另一个决定吗？",
    "Home price": "房价",
    "Down payment": "首付",
    "Loan term": "贷款期限",
    "Interest rate": "利率",
    "Car price": "车价",
    Insurance: "保险",
    Maintenance: "保养",
    Utilities: "水电杂费",
    Groceries: "食品杂货",
    Childcare: "托儿费用",
    Transportation: "交通",
    "Savings balance": "储蓄余额",
    Fits: "可承受",
    Tight: "偏紧",
    Risky: "风险高",
    "Not ready": "还没准备好",
    "Actual monthly picture": "真实每月状况",
    "Money in": "收入",
    "Money out": "支出",
    "Your life snapshot": "你的生活快照",
    "Monthly money in": "每月收入",
    "Monthly money out": "每月支出",
    "New home cost": "新的住房成本",
    "What's left each month": "每月剩余",
    "Car cost": "汽车成本",
    "Loan build": "贷款构成",
    "Cash flow impact": "现金流影响",
    "Savings impact": "储蓄影响",
  },
  fil: {
    "Life move studio": "Plano ng buhay",
    "What happens to your life if you do this?": "Ano ang mangyayari sa buhay mo kung gagawin mo ito?",
    Language: "Wika",
    "Life snapshot": "Buod ng buhay",
    "Real life": "Totoong buhay",
    "Buy a home": "Bumili ng bahay",
    "Rent / move": "Uupa / lilipat",
    "Buy a car": "Bumili ng kotse",
    "Baby / child": "Baby / anak",
    "Home & loan": "Bahay at utang",
    "Upfront costs": "Paunang gastos",
    "Monthly home costs": "Buwanang gastos sa bahay",
    "Car scenario": "Plano sa kotse",
    "After you buy": "Pagkatapos bumili",
    Timeline: "Takdang panahon",
    "Stress test": "Pagsubok sa hirap",
    "Reverse plan": "Baliktad na plano",
    "Room for another move?": "May puwang pa para sa isa pang plano?",
    "Home price": "Presyo ng bahay",
    "Down payment": "Paunang bayad",
    "Loan term": "Tagal ng utang",
    "Interest rate": "Tubo",
    "Car price": "Presyo ng kotse",
    Insurance: "Seguro",
    Maintenance: "Pagpapanatili",
    Utilities: "Serbisyo sa bahay",
    Groceries: "Pagkain at gamit",
    Childcare: "Pag-aalaga ng bata",
    Transportation: "Transportasyon",
    "Savings balance": "Ipon",
    Fits: "Kaya",
    Tight: "Medyo sagad",
    Risky: "Delikado",
    "Not ready": "Hindi pa handa",
    "Actual monthly picture": "Totoong buwanang larawan",
    "Money in": "Papasok na pera",
    "Money out": "Lalabas na pera",
    "Your life snapshot": "Buod ng buhay mo",
    "Monthly money in": "Buwanang pasok",
    "Monthly money out": "Buwanang gastos",
    "New home cost": "Bagong gastos sa bahay",
    "What's left each month": "Matitira bawat buwan",
    "Car cost": "Gastos sa kotse",
    "Loan build": "Detalye ng utang",
    "Cash flow impact": "Epekto sa buwanang pera",
    "Savings impact": "Epekto sa ipon",
  },
  vi: {
    "Life move studio": "Công cụ lập kế hoạch cuộc sống",
    "What happens to your life if you do this?": "Cuộc sống của bạn sẽ thay đổi thế nào nếu làm điều này?",
    Language: "Ngôn ngữ",
    "Life snapshot": "Ảnh chụp tài chính",
    "Real life": "Cuộc sống hiện tại",
    "Buy a home": "Mua nhà",
    "Rent / move": "Thuê / chuyển nhà",
    "Buy a car": "Mua xe",
    "Baby / child": "Em bé / con",
    "Home & loan": "Nhà và khoản vay",
    "Upfront costs": "Chi phí ban đầu",
    "Monthly home costs": "Chi phí nhà hằng tháng",
    "Car scenario": "Kịch bản mua xe",
    "After you buy": "Sau khi mua",
    Timeline: "Dòng thời gian",
    "Stress test": "Kiểm tra áp lực",
    "Reverse plan": "Lập kế hoạch ngược",
    "Room for another move?": "Còn chỗ cho kế hoạch khác không?",
    "Home price": "Giá nhà",
    "Down payment": "Tiền trả trước",
    "Loan term": "Thời hạn vay",
    "Interest rate": "Lãi suất",
    "Car price": "Giá xe",
    Insurance: "Bảo hiểm",
    Maintenance: "Bảo trì",
    Utilities: "Tiện ích",
    Groceries: "Thực phẩm",
    Childcare: "Chăm sóc trẻ",
    Transportation: "Đi lại",
    "Savings balance": "Tiền tiết kiệm",
    Fits: "Phù hợp",
    Tight: "Hơi căng",
    Risky: "Rủi ro",
    "Not ready": "Chưa sẵn sàng",
    "Actual monthly picture": "Bức tranh hằng tháng hiện tại",
    "Money in": "Tiền vào",
    "Money out": "Tiền ra",
    "Your life snapshot": "Ảnh chụp cuộc sống của bạn",
    "Monthly money in": "Tiền vào hằng tháng",
    "Monthly money out": "Tiền ra hằng tháng",
    "New home cost": "Chi phí nhà mới",
    "What's left each month": "Còn lại mỗi tháng",
    "Car cost": "Chi phí xe",
    "Loan build": "Cấu trúc khoản vay",
    "Cash flow impact": "Tác động dòng tiền",
    "Savings impact": "Tác động tiết kiệm",
  },
};

const LanguageContext = React.createContext("en");

const EXTRA_TRANSLATIONS = {
  es: {
    "Life snapshot": "Resumen de vida",
    "Your life snapshot": "Tu resumen de vida",
    "Save one life snapshot, test big decisions as scenarios, then commit the moves that become real so every other plan sees the new picture.": "Guarda un resumen de tu vida financiera, prueba decisiones grandes como escenarios y confirma las que se vuelvan reales para que todos los demás planes usen la nueva realidad.",
    "Monthly cushion": "Margen mensual",
    "Current commitments": "Compromisos actuales",
    "Emergency runway": "Tiempo de respaldo",
    "Housing status": "Situación de vivienda",
    Renting: "Rentando",
    Owned: "Propia",
    Strong: "Fuerte",
    Healthy: "Saludable",
    "Very tight": "Muy ajustado",
    "Over budget": "Fuera de presupuesto",
    "Pick moves": "Elige decisiones",
    "Fits together": "Caben juntas",
    "Tight together": "Ajustado en conjunto",
    "Too much together": "Demasiado junto",
    "Monthly impact": "Impacto mensual",
    "Upfront cash": "Efectivo inicial",
    "Cushion after": "Margen después",
    "Savings after": "Ahorros después",
    "Emergency floor": "Piso de emergencia",
    "Moves selected": "Decisiones elegidas",
    "Turn on only the scenarios you care about right now. Your choices are saved.": "Activa solo los escenarios que quieres revisar ahora. Tus elecciones se guardan.",
    "Mix scenarios to see whether a few big choices can fit at the same time.": "Combina escenarios para ver si varias decisiones grandes caben al mismo tiempo.",
    "Choose two or more moves above when you want to test real-life temptation stacking.": "Elige dos o más decisiones arriba cuando quieras probar varias tentaciones de la vida real juntas.",
    "Life snapshot is the saved baseline every plan reads from.": "El resumen de vida es la base guardada que todos los planes usan.",
    "These scenarios use your saved snapshot, so one real move changes the next one.": "Estos escenarios usan tu resumen guardado, así que una decisión real cambia la siguiente.",
    "No committed moves yet. Use a module as a scenario, then add it to your life when it becomes real.": "Todavía no hay decisiones confirmadas. Usa un módulo como escenario y agrégalo a tu vida cuando se vuelva real.",
    "Committed moves are real changes already applied to your snapshot.": "Las decisiones confirmadas son cambios reales que ya se aplicaron a tu resumen.",
    "Pick at least one life move above to show connected plan cards.": "Elige al menos una decisión arriba para mostrar las tarjetas de planes conectados.",
    "Actual monthly spending": "Gasto mensual real",
    "Current housing": "Vivienda actual",
    "Actual monthly picture": "Panorama mensual real",
    "This is the saved baseline every life move uses. Change it here first, then test scenarios.": "Esta es la base guardada que usa cada decisión de vida. Cámbiala aquí primero y luego prueba escenarios.",
    "This is your actual baseline. Life moves should be judged against this, not against numbers hidden inside one scenario.": "Esta es tu base real. Las decisiones de vida deben compararse contra esto, no contra números escondidos dentro de un solo escenario.",
    "Household income": "Ingreso del hogar",
    "Earner 1": "Persona 1",
    "Earner 2": "Persona 2",
    Housing: "Vivienda",
    Debt: "Deuda",
    Fun: "Gustos",
    "Other subscriptions": "Otras suscripciones",
    "Monthly money in": "Dinero mensual que entra",
    "Monthly money out": "Dinero mensual que sale",
    "Total monthly impact": "Impacto mensual total",
    "Total upfront cash": "Efectivo inicial total",
    "Ready now": "Listo ahora",
    "Not yet": "Aún no",
    "after purchase": "después de comprar",
    upfront: "inicial",
    Open: "Abierto",
    "housing, bills, debts, lifestyle": "vivienda, cuentas, deudas y estilo de vida",
    Household: "Hogar",
    "Mortgage / home cost": "Hipoteca / costo de casa",
    "Rent today": "Renta actual",
    Own: "Propia",
    "Estimated loan payment": "Pago estimado del préstamo",
    "This move changes monthly life by": "Esta mudanza cambia tu vida mensual en",
    "This car adds": "Este carro agrega",
    "Plain-language definitions for terms people may not know yet.": "Definiciones claras para términos que quizás la gente todavía no conoce.",
    "Auto-saved": "Guardado automático",
    "Monthly stack": "Impacto mensual combinado",
    "Cash stack": "Efectivo combinado",
    "Buying a home and renting/moving are usually alternate housing paths, so compare them separately unless you truly expect both.": "Comprar casa y rentar/mudarte normalmente son caminos alternos de vivienda, así que compáralos por separado a menos que de verdad esperes hacer ambas cosas.",
    "This combination breaks either monthly cushion or emergency savings. It needs a smaller move, more cash, or more income.": "Esta combinación rompe el margen mensual o los ahorros de emergencia. Necesita una decisión más pequeña, más efectivo o más ingreso.",
    "This combination can work, but it leaves little room for surprises.": "Esta combinación puede funcionar, pero deja poco espacio para sorpresas.",
    "This combination keeps monthly cushion and emergency savings intact.": "Esta combinación mantiene intactos el margen mensual y los ahorros de emergencia.",
    "After this house, check whether another big plan still fits without breaking the monthly cushion or emergency floor.": "Después de esta casa, revisa si otro plan grande todavía cabe sin romper el margen mensual o el piso de emergencia.",
    "Buy the car scenario": "Comprar el carro del escenario",
    "Adopt a child": "Adoptar un niño",
    "Have a baby": "Tener un bebé",
    "Savings after both": "Ahorros después de ambas decisiones",
    "Cushion after move": "Margen después de mudarte",
    "Cushion after car": "Margen después del carro",
    "Savings after car": "Ahorros después del carro",
    "Rent / move scenario": "Escenario de renta / mudanza",
    "Car scenario": "Escenario de carro",
    "Baby / child scenario": "Escenario de bebé / hijo",
    "This move changes monthly life by": "Esta mudanza cambia tu vida mensual por",
    "Path": "Camino",
    "Monthly child costs": "Costos mensuales del niño",
    "One-time / early costs": "Costos iniciales / únicos",
    "This is a planning estimate. Real costs can swing a lot by insurance, family help, leave policy, adoption path, and local childcare prices.": "Esto es una estimación de planeación. Los costos reales pueden cambiar mucho por seguro, ayuda familiar, política de licencia, ruta de adopción y precios locales de cuidado infantil.",
    "A move should leave enough monthly cushion for surprises after rent, bills, and normal life.": "Una mudanza debe dejar suficiente margen mensual para sorpresas después de renta, cuentas y vida normal.",
    "The monthly payment works, but the down payment leaves savings below your emergency cushion.": "El pago mensual funciona, pero el enganche deja tus ahorros por debajo de tu colchón de emergencia.",
    "This can work, but it leaves a thin buffer. A lower price, bigger down payment, or shorter term may make it sturdier.": "Esto puede funcionar, pero deja un margen delgado. Un precio menor, un enganche más grande o un plazo más corto puede hacerlo más sólido.",
    "This keeps your monthly cushion positive and leaves savings above your emergency floor.": "Esto mantiene positivo tu margen mensual y deja tus ahorros por encima del piso de emergencia.",
    "This car creates a monthly shortfall. The payment and car costs are more than your current monthly cushion.": "Este carro crea un déficit mensual. El pago y los costos del carro superan tu margen mensual actual.",
    "Estimated loan payment": "Pago estimado del préstamo",
    "Payment": "Pago",
    "Fuel": "Gasolina / carga",
    "Gas / charging": "Gasolina / carga",
    "Amount financed": "Monto financiado",
    "Total interest": "Interés total",
    "Down payment today": "Enganche hoy",
    "Savings after down": "Ahorros después del enganche",
    "Health insurance": "Seguro médico",
    "Supplies": "Artículos",
    "Food": "Comida",
    "Clothing": "Ropa",
    "College savings": "Ahorro universitario",
    "Medical / adoption": "Médico / adopción",
    "Nursery gear": "Equipo del bebé",
    "Leave income loss": "Ingreso perdido por licencia",
    "Birth": "Nacimiento",
    "Adoption": "Adopción",
    "Monthly home cost": "Costo mensual de casa",
    "payment, tax, insurance, HOA, utilities": "pago, impuestos, seguro, HOA y servicios",
    "Cash to buy": "Efectivo para comprar",
    "Left to save after buying": "Lo que queda para ahorrar después de comprar",
    "Until you're ready": "Tiempo hasta estar listo",
    "to cover down payment + cushion": "para cubrir enganche + colchón",
    "PMI on": "PMI activo",
    "no PMI": "sin PMI",
    "of loan / yr, while under 20%": "del préstamo / año, mientras sea menos de 20%",
    "Your agent commission": "Comisión de tu agente",
    "your share, if any": "tu parte, si aplica",
    "of price": "del precio",
    "Cash to close": "Efectivo para cerrar",
    "Property tax": "Impuesto predial",
    "of home value / yr": "del valor de la casa / año",
    "Homeowners insurance": "Seguro de vivienda",
    "per year": "por año",
    "After buying, you'd save": "Después de comprar, ahorrarías",
    "of income": "del ingreso",
    today: "hoy",
    from: "de",
    around: "aprox.",
    "Not at this rate": "No a este ritmo",
    Off: "Apagado",
    "This budget goes over. The home cost plus current spending is more than your income — something has to give before this works.": "Este presupuesto queda en déficit. El costo de la casa más tus gastos actuales supera tu ingreso; algo tiene que cambiar antes de que funcione.",
    "Savings drop below a healthy floor. You'd still be positive, but with little room for surprises.": "Los ahorros caen por debajo de un piso saludable. Sigues en positivo, pero con poco espacio para sorpresas.",
    "Savings stay healthy after the purchase. Run the stress test to see how a rough patch would feel.": "Tus ahorros se mantienen saludables después de comprar. Usa la prueba de estrés para ver cómo se sentiría una mala racha.",
    "Add this home to my life": "Agregar esta casa a mi vida",
    "This saves the home as real, subtracts cash to close from savings, and updates your shared snapshot.": "Esto guarda la casa como real, resta el efectivo para cerrar de tus ahorros y actualiza tu resumen compartido.",
    Now: "Ahora",
    "After buying": "Después de comprar",
    "Rent + utilities": "Renta + servicios",
    "Internet + media": "Internet + entretenimiento",
    Vehicle: "Vehículo",
    "Home upkeep": "Mantenimiento de casa",
    Media: "Entretenimiento",
    Upkeep: "Mantenimiento",
    "Principal & interest": "Capital e interés",
    "Home (all-in)": "Casa (todo incluido)",
    "For savings": "Para ahorrar",
    "Monthly room after home": "Margen mensual después de la casa",
    "Cash after closing": "Efectivo después del cierre",
    "Cash above floor": "Efectivo sobre el piso",
    "Adds monthly": "Agrega al mes",
    "Needs upfront": "Requiere inicial",
    "Monthly room after both": "Margen mensual después de ambas decisiones",
    "Turn on another life move from the Life snapshot to compare it against this house.": "Activa otra decisión desde Resumen de vida para compararla contra esta casa.",
    "This house still leaves enough room for at least one other selected move.": "Esta casa todavía deja espacio suficiente para al menos otra decisión seleccionada.",
    "There is some room after the house, but the next move would leave a thin buffer.": "Hay algo de espacio después de la casa, pero la siguiente decisión dejaría un margen delgado.",
    "This house should probably be the only big move for now. Another purchase would break cash flow or dip below the emergency floor.": "Probablemente esta casa debería ser la única decisión grande por ahora. Otra compra rompería el flujo mensual o bajaría del piso de emergencia.",
    "Time to your target": "Tiempo para llegar a tu meta",
    months: "meses",
    "You already have enough to close and keep your cushion.": "Ya tienes suficiente para cerrar y mantener tu colchón.",
    "On track for around": "Vas en camino para alrededor de",
    "At this savings rate you won't reach it — free up some monthly cash flow below.": "Con este ritmo de ahorro no llegarías; libera flujo mensual abajo.",
    Target: "Meta",
    "Saved so far": "Ahorrado hasta ahora",
    "Still to go": "Falta por ahorrar",
    "Cut monthly spending by": "Reducir gastos mensuales por",
    saving: "ahorrando",
    "ready now": "listo ahora",
    never: "nunca",
    target: "meta",
    Savings: "Ahorros",
    Cushion: "Colchón",
    "Lose an income": "Perder un ingreso",
    "Costs rise": "Suben los costos",
    "Which income pauses?": "¿Qué ingreso se pausa?",
    For: "Durante",
    "Interest rate up": "Sube la tasa de interés",
    "Insurance up": "Sube el seguro",
    "Your cushion lasts": "Tu colchón dura",
    "Holds up": "Resiste",
    "Runs dry": "Se agota",
    "Even with higher costs you stay cash-flow positive, so the cushion isn't drained.": "Incluso con costos más altos sigues con flujo positivo, así que el colchón no se agota.",
    "Higher costs flip you to a monthly shortfall — the cushion drains in about months.": "Los costos más altos te dejan en déficit mensual; el colchón se agota en aproximadamente esos meses.",
    "This emergency cushion survives the lost-income period with room left.": "Este colchón de emergencia aguanta el periodo sin ese ingreso y todavía deja margen.",
    "The cushion runs out before the income gap ends. A bigger cushion or lower payment closes it.": "El colchón se agota antes de que termine la pausa de ingreso. Un colchón más grande o un pago menor cerraría la brecha.",
    "You are already saving more than this target needs. You could hit it sooner or aim for a larger down payment.": "Ya estás ahorrando más de lo que requiere esta meta. Podrías llegar antes o apuntar a un enganche más grande.",
    "You are short of this target. Free up cash flow, stretch the timeline, or lower the down payment.": "Te falta para esta meta. Libera flujo mensual, alarga el plazo o baja el enganche.",
    "No committed moves yet. Use a module as a scenario, then add it to your life when it becomes real.": "Todavía no hay decisiones confirmadas. Usa un módulo como escenario y agrégalo a tu vida cuando se vuelva real.",
    "Estimates for planning, not a loan offer. Taxes, insurance, and PMI vary by lender and location — confirm real quotes before you commit.": "Estimaciones para planear, no una oferta de préstamo. Impuestos, seguro y PMI cambian por prestamista y ubicación; confirma cotizaciones reales antes de comprometerte.",
    "Work backward: pick a timeline and a down payment, and see the monthly savings it takes to get there on this home.": "Trabaja hacia atrás: elige una fecha y un enganche, y revisa cuánto tendrías que ahorrar al mes para llegar a esta casa.",
    "Buy in": "Comprar en",
    year: "año",
    years: "años",
    "With down": "Con enganche de",
    "You'd need to save": "Tendrías que ahorrar",
    "Need to save": "Necesitas ahorrar",
    "Saving now": "Ahorras ahora",
    "Current housing + utilities": "Vivienda actual + servicios",
    "New rent": "Nueva renta",
    "Roommate share": "Aporte de roommate",
    "New utilities": "Nuevos servicios",
    "Security deposit": "Depósito de seguridad",
    "Moving costs": "Costos de mudanza",
    "Furniture / setup": "Muebles / instalación",
    "New rent after split": "Nueva renta después de dividir",
    "New monthly housing": "Nueva vivienda mensual",
    "Upfront cost": "Costo inicial",
    "Cash due today": "Efectivo requerido hoy",
    "Loan interest": "Interés del préstamo",
    "Current savings": "Ahorros actuales",
    "Loan payment": "Pago del préstamo",
    "Car monthly cost": "Costo mensual del carro",
    "Savings today": "Ahorros hoy",
    "Emergency cushion to keep": "Colchón de emergencia a mantener",
    "Below cushion by": "Debajo del colchón por",
    "Above cushion by": "Sobre el colchón por",
    "Adopting a child": "Adoptar un niño",
    "Having a baby": "Tener un bebé",
    "adds about": "agrega aproximadamente",
    "Diapers / supplies": "Pañales / artículos",
    "Food / formula": "Comida / fórmula",
    "Clothing / extras": "Ropa / extras",
    "Adoption costs": "Costos de adopción",
    "Medical out-of-pocket": "Gastos médicos de bolsillo",
    "Nursery / gear": "Cuarto / equipo del bebé",
    "Leave income gap": "Ingreso perdido por licencia",
    "Upfront total": "Total inicial",
    "Add this child plan to my life": "Agregar este plan de niño a mi vida",
    "This adds childcare and child-related groceries/supplies to your saved snapshot, then subtracts upfront from savings.": "Esto agrega cuidado infantil y comida/artículos del niño a tu resumen guardado, y luego resta el costo inicial de tus ahorros.",
  },
  fr: {
    "Monthly cushion": "Marge mensuelle",
    "Current commitments": "Engagements actuels",
    "Emergency runway": "Marge de sécurité",
    "Housing status": "Situation logement",
    Renting: "Location",
    Owned: "Propriétaire",
    Strong: "Solide",
    Healthy: "Sain",
    "Very tight": "Très serré",
    "Over budget": "Hors budget",
    "Pick moves": "Choisir",
    "Monthly impact": "Impact mensuel",
    "Upfront cash": "Cash au départ",
    "Cushion after": "Marge après",
    "Savings after": "Épargne après",
    "Emergency floor": "Réserve minimum",
    "Moves selected": "Choix sélectionnés",
    "Turn on only the scenarios you care about right now. Your choices are saved.": "Active seulement les scénarios qui comptent maintenant. Tes choix sont enregistrés.",
    "Mix scenarios to see whether a few big choices can fit at the same time.": "Combine les scénarios pour voir si plusieurs grands choix peuvent passer en même temps.",
    "Life snapshot is the saved baseline every plan reads from.": "Le portrait de vie est la base enregistrée que chaque plan utilise.",
    "These scenarios use your saved snapshot, so one real move changes the next one.": "Ces scénarios utilisent ton portrait enregistré, donc un vrai changement modifie le suivant.",
    "Auto-saved": "Enregistré auto",
  },
  zh: {
    "Life snapshot": "生活概况",
    "Your life snapshot": "你的生活概况",
    "Save one life snapshot, test big decisions as scenarios, then commit the moves that become real so every other plan sees the new picture.": "保存你的财务生活概况，把重大决定当作情境测试；等某个决定成真后再确认，这样其他计划都会使用新的现实状况。",
    "Monthly cushion": "每月余量",
    "Current commitments": "当前固定支出",
    "Emergency runway": "应急支撑时间",
    "Housing status": "住房状态",
    Renting: "租房中",
    Owned: "已拥有",
    Strong: "很稳",
    Healthy: "健康",
    "Very tight": "非常紧",
    "Over budget": "超出预算",
    "Pick moves": "选择项目",
    "Fits together": "可以一起承担",
    "Tight together": "一起会偏紧",
    "Too much together": "一起压力太大",
    "Monthly impact": "每月影响",
    "Upfront cash": "前期现金",
    "Cushion after": "之后余量",
    "Savings after": "之后储蓄",
    "Emergency floor": "应急底线",
    "Moves selected": "已选项目",
    "Turn on only the scenarios you care about right now. Your choices are saved.": "只开启你现在想看的情境。你的选择会自动保存。",
    "Mix scenarios to see whether a few big choices can fit at the same time.": "组合几个情境，看看多项重大决定能不能同时承担。",
    "Choose two or more moves above when you want to test real-life temptation stacking.": "想测试现实中多个诱惑叠加时，请在上方选择两个或更多决定。",
    "Life snapshot is the saved baseline every plan reads from.": "生活概况是所有计划读取的已保存基准。",
    "These scenarios use your saved snapshot, so one real move changes the next one.": "这些情境都会使用你保存的概况，所以一个真实决定会影响下一个计划。",
    "No committed moves yet. Use a module as a scenario, then add it to your life when it becomes real.": "还没有确认的决定。先把模块当作情境测试，等它成真后再加入你的生活。",
    "Committed moves are real changes already applied to your snapshot.": "已确认决定是已经应用到生活概况里的真实变化。",
    "Pick at least one life move above to show connected plan cards.": "请先在上方选择至少一个生活决定，才会显示关联计划卡片。",
    "Actual monthly spending": "真实每月支出",
    "Current housing": "当前住房",
    "Actual monthly picture": "真实月度状况",
    "This is the saved baseline every life move uses. Change it here first, then test scenarios.": "这是每个生活决定都会使用的已保存基准。先在这里修改，再测试情境。",
    "This is your actual baseline. Life moves should be judged against this, not against numbers hidden inside one scenario.": "这是你的真实基准。生活决定应该和这里比较，而不是和某个情境里隐藏的数字比较。",
    "Household income": "家庭收入",
    "Earner 1": "收入者 1",
    "Earner 2": "收入者 2",
    Housing: "住房",
    Debt: "债务",
    Fun: "娱乐",
    "Other subscriptions": "其他订阅",
    "Monthly money in": "每月进账",
    "Monthly money out": "每月支出",
    "Total monthly impact": "每月总影响",
    "Total upfront cash": "前期现金总额",
    "Ready now": "现在可以",
    "Not yet": "还不行",
    "after purchase": "购买后",
    upfront: "前期",
    Open: "充足",
    "housing, bills, debts, lifestyle": "住房、账单、债务和生活方式",
    Household: "家庭",
    "Mortgage / home cost": "房贷 / 住房成本",
    "Rent today": "当前租金",
    Own: "自有",
    "Estimated loan payment": "预计贷款月供",
    "This move changes monthly life by": "这次搬家让每月生活变化",
    "This car adds": "这辆车每月增加",
    "Plain-language definitions for terms people may not know yet.": "用简单语言解释可能还不熟悉的财务术语。",
    "Auto-saved": "已自动保存",
    "Monthly stack": "组合后的每月影响",
    "Cash stack": "组合后的现金需求",
    "Buying a home and renting/moving are usually alternate housing paths, so compare them separately unless you truly expect both.": "买房和租房/搬家通常是两条不同的住房路径，除非你真的会同时做，否则请分开比较。",
    "This combination breaks either monthly cushion or emergency savings. It needs a smaller move, more cash, or more income.": "这个组合会打破每月余量或应急储蓄。需要缩小决定、增加现金或提高收入。",
    "This combination can work, but it leaves little room for surprises.": "这个组合可以做，但留给意外的空间很少。",
    "This combination keeps monthly cushion and emergency savings intact.": "这个组合能保住每月余量和应急储蓄。",
    "After this house, check whether another big plan still fits without breaking the monthly cushion or emergency floor.": "买这套房之后，检查另一个大计划是否还能承担，同时不破坏每月余量或应急底线。",
    "Buy the car scenario": "购买这个车的情境",
    "Adopt a child": "领养孩子",
    "Have a baby": "生宝宝",
    "Savings after both": "两项决定后的储蓄",
    "Cushion after move": "搬家后的余量",
    "Cushion after car": "买车后的余量",
    "Savings after car": "买车后的储蓄",
    "Rent / move scenario": "租房 / 搬家情境",
    "Car scenario": "买车情境",
    "Baby / child scenario": "宝宝 / 孩子情境",
    Path: "路径",
    "Monthly child costs": "孩子每月成本",
    "One-time / early costs": "一次性 / 前期成本",
    "This is a planning estimate. Real costs can swing a lot by insurance, family help, leave policy, adoption path, and local childcare prices.": "这只是规划估算。真实成本会受到保险、家庭帮助、休假政策、领养路径和当地托育价格的很大影响。",
    "A move should leave enough monthly cushion for surprises after rent, bills, and normal life.": "搬家后，在租金、账单和正常生活之外，仍应保留足够的每月余量应对意外。",
    "The monthly payment works, but the down payment leaves savings below your emergency cushion.": "月供可以承担，但首付会让储蓄低于你的应急底线。",
    "This can work, but it leaves a thin buffer. A lower price, bigger down payment, or shorter term may make it sturdier.": "这可以做，但缓冲很薄。更低价格、更高首付或更短期限会更稳。",
    "This keeps your monthly cushion positive and leaves savings above your emergency floor.": "这能让每月余量保持为正，并让储蓄高于应急底线。",
    "This car creates a monthly shortfall. The payment and car costs are more than your current monthly cushion.": "这辆车会造成每月缺口。车贷和用车成本超过你当前的每月余量。",
    Payment: "付款",
    Fuel: "油费 / 充电",
    "Gas / charging": "油费 / 充电",
    "Amount financed": "贷款金额",
    "Total interest": "总利息",
    "Down payment today": "今天支付的首付",
    "Savings after down": "首付后的储蓄",
    "Health insurance": "健康保险",
    Supplies: "用品",
    Food: "食物",
    Clothing: "衣物",
    "College savings": "大学储蓄",
    "Medical / adoption": "医疗 / 领养",
    "Nursery gear": "婴儿房用品",
    "Leave income loss": "休假收入损失",
    Birth: "生育",
    Adoption: "领养",
    "Monthly home cost": "每月住房成本",
    "payment, tax, insurance, HOA, utilities": "月供、税、保险、HOA 和水电等服务",
    "Cash to buy": "购房所需现金",
    "Left to save after buying": "买房后可储蓄",
    "Until you're ready": "距离准备好",
    "to cover down payment + cushion": "用于覆盖首付 + 缓冲",
    "PMI on": "PMI 已开启",
    "no PMI": "无 PMI",
    "of loan / yr, while under 20%": "贷款额每年比例，首付低于 20% 时",
    "Your agent commission": "你的经纪佣金",
    "your share, if any": "如有，由你承担的部分",
    "of price": "房价比例",
    "Cash to close": "成交所需现金",
    "Property tax": "房产税",
    "of home value / yr": "房屋价值每年比例",
    "Homeowners insurance": "房屋保险",
    "per year": "每年",
    "After buying, you'd save": "买房后你每月可存",
    "of income": "收入比例",
    today: "今天",
    from: "从",
    around: "约",
    "Not at this rate": "按这个速度还不行",
    Off: "关闭",
    "This budget goes over. The home cost plus current spending is more than your income — something has to give before this works.": "这个预算会超支。房屋成本加上当前支出超过收入，在可行之前必须调整某些部分。",
    "Savings drop below a healthy floor. You'd still be positive, but with little room for surprises.": "储蓄会低于健康底线。虽然仍为正，但应对意外的空间很少。",
    "Savings stay healthy after the purchase. Run the stress test to see how a rough patch would feel.": "购买后储蓄仍然健康。运行压力测试，看看困难时期会是什么感觉。",
    "Add this home to my life": "把这套房加入我的生活",
    "This saves the home as real, subtracts cash to close from savings, and updates your shared snapshot.": "这会把房子保存为真实决定，从储蓄中扣除成交现金，并更新你的共享生活概况。",
    Now: "现在",
    "After buying": "买房后",
    "Rent + utilities": "租金 + 水电等服务",
    "Internet + media": "网络 + 媒体",
    Vehicle: "车辆",
    "Home upkeep": "房屋维护",
    Media: "媒体",
    Upkeep: "维护",
    "Principal & interest": "本金和利息",
    "Home (all-in)": "住房（全包）",
    "For savings": "用于储蓄",
    "Monthly room after home": "买房后的每月空间",
    "Cash after closing": "成交后现金",
    "Cash above floor": "高于底线的现金",
    "Adds monthly": "每月增加",
    "Needs upfront": "前期需要",
    "Monthly room after both": "两项决定后的每月空间",
    "Turn on another life move from the Life snapshot to compare it against this house.": "请在生活概况里开启另一个生活决定，用来和这套房比较。",
    "This house still leaves enough room for at least one other selected move.": "这套房之后，至少还有空间承担一个已选决定。",
    "There is some room after the house, but the next move would leave a thin buffer.": "买房后还有一些空间，但下一个决定会让缓冲变薄。",
    "This house should probably be the only big move for now. Another purchase would break cash flow or dip below the emergency floor.": "这套房现在可能应该是唯一的大决定。另一项购买会破坏现金流或低于应急底线。",
    "Time to your target": "达到目标所需时间",
    months: "个月",
    "You already have enough to close and keep your cushion.": "你已经有足够现金完成成交并保留缓冲。",
    "On track for around": "预计大约在",
    "At this savings rate you won't reach it — free up some monthly cash flow below.": "按这个储蓄速度还达不到；请在下方释放一些每月现金流。",
    Target: "目标",
    "Saved so far": "目前已存",
    "Still to go": "还差",
    "Cut monthly spending by": "每月减少支出",
    saving: "每月存",
    "ready now": "现在可以",
    never: "无法达到",
    target: "目标",
    Savings: "储蓄",
    Cushion: "缓冲",
    "Lose an income": "失去一份收入",
    "Costs rise": "成本上升",
    "Which income pauses?": "哪份收入暂停？",
    For: "持续",
    "Interest rate up": "利率上升",
    "Insurance up": "保险上升",
    "Your cushion lasts": "你的缓冲可维持",
    "Holds up": "撑得住",
    "Runs dry": "会耗尽",
    "Even with higher costs you stay cash-flow positive, so the cushion isn't drained.": "即使成本上升，你仍保持正现金流，所以缓冲不会被耗尽。",
    "Higher costs flip you to a monthly shortfall — the cushion drains in about months.": "成本上升会让你变成每月缺口，缓冲会在大约这些月份内耗尽。",
    "This emergency cushion survives the lost-income period with room left.": "这个应急缓冲能撑过失去收入的时期，并且还有余地。",
    "The cushion runs out before the income gap ends. A bigger cushion or lower payment closes it.": "缓冲会在收入缺口结束前耗尽。更大的缓冲或更低的付款可以补上。",
    "You are already saving more than this target needs. You could hit it sooner or aim for a larger down payment.": "你现在的储蓄已经超过这个目标所需。你可以更早达成，或提高首付目标。",
    "You are short of this target. Free up cash flow, stretch the timeline, or lower the down payment.": "你离这个目标还差一些。释放现金流、拉长时间，或降低首付。",
    "Estimates for planning, not a loan offer. Taxes, insurance, and PMI vary by lender and location — confirm real quotes before you commit.": "这些是规划估算，不是贷款报价。税、保险和 PMI 会因贷款机构和地点不同而变化；决定前请确认真实报价。",
    "Work backward: pick a timeline and a down payment, and see the monthly savings it takes to get there on this home.": "倒推计划：选择时间线和首付，看看为了买这套房每月需要存多少。",
    "Buy in": "在多少时间后购买：",
    year: "年",
    years: "年",
    "With down": "首付",
    "You'd need to save": "你需要每月存",
    "Need to save": "需要储蓄",
    "Saving now": "当前储蓄",
    "Current housing + utilities": "当前住房 + 水电等服务",
    "New rent": "新租金",
    "Roommate share": "室友分担",
    "New utilities": "新水电等服务",
    "Security deposit": "押金",
    "Moving costs": "搬家费用",
    "Furniture / setup": "家具 / 安置",
    "New rent after split": "分摊后的新租金",
    "New monthly housing": "新的每月住房成本",
    "Upfront cost": "前期成本",
    "Cash due today": "今天所需现金",
    "Loan interest": "贷款利息",
    "Current savings": "当前储蓄",
    "Loan payment": "贷款月供",
    "Car monthly cost": "汽车每月成本",
    "Savings today": "今天的储蓄",
    "Emergency cushion to keep": "要保留的应急缓冲",
    "Below cushion by": "低于缓冲",
    "Above cushion by": "高于缓冲",
    "Adopting a child": "领养孩子",
    "Having a baby": "生宝宝",
    "adds about": "大约增加",
    "Diapers / supplies": "尿布 / 用品",
    "Food / formula": "食物 / 奶粉",
    "Clothing / extras": "衣物 / 其他",
    "Adoption costs": "领养费用",
    "Medical out-of-pocket": "自付医疗费用",
    "Nursery / gear": "婴儿房 / 装备",
    "Leave income gap": "休假收入缺口",
    "Upfront total": "前期总额",
    "Add this child plan to my life": "把这个孩子计划加入我的生活",
    "This adds childcare and child-related groceries/supplies to your saved snapshot, then subtracts upfront from savings.": "这会把托育和孩子相关的食品/用品加入已保存概况，然后从储蓄中扣除前期成本。",
    "Choose life moves to check": "选择要查看的生活决定",
    "Stack moves together": "组合多个决定",
    "Connected plans": "关联计划",
    "Committed moves": "已确认决定",
    Glossary: "术语表",
    "Real life / actual expenses": "现实生活 / 实际支出",
    "Income — earner 1": "收入 - 收入者 1",
    "Income — earner 2": "收入 - 收入者 2",
    Internet: "网络",
    "Cable TV": "有线电视",
    "Streaming services": "流媒体服务",
    "Car payment": "车贷付款",
    "Car insurance": "汽车保险",
    "Car maintenance": "汽车维护",
    "Home maintenance": "房屋维护",
    "Debt payments": "债务付款",
    "Fun / discretionary": "娱乐 / 可自由支配",
    "Cushion to keep": "要保留的缓冲",
    "emergency floor": "应急底线",
    "gas, transit, parking": "油费、公交、停车",
    Inspection: "验房",
    "Closing costs": "成交费用",
    "PMI rate": "PMI 费率",
    PMI: "PMI",
    HOA: "HOA",
    Total: "总计",
    Home: "住房",
    Transport: "交通",
    "Current cushion": "当前余量",
    "Cut monthly spending": "减少每月支出",
    "Months without income": "无收入月数",
    "Rate increase": "利率上升",
    "Insurance increase": "保险上升",
    "Years to buy": "购房年限",
    "Down payment percent": "首付比例",
    "You're ready now": "你现在已经准备好",
    "Room left": "还有空间",
    "Tight room": "空间偏紧",
    "No extra room": "没有额外空间",
    "Having a child": "有孩子",
    HOME_PURCHASED: "已买房",
    CHILD_BORN: "宝宝出生",
    CHILD_ADOPTED: "已领养孩子",
    "Sales tax": "销售税",
    "Title / dealer fees": "产权 / 经销商费用",
    "Trade-in value": "旧车置换价值",
    "medical out-of-pocket": "自付医疗费用",
  },
  fil: {
    "Life snapshot": "Buod ng buhay",
    "Your life snapshot": "Buod ng buhay mo",
    "Save one life snapshot, test big decisions as scenarios, then commit the moves that become real so every other plan sees the new picture.": "I-save ang buod ng pera at buhay mo, subukan ang malalaking desisyon bilang plano, tapos kumpirmahin ang naging totoo para updated ang lahat ng ibang plano.",
    "Monthly cushion": "Buwanang allowance",
    "Current commitments": "Kasalukuyang bayarin",
    "Emergency runway": "Tagal ng emergency fund",
    "Housing status": "Sitwasyon sa tirahan",
    Renting: "Umuupa",
    Owned: "May-ari",
    Strong: "Matatag",
    Healthy: "Maayos",
    "Very tight": "Sobrang sikip",
    "Over budget": "Lampas sa budget",
    "Pick moves": "Pumili ng moves",
    "Fits together": "Kakayanin sabay",
    "Tight together": "Sikip kapag sabay",
    "Too much together": "Sobra kapag sabay",
    "Monthly impact": "Buwanang epekto",
    "Upfront cash": "Paunang pera",
    "Cushion after": "Matitira pagkatapos",
    "Savings after": "Ipon pagkatapos",
    "Emergency floor": "Minimum emergency fund",
    "Moves selected": "Napili",
    "Turn on only the scenarios you care about right now. Your choices are saved.": "Buksan lang ang mga planong gusto mong tingnan ngayon. Naka-save ang mga pinili mo.",
    "Mix scenarios to see whether a few big choices can fit at the same time.": "Pagsamahin ang mga plano para makita kung kakayanin ang ilang malalaking desisyon nang sabay.",
    "Choose two or more moves above when you want to test real-life temptation stacking.": "Pumili ng dalawa o higit pang desisyon sa taas para subukan ang sabay-sabay na tukso sa totoong buhay.",
    "Life snapshot is the saved baseline every plan reads from.": "Ang buod ng buhay ang naka-save na batayang binabasa ng lahat ng plano.",
    "These scenarios use your saved snapshot, so one real move changes the next one.": "Ginagamit ng mga planong ito ang naka-save mong buod, kaya ang isang tunay na desisyon ay nakakaapekto sa susunod.",
    "No committed moves yet. Use a module as a scenario, then add it to your life when it becomes real.": "Wala pang nakumpirmang desisyon. Gamitin muna ang isang bahagi bilang plano, tapos idagdag sa buhay mo kapag totoo na.",
    "Committed moves are real changes already applied to your snapshot.": "Ang nakumpirmang desisyon ay totoong pagbabagong nailagay na sa buod mo.",
    "Pick at least one life move above to show connected plan cards.": "Pumili muna ng kahit isang desisyon sa taas para lumabas ang magkakaugnay na plano.",
    "Actual monthly spending": "Totoong buwanang gastos",
    "Current housing": "Kasalukuyang tirahan",
    "Actual monthly picture": "Totoong buwanang larawan",
    "This is the saved baseline every life move uses. Change it here first, then test scenarios.": "Ito ang naka-save na batayan na ginagamit ng bawat desisyon. Baguhin muna dito, tapos subukan ang mga plano.",
    "This is your actual baseline. Life moves should be judged against this, not against numbers hidden inside one scenario.": "Ito ang totoong batayan mo. Dito dapat ikumpara ang malalaking desisyon, hindi sa numerong nakatago sa isang plano.",
    "Household income": "Kita ng household",
    "Earner 1": "Kumikita 1",
    "Earner 2": "Kumikita 2",
    Housing: "Tirahan",
    Debt: "Utang",
    Fun: "Luho / saya",
    "Other subscriptions": "Ibang subscriptions",
    "Monthly money in": "Buwanang pumapasok",
    "Monthly money out": "Buwanang lumalabas",
    "Total monthly impact": "Kabuuang buwanang epekto",
    "Total upfront cash": "Kabuuang paunang pera",
    "Ready now": "Pwede na ngayon",
    "Not yet": "Hindi pa",
    "after purchase": "pagkatapos bumili",
    upfront: "pauna",
    Open: "Maluwag",
    "housing, bills, debts, lifestyle": "tirahan, bayarin, utang, pamumuhay",
    Household: "Household",
    "Mortgage / home cost": "Utang sa bahay / gastos sa bahay",
    "Rent today": "Renta ngayon",
    Own: "Pag-aari",
    "Estimated loan payment": "Tinatayang bayad sa loan",
    "This move changes monthly life by": "Babaguhin ng paglipat ang buwanang buhay ng",
    "This car adds": "Idadagdag ng kotse na ito ang",
    "Plain-language definitions for terms people may not know yet.": "Simpleng paliwanag sa mga salitang pang-pera na maaaring hindi pa pamilyar.",
    "Auto-saved": "Awtomatikong naka-save",
    "Monthly stack": "Pinagsamang buwanang epekto",
    "Cash stack": "Pinagsamang pera",
    "Buying a home and renting/moving are usually alternate housing paths, so compare them separately unless you truly expect both.": "Ang pagbili ng bahay at pagrenta/paglipat ay kadalasang magkaibang landas sa tirahan, kaya ikumpara nang hiwalay maliban kung talagang gagawin mo pareho.",
    "This combination breaks either monthly cushion or emergency savings. It needs a smaller move, more cash, or more income.": "Sinisira ng kombinasyong ito ang buwanang allowance o emergency na ipon. Kailangan ng mas maliit na desisyon, mas maraming pera, o mas mataas na kita.",
    "This combination can work, but it leaves little room for surprises.": "Pwede itong gumana, pero kaunti ang natitirang puwang para sa biglaang gastos.",
    "This combination keeps monthly cushion and emergency savings intact.": "Pinapanatili nitong buo ang buwanang allowance at emergency na ipon.",
    "After this house, check whether another big plan still fits without breaking the monthly cushion or emergency floor.": "Pagkatapos ng bahay na ito, tingnan kung kasya pa ang isa pang malaking plano nang hindi sinisira ang buwanang allowance o emergency floor.",
    "Buy the car scenario": "Bilhin ang plano sa kotse",
    "Adopt a child": "Mag-ampon ng anak",
    "Have a baby": "Magka-baby",
    "Savings after both": "Ipon pagkatapos ng dalawa",
    "Cushion after move": "Matitira pagkatapos lumipat",
    "Cushion after car": "Matitira pagkatapos ng kotse",
    "Savings after car": "Ipon pagkatapos ng kotse",
    "Rent / move scenario": "Plano sa renta / lipat",
    "Car scenario": "Plano sa kotse",
    "Baby / child scenario": "Plano sa baby / anak",
    Path: "Landas",
    "Monthly child costs": "Buwanang gastos sa anak",
    "One-time / early costs": "Isahang / maagang gastos",
    "This is a planning estimate. Real costs can swing a lot by insurance, family help, leave policy, adoption path, and local childcare prices.": "Tantiya ito para sa pagpaplano. Pwedeng magbago nang malaki ang tunay na gastos dahil sa seguro, tulong ng pamilya, patakaran sa leave, landas ng pag-ampon, at presyo ng pag-aalaga ng bata sa lugar mo.",
    "A move should leave enough monthly cushion for surprises after rent, bills, and normal life.": "Dapat mag-iwan ang paglipat ng sapat na buwanang allowance para sa biglaang gastos pagkatapos ng renta, bayarin, at normal na buhay.",
    "The monthly payment works, but the down payment leaves savings below your emergency cushion.": "Kaya ang buwanang bayad, pero ang paunang bayad ay mag-iiwan ng ipon na mas mababa sa emergency allowance mo.",
    "This can work, but it leaves a thin buffer. A lower price, bigger down payment, or shorter term may make it sturdier.": "Pwede ito, pero manipis ang reserba. Mas mababang presyo, mas malaking paunang bayad, o mas maikling panahon ang pwedeng magpatatag.",
    "This keeps your monthly cushion positive and leaves savings above your emergency floor.": "Pinapanatili nitong positibo ang buwanang allowance at mas mataas ang ipon kaysa emergency floor.",
    "This car creates a monthly shortfall. The payment and car costs are more than your current monthly cushion.": "Gagawa ng buwanang kakulangan ang kotse na ito. Mas mataas ang bayad at gastos sa kotse kaysa kasalukuyang buwanang allowance mo.",
    Payment: "Bayad",
    Fuel: "Gasolina / charging",
    "Gas / charging": "Gasolina / charging",
    "Amount financed": "Halagang ilo-loan",
    "Total interest": "Kabuuang tubo",
    "Down payment today": "Paunang bayad ngayon",
    "Savings after down": "Ipon pagkatapos ng paunang bayad",
    "Health insurance": "Seguro sa kalusugan",
    Supplies: "Gamit",
    Food: "Pagkain",
    Clothing: "Damit",
    "College savings": "Ipon para sa kolehiyo",
    "Medical / adoption": "Medikal / pag-ampon",
    "Nursery gear": "Gamit sa nursery",
    "Leave income loss": "Nawalang kita sa leave",
    Birth: "Panganganak",
    Adoption: "Pag-ampon",
    "Monthly home cost": "Buwanang gastos sa bahay",
    "payment, tax, insurance, HOA, utilities": "bayad, buwis, seguro, HOA, serbisyo sa bahay",
    "Cash to buy": "Perang kailangan para bumili",
    "Left to save after buying": "Matitirang naiipon pagkatapos bumili",
    "Until you're ready": "Hanggang handa ka na",
    "to cover down payment + cushion": "para sa paunang bayad + allowance",
    "PMI on": "May PMI",
    "no PMI": "walang PMI",
    "of loan / yr, while under 20%": "ng utang kada taon habang mas mababa sa 20%",
    "Your agent commission": "Komisyon ng agent mo",
    "your share, if any": "parte mo, kung meron",
    "of price": "ng presyo",
    "Cash to close": "Perang kailangan sa closing",
    "Property tax": "Buwis sa property",
    "of home value / yr": "ng halaga ng bahay kada taon",
    "Homeowners insurance": "Seguro ng may-ari ng bahay",
    "per year": "kada taon",
    "After buying, you'd save": "Pagkatapos bumili, maiipon mo",
    "of income": "ng kita",
    today: "ngayon",
    from: "mula",
    around: "mga",
    "Not at this rate": "Hindi sa ganitong bilis",
    Off: "Naka-off",
    "This budget goes over. The home cost plus current spending is more than your income — something has to give before this works.": "Lalampas sa budget ito. Mas mataas ang gastos sa bahay plus kasalukuyang gastos kaysa kita mo, kaya may kailangang baguhin bago gumana.",
    "Savings drop below a healthy floor. You'd still be positive, but with little room for surprises.": "Bababa ang ipon sa healthy floor. Positibo pa rin, pero kaunti ang puwang para sa biglaang gastos.",
    "Savings stay healthy after the purchase. Run the stress test to see how a rough patch would feel.": "Maayos pa rin ang ipon pagkatapos bumili. Gamitin ang pagsubok sa hirap para makita ang pakiramdam kapag may mahirap na buwan.",
    "Add this home to my life": "Idagdag ang bahay na ito sa buhay ko",
    "This saves the home as real, subtracts cash to close from savings, and updates your shared snapshot.": "Isi-save nito ang bahay bilang totoo, ibabawas ang perang kailangan sa closing sa ipon, at ia-update ang buod mo.",
    Now: "Ngayon",
    "After buying": "Pagkatapos bumili",
    "Rent + utilities": "Renta + serbisyo sa bahay",
    "Internet + media": "Internet + libangan",
    Vehicle: "Sasakyan",
    "Home upkeep": "Pagpapanatili ng bahay",
    Media: "Libangan",
    Upkeep: "Pagpapanatili",
    "Principal & interest": "Principal at tubo",
    "Home (all-in)": "Bahay (lahat kasama)",
    "For savings": "Para sa ipon",
    "Monthly room after home": "Buwanang puwang pagkatapos ng bahay",
    "Cash after closing": "Pera pagkatapos ng closing",
    "Cash above floor": "Pera lampas sa minimum",
    "Adds monthly": "Idinadagdag buwan-buwan",
    "Needs upfront": "Kailangan sa umpisa",
    "Monthly room after both": "Buwanang puwang pagkatapos ng dalawa",
    "Turn on another life move from the Life snapshot to compare it against this house.": "Buksan ang isa pang desisyon mula sa Buod ng buhay para ikumpara sa bahay na ito.",
    "This house still leaves enough room for at least one other selected move.": "Nag-iiwan pa rin ang bahay na ito ng puwang para sa kahit isang napiling desisyon.",
    "There is some room after the house, but the next move would leave a thin buffer.": "May kaunting puwang pagkatapos ng bahay, pero manipis ang reserba kapag may susunod na desisyon.",
    "This house should probably be the only big move for now. Another purchase would break cash flow or dip below the emergency floor.": "Mas mabuting ito muna ang tanging malaking desisyon ngayon. Ang isa pang bili ay sisira sa daloy ng pera o bababa sa emergency floor.",
    "Time to your target": "Panahon hanggang target",
    months: "buwan",
    "You already have enough to close and keep your cushion.": "May sapat ka na para mag-close at panatilihin ang cushion.",
    "On track for around": "Nasa tamang takbo sa mga",
    "At this savings rate you won't reach it — free up some monthly cash flow below.": "Sa ganitong savings rate, hindi mo maaabot; mag-free up ng monthly cash flow sa ibaba.",
    Target: "Layunin",
    "Saved so far": "Naipon na",
    "Still to go": "Kulang pa",
    "Cut monthly spending by": "Bawasan ang buwanang gastos ng",
    saving: "naiipon",
    "ready now": "pwede na ngayon",
    never: "hindi maaabot",
    target: "layunin",
    Savings: "Ipon",
    Cushion: "Allowance",
    "Lose an income": "Mawalan ng kita",
    "Costs rise": "Tumaas ang gastos",
    "Which income pauses?": "Aling kita ang titigil?",
    For: "Sa loob ng",
    "Interest rate up": "Taas ng interest rate",
    "Insurance up": "Taas ng insurance",
    "Your cushion lasts": "Tatagal ang allowance mo ng",
    "Holds up": "Kakayanin",
    "Runs dry": "Mauubos",
    "Even with higher costs you stay cash-flow positive, so the cushion isn't drained.": "Kahit tumaas ang gastos, positibo pa rin ang daloy ng pera kaya hindi mauubos ang allowance.",
    "Higher costs flip you to a monthly shortfall — the cushion drains in about months.": "Kapag tumaas ang gastos, magkakaroon ng buwanang kakulangan at mauubos ang allowance sa tinatayang buwan na iyon.",
    "This emergency cushion survives the lost-income period with room left.": "Kakayanin ng emergency allowance ang panahon na walang kita at may matitira pa.",
    "The cushion runs out before the income gap ends. A bigger cushion or lower payment closes it.": "Mauubos ang allowance bago matapos ang kulang sa kita. Mas malaking allowance o mas mababang bayad ang makakasara nito.",
    "You are already saving more than this target needs. You could hit it sooner or aim for a larger down payment.": "Mas malaki na ang naiipon mo kaysa kailangan ng layunin. Pwede mong maabot nang mas maaga o taasan ang paunang bayad.",
    "You are short of this target. Free up cash flow, stretch the timeline, or lower the down payment.": "Kulang ka pa sa layunin. Magpaluwag ng daloy ng pera, pahabain ang panahon, o babaan ang paunang bayad.",
    "Estimates for planning, not a loan offer. Taxes, insurance, and PMI vary by lender and location — confirm real quotes before you commit.": "Tantiya lang ito para sa pagpaplano, hindi alok ng utang. Nag-iiba ang buwis, seguro, at PMI depende sa nagpapautang at lokasyon; kumpirmahin ang totoong quote bago magdesisyon.",
    "Work backward: pick a timeline and a down payment, and see the monthly savings it takes to get there on this home.": "Magplano pabalik: pumili ng panahon at paunang bayad, tapos tingnan kung magkano ang kailangang ipunin buwan-buwan para sa bahay na ito.",
    "Buy in": "Bumili sa loob ng",
    year: "taon",
    years: "taon",
    "With down": "May paunang bayad na",
    "You'd need to save": "Kailangan mong mag-ipon ng",
    "Need to save": "Kailangang ipunin",
    "Saving now": "Naiipon ngayon",
    "Current housing + utilities": "Kasalukuyang tirahan + serbisyo sa bahay",
    "New rent": "Bagong renta",
    "Roommate share": "Ambag ng roommate",
    "New utilities": "Bagong utilities",
    "Security deposit": "Deposito sa seguridad",
    "Moving costs": "Gastos sa lipat",
    "Furniture / setup": "Muwebles / pag-aayos",
    "New rent after split": "Bagong renta pagkatapos hatiin",
    "New monthly housing": "Bagong buwanang tirahan",
    "Upfront cost": "Gastos sa umpisa",
    "Cash due today": "Perang kailangan ngayon",
    "Loan interest": "Tubo ng utang",
    "Current savings": "Kasalukuyang ipon",
    "Loan payment": "Bayad sa utang",
    "Car monthly cost": "Buwanang gastos sa kotse",
    "Savings today": "Ipon ngayon",
    "Emergency cushion to keep": "Emergency allowance na itatabi",
    "Below cushion by": "Kulang sa allowance ng",
    "Above cushion by": "Labis sa allowance ng",
    "Adopting a child": "Pag-aampon ng anak",
    "Having a baby": "Pagkakaroon ng sanggol",
    "adds about": "magdadagdag ng humigit-kumulang",
    "Diapers / supplies": "Diaper / gamit",
    "Food / formula": "Pagkain / gatas",
    "Clothing / extras": "Damit / dagdag",
    "Adoption costs": "Gastos sa pag-ampon",
    "Medical out-of-pocket": "Sariling bayad sa medikal",
    "Nursery / gear": "Silid ng sanggol / gamit",
    "Leave income gap": "Kulang sa kita habang naka-leave",
    "Upfront total": "Kabuuang pauna",
    "Add this child plan to my life": "Idagdag ang planong ito para sa anak sa buhay ko",
    "This adds childcare and child-related groceries/supplies to your saved snapshot, then subtracts upfront from savings.": "Idadagdag nito ang pag-aalaga ng bata at pagkain/gamit ng bata sa naka-save mong buod, tapos ibabawas ang paunang gastos sa ipon.",
    "Choose life moves to check": "Piliin ang mga desisyong susuriin",
    "Stack moves together": "Pagsamahin ang mga desisyon",
    "Connected plans": "Magkakaugnay na plano",
    "Committed moves": "Nakumpirmang desisyon",
    Glossary: "Talasalitaan",
    "Real life / actual expenses": "Totoong buhay / totoong gastos",
    "Income — earner 1": "Kita - kumikita 1",
    "Income — earner 2": "Kita - kumikita 2",
    Internet: "Internet",
    "Cable TV": "Cable TV",
    "Streaming services": "Serbisyo sa streaming",
    "Car payment": "Bayad sa kotse",
    "Car insurance": "Seguro ng kotse",
    "Car maintenance": "Pagpapanatili ng kotse",
    "Home maintenance": "Pagpapanatili ng bahay",
    "Debt payments": "Bayad sa utang",
    "Fun / discretionary": "Luho / maluwag na gastos",
    "Cushion to keep": "Allowance na itatabi",
    "emergency floor": "emergency minimum",
    "gas, transit, parking": "gasolina, biyahe, paradahan",
    Inspection: "Inspeksyon",
    "Closing costs": "Gastos sa closing",
    "PMI rate": "Rate ng PMI",
    PMI: "PMI",
    HOA: "HOA",
    Total: "Kabuuan",
    Home: "Bahay",
    Transport: "Transportasyon",
    "Current cushion": "Kasalukuyang allowance",
    "Cut monthly spending": "Bawasan ang buwanang gastos",
    "Months without income": "Buwan na walang kita",
    "Rate increase": "Taas ng rate",
    "Insurance increase": "Taas ng insurance",
    "Years to buy": "Taon bago bumili",
    "Down payment percent": "Porsyento ng paunang bayad",
    "You're ready now": "Handa ka na ngayon",
    "Room left": "May puwang pa",
    "Tight room": "Masikip na puwang",
    "No extra room": "Walang sobrang puwang",
    "Having a child": "Pagkakaroon ng anak",
    HOME_PURCHASED: "Nabiling bahay",
    CHILD_BORN: "Ipinanganak ang anak",
    CHILD_ADOPTED: "Naampon ang anak",
    "Sales tax": "Buwis sa pagbili",
    "Title / dealer fees": "Bayad sa titulo / dealer",
    "Trade-in value": "Halaga ng ipapalit na sasakyan",
    "medical out-of-pocket": "sariling bayad sa medikal",
  },
  vi: {
    "Life snapshot": "Tổng quan cuộc sống",
    "Your life snapshot": "Tổng quan cuộc sống của bạn",
    "Save one life snapshot, test big decisions as scenarios, then commit the moves that become real so every other plan sees the new picture.": "Lưu một bức tranh tài chính hiện tại, thử các quyết định lớn dưới dạng kịch bản, rồi xác nhận những thay đổi đã thành thật để mọi kế hoạch khác dùng tình hình mới.",
    "Monthly cushion": "Khoản dư hằng tháng",
    "Current commitments": "Cam kết hiện tại",
    "Emergency runway": "Thời gian dự phòng",
    "Housing status": "Tình trạng nhà ở",
    Renting: "Đang thuê",
    Owned: "Sở hữu",
    Strong: "Vững",
    Healthy: "Ổn",
    "Very tight": "Rất căng",
    "Over budget": "Vượt ngân sách",
    "Pick moves": "Chọn kế hoạch",
    "Fits together": "Có thể đi cùng nhau",
    "Tight together": "Đi cùng hơi căng",
    "Too much together": "Quá nhiều cùng lúc",
    "Monthly impact": "Tác động hằng tháng",
    "Upfront cash": "Tiền ban đầu",
    "Cushion after": "Dư sau đó",
    "Savings after": "Tiết kiệm sau đó",
    "Emergency floor": "Mức dự phòng tối thiểu",
    "Moves selected": "Đã chọn",
    "Turn on only the scenarios you care about right now. Your choices are saved.": "Chỉ bật những kịch bản bạn muốn xem lúc này. Lựa chọn của bạn sẽ được lưu.",
    "Mix scenarios to see whether a few big choices can fit at the same time.": "Kết hợp các kịch bản để xem vài quyết định lớn có thể xảy ra cùng lúc không.",
    "Choose two or more moves above when you want to test real-life temptation stacking.": "Chọn hai quyết định trở lên ở trên khi bạn muốn thử nhiều cám dỗ đời thật cùng lúc.",
    "Life snapshot is the saved baseline every plan reads from.": "Tổng quan cuộc sống là nền tảng đã lưu mà mọi kế hoạch đều dùng.",
    "These scenarios use your saved snapshot, so one real move changes the next one.": "Các kịch bản này dùng tổng quan đã lưu, nên một thay đổi thật sẽ ảnh hưởng kế hoạch tiếp theo.",
    "No committed moves yet. Use a module as a scenario, then add it to your life when it becomes real.": "Chưa có quyết định nào được xác nhận. Hãy dùng một mục như kịch bản, rồi thêm vào cuộc sống khi nó thành thật.",
    "Committed moves are real changes already applied to your snapshot.": "Các quyết định đã xác nhận là thay đổi thật đã áp dụng vào tổng quan của bạn.",
    "Pick at least one life move above to show connected plan cards.": "Chọn ít nhất một quyết định ở trên để hiện các thẻ kế hoạch liên kết.",
    "Actual monthly spending": "Chi tiêu thật hằng tháng",
    "Current housing": "Nhà ở hiện tại",
    "Actual monthly picture": "Bức tranh hằng tháng hiện tại",
    "This is the saved baseline every life move uses. Change it here first, then test scenarios.": "Đây là nền tảng đã lưu mà mọi quyết định đều dùng. Sửa ở đây trước, rồi thử kịch bản.",
    "This is your actual baseline. Life moves should be judged against this, not against numbers hidden inside one scenario.": "Đây là nền tảng thật của bạn. Các quyết định lớn nên được so với phần này, không phải các con số ẩn trong một kịch bản.",
    "Household income": "Thu nhập hộ gia đình",
    "Earner 1": "Người kiếm tiền 1",
    "Earner 2": "Người kiếm tiền 2",
    Housing: "Nhà ở",
    Debt: "Nợ",
    Fun: "Giải trí",
    "Other subscriptions": "Gói đăng ký khác",
    "Monthly money in": "Tiền vào hằng tháng",
    "Monthly money out": "Tiền ra hằng tháng",
    "Total monthly impact": "Tổng tác động hằng tháng",
    "Total upfront cash": "Tổng tiền ban đầu",
    "Ready now": "Sẵn sàng ngay",
    "Not yet": "Chưa",
    "after purchase": "sau khi mua",
    upfront: "ban đầu",
    Open: "Mở",
    "housing, bills, debts, lifestyle": "nhà ở, hóa đơn, nợ, lối sống",
    Household: "Hộ gia đình",
    "Mortgage / home cost": "Thế chấp / chi phí nhà",
    "Rent today": "Tiền thuê hiện tại",
    Own: "Sở hữu",
    "Estimated loan payment": "Khoản vay ước tính",
    "This move changes monthly life by": "Việc chuyển nhà này thay đổi mỗi tháng khoảng",
    "This car adds": "Xe này thêm",
    "Plain-language definitions for terms people may not know yet.": "Giải thích dễ hiểu cho các thuật ngữ tài chính có thể còn lạ.",
    "Auto-saved": "Tự động lưu",
    "Monthly stack": "Tác động hằng tháng gộp",
    "Cash stack": "Tiền mặt gộp",
    "Buying a home and renting/moving are usually alternate housing paths, so compare them separately unless you truly expect both.": "Mua nhà và thuê/chuyển nhà thường là hai hướng nhà ở khác nhau, nên hãy so riêng trừ khi bạn thật sự dự định làm cả hai.",
    "This combination breaks either monthly cushion or emergency savings. It needs a smaller move, more cash, or more income.": "Tổ hợp này làm vỡ khoản dư hằng tháng hoặc tiền dự phòng. Cần quyết định nhỏ hơn, nhiều tiền mặt hơn, hoặc thêm thu nhập.",
    "This combination can work, but it leaves little room for surprises.": "Tổ hợp này có thể được, nhưng còn rất ít chỗ cho bất ngờ.",
    "This combination keeps monthly cushion and emergency savings intact.": "Tổ hợp này giữ được khoản dư hằng tháng và quỹ dự phòng.",
    "After this house, check whether another big plan still fits without breaking the monthly cushion or emergency floor.": "Sau căn nhà này, kiểm tra xem kế hoạch lớn khác còn vừa không mà không phá khoản dư hằng tháng hoặc mức dự phòng tối thiểu.",
    "Buy the car scenario": "Mua xe trong kịch bản này",
    "Adopt a child": "Nhận con nuôi",
    "Have a baby": "Sinh em bé",
    "Savings after both": "Tiết kiệm sau cả hai",
    "Cushion after move": "Dư sau khi chuyển",
    "Cushion after car": "Dư sau khi mua xe",
    "Savings after car": "Tiết kiệm sau khi mua xe",
    "Rent / move scenario": "Kịch bản thuê / chuyển nhà",
    "Car scenario": "Kịch bản mua xe",
    "Baby / child scenario": "Kịch bản em bé / con",
    Path: "Hướng",
    "Monthly child costs": "Chi phí con hằng tháng",
    "One-time / early costs": "Chi phí một lần / ban đầu",
    "This is a planning estimate. Real costs can swing a lot by insurance, family help, leave policy, adoption path, and local childcare prices.": "Đây là ước tính để lập kế hoạch. Chi phí thật có thể thay đổi nhiều theo bảo hiểm, hỗ trợ gia đình, chính sách nghỉ phép, cách nhận con nuôi và giá giữ trẻ địa phương.",
    "A move should leave enough monthly cushion for surprises after rent, bills, and normal life.": "Chuyển nhà vẫn nên để lại đủ khoản dư hằng tháng cho bất ngờ sau tiền thuê, hóa đơn và cuộc sống bình thường.",
    "The monthly payment works, but the down payment leaves savings below your emergency cushion.": "Khoản trả hằng tháng có thể chịu được, nhưng tiền đặt cọc làm tiết kiệm xuống dưới mức dự phòng.",
    "This can work, but it leaves a thin buffer. A lower price, bigger down payment, or shorter term may make it sturdier.": "Có thể được, nhưng phần đệm khá mỏng. Giá thấp hơn, trả trước nhiều hơn, hoặc kỳ hạn ngắn hơn sẽ vững hơn.",
    "This keeps your monthly cushion positive and leaves savings above your emergency floor.": "Điều này giữ khoản dư hằng tháng dương và tiết kiệm cao hơn mức dự phòng tối thiểu.",
    "This car creates a monthly shortfall. The payment and car costs are more than your current monthly cushion.": "Xe này tạo thiếu hụt hằng tháng. Khoản trả và chi phí xe cao hơn khoản dư hiện tại.",
    Payment: "Khoản trả",
    Fuel: "Xăng / sạc",
    "Gas / charging": "Xăng / sạc",
    "Amount financed": "Số tiền vay",
    "Total interest": "Tổng lãi",
    "Down payment today": "Tiền trả trước hôm nay",
    "Savings after down": "Tiết kiệm sau trả trước",
    "Health insurance": "Bảo hiểm y tế",
    Supplies: "Đồ dùng",
    Food: "Thức ăn",
    Clothing: "Quần áo",
    "College savings": "Tiết kiệm đại học",
    "Medical / adoption": "Y tế / nhận con nuôi",
    "Nursery gear": "Đồ phòng em bé",
    "Leave income loss": "Mất thu nhập khi nghỉ phép",
    Birth: "Sinh con",
    Adoption: "Nhận con nuôi",
    "Monthly home cost": "Chi phí nhà hằng tháng",
    "payment, tax, insurance, HOA, utilities": "khoản trả, thuế, bảo hiểm, HOA, tiện ích",
    "Cash to buy": "Tiền mặt để mua",
    "Left to save after buying": "Còn lại để tiết kiệm sau khi mua",
    "Until you're ready": "Đến khi sẵn sàng",
    "to cover down payment + cushion": "để đủ tiền trả trước + phần đệm",
    "PMI on": "Có PMI",
    "no PMI": "không PMI",
    "of loan / yr, while under 20%": "của khoản vay / năm khi dưới 20%",
    "Your agent commission": "Hoa hồng môi giới của bạn",
    "your share, if any": "phần của bạn, nếu có",
    "of price": "của giá",
    "Cash to close": "Tiền mặt khi chốt",
    "Property tax": "Thuế tài sản",
    "of home value / yr": "của giá trị nhà / năm",
    "Homeowners insurance": "Bảo hiểm nhà",
    "per year": "mỗi năm",
    "After buying, you'd save": "Sau khi mua, bạn sẽ tiết kiệm",
    "of income": "thu nhập",
    today: "hôm nay",
    from: "từ",
    around: "khoảng",
    "Not at this rate": "Không với tốc độ này",
    Off: "Tắt",
    "This budget goes over. The home cost plus current spending is more than your income — something has to give before this works.": "Ngân sách này bị vượt. Chi phí nhà cộng chi tiêu hiện tại cao hơn thu nhập, nên cần thay đổi trước khi khả thi.",
    "Savings drop below a healthy floor. You'd still be positive, but with little room for surprises.": "Tiết kiệm rơi xuống dưới mức an toàn. Vẫn còn dương, nhưng rất ít chỗ cho bất ngờ.",
    "Savings stay healthy after the purchase. Run the stress test to see how a rough patch would feel.": "Tiết kiệm vẫn ổn sau khi mua. Hãy chạy kiểm tra áp lực để xem giai đoạn khó sẽ ra sao.",
    "Add this home to my life": "Thêm căn nhà này vào cuộc sống",
    "This saves the home as real, subtracts cash to close from savings, and updates your shared snapshot.": "Điều này lưu căn nhà như quyết định thật, trừ tiền chốt khỏi tiết kiệm và cập nhật tổng quan chung.",
    Now: "Hiện tại",
    "After buying": "Sau khi mua",
    "Rent + utilities": "Thuê + tiện ích",
    "Internet + media": "Internet + giải trí",
    Vehicle: "Xe",
    "Home upkeep": "Bảo trì nhà",
    Media: "Giải trí",
    Upkeep: "Bảo trì",
    "Principal & interest": "Gốc và lãi",
    "Home (all-in)": "Nhà (tất cả)",
    "For savings": "Để tiết kiệm",
    "Monthly room after home": "Khoảng trống hằng tháng sau nhà",
    "Cash after closing": "Tiền mặt sau khi chốt",
    "Cash above floor": "Tiền mặt trên mức tối thiểu",
    "Adds monthly": "Thêm mỗi tháng",
    "Needs upfront": "Cần ban đầu",
    "Monthly room after both": "Khoảng trống hằng tháng sau cả hai",
    "Turn on another life move from the Life snapshot to compare it against this house.": "Bật một quyết định khác từ Tổng quan cuộc sống để so với căn nhà này.",
    "This house still leaves enough room for at least one other selected move.": "Căn nhà này vẫn để đủ chỗ cho ít nhất một quyết định đã chọn khác.",
    "There is some room after the house, but the next move would leave a thin buffer.": "Sau căn nhà vẫn còn chút chỗ, nhưng quyết định tiếp theo sẽ để phần đệm mỏng.",
    "This house should probably be the only big move for now. Another purchase would break cash flow or dip below the emergency floor.": "Có lẽ căn nhà này nên là quyết định lớn duy nhất lúc này. Mua thêm sẽ phá dòng tiền hoặc xuống dưới mức dự phòng.",
    "Time to your target": "Thời gian đến mục tiêu",
    months: "tháng",
    "You already have enough to close and keep your cushion.": "Bạn đã đủ tiền để chốt và giữ phần đệm.",
    "On track for around": "Đang đúng hướng khoảng",
    "At this savings rate you won't reach it — free up some monthly cash flow below.": "Với tốc độ tiết kiệm này bạn sẽ không đạt; hãy giải phóng thêm dòng tiền hằng tháng bên dưới.",
    Target: "Mục tiêu",
    "Saved so far": "Đã tiết kiệm",
    "Still to go": "Còn thiếu",
    "Cut monthly spending by": "Giảm chi tiêu hằng tháng",
    saving: "đang tiết kiệm",
    "ready now": "sẵn sàng ngay",
    never: "không đạt",
    target: "mục tiêu",
    Savings: "Tiết kiệm",
    Cushion: "Phần đệm",
    "Lose an income": "Mất một nguồn thu",
    "Costs rise": "Chi phí tăng",
    "Which income pauses?": "Nguồn thu nào dừng?",
    For: "Trong",
    "Interest rate up": "Lãi suất tăng",
    "Insurance up": "Bảo hiểm tăng",
    "Your cushion lasts": "Phần đệm kéo dài",
    "Holds up": "Chịu được",
    "Runs dry": "Cạn tiền",
    "Even with higher costs you stay cash-flow positive, so the cushion isn't drained.": "Ngay cả khi chi phí cao hơn, dòng tiền vẫn dương nên phần đệm không bị rút cạn.",
    "Higher costs flip you to a monthly shortfall — the cushion drains in about months.": "Chi phí cao hơn khiến bạn thiếu hụt hằng tháng, phần đệm sẽ cạn trong khoảng số tháng đó.",
    "This emergency cushion survives the lost-income period with room left.": "Phần đệm khẩn cấp này chịu được giai đoạn mất thu nhập và vẫn còn dư.",
    "The cushion runs out before the income gap ends. A bigger cushion or lower payment closes it.": "Phần đệm cạn trước khi khoảng trống thu nhập kết thúc. Phần đệm lớn hơn hoặc khoản trả thấp hơn sẽ giải quyết.",
    "You are already saving more than this target needs. You could hit it sooner or aim for a larger down payment.": "Bạn đang tiết kiệm nhiều hơn mục tiêu này cần. Có thể đạt sớm hơn hoặc đặt mục tiêu trả trước cao hơn.",
    "You are short of this target. Free up cash flow, stretch the timeline, or lower the down payment.": "Bạn còn thiếu so với mục tiêu này. Hãy giải phóng dòng tiền, kéo dài thời gian, hoặc giảm tiền trả trước.",
    "Estimates for planning, not a loan offer. Taxes, insurance, and PMI vary by lender and location — confirm real quotes before you commit.": "Đây là ước tính để lập kế hoạch, không phải đề nghị vay. Thuế, bảo hiểm và PMI thay đổi theo nơi cho vay và địa điểm; hãy xác nhận báo giá thật trước khi quyết định.",
    "Work backward: pick a timeline and a down payment, and see the monthly savings it takes to get there on this home.": "Lập kế hoạch ngược: chọn thời gian và tiền trả trước, rồi xem cần tiết kiệm bao nhiêu mỗi tháng để mua căn nhà này.",
    "Buy in": "Mua trong",
    year: "năm",
    years: "năm",
    "With down": "Trả trước",
    "You'd need to save": "Bạn cần tiết kiệm",
    "Need to save": "Cần tiết kiệm",
    "Saving now": "Đang tiết kiệm",
    "Current housing + utilities": "Nhà hiện tại + tiện ích",
    "New rent": "Tiền thuê mới",
    "Roommate share": "Phần bạn cùng nhà trả",
    "New utilities": "Tiện ích mới",
    "Security deposit": "Tiền đặt cọc",
    "Moving costs": "Chi phí chuyển nhà",
    "Furniture / setup": "Nội thất / sắp xếp",
    "New rent after split": "Tiền thuê mới sau chia sẻ",
    "New monthly housing": "Chi phí nhà mới hằng tháng",
    "Upfront cost": "Chi phí ban đầu",
    "Cash due today": "Tiền mặt cần hôm nay",
    "Loan interest": "Lãi vay",
    "Current savings": "Tiết kiệm hiện tại",
    "Loan payment": "Khoản trả vay",
    "Car monthly cost": "Chi phí xe hằng tháng",
    "Savings today": "Tiết kiệm hôm nay",
    "Emergency cushion to keep": "Phần đệm khẩn cấp cần giữ",
    "Below cushion by": "Thấp hơn phần đệm",
    "Above cushion by": "Cao hơn phần đệm",
    "Adopting a child": "Nhận con nuôi",
    "Having a baby": "Sinh em bé",
    "adds about": "thêm khoảng",
    "Diapers / supplies": "Tã / đồ dùng",
    "Food / formula": "Thức ăn / sữa",
    "Clothing / extras": "Quần áo / đồ thêm",
    "Adoption costs": "Chi phí nhận con nuôi",
    "Medical out-of-pocket": "Chi phí y tế tự trả",
    "Nursery / gear": "Phòng em bé / đồ dùng",
    "Leave income gap": "Thiếu hụt thu nhập khi nghỉ phép",
    "Upfront total": "Tổng ban đầu",
    "Add this child plan to my life": "Thêm kế hoạch con vào cuộc sống",
    "This adds childcare and child-related groceries/supplies to your saved snapshot, then subtracts upfront from savings.": "Điều này thêm chi phí giữ trẻ và đồ ăn/đồ dùng cho con vào tổng quan đã lưu, rồi trừ chi phí ban đầu khỏi tiết kiệm.",
    "Choose life moves to check": "Chọn quyết định muốn kiểm tra",
    "Stack moves together": "Gộp các quyết định",
    "Connected plans": "Kế hoạch liên kết",
    "Committed moves": "Quyết định đã xác nhận",
    Glossary: "Thuật ngữ",
    "Real life / actual expenses": "Đời thật / chi phí thực tế",
    "Income — earner 1": "Thu nhập - người 1",
    "Income — earner 2": "Thu nhập - người 2",
    Internet: "Internet",
    "Cable TV": "Truyền hình cáp",
    "Streaming services": "Dịch vụ streaming",
    "Car payment": "Khoản trả xe",
    "Car insurance": "Bảo hiểm xe",
    "Car maintenance": "Bảo trì xe",
    "Home maintenance": "Bảo trì nhà",
    "Debt payments": "Khoản trả nợ",
    "Fun / discretionary": "Giải trí / tùy ý",
    "Cushion to keep": "Phần đệm cần giữ",
    "emergency floor": "mức dự phòng tối thiểu",
    "gas, transit, parking": "xăng, đi lại, đậu xe",
    Inspection: "Kiểm tra nhà",
    "Closing costs": "Chi phí chốt giao dịch",
    "PMI rate": "Tỷ lệ PMI",
    PMI: "PMI",
    HOA: "HOA",
    Total: "Tổng",
    Home: "Nhà",
    Transport: "Đi lại",
    "Current cushion": "Khoản dư hiện tại",
    "Cut monthly spending": "Giảm chi tiêu hằng tháng",
    "Months without income": "Số tháng không có thu nhập",
    "Rate increase": "Mức tăng lãi suất",
    "Insurance increase": "Mức tăng bảo hiểm",
    "Years to buy": "Số năm để mua",
    "Down payment percent": "Phần trăm trả trước",
    "You're ready now": "Bạn đã sẵn sàng",
    "Room left": "Còn chỗ",
    "Tight room": "Còn ít chỗ",
    "No extra room": "Không còn chỗ",
    "Having a child": "Có con",
    HOME_PURCHASED: "Đã mua nhà",
    CHILD_BORN: "Đã sinh con",
    CHILD_ADOPTED: "Đã nhận con nuôi",
    "Sales tax": "Thuế bán hàng",
    "Title / dealer fees": "Phí giấy tờ / đại lý",
    "Trade-in value": "Giá trị xe đổi",
    "medical out-of-pocket": "chi phí y tế tự trả",
  },
};

function tr(text, lang) {
  if (text == null || typeof text !== "string") return text;
  const table = { ...(TRANSLATIONS[lang] || {}), ...(EXTRA_TRANSLATIONS[lang] || {}) };
  if (table[text]) return table[text];
  if (lang === "es") {
    let m = text.match(/^(.+) housing \+ bills$/);
    if (m) return `${m[1]} vivienda + cuentas`;
    m = text.match(/^(.+) saved$/);
    if (m) return `${m[1]} ahorrados`;
    m = text.match(/^(.+)\/mo rent$/);
    if (m) return `${m[1]}/mes de renta`;
    m = text.match(/^(.+)\/mo committed$/);
    if (m) return `${m[1]}/mes comprometidos`;
    m = text.match(/^Leaves (.+)\/mo cushion$/);
    if (m) return `Deja ${m[1]}/mes de margen`;
    m = text.match(/^Leaves (.+)\/mo after your current life snapshot\.$/);
    if (m) return `Deja ${m[1]}/mes después de tu resumen actual.`;
    m = text.match(/^Leaves (.+)\/mo monthly cushion and (.+) saved after down payment\.$/);
    if (m) return `Deja ${m[1]}/mes de margen y ${m[2]} ahorrados después del enganche.`;
    m = text.match(/^Leaves (.+)\/mo monthly cushion and (.+) saved after upfront costs\.$/);
    if (m) return `Deja ${m[1]}/mes de margen y ${m[2]} ahorrados después de los costos iniciales.`;
    m = text.match(/^(.+)\/mo after purchase$/);
    if (m) return `${m[1]}/mes después de comprar`;
    m = text.match(/^(.+) upfront or leave impact$/);
    if (m) return `${m[1]} iniciales o impacto por licencia`;
    m = text.match(/^(.+) upfront$/);
    if (m) return `${m[1]} iniciales`;
    m = text.match(/^(.+) mo$/);
    if (m) return `${m[1]} meses`;
    m = text.match(/^(.+)\/mo$/);
    if (m) return `${m[1]}/mes`;
    m = text.match(/^(.+) cash$/);
    if (m) return `${m[1]} en efectivo`;
    m = text.match(/^around (.+)$/);
    if (m) return `aprox. ${m[1]}`;
    m = text.match(/^− (.+)$/);
    if (m) return `− ${tr(m[1], lang)}`;
    m = text.match(/^= (.+)$/);
    if (m) return `= ${tr(m[1], lang)}`;
  }
  if (lang === "zh") {
    let m = text.match(/^(.+) housing \+ bills$/);
    if (m) return `${m[1]}住房 + 账单`;
    m = text.match(/^(.+) saved$/);
    if (m) return `已储蓄 ${m[1]}`;
    m = text.match(/^(.+)\/mo rent$/);
    if (m) return `${m[1]}/月租金`;
    m = text.match(/^(.+)\/mo committed$/);
    if (m) return `${m[1]}/月固定支出`;
    m = text.match(/^Leaves (.+)\/mo cushion$/);
    if (m) return `剩下 ${m[1]}/月余量`;
    m = text.match(/^Leaves (.+)\/mo after your current life snapshot\.$/);
    if (m) return `按你当前生活概况，剩下 ${m[1]}/月。`;
    m = text.match(/^Leaves (.+)\/mo monthly cushion and (.+) saved after down payment\.$/);
    if (m) return `首付后剩下 ${m[1]}/月余量和 ${m[2]} 储蓄。`;
    m = text.match(/^Leaves (.+)\/mo monthly cushion and (.+) saved after upfront costs\.$/);
    if (m) return `前期成本后剩下 ${m[1]}/月余量和 ${m[2]} 储蓄。`;
    m = text.match(/^(.+)\/mo after purchase$/);
    if (m) return `${m[1]}/月购买后`;
    m = text.match(/^(.+) upfront or leave impact$/);
    if (m) return `${m[1]} 前期现金或休假影响`;
    m = text.match(/^(.+) upfront$/);
    if (m) return `${m[1]} 前期`;
    m = text.match(/^(.+) mo$/);
    if (m) return `${m[1]} 个月`;
    m = text.match(/^(.+)\/mo$/);
    if (m) return `${m[1]}/月`;
    m = text.match(/^(.+) cash$/);
    if (m) return `${m[1]} 现金`;
    m = text.match(/^(.+) home$/);
    if (m) return `${m[1]} 的房子`;
    m = text.match(/^Earner (.+) \((.+)\/mo\) pauses for (.+) months$/);
    if (m) return `收入者 ${m[1]}（${m[2]}/月）暂停 ${m[3]} 个月`;
    m = text.match(/^Rate \+(.+)% · insurance \+(.+)% → payment (.+)\/mo$/);
    if (m) return `利率 +${m[1]}% · 保险 +${m[2]}% → 付款 ${m[3]}/月`;
    m = text.match(/^around (.+)$/);
    if (m) return `约 ${m[1]}`;
    m = text.match(/^− (.+)$/);
    if (m) return `− ${tr(m[1], lang)}`;
    m = text.match(/^= (.+)$/);
    if (m) return `= ${tr(m[1], lang)}`;
  }
  if (lang === "fil") {
    let m = text.match(/^(.+) housing \+ bills$/);
    if (m) return `${m[1]} tirahan + bills`;
    m = text.match(/^(.+) saved$/);
    if (m) return `${m[1]} na ipon`;
    m = text.match(/^(.+)\/mo rent$/);
    if (m) return `${m[1]}/buwan na renta`;
    m = text.match(/^(.+)\/mo committed$/);
    if (m) return `${m[1]}/buwan na obligasyon`;
    m = text.match(/^Leaves (.+)\/mo cushion$/);
    if (m) return `May matitirang ${m[1]}/buwan na allowance`;
    m = text.match(/^Leaves (.+)\/mo after your current life snapshot\.$/);
    if (m) return `May matitirang ${m[1]}/buwan pagkatapos ng kasalukuyang buod mo.`;
    m = text.match(/^Leaves (.+)\/mo monthly cushion and (.+) saved after down payment\.$/);
    if (m) return `May matitirang ${m[1]}/buwan na allowance at ${m[2]} na ipon pagkatapos ng paunang bayad.`;
    m = text.match(/^Leaves (.+)\/mo monthly cushion and (.+) saved after upfront costs\.$/);
    if (m) return `May matitirang ${m[1]}/buwan na allowance at ${m[2]} na ipon pagkatapos ng paunang gastos.`;
    m = text.match(/^(.+)\/mo after purchase$/);
    if (m) return `${m[1]}/buwan pagkatapos bumili`;
    m = text.match(/^(.+) upfront or leave impact$/);
    if (m) return `${m[1]} pauna o epekto ng leave sa kita`;
    m = text.match(/^(.+) upfront$/);
    if (m) return `${m[1]} pauna`;
    m = text.match(/^(.+) mo$/);
    if (m) return `${m[1]} buwan`;
    m = text.match(/^(.+)\/mo$/);
    if (m) return `${m[1]}/buwan`;
    m = text.match(/^(.+) cash$/);
    if (m) return `${m[1]} pera`;
    m = text.match(/^(.+) home$/);
    if (m) return `${m[1]} na bahay`;
    m = text.match(/^Earner (.+) \((.+)\/mo\) pauses for (.+) months$/);
    if (m) return `Kumikita ${m[1]} (${m[2]}/buwan) titigil nang ${m[3]} buwan`;
    m = text.match(/^Rate \+(.+)% · insurance \+(.+)% → payment (.+)\/mo$/);
    if (m) return `Rate +${m[1]}% · seguro +${m[2]}% → bayad ${m[3]}/buwan`;
    m = text.match(/^around (.+)$/);
    if (m) return `mga ${m[1]}`;
    m = text.match(/^− (.+)$/);
    if (m) return `− ${tr(m[1], lang)}`;
    m = text.match(/^= (.+)$/);
    if (m) return `= ${tr(m[1], lang)}`;
  }
  if (lang === "vi") {
    let m = text.match(/^(.+) housing \+ bills$/);
    if (m) return `${m[1]} nhà ở + hóa đơn`;
    m = text.match(/^(.+) saved$/);
    if (m) return `${m[1]} đã tiết kiệm`;
    m = text.match(/^(.+)\/mo rent$/);
    if (m) return `${m[1]}/tháng tiền thuê`;
    m = text.match(/^(.+)\/mo committed$/);
    if (m) return `${m[1]}/tháng đã cam kết`;
    m = text.match(/^Leaves (.+)\/mo cushion$/);
    if (m) return `Còn ${m[1]}/tháng khoản dư`;
    m = text.match(/^Leaves (.+)\/mo after your current life snapshot\.$/);
    if (m) return `Còn ${m[1]}/tháng sau tổng quan hiện tại của bạn.`;
    m = text.match(/^Leaves (.+)\/mo monthly cushion and (.+) saved after down payment\.$/);
    if (m) return `Còn ${m[1]}/tháng khoản dư và ${m[2]} tiết kiệm sau tiền trả trước.`;
    m = text.match(/^Leaves (.+)\/mo monthly cushion and (.+) saved after upfront costs\.$/);
    if (m) return `Còn ${m[1]}/tháng khoản dư và ${m[2]} tiết kiệm sau chi phí ban đầu.`;
    m = text.match(/^(.+)\/mo after purchase$/);
    if (m) return `${m[1]}/tháng sau khi mua`;
    m = text.match(/^(.+) upfront or leave impact$/);
    if (m) return `${m[1]} ban đầu hoặc tác động nghỉ phép`;
    m = text.match(/^(.+) upfront$/);
    if (m) return `${m[1]} ban đầu`;
    m = text.match(/^(.+) mo$/);
    if (m) return `${m[1]} tháng`;
    m = text.match(/^(.+)\/mo$/);
    if (m) return `${m[1]}/tháng`;
    m = text.match(/^(.+) cash$/);
    if (m) return `${m[1]} tiền mặt`;
    m = text.match(/^(.+) home$/);
    if (m) return `Nhà ${m[1]}`;
    m = text.match(/^Earner (.+) \((.+)\/mo\) pauses for (.+) months$/);
    if (m) return `Người kiếm tiền ${m[1]} (${m[2]}/tháng) tạm dừng trong ${m[3]} tháng`;
    m = text.match(/^Rate \+(.+)% · insurance \+(.+)% → payment (.+)\/mo$/);
    if (m) return `Lãi suất +${m[1]}% · bảo hiểm +${m[2]}% → khoản trả ${m[3]}/tháng`;
    m = text.match(/^around (.+)$/);
    if (m) return `khoảng ${m[1]}`;
    m = text.match(/^− (.+)$/);
    if (m) return `− ${tr(m[1], lang)}`;
    m = text.match(/^= (.+)$/);
    if (m) return `= ${tr(m[1], lang)}`;
  }
  return text;
}

function T({ children }) {
  const lang = useContext(LanguageContext);
  return tr(children, lang);
}

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
  language: "en",
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
  "life move studio": "The whole workspace for testing big financial decisions before they become real.",
  "home & loan": "The purchase price, down payment, interest rate, and loan length used to estimate the mortgage payment.",
  "upfront costs": "Cash needed before or at the start of the decision.",
  "monthly home costs": "Recurring home costs after purchase, including taxes, insurance, HOA, and utilities.",
  "real life / actual expenses": "Your current baseline. Every scenario should be measured against this first.",
  "car scenario": "A what-if car purchase using loan terms, insurance, fuel, and maintenance.",
  "rent / move scenario": "A what-if move that compares new housing costs and moving cash against your current life.",
  "baby / child scenario": "A what-if family plan for birth or adoption, including monthly and upfront costs.",
  "choose life moves to check": "Controls which scenarios appear in the app.",
  "stack moves together": "Combines multiple scenarios to see if several big choices fit at the same time.",
  "connected plans": "Scenario cards that all read from the same saved life snapshot.",
  "committed moves": "Real decisions already applied to your saved snapshot.",
  "room for another move?": "Checks whether the house still leaves room for another major purchase or family change.",
  "income — earner 1": "Monthly take-home income for the first earner.",
  "income — earner 2": "Monthly take-home income for the second earner.",
  utilities: "Monthly electricity, gas, water, trash, and similar home services.",
  groceries: "Normal monthly food and household basics.",
  transportation: "Gas, transit, parking, tolls, and everyday travel costs.",
  "debt payments": "Required monthly payments on credit cards, personal loans, student loans, or similar debt.",
  "savings balance": "Cash savings available today before making this decision.",
  "cushion to keep": "The emergency savings floor you do not want a decision to dip below.",
};

const GLOSSARY_I18N = {
  zh: {
    mortgage: ["房贷", "用于买房的贷款，通常按月偿还，期限常见为 15 年或 30 年。"],
    "cash to close": ["成交所需现金", "完成购房时需要一次性准备的钱，包括首付和成交费用。"],
    "down payment": ["首付", "购买时先支付的金额。首付越高，通常贷款越少。"],
    pmi: ["PMI 私人房贷保险", "首付低于 20% 时常见的额外月费，用来保护贷款方。"],
    "property tax": ["房产税", "地方政府按房屋价值收取的税。"],
    "closing costs": ["成交费用", "完成购房交易时支付的贷款、产权和交易相关费用。"],
    "monthly cushion": ["每月余量", "收入减去固定月支出后剩下的钱，是你的缓冲空间。"],
    runway: ["支撑时间", "如果收入下降或停止，储蓄大约能撑多久。"],
    "stress test": ["压力测试", "检查收入下降或成本上升时计划会怎样。"],
    scenario: ["情境", "一个假设计划，用来测试决定而不改变真实生活概况。"],
    committed: ["已确认", "你标记为真实的计划，会更新保存的生活概况。"],
    "life snapshot": ["生活概况", "你当前的财务状况：收入、储蓄、住房、账单、债务和每月余量。"],
    "upfront cost": ["前期成本", "决定开始前或开始时需要的钱，例如押金、首付或搬家费。"],
    "ongoing cost": ["持续成本", "会重复发生的成本，通常按月计算。"],
    "emergency fund": ["应急基金", "为失业、紧急维修或医疗等意外预留的储蓄。"],
    "car insurance": ["汽车保险", "帮助覆盖车辆损坏、责任或损失的保险。"],
    "car maintenance": ["汽车维护", "换油、轮胎、刹车、维修和检查等日常车辆成本。"],
    "trade-in value": ["旧车置换价值", "车商给你当前车辆的金额，通常用于抵扣下一辆车。"],
    "sales tax": ["销售税", "购车时收取的税，可能显著增加支付或贷款金额。"],
    "amount financed": ["贷款金额", "扣除首付、置换价值并加入税费后成为贷款的部分。"],
    "loan term": ["贷款期限", "贷款持续多久。期限越长月供越低，但总利息通常更高。"],
    "home maintenance": ["房屋维护", "为家电、屋顶、水管、庭院等维修保养预留的钱。"],
    internet: ["网络", "每月家庭网络服务费用。"],
    "streaming services": ["流媒体服务", "视频、音乐或娱乐订阅费用。"],
    "cable tv": ["有线电视", "每月有线电视或直播电视套餐费用。"],
    subscriptions: ["订阅", "会自动续费的会员、应用或服务费用。"],
    childcare: ["托育", "日托、保姆、学前班或课后照看等费用。"],
    "parental leave": ["育儿假", "生育或领养后离开工作的时间，可能带薪、部分带薪或无薪。"],
    "medical out-of-pocket": ["自付医疗费用", "即使有保险也需要自己支付的医疗费用。"],
    adoption: ["领养", "成为孩子法定父母的过程，可能包括机构、律师、旅行和法院费用。"],
    "life move studio": ["人生决定规划室", "用来在重大财务决定成真前进行测试的整个工作区。"],
    "home & loan": ["房子和贷款", "用于估算房贷的房价、首付、利率和贷款期限。"],
    "upfront costs": ["前期费用", "决定开始前或开始时需要的现金。"],
    "monthly home costs": ["每月住房费用", "买房后的重复住房成本，包括税、保险、HOA 和水电等服务。"],
    "real life / actual expenses": ["现实生活 / 实际支出", "你当前的基准。每个情境都应该先和这里比较。"],
    "car scenario": ["买车情境", "用贷款条件、保险、油费和维护费测试买车。"],
    "rent / move scenario": ["租房 / 搬家情境", "比较新住房成本和搬家现金需求与当前生活的情境。"],
    "baby / child scenario": ["宝宝 / 孩子情境", "规划生育或领养，包括每月和前期成本。"],
    "choose life moves to check": ["选择要查看的生活决定", "控制应用里显示哪些情境。"],
    "stack moves together": ["组合多个决定", "组合多个情境，看看几项重大决定能否同时承担。"],
    "connected plans": ["关联计划", "都读取同一个已保存生活概况的情境卡片。"],
    "committed moves": ["已确认决定", "已经应用到保存生活概况里的真实决定。"],
    "room for another move?": ["还有空间做另一个决定吗？", "检查买房后是否还容得下另一项重大购买或家庭变化。"],
    "income — earner 1": ["收入 - 收入者 1", "第一位收入者的每月到手收入。"],
    "income — earner 2": ["收入 - 收入者 2", "第二位收入者的每月到手收入。"],
    utilities: ["水电等服务", "每月电、燃气、水、垃圾等家庭服务费用。"],
    groceries: ["食品杂货", "每月正常食物和家庭基本用品。"],
    transportation: ["交通", "油费、公交、停车、过路费和日常出行成本。"],
    "debt payments": ["债务付款", "信用卡、个人贷款、学生贷款等每月必须支付的金额。"],
    "savings balance": ["储蓄余额", "做决定前今天可用的现金储蓄。"],
    "cushion to keep": ["要保留的缓冲", "你不希望任何决定动用到的应急储蓄底线。"],
  },
  fil: {
    mortgage: ["Mortgage", "Loan para bumili ng bahay, karaniwang binabayaran buwan-buwan sa loob ng 15 o 30 taon."],
    "cash to close": ["Cash para mag-close", "Kabuuang perang kailangan sa closing, kasama ang down payment at closing costs."],
    "down payment": ["Down payment", "Perang binabayad agad sa pagbili. Mas mataas ito, mas maliit kadalasan ang loan."],
    pmi: ["PMI", "Dagdag na buwanang insurance na karaniwan kapag mas mababa sa 20% ang down payment."],
    "property tax": ["Property tax", "Buwis na binabayaran sa local government batay sa value ng bahay."],
    "closing costs": ["Closing costs", "Fees sa pagtatapos ng home purchase, gaya ng lender, title, at transaction fees."],
    "monthly cushion": ["Buwanang allowance", "Perang natitira pagkatapos ibawas ang regular monthly costs sa income."],
    runway: ["Tagal ng emergency fund", "Gaano katagal tatagal ang ipon kung bumaba o tumigil ang income."],
    "stress test": ["Stress test", "Check kung ano ang mangyayari kapag bumaba ang income o tumaas ang costs."],
    scenario: ["Scenario", "What-if plan para subukan ang desisyon nang hindi binabago ang totoong snapshot."],
    committed: ["Confirmed", "Planong minarkahan mong totoo at ina-apply sa saved snapshot."],
    "life snapshot": ["Buod ng buhay", "Kasalukuyang financial picture: income, ipon, tirahan, bills, utang, at monthly cushion."],
    "upfront cost": ["Gastos sa umpisa", "Perang kailangan bago o sa simula ng desisyon, gaya ng deposit, down payment, o moving cost."],
    "ongoing cost": ["Paulit-ulit na gastos", "Gastos na umuulit, karaniwang buwan-buwan."],
    "emergency fund": ["Emergency fund", "Ipon para sa biglaang problema tulad ng job loss, repair, o medical costs."],
    "car insurance": ["Insurance ng kotse", "Insurance para sa damage, liability, o losses na may kinalaman sa sasakyan."],
    "car maintenance": ["Maintenance ng kotse", "Regular na gastos tulad ng oil change, gulong, preno, repair, at inspection."],
    "trade-in value": ["Trade-in value", "Halagang ibinibigay ng dealer para sa current car mo, karaniwang ibabawas sa bagong kotse."],
    "sales tax": ["Sales tax", "Buwis sa pagbili ng sasakyan na pwedeng magdagdag ng malaking halaga sa babayaran o ilo-loan."],
    "amount financed": ["Halagang ilo-loan", "Bahagi ng car cost na magiging loan pagkatapos ng down payment, trade-in, taxes, at fees."],
    "loan term": ["Tagal ng loan", "Gaano katagal ang loan. Mas mahaba, mas mababa ang monthly payment pero mas mataas kadalasan ang total interest."],
    "home maintenance": ["Maintenance ng bahay", "Perang nakatabi para sa repairs at upkeep gaya ng appliances, bubong, plumbing, o yard."],
    internet: ["Internet", "Buwanang home internet service."],
    "streaming services": ["Streaming services", "Buwanang video, music, o entertainment subscriptions."],
    "cable tv": ["Cable TV", "Buwanang cable o live TV package."],
    subscriptions: ["Subscriptions", "Memberships o app charges na automatic nagre-renew."],
    childcare: ["Childcare", "Gastos sa daycare, nanny, babysitter, preschool, o after-school care."],
    "parental leave": ["Parental leave", "Panahong wala sa trabaho pagkatapos manganak o mag-ampon; maaaring paid, partial, o unpaid."],
    "medical out-of-pocket": ["Medical out-of-pocket", "Health costs na ikaw mismo ang nagbabayad kahit may insurance."],
    adoption: ["Adoption", "Legal process ng pagiging magulang ng bata; maaaring may agency, legal, travel, at court costs."],
    "life move studio": ["Life move studio", "Workspace para subukan ang malalaking financial decisions bago maging totoo."],
    "home & loan": ["Bahay at loan", "Presyo, down payment, interest rate, at loan length para tantiyahin ang mortgage."],
    "upfront costs": ["Paunang gastos", "Cash na kailangan bago o sa simula ng desisyon."],
    "monthly home costs": ["Buwanang gastos sa bahay", "Paulit-ulit na gastos pagkatapos bumili, kasama tax, insurance, HOA, at utilities."],
    "real life / actual expenses": ["Totoong buhay / actual expenses", "Current baseline mo. Dito dapat ikumpara ang bawat scenario."],
    "car scenario": ["Scenario ng kotse", "What-if car purchase gamit ang loan terms, insurance, gas, at maintenance."],
    "rent / move scenario": ["Scenario ng renta / lipat", "What-if move na ikinukumpara ang bagong housing costs at moving cash sa current life mo."],
    "baby / child scenario": ["Scenario ng baby / anak", "Family plan para sa birth o adoption, kasama monthly at upfront costs."],
    "choose life moves to check": ["Piliin ang life moves", "Controls kung aling scenarios ang lalabas sa app."],
    "stack moves together": ["Pagsamahin ang moves", "Pinagsasama ang scenarios para makita kung kasya ang ilang malalaking desisyon nang sabay."],
    "connected plans": ["Nakaugnay na plano", "Scenario cards na pare-parehong gumagamit ng saved life snapshot."],
    "committed moves": ["Confirmed moves", "Totoong desisyon na na-apply na sa saved snapshot."],
    "room for another move?": ["May puwang pa?", "Tinitingnan kung may room pa ang bahay para sa isa pang major purchase o family change."],
    "income — earner 1": ["Income - kumikita 1", "Buwanang take-home income ng unang kumikita."],
    "income — earner 2": ["Income - kumikita 2", "Buwanang take-home income ng pangalawang kumikita."],
    utilities: ["Utilities", "Buwanang kuryente, gas, tubig, basura, at katulad na home services."],
    groceries: ["Grocery", "Normal na buwanang pagkain at household basics."],
    transportation: ["Transportasyon", "Gas, transit, parking, tolls, at daily travel costs."],
    "debt payments": ["Bayad sa utang", "Required monthly payments sa credit cards, personal loans, student loans, o katulad na utang."],
    "savings balance": ["Ipon", "Cash savings na available ngayon bago gawin ang desisyon."],
    "cushion to keep": ["Cushion na itatabi", "Emergency savings floor na ayaw mong galawin ng isang desisyon."],
  },
  vi: {
    mortgage: ["Thế chấp", "Khoản vay để mua nhà, thường trả hằng tháng trong 15 hoặc 30 năm."],
    "cash to close": ["Tiền mặt khi chốt", "Tổng tiền cần trả lúc hoàn tất mua nhà, gồm tiền trả trước và chi phí chốt."],
    "down payment": ["Tiền trả trước", "Tiền trả ngay vào giá mua. Trả trước càng nhiều thì khoản vay thường càng nhỏ."],
    pmi: ["PMI", "Chi phí bảo hiểm thế chấp tư nhân, thường có khi tiền trả trước dưới 20%."],
    "property tax": ["Thuế tài sản", "Thuế trả cho chính quyền địa phương dựa trên giá trị căn nhà."],
    "closing costs": ["Chi phí chốt", "Các khoản phí khi hoàn tất mua nhà, như phí vay, giấy tờ và giao dịch."],
    "monthly cushion": ["Khoản dư hằng tháng", "Tiền còn lại sau khi lấy thu nhập trừ chi phí hằng tháng."],
    runway: ["Thời gian dự phòng", "Tiền tiết kiệm có thể kéo dài bao lâu nếu thu nhập giảm hoặc dừng."],
    "stress test": ["Kiểm tra áp lực", "Cách kiểm tra điều gì xảy ra nếu thu nhập giảm hoặc chi phí tăng."],
    scenario: ["Kịch bản", "Kế hoạch giả định để thử một quyết định mà không đổi tổng quan thật."],
    committed: ["Đã xác nhận", "Kế hoạch bạn đánh dấu là thật và cập nhật vào tổng quan đã lưu."],
    "life snapshot": ["Tổng quan cuộc sống", "Bức tranh tài chính hiện tại: thu nhập, tiết kiệm, nhà ở, hóa đơn, nợ và khoản dư."],
    "upfront cost": ["Chi phí ban đầu", "Tiền cần trước hoặc lúc bắt đầu quyết định, như cọc, trả trước hoặc chi phí chuyển nhà."],
    "ongoing cost": ["Chi phí lặp lại", "Chi phí lặp lại, thường là hằng tháng."],
    "emergency fund": ["Quỹ khẩn cấp", "Tiền dành riêng cho việc bất ngờ như mất việc, sửa chữa gấp hoặc y tế."],
    "car insurance": ["Bảo hiểm xe", "Bảo hiểm giúp chi trả thiệt hại, trách nhiệm hoặc mất mát liên quan đến xe."],
    "car maintenance": ["Bảo trì xe", "Chi phí xe định kỳ như thay dầu, lốp, phanh, sửa chữa và kiểm tra."],
    "trade-in value": ["Giá trị xe đổi", "Số tiền đại lý tính cho xe hiện tại, thường trừ vào xe mới."],
    "sales tax": ["Thuế bán hàng", "Thuế trên giao dịch mua xe, có thể làm tăng số tiền phải trả hoặc vay."],
    "amount financed": ["Số tiền vay", "Phần chi phí xe trở thành khoản vay sau trả trước, xe đổi, thuế và phí."],
    "loan term": ["Thời hạn vay", "Khoản vay kéo dài bao lâu. Kỳ hạn dài giảm trả hằng tháng nhưng thường tăng tổng lãi."],
    "home maintenance": ["Bảo trì nhà", "Tiền dành cho sửa chữa và bảo dưỡng như đồ gia dụng, mái nhà, ống nước hoặc sân vườn."],
    internet: ["Internet", "Dịch vụ internet tại nhà hằng tháng."],
    "streaming services": ["Dịch vụ streaming", "Gói video, nhạc hoặc giải trí trả hằng tháng."],
    "cable tv": ["Truyền hình cáp", "Chi phí truyền hình cáp hoặc TV trực tiếp hằng tháng."],
    subscriptions: ["Gói đăng ký", "Thành viên hoặc phí ứng dụng tự động gia hạn."],
    childcare: ["Giữ trẻ", "Chi phí daycare, bảo mẫu, babysitter, mẫu giáo hoặc chăm sóc sau giờ học."],
    "parental leave": ["Nghỉ phép làm cha mẹ", "Thời gian nghỉ làm sau khi sinh hoặc nhận con nuôi; có thể có lương, một phần hoặc không lương."],
    "medical out-of-pocket": ["Chi phí y tế tự trả", "Chi phí sức khỏe bạn tự trả dù có bảo hiểm."],
    adoption: ["Nhận con nuôi", "Quy trình pháp lý để trở thành cha mẹ của trẻ, có thể gồm phí cơ quan, luật sư, đi lại và tòa."],
    "life move studio": ["Công cụ quyết định cuộc sống", "Không gian để thử các quyết định tài chính lớn trước khi chúng thành thật."],
    "home & loan": ["Nhà và khoản vay", "Giá mua, tiền trả trước, lãi suất và thời hạn dùng để ước tính khoản vay mua nhà."],
    "upfront costs": ["Chi phí ban đầu", "Tiền mặt cần trước hoặc lúc bắt đầu quyết định."],
    "monthly home costs": ["Chi phí nhà hằng tháng", "Chi phí lặp lại sau khi mua nhà, gồm thuế, bảo hiểm, HOA và tiện ích."],
    "real life / actual expenses": ["Đời thật / chi phí thực tế", "Nền tảng hiện tại của bạn. Mọi kịch bản nên được so với phần này trước."],
    "car scenario": ["Kịch bản mua xe", "Kịch bản mua xe dùng điều khoản vay, bảo hiểm, xăng/sạc và bảo trì."],
    "rent / move scenario": ["Kịch bản thuê / chuyển", "Kịch bản chuyển nhà so chi phí nhà mới và tiền chuyển nhà với đời sống hiện tại."],
    "baby / child scenario": ["Kịch bản em bé / con", "Kế hoạch gia đình cho sinh con hoặc nhận con nuôi, gồm chi phí hằng tháng và ban đầu."],
    "choose life moves to check": ["Chọn quyết định để kiểm tra", "Điều khiển kịch bản nào xuất hiện trong ứng dụng."],
    "stack moves together": ["Gộp quyết định", "Kết hợp nhiều kịch bản để xem vài quyết định lớn có thể đi cùng nhau không."],
    "connected plans": ["Kế hoạch liên kết", "Các thẻ kịch bản đều dùng cùng tổng quan cuộc sống đã lưu."],
    "committed moves": ["Quyết định đã xác nhận", "Những quyết định thật đã áp dụng vào tổng quan đã lưu."],
    "room for another move?": ["Còn chỗ cho quyết định khác?", "Kiểm tra sau khi mua nhà còn chỗ cho khoản mua lớn hoặc thay đổi gia đình khác không."],
    "income — earner 1": ["Thu nhập - người 1", "Thu nhập mang về hằng tháng của người kiếm tiền thứ nhất."],
    "income — earner 2": ["Thu nhập - người 2", "Thu nhập mang về hằng tháng của người kiếm tiền thứ hai."],
    utilities: ["Tiện ích", "Điện, gas, nước, rác và dịch vụ nhà tương tự hằng tháng."],
    groceries: ["Thực phẩm", "Đồ ăn và nhu yếu phẩm gia đình bình thường hằng tháng."],
    transportation: ["Đi lại", "Xăng, phương tiện công cộng, đậu xe, phí đường và đi lại hằng ngày."],
    "debt payments": ["Khoản trả nợ", "Khoản trả bắt buộc hằng tháng cho thẻ tín dụng, vay cá nhân, vay sinh viên hoặc nợ tương tự."],
    "savings balance": ["Số dư tiết kiệm", "Tiền tiết kiệm có sẵn hôm nay trước khi ra quyết định."],
    "cushion to keep": ["Phần đệm cần giữ", "Mức tiết kiệm khẩn cấp bạn không muốn quyết định nào làm giảm xuống dưới."],
  },
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
  const lang = useContext(LanguageContext);
  const key = String(term || children).toLowerCase();
  const body = GLOSSARY[key];
  const localized = GLOSSARY_I18N[lang]?.[key]?.[1];
  if (!body) return children;
  return (
    <span className="haf-term" tabIndex={0}>
      {children}
      <span className="haf-bubble" role="tooltip">{localized || tr(body, lang)}</span>
    </span>
  );
}

function Field({ label, hint, prefix, suffix, value, onChange, step, term }) {
  const lang = useContext(LanguageContext);
  return (
    <label className="haf-field">
      <span className="haf-field-label">
        <Term term={term || label}>{tr(label, lang)}</Term>
        {hint && <span className="haf-field-hint">{tr(hint, lang)}</span>}
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
  const lang = useContext(LanguageContext);
  return (
    <section className={`haf-group ${open ? "is-open" : ""}`}>
      <button className="haf-group-head" onClick={onToggle} aria-expanded={open}>
        <span className="haf-group-title">
          <Icon size={16} strokeWidth={2.1} /> <Term term={title}>{tr(title, lang)}</Term>
        </span>
        <ChevronDown size={17} className="haf-chev" />
      </button>
      {open && <div className="haf-group-body">{children}</div>}
    </section>
  );
}

function Badge({ tone, children }) {
  const lang = useContext(LanguageContext);
  const map = {
    ok: { bg: "#E7F2EB", fg: C.emerald },
    warn: { bg: "#FBF1DE", fg: "#A86F12" },
    bad: { bg: "#FBE7E2", fg: C.coral },
    neutral: { bg: C.tealSoft, fg: C.tealDeep },
  };
  const s = map[tone] || map.neutral;
  return (
    <span className="haf-badge" style={{ background: s.bg, color: s.fg }}>
      {typeof children === "string" ? tr(children, lang) : children}
    </span>
  );
}

/* income-as-100% living budget bar — the signature element */
function BudgetBar({ caption, segments, income, scaleToSpend }) {
  const lang = useContext(LanguageContext);
  const denom = scaleToSpend
    ? segments.reduce((a, s) => a + s.value, 0)
    : income;
  return (
    <div className="haf-bbar-row">
      <div className="haf-bbar-cap">{tr(caption, lang)}</div>
      <div className="haf-bbar-track">
        {segments.map((s, i) => {
          const w = denom > 0 ? (s.value / denom) * 100 : 0;
          if (w <= 0) return null;
          return (
            <div
              key={i}
              className="haf-bbar-seg"
              style={{ width: `${w}%`, background: s.color }}
              title={`${tr(s.label, lang)}: ${usd0(s.value)}`}
            />
          );
        })}
      </div>
    </div>
  );
}

const CurrencyTip = ({ active, payload, label, suffix }) => {
  const lang = useContext(LanguageContext);
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="haf-tip">
      <div className="haf-tip-x">{label}{tr(suffix, lang)}</div>
      {payload.map((p, i) => (
        <div key={i} className="haf-tip-row">
          <span style={{ color: p.color }}>{tr(p.name, lang)}</span>
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
  const language = saved.language || "en";

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
  const setLanguage = (value) =>
    setSaved((s) => ({ ...s, language: value }));

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
  const afterHomeCashToday = m.have - m.cashToClose;
  const afterHomeExtraCash = afterHomeCashToday - m.cushion;
  const roomAfterHomeOptions = [
    enabledMoves.car && {
      key: "car",
      label: "Buy the car scenario",
      monthly: carMonthly,
      upfront: carCashDue,
      icon: Car,
    },
    enabledMoves.child && {
      key: "child",
      label: childPlan.path === "adoption" ? "Adopt a child" : "Have a baby",
      monthly: childMonthly,
      upfront: childUpfront,
      icon: Baby,
    },
  ].filter(Boolean).map((option) => {
    const monthlyAfter = m.savingsPost - option.monthly;
    const cashAfter = afterHomeCashToday - option.upfront;
    const tone =
      monthlyAfter < 0 || cashAfter < m.cushion
        ? "bad"
        : monthlyAfter < 500 || cashAfter < m.cushion * 1.25
        ? "warn"
        : "ok";
    return { ...option, monthlyAfter, cashAfter, tone };
  });
  const hasRoomAfterHome = roomAfterHomeOptions.some((option) => option.tone === "ok");
  const hasTightRoomAfterHome = roomAfterHomeOptions.some((option) => option.tone === "warn");
  const homeRoomTone =
    afterHomeCashToday < m.cushion || m.savingsPost < 0
      ? "bad"
      : hasRoomAfterHome
      ? "ok"
      : hasTightRoomAfterHome
      ? "warn"
      : "bad";
  const homeRoomLabel =
    homeRoomTone === "ok"
      ? "Room left"
      : homeRoomTone === "warn"
      ? "Tight room"
      : "No extra room";
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
    <LanguageContext.Provider value={language}>
    <div className="haf">
      <style>{CSS}</style>
      <div className="haf-wrap">
        {/* header */}
        <header className="haf-head">
          <div className="haf-head-top">
            <div>
              <div className="haf-eyebrow">{tr("Life move studio", language)}</div>
              <h1 className="haf-title">{tr("What happens to your life if you do this?", language)}</h1>
              <p className="haf-lede">
                {tr("Save one life snapshot, test big decisions as scenarios, then commit the moves that become real so every other plan sees the new picture.", language)}
              </p>
            </div>
            <label className="haf-language">
              <span>{tr("Language", language)}</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((option) => (
                  <option key={option.code} value={option.code}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
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
              <Icon size={16} strokeWidth={2.1} /> {tr(label, language)}
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
            sub={<Badge tone={hPost.tone}>{`${tr(hPost.label, language)} · ${pct(m.ratePost)}`}</Badge>}
          />
          <Vital
            icon={Clock} label="Until you're ready"
            value={m.readyNow ? tr("Ready now", language) : isFinite(m.months) ? `${Math.ceil(m.months)} mo` : tr("Not at this rate", language)}
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
                  {tr("Down payment", language)}
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
                  {usd0(m.dAmt)} · {pct(m.dPct)} {tr("of price", language)}
                  {m.pmiActive ? (
                    <Badge tone="warn">{`${tr("PMI on", language)} · +${usd0(m.pmiMo)}/mo`}</Badge>
                  ) : (
                    <Badge tone="ok">{`20%+ · ${tr("no PMI", language)}`}</Badge>
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
                {tr("Cash to close", language)}: <b>{usd0(m.cashToClose)}</b>
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
                  <Icon size={15} strokeWidth={2.1} /> {tr(label, language)}
                </button>
              ))}
            </div>

            {/* ===== AFTER YOU BUY ===== */}
            {tab === "after" && (
              <div className="haf-panel">
                <div className="haf-verdict">
                  <div>
                    <div className="haf-verdict-k">{tr("After buying, you'd save", language)}</div>
                    <div className="haf-verdict-v" style={{ color: hPost.color }}>
                      {usd0(m.savingsPost)}<span>/mo</span>
                    </div>
                    <div className="haf-verdict-sub">
                      {pct(m.ratePost)} {tr("of income", language)}{" "}
                      <span className="haf-arrow">↓ {tr("from", language)} {pct(m.rateNow)} {tr("today", language)}</span>
                    </div>
                  </div>
                  <Badge tone={hPost.tone}>{hPost.label}</Badge>
                </div>

                {m.overBudget && (
                  <Flag tone="bad" icon={AlertTriangle}>
                    {tr("This budget goes over. The home cost plus current spending is more than your income — something has to give before this works.", language)}
                  </Flag>
                )}
                {!m.overBudget && m.ratePost < HEALTHY_FLOOR && (
                  <Flag tone="warn" icon={TrendingDown}>
                    {tr("Savings drop below a healthy floor. You'd still be positive, but with little room for surprises.", language)}
                  </Flag>
                )}
                {!m.overBudget && m.ratePost >= HEALTHY_FLOOR && (
                  <Flag tone="ok" icon={CheckCircle2}>
                    {tr("Savings stay healthy after the purchase. Run the stress test to see how a rough patch would feel.", language)}
                  </Flag>
                )}

                <div className="haf-action-row">
                  <button className="haf-primary-action" onClick={commitHome}>
                    <Save size={16} strokeWidth={2.1} /> {tr("Add this home to my life", language)}
                  </button>
                  <span>
                    {tr("This saves the home as real, subtracts cash to close from savings, and updates your shared snapshot.", language)}
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
                    <h4><T>New home cost</T></h4>
                    <Row k="Principal & interest" v={m.pi} />
                    <Row k="Property tax" v={m.taxMo} />
                    <Row k="Insurance" v={m.insMo} />
                    <Row k="HOA" v={m.hoaMo} />
                    {m.pmiActive && <Row k="PMI" v={m.pmiMo} warn />}
                    <Row k="Utilities" v={m.utilMo} />
                    <Row k="Total" v={m.housingMo} total />
                  </div>
                  <div className="haf-rebuild-col">
                    <h4><T>What's left each month</T></h4>
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

                <div className="haf-next-room">
                  <div className="haf-panel-head">
                    <div>
                      <h3><Car size={17} strokeWidth={2.1} /> <T>Room for another move?</T></h3>
                      <p><T>After this house, check whether another big plan still fits without breaking the monthly cushion or emergency floor.</T></p>
                    </div>
                    <Badge tone={homeRoomTone}>{homeRoomLabel}</Badge>
                  </div>
                  <div className="haf-target-grid">
                    <Mini k="Monthly room after home" v={usd0(m.savingsPost)} accent />
                    <Mini k="Cash after closing" v={usd0(afterHomeCashToday)} />
                    <Mini k="Emergency floor" v={usd0(m.cushion)} />
                    <Mini k="Cash above floor" v={usd0(afterHomeExtraCash)} />
                    <Mini k="Car scenario" v={enabledMoves.car ? usd0(carMonthly) + "/mo" : "Off"} />
                    <Mini k="Baby / child" v={enabledMoves.child ? usd0(childMonthly) + "/mo" : "Off"} />
                  </div>
                  {roomAfterHomeOptions.length ? (
                    <div className="haf-rebuild">
                      {roomAfterHomeOptions.map(({ key, label, monthly, upfront, monthlyAfter, cashAfter, tone, icon: Icon }) => (
                        <div className="haf-rebuild-col" key={key}>
                          <h4><Icon size={13} strokeWidth={2.2} /> {tr(label, language)}</h4>
                          <Row k="Adds monthly" v={monthly} />
                          <Row k="Needs upfront" v={upfront} />
                          <Row k="Monthly room after both" v={monthlyAfter} />
                          <Row k="Savings after both" v={cashAfter} total tone={tone} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Flag tone="warn" icon={AlertTriangle}>
                      <T>Turn on another life move from the Life snapshot to compare it against this house.</T>
                    </Flag>
                  )}
                  {roomAfterHomeOptions.length > 0 && (
                    <Flag tone={homeRoomTone} icon={homeRoomTone === "bad" ? AlertTriangle : homeRoomTone === "warn" ? TrendingDown : CheckCircle2}>
                      {homeRoomTone === "ok"
                        ? tr("This house still leaves enough room for at least one other selected move.", language)
                        : homeRoomTone === "warn"
                        ? tr("There is some room after the house, but the next move would leave a thin buffer.", language)
                        : tr("This house should probably be the only big move for now. Another purchase would break cash flow or dip below the emergency floor.", language)}
                    </Flag>
                  )}
                </div>
              </div>
            )}

            {/* ===== TIMELINE ===== */}
            {tab === "timeline" && (
              <div className="haf-panel">
                <div className="haf-verdict">
                  <div>
                    <div className="haf-verdict-k">{tr("Time to your target", language)}</div>
                    <div className="haf-verdict-v" style={{ color: m.readyNow ? C.emerald : isFinite(m.months) ? C.teal : C.coral }}>
                      {m.readyNow ? tr("Ready now", language) : isFinite(m.months) ? `${Math.ceil(m.months)}` : "—"}
                      {!m.readyNow && isFinite(m.months) && <span>{tr("months", language)}</span>}
                    </div>
                    <div className="haf-verdict-sub">
                      {m.readyNow
                        ? `${tr("You already have enough to close and keep your cushion.", language)}`
                        : isFinite(m.months)
                        ? `${tr("On track for around", language)} ${readyDate}.`
                        : tr("At this savings rate you won't reach it — free up some monthly cash flow below.", language)}
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
                    <span>{tr("Cut monthly spending by", language)} <b>{usd0(cutSpending)}</b></span>
                    <span className="haf-slider-out">
                      {tr("saving", language)} {usd0(m.monthlySave)}/mo ·{" "}
                      {m.readyNow ? tr("ready now", language) : isFinite(m.months) ? tr(`${Math.ceil(m.months)} mo`, language) : tr("never", language)}
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
                        label={{ value: tr("target", language), fill: C.amber, fontSize: 11, position: "insideTopRight" }} />
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
                    {tr("Lose an income", language)}
                  </button>
                  <button className={stressKind === "costs" ? "on" : ""} onClick={() => setStressKind("costs")}>
                    {tr("Costs rise", language)}
                  </button>
                </div>

                {stressKind === "income" ? (
                  <div className="haf-stress-controls">
                    <div className="haf-field">
                      <span className="haf-field-label">{tr("Which income pauses?", language)}</span>
                      <span className="haf-seg">
                        <button className={stressEarner === "1" ? "on" : ""} onClick={() => setStressEarner("1")}>
                          {tr("Earner 1", language)} · {usd0(num(earner1))}
                        </button>
                        <button className={stressEarner === "2" ? "on" : ""} onClick={() => setStressEarner("2")}>
                          {tr("Earner 2", language)} · {usd0(num(earner2))}
                        </button>
                      </span>
                    </div>
                    <div className="haf-slider-box">
                      <div className="haf-slider-head">
                        <span>{tr("For", language)} <b>{stressMonths} {tr("months", language)}</b></span>
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
                        <span>{tr("Interest rate up", language)} <b>{rateInc}%</b></span>
                        <span className="haf-slider-out">{pct(num(rate))} → {pct(num(rate) * (1 + rateInc / 100), 2)}</span>
                      </div>
                      <input type="range" min={0} max={60} step={5} value={rateInc}
                        onChange={(e) => setRateInc(num(e.target.value))} aria-label="Rate increase" />
                      <div className="haf-slider-scale"><span>+0%</span><span>+60%</span></div>
                    </div>
                    <div className="haf-slider-box">
                      <div className="haf-slider-head">
                        <span>{tr("Insurance up", language)} <b>{insInc}%</b></span>
                      </div>
                      <input type="range" min={0} max={100} step={5} value={insInc}
                        onChange={(e) => setInsInc(num(e.target.value))} aria-label="Insurance increase" />
                      <div className="haf-slider-scale"><span>+0%</span><span>+100%</span></div>
                    </div>
                  </div>
                )}

                <div className="haf-verdict haf-verdict-flush">
                  <div>
                    <div className="haf-verdict-k">{tr("Your cushion lasts", language)}</div>
                    <div className="haf-verdict-v" style={{ color: stress.survivesEvent ? C.emerald : C.coral }}>
                      {isFinite(stress.runway) ? stress.runway : "24+"}<span>{tr("months", language)}</span>
                    </div>
                    <div className="haf-verdict-sub">{tr(stress.headline, language)}</div>
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
                      {tr("This emergency cushion survives the lost-income period with room left.", language)}
                    </Flag>
                  ) : (
                    <Flag tone="bad" icon={AlertTriangle}>
                      {tr("The cushion runs out before the income gap ends. A bigger cushion or lower payment closes it.", language)}
                    </Flag>
                  )
                )}
                {stressKind === "costs" && (
                  stress.survivesEvent ? (
                    <Flag tone="ok" icon={CheckCircle2}>
                      <T>Even with higher costs you stay cash-flow positive, so the cushion isn't drained.</T>
                    </Flag>
                  ) : (
                    <Flag tone="bad" icon={AlertTriangle}>
                      {tr("Higher costs flip you to a monthly shortfall — the cushion drains in about months.", language)}
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
                  {tr("Work backward: pick a timeline and a down payment, and see the monthly savings it takes to get there on this home.", language)}
                </p>
                <div className="haf-stress-controls">
                  <div className="haf-slider-box">
                    <div className="haf-slider-head">
                      <span>{tr("Buy in", language)} <b>{revYears} {tr(revYears === 1 ? "year" : "years", language)}</b></span>
                    </div>
                    <input type="range" min={1} max={10} step={1} value={revYears}
                      onChange={(e) => setRevYears(num(e.target.value))} aria-label="Years to buy" />
                    <div className="haf-slider-scale"><span>1 yr</span><span>10 yr</span></div>
                  </div>
                  <div className="haf-slider-box">
                    <div className="haf-slider-head">
                      <span>{tr("With down", language)} <b>{revDownPct}%</b></span>
                      <span className="haf-slider-out">{usd0(reverse.reqDown)}</span>
                    </div>
                    <input type="range" min={3} max={30} step={1} value={revDownPct}
                      onChange={(e) => setRevDownPct(num(e.target.value))} aria-label="Down payment percent" />
                    <div className="haf-slider-scale"><span>3%</span><span>30%</span></div>
                  </div>
                </div>

                <div className="haf-verdict haf-verdict-flush">
                  <div>
                    <div className="haf-verdict-k">{tr("You'd need to save", language)}</div>
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
                    {tr("You are already saving more than this target needs. You could hit it sooner or aim for a larger down payment.", language)}
                  </Flag>
                ) : (
                  <Flag tone="warn" icon={TrendingDown}>
                    {tr("You are short of this target. Free up cash flow, stretch the timeline, or lower the down payment.", language)}
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
          {tr("Estimates for planning, not a loan offer. Taxes, insurance, and PMI vary by lender and location — confirm real quotes before you commit.", language)}
        </footer>
      </div>
    </div>
    </LanguageContext.Provider>
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
  const lang = useContext(LanguageContext);
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
              <span className="haf-group-title"><Wallet size={16} /> <Term term="Real life / actual expenses">{tr("Real life / actual expenses", lang)}</Term></span>
            </div>
            <div className="haf-group-body">
              <div className="haf-field">
                <span className="haf-field-label"><Term term="Housing status">{tr("Housing status", lang)}</Term></span>
                <span className="haf-seg haf-seg-wide">
                  <button className={life.housingType === "rent" ? "on" : ""} onClick={() => setField("housingType")("rent")}>
                    {tr("Renting", lang)}
                  </button>
                  <button className={life.housingType === "owned" ? "on" : ""} onClick={() => setField("housingType")("owned")}>
                    {tr("Owned", lang)}
                  </button>
                </span>
              </div>
              <div className="haf-grid2">
                <Field label="Income — earner 1" prefix="$" value={life.earner1} onChange={setField("earner1")} />
                <Field label="Income — earner 2" prefix="$" value={life.earner2} onChange={setField("earner2")} />
              </div>
              <div className="haf-field-foot">{tr("Household", lang)}: <b>{usd0(m.income)}/mo</b></div>
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
                <h3><T>Actual monthly picture</T></h3>
                <p><T>This is the saved baseline every life move uses. Change it here first, then test scenarios.</T></p>
              </div>
              <Badge tone="neutral">Auto-saved</Badge>
            </div>
            <div className="haf-rebuild">
              <div className="haf-rebuild-col">
                <h4><T>Money in</T></h4>
                <Row k="Earner 1" v={num(life.earner1)} />
                <Row k="Earner 2" v={num(life.earner2)} />
                <Row k="Household income" v={m.income} total />
              </div>
              <div className="haf-rebuild-col">
                <h4><T>Money out</T></h4>
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
              <T>This is your actual baseline. Life moves should be judged against this, not against numbers hidden inside one scenario.</T>
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
  const lang = useContext(LanguageContext);
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
              <h3><T>Choose life moves to check</T></h3>
              <p><T>Turn on only the scenarios you care about right now. Your choices are saved.</T></p>
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
                <span>{tr(label, lang)}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="haf-panel">
          <div className="haf-panel-head">
            <div>
              <h3><T>Stack moves together</T></h3>
              <p><T>Mix scenarios to see whether a few big choices can fit at the same time.</T></p>
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
                <span>{tr(label, lang)}</span>
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
                <h4><T>Monthly stack</T></h4>
                {selectedStack.map((move) => (
                  <Row key={move.key} k={move.label} v={move.monthly} />
                ))}
                <Row k="Total monthly impact" v={stackMonthly} total tone={stackTone} />
              </div>
              <div className="haf-rebuild-col">
                <h4><T>Cash stack</T></h4>
                {selectedStack.map((move) => (
                  <Row key={move.key} k={move.label} v={move.upfront} />
                ))}
                <Row k="Total upfront cash" v={stackUpfront} total tone={stackTone} />
              </div>
            </div>
          ) : (
            <Flag tone="warn" icon={AlertTriangle}>
              <T>Choose two or more moves above when you want to test real-life temptation stacking.</T>
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
              <h3><T>Your life snapshot</T></h3>
              <p><T>Life snapshot is the saved baseline every plan reads from.</T></p>
            </div>
            <Badge tone="neutral">Auto-saved</Badge>
          </div>
          <div className="haf-rebuild">
            <div className="haf-rebuild-col">
              <h4><T>Monthly money in</T></h4>
              <Row k="Earner 1" v={num(life.earner1)} />
              <Row k="Earner 2" v={num(life.earner2)} />
              <Row k="Household income" v={m.income} total />
            </div>
            <div className="haf-rebuild-col">
              <h4><T>Monthly money out</T></h4>
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
              <h3><T>Connected plans</T></h3>
              <p><T>These scenarios use your saved snapshot, so one real move changes the next one.</T></p>
            </div>
          </div>
          <div className="haf-plan-stack">
            {enabledMoves.home && <PlanCard icon={Home} title="Buy a home" value={m.readyNow ? tr("Ready now", lang) : isFinite(m.months) ? `${Math.ceil(m.months)} mo` : tr("Not yet", lang)} sub={`${usd0(m.housingMo)}/mo after purchase`} tone={m.readyNow ? "ok" : "warn"} onOpen={() => setModule("home")} />}
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
              <h3><T>Committed moves</T></h3>
              <p><T>Committed moves are real changes already applied to your snapshot.</T></p>
            </div>
          </div>
          {committed.length ? (
            <div className="haf-event-list">
              {committed.map((event) => (
                <div key={`${event.type}-${event.date}`} className="haf-event">
                  <b>{tr(event.label, lang)}</b>
                  <span>{usd0(event.monthlyImpact)}/mo · {tr(`${usd0(event.cashImpact)} cash`, lang)}</span>
                </div>
              ))}
            </div>
          ) : (
            <Flag tone="warn" icon={AlertTriangle}>
              <T>No committed moves yet. Use a module as a scenario, then add it to your life when it becomes real.</T>
            </Flag>
          )}
        </section>

        <GlossaryPanel />
      </div>
    </div>
  );
}

function RentMoveModule({ plan, setField, activeHousing, currentUtilities, monthlyDelta, upfront, baseMonthlyCushion }) {
  const lang = useContext(LanguageContext);
  const netRent = Math.max(0, num(plan.newRent) - num(plan.roommateShare));
  const newMonthly = netRent + num(plan.newUtilities);
  const cushionAfter = baseMonthlyCushion - monthlyDelta;
  const tone = cushionAfter < 0 ? "bad" : cushionAfter < 500 ? "warn" : "ok";
  return (
    <div className="haf-single">
      <div className="haf-layout">
        <aside className="haf-inputs">
          <section className="haf-group is-open">
            <div className="haf-group-head"><span className="haf-group-title"><KeyRound size={16} /> {tr("Rent / move scenario", lang)}</span></div>
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
                <div className="haf-verdict-k">{tr("This move changes monthly life by", lang)}</div>
                <div className="haf-verdict-v" style={{ color: tone === "bad" ? C.coral : tone === "warn" ? C.amber : C.emerald }}>
                  {monthlyDelta >= 0 ? "+" : ""}{usd0(monthlyDelta)}<span>/mo</span>
                </div>
                <div className="haf-verdict-sub">{tr(`Leaves ${usd0(cushionAfter)}/mo after your current life snapshot.`, lang)}</div>
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
              {tr("A move should leave enough monthly cushion for surprises after rent, bills, and normal life.", lang)}
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
  const lang = useContext(LanguageContext);
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
          body: "This car creates a monthly shortfall. The payment and car costs are more than your current monthly cushion.",
        }
      : savingsAfter < emergencyKeep
      ? {
          tone: "bad",
          icon: AlertTriangle,
          body: "The monthly payment works, but the down payment leaves savings below your emergency cushion.",
        }
      : tone === "warn"
      ? {
          tone: "warn",
          icon: TrendingDown,
          body: "This can work, but it leaves a thin buffer. A lower price, bigger down payment, or shorter term may make it sturdier.",
        }
      : {
          tone: "ok",
          icon: CheckCircle2,
          body: "This keeps your monthly cushion positive and leaves savings above your emergency floor.",
        };
  return (
    <div className="haf-single">
      <div className="haf-layout">
        <aside className="haf-inputs">
          <section className="haf-group is-open">
            <div className="haf-group-head"><span className="haf-group-title"><Car size={16} /> {tr("Car scenario", lang)}</span></div>
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
                {tr("Estimated loan payment", lang)}: <b>{usd0(loanPayment)}/mo</b>
              </div>
            </div>
          </section>
        </aside>
        <main className="haf-main">
          <section className="haf-panel">
            <div className="haf-verdict">
              <div>
                <div className="haf-verdict-k">{tr("This car adds", lang)}</div>
                <div className="haf-verdict-v" style={{ color: tone === "bad" ? C.coral : tone === "warn" ? C.amber : C.emerald }}>
                  {usd0(monthly)}<span>/mo</span>
                </div>
                <div className="haf-verdict-sub">
                  {tr(`Leaves ${usd0(cushionAfter)}/mo monthly cushion and ${usd0(savingsAfter)} saved after down payment.`, lang)}
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
                <h4><T>Car cost</T></h4>
                <Row k="Loan payment" v={loanPayment} />
                <Row k="Insurance" v={num(plan.insurance)} />
                <Row k="Gas / charging" v={num(plan.fuel)} />
                <Row k="Maintenance" v={num(plan.maintenance)} />
                <Row k="Total" v={monthly} total />
              </div>
              <div className="haf-rebuild-col">
                <h4><T>Loan build</T></h4>
                <Row k="Car price" v={num(plan.price)} />
                <Row k="Sales tax" v={tax} />
                <Row k="Title / dealer fees" v={num(plan.fees)} />
                <Row k="Down payment" v={-num(plan.downPayment)} />
                <Row k="Trade-in value" v={-num(plan.tradeIn)} />
                <Row k="Amount financed" v={amountFinanced} total />
              </div>
              <div className="haf-rebuild-col">
                <h4><T>Cash flow impact</T></h4>
                <Row k="Current cushion" v={baseMonthlyCushion} />
                <Row k="Car monthly cost" v={-monthly} />
                <Row k="Cushion after car" v={cushionAfter} total tone={tone} />
              </div>
              <div className="haf-rebuild-col">
                <h4><T>Savings impact</T></h4>
                <Row k="Savings today" v={savings} />
                <Row k="Down payment" v={-num(plan.downPayment)} />
                <Row k="Savings after car" v={savingsAfter} />
                <Row k="Emergency cushion to keep" v={emergencyKeep} />
                <Row k={cashGap > 0 ? "Below cushion by" : "Above cushion by"} v={cashGap > 0 ? cashGap : savingsAfter - emergencyKeep} total tone={cashGap > 0 ? "bad" : tone} />
              </div>
            </div>
            <Flag tone={flag.tone} icon={flag.icon}>
              {tr(flag.body, lang)}
            </Flag>
          </section>
        </main>
      </div>
    </div>
  );
}

function ChildModule({ plan, setField, monthly, upfront, baseMonthlyCushion, savings, onCommit }) {
  const lang = useContext(LanguageContext);
  const cushionAfter = baseMonthlyCushion - monthly;
  const savingsAfter = savings - upfront;
  const tone = cushionAfter < 0 || savingsAfter < 0 ? "bad" : cushionAfter < 500 ? "warn" : "ok";
  const label = plan.path === "adoption" ? "Adopting a child" : "Having a baby";
  return (
    <div className="haf-single">
      <div className="haf-layout">
        <aside className="haf-inputs">
          <section className="haf-group is-open">
            <div className="haf-group-head"><span className="haf-group-title"><Baby size={16} /> {tr("Baby / child scenario", lang)}</span></div>
            <div className="haf-group-body">
              <div className="haf-field">
                <span className="haf-field-label">{tr("Path", lang)}</span>
                <span className="haf-seg haf-seg-wide">
                  <button className={plan.path === "birth" ? "on" : ""} onClick={() => setField("path")("birth")}>
                    {tr("Birth", lang)}
                  </button>
                  <button className={plan.path === "adoption" ? "on" : ""} onClick={() => setField("path")("adoption")}>
                    {tr("Adoption", lang)}
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
                <div className="haf-verdict-k">{tr(label, lang)} {tr("adds about", lang)}</div>
                <div className="haf-verdict-v" style={{ color: tone === "bad" ? C.coral : tone === "warn" ? C.amber : C.emerald }}>
                  {usd0(monthly)}<span>/mo</span>
                </div>
                <div className="haf-verdict-sub">
                  {tr(`Leaves ${usd0(cushionAfter)}/mo monthly cushion and ${usd0(savingsAfter)} saved after upfront costs.`, lang)}
                </div>
              </div>
              <Badge tone={tone}>{tone === "ok" ? "Fits" : tone === "warn" ? "Tight" : "Risky"}</Badge>
            </div>
            <div className="haf-rebuild">
              <div className="haf-rebuild-col">
                <h4><T>Monthly child costs</T></h4>
                <Row k="Childcare" v={num(plan.childcare)} />
                <Row k="Health insurance" v={num(plan.healthInsurance)} />
                <Row k="Supplies" v={num(plan.supplies)} />
                <Row k="Food / formula" v={num(plan.food)} />
                <Row k="Clothing / extras" v={num(plan.clothing)} />
                <Row k="College savings" v={num(plan.collegeSavings)} />
                <Row k="Total" v={monthly} total />
              </div>
              <div className="haf-rebuild-col">
                <h4><T>One-time / early costs</T></h4>
                <Row k={plan.path === "adoption" ? "Adoption costs" : "Medical out-of-pocket"} v={num(plan.medicalOrAdoption)} />
                <Row k="Nursery / gear" v={num(plan.nurseryGear)} />
                <Row k="Leave income gap" v={num(plan.leaveIncomeLoss)} />
                <Row k="Upfront total" v={upfront} total />
              </div>
            </div>
            <div className="haf-action-row">
              <button className="haf-primary-action" onClick={onCommit}>
                <Save size={16} strokeWidth={2.1} /> {tr("Add this child plan to my life", lang)}
              </button>
              <span>
                {tr("This adds childcare and child-related groceries/supplies to your saved snapshot, then subtracts upfront from savings.", lang)}
              </span>
            </div>
            <Flag tone={tone} icon={tone === "bad" ? AlertTriangle : CheckCircle2}>
              <T>This is a planning estimate. Real costs can swing a lot by insurance, family help, leave policy, adoption path, and local childcare prices.</T>
            </Flag>
          </section>
        </main>
      </div>
    </div>
  );
}

function PlanCard({ icon: Icon, title, value, sub, tone, onOpen }) {
  const lang = useContext(LanguageContext);
  return (
    <button className="haf-plan-card" onClick={onOpen}>
      <Icon size={17} strokeWidth={2.1} />
      <div><b>{tr(title, lang)}</b><span>{typeof sub === "string" ? tr(sub, lang) : sub}</span></div>
      <Badge tone={tone}>{value}</Badge>
    </button>
  );
}

function GlossaryPanel() {
  const lang = useContext(LanguageContext);
  return (
    <section className="haf-panel">
      <div className="haf-panel-head">
        <div>
          <h3><BookOpen size={17} strokeWidth={2.1} /> <T>Glossary</T></h3>
          <p><T>Plain-language definitions for terms people may not know yet.</T></p>
        </div>
      </div>
      <div className="haf-glossary">
        {Object.entries(GLOSSARY).map(([term, definition]) => (
          <details key={term}>
            <summary>{GLOSSARY_I18N[lang]?.[term]?.[0] || tr(term, lang)}</summary>
            <p>{GLOSSARY_I18N[lang]?.[term]?.[1] || tr(definition, lang)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Vital({ icon: Icon, label, value, sub }) {
  const lang = useContext(LanguageContext);
  return (
    <div className="haf-vital">
      <div className="haf-vital-top">
        <Icon size={15} strokeWidth={2.1} />
        <span>{tr(label, lang)}</span>
      </div>
      <div className="haf-vital-v">{typeof value === "string" ? tr(value, lang) : value}</div>
      <div className="haf-vital-sub">{typeof sub === "string" ? tr(sub, lang) : sub}</div>
    </div>
  );
}
function Row({ k, v, total, warn, tone }) {
  const lang = useContext(LanguageContext);
  const color = tone === "bad" ? C.coral : tone === "warn" ? C.amber : tone === "ok" ? C.emerald : undefined;
  return (
    <div className={`haf-row ${total ? "is-total" : ""}`}>
      <span className={warn ? "haf-row-warn" : ""}>{tr(k, lang)}</span>
      <b style={color ? { color } : undefined}>{v < 0 ? "−" : ""}{usd0(Math.abs(v))}</b>
    </div>
  );
}
function Mini({ k, v, accent }) {
  const lang = useContext(LanguageContext);
  return (
    <div className={`haf-mini ${accent ? "is-accent" : ""}`}>
      <span>{tr(k, lang)}</span><b>{typeof v === "string" ? tr(v, lang) : v}</b>
    </div>
  );
}
function Flag({ tone, icon: Icon, children }) {
  const lang = useContext(LanguageContext);
  const map = {
    ok: { bg: "#EAF4EE", bd: "#C4E1CF", fg: C.emerald },
    warn: { bg: "#FBF3E2", bd: "#EDD9AE", fg: "#A86F12" },
    bad: { bg: "#FBE9E4", bd: "#EFC7BB", fg: C.coral },
  }[tone];
  return (
    <div className="haf-flag" style={{ background: map.bg, borderColor: map.bd }}>
      <Icon size={17} strokeWidth={2.2} style={{ color: map.fg, flexShrink: 0, marginTop: 1 }} />
      <span>{typeof children === "string" ? tr(children, lang) : children}</span>
    </div>
  );
}
function RevBar({ label, value, max, color }) {
  const lang = useContext(LanguageContext);
  const w = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;
  return (
    <div className="haf-revbar">
      <div className="haf-revbar-top"><span>{tr(label, lang)}</span><b>{usd0(value)}/mo</b></div>
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
.haf-head-top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;}
.haf-eyebrow{font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:${C.teal};}
.haf-title{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:clamp(28px,4.4vw,44px);
  line-height:1.04;margin:8px 0 0;letter-spacing:-.01em;}
.haf-lede{max-width:62ch;color:var(--soft);font-size:15px;margin:12px 0 0;}
.haf-language{display:flex;align-items:flex-start;gap:7px;flex-direction:column;background:${C.paper};
  border:1px solid var(--line);border-radius:12px;padding:10px 11px;min-width:152px;}
.haf-language span{font-size:11.5px;font-weight:650;color:${C.teal};text-transform:uppercase;letter-spacing:.08em;}
.haf-language select{width:100%;border:0;background:#F7F9F7;border-radius:8px;padding:8px 9px;
  font:inherit;font-size:13px;font-weight:650;color:var(--ink);outline:none;cursor:pointer;}

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
.haf-group{background:${C.paper};border:1px solid var(--line);border-radius:15px;overflow:visible;}
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
.haf-term{border-bottom:1px dotted #9AA8A6;cursor:help;text-underline-offset:3px;position:relative;
  display:inline-flex;align-items:center;min-width:0;}
.haf-bubble{position:absolute;left:0;bottom:calc(100% + 8px);z-index:30;width:max-content;max-width:min(280px,80vw);
  background:${C.ink};color:#fff;border-radius:10px;padding:9px 11px;font-size:12px;font-weight:500;
  line-height:1.4;box-shadow:0 10px 28px rgba(20,40,40,.22);opacity:0;pointer-events:none;
  transform:translateY(4px);transition:opacity .15s ease,transform .15s ease;text-align:left;text-transform:none;
  letter-spacing:0;}
.haf-bubble::after{content:"";position:absolute;left:14px;top:100%;border:6px solid transparent;border-top-color:${C.ink};}
.haf-term:hover .haf-bubble,.haf-term:focus-visible .haf-bubble{opacity:1;transform:translateY(0);}
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
.haf-next-room{border-top:1px solid var(--line);padding-top:18px;display:flex;flex-direction:column;gap:18px;}

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
  .haf-head-top{flex-direction:column;}
  .haf-language{width:100%;}
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
