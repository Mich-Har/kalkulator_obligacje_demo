// ============================================================
// CONSTANTS & DATA
// ============================================================

const STEP_LABELS = ['Start', 'Portfel', 'IKE', 'Wynik', 'Szczegóły'];

const DEFAULT_INFLATION    = [4.5, 4.0, 3.8, 3.5, 3.3, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0];
const DEFAULT_NBP_RATE     = [5.75, 5.25, 4.75, 4.25, 4.00, 3.75, 3.75, 3.75, 3.75, 3.75, 3.75, 3.75];
const DEFAULT_WIBOR6M      = [5.40, 4.90, 4.40, 4.00, 3.75, 3.60, 3.60, 3.60, 3.60, 3.60, 3.60, 3.60];
const DEFAULT_DEPOSIT_RATE = [5.00, 4.80, 4.50, 4.20, 4.00, 3.80, 3.80, 3.80, 3.80, 3.80, 3.80, 3.80];

const IKE_FEE_RATES = { 1: 0.0000, 2: 0.0016, 3: 0.0015, 4: 0.0014, 5: 0.0013, 6: 0.0012, 7: 0.0011 };
const IKE_FEE_RATE_DEFAULT = 0.0010;
const IKE_FEE_CAP = 200;

const PRESETS = {
  konserwatywny: { label: 'Konserwatywny', inflation: 3.0, nbpRate: 4.50, wibor6m: 4.20, depositRate: 4.00 },
  bazowy:        { label: 'Bazowy',        inflation: 4.0, nbpRate: 5.75, wibor6m: 5.40, depositRate: 5.00 },
  wysoka_inflacja: { label: 'Wysoka inflacja', inflation: 7.0, nbpRate: 6.50, wibor6m: 6.20, depositRate: 5.50 },
  optymistyczny: { label: 'Optymistyczny', inflation: 2.5, nbpRate: 3.50, wibor6m: 3.20, depositRate: 3.50 },
};

const PRESET_DESCRIPTIONS = {
  konserwatywny: 'Stabilna gospodarka, niska inflacja, umiarkowane stopy procentowe. Dobre dla pesymistów rynkowych.',
  bazowy: 'Scenariusz najbliższy obecnym prognozom NBP — stopniowa dezinflacja i obniżki stóp.',
  wysoka_inflacja: 'Utrzymująca się wysoka inflacja i odpowiadające jej wysokie stopy. Korzystny dla obligacji indeksowanych inflacją.',
  optymistyczny: 'Szybkie obniżki stóp i niska inflacja. Korzystny dla obligacji stałoprocentowych i lokat.',
};

const PRESET_ADVANCED = {
  konserwatywny: {
    inflation:   [3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0,3.0],
    nbpRate:     [4.50,4.50,4.50,4.50,4.50,4.50,4.50,4.50,4.50,4.50,4.50,4.50],
    wibor6m:     [4.20,4.20,4.20,4.20,4.20,4.20,4.20,4.20,4.20,4.20,4.20,4.20],
    depositRate: [4.00,4.00,4.00,4.00,4.00,4.00,4.00,4.00,4.00,4.00,4.00,4.00],
    after12: { inflation: 3.0, nbpRate: 4.50, wibor6m: 4.20, depositRate: 4.00 },
  },
  bazowy: {
    inflation:   [...DEFAULT_INFLATION],
    nbpRate:     [...DEFAULT_NBP_RATE],
    wibor6m:     [...DEFAULT_WIBOR6M],
    depositRate: [...DEFAULT_DEPOSIT_RATE],
    after12: { inflation: 2.5, nbpRate: 3.50, wibor6m: 3.40, depositRate: 3.50 },
  },
  wysoka_inflacja: {
    inflation:   [7.0,7.0,6.5,6.5,6.0,6.0,5.5,5.5,5.0,5.0,5.0,5.0],
    nbpRate:     [6.50,6.50,6.25,6.00,5.75,5.75,5.50,5.50,5.50,5.50,5.50,5.50],
    wibor6m:     [6.20,6.20,6.00,5.80,5.60,5.60,5.40,5.40,5.40,5.40,5.40,5.40],
    depositRate: [5.50,5.50,5.30,5.20,5.00,5.00,4.80,4.80,4.80,4.80,4.80,4.80],
    after12: { inflation: 4.0, nbpRate: 5.00, wibor6m: 4.80, depositRate: 4.50 },
  },
  optymistyczny: {
    inflation:   [2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5,2.5],
    nbpRate:     [3.50,3.50,3.50,3.50,3.50,3.50,3.50,3.50,3.50,3.50,3.50,3.50],
    wibor6m:     [3.20,3.20,3.20,3.20,3.20,3.20,3.20,3.20,3.20,3.20,3.20,3.20],
    depositRate: [3.50,3.50,3.50,3.50,3.50,3.50,3.50,3.50,3.50,3.50,3.50,3.50],
    after12: { inflation: 2.5, nbpRate: 3.50, wibor6m: 3.20, depositRate: 3.50 },
  },
};

