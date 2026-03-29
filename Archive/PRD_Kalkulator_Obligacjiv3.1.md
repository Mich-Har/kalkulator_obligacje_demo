# PRD — Kalkulator Obligacji Skarbowych z Wariantem IKE

> **Dla Claude Code** — specyfikacja produktu, widoków, modelu danych i logiki biznesowej.
> Reguły implementacyjne (stack, styl, kolejność budowania) są w `CLAUDE.md`.

---

## 1. Cel produktu

Aplikacja odpowiada użytkownikowi na pytanie:

> **„Ile będą warte moje środki po zainwestowaniu ich w polskie obligacje skarbowe, przy określonych założeniach inflacji i stóp procentowych — także w wariancie IKE?"**

Narzędzie ma być:
- proste na wejściu, krokowe, prowadzące użytkownika za rękę,
- estetyczne i spokojne wizualnie (styl: stonowany serwis ekspercki, nie panel bankowy),
- zrozumiałe dla osoby nieznającej dobrze mechaniki obligacji,
- elastyczne — LOK i KOS są edytowalnymi referencjami, nie tylko benchmarkami.

---

## 2. Flow aplikacji

```
StartView → AssumptionsView → ProductsView → IKEView → ResultsView → DetailsView
    0             1                2             3           4              5
```

Nawigacja przez **poziomy Stepper** pod headerem. IKEView można **pominąć** — jest opcjonalne.

### Header
```
[ ◆ Obligacje PL ]                           [ Jak to działa? ]
```

### Stepper
```
● Start  ──  ○ Założenia  ──  ○ Produkty  ──  ○ IKE  ──  ○ Wynik  ──  ○ Szczegóły
```
- Aktywny krok: kolor `--accent`
- Ukończone: ikona ✓, kolor `--success`
- Kliknięcie ukończonego kroku → powrót do niego

---

## 3. Widoki

### 3.1 StartView

```
┌────────────────────────────────────────────────────┐
│   Sprawdź, ile mogą być warte                      │
│   Twoje oszczędności                               │
│                                                    │
│   Wprowadź liczbę obligacji i porównaj warianty    │
│   inwestowania — z inflacją, podatkiem i IKE.      │
│                                                    │
│   Liczba obligacji                                 │
│   [ − ]      100      [ + ]                        │
│   1 obligacja = 100 zł                             │
│                                                    │
│   Kwota zakupu: 10 000 zł    Podatek Belki: 19% ⓘ │
│                                                    │
│              [ Przejdź do założeń → ]              │
└────────────────────────────────────────────────────┘

  Co uwzględnia symulacja?
  Oprocentowanie · inflacja · podatek · koszty IKE · porównanie wariantów
```

**Walidacja:** `bondCount` — liczba całkowita, min 1, max 1 000 000.

---

### 3.2 AssumptionsView

#### Presety (nad sekcjami)

```
[ Konserwatywny ]  [● Bazowy ]  [ Wysoka inflacja ]  [ Optymistyczny ]
```

| Preset | Inflacja | Stopa NBP | WIBOR 6M | Lokata |
|---|---|---|---|---|
| Konserwatywny | 3.0% | 4.50% | 4.20% | 4.00% |
| Bazowy | 4.0% | 5.75% | 5.40% | 5.00% |
| Wysoka inflacja | 7.0% | 6.50% | 6.20% | 5.50% |
| Optymistyczny | 2.5% | 3.50% | 3.20% | 3.50% |

#### Sekcja A — Horyzont inwestycji

```
Jak długo chcesz oszczędzać?
[ 1 rok ]  [ 3 lata ]  [ 5 lat ]  [ 10 lat ]  [● 12 lat ]  [ Własny: ___ ]
```

Domyślnie: **12 lat**. "Własny" → pole liczbowe 1–50.

#### Sekcja B — Wskaźniki rynkowe

Przełącznik: `[ Taki sam w każdym roku ]  [ Ustawiam każdy rok osobno ]`

**Tryb prosty** — 4 inputy % w jednym rzędzie:

| Wskaźnik | Używany przez | Domyślnie |
|---|---|---|
| Inflacja (CPI) | COI, EDO, ROS, ROD, INF | 4.00% |
| Stopa ref. NBP | ROR, DOR | 5.75% |
| WIBOR 6M | TOS | 5.40% |
| Lokata (benchmark) | LOK, KOS — sugestia | 5.00% |

