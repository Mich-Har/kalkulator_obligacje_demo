# PRD — Kalkulator Obligacji Skarbowych z Wariantem IKE

> **Dla Claude Code** — dokument opisuje wymagania produktowe, architekturę widoków, model danych i backlog implementacyjny.

---

## 1. Cel produktu

Aplikacja odpowiada na pytanie użytkownika:

> **„Ile będą warte moje środki po zainwestowaniu ich w polskie obligacje skarbowe, przy określonych założeniach inflacji i stóp procentowych — także w wariancie IKE?"**

Narzędzie ma być:
- proste na wejściu, krokowe i prowadzące użytkownika za rękę,
- estetyczne i spokojne wizualnie (styl: stonowany serwis ekspercki, nie panel bankowy),
- zrozumiałe dla osoby nieznającej dobrze mechaniki obligacji,
- wystarczająco elastyczne do późniejszej rozbudowy.

---

## 2. Tech Stack (rekomendacja)

| Warstwa | Technologia |
|---|---|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| Wykresy | Recharts lub Chart.js |
| State management | Zustand lub React Context |
| Build | Vite |
| Testy | Vitest + React Testing Library |

> Aplikacja działa w całości po stronie klienta (no backend na MVP). Wszystkie obliczenia w przeglądarce.

---

## 3. Design System

### Paleta kolorów

| Token | Wartość | Zastosowanie |
|---|---|---|
| `--bg-base` | `#F7F7F5` | Tło aplikacji |
| `--surface` | `#FFFFFF` | Karty, sekcje |
| `--text-primary` | `#1C1C1E` | Nagłówki, wartości |
| `--text-secondary` | `#6B7280` | Opisy, helpertexty |
| `--accent` | `#B05A3A` | CTA, aktywny krok steppera |
| `--accent-alt` | `#1E3A5F` | Linki, kolor drugorzędny |
| `--success` | `#2D6A4F` | Zysk, wartość pozytywna |
| `--warning` | `#B45309` | Inflacja, koszt, ostrzeżenie |
| `--border` | `#E5E7EB` | Ramki kart, separatory |

### Typografia
- Font: `Inter` lub `DM Sans` (Google Fonts)
- H1: `2rem / bold` — tytuł ekranu / wynik
- H2: `1.5rem / semibold` — nagłówek sekcji
- H3: `1.125rem / medium` — podsekcja
- Body: `1rem / regular`
- Caption: `0.875rem / regular / text-secondary`

### Komponenty bazowe
- Karty z `border-radius: 12px`, `box-shadow: 0 1px 4px rgba(0,0,0,0.06)`
- Duże przyciski primary (min-height: 48px)
- Subtelne hover states (`opacity: 0.85`)
- Tooltipy dla pojęć technicznych
- Akordeony / sekcje rozwijane

---

## 4. Architektura aplikacji — Flow

```
StartView → AssumptionsView → ProductsView → IKEView → ResultsView → DetailsView
```

Nawigacja realizowana przez **poziomy Stepper** pod headerem (6 kroków).

### Header
```
[Logo / Nazwa kalkulatora]          [Jak to działa?]  [💾 Zapisz scenariusz – v2]
```

### Stepper
```
● Start  ──  ○ Założenia  ──  ○ Produkty  ──  ○ IKE  ──  ○ Wynik  ──  ○ Szczegóły
```

Aktywny krok wyróżniony kolorem `--accent`. Ukończone kroki oznaczone ikoną ✓.

---

## 5. Widoki — szczegółowa specyfikacja

### 5.1 StartView

**Cel:** Zebranie jednej wartości wejściowej i rozpoczęcie symulacji.

**Layout:** Centralnie wyśrodkowana karta na tle `--bg-base`.

