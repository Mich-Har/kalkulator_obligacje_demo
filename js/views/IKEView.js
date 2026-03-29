// ============================================================
// STEP 3: IKE INFO VIEW (purely informational)
// ============================================================

function IKEView({ state, onNext, onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Main explanation */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.375rem', marginBottom: '0.75rem' }}>
          Czym jest IKE-Obligacje?
        </h2>
        <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1rem' }}>
          <strong>IKE-Obligacje</strong> to konto , które pozwala kupować obligacje
          skarbowe <strong>bez płacenia 19% podatku Belki od wypracowanych zysków</strong>.
          Zwolnienie z podatku obowiązuje przy wypłacie po 60. roku życia lub po 55. roku życia,
          jeśli nabyłeś uprawnienia emerytalne i wpłacałeś środki przez co najmniej 5 lat. 
          Przy długim oszczędzaniu korzyść podatkowa może wyraźnie zwiększyć końcowy wynik inwestycji.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {[
            { label: 'Korzyść', text: 'Brak podatku 19% od zysków. Np. przy zysku 5 000 zł oszczędzasz 950 zł podatku.', color: 'var(--success)' },
            { label: 'Koszt', text: 'Roczna opłata za prowadzenie konta (max 200 zł/rok). Przy 100 obligacjach w roku 8+ to ok. 10 zł/rok.', color: 'var(--warning)' },
            { label: 'Limit', text: 'Roczny limit wpłat na IKE w 2026 roku wynosi 26 019,60 zł (ok. 260 obligacji).', color: 'var(--navy)' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
              <span style={{ fontWeight: 600, color: item.color, minWidth: '65px', flexShrink: 0 }}>{item.label}:</span>
              <span style={{ color: 'var(--text-2)' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fee table */}
      <div style={cardStyle}>
        <SectionLabel>Tabela opłat IKE-Obligacje (PKO BP)</SectionLabel>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={thStyle}>Rok umowy</th>
                <th style={thStyle}>Wskaźnik opłaty</th>
                <th style={thStyle}>Max opłata roczna</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5,6,7].map(y => (
                <tr key={y}>
                  <td style={tdStyle}>{y}{y === 1 ? ' (podpisania)' : ''}</td>
                  <td style={tdStyle}>{(IKE_FEE_RATES[y] * 100).toFixed(2)}%</td>
                  <td style={tdStyle}>{IKE_FEE_CAP} zł</td>
                </tr>
              ))}
              <tr>
                <td style={tdStyle}>8+</td>
                <td style={tdStyle}>{(IKE_FEE_RATE_DEFAULT * 100).toFixed(2)}%</td>
                <td style={tdStyle}>{IKE_FEE_CAP} zł</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.5rem', lineHeight: 1.5 }}>
          Opłaty naliczane od wartości nominalnej obligacji na 31 grudnia.
          W roku podpisania umowy: brak opłaty. Opłata pobierana 20 lutego roku następnego.
        </p>
      </div>

      {/* How it works in the calculator */}
      <div style={{ ...cardStyle, background: 'var(--accent-light)', borderColor: 'var(--accent)' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--accent-dark)', lineHeight: 1.7 }}>
          <strong>Jak to działa w kalkulatorze?</strong> Na ekranie wyników zobaczysz przełącznik
          IKE ON / OFF. Domyślnie wyniki pokazują wariant bez IKE (z podatkiem Belki).
          Po włączeniu IKE zobaczysz jak zmienią się kwoty — stare wartości będą przekreślone,
          a obok pojawią się nowe z uwzględnieniem IKE. Na wykresie wariant bez IKE zostanie
          wyszarzony dla porównania.
        </div>
      </div>

      {/* Navigation */}
      <div className="btn-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
        <button onClick={onBack} style={btnSecondaryStyle}>{'\u2190'} Wróć</button>
        <button onClick={onNext} style={btnPrimaryStyle}
          onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}>
          Pokaż wynik {'\u2192'}
        </button>
      </div>
    </div>
  );
}
