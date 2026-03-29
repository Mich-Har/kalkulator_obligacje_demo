// ============================================================
// APP
// ============================================================

function App() {
  const [state, setState] = React.useState({
    step: 0,
    maxReached: 0,
    horizon: 12,
    preset: 'bazowy',
    indicatorMode: 'simple',
    inflationByYear:    [...DEFAULT_INFLATION],
    nbpRateByYear:      [...DEFAULT_NBP_RATE],
    wibor6mByYear:      [...DEFAULT_WIBOR6M],
    depositRateByYear:  [...DEFAULT_DEPOSIT_RATE],
    indicatorAfterYear12: { inflation: 2.5, nbpRate: 3.50, wibor6m: 3.40, depositRate: 3.50 },
    products: ALL_DEFAULT_PRODUCTS.map(p => ({ ...p })),
    ikeEnabled: true,
    ikeConditionsMet: true,
    ikeAdditionalCosts: 0,
    results: null,
    loading: false,
    portfolioWide: false,
  });

  const goTo = (step) => {
    setState(prev => ({ ...prev, step, maxReached: Math.max(prev.maxReached, step) }));
    window.scrollTo(0, 0);
  };

  const runSimulation = (nextStep) => {
    setState(prev => ({ ...prev, loading: true }));
    setTimeout(() => {
      setState(prev => {
        const results = calculateSimulation(prev);
        return { ...prev, results, loading: false, step: nextStep, maxReached: Math.max(prev.maxReached, nextStep) };
      });
      window.scrollTo(0, 0);
    }, 300);
  };

  if (state.loading) {
    return (
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center' }}>
        <Header />
        <div style={{ ...cardStyle, padding: '3rem', marginTop: '2rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem' }}>Obliczam...</div>
          <p style={{ color: 'var(--text-2)' }}>Porównuję warianty inwestycji</p>
        </div>
      </div>
    );
  }

  const containerMaxWidth = state.step === 1
    ? (state.portfolioWide ? '1300px' : '920px')
    : '860px';

  return (
    <div style={{ maxWidth: containerMaxWidth, margin: '0 auto', padding: '2rem 1.5rem', transition: 'max-width 0.3s ease' }}>
      <Header />
      <Stepper step={state.step} maxReached={state.maxReached} onStepClick={(s) => {
        if (s === 3 && state.results) goTo(3);
        else if (s < 3) goTo(s);
      }} />

      {state.step === 0 && (
        <StartView onNext={() => goTo(1)} />
      )}
      {state.step === 1 && (
        <PortfolioView state={state} setState={setState} onNext={() => goTo(2)} onBack={() => goTo(0)} />
      )}
      {state.step === 2 && (
        <IKEView state={state}
          onNext={() => runSimulation(3)}
          onBack={() => goTo(1)} />
      )}
      {state.step === 3 && (
        <ResultsView state={state} setState={setState}
          onDetails={() => goTo(4)}
          onRestart={() => goTo(1)} />
      )}
      {state.step === 4 && (
        <DetailsView state={state} setState={setState} onBack={() => goTo(3)} />
      )}

      <div style={{ textAlign: 'center', padding: '2rem 0 1rem', fontSize: '0.75rem', color: 'var(--text-3)' }}>
        Kalkulator ma charakter edukacyjny. Nie stanowi porady inwestycyjnej.
      </div>
    </div>
  );
}

// ============================================================
// RENDER
// ============================================================
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