**Treść karty:**
```
Sprawdź, ile mogą być warte Twoje oszczędności
───────────────────────────────────────────────
Wprowadź liczbę obligacji i porównaj, jak zmienia się wartość
Twoich środków w czasie — z uwzględnieniem inflacji, podatku i IKE.

  [ − ]  [ 100 ]  [ + ]        ← NumericInput
  1 obligacja = 100 zł

  Kwota zakupu:    10 000 zł
  Cena jednostkowa:   100 zł
  Podatek Belki:       19%  ⓘ
  Waluta:              PLN

  [ Przejdź do założeń → ]     ← PrimaryButton
```

**Pod kartą** — InfoBox:
> Co uwzględnia symulacja? Oprocentowanie obligacji, inflacja, podatek, koszty IKE, porównanie wariantów.

**Walidacja:**
- `bondCount` > 0, liczba całkowita

---

### 5.2 AssumptionsView

**Cel:** Ustalenie scenariusza ekonomicznego.

**Layout:** 3 sekcje — karty rozwijane.

#### Sekcja A — Horyzont inwestycji

```
Jak długo chcesz oszczędzać?
[ 1 rok ]  [ 3 lata ]  [ 5 lat ]  [ 10 lat ]  [● 12 lat ]  [ Własny ]
```
- Domyślnie: **12 lat**
- "Własny" → input liczbowy (1–50 lat)

#### Sekcja B — Inflacja

Przełącznik trybu: `[ Prosty ]  [ Zaawansowany ]`

**Tryb prosty:**
- Inflacja startowa (rok 1): `4.5%`
- Inflacja docelowa (rok 12): `2.7%`
- Po 12. roku: `stała 2.5%`

**Tryb zaawansowany:**
- Tabela/lista lat 1–12, input `%` dla każdego roku
- Akcje: `Wypełnij automatycznie` | `Ustaw stałą wartość dla wszystkich`
- Reguła po 12. roku: `stała` / `rośnie o X rocznie` / `własna`

**Domyślne wartości:**
| Rok | Inflacja |
|---|---|
| 1 | 4.5% |
| 2 | 4.0% |
| 3 | 3.8% |
| 4 | 3.5% |
| 5 | 3.3% |
| 6 | 3.1% |
| 7 | 3.0% |
| 8 | 2.9% |
| 9 | 2.8% |
| 10 | 2.8% |
| 11 | 2.7% |
| 12 | 2.7% |
| Po 12. roku | 2.5% |

#### Sekcja C — Wskaźniki rynkowe

Analogiczna forma jak inflacja (tryb prosty / zaawansowany). Zawiera **4 wskaźniki** zgodnie z arkuszem produktowym:

| Wskaźnik | Dotyczy produktów | Domyślna wartość (tryb prosty) |
|---|---|---|
| Inflacja (CPI) | COI, EDO, ROS, ROD, INF | 4.00% |
| Stopa referencyjna NBP | ROR, DOR | 5.75% |
| WIBOR 6M | TOS | 5.40% |
| Lokata / benchmark | LOK, KOS | 5.00% |

Tryb prosty: jedna wartość na wskaźnik (stosowana przez cały horyzont).
Tryb zaawansowany: tabela rok 1–12 dla każdego wskaźnika osobno.

> Wartość Lokaty/KOS w założeniach służy jako **sugestia** wypełniająca pole w karcie produktu — użytkownik może ją nadpisać ręcznie w ProductsView.

> 💡 **Propozycja UX:** Na górze widoku dodaj `ScenarioPresetTabs`:
> `[ Konserwatywny ]  [ Bazowy ]  [● Wysoka inflacja ]  [ Optymistyczny ]`
> Wybór presetu wypełnia automatycznie pola inflacji i stóp — to bardzo upraszcza start.

**CTA:** `[ ← Wróć ]` `[ Przejdź do produktów → ]`

---

### 5.3 ProductsView

**Cel:** Wybór produktów do porównania i konfiguracja ich parametrów.

**Layout:** Siatka kart produktowych (3 kolumny desktop, 1 kolumna mobile).

#### Produkty w MVP — parametry rzeczywiste