**Tryb zaawansowany** — tabela 12 wierszy × 4 kolumny + przyciski:
- `Wypełnij liniowo (od→do)` — interpolacja rok 1→12
- `Ustaw stałą wartość` — ta sama wartość we wszystkich latach

Domyślne wartości zaawansowane (preset Bazowy):

| Rok | Inflacja | Stopa NBP | WIBOR 6M | Lokata |
|---|---|---|---|---|
| 1 | 4.5% | 5.75% | 5.40% | 5.00% |
| 2 | 4.0% | 5.25% | 4.90% | 4.80% |
| 3 | 3.8% | 4.75% | 4.40% | 4.50% |
| 4 | 3.5% | 4.25% | 4.00% | 4.20% |
| 5 | 3.3% | 4.00% | 3.75% | 4.00% |
| 6–12 | 3.0% | 3.75% | 3.60% | 3.80% |
| Po roku 12 | 2.5% | 3.50% | 3.40% | 3.50% |

**CTA:** `[ ← Wróć ]`  `[ Przejdź do produktów → ]`

---

### 3.3 ProductsView

**Layout:** Lista kart (pełna szerokość), podzielona na 2 grupy nagłówkami.

**Grupy:**
1. **Obligacje skarbowe** — ROR, DOR, TOS, COI, EDO, ROS, ROD
2. **Produkty referencyjne** *(edytowalne)* — LOK, KOS, INF

#### Karta obligacji (przykład: EDO)

```
┌───────────────────────────────────────────────────────┐
│  ◆ EDO — Emerytalne 10-letnie              [● ON/OFF] │
│  [ 120 m-cy ] [ inflacja ] [ +2% marży ]              │
│  Obligacje indeksowane inflacją z najwyższą marżą     │
│  spośród produktów detalicznych.                      │
│                                        [ Szczegóły ▾ ]│
├─ po rozwinięciu ──────────────────────────────────────┤
│  Oprocentowanie rok 1:         [ 5.60 ] %             │
│  Marża ponad wskaźnik:         [ 2.00 ] %  ⓘ         │
│  Wskaźnik indeksacji:          Inflacja (CPI)         │
│  Zmiana oprocentowania co:     [ 12 ] m-cy            │
│  Kapitalizacja odsetek co:     [ 12 ] m-cy  ⓘ        │
│  Koszt wcześn. wykupu:         [ 3.00 ] zł/szt  ⓘ    │
│  Ochrona wartości nominalnej:  pełny okres  ⓘ         │
└───────────────────────────────────────────────────────┘
```

Dla ROR i DOR (kupon zamiast kapitalizacji):
```
│  Wypłata odsetek co:      [ 1 ] m-cy                  │
│  Reinwestycja odsetek:    ( ) Tak  (●) Nie  ⓘ         │
```

#### Karta LOK / KOS

```
┌───────────────────────────────────────────────────────┐
│  ◈ Lokata bankowa                          [● ON/OFF] │
│  [ stałe % ] [ referencja ]                           │
│  Klasyczny depozyt. Edytuj oprocentowanie             │
│  lub zostaw wartość z założeń.                        │
│                                        [ Szczegóły ▾ ]│
├─ po rozwinięciu ──────────────────────────────────────┤
│  Oprocentowanie (rocznie): [ 5.00 ] %                 │
│  ℹ Wartość pobrana z założeń. Możesz ją zmienić.      │
└───────────────────────────────────────────────────────┘
```

#### Parametry wszystkich produktów

| ID | Oprocent. rok 1 | Wskaźnik | Marża | Zmiana co (m-cy) | Kapital. co (m-cy) | Kupon co (m-cy) | Wykup (zł/szt) | Ochrona nom. |
|---|---|---|---|---|---|---|---|---|
| ROR | 4.25% | Stopa NBP | 0.00% | 1 | — | 1 | 0.50 | 1 m-c |
| DOR | 4.40% | Stopa NBP | 0.15% | 1 | — | 1 | 0.70 | 1 m-c |
| TOS | 4.65% | WIBOR 6M | 0.00% | 36 | 12 | — | 1.00 | pełny |
| COI | 5.00% | Inflacja | 1.50% | 12 | 12 | — | 2.00 | 12 m-cy |
| EDO | 5.60% | Inflacja | 2.00% | 12 | 12 | — | 3.00 | pełny |
| ROS | 5.20% | Inflacja | 2.00% | 12 | 12 | — | 2.00 | pełny |
| ROD | 5.85% | Inflacja | 2.50% | 12 | 12 | — | 3.00 | pełny |
| LOK | z założeń | stałe | — | — | 12 | — | — | — |
| KOS | z założeń | stałe | — | — | 12 | — | — | — |
| INF | benchmark | inflacja | — | — | — | — | — | — |

