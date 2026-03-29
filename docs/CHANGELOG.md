# Changelog — Kalkulator Obligacji Skarbowych

## Wersja 0.2 (2026-03-24) — Refaktoring + poprawki UX

### Zmiany strukturalne
- [x] Podział monolitycznego `index.html` na 11 modułów JS
- [x] Utworzenie `ARCHITECTURE.md` z mapą plików
- [x] Utworzenie tego pliku (`CHANGELOG.md`) jako checklisty poprawek
- [x] Build script (`build.sh`) do konkatencji na produkcję

### Poprawki danych (na podstawie obligacjeskarbowe.pl)
- [x] TOS zmieniony z WIBOR6M na stałoprocentowy (4,65% fixed) — zgodnie z oficjalną ofertą
- [x] COI zmieniony z kapitalizacji na kupon (odsetki wypłacane co rok) — zgodnie z ofertą
- [x] Zaktualizowane opisy produktów z oficjalnymi danymi

### Poprawki UX — do zrobienia

#### StartView (Krok 0)
- [x] Dodana sekcja wartości nad kartą (3 ikony: porównaj, IKE, realna wartość)
- [x] KPI (kwota + podatek) zmniejszone do jednej linii (pill badge)
- [x] Dodany info box "Dla kogo jest ten kalkulator?"
- [ ] Rozważyć dodanie kontekstu wiekowego (np. "Masz 30 lat? Za 30 lat...")
- [ ] Quick presets: "10 obligacji", "100 obligacji", "1000 obligacji" jako chipy

#### AssumptionsView (Krok 1)
- [x] Horyzont jako slider (range input 1-50) zamiast chipów
- [x] Scenariusze przesunięte pod horyzont
- [x] Dodane opisy scenariuszy (co oznaczają)
- [x] Dodane tooltips (i) przy Inflacji, NBP, WIBOR, Lokacie z wyjaśnieniami
- [ ] Wskaźnik WIBOR 6M — rozważyć ukrycie w trybie prostym (TOS jest fixed)
- [ ] Dodać wizualizację: jak wybrany horyzont wpływa na liczbę cyklów obligacji

#### ProductsView (Krok 2)
- [x] Zaktualizowane opisy produktów z obligacjeskarbowe.pl
- [x] Dodane kolory typów produktów (zmiennoprocentowe/stałe/inflacyjne/rodzinne)
- [x] Dodana legenda kolorów
- [x] Dodane info boxy przy produktach referencyjnych (LOK, KOS, INF)
- [x] Dodane tooltips przy marży, wcześniejszym wykupie, ochronie nominalnej
- [ ] Rozważyć dodanie badge "Polecane" przy EDO i COI
- [ ] Dodać link do obligacjeskarbowe.pl przy każdym produkcie
- [ ] ROS/ROD — dodać info że wymagają programu Rodzina 800+

#### IKEView (Krok 3)
- [x] Jasne wyjaśnienie: korzyść (brak podatku) vs koszt (roczna opłata)
- [x] Wyjaśnienie na podstawie czego naliczana jest opłata IKE
- [x] Info o 3 wariantach porównania (bez IKE / IKE met / IKE not met)
- [ ] Dodać możliwość symulacji sprzedaży części obligacji w dowolnym roku
- [ ] Slider "sprzedaj X% w roku Y" → wpływ na wykres z uwzględnieniem kosztów wykupu
- [ ] Dodać kalkulator: "Ile musisz zarobić żeby IKE się opłacało?"

#### ResultsView (Krok 4)
- [x] Dodany przełącznik KPI: Najlepszy / Bez IKE / Z IKE
- [x] Dodane tooltips na KPI cards (co oznacza każda metryka)
- [x] Dodane opisy hover na przełącznikach wykresu (Nominalnie/Realnie, Netto/Brutto itd.)
- [ ] Dodać porównanie tabelaryczne: "Z IKE vs Bez IKE" obok siebie
- [ ] Dodać wykres kołowy: struktura kosztów (podatek, IKE, wykup)
- [ ] Dodać eksport do PDF / drukowanie wyników

#### DetailsView (Krok 5)
- [ ] Dodać filtrowanie wariantów w tabeli Rok po roku
- [ ] Dodać wykres mini-sparkline w tabeli
- [ ] Dodać przycisk "Kopiuj tabelę do schowka"

#### Ogólne
- [ ] Responsywność: przetestować na 360px (mobile) i 1920px (desktop)
- [ ] Walidacja wizualna: czerwona ramka na błędnych inputach
- [ ] Empty states: lepsze komunikaty gdy brak danych
- [ ] Dodać favicon
- [ ] Dodać meta tags (OG, description) dla udostępniania
- [ ] Rozważyć dark mode

---

## Wersja 0.1 (2026-03-24) — MVP

- [x] Szkielet HTML + CDN (React 18, Babel, Chart.js 4, Google Fonts)
- [x] CSS variables (design tokens z CLAUDE.md)
- [x] Stepper 6-krokowy z nawigacją
- [x] StartView — input obligacji, KPI
- [x] AssumptionsView — presety, horyzont, wskaźniki prosty + zaawansowany
- [x] ProductsView — 10 produktów, toggle, szczegóły
- [x] IKEView — konfiguracja IKE, tabela opłat
- [x] Silnik obliczeń — kapitalizacja, kupony, IKE, Belka, realna wartość
- [x] ResultsView — KPI, wykres, ranking, insighty
- [x] DetailsView — 5 zakładek
- [x] Responsywność 640px breakpoint
