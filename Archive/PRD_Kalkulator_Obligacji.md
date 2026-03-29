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
  [suwak od 1 roku z krokiem co 1 rok aż do 50 lat] 
```
- Domyślnie: **12 lat**

#### Sekcja B — Inflacja

Przełącznik trybu: `[ Prosty ]  [ Zaawansowany ]`

**Tryb prosty:**
- Inflacja stały wskaźnik przez cały okres : `4.5%`

**Tryb zaawansowany:**
- Tabela/lista lat 1–12, input `%` dla każdego roku
- Akcje: `Wypełnij automatycznie` | `Ustaw stałą wartość dla wszystkich`

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

- domyślnie dalej 2.7%

#### Sekcja C — Stopy procentowe

Analogiczna forma jak inflacja (tryb prosty / zaawansowany).

**Domyślne wartości:**
| Rok | Stopa |
|---|---|
| 1 | 5.75% |
| 2 | 5.00% |
| 3 | 4.50% |
| 4 | 4.00% |
| 5 | 3.75% |
| 6–12 | trend random między 1% a 5% (placeholder) |

> 💡 **Propozycja UX:** Na górze widoku dodaj `ScenarioPresetTabs`:
> `[ Konserwatywny ]  [ Bazowy ]  [● Wysoka inflacja ]  [ Optymistyczny ]`
> Wybór presetu wypełnia automatycznie pola inflacji i stóp — to bardzo upraszcza start.

**CTA:** `[ ← Wróć ]` `[ Przejdź do produktów → ]`

---

### 5.3 ProductsView

**Cel:** Wybór produktów do porównania i konfiguracja ich parametrów.

**Layout:** Siatka kart produktowych (3 kolumny desktop, 1 kolumna mobile).

#### Produkty w MVP

| ID | Nazwa | Tag | Opis |
|---|---|---|---|
| ROR | Roczne Oszczędnościowe | 1 rok | Placeholder |
| DOR | Dwuletnie Oszczędnościowe | 2 lata | Placeholder |
| TOS | Trzyletnie Oszczędnościowe | 3 lata | Placeholder |
| COI | Czteroletnie Indeksowane | 4 lata | Placeholder |
| **EDO** | **Dziesięcioletnie Emerytalne** | **10 lat** | **Pełna logika** |
| ROS | Sześcioletnie Rodzinne | 6 lat | Placeholder |
| ROD | Dwunastoletnie Rodzinne | 12 lat | Placeholder |
| LOK | Lokata bankowa | benchmark | Placeholder | - wymaga dodania oprocentowania
| KOS | Konto Oszczędnościowe | benchmark | Placeholder | - wymaga dodania oprocentowania
| INF | Wpłata ind. inflacją | benchmark | Placeholder | - wymaga dodania oprocentowania

**Domyślnie zaznaczone:** EDO, COI, Lokata

#### Struktura karty produktu

```
┌─────────────────────────────────────────┐
│  EDO — obligacje 10-letnie    [● ON/OFF] │
│  [tag: 10 lat] [tag: inflacyjna]         │
│  Długoterminowe obligacje indeksowane    │
│  inflacją. Dla osób budujących kapitał.  │
│                          [Pokaż szczeg.] │
├─────────────────────────────────────────┤
│  Oprocentowanie w 1. roku:  [ 6.85 ] %  │
│  Marża ponad inflację:      [ 2.00 ] %  │
│  Kapitalizacja:     [ Roczna ▼ ]    ⓘ  │
│  Opłata za wykup:           [ 2.00 ] zł │
└─────────────────────────────────────────┘
```

**Tooltips wymagane dla:** kapitalizacja, marża, wykup, indeksacja inflacją.

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
Dla 100 obligacji i [x]-letniego horyzontu najlepszy wynik daje EDO w IKE.
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
type SimulationInput = {
  bondCount: number;                        // liczba obligacji
  unitPrice: number;                        // domyślnie: 100
  taxRate: number;                          // domyślnie: 0.19
  investmentHorizonYears: number;           // horyzont w latach
  inflationMode: "simple" | "advanced";
  inflationByYear: number[];                // tablica dla lat 1–N
  inflationAfterYear12: number;             // inflacja po roku 12
  ratesMode: "simple" | "advanced";
  ratesByYear: number[];
  ratesAfterYear12?: number;
  selectedProducts: ProductConfig[];
  ikeEnabled: boolean;
  ikeConfig?: IKEConfig;
};

type ProductConfig = {
  productId: string;
  productName: string;
  enabled: boolean;
  initialRate?: number;                     // oprocentowanie rok 1
  marginOverInflation?: number;             // marża ponad inflację
  capitalization?: "monthly" | "annual" | "none";
  earlyRedemptionFee?: number;              // opłata za wcześniejszy wykup
  customParams?: Record<string, string | number | boolean>;
};

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
  referenceRate?: number;
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