**Domyślnie zaznaczone:** EDO ✓, COI ✓, LOK ✓

**Tooltips obowiązkowe:** marża, kapitalizacja, wykup, ochrona wartości nom., reinwestycja.

**CTA:** `[ ← Wróć ]`  `[ Przejdź do IKE → ]`

---

### 3.4 IKEView

**Krok opcjonalny** — zawsze widoczny przycisk `[ Pomiń IKE ]`.

```
┌───────────────────────────────────────────────────────┐
│                                                       │
│  Czy chcesz uwzględnić wariant IKE?                   │
│                                                       │
│  IKE (Indywidualne Konto Emerytalne) pozwala          │
│  uniknąć podatku Belki przy spełnieniu warunków.      │
│  Wiąże się jednak z rocznymi opłatami za prowadzenie  │
│  konta — symulacja uwzględni je w wyniku.             │
│                                                       │
│  [ Nie, pomiń IKE ]   [● Tak, skonfiguruj IKE ]       │
│                                                       │
└───────────────────────────────────────────────────────┘
```

Po wybraniu „Tak":

```
┌─ Ustawienia IKE-Obligacje ────────────────────────────┐
│                                                       │
│  Rok 1 IKE = rok zakupu obligacji (start symulacji). ⓘ │
│  Opłaty naliczane wg roku umowy, niezależnie od roku  │
│  kalendarzowego.                                      │
│  Spełniam warunki zwolnienia z podatku:               │
│  (●) Tak — wiek 60+ lub 55+ i min. 5 lat wpłat       │
│  ( ) Nie — podatek Belki zostanie naliczony           │
│                                                       │
├─ Tabela opłat IKE-Obligacje (PKO BP) ─────────────────┤
│                                                       │
│  Opłaty naliczane od wartości nominalnej obligacji    │
│  na dzień 31 grudnia. Pobierane 20 lutego roku nast.  │
│  W roku podpisania umowy: brak opłaty.                │
│  Maksymalna opłata roczna: 200 zł.                    │
│                                                       │
│  Rok umowy │ Wskaźnik opłaty                          │
│  ──────────┼────────────────                          │
│      1     │    0.00%  (rok podpisania — brak)        │
│      2     │    0.16%                                 │
│      3     │    0.15%                                 │
│      4     │    0.14%                                 │
│      5     │    0.13%                                 │
│      6     │    0.12%                                 │
│      7     │    0.11%                                 │
│     8+     │    0.10%                                 │
│                                                       │
│  Szacowany łączny koszt IKE:  ok. 185 zł  ⓘ          │
│  (dynamicznie przeliczany na podstawie horyzontu)     │
│                                                       │
│  Dodatkowe koszty (opcjonalnie): [ 0.00 ] zł/rok      │
│                                                       │
├─ Porównywane warianty ────────────────────────────────┤
│  ✓ Bez IKE (standard)                                 │
│  ✓ IKE — spełniam warunki zwolnienia                  │
│  ✓ IKE — nie spełniam warunków                        │
└───────────────────────────────────────────────────────┘
```

**CTA:** `[ ← Wróć ]`  `[ Pomiń IKE → ]`  `[ Pokaż wynik → ]`

---

### 3.5 ResultsView

#### Sekcja A — Hero

```
Prognoza wartości Twojej inwestycji
─────────────────────────────────────────────────────────
Dla 100 obligacji i 12-letniego horyzontu
najlepszy wynik daje EDO w IKE (spełniam warunki).
```

Podtytuł dynamiczny z rankingu wariantów.

#### Sekcja B — KPI Cards (2 rzędy po 3)

**Rząd 1:**

| Karta | Demo | Kolor |
|---|---|---|
| Wpłacony kapitał | 10 000 zł | neutralny |
| Wartość końcowa | 14 842 zł | `--success` |
| Zysk nominalny | +4 842 zł | `--success` |

**Rząd 2:**

