# PRD_claude.md — Dokumentacja techniczna kalkulatora obligacji skarbowych

> Ostatnia aktualizacja: 2026-03-25
> Autor: notatki robocze z sesji z Claude Code

---

## 1. Czym jest ten projekt

Kalkulator porównujący polskie detaliczne obligacje skarbowe (ROR, DOR, TOS, COI, EDO, ROS, ROD) z lokatą bankową i kontem oszczędnościowym — w wariancie z IKE i bez IKE.

Aplikacja prowadzi użytkownika krok po kroku:
**Portfel → IKE → Wynik → Szczegóły**

Cel edukacyjny — nie porady inwestycyjne.

---

## 2. Stack techniczny

| Warstwa | Rozwiązanie |
|---|---|
| Runtime | Przeglądarka — zero backendu |
| Framework | React 18 przez CDN (`unpkg.com`) |
| JSX | Babel Standalone (transpilacja w przeglądarce) |
| Wykresy | Chart.js 4 przez CDN |
| Style | CSS variables (`--accent`, `--navy` itp.) + inline styles w JSX |
| Fonty | Google Fonts — DM Serif Display + DM Sans |
| Build | `build.sh` — konkatenacja plików JS → `dist/index.html` |
| Deploy | GitHub Pages (jeden plik HTML) |

**Zasada:** zero npm, zero node_modules, działa po podwójnym kliknięciu.

---

## 3. Struktura plików

```
obligacjeSkarbowe/
├── build.sh                    ← skrypt budujący dist/index.html
├── dist/
│   └── index.html              ← gotowy plik do wdrożenia
├── js/
│   ├── constants.js            ← stałe: produkty, kolory, presety, IKE_FEE_RATES
│   ├── helpers.js              ← formatPLN, formatPct, clamp, pluralYears itp.
│   ├── engine.js               ← silnik obliczeń: calculateSimulation()
│   ├── ui.js                   ← shared komponenty: cardStyle, btnPrimary, TooltipInfo, NumericInput itp.
│   ├── App.js                  ← główny komponent + ReactDOM.createRoot
│   └── views/
│       ├── StartView.js        ← ekran powitalny (krok 0 — nieużywany w aktualnym flow)
│       ├── PortfolioView.js    ← portfel + suwak horyzontu (krok 1)
│       ├── IKEView.js          ← konfiguracja IKE (krok 2)
│       ├── ResultsView.js      ← wyniki, wykres, ranking (krok 3)
│       └── DetailsView.js      ← szczegóły rok po roku (krok 4)
├── CLAUDE.md                   ← reguły implementacyjne dla Claude
├── PRD_Kalkulator_Obligacji.md ← oryginalne wymagania produktowe
└── PRD_claude.md               ← ten plik
```

---

## 4. Przepływ kroków

```
Krok 0 (Start) → Krok 1 (Portfel) → Krok 2 (IKE) → Krok 3 (Wynik) → Krok 4 (Szczegóły)
                       ↑____________________________|  (można wrócić)
```

- **Stepper** u góry — kliknięcie ukończonego kroku wraca do niego.
- `calculateSimulation()` odpala się **tylko przy przejściu do kroku 3** (nie reaktywnie).
- ResultsView ma własny `useMemo` przeliczający wyniki przy zmianie `withdrawals`.

---

## 5. Produkty

### Obligacje skarbowe (user inwestuje)

| ID | Nazwa | Zapadalność | Typ | Marża | Wykup wcześniejszy |
|---|---|---|---|---|---|
| ROR | Roczne | 12 mc | stopa NBP | — | 0,50 zł/szt |
| DOR | 2-letnie | 24 mc | stopa NBP | +0,15% | 0,70 zł/szt |
| TOS | 3-letnie | 36 mc | stała 4,65% | — | 1,00 zł/szt |
| COI | 4-letnie | 48 mc | inflacja CPI | +1,50% | 2,00 zł/szt |
| EDO | 10-letnie | 120 mc | inflacja CPI | +2,00% | 3,00 zł/szt |
| ROS | 6-letnie rodzinne | 72 mc | inflacja CPI | +2,00% | 2,00 zł/szt |
| ROD | 12-letnie rodzinne | 144 mc | inflacja CPI | +2,50% | 3,00 zł/szt |

### Produkty referencyjne (tylko do porównania — nie podlegają IKE)

| ID | Nazwa | Domyślna stopa |
|---|---|---|
| LOK | Lokata bankowa | 5,00% (edytowalny) |
| KOS | Konto oszczędnościowe | 4,00% (edytowalny) |

