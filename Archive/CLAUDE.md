# CLAUDE.md — Kalkulator Obligacji Skarbowych

Reguły dla Claude Code. Czytaj ten plik przed każdą zmianą w projekcie.
Szczegółowa specyfikacja produktu, widoków i modelu danych jest w `PRD_Kalkulator_Obligacji.md`.

---

## Stack i architektura

- **Jeden plik HTML** (`index.html`) — zero build toolów, zero npm, zero node_modules
- React 18 + ReactDOM przez CDN (`unpkg.com`)
- Babel Standalone przez CDN (transpilacja JSX w przeglądarce)
- Chart.js 4 przez CDN (wykresy)
- Google Fonts przez `<link>` — fonty: `DM Serif Display` (nagłówki) + `DM Sans` (body)
- Zero zewnętrznych frameworków CSS — cały styl inline lub `<style>` w `<head>`
- Zero localStorage, zero fetch, zero backendu — wszystkie obliczenia w przeglądarce

Plik musi działać po otwarciu podwójnym klikiem bez serwera lokalnego.
Musi działać na GitHub Pages bez żadnej konfiguracji.

---

## Struktura pliku index.html

```
<html>
  <head>
    <!-- CDN scripts: React, ReactDOM, Babel, Chart.js -->
    <!-- Google Fonts link -->
    <!-- <style> z CSS variables i globalnymi stylami -->
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel">
      // Cały kod aplikacji tutaj — komponenty, logika, render
      ReactDOM.createRoot(document.getElementById('root')).render(<App />);
    </script>
  </body>
</html>
```

Wszystko w jednym `<script type="text/babel">`. Nie dziel na pliki.

---

## Design tokens — CSS variables

Zdefiniuj w `:root` i używaj WYŁĄCZNIE tych zmiennych w całym kodzie:

```css
:root {
  --bg: #F4F3EF;
  --surface: #FFFFFF;
  --surface-2: #F9F8F5;
  --text: #1A1916;
  --text-2: #6B6860;
  --text-3: #9B9890;
  --accent: #C4622D;
  --accent-light: #F5EDE7;
  --navy: #1E3A5F;
  --navy-light: #E8EEF5;
  --success: #2D6A4F;
  --success-light: #E8F5EE;
  --warning: #92400E;
  --warning-light: #FEF3C7;
  --border: #E2E0DA;
  --shadow: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --radius: 12px;
  --radius-sm: 8px;
}
```

Nigdy nie używaj hardkodowanych kolorów poza tym blokiem.

---

## Typografia

- Nagłówki ekranów / hero: `font-family: 'DM Serif Display', serif`
- Wszystko inne: `font-family: 'DM Sans', sans-serif`
- Nigdy nie używaj Inter, Roboto, Arial ani system-ui
- Hierarchia: H1 `2rem`, H2 `1.375rem`, H3 `1.05rem`, body `1rem`, caption `0.8rem`
- Sekcje pomocnicze: `font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase`

---

## State management

Jeden główny `useState` w komponencie `<App>` — obiekt `state`:

```js
const [state, setState] = React.useState({
  step: 0,                        // aktywny krok (0–5)
  bondCount: 100,
  horizon: 12,
  inflationMode: 'simple',
  inflationByYear: [...],         // tablica 12 wartości
  inflationAfterYear12: 2.5,
  selectedProducts: ['EDO', 'COI', 'LOK'],
  ikeEnabled: false,
  ikeConditionsMet: true,
  ikeAccountCost: 0,
  results: null,                  // null dopóki nie obliczono
});
```

Aktualizacje: `setState(prev => ({ ...prev, klucz: wartość }))`.
Nie twórz wielu useState dla powiązanych danych.

---

## Nawigacja między krokami

- 6 kroków: Start (0) → Założenia (1) → Produkty (2) → IKE (3) → Wynik (4) → Szczegóły (5)
- Nawigacja przez `state.step`
- Przycisk „Dalej" waliduje bieżący krok przed przejściem
- Przycisk „Wróć" zawsze dostępny (poza krokiem 0)
- Stepper u góry pokazuje ukończone kroki jako ✓

---

## Obliczenia — logika biznesowa

Wszystkie obliczenia w funkcji `calculateSimulation(state)` zwracającej obiekt `SimulationResult`.
Szczegółowy model danych i wzory w PRD (sekcja 6 i 7).

**Kluczowe zasady:**
- `initialCapital = bondCount * 100`
- Wartość realna: `realValue[y] = nominalValue[y] / cumulativeInflation[y]`
- Podatek Belki (19%) naliczany przy wykupie, chyba że IKE + warunki spełnione
- EDO rok 1: stała stopa; rok 2+: `inflation[n-1] + margin`
- Dla placeholderów (COI, TOS itd.): uproszczona logika ze stałą stopą
- Obliczenia uruchamiaj tylko po kliknięciu „Oblicz" na kroku IKE/Wynik, nie reaktywnie

---