Dane źródłowe z arkusza kalkulacyjnego (aktualne wartości emisji).

| ID | Nazwa | Zapadalność (m-ce) | Oprocentowanie rok 1 | Wskaźnik indeksacji | Marża | Zmiana oprocent. co (m-ce) | Wypłata odsetek co (m-ce) | Kapitalizacja co (m-ce) | Cena zamiany | Koszt wykupu (zł/szt.) | Ochrona wartości nom. (m-ce) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ROR | Roczne Oszczędnościowe | 12 | 4.25% | Stopa ref. NBP | 0.00% | 1 | 1 | — | 99.90 zł | 0.50 zł | 1 |
| DOR | Dwuletnie Oszczędnościowe | 24 | 4.40% | Stopa ref. NBP | 0.15% | 1 | 1 | — | 99.90 zł | 0.70 zł | 1 |
| TOS | Trzyletnie Oszczędnościowe | 36 | 4.65% | WIBOR 6M | 0.00% | 36 | — | 12 | 99.90 zł | 1.00 zł | pełny okres |
| COI | Czteroletnie Indeksowane | 48 | 5.00% | Inflacja | 1.50% | 12 | — | 12 | 99.90 zł | 2.00 zł | 12 |
| **EDO** | **Emerytalne Dziesięcioletnie** | **120** | **5.60%** | **Inflacja** | **2.00%** | **12** | **—** | **12** | **99.90 zł** | **3.00 zł** | **pełny okres** |
| ROS | Sześcioletnie Rodzinne | 72 | 5.20% | Inflacja | 2.00% | 12 | — | 12 | 99.90 zł | 2.00 zł | pełny okres |
| ROD | Dwunastoletnie Rodzinne | 144 | 5.85% | Inflacja | 2.50% | 12 | — | 12 | 99.90 zł | 3.00 zł | pełny okres |
| LOK | Lokata bankowa | — | *użytkownik wpisuje* | — | — | — | — | — | — | — | — |
| KOS | Konto Oszczędnościowe | — | *użytkownik wpisuje* | — | — | — | — | — | — | — | — |
| INF | Wpłata ind. inflacją | — | benchmark inflacyjny | — | — | — | — | — | — | — | — |

**Domyślnie zaznaczone:** EDO, COI, LOK

**Legenda wskaźników indeksacji:**
- **Inflacja** — GUS, wskaźnik CPI rok do roku; użytkownik definiuje w AssumptionsView
- **Stopa ref. NBP** — użytkownik definiuje w AssumptionsView
- **WIBOR 6M** — użytkownik definiuje w AssumptionsView (dotyczy tylko TOS)
- **LOK / KOS** — użytkownik wpisuje oprocentowanie ręcznie w karcie produktu

#### Struktura karty produktu — obligacje (przykład: EDO)

```
┌──────────────────────────────────────────────┐
│  EDO — obligacje 10-letnie        [● ON/OFF]  │
│  [tag: 10 lat] [tag: inflacyjna]              │
│  Emerytalne obligacje indeksowane inflacją.   │
│  Najwyższa marża wśród obligacji inflacyjnych.│
│                             [Pokaż szczeg. ▾] │
├──────────────────────────────────────────────┤
│  Oprocentowanie w 1. roku:    [ 5.60 ] %      │
│  Marża ponad inflację:        [ 2.00 ] %   ⓘ  │
│  Zmiana oprocentowania co:    [ 12 ] m-cy     │
│  Kapitalizacja odsetek co:    [ 12 ] m-cy  ⓘ  │
│  Koszt wcześniejszego wykupu: [ 3.00 ] zł/szt │
│  Ochrona wartości nom.:       pełny okres  ⓘ  │
└──────────────────────────────────────────────┘
```

#### Struktura karty — Lokata i Konto Oszczędnościowe

Te produkty nie mają wskaźnika indeksacji — użytkownik wpisuje stałe oprocentowanie.