**Ważne:** LOK i KOS mają zawsze `count` automatycznie synchronizowany z `bondsTotal` (ustawiany przez `useEffect` w PortfolioView). To sprawia, że obliczenia dla referencji bazują na tej samej kwocie co obligacje.

---

## 6. State aplikacji (App.js)

```js
{
  step: 0,                    // aktualny krok (0-4)
  maxReached: 0,              // najdalszy odwiedzony krok (do nawigacji steppera)
  horizon: 12,                // horyzont w latach (1-50)
  preset: 'bazowy',           // preset scenariusza
  indicatorMode: 'simple',    // 'simple' | 'advanced'
  inflationByYear: [...],     // 12-elementowa tablica %
  nbpRateByYear: [...],
  wibor6mByYear: [...],
  depositRateByYear: [...],
  indicatorAfterYear12: { inflation, nbpRate, wibor6m, depositRate },
  products: [...],            // ALL_DEFAULT_PRODUCTS z count
  ikeEnabled: true,
  ikeConditionsMet: true,
  ikeAdditionalCosts: 0,
  results: null,              // wynik calculateSimulation (przechowywany w state)
  loading: false,
  portfolioWide: false,       // czy tabela produktów jest w trybie rozszerzonym
}
```

---

## 7. Silnik obliczeń (engine.js)

### Główna funkcja

```
calculateSimulation(state, withdrawals?) → SimulationResult
```

### Typy produktów

| `couponType` | Logika |
|---|---|
| `capitalization` | Procent składany rok po roku: `value *= (1 + rate/100)` |
| `coupon` | Odsetki sumowane bez kapitalizacji: `value = capital + Σ(capital × rate/100)` |
| `inflation_benchmark` | Wartość = `capital × cumulativeInflation` (INF, nieaktywny w UI) |

### Warianty per produkt

Dla każdego aktywnego produktu engine generuje **dwa warianty**:
- `NO_IKE` — z podatkiem Belki 19% od zysku
- `IKE_MET` — bez podatku, z opłatami IKE

### Opłaty IKE

```js
IKE_FEE_RATES = { 1: 0%, 2: 0.16%, 3: 0.15%, 4: 0.14%, 5: 0.13%, 6: 0.12%, 7: 0.11% }
IKE_FEE_RATE_DEFAULT = 0.10%  // rok 8+
IKE_FEE_CAP = 200 zł/rok
```

Opłata za rok Y jest **potrącana na początku roku Y+1** (przesunięcie o jeden rok).
Opłaty dzielone proporcjonalnie na produkty wg liczby obligacji.

### Wcześniejszy wykup

Jeśli `horizon < maturityMonths/12`:
- `finalValue -= earlyRedemptionFee × bondCount`
- Jeśli `nominalProtection: true` → `finalValue = max(finalValue, capital - redemptionCost)`

### Pola wariantu (kluczowe)

```js
{
  productId, variantType,      // 'NO_IKE' | 'IKE_MET'
  bondCount,
  yearlyValues: [{year, value, rate, realValue}],
  finalValue,                  // po podatku (NO_IKE) lub bez (IKE_MET)
  finalValueGross,
  realValue,                   // finalValue / cumInflation[horizon]
  tax, ikeCost,
  withdrawnGross,              // kwota wypłacona przy wcześniejszym wykupie
  withdrawnRedemptionFee,
  redemptionCost,
  profit, returnPct,
}
```

---

## 8. ResultsView — kluczowe decyzje projektowe

### Podział: obligacje vs referencje

```
bondCapital = bondTotalCount × 100   ← tylko obligacje (nie LOK/KOS!)
```

LOK/KOS są **wyłączone z `bondCapital`** mimo że `count` się synchronizuje z `bondsTotal`. Powód: LOK/KOS to benchmark, nie inwestycja użytkownika — KPI i ranking muszą pokazywać wynik portfela obligacji.

### Ranking jako portfel

Ranking pokazuje **jeden wiersz dla całego portfela obligacji** (suma wszystkich produktów) + osobne wiersze LOK i KOS. Nie porównuje się EDO vs COI vs ROS oddzielnie.

### Agregaty portfela

```js
pfActiveVal    = Σ finalValue  (obligacje, aktualny wariant IKE/noIKE)
pfActiveReal   = Σ realValue
pfActiveProfit = pfActiveVal - bondCapital
pfActiveTax    = Σ tax (0 gdy IKE)
ikeBenefit     = pfIkeVal - pfNoIkeVal
```