// ============================================================
// PRODUCTS — full specification per obligacjeskarbowe.pl (marzec 2026)
// Each product has `count` = number of bonds to buy (user sets this)
// ============================================================

const DEFAULT_PRODUCTS = [
  { productId: "ROR", count: 0, maturityMonths: 12, initialRate: 4.25, rateChangeMonths: 1, indexType: "nbp_ref", margin: 0.00, couponFrequencyMonths: 1, capitalizationMonths: null, conversionPrice: 99.90, earlyRedemptionFee: 0.50, nominalProtection: true, nominalProtectionMonths: 1, couponType: "coupon", reinvestCoupon: false },
  { productId: "DOR", count: 0, maturityMonths: 24, initialRate: 4.40, rateChangeMonths: 1, indexType: "nbp_ref", margin: 0.15, couponFrequencyMonths: 1, capitalizationMonths: null, conversionPrice: 99.90, earlyRedemptionFee: 0.70, nominalProtection: true, nominalProtectionMonths: 1, couponType: "coupon", reinvestCoupon: false },
  { productId: "TOS", count: 0, maturityMonths: 36, initialRate: 4.65, rateChangeMonths: 36, indexType: "fixed", margin: 0.00, couponFrequencyMonths: null, capitalizationMonths: 12, conversionPrice: 99.90, earlyRedemptionFee: 1.00, nominalProtection: true, nominalProtectionMonths: 'full', couponType: "capitalization", fixedRate: 4.65 },
  { productId: "COI", count: 0, maturityMonths: 48, initialRate: 5.00, rateChangeMonths: 12, indexType: "inflation", margin: 1.50, couponFrequencyMonths: 12, capitalizationMonths: null, conversionPrice: 99.90, earlyRedemptionFee: 2.00, nominalProtection: true, nominalProtectionMonths: 12, couponType: "coupon", reinvestCoupon: false },
  { productId: "EDO", count: 100, maturityMonths: 120, initialRate: 5.60, rateChangeMonths: 12, indexType: "inflation", margin: 2.00, couponFrequencyMonths: null, capitalizationMonths: 12, conversionPrice: 99.90, earlyRedemptionFee: 3.00, nominalProtection: true, nominalProtectionMonths: 'full', couponType: "capitalization" },
  { productId: "ROS", count: 0, maturityMonths: 72, initialRate: 5.20, rateChangeMonths: 12, indexType: "inflation", margin: 2.00, couponFrequencyMonths: null, capitalizationMonths: 12, conversionPrice: 99.90, earlyRedemptionFee: 2.00, nominalProtection: true, nominalProtectionMonths: 'full', couponType: "capitalization" },
  { productId: "ROD", count: 0, maturityMonths: 144, initialRate: 5.85, rateChangeMonths: 12, indexType: "inflation", margin: 2.50, couponFrequencyMonths: null, capitalizationMonths: 12, conversionPrice: null, earlyRedemptionFee: 3.00, nominalProtection: true, nominalProtectionMonths: 'full', couponType: "capitalization" },
];

