# CLAUDE.md — Kalkulator Obligacji Skarbowych


## Stack

| Warstwa | Technologia |
|---|---|
| Frontend | React 18 przez CDN (`unpkg.com`) |
| JSX | Babel Standalone przez CDN (transpilacja w przeglądarce) |
| Wykresy | Chart.js 4 przez CDN |
| Fonty | Google Fonts — `DM Serif Display` + `DM Sans` |
| Style | CSS variables + inline styles w JSX |
| Build | Brak — zero npm, zero node_modules |

**Jeden plik** `index.html`. Działa po otwarciu podwójnym klikiem. Działa na GitHub Pages bez konfiguracji.

---

## Struktura pliku

```html
<html>
<head>
  <!-- CDN: React, ReactDOM, Babel, Chart.js -->
  <!-- Google Fonts link -->
  <style>
    :root { /* CSS variables */ }
    /* Globalne style — tylko to co musi być w CSS */
    body, *, html { ... }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    // Stałe danych: DEFAULT_PRODUCTS, IKE_FEE_RATES, PRESETS
    // Komponenty: od najprostszych do złożonych
    // Stan: App z useState
    // Render: ReactDOM.createRoot(...).render(<App />)
  </script>
</body>
</html>
```

Wszystko w jednym `<script type="text/babel">`. Nie dziel na pliki.
Komponenty definiuj w kolejności: pomocnicze → widoki → App.

---

## CDN — dokładne URL

```html
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">
```

---

## Design tokens

```css
:root {
  --bg:             #F4F3EF;
  --surface:        #FFFFFF;
  --surface-2:      #F9F8F5;
  --text:           #1A1916;
  --text-2:         #6B6860;
  --text-3:         #9B9890;
  --accent:         #C4622D;
  --accent-light:   #F5EDE7;
  --accent-dark:    #A04E22;
  --navy:           #1E3A5F;
  --navy-light:     #E8EEF5;
  --success:        #2D6A4F;
  --success-light:  #E8F5EE;
  --warning:        #92400E;
  --warning-light:  #FEF3C7;
  --border:         #E2E0DA;
  --shadow:         0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:      0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  --radius:         12px;
  --radius-sm:      8px;
}
```

Nigdy nie używaj hardkodowanych kolorów poza tym blokiem.

---

## Typografia

- Nagłówki ekranów / hero: `font-family: 'DM Serif Display', serif`
- Całość pozostała: `font-family: 'DM Sans', sans-serif`
- Nigdy: Inter, Roboto, Arial, system-ui
- H1: `2rem`, H2: `1.375rem`, H3: `1.05rem`, body: `1rem`, caption: `0.8rem`
- Etykiety sekcji: `font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3)`

---

## State — jeden obiekt w App

```js

const DEFAULT_INFLATION    = [4.5,4.0,3.8,3.5,3.3,3.0,3.0,3.0,3.0,3.0,3.0,3.0];
const DEFAULT_NBP_RATE     = [5.75,5.25,4.75,4.25,4.00,3.75,3.75,3.75,3.75,3.75,3.75,3.75];
const DEFAULT_WIBOR6M      = [5.40,4.90,4.40,4.00,3.75,3.60,3.60,3.60,3.60,3.60,3.60,3.60];
const DEFAULT_DEPOSIT_RATE = [5.00,4.80,4.50,4.20,4.00,3.80,3.80,3.80,3.80,3.80,3.80,3.80];

const [state, setState] = React.useState({
  step: 0,

  // Start
  bondCount: 100,

  // Założenia
  horizon: 12,
  preset: 'bazowy',            // 'konserwatywny'|'bazowy'|'wysoka_inflacja'|'optymistyczny'
  indicatorMode: 'simple',     // 'simple'|'advanced'
  inflationByYear:    [...DEFAULT_INFLATION],
  nbpRateByYear:      [...DEFAULT_NBP_RATE],
  wibor6mByYear:      [...DEFAULT_WIBOR6M],
  depositRateByYear:  [...DEFAULT_DEPOSIT_RATE],
  indicatorAfterYear12: { inflation: 2.5, nbpRate: 3.5, wibor6m: 3.4, depositRate: 3.5 },

  // Produkty
  products: DEFAULT_PRODUCTS,  // skopiowane z PRD sekcja Model danych

  // IKE
  ikeEnabled: false,
  ikeConditionsMet: true,
  ikeAdditionalCosts: 0,

  // Wynik
  results: null,
});
```

Aktualizacje: `setState(prev => ({ ...prev, pole: wartość }))`.

---

## Nawigacja kroków

- 6 kroków: 0=Start, 1=Założenia, 2=Produkty, 3=IKE, 4=Wynik, 5=Szczegóły
- Stepper u góry, aktywny krok wyróżniony `--accent`, ukończone ✓ w `--success`
- Przycisk „Wróć" zawsze dostępny (poza krokiem 0)
- Krok IKE (3) ma `[ Pomiń IKE → ]` jako równorzędny CTA
- Kliknięcie ukończonego kroku w stepperze → powrót do niego

---

## Obliczenia

Funkcja `calculateSimulation(state)` wywoływana przy przejściu do kroku 4.
Zwraca `SimulationResult` (patrz PRD sekcja 4).