| Karta | Demo | Kolor |
|---|---|---|
| Wartość realna (po inflacji) | 12 140 zł | `--navy` |
| Zysk po podatku | +4 120 zł | `--success` |
| Korzyść z IKE *(tylko gdy aktywne)* | +722 zł | `--accent` |

Karty wariantów IKE mają badge `IKE` w rogu.

#### Sekcja C — Główny wykres

- Linia, Chart.js
- Domyślnie 3 serie: najlepszy wariant + drugi + inflacja (benchmark, przerywana)

Kontrolki:
```
[ Nominalnie | Realnie ]   [ Brutto | Netto ]   [ Z IKE | Bez IKE ]   [ Top 3 | Wszystkie ]
```

#### Sekcja D — Ranking wariantów

```
1.  EDO w IKE ✓                                   [ IKE ]
    14 842 zł  |  +48.4%  |  Realna: 12 140 zł
    Koszty prowadzenia IKE: (−185 zł łącznie)
    „Najwyższy wynik — indeksacja inflacją + brak podatku Belki."

2.  EDO bez IKE
    14 120 zł  |  +41.2%  |  Realna: 11 580 zł
    „Solidny wynik bez dodatkowych warunków."

3.  COI w IKE ✓                                   [ IKE ]
    13 640 zł  |  +36.4%
    Koszty prowadzenia IKE: (−142 zł łącznie)

5.  Lokata (5%)
    11 200 zł  |  +12.0%  |  Realna: 9 190 zł
    „Nie utrzymuje realnej wartości w długim terminie."
```

Koszty IKE pokazane w nawiasie — zawsze widoczne dla wariantów IKE. Użytkownik widzi ile realnie kosztowało konto.

#### Sekcja E — InsightBox

```
💡 Największa przewaga EDO pojawia się po roku 7.
💡 Wariant IKE zwiększa wartość o 722 zł mimo kosztów prowadzenia (185 zł).
💡 Lokata w tym scenariuszu traci realnie — inflacja wyprzedza ją po roku 4.
```

**CTA:** `[ ← Zmień ustawienia ]`  `[ Zobacz szczegóły → ]`

---

### 3.6 DetailsView

5 zakładek.

#### Rok po roku

Tabela: rok (sticky) × aktywne produkty. Sticky header, scroll-x na mobile, ukrywanie kolumn.
Przełącznik: `[ Wartości nominalne ]  [ Skumulowana stopa zwrotu % ]`
Kolumny IKE pokazują wartość po opłatach.

#### Założenia

Wskaźniki rok po roku: Inflacja, NBP, WIBOR 6M, Lokata. Reguła po roku 12.

#### Produkty

Read-only lista aktywnych produktów z parametrami.

#### IKE

Jeśli IKE pominięte → komunikat: „IKE nie uwzględnione. Wróć do kroku IKE, aby je włączyć." + przycisk.

Jeśli IKE aktywne:
- Tabela rok po roku: rok | wartość nominalna obligacji | rok umowy | wskaźnik | naliczona opłata | po cap 200 zł
- Wiersz sumy: łączne koszty IKE
- Porównanie 3 wariantów: bez IKE / IKE met / IKE not met

#### Metodologia

Opis logiki (styl centrum wiedzy):
- jak liczone jest oprocentowanie rok po roku
- kapitalizacja vs kupon i reinwestycja
- podatek Belki — kiedy i od czego
- wartość realna vs nominalna
- opłaty IKE — wzór, cap 200 zł, opóźnienie pobierania (luty roku następnego)
- uproszczenia przyjęte w MVP

---

## 4. Model danych