const DEFAULT_REF_PRODUCTS = [
  { productId: "LOK", count: 0, maturityMonths: null, initialRate: 5.00, rateChangeMonths: null, indexType: "fixed", margin: 0, couponFrequencyMonths: null, capitalizationMonths: 12, conversionPrice: null, earlyRedemptionFee: 0, nominalProtection: false, nominalProtectionMonths: null, couponType: "capitalization", fixedRate: 5.00 },
  { productId: "KOS", count: 0, maturityMonths: null, initialRate: 4.00, rateChangeMonths: null, indexType: "fixed", margin: 0, couponFrequencyMonths: null, capitalizationMonths: 12, conversionPrice: null, earlyRedemptionFee: 0, nominalProtection: false, nominalProtectionMonths: null, couponType: "capitalization", fixedRate: 4.00 },
];

const ALL_DEFAULT_PRODUCTS = [...DEFAULT_PRODUCTS, ...DEFAULT_REF_PRODUCTS];

const PRODUCT_NAMES = {
  ROR: 'ROR (roczne)',
  DOR: 'DOR (2-latki)',
  TOS: 'TOS (3-latki)',
  COI: 'COI (4-latki)',
  EDO: 'EDO (10-latki)',
  ROS: 'ROS (6-latki rodzinne)',
  ROD: 'ROD (12-latki rodzinne)',
  LOK: 'Lokata bankowa',
  KOS: 'Konto oszczędnościowe',
  INF: 'Benchmark inflacyjny',
};

const PRODUCT_SHORT = {
  ROR: 'ROR', DOR: 'DOR', TOS: 'TOS', COI: 'COI', EDO: 'EDO',
  ROS: 'ROS', ROD: 'ROD', LOK: 'Lokata', KOS: 'Konto', INF: 'Inflacja',
};

const PRODUCT_DESCRIPTIONS = {
  ROR: 'Obligacje roczne ze zmiennym oprocentowaniem opartym o stopę referencyjną NBP. Odsetki wypłacane co miesiąc. Najbardziej płynne obligacje skarbowe.',
  DOR: 'Obligacje 2-letnie ze zmiennym oprocentowaniem. Stopa NBP + 0,15% marży. Odsetki co miesiąc.',
  TOS: 'Obligacje 3-letnie o stałym oprocentowaniu 4,65%. Odsetki kapitalizowane rocznie (procent składany). Wypłata przy wykupie.',
  COI: 'Obligacje 4-letnie indeksowane inflacją CPI. Od 2. roku: inflacja + 1,50% marży. Odsetki wypłacane co rok (kupon).',
  EDO: 'Obligacje 10-letnie indeksowane inflacją z najwyższą marżą 2,00%. Odsetki kapitalizowane — potężny efekt procentu składanego. Najlepszy produkt do długoterminowego oszczędzania.',
  ROS: 'Obligacje 6-letnie rodzinne (wymaga programu Rodzina 800+). Inflacja + 2,00% marży. Odsetki kapitalizowane.',
  ROD: 'Obligacje 12-letnie rodzinne (wymaga programu Rodzina 800+). Najwyższa marża 2,50% + inflacja.',
  LOK: 'Symulacja lokaty bankowej ze stałym oprocentowaniem. Możesz dostosować stopę do oferty Twojego banku.',
  KOS: 'Symulacja konta oszczędnościowego. W praktyce banki często zmieniają stawki — tu przyjmujemy stałą wartość.',
};

const PRODUCT_COLORS = {
  ROR: '#3B82F6', DOR: '#6366F1', TOS: '#8B5CF6',
  COI: '#C4622D', EDO: '#A04E22', ROS: '#2D6A4F', ROD: '#1E3A5F',
  LOK: '#0891B2', KOS: '#0D9488', INF: '#92400E',
};

const INDEX_LABELS = {
  inflation: 'Inflacja CPI', nbp_ref: 'Stopa NBP', wibor6m: 'WIBOR 6M',
  fixed: 'Stała stopa', inflation_benchmark: 'Inflacja',
};