```
┌──────────────────────────────────────────────┐
│  Lokata bankowa                   [● ON/OFF]  │
│  [tag: benchmark] [tag: stałe %]              │
│  Klasyczny depozyt. Wpisz aktualne            │
│  oprocentowanie swojej lokaty.                │
│                             [Pokaż szczeg. ▾] │
├──────────────────────────────────────────────┤
│  Oprocentowanie (rocznie):    [ 5.00 ] %      │
│  (stałe przez cały horyzont)                  │
└──────────────────────────────────────────────┘
```

> Analogicznie Konto Oszczędnościowe — jedno pole `%` rocznie.

#### Struktura karty — TOS (WIBOR 6M)

TOS używa WIBOR 6M jako wskaźnika, który użytkownik ustawia w AssumptionsView. Karta pokazuje wynikową wartość.

```
┌──────────────────────────────────────────────┐
│  TOS — obligacje 3-letnie         [● ON/OFF]  │
│  [tag: 3 lata] [tag: WIBOR 6M]               │
│  Oprocentowanie zmienne oparte na WIBOR 6M.   │
│                             [Pokaż szczeg. ▾] │
├──────────────────────────────────────────────┤
│  Oprocentowanie w 1. roku:    [ 4.65 ] %      │
│  Wskaźnik:                    WIBOR 6M     ⓘ  │
│  Marża:                       [ 0.00 ] %      │
│  Kapitalizacja co:            [ 12 ] m-cy     │
│  Koszt wcześniejszego wykupu: [ 1.00 ] zł/szt │
│  Ochrona wartości nom.:       pełny okres     │
│                                               │
│  ℹ WIBOR 6M ustawiasz w kroku "Założenia"     │
└──────────────────────────────────────────────┘
```

**Walidacja:** minimum 1 aktywny produkt → w przeciwnym razie komunikat empty state.

**CTA:** `[ ← Wróć ]` `[ Przejdź do IKE → ]`

---

### 5.4 IKEView

**Cel:** Opcjonalne porównanie wariantu z IKE.

**Layout:** Jedna karta z przełącznikiem, rozwijana po aktywacji.

```
Czy chcesz porównać inwestycję w wariancie IKE?

  [ Nie, pomiń ]  [● Tak, pokaż IKE ]

  ┌─ Ustawienia IKE ──────────────────────┐
  │  Koszt prowadzenia konta:  [ 0 ] zł/r │
  │  Koszty dodatkowe:         [ 0 ] zł   │
  │  Spełniam warunki IKE:  (●) Tak  ( ) Nie │
  │                                        │
  │  Warianty porównawcze:                 │
  │  ✓ Bez IKE                             │
  │  ✓ IKE — spełniam warunki             │
  │  ✓ IKE — nie spełniam warunków        │
  └────────────────────────────────────────┘
```

**InfoBox pod kartą:**
> Opakowanie w IKE może zwolnić zysk z podatku Belki przy spełnieniu warunków. Porównaj, ile zyskujesz lub tracisz w różnych scenariuszach.

**CTA:** `[ ← Wróć ]` `[ Pokaż wynik → ]`

---

### 5.5 ResultsView

**Cel:** Pokazanie czytelnego, interpretowalnego wyniku.

**Layout:** Sekcje w pionie, od ogółu do szczegółu.

#### Sekcja A — Hero

```
Prognoza wartości Twojej inwestycji
────────────────────────────────────
Dla 100 obligacji i 12-letniego horyzontu najlepszy wynik daje EDO w IKE.
```

> 💡 Podtytuł generowany dynamicznie na podstawie rankingu wariantów.

#### Sekcja B — KPI Cards (1 rząd, 5–6 kart)

| Karta | Wartość demo |
|---|---|
| Wpłacony kapitał | 10 000 zł |
| Wartość końcowa | 14 842 zł |
| Zysk nominalny | +4 842 zł |
| Wartość po inflacji | 12 140 zł |
| Zysk po podatku | +4 120 zł |
| Korzyść z IKE *(jeśli aktywne)* | +722 zł |