```typescript
type IndexType = "inflation" | "nbp_ref" | "wibor6m" | "fixed";

type SimulationInput = {
  bondCount: number;                   // domyślnie: 100
  unitPrice: number;                   // domyślnie: 100
  taxRate: number;                     // domyślnie: 0.19
  investmentHorizonYears: number;      // domyślnie: 12

  indicatorMode: "simple" | "advanced";
  inflationByYear: number[];           // CPI, tablica lat 1–N
  nbpRateByYear: number[];             // Stopa ref. NBP
  wibor6mByYear: number[];             // WIBOR 6M
  depositRateByYear: number[];         // Lokata/KOS benchmark
  indicatorAfterYear12: {
    inflation: number;
    nbpRate: number;
    wibor6m: number;
    depositRate: number;
  };

  products: ProductConfig[];
  ikeEnabled: boolean;
  ikeConfig?: IKEConfig;
};

type ProductConfig = {
  productId: "ROR"|"DOR"|"TOS"|"COI"|"EDO"|"ROS"|"ROD"|"LOK"|"KOS"|"INF";
  enabled: boolean;
  maturityMonths?: number;
  initialRate: number;
  indexType: IndexType;
  margin: number;
  rateChangeEveryMonths: number;
  couponEveryMonths?: number;               // ROR, DOR
  reinvestCoupon?: boolean;
  capitalizationEveryMonths?: number;
  earlyRedemptionFee: number;
  nominalProtectionMonths?: number | "full";
  fixedRate?: number;                       // LOK, KOS
};

// Wartości domyślne — skopiuj 1:1 do kodu
const DEFAULT_PRODUCTS: ProductConfig[] = [
  { productId:"ROR", enabled:false, maturityMonths:12,  initialRate:4.25, indexType:"nbp_ref",   margin:0.00, rateChangeEveryMonths:1,  couponEveryMonths:1,  reinvestCoupon:false, earlyRedemptionFee:0.50, nominalProtectionMonths:1 },
  { productId:"DOR", enabled:false, maturityMonths:24,  initialRate:4.40, indexType:"nbp_ref",   margin:0.15, rateChangeEveryMonths:1,  couponEveryMonths:1,  reinvestCoupon:false, earlyRedemptionFee:0.70, nominalProtectionMonths:1 },
  { productId:"TOS", enabled:false, maturityMonths:36,  initialRate:4.65, indexType:"wibor6m",   margin:0.00, rateChangeEveryMonths:36, capitalizationEveryMonths:12, earlyRedemptionFee:1.00, nominalProtectionMonths:"full" },
  { productId:"COI", enabled:true,  maturityMonths:48,  initialRate:5.00, indexType:"inflation", margin:1.50, rateChangeEveryMonths:12, capitalizationEveryMonths:12, earlyRedemptionFee:2.00, nominalProtectionMonths:12 },
  { productId:"EDO", enabled:true,  maturityMonths:120, initialRate:5.60, indexType:"inflation", margin:2.00, rateChangeEveryMonths:12, capitalizationEveryMonths:12, earlyRedemptionFee:3.00, nominalProtectionMonths:"full" },
  { productId:"ROS", enabled:false, maturityMonths:72,  initialRate:5.20, indexType:"inflation", margin:2.00, rateChangeEveryMonths:12, capitalizationEveryMonths:12, earlyRedemptionFee:2.00, nominalProtectionMonths:"full" },
  { productId:"ROD", enabled:false, maturityMonths:144, initialRate:5.85, indexType:"inflation", margin:2.50, rateChangeEveryMonths:12, capitalizationEveryMonths:12, earlyRedemptionFee:3.00, nominalProtectionMonths:"full" },
  { productId:"LOK", enabled:true,  maturityMonths:undefined, initialRate:5.00, indexType:"fixed", margin:0, rateChangeEveryMonths:12, capitalizationEveryMonths:12, earlyRedemptionFee:0, fixedRate:5.00 },
  { productId:"KOS", enabled:false, maturityMonths:undefined, initialRate:4.00, indexType:"fixed", margin:0, rateChangeEveryMonths:12, capitalizationEveryMonths:12, earlyRedemptionFee:0, fixedRate:4.00 },
  { productId:"INF", enabled:false, maturityMonths:undefined, initialRate:0,    indexType:"inflation", margin:0, rateChangeEveryMonths:12, earlyRedemptionFee:0 },
];

type IKEConfig = {
  // Brak pola startYear — rok 1 IKE = rok 1 symulacji (rok zakupu obligacji)
  conditionsMet: boolean;      // spełniam warunki zwolnienia z podatku
  additionalCosts: number;     // dodatkowe koszty roczne zł
};

// Tabela opłat IKE-Obligacje PKO BP
// Klucz = rok umowy (1 = rok podpisania)
const IKE_FEE_RATES = { 1:0.0000, 2:0.0016, 3:0.0015, 4:0.0014, 5:0.0013, 6:0.0012, 7:0.0011 };
const IKE_FEE_RATE_DEFAULT = 0.0010;  // rok 8 i kolejne
const IKE_FEE_CAP = 200;              // max opłata roczna w zł

type SimulationResult = {
  initialCapital: number;
  bestVariantId: string;
  yearlyResults: YearlyResult[];
  variants: VariantResult[];
  insights: string[];
  summary: {
    finalValue: number;
    nominalProfit: number;
    realFinalValue: number;
    postTaxProfit: number;
    ikeBenefit?: number;        // różnica najlepszy_IKE vs najlepszy_bez_IKE
    ikeTotalCost?: number;      // suma opłat IKE przez horyzont
  };
};

type YearlyResult = {
  year: number;
  inflation: number;
  nbpRate: number;
  wibor6m: number;
  depositRate: number;
  cumulativeInflation: number;
  valuesByVariant: Record<string, number>;
  ikeFeeByVariant?: Record<string, number>;
};

type VariantResult = {
  variantId: string;         // np. "EDO_NO_IKE", "EDO_IKE_MET", "COI_IKE_NOT_MET"
  variantName: string;
  isIKE: boolean;
  finalValue: number;        // po podatkach i opłatach IKE
  finalValueGross: number;   // przed podatkiem
  nominalReturnPct: number;
  realValue: number;
  realReturnPct: number;
  totalIkeCost?: number;     // łączne koszty IKE
  earlyRedemptionCost?: number;
  comment: string;
};
```

