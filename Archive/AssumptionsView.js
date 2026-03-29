// ============================================================
// STEP 1: ASSUMPTIONS VIEW
// ============================================================

function AssumptionsView({ state, setState, onNext, onBack }) {

  const applyPreset = (presetKey) => {
    const p = PRESETS[presetKey];
    if (state.indicatorMode === 'simple') {
      setState(prev => ({
        ...prev,
        preset: presetKey,
        inflationByYear: Array(12).fill(p.inflation),
        nbpRateByYear: Array(12).fill(p.nbpRate),
        wibor6mByYear: Array(12).fill(p.wibor6m),
        depositRateByYear: Array(12).fill(p.depositRate),
        indicatorAfterYear12: { inflation: p.inflation, nbpRate: p.nbpRate, wibor6m: p.wibor6m, depositRate: p.depositRate },
      }));
    } else {
      const adv = PRESET_ADVANCED[presetKey];
      setState(prev => ({
        ...prev,
        preset: presetKey,
        inflationByYear: [...adv.inflation],
        nbpRateByYear: [...adv.nbpRate],
        wibor6mByYear: [...adv.wibor6m],
        depositRateByYear: [...adv.depositRate],
        indicatorAfterYear12: { ...adv.after12 },
      }));
    }
  };

  const setSimpleValue = (key, arrayKey, value) => {
    setState(prev => ({
      ...prev,
      [arrayKey]: Array(12).fill(value),
      indicatorAfterYear12: { ...prev.indicatorAfterYear12, [key]: value },
    }));
  };

  const switchMode = (mode) => {
    if (mode === 'advanced' && state.indicatorMode === 'simple') {
      const preset = PRESET_ADVANCED[state.preset] || PRESET_ADVANCED.bazowy;
      setState(prev => ({
        ...prev,
        indicatorMode: 'advanced',
        inflationByYear: [...preset.inflation],
        nbpRateByYear: [...preset.nbpRate],
        wibor6mByYear: [...preset.wibor6m],
        depositRateByYear: [...preset.depositRate],
        indicatorAfterYear12: { ...preset.after12 },
      }));
    } else if (mode === 'simple' && state.indicatorMode === 'advanced') {
      setState(prev => ({
        ...prev,
        indicatorMode: 'simple',
        inflationByYear: Array(12).fill(prev.inflationByYear[0]),
        nbpRateByYear: Array(12).fill(prev.nbpRateByYear[0]),
        wibor6mByYear: Array(12).fill(prev.wibor6mByYear[0]),
        depositRateByYear: Array(12).fill(prev.depositRateByYear[0]),
      }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Horizon — slider first */}
      <div style={cardStyle}>
        <SectionLabel>Jak długo chcesz oszczędzać?</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <input type="range" min={1} max={50} step={1} value={state.horizon}
            onChange={e => setState(prev => ({ ...prev, horizon: parseInt(e.target.value) }))}
            style={{
              flex: 1, height: '6px', appearance: 'none', background: 'var(--border)',
              borderRadius: '3px', outline: 'none', cursor: 'pointer',
              accentColor: 'var(--accent)',
            }} />
          <div style={{
            minWidth: '80px', textAlign: 'center', background: 'var(--navy)', color: '#fff',
            borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontWeight: 600, fontSize: '1rem',
          }}>
            {pluralYears(state.horizon)}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-3)' }}>
          <span>1 rok</span>
          <span>50 lat</span>
        </div>
      </div>

      {/* Presets */}
      <div style={cardStyle}>
        <SectionLabel>Scenariusz makroekonomiczny</SectionLabel>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {Object.entries(PRESETS).map(([key, p]) => (
            <button key={key} onClick={() => applyPreset(key)}
              style={{
                padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem',
                fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s ease', fontWeight: 500,
                background: state.preset === key ? 'var(--accent-light)' : 'var(--surface-2)',
                color: state.preset === key ? 'var(--accent)' : 'var(--text-2)',
                border: state.preset === key ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
              }}>
              {p.label}
            </button>
          ))}
        </div>
        {/* Preset description */}
        {state.preset && PRESET_DESCRIPTIONS[state.preset] && (
          <div style={{
            background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--accent-dark)', lineHeight: 1.5,
            borderLeft: '3px solid var(--accent)',
          }}>
            {PRESET_DESCRIPTIONS[state.preset]}
          </div>
        )}
      </div>

      {/* Indicators */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <SectionLabel>Wskaźniki rynkowe</SectionLabel>
          <SegmentedControl
            options={[{ value: 'simple', label: 'Taki sam w każdym roku' }, { value: 'advanced', label: 'Ustawiam każdy rok' }]}
            value={state.indicatorMode}
            onChange={switchMode} />
        </div>

        {state.indicatorMode === 'simple' ? (
          <div className="assumptions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {[
              { label: 'Inflacja CPI', key: 'inflation', arrayKey: 'inflationByYear', tooltip: INDICATOR_TOOLTIPS.inflation },
              { label: 'Stopa referencyjna NBP', key: 'nbpRate', arrayKey: 'nbpRateByYear', tooltip: INDICATOR_TOOLTIPS.nbpRate },
              { label: 'WIBOR 6M', key: 'wibor6m', arrayKey: 'wibor6mByYear', tooltip: INDICATOR_TOOLTIPS.wibor6m },
              { label: 'Lokata / Konto', key: 'depositRate', arrayKey: 'depositRateByYear', tooltip: INDICATOR_TOOLTIPS.depositRate },
            ].map(item => (
              <div key={item.key}>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  {item.label}
                  <TooltipInfo text={item.tooltip} />
                </div>
                <PercentageInput value={state[item.arrayKey][0]} onChange={v => setSimpleValue(item.key, item.arrayKey, v)} />
              </div>
            ))}
          </div>
        ) : (
          <AdvancedIndicatorTable state={state} setState={setState} />
        )}
      </div>

      {/* Navigation */}
      <div className="btn-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
        <button onClick={onBack} style={btnSecondaryStyle}>\u2190 Wróć</button>
        <button onClick={onNext} style={btnPrimaryStyle}
          onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}>
          Przejdź do produktów \u2192
        </button>
      </div>
    </div>
  );
}

