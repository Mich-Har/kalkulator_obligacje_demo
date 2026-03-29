# Architektura projektu — Kalkulator Obligacji Skarbowych

## Struktura plików

```
obligacjeSkarbowe/
├── index.html              # Główny plik — ładuje moduły JS (wymaga serwera HTTP)
├── build.sh                # Skrypt budujący dist/index.html (jeden plik, bez serwera)
├── dist/
│   └── index.html          # Zbudowana wersja produkcyjna (GitHub Pages / double-click)
├── js/
│   ├── constants.js        # Stałe, dane produktów, presety, kolory
│   ├── helpers.js          # Funkcje pomocnicze (formatPLN, formatPct, clamp, interpolacja)
│   ├── engine.js           # Silnik obliczeń (getRate, calculateSimulation, IKE fees)
│   ├── ui.js               # Komponenty UI + style (Button, Input, Toggle, Stepper, Header)
│   ├── App.js              # Główny komponent App + ReactDOM.render
│   └── views/
│       ├── StartView.js    # Krok 0 — ekran informacyjny
│       ├── PortfolioView.js # Krok 1 — portfel: produkty + wskaźniki (zwijane sekcje)
│       ├── IKEView.js      # Krok 2 — informacja o IKE
│       ├── ResultsView.js  # Krok 3 — KPI, wykres Chart.js, ranking, IKE toggle, wykup
│       └── DetailsView.js  # Krok 4 — zakładki: rok po roku, założenia, produkty, IKE, metodologia
├── CLAUDE.md               # Instrukcje dla Claude Code (design tokens, reguły)
├── ARCHITECTURE.md         # Ten plik
├── CHANGELOG.md            # Checklista poprawek i wersji
├── PRD_Kalkulator_Obligacji.md
└── Archive/
    ├── PRD_Kalkulator_Obligacjiv3.1.md
    ├── AssumptionsView.js  # (nieużywany — wchłonięty do PortfolioView)
    └── ProductsView.js     # (nieużywany — wchłonięty do PortfolioView)
```

## Nawigacja — 5 kroków

| Krok | Komponent | Opis |
|------|-----------|------|
| 0 | StartView | Informacja co robi kalkulator, jak działa, dla kogo |
| 1 | PortfolioView | **Połączony ekran**: portfel (horyzont + produkty + wskaźniki) z fazami |
| 2 | IKEView | Informacja o IKE (czysto edukacyjna, brak konfiguracji) |
| 3 | ResultsView | Wyniki z IKE toggle ON/OFF, wykresem, rankingiem, częściowym wykupem |
| 4 | DetailsView | 5 zakładek szczegółowych |

## PortfolioView — fazy wewnętrzne

PortfolioView łączy dawne AssumptionsView + ProductsView w jeden ekran z dwoma fazami:

**Faza `products`:**
- Nagłówek portfela (zawsze widoczny): horyzont slider + podsumowanie wybranych obligacji
- Produkty referencyjne (LOK, KOS): toggle ON/OFF + oprocentowanie + liczba sztuk
- Tabela obligacji skarbowych (7 produktów): kolumny z parametrami, ostrzeżenia o wcześniejszym wykupie
- Przycisk "Przejdź do wskaźników"

**Faza `indicators`:**
- Zwięte produkty (chipy z nazwami i liczbami) + przycisk "Edytuj produkty"
- Scenariusz makroekonomiczny z 3 trybami:
  - **Uproszczona**: 1 wartość na wszystkie lata, edytowalna
  - **Scenariusze**: 4 presety, wartości read-only
  - **Zaawansowana**: tabela 12×4 per-rok, edytowalna
- Przy każdym wskaźniku: informacja o wpływie na produkty w portfelu

## Co w którym pliku?

### `js/constants.js` (~160 linii)
- `STEP_LABELS` — nazwy 5 kroków
- `DEFAULT_INFLATION/NBP_RATE/WIBOR6M/DEPOSIT_RATE` — domyślne tablice 12-elementowe
- `IKE_FEE_RATES`, `IKE_FEE_CAP` — opłaty IKE
- `PRESETS` + `PRESET_DESCRIPTIONS` + `PRESET_ADVANCED` — 4 scenariusze makro
- `DEFAULT_PRODUCTS` (7 obligacji), `DEFAULT_REF_PRODUCTS` (LOK, KOS), `ALL_DEFAULT_PRODUCTS`
- Każdy produkt ma pole `count` (ile sztuk) zamiast globalnego `bondCount`
- `PRODUCT_NAMES`, `PRODUCT_SHORT`, `PRODUCT_DESCRIPTIONS` — teksty UI
- `PRODUCT_COLORS` — kolory per produkt
- `PRODUCT_TABLE_COLUMNS` — definicje kolumn tabeli produktów z tooltipami
- `PRODUCT_TOOLTIPS` — wyjaśnienia finansowe (marża, wykup, ochrona nominalna...)
- `INDEX_LABELS`, `INDICATOR_TOOLTIPS` — etykiety i podpowiedzi wskaźników
- `CHART_COLORS` — paleta kolorów wykresu

### `js/helpers.js` (~35 linii)
- `formatPLN(n)` — "10 000 zł"
- `formatPct(n)` — "4,50%"
- `clamp(v, min, max)`
- `interpolateLinear(start, end, count)`
- `pluralYears(n)` — "1 rok" / "3 lata" / "12 lat"