Zysk → kolor `--success`. Inflacja/koszt → `--warning`.

#### Sekcja C — Główny wykres

- Typ: wykres liniowy (Recharts `LineChart`)
- Domyślne serie (max 4): najlepszy wariant, drugi wariant, lokata/KOS, inflacja jako benchmark
- Linia inflacji: przerywana, kolor `--warning`

**Kontrolki nad wykresem:**
```
[ Nominalnie | Realnie ]   [ Brutto | Netto ]   [ Z IKE | Bez IKE ]   [ Top 3 | Wszystkie ]
```

> ⚠️ Nie pokazuj domyślnie wszystkich serii — chaos wizualny. Max 3–4 domyślnie aktywne.

#### Sekcja D — Ranking wariantów

Lista kart rankingowych (sortowana po wartości końcowej):

```
1.  EDO w IKE              14 842 zł   +48.4%   Realna: 12 140 zł
    "Najwyższy wynik dzięki indeksacji inflacją i zwolnieniu podatkowemu."

2.  EDO poza IKE           14 120 zł   +41.2%   Realna: 11 580 zł
    ...

5.  Lokata                 11 200 zł   +12.0%   Realna: 9 190 zł
    "W tym scenariuszu nie utrzymuje realnej wartości kapitału."
```

#### Sekcja E — InsightBox

3 automatycznie generowane wnioski na podstawie wyników:

```
💡 Największa przewaga EDO pojawia się po 7. roku.
💡 Wariant IKE zwiększa wartość końcową o 722 zł.
💡 Lokata nie utrzymuje realnej wartości w długim terminie.
```

**CTA:** `[ ← Zmień ustawienia ]` `[ Zobacz szczegóły → ]`

---

### 5.6 DetailsView

**Cel:** Szczegółowa analiza dla zaawansowanych użytkowników.

**Layout:** Zakładki (Tabs).

#### Zakładka: Rok po roku

Tabela z:
- latami w pierwszej kolumnie (sticky),
- produktami w kolejnych kolumnach,
- sticky header,
- przewijaniem poziomym na mobile,
- możliwością ukrywania kolumn.

Przełącznik: `[ Wartości nominalne ]  [ Skumulowana stopa zwrotu ]`

#### Zakładka: Założenia

- Inflacja rok po roku
- Stopy procentowe rok po roku
- Reguła po 12. roku

#### Zakładka: Produkty

Lista aktywnych produktów z ich parametrami.

#### Zakładka: IKE

Porównanie 3 wariantów: bez IKE / IKE spełniam / IKE nie spełniam.

#### Zakładka: Metodologia