// ============================================================
// ADVANCED INDICATOR TABLE
// ============================================================

function AdvancedIndicatorTable({ state, setState }) {
  const [fillMode, setFillMode] = React.useState(null);
  const [fillTarget, setFillTarget] = React.useState('inflation');
  const [fillStart, setFillStart] = React.useState(4.0);
  const [fillEnd, setFillEnd] = React.useState(2.5);
  const [fillConst, setFillConst] = React.useState(3.0);

  const keys = [
    { key: 'inflationByYear', after: 'inflation', label: 'Inflacja' },
    { key: 'nbpRateByYear', after: 'nbpRate', label: 'Stopa NBP' },
    { key: 'wibor6mByYear', after: 'wibor6m', label: 'WIBOR 6M' },
    { key: 'depositRateByYear', after: 'depositRate', label: 'Lokata' },
  ];

  const setYearValue = (arrayKey, yearIdx, value) => {
    setState(prev => {
      const arr = [...prev[arrayKey]];
      arr[yearIdx] = value;
      return { ...prev, [arrayKey]: arr };
    });
  };

  const setAfterValue = (afterKey, value) => {
    setState(prev => ({
      ...prev,
      indicatorAfterYear12: { ...prev.indicatorAfterYear12, [afterKey]: value },
    }));
  };

  const applyFill = () => {
    const targetKey = keys.find(k => k.after === fillTarget);
    if (!targetKey) return;
    if (fillMode === 'linear') {
      const vals = interpolateLinear(fillStart, fillEnd, 12);
      setState(prev => ({ ...prev, [targetKey.key]: vals, indicatorAfterYear12: { ...prev.indicatorAfterYear12, [fillTarget]: fillEnd } }));
    } else {
      setState(prev => ({ ...prev, [targetKey.key]: Array(12).fill(fillConst), indicatorAfterYear12: { ...prev.indicatorAfterYear12, [fillTarget]: fillConst } }));
    }
    setFillMode(null);
  };

  return (
    <div>
      <div className="indicator-table-wrap" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th style={thStyle}>Rok</th>
              {keys.map(k => <th key={k.key} style={thStyle}>{k.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 12 }, (_, i) => (
              <tr key={i}>
                <td style={tdStyle}>{i + 1}</td>
                {keys.map(k => (
                  <td key={k.key} style={{ ...tdStyle, padding: '4px' }}>
                    <PercentageInput compact value={state[k.key][i]} onChange={v => setYearValue(k.key, i, v)} />
                  </td>
                ))}
              </tr>
            ))}
            <tr style={{ background: 'var(--surface-2)' }}>
              <td style={{ ...tdStyle, fontWeight: 600, fontSize: '0.8rem' }}>Po r. 12</td>
              {keys.map(k => (
                <td key={k.key} style={{ ...tdStyle, padding: '4px' }}>
                  <PercentageInput compact value={state.indicatorAfterYear12[k.after]} onChange={v => setAfterValue(k.after, v)} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => setFillMode(fillMode === 'linear' ? null : 'linear')}
          style={{ ...btnSecondaryStyle, fontSize: '0.8rem', padding: '6px 14px' }}>
          Wypełnij liniowo
        </button>
        <button onClick={() => setFillMode(fillMode === 'constant' ? null : 'constant')}
          style={{ ...btnSecondaryStyle, fontSize: '0.8rem', padding: '6px 14px' }}>
          Ustaw stałą wartość
        </button>
      </div>

      {fillMode && (
        <div style={{ ...cardStyle, marginTop: '0.75rem', padding: '1rem', background: 'var(--surface-2)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={fillTarget} onChange={e => setFillTarget(e.target.value)}
              style={{ ...inputBaseStyle, width: 'auto' }}>
              {keys.map(k => <option key={k.after} value={k.after}>{k.label}</option>)}
            </select>
            {fillMode === 'linear' ? (
              <>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>od</span>
                <PercentageInput compact value={fillStart} onChange={setFillStart} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>do</span>
                <PercentageInput compact value={fillEnd} onChange={setFillEnd} />
              </>
            ) : (
              <>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>wartość:</span>
                <PercentageInput compact value={fillConst} onChange={setFillConst} />
              </>
            )}
            <button onClick={applyFill} style={{ ...btnPrimaryStyle, padding: '6px 16px', fontSize: '0.8rem', minHeight: '32px' }}>
              Zastosuj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