### `js/engine.js` (~240 linii)
- `getIndicator(array, after12, year)` — wskaźnik dla danego roku
- `getRate(product, year, indicators)` — oprocentowanie produktu w roku
- `buildIndicators(state)` — buduje tablice wskaźników z state
- `calculateCumulativeInflation(indicators, horizon)`
- `calculateProductYearly(product, bondCount, horizon, indicators)` — wartość rok po roku
- `applyEarlyRedemption(...)` — koszt wcześniejszego wykupu
- `calculateIkeFees(totalBonds, horizon, additionalCosts)` — tabela opłat IKE
- `getProductIkeFeeShare(...)` — proporcjonalny podział opłat IKE na produkty
- `applyIkeFeesToYearly(...)` — odejmowanie opłat IKE od wartości
- `generateInsights(...)` — reguły insightów
- `calculateSimulation(state, withdrawal)` — **główna funkcja**, opcjonalny wykup częściowy

### `js/ui.js` (~280 linii)
- Style: `cardStyle`, `btnPrimaryStyle`, `btnSecondaryStyle`, `btnCircleStyle`, `inputBaseStyle`, `thStyle`, `tdStyle`
- `TooltipInfo` — click-popup z chmurką
- `NumericInput` — [-] [input] [+]
- `PercentageInput` — input z sufiksem "%"
- `SegmentedControl` — przełącznik z opcjonalnymi tooltipami hover
- `ToggleSwitch` — pill ON/OFF
- `SectionLabel` — uppercase label
- `Tag` — kolorowy tag
- `KPICard` — karta z etykietą + wartością
- `Stepper` — 5-krokowy stepper
- `Header` — "Obligacje PL"

### `js/views/StartView.js` (~80 linii)
- Informacyjny ekran powitalny (brak inputów)
- 4 kroki "Jak działa kalkulator?"
- Karty: czym są obligacje, dla kogo kalkulator
- Przycisk "Zacznij konfigurację"

### `js/views/PortfolioView.js` (~350 linii)
- `PortfolioView` — główny komponent z fazami `products` / `indicators`
  - Nagłówek portfela z horyzontem (zawsze widoczny)
  - Faza products: referencyjne + tabela obligacji
  - Faza indicators: 3 tryby wskaźników + relevance info
- `AdvancedIndicatorTable` — tabela 12×4 + wypełnianie liniowe/stałe

### `js/views/IKEView.js` (~100 linii)
- Czysto informacyjny ekran o IKE
- Tabela opłat IKE (read-only)
- Wyjaśnienie jak działa IKE toggle w wynikach
- Rekomendacja EDO + IKE

### `js/views/ResultsView.js` (~380 linii)
- IKE toggle ON/OFF z wizualną zmianą
- 6 KPI cards (z przekreśleniem wartości bez IKE)
- Wykres Chart.js: nominalne/realne, top3/wszystkie
  - Linia "Nic nie robię" (real) / linia inflacji (nominal)
  - Wyszarzone linie bez IKE gdy IKE ON
- Symulacja częściowego wykupu (produkt + rok + ile szt.)
- Ranking z kosztami IKE
- Insighty

### `js/views/DetailsView.js` (~255 linii)
- 5 zakładek: Rok po roku, Założenia, Produkty, IKE, Metodologia
- `YearByYearTab` — tabela ze sticky kolumną
- `AssumptionsTab` — read-only wskaźniki
- `ProductsTab` — aktywne produkty z kolorami
- `IKETab` — opłaty + porównanie NO_IKE vs IKE_MET
- `MethodologyTab` — 7 sekcji tekstu

### `js/App.js` (~75 linii)
- `App` — jeden `useState`, `goTo()`, `runSimulation()`
- Routing po `state.step` (0-4)
- Loading state
- `ReactDOM.createRoot(...).render(<App />)`

## Model danych — state

```js
{
  step: 0,
  maxReached: 0,
  horizon: 12,
  preset: 'bazowy',
  indicatorMode: 'simple',        // 'simple' | 'scenario' | 'advanced'
  inflationByYear: [...],         // 12-elementowa tablica
  nbpRateByYear: [...],
  wibor6mByYear: [...],
  depositRateByYear: [...],
  indicatorAfterYear12: { inflation, nbpRate, wibor6m, depositRate },
  products: [                     // ALL_DEFAULT_PRODUCTS z polami count
    { productId: "EDO", count: 100, maturityMonths: 120, ... },
    { productId: "LOK", count: 0, fixedRate: 5.00, ... },
    ...
  ],
  ikeEnabled: true,
  ikeConditionsMet: true,
  ikeAdditionalCosts: 0,
  results: null,
  loading: false,
}
```

## Jak uruchomić?

### Rozwój (z serwerem HTTP)
```bash
python -m http.server 8000
# lub: npx serve .
```
Otwórz `http://localhost:8000`

### Produkcja (bez serwera)
```bash
bash build.sh
# Otwórz dist/index.html podwójnym kliknięciem
```

### GitHub Pages
Wgraj `dist/index.html` jako `index.html` do roota repo → Settings → Pages → main → /

## Kolejność ładowania

Babel Standalone przetwarza `<script type="text/babel" src="...">` sekwencyjnie:

1. `constants.js` — stałe (brak zależności)
2. `helpers.js` — formatowanie (brak zależności)
3. `engine.js` — obliczenia (zależy od: constants, helpers)
4. `ui.js` — komponenty bazowe (zależy od: constants, helpers)
5. `views/StartView.js` → `PortfolioView.js` → `IKEView.js` → `ResultsView.js` → `DetailsView.js`
6. `App.js` — główny komponent (zależy od: wszystko powyżej)