**Kolejność w funkcji:**
1. `initialCapital = state.bondCount × 100`
2. Dla każdego roku 1..horizon: pobierz wskaźniki (`getIndicator`)
3. Dla każdego aktywnego produktu × wariantu (NO_IKE, IKE_MET, IKE_NOT_MET):
   a. Oblicz wartość rok po roku (`getRate` → wartość wg logiki produktu)
   b. Odejmij opłaty IKE jeśli wariant IKE (patrz PRD 5.5)
      contractYear = simulationYear — rok 1 symulacji = rok 1 umowy IKE, brak pola startYear
   c. Odejmij koszt wcześniejszego wykupu jeśli horizon < zapadalność (PRD 5.4)
   d. Nalicz podatek Belki (PRD 5.6)
   e. Oblicz wartość realną (PRD 5.7)
4. Posortuj warianty po `finalValue` malejąco → ranking
5. Wygeneruj 3 insighty (PRD 5.9)
6. Zwróć `SimulationResult`

Stałe `IKE_FEE_RATES`, `IKE_FEE_CAP`, `DEFAULT_PRODUCTS` zdefiniuj na początku skryptu (przed komponentami).

---

## Wykres Chart.js

```js
// W ResultsView:
const chartRef = React.useRef(null);
const chartInstance = React.useRef(null);

React.useEffect(() => {
  chartInstance.current?.destroy();
  chartInstance.current = new Chart(chartRef.current, {
    type: 'line',
    data: { /* serie z yearlyResults */ },
    options: { responsive: true, maintainAspectRatio: false, ... }
  });
  return () => chartInstance.current?.destroy();
}, [state.results, chartMode]);  // chartMode = { nominal/real, gross/net, ike/no_ike, top3/all }
```

Linia inflacji: `borderDash: [5, 5]`, kolor `var(--warning)` → `'#92400E'`.
Domyślnie max 3 serie aktywne.

---

## Style komponentów

**Karta:**
```js
{ background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '1.75rem 2rem' }
```

**Przycisk primary:**
```js
{ background: 'var(--accent)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-sm)', padding: '12px 28px', fontSize: '0.95rem',
  fontWeight: 500, cursor: 'pointer', minHeight: '44px', fontFamily: 'inherit' }
```

**Przycisk secondary:**
```js
{ background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '12px 20px', cursor: 'pointer',
  fontFamily: 'inherit' }
```

**Input:**
```js
{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
  padding: '10px 14px', fontSize: '1rem', fontFamily: 'inherit',
  background: 'var(--surface)', outline: 'none', width: '100%' }
```

**Spacing:** wielokrotności `0.25rem`. Między sekcjami minimum `2rem`.

---

## Inline styles w React

Style komponentów jako obiekty JS w JSX. Klasy CSS tylko dla globalnych utility.

```jsx
// OK
<div style={{ padding: '1.5rem', background: 'var(--surface)' }}>

// OK — klasa w <style>
<div className="sr-only">

// Nie OK — klasy biznesowe w CSS
<div className="card-body">
```

---

## Responsywność

- Max-width kontenera: `860px`, `margin: 0 auto`
- Mobile breakpoint: `@media (max-width: 640px)` — tylko w `<style>`
- KPI cards: 3 kolumny desktop → 2 kolumny mobile
- Stepper: `overflow-x: auto` na mobile
- Tabela szczegółów: `overflow-x: auto`

---

## Zasady czego nie robić

- Nie używaj TypeScript — czysty JSX
- Nie importuj przez `import/export` — CDN jako globalne zmienne
- Nie twórz osobnych plików CSS
- Nie używaj `document.querySelector` poza inicjalizacją Chart.js
- Nie dodawaj animacji JS — tylko CSS `transition`
- Nie hardkoduj kolorów poza `:root`
- Nie używaj `localStorage`
- Nie twórz wielu `useState` dla powiązanych danych

---

## Kolejność budowania

Buduj etap po etapie. Po każdym etapie aplikacja musi być działająca.

1. **Szkielet** — HTML + CDN + CSS variables + `<App>` ze Stepperem + pusta nawigacja
2. **StartView** — NumericInput z ±, dynamiczne KPI (kwota)
3. **AssumptionsView** — presety + horyzont + wskaźniki tryb prosty
4. **ProductsView** — karty produktów (toggle + rozwinięcie), LOK z edytowalnym `fixedRate`
5. **IKEView** — toggle + tabela opłat + pomiń IKE
6. **Silnik obliczeń** — `calculateSimulation()` dla EDO + COI + LOK + INF, reszta placeholder
7. **ResultsView** — KPI cards + wykres Chart.js + ranking (z kosztami IKE) + insighty
8. **DetailsView** — tabela rok po roku + 5 zakładek (zakładka IKE z tabelą opłat)
9. **AssumptionsView tryb zaawansowany** — tabela 12×4 + przyciski pomocnicze
10. **Polish** — responsywność, walidacja, tooltips, empty states

---

## GitHub Pages

Po zbudowaniu:
1. Utwórz repo na GitHubie
2. Wgraj `index.html` do roota repo
3. Settings → Pages → Source: `main` branch, folder `/`
4. Gotowe: `https://<username>.github.io/<repo>/`