---

## 5. Logika biznesowa

### 5.1 Wskaźnik dla danego roku

```
getIndicator(array, afterYear12, year):
  return year <= 12 ? array[year - 1] : afterYear12
```

### 5.2 Oprocentowanie produktu

```
getRate(product, year, indicators):
  if year == 1: return product.initialRate
  prev = year - 1
  base = switch(product.indexType):
    "inflation" → indicators.inflation[prev]
    "nbp_ref"   → indicators.nbpRate[prev]
    "wibor6m"   → indicators.wibor6m[prev]
    "fixed"     → return product.fixedRate   // nie dodawaj marży
  return base + product.margin
```

### 5.3 Wartość rok po roku

**Kapitalizacja (TOS, COI, EDO, ROS, ROD, LOK, KOS):**
```
value[0] = initialCapital
value[y] = value[y-1] × (1 + rate[y] / 100)
```

**Kupon bez reinwestycji (ROR, DOR):**
```
finalValue = initialCapital + Σ (initialCapital × rate[y] / 100)
```

**INF:**
```
value[y] = initialCapital × cumulativeInflation[y]
```

### 5.4 Wcześniejszy wykup

Jeśli `horizon < maturityMonths / 12`:
```
cost = earlyRedemptionFee × bondCount
finalValue -= cost
```
Jeśli ochrona nominalna aktywna:
```
finalValue = max(finalValue, initialCapital - cost)
```

### 5.5 Opłaty IKE

Rok umowy IKE = rok symulacji. Rok 1 symulacji = rok zakupu obligacji = rok podpisania umowy IKE.
Nie ma osobnego pola „rok startu" — IKE zawsze zaczyna się razem z symulacją.

```
// Dla każdego roku horyzontu y = 1..horizon:
contractYear = y   // rok 1 symulacji = rok 1 umowy IKE

feeRate = IKE_FEE_RATES[contractYear] ?? IKE_FEE_RATE_DEFAULT
// contractYear == 1 → feeRate = 0.0000 (rok podpisania, brak opłaty)
// contractYear == 2 → feeRate = 0.0016
// ...
// contractYear >= 8 → feeRate = 0.0010

nominalValue = bondCount × 100   // wartość nominalna na 31 XII roku y
rawFee = nominalValue × feeRate
annualFee = min(rawFee, IKE_FEE_CAP) + ikeConfig.additionalCosts

// Opłata pobierana 20 lutego roku y+1
// W MVP: odejmij annualFee od value na początku roku y+1
// (czyli value[y+1] -= annualFee przed naliczeniem odsetek roku y+1)

totalIkeCost = Σ annualFee[y] dla y = 1..horizon
```

**Przykład dla 100 obligacji, horyzont 12 lat:**

| Rok | Rok umowy | Wskaźnik | Nominał | Opłata surowa | Opłata (cap 200 zł) |
|---|---|---|---|---|---|
| 1 | 1 | 0.00% | 10 000 zł | 0.00 zł | 0.00 zł |
| 2 | 2 | 0.16% | 10 000 zł | 16.00 zł | 16.00 zł |
| 3 | 3 | 0.15% | 10 000 zł | 15.00 zł | 15.00 zł |
| 4–7 | 4–7 | 0.14%→0.11% | ~10 000 zł | ~11–14 zł | ~11–14 zł |
| 8–12 | 8–12 | 0.10% | ~10 000 zł | ~10 zł | ~10 zł |
| **Łącznie** | | | | **~140 zł** | **~140 zł** |

