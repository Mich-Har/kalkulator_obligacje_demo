// ============================================================
// STEP 5: DETAILS VIEW
// ============================================================

function DetailsView({ state, setState, onBack }) {
  const [tab, setTab] = React.useState(0);
  const tabs = ['Rok po roku', 'Założenia', 'Produkty', 'IKE', 'Metodologia'];
  const results = state.results;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--border)', overflowX: 'auto' }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{
              padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: tab === i ? 600 : 400,
              color: tab === i ? 'var(--accent)' : 'var(--text-3)',
              borderBottom: tab === i ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-2px', whiteSpace: 'nowrap', transition: 'all 0.2s ease',
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <YearByYearTab results={results} state={state} />}
      {tab === 1 && <AssumptionsTab state={state} />}
      {tab === 2 && <ProductsTab state={state} />}
      {tab === 3 && <IKETab state={state} />}
      {tab === 4 && <MethodologyTab />}

      <div className="btn-row" style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button onClick={onBack} style={btnSecondaryStyle}>{'\u2190'} Wróć do wyniku</button>
      </div>
    </div>
  );
}

function YearByYearTab({ results, state }) {
  const [mode, setMode] = React.useState('value');
  if (!results) return null;
  const capital = state.products.reduce((s, p) => s + (p.count || 0) * 100, 0);
  const variants = results.variants.filter(v => v.productId !== 'INF');

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Wartości rok po roku</h3>
        <SegmentedControl
          options={[{ value: 'value', label: 'Nominalna' }, { value: 'return', label: 'Stopa zwrotu' }]}
          value={mode} onChange={setMode} />
      </div>
      <div className="detail-table-wrap" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '600px' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1 }}>Rok</th>
              {variants.map(v => <th key={v.productId + v.variantType} style={thStyle}>{v.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: results.horizon + 1 }, (_, y) => (
              <tr key={y}>
                <td style={{ ...tdStyle, fontWeight: 600, position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1 }}>
                  {y === 0 ? 'Start' : y}
                </td>
                {variants.map(v => {
                  const val = v.yearlyValues[y]?.value ?? capital;
                  return (
                    <td key={v.productId + v.variantType} style={tdStyle}>
                      {mode === 'value' ? formatPLN(val) : (y === 0 ? '\u2014' : formatPct(((val - capital) / capital) * 100))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssumptionsTab({ state }) {
  const indicators = buildIndicators(state);
  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>Wskaźniki rok po roku</h3>
      <div className="detail-table-wrap" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th style={thStyle}>Rok</th>
              <th style={thStyle}>Inflacja</th>
              <th style={thStyle}>Stopa NBP</th>
              <th style={thStyle}>WIBOR 6M</th>
              <th style={thStyle}>Lokata</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: state.horizon }, (_, i) => (
              <tr key={i}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{i + 1}</td>
                <td style={tdStyle}>{formatPct(indicators.inflation[i])}</td>
                <td style={tdStyle}>{formatPct(indicators.nbpRate[i])}</td>
                <td style={tdStyle}>{formatPct(indicators.wibor6m[i])}</td>
                <td style={tdStyle}>{formatPct(indicators.depositRate[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {state.horizon > 12 && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.5rem' }}>
          Po roku 12: Inflacja {formatPct(state.indicatorAfterYear12.inflation)}, NBP {formatPct(state.indicatorAfterYear12.nbpRate)}, WIBOR {formatPct(state.indicatorAfterYear12.wibor6m)}, Lokata {formatPct(state.indicatorAfterYear12.depositRate)}
        </p>
      )}
    </div>
  );
}

function ProductsTab({ state }) {
  const enabled = state.products.filter(p => (p.count || 0) > 0);
  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>Aktywne produkty</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {enabled.map(p => (
          <div key={p.productId} style={{ padding: '0.75rem 1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid ' + (PRODUCT_COLORS[p.productId] || 'var(--border)') }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{PRODUCT_NAMES[p.productId]}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.25rem' }}>
              <span>Start: {formatPct(p.initialRate)}</span>
              {p.margin > 0 && <span>Marża: {formatPct(p.margin)}</span>}
              <span>Indeks: {INDEX_LABELS[p.indexType]}</span>
              {p.maturityMonths && <span>Zapadalność: {p.maturityMonths / 12} lat</span>}
              {p.earlyRedemptionFee > 0 && <span>Wykup: {p.earlyRedemptionFee} zł/szt</span>}
              {p.fixedRate !== undefined && <span>Stopa: {formatPct(p.fixedRate)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IKETab({ state }) {
  const totalBonds = state.products.reduce((s, p) => s + (p.count || 0), 0);
  const ikeFees = calculateIkeFees(totalBonds, state.horizon, state.ikeAdditionalCosts || 0);
  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>Opłaty IKE rok po roku</h3>
      <div className="detail-table-wrap" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th style={thStyle}>Rok</th>
              <th style={thStyle}>Rok umowy</th>
              <th style={thStyle}>Wskaźnik</th>
              <th style={thStyle}>Opłata surowa</th>
              <th style={thStyle}>Opłata (po cap)</th>
            </tr>
          </thead>
          <tbody>
            {ikeFees.fees.map(f => (
              <tr key={f.year}>
                <td style={tdStyle}>{f.year}</td>
                <td style={tdStyle}>{f.contractYear}</td>
                <td style={tdStyle}>{(f.feeRate * 100).toFixed(2)}%</td>
                <td style={tdStyle}>{formatPLN(f.rawFee)}</td>
                <td style={tdStyle}>{formatPLN(f.fee)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 600 }}>
              <td colSpan={4} style={{ ...tdStyle, textAlign: 'right' }}>Suma:</td>
              <td style={tdStyle}>{formatPLN(ikeFees.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {state.results && (
        <div style={{ marginTop: '1.25rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem' }}>Porównanie wariantów</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {['NO_IKE', 'IKE_MET'].map(vt => {
              const best = state.results.variants.filter(v => v.variantType === vt).sort((a, b) => b.finalValue - a.finalValue)[0];
              if (!best) return null;
              const labels = { NO_IKE: 'Bez IKE (z podatkiem Belki)', IKE_MET: 'Z IKE (bez podatku)' };
              return (
                <div key={vt} style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '0.25rem' }}>{labels[vt]}</div>
                  <div style={{ fontWeight: 600 }}>{formatPLN(best.finalValue)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>
                    Podatek: {formatPLN(best.tax)} {'\u00B7'} IKE: {formatPLN(best.ikeCost)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MethodologyTab() {
  const sections = [
    {
      title: 'Jak liczone jest oprocentowanie rok po roku?',
      content: 'Rok 1: Oprocentowanie startowe produktu (np. 5,60% dla EDO).\nRok 2+: Wskaźnik z roku poprzedniego + marża produktu (np. inflacja z roku 1 + 2,00% dla EDO).\nDla produktów stałych (TOS, LOK, KOS): stała wartość przez cały okres.\nDla zmiennoprocentowych (ROR, DOR): stopa referencyjna NBP + marża.',
    },
    {
      title: 'Kapitalizacja vs Kupon',
      content: 'Kapitalizacja (TOS, EDO, ROS, ROD, LOK, KOS): odsetki dodawane do kapitału każdego roku.\nWzór: wartość[rok] = wartość[rok-1] \u00D7 (1 + oprocentowanie/100)\n\nKupon (ROR, DOR, COI): odsetki wypłacane co miesiąc/rok.\nWzór: wartość końcowa = kapitał + \u03A3(kapitał \u00D7 oprocentowanie/100)',
    },
    {
      title: 'Podatek Belki (19%)',
      content: 'Naliczany od zysku (różnica między wartością końcową a kapitałem początkowym).\nStandard: podatek = max(zysk, 0) \u00D7 0,19\nIKE \u2014 spełniam warunki: brak podatku\nIKE \u2014 nie spełniam warunków: podatek jak standard',
    },
    {
      title: 'Wartość realna vs nominalna',
      content: 'Wartość nominalna: zmiana kapitału w cenach bieżących.\nWartość realna: wartość nominalna skorygowana o inflację.\nWzór: realValue[rok] = nominalValue[rok] / cumulativeInflation[rok]\nInflacja skumulowana[rok] = \u220F(1 + inflacja[i]/100) dla i=1..rok\n\nJeśli wartość realna maleje \u2014 inwestycja traci siłę nabywczą.',
    },
    {
      title: 'Opłaty IKE',
      content: 'Rok umowy IKE = rok symulacji. Rok 1 umowy = rok zakupu obligacji.\nWskaźnik opłaty zależy od roku umowy:\n\u2022 Rok 1 (podpisania): 0,00% \u2014 brak opłaty\n\u2022 Rok 2\u20137: zmniejszający się procent (0,16% \u2192 0,11%)\n\u2022 Rok 8+: 0,10%\nOpłata surowa: nominał \u00D7 wskaźnik. Opłata rzeczywista: min(opłata surowa, 200 zł) + dodatkowe koszty.',
    },
    {
      title: 'Wcześniejszy wykup',
      content: 'Koszt = opłata za wykup \u00D7 liczba obligacji, odliczany od wartości końcowej.\nOchrona nominalna: jeśli aktywna, gwarantuje że wartość \u2265 (kapitał - koszt wykupu).',
    },
    {
      title: 'Uproszczenia w MVP',
      content: '\u2022 ROR, DOR: uproszczona logika (stała stopa rocznie, bez pełnych zmian miesięcznych)\n\u2022 Reinwestycja kuponów: nie uwzględniana (kupon = płatność bezpowrotna)\n\u2022 Ochrona nominalna: sprawdzana na koniec horyzontu, nie co miesiąc\n\u2022 Wahania kursu obligacji: ignorowane (zakup i trzymanie do zapadalności)',
    },
  ];

  return (
    <div style={cardStyle}>
      <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.375rem', marginBottom: '1.25rem' }}>Metodologia kalkulatora</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {sections.map((s, i) => (
          <div key={i}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>{s.title}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{s.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