const INDICATOR_TOOLTIPS = {
  inflation: 'Inflacja CPI to wskaźnik wzrostu cen publikowany przez GUS. Kluczowy dla obligacji indeksowanych (COI, EDO, ROS, ROD) — ich oprocentowanie od 2. roku to inflacja + marża. Cel inflacyjny NBP: 2,5% +/- 1pp.',
  nbpRate: 'Stopa referencyjna NBP — główna stopa procentowa w Polsce. Bezpośrednio wpływa na ROR i DOR. Gdy NBP obniża stopy — ROR/DOR dają mniej.',
  wibor6m: 'WIBOR 6M — stawka międzybankowa. W aktualnej ofercie (marzec 2026) TOS ma stałe oprocentowanie 4,65%. Wskaźnik pozostaje na wypadek zmian w przyszłych emisjach.',
  depositRate: 'Średnie oprocentowanie lokat i kont oszczędnościowych. Wpływa na wynik LOK i KOS. W praktyce zmienia się wraz ze stopami NBP.',
};

const CHART_COLORS = ['#C4622D', '#1E3A5F', '#2D6A4F', '#7C3AED', '#0891B2', '#DB2777', '#D97706', '#4F46E5', '#059669', '#DC2626'];

const PRODUCT_TOOLTIPS = {
  margin: 'Marża to stała wartość dodawana do wskaźnika bazowego od 2. roku. Np. EDO z marżą 2,00% przy inflacji 4% daje 6% rocznie.',
  earlyRedemption: 'Opłata w zł za obligację przy wykupie przed terminem zapadalności. Potrącana z naliczonych odsetek.',
  nominalProtection: 'Ochrona nominalna gwarantuje, że przy wcześniejszym wykupie otrzymasz co najmniej nominał (100 zł) minus opłata za wykup.',
  capitalization: 'Odsetki doliczane do kapitału — w kolejnych okresach same generują odsetki (procent składany). Im dłuższy okres, tym większy efekt.',
  coupon: 'Odsetki wypłacane na konto (np. co rok). Nie korzystasz z procentu składanego, ale masz regularny dostęp do odsetek.',
  conversionPrice: 'Cena zamiany przy odnowieniu obligacji. Zwykle 99,90 zł zamiast 100 zł — oszczędzasz 0,10 zł na obligacji.',
  rateChange: 'Jak często oprocentowanie może się zmienić. 1 = co miesiąc, 12 = raz w roku, 36 = raz na 3 lata.',
  ike: 'IKE pozwala uniknąć podatku Belki (19%) pod warunkiem oszczędzania do 60. roku życia. Roczna opłata za prowadzenie, ale przy dłuższym horyzoncie korzyść przewyższa koszty.',
};

// Column definitions for the product table
const PRODUCT_TABLE_COLUMNS = [
  { key: 'maturityMonths', label: 'Zapadalność', unit: 'mc', tooltip: 'Liczba miesięcy do wykupu. Po tym czasie państwo oddaje nominał.' },
  { key: 'initialRate', label: '% startowe', unit: '%', tooltip: 'Oprocentowanie na pierwszy okres odsetkowy. Często tylko na początek — potem zależy od wskaźnika.' },
  { key: 'rateChangeMonths', label: 'Zmiana co', unit: 'mc', tooltip: PRODUCT_TOOLTIPS.rateChange },
  { key: 'indexLabel', label: 'Wskaźnik', tooltip: 'Wskaźnik od którego zależy dalsze oprocentowanie: stopa NBP, inflacja CPI lub WIBOR 6M.' },
  { key: 'margin', label: 'Marża', unit: '%', tooltip: PRODUCT_TOOLTIPS.margin },
  { key: 'couponFrequencyMonths', label: 'Odsetki co', unit: 'mc', tooltip: 'Jak często odsetki trafiają na konto. Brak = kapitalizacja (odsetki doliczane do kapitału).' },
  { key: 'capitalizationMonths', label: 'Kapital. co', unit: 'mc', tooltip: PRODUCT_TOOLTIPS.capitalization },
  { key: 'conversionPrice', label: 'Cena zamiany', unit: 'zł', tooltip: PRODUCT_TOOLTIPS.conversionPrice },
  { key: 'earlyRedemptionFee', label: 'Koszt wykupu', unit: 'zł/szt', tooltip: PRODUCT_TOOLTIPS.earlyRedemption },
  { key: 'nominalProtectionMonths', label: 'Ochrona nom.', tooltip: PRODUCT_TOOLTIPS.nominalProtection },
];