Cap 200 zł jest istotny przy dużej liczbie obligacji (np. 2000 szt. = 200 000 zł nominału).

### 5.6 Podatek Belki

```
profit = finalValue_before_tax - initialCapital
if wariant == "standard" lub "ike_not_met":
  tax = max(profit, 0) × 0.19
  finalValue -= tax
if wariant == "ike_met":
  tax = 0
```

### 5.7 Wartość realna

```
cumulativeInflation[y] = Π (1 + inflation[i]/100) dla i=1..y
realValue[y] = nominalValue[y] / cumulativeInflation[y]
```

### 5.8 Generowanie wariantów

Dla każdego aktywnego produktu:
- `{ID}_NO_IKE` — zawsze
- `{ID}_IKE_MET` — tylko jeśli `ikeEnabled == true`
- `{ID}_IKE_NOT_MET` — tylko jeśli `ikeEnabled == true`

### 5.9 Reguły insightów

```
1. Najlepszy wariant → "{Nazwa}: {wartość końcowa} zł"
2. Crossover → szukaj roku w którym najlepszy wariant wyprzedza drugi
3. IKE → porównaj best_IKE.finalValue vs best_NO_IKE.finalValue:
   - IKE się opłaca: "Wariant IKE zwiększa wartość o X zł mimo kosztów (Y zł)"
   - IKE się nie opłaca: "Koszty IKE (Y zł) pochłaniają korzyść podatkową"
4. LOK vs inflacja → czy LOK.finalValue > INF.finalValue?
```

---

## 6. Komponenty UI

**Layout:** `AppShell`, `Header`, `Stepper`, `PageContainer` (max-width: 860px)

**Formularze:** `NumericInput`, `PercentageInput`, `ToggleSwitch`, `SegmentedControl`, `RadioGroup`, `ScenarioPresetTabs`

**Treść:** `HeroSection`, `InfoBox`, `TooltipInfo`, `ProductCard`, `KPICard`, `InsightBox`, `RankingList`

**Dane:** `LineChartPanel`, `DetailsTable`, `TabPanel`, `IKEFeeTable`

---

## 7. Stany interfejsu

| Stan | Gdzie | Komunikat |
|---|---|---|
| `empty_products` | ProductsView | „Wybierz co najmniej jeden produkt." |
| `ike_skipped` | DetailsView zakładka IKE | „IKE nie uwzględnione. [Włącz IKE]" |
| `loading` | ResultsView | „Obliczam…" (300ms) |
| `no_results` | ResultsView | „Sprawdź, czy wypełniono wszystkie pola." |

---

## 8. Walidacja

| Widok | Pole | Reguła |
|---|---|---|
| StartView | `bondCount` | całkowita ≥ 1, ≤ 1 000 000 |
| AssumptionsView | wskaźniki % | 0–50 |
| AssumptionsView | `horizon` | 1–50 |
| ProductsView | lista | min. 1 enabled |
| IKEView | koszty | ≥ 0 |

---

## 9. MVP vs Future

### MVP ✅
- 6 widoków, pełny flow
- Pełna logika: EDO, COI, LOK, INF
- Uproszczona logika: ROR, DOR, TOS, ROS, ROD
- IKE z realną tabelą opłat PKO BP
- Koszty IKE widoczne w rankingu i szczegółach
- IKEView można pominąć
- Wykres Chart.js + tabela rok po roku
- Responsywność desktop + mobile

### Future 🔮
- Zapis scenariuszy
- Eksport PDF / CSV
- Pełna logika produktów (reinwestycja kuponów, ochrona nominalna)
- Automatyczne pobieranie parametrów z API

---

## 10. Definicja sukcesu MVP

MVP gotowe gdy użytkownik:
1. Wpisuje liczbę obligacji
2. Ustawia horyzont i wskaźniki (lub wybiera preset)
3. Wybiera i konfiguruje produkty (LOK z edytowalnym oprocentowaniem)
4. Pomija lub konfiguruje IKE
5. Widzi ranking z kosztami IKE w nawiasie dla wariantów IKE
6. Wchodzi w zakładkę IKE ze szczegółową tabelą opłat
7. Nie gubi się w żadnym kroku