### Trzy scenariusze wykresu

| Scenariusz | Opis |
|---|---|
| `obligacje` | Słupki per produkt + linia sumy portfela + LOK/KOS jako linie przerywane |
| `gotowka` | Linia "gotówka bezczynna" (utrata siły nabywczej) + overlay z procentem utraty |
| `inflacja` | Linia inflacji (ile trzeba mieć żeby zachować siłę nabywczą) |

### Kolumna "po Belce"

Gdy `hasTaxDrop = true` (jakikolwiek wariant ma tax > 0):
- Słupki obligacji = `null` (nie wyświetlają się)
- Linia sumy portfela (NO_IKE) opada do wartości po podatku
- Linie LOK/KOS opadają do wartości po podatku
- Szare tło (`endZonePlugin`) na ostatniej kolumnie

### Wcześniejszy wykup a wykres

`getBondBarVal()` odejmuje `withdrawnGross` od `yearlyValues[i].value` dla lat `>= wYear`, żeby słupki nie pokazywały podwójnie wypłaconej kwoty.

---

## 9. PortfolioView — kluczowe decyzje

### Synchronizacja LOK/KOS

```js
useEffect(() => {
  setState(prev => ({
    ...prev,
    products: prev.products.map(p =>
      ['LOK', 'KOS'].includes(p.productId) ? { ...p, count: bondsTotal } : p
    )
  }));
}, [bondsTotal]);
```

LOK/KOS zawsze mają taką samą wartość nominalną jak portfel obligacji — dla uczciwego porównania.

### Layout karty horyzontu

Karta podzielona na dwie kolumny pionową kreską:
- **Lewa:** "Wartość portfela" (duża liczba) + chipy obligacji
- **Prawa:** "Okres oszczędzania" (duża liczba lat) + suwak 1-50

### Tryb szeroki (portfolioWide)

Przełącznik w prawym górnym rogu tabeli obligacji rozszerza ją do 1300px (domyślnie 920px) pokazując wszystkie kolumny parametrów.

---

## 10. Presety scenariuszy

| Preset | Inflacja | Stopa NBP | WIBOR 6M | Lokata |
|---|---|---|---|---|
| Konserwatywny | 3,0% | 4,50% | 4,20% | 4,00% |
| Bazowy | 4,0% (maleje do 3,0%) | 5,75% (maleje do 3,75%) | 5,40% (maleje do 3,60%) | 5,00% (maleje do 3,80%) |
| Wysoka inflacja | 7,0% (maleje do 5,0%) | 6,50% (maleje do 5,50%) | 6,20% (maleje do 5,40%) | 5,50% (maleje do 4,80%) |
| Optymistyczny | 2,5% | 3,50% | 3,20% | 3,50% |

Tryb zaawansowany pozwala edytować każdy rok osobno (tabela 12×4 + wartość po roku 12).

---

## 11. Naprawione bugi (historia)

| Bug | Przyczyna | Rozwiązanie |
|---|---|---|
| KPI pokazywało 2× wartość portfela | LOK/KOS `count` = `bondsTotal` → `summary.totalCapital` = 2-3× wartość obligacji | Obliczamy `bondCapital` tylko z obligacji (bez LOK/KOS) |
| Słupki wykresu nie malały po wcześniejszym wykupie | `yearlyValues[i].value` zawierał `withdrawnGross` dodane z powrotem | Dodano `withdrawnGross` do wariantu; `getBondBarVal()` je odejmuje |
| Tooltip overflow (tekst wychodził poza chmurę) | Brak `whiteSpace: normal` i `wordBreak: break-word` | Dodano oba style do div tooltipa |

---

## 12. Znane uproszczenia / założenia

- Automatyczne reinwestowanie po zapadnięciu obligacji (ROR/DOR/TOS po zapadalności reinwestowane przez cały horyzont)
- Rok 1 symulacji = rok 1 umowy IKE (brak pola startYear)
- Stopa lokaty i konta oszczędnościowego stała przez cały horyzont (edytowalna przez użytkownika)
- Podatek Belki naliczany od łącznego zysku na koniec (nie co roku)
- LOK/KOS nie mają ochrony nominalnej ani wcześniejszego wykupu

---

## 13. Build i deploy

```bash
bash build.sh
# → dist/index.html (gotowy do wdrożenia)
```

Plik `build.sh` konkatenuje pliki JS w odpowiedniej kolejności do szablonu HTML.

GitHub Pages: wgraj `dist/index.html` jako `index.html` do roota repo → Settings → Pages → main branch.