Tekstowy opis logiki (spokojny styl „centrum wiedzy"):
- jak liczony jest zysk
- jak uwzględniana jest inflacja
- kiedy naliczany jest podatek Belki
- jak interpretować wartość realną vs nominalną
- jak uwzględniane są koszty konta

---

## 6. Model danych

```typescript
// Typy wskaźników indeksacji — zgodne z arkuszem produktowym
type IndexType = "inflation" | "nbp_ref" | "wibor6m" | "fixed";

type SimulationInput = {
  bondCount: number;                        // liczba obligacji
  unitPrice: number;                        // domyślnie: 100
  taxRate: number;                          // domyślnie: 0.19
  investmentHorizonYears: number;           // horyzont w latach
  inflationMode: "simple" | "advanced";
  inflationByYear: number[];                // tablica dla lat 1–N (CPI)
  inflationAfterYear12: number;
  nbpRateMode: "simple" | "advanced";
  nbpRateByYear: number[];                  // stopa ref. NBP rok po roku
  wibor6mMode: "simple" | "advanced";
  wibor6mByYear: number[];                  // WIBOR 6M rok po roku
  depositRateMode: "simple" | "advanced";
  depositRateByYear: number[];              // oprocentowanie lokaty/KOS
  selectedProducts: ProductConfig[];
  ikeEnabled: boolean;
  ikeConfig?: IKEConfig;
};

type ProductConfig = {
  productId: "ROR"|"DOR"|"TOS"|"COI"|"EDO"|"ROS"|"ROD"|"LOK"|"KOS"|"INF";
  enabled: boolean;
  // Pola wspólne
  maturityMonths?: number;                  // zapadalność w miesiącach
  initialRate: number;                      // oprocentowanie rok 1 (%)
  indexType: IndexType;                     // wskaźnik indeksacji
  margin: number;                           // marża ponad wskaźnik (%)
  rateChangeEveryMonths: number;            // co ile m-cy zmiana oprocent.
  couponEveryMonths?: number;               // co ile m-cy wypłata odsetek (null = brak, kapitalizacja)
  capitalizationEveryMonths?: number;       // co ile m-cy kapitalizacja
  earlyRedemptionFee: number;               // koszt wcześniejszego wykupu zł/szt
  nominalProtectionMonths?: number|"full";  // ochrona wartości nom. (m-ce lub "full")
  // Dla LOK i KOS — stałe oprocentowanie wpisywane przez użytkownika
  fixedRate?: number;
};

// Domyślne wartości ProductConfig zgodne z arkuszem
const DEFAULT_PRODUCTS: ProductConfig[] = [
  { productId: "ROR", enabled: false, maturityMonths: 12,  initialRate: 4.25, indexType: "nbp_ref",  margin: 0.00, rateChangeEveryMonths: 1,  couponEveryMonths: 1,  earlyRedemptionFee: 0.50, nominalProtectionMonths: 1 },
  { productId: "DOR", enabled: false, maturityMonths: 24,  initialRate: 4.40, indexType: "nbp_ref",  margin: 0.15, rateChangeEveryMonths: 1,  couponEveryMonths: 1,  earlyRedemptionFee: 0.70, nominalProtectionMonths: 1 },
  { productId: "TOS", enabled: false, maturityMonths: 36,  initialRate: 4.65, indexType: "wibor6m",  margin: 0.00, rateChangeEveryMonths: 36, capitalizationEveryMonths: 12, earlyRedemptionFee: 1.00, nominalProtectionMonths: "full" },
  { productId: "COI", enabled: true,  maturityMonths: 48,  initialRate: 5.00, indexType: "inflation", margin: 1.50, rateChangeEveryMonths: 12, capitalizationEveryMonths: 12, earlyRedemptionFee: 2.00, nominalProtectionMonths: 12 },
  { productId: "EDO", enabled: true,  maturityMonths: 120, initialRate: 5.60, indexType: "inflation", margin: 2.00, rateChangeEveryMonths: 12, capitalizationEveryMonths: 12, earlyRedemptionFee: 3.00, nominalProtectionMonths: "full" },
  { productId: "ROS", enabled: false, maturityMonths: 72,  initialRate: 5.20, indexType: "inflation", margin: 2.00, rateChangeEveryMonths: 12, capitalizationEveryMonths: 12, earlyRedemptionFee: 2.00, nominalProtectionMonths: "full" },
  { productId: "ROD", enabled: false, maturityMonths: 144, initialRate: 5.85, indexType: "inflation", margin: 2.50, rateChangeEveryMonths: 12, capitalizationEveryMonths: 12, earlyRedemptionFee: 3.00, nominalProtectionMonths: "full" },
  { productId: "LOK", enabled: true,  indexType: "fixed", initialRate: 5.00, margin: 0, rateChangeEveryMonths: 12, earlyRedemptionFee: 0, fixedRate: 5.00 },
  { productId: "KOS", enabled: false, indexType: "fixed", initialRate: 4.00, margin: 0, rateChangeEveryMonths: 12, earlyRedemptionFee: 0, fixedRate: 4.00 },
  { productId: "INF", enabled: false, indexType: "inflation", initialRate: 0, margin: 0, rateChangeEveryMonths: 12, earlyRedemptionFee: 0 },
];

type IKEConfig = {
  annualAccountCost: number;
  additionalCosts: number;
  conditionsMet: boolean;
};

type SimulationResult = {
  initialCapital: number;
  bestVariantId: string;
  totalFinalValue: number;
  nominalProfit: number;
  realFinalValue: number;
  postTaxProfit: number;
  ikeBenefit?: number;
  yearlyResults: YearlyResult[];
  variants: VariantResult[];
  insights: string[];
};

type YearlyResult = {
  year: number;
  inflation: number;
  nbpRate: number;
  wibor6m: number;
  depositRate: number;
  valuesByVariant: Record<string, number>;
};

type VariantResult = {
  variantId: string;
  variantName: string;
  finalValue: number;
  nominalReturnPct: number;
  realValue: number;
  realReturnPct?: number;
  comment?: string;
};
```

---

## 7. Logika biznesowa

### 7.1 Obliczenia wejściowe
```
initialCapital = bondCount × unitPrice
```

### 7.2 Symulacja roczna (dla każdego wariantu i roku)

1. Pobierz parametry produktu dla danego roku
2. Pobierz `inflation[year]` i `rate[year]`
3. Nalicz oprocentowanie wg reguł produktu:
   - **Rok 1:** `initialRate`
   - **Rok N (N>1):** `inflation[N-1] + marginOverInflation` (dla produktów indeksowanych)
4. Zastosuj kapitalizację (`annual` / `monthly`)
5. Odejmij ewentualne opłaty
6. Zapisz `value[year]`

### 7.3 Podatek Belki
- **Standard:** zysk × 0.19 naliczany przy wykupie / na koniec horyzontu
- **IKE spełniam warunki:** brak podatku
- **IKE nie spełniam:** naliczany jak standard

### 7.4 Wartość realna
```
realValue[year] = nominalValue[year] / cumulativeInflationFactor[year]
cumulativeInflationFactor[year] = ∏(1 + inflation[i]) dla i=1..year
```

### 7.5 Placeholder logic (MVP)
Dla produktów poza EDO: uproszczona logika (stałe oprocentowanie przez cały horyzont, brak pełnych wyjątków). Oznaczone `[placeholder]` w komentarzach kodu.

### 7.6 Generowanie insightów
Automatyczne wnioski na podstawie wyników:
- Który wariant wygrywa i od którego roku?
- Różnica wartości końcowej IKE vs bez IKE
- Czy inflacja "bije" lokaty/KOS w danym horyzoncie?

---

## 8. Komponenty UI — lista techniczna

### Layout
- `AppShell` — główny wrapper z headerem i stepperem
- `Header` — logo, linki, CTA
- `Stepper` — poziomy pasek kroków
- `PageContainer` — centralny kontener (max-width: 1200px)
- `StickySummaryBar` — przyklejony pasek z kluczowymi danymi *(opcjonalny)*

### Formularze
- `NumericInput` — input z przyciskami ± 
- `SliderInput` — suwak horyzontu
- `PercentageInput` — input z symbolem %
- `ToggleSwitch` — przełącznik boolean
- `SegmentedControl` — wybór trybu (prosty/zaawansowany)
- `RadioGroup`
- `Select`

### Treść
- `HeroSection` — tytuł ekranu + dynamiczny podtytuł
- `InfoBox` — box z informacją pomocniczą
- `TooltipInfo` — ikona ⓘ z wyjaśnieniem pojęcia
- `ProductCard` — karta produktu z toggle i rozwinięciem
- `SummaryTile` — karta KPI z wartością i etykietą
- `InsightCard` — karta z wnioskiem
- `ScenarioPresetTabs` — gotowe presety założeń

### Dane
- `LineChartPanel` — wykres liniowy z kontrolkami
- `RankingList` — lista rankingowa wariantów
- `DetailsTable` — tabela rok po roku (sticky header, poziome scroll)
- `TabPanel` — zakładki w DetailsView

### Akcje
- `PrimaryButton`
- `SecondaryButton`
- `BackButton`

---

## 9. Stany interfejsu

| Stan | Komunikat |
|---|---|
| `empty` | "Wybierz co najmniej jeden produkt, aby zobaczyć porównanie." |
| `loading` | "Liczymy wynik symulacji…" |
| `error` | "Nie udało się obliczyć wyniku. Sprawdź, czy wszystkie pola są uzupełnione." |
| `success` | ResultsView |

---

## 10. Walidacja

| Widok | Pole | Reguła |
|---|---|---|
| StartView | `bondCount` | całkowita > 0 |
| AssumptionsView | wszystkie `%` | >= 0 |
| AssumptionsView | `horizon` | wybrany |
| ProductsView | produkty | min. 1 aktywny |
| IKEView | koszty (gdy IKE on) | poprawny format liczbowy |

---

## 11. Backlog implementacyjny

### Etap 1 — Szkielet
- [ ] AppShell + Header + Stepper
- [ ] Routing między widokami
- [ ] StartView
- [ ] AssumptionsView (tryb prosty)

### Etap 2 — Produkty
- [ ] ProductsView — siatka kart
- [ ] Pełna logika EDO
- [ ] Placeholdery dla pozostałych produktów
- [ ] Tryb zaawansowany AssumptionsView

### Etap 3 — IKE
- [ ] IKEView
- [ ] Logika podatkowa (standard vs IKE)

### Etap 4 — Wyniki
- [ ] ResultsView — KPI cards
- [ ] Wykres liniowy (LineChartPanel)
- [ ] Ranking wariantów
- [ ] InsightBox z dynamicznymi wnioskami

### Etap 5 — Szczegóły
- [ ] DetailsView — 5 zakładek
- [ ] Tabela rok po roku (sticky header, filtrowanie kolumn)
- [ ] Zakładka Metodologia

### Etap 6 — UX Polish
- [ ] ScenarioPresetTabs (presety założeń)
- [ ] Tooltipy dla pojęć technicznych
- [ ] StickySummaryBar (opcjonalny)
- [ ] Empty states i komunikaty walidacyjne
- [ ] Responsywność mobile

---

## 12. Zakres MVP vs. Future

### MVP ✅
- 6 widoków (Start → Założenia → Produkty → IKE → Wynik → Szczegóły)
- 1 pełny produkt (EDO) + placeholdery dla pozostałych
- 1 główny wykres liniowy
- 1 tabela szczegółowa rok po roku
- Wariant IKE (spełniam / nie spełniam warunków)
- Responsywność desktop + mobile

### Future 🔮
- Zapis scenariuszy lokalnie (localStorage)
- Porównanie 2–3 scenariuszy obok siebie
- Eksport PDF / CSV
- Pełna logika dla wszystkich produktów
- Automatyczne pobieranie aktualnych parametrów obligacji z zewnętrznego API
- Konto użytkownika i synchronizacja scenariuszy
- Rozbudowane komentarze i centrum wiedzy

---

## 13. Definicja sukcesu MVP

MVP jest gotowe, gdy użytkownik może:
1. Wpisać liczbę obligacji
2. Ustawić horyzont i inflację
3. Wybrać produkty do porównania
4. Zdecydować o wariancie IKE
5. Otrzymać czytelny wynik z rankingiem i wykresem
6. Wejść w tabelę szczegółową rok po roku
7. Przejść cały flow **bez zgubienia się**

---

## 14. Jednozdaniowy brief dla wykonawcy

> Zaprojektuj i zbuduj minimalistyczny, wieloetapowy kalkulator inwestycji w polskie obligacje skarbowe — w stylu stonowanego serwisu eksperckiego — który prowadzi użytkownika od podania liczby obligacji, przez założenia rynkowe i wybór produktów, do czytelnego porównania wyników z uwzględnieniem wariantu IKE.