## Wykres (Chart.js)

- Typ: `line`
- Inicjalizacja w `React.useEffect` po zamontowaniu `ResultsView`
- Zawsze niszczyj poprzednią instancję: `chartInstance.current?.destroy()`
- Domyślnie 3 serie: najlepszy wariant, drugi wariant, inflacja skumulowana
- Inflacja jako linia przerywana (`borderDash: [4, 4]`), kolor `--warning`
- Kontrolki przełączające (Nominalnie/Realnie, Brutto/Netto) rerenderują wykres

---

## Komponenty — nazewnictwo

Każdy widok jako osobny komponent funkcyjny:
- `StartView`, `AssumptionsView`, `ProductsView`, `IKEView`, `ResultsView`, `DetailsView`

Komponenty wielokrotnego użytku:
- `Stepper` — pasek kroków
- `NumericInput` — input z przyciskami ±
- `SegmentedControl` — przełącznik trybów
- `KPICard` — karta z liczbą i etykietą
- `ProductCard` — karta produktu z toggle i rozwinięciem
- `TooltipInfo` — ikona ⓘ z wyjaśnieniem (title= wystarczy na MVP)
- `InsightBox` — box z wnioskami
- `RankingList` — lista rankingowa wariantów

---

## Styl komponentów — zasady

**Karty:**
```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: var(--radius);
box-shadow: var(--shadow);
padding: 1.75rem 2rem;
```

**Przyciski primary:**
```css
background: var(--accent);
color: #fff;
border: none;
border-radius: var(--radius-sm);
padding: 12px 28px;
font-size: 0.95rem;
font-weight: 500;
cursor: pointer;
min-height: 44px;
```

**Inputy:**
```css
border: 1.5px solid var(--border);
border-radius: var(--radius-sm);
padding: 10px 14px;
font-size: 1rem;
font-family: inherit;
background: var(--surface);
```

**Spacing:** używaj wielokrotności `0.25rem`. Między sekcjami minimum `2rem`.
**Nigdy** nie używaj `margin: auto` na elementach tekstowych.

---

## Inline styles w React

Wszystkie style komponentów jako obiekty JS w JSX — nie jako klasy CSS (poza globalnymi w `<style>`).

```jsx
// OK
<div style={{ padding: '1.5rem', background: 'var(--surface)' }}>

// Nie OK  
<div className="card-body">   // chyba że klasa jest zdefiniowana w <style>
```

Wyjątek: globalne utility klasy (np. `.visually-hidden`) mogą być w `<style>`.

---

## Responsywność

- Max-width kontenera: `860px`, wyśrodkowany
- Mobile breakpoint: `@media (max-width: 640px)`
- Na mobile: KPI cards w 2 kolumnach zamiast rzędu
- Na mobile: tabela szczegółowa z `overflow-x: auto`
- Stepper na mobile: scrollowalny poziomo

---

## Walidacja i stany

- Empty state w ProductsView gdy 0 produktów: pokaż komunikat zamiast blokować UI
- Loading state przy obliczeniach: prosty tekst „Obliczam…" przez 300ms (setTimeout)
- Walidacja liczbByYear: każda wartość z zakresu 0–50%
- `bondCount` minimum 1, maksimum 1 000 000

---

## Czego nie robić

- Nie używaj TypeScript — czysty JSX w Babel Standalone
- Nie importuj niczego przez `import/export` — CDN przez `<script>`, globalne zmienne
- Nie twórz osobnych plików CSS
- Nie używaj `document.getElementById` ani `document.querySelector` poza inicjalizacją Chart.js
- Nie dodawaj animacji JavaScript — tylko CSS transitions
- Nie używaj tabel HTML dla layoutu — tylko flexbox i grid
- Nie hardkoduj polskich znaków w nazwach zmiennych JS

---

## Kolejność budowania (etapy)

1. Szkielet HTML + CDN + CSS variables + pusty `<App>` z Stepperem
2. `StartView` — NumericInput + dynamiczne podsumowanie
3. `AssumptionsView` — horyzont + inflacja (tryb prosty)
4. `ProductsView` — karty produktów, EDO z pełnymi polami, reszta placeholder
5. `IKEView` — toggle + ustawienia
6. Logika `calculateSimulation()` — obliczenia dla EDO i placeholderów
7. `ResultsView` — KPI cards + wykres Chart.js + ranking + insighty
8. `DetailsView` — tabela rok po roku + zakładki
9. Tryb zaawansowany w `AssumptionsView`
10. Polish: responsywność, walidacja, tooltips

Buduj etap po etapie. Po każdym etapie aplikacja musi być w pełni działająca.

---

## GitHub Pages — deployment

Po zbudowaniu aplikacja jest gotowa do deploymentu bez żadnych zmian:

1. Utwórz repo na GitHubie
2. Wgraj `index.html` do roota repo
3. Settings → Pages → Source: `main` branch, folder `/`
4. Gotowe — działa pod `https://<username>.github.io/<repo>/`
