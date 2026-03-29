// ============================================================
// STEP 0: START VIEW — informational
// ============================================================

function StartView({ onNext }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: '640px' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', marginBottom: '0.5rem', lineHeight: 1.2 }}>
          Kalkulator obligacji skarbowych
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Porównaj polskie obligacje detaliczne, zbuduj własny portfel oszczędności
          i sprawdź ile realnie możesz zyskać — po inflacji, podatku i kosztach IKE.
        </p>
      </div>

      {/* CTA — above cards */}
      <div style={{ maxWidth: '640px', width: '100%', textAlign: 'center' }}>
        <button onClick={onNext} style={{ ...btnPrimaryStyle, padding: '14px 40px', fontSize: '1rem' }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}>
          Zacznij konfigurację
        </button>
      </div>
 {/* Who is it for */}
      <div style={{ ...cardStyle, maxWidth: '640px', width: '100%' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Dla kogo jest ten kalkulator?</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.7 }}>
          Dla osób, które chcą świadomie zarządzać oszczędnościami. Jeśli zastanawiasz się czy obligacje
          to lepszy wybór niż lokata, które typy wybrać przy danym horyzoncie, i czy IKE się opłaca —
          ten kalkulator pokaże Ci konkretne liczby oparte o aktualne parametry z obligacjeskarbowe.pl.
        </div>
      </div>
      {/* How it works */}
      <div style={{ ...cardStyle, maxWidth: '640px', width: '100%' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>Jak działa kalkulator?</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { step: '1', title: 'Wybierz czas oszczędzania i obligacje', desc: 'Określ na ile lat chcesz oszczędzać i które obligacje chcesz kupić — np. 50 sztuk EDO i 30 sztuk COI.' },
            { step: '2', title: 'Ustaw scenariusz makroekonomiczny', desc: 'Wybierz warunki makroekonomiczne — inflację, stopy procentowe. Możesz użyć gotowego scenariusza lub wpisać ręcznie.' },
            { step: '3', title: 'Poznaj IKE-Obligacje', desc: 'Dowiedz się jak Indywidualne Konto Emerytalne wpływa na Twoje zyski. W wynikach przełącz IKE ON/OFF.' },
            { step: '4', title: 'Zobacz wyniki', desc: 'Wykres, ranking i konkretne kwoty — nominalnie i realnie (po inflacji). Porównaj z lokatą i kontem oszczędnościowym.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700,
                background: 'var(--accent)', color: '#fff', flexShrink: 0, marginTop: '2px',
              }}>{item.step}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '2px' }}>{item.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      

     

      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.5rem', lineHeight: 1.5, textAlign: 'center' }}>
        Dane obligacji z oferty marzec 2026 (obligacjeskarbowe.pl).
        Wyniki mają charakter poglądowy i nie stanowią rekomendacji inwestycyjnej.
      </div>
    </div>
  );
}
