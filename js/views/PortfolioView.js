// ============================================================
// STEP 1: PORTFOLIO VIEW — products + indicators combined
// ============================================================

function PortfolioView({ state, setState, onNext, onBack }) {
  const [phase, setPhase] = React.useState('products');
  const [showFloating, setShowFloating] = React.useState(false);
  const headerRef = React.useRef(null);

  // Show floating bar only when the header card scrolls out of view
  React.useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFloating(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const bonds = state.products.filter(p => !['LOK', 'KOS'].includes(p.productId));
  const refs = state.products.filter(p => ['LOK', 'KOS'].includes(p.productId));
  const bondsTotal = bonds.reduce((s, p) => s + (p.count || 0), 0);
  const totalBonds = state.products.reduce((s, p) => s + (p.count || 0), 0);
  const totalCapital = totalBonds * 100;
  const horizon = state.horizon;
  const activeProducts = state.products.filter(p => (p.count || 0) > 0);
  const activeBonds = bonds.filter(p => (p.count || 0) > 0);
  const activeRefs = refs.filter(p => (p.count || 0) > 0);

  // Auto-sync LOK/KOS count to match total bond count
  React.useEffect(() => {
    let needsUpdate = false;
    const newProducts = state.products.map(p => {
      if (!['LOK', 'KOS'].includes(p.productId)) return p;
      if ((p.count || 0) <= 0) return p;
      const target = bondsTotal > 0 ? bondsTotal : 0;
      if (p.count !== target) { needsUpdate = true; return { ...p, count: target }; }
      return p;
    });
    if (needsUpdate) setState(prev => ({ ...prev, products: newProducts }));
  }, [bondsTotal]);

  // --- Product helpers ---
  const updateCount = (idx, count) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map((p, i) => i === idx ? { ...p, count: Math.max(0, count) } : p),
    }));
  };

  const updateFixedRate = (idx, rate) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map((p, i) => i === idx ? { ...p, fixedRate: rate, initialRate: rate } : p),
    }));
  };

  const toggleRef = (productId, on) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p =>
        p.productId === productId ? { ...p, count: on ? Math.max(bondsTotal, 1) : 0 } : p
      ),
    }));
  };

  const getEarlyRedemptionWarning = (product) => {
    if (!product.maturityMonths) return null;
    const matYears = product.maturityMonths / 12;
    if (horizon < matYears) {
      return `Twój horyzont oszczędzania (${pluralYears(horizon)}) jest krótszy niż zapadalność obligacji (${pluralYears(matYears)}). Przy wcześniejszym wykupie zapłacisz ${product.earlyRedemptionFee} zł za każdą obligację. ${product.nominalProtection ? 'Ochrona nominalna gwarantuje zwrot co najmniej 100 zł minus opłata za wykup.' : ''}`;
    }
    return null;
  };

  const getCellValue = (product, key) => {
    switch (key) {
      case 'maturityMonths':
        if (!product.maturityMonths) return '\u2014';
        const y = product.maturityMonths / 12;
        return y === 1 ? '1 rok' : y <= 4 ? y + ' lata' : y + ' lat';
      case 'initialRate': return formatPct(product.initialRate);
      case 'rateChangeMonths': return product.rateChangeMonths ? product.rateChangeMonths + ' mc' : '\u2014';
      case 'indexLabel': return INDEX_LABELS[product.indexType] || '\u2014';
      case 'margin': return product.margin > 0 ? '+' + formatPct(product.margin) : '\u2014';
      case 'couponFrequencyMonths': return product.couponFrequencyMonths ? product.couponFrequencyMonths + ' mc' : '\u2014';
      case 'capitalizationMonths': return product.capitalizationMonths ? product.capitalizationMonths + ' mc' : '\u2014';
      case 'conversionPrice': return product.conversionPrice ? product.conversionPrice.toFixed(2) + ' zł' : '\u2014';
      case 'earlyRedemptionFee': return product.earlyRedemptionFee > 0 ? product.earlyRedemptionFee.toFixed(2) + ' zł' : '\u2014';
      case 'nominalProtectionMonths':
        if (!product.nominalProtection) return 'Nie';
        if (product.nominalProtectionMonths === 'full') return 'Pełny';
        return product.nominalProtectionMonths ? product.nominalProtectionMonths + ' mc' : 'Tak';
      default: return '\u2014';
    }
  };

  // --- Indicator helpers ---
  const applyPreset = (presetKey) => {
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
  };

  const setSimpleValue = (key, arrayKey, value) => {
    setState(prev => ({
      ...prev,
      [arrayKey]: Array(12).fill(value),
      indicatorAfterYear12: { ...prev.indicatorAfterYear12, [key]: value },
    }));
  };

  const switchIndicatorMode = (mode) => {
    if (mode === state.indicatorMode) return;
    if (mode === 'scenario') {
      const presetKey = state.preset || 'bazowy';
      const adv = PRESET_ADVANCED[presetKey];
      setState(prev => ({
        ...prev, indicatorMode: 'scenario', preset: presetKey,
        inflationByYear: [...adv.inflation], nbpRateByYear: [...adv.nbpRate],
        wibor6mByYear: [...adv.wibor6m], depositRateByYear: [...adv.depositRate],
        indicatorAfterYear12: { ...adv.after12 },
      }));
    } else if (mode === 'simple') {
      setState(prev => ({
        ...prev, indicatorMode: 'simple',
        inflationByYear: Array(12).fill(prev.inflationByYear[0]),
        nbpRateByYear: Array(12).fill(prev.nbpRateByYear[0]),
        wibor6mByYear: Array(12).fill(prev.wibor6mByYear[0]),
        depositRateByYear: Array(12).fill(prev.depositRateByYear[0]),
      }));
    } else if (mode === 'advanced') {
      if (state.indicatorMode === 'simple') {
        const preset = PRESET_ADVANCED[state.preset || 'bazowy'];
        setState(prev => ({
          ...prev, indicatorMode: 'advanced',
          inflationByYear: [...preset.inflation], nbpRateByYear: [...preset.nbpRate],
          wibor6mByYear: [...preset.wibor6m], depositRateByYear: [...preset.depositRate],
          indicatorAfterYear12: { ...preset.after12 },
        }));
      } else {
        setState(prev => ({ ...prev, indicatorMode: 'advanced' }));
      }
    }
  };

  const indicatorItems = [
    { label: 'Inflacja CPI', key: 'inflation', arrayKey: 'inflationByYear', tooltip: INDICATOR_TOOLTIPS.inflation },
    { label: 'Stopa referencyjna NBP', key: 'nbpRate', arrayKey: 'nbpRateByYear', tooltip: INDICATOR_TOOLTIPS.nbpRate },
    { label: 'WIBOR 6M', key: 'wibor6m', arrayKey: 'wibor6mByYear', tooltip: INDICATOR_TOOLTIPS.wibor6m },
    { label: 'Lokata / Konto', key: 'depositRate', arrayKey: 'depositRateByYear', tooltip: INDICATOR_TOOLTIPS.depositRate },
  ];

  const getIndicatorRelevance = (key) => {
    const indexMap = { inflation: 'inflation', nbpRate: 'nbp_ref', wibor6m: 'wibor6m' };
    if (key === 'depositRate') {
      const relevant = activeProducts.filter(p => ['LOK', 'KOS'].includes(p.productId));
      return relevant.length > 0
        ? { names: relevant.map(p => PRODUCT_SHORT[p.productId]).join(', '), desc: 'Oprocentowanie ustawione ręcznie' }
        : null;
    }
    const indexType = indexMap[key];
    const relevant = activeProducts.filter(p => p.indexType === indexType);
    if (relevant.length === 0) return null;
    const names = relevant.map(p => PRODUCT_SHORT[p.productId]).join(', ');
    const descs = { inflation: 'Od 2. roku: inflacja + marża', nbpRate: 'Stopa NBP + marża', wibor6m: 'WIBOR 6M + marża' };
    return { names, desc: descs[key] };
  };

  // ==============================
  // RENDER
  // ==============================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ═══ FLOATING SUMMARY — appears when header scrolls out of view ═══ */}
      {showFloating && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)', padding: '0.4rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem',
        }}>
          {/* Left: Obligacje + chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', flex: 1 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Obligacje:</span>
            {activeBonds.length === 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>brak</span>
            )}
            {activeBonds.map(p => (
              <span key={p.productId} style={{
                display: 'inline-block', padding: '1px 6px', borderRadius: '3px',
                fontSize: '0.65rem', fontWeight: 600,
                background: (PRODUCT_COLORS[p.productId] || 'var(--border)') + '18',
                color: PRODUCT_COLORS[p.productId] || 'var(--text-3)',
              }}>
                {PRODUCT_SHORT[p.productId]}{'\u00D7'}{p.count}
              </span>
            ))}
            {activeRefs.map(p => (
              <span key={p.productId} style={{
                display: 'inline-block', padding: '1px 6px', borderRadius: '3px',
                fontSize: '0.65rem', fontWeight: 600,
                background: (PRODUCT_COLORS[p.productId] || 'var(--border)') + '18',
                color: PRODUCT_COLORS[p.productId] || 'var(--text-3)',
              }}>
                {PRODUCT_SHORT[p.productId]}
              </span>
            ))}
          </div>
          {/* Right: Wartość + Okres */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1rem', color: 'var(--text-3)', lineHeight: 2 }}>Wartość portfela</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.2 }}>
                {bondsTotal > 0 ? formatPLN(bondsTotal * 100) : '0 zł'}
              </div>
            </div>
            <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1rem', color: 'var(--text-3)', lineHeight: 2 }}>Okres oszczędności</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.2 }}>
                {pluralYears(horizon)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PORTFOLIO HEADER — horizon picker ═══ */}
      <div ref={headerRef} style={{ ...cardStyle, padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'stretch' }}>

          {/* LEFT — portfolio value */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.3rem', fontWeight: 500 }}>
              Wartość portfela
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1, marginBottom: '0.6rem' }}>
              {bondsTotal > 0 ? formatPLN(bondsTotal * 100) : '0 zł'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              {activeBonds.length === 0 && activeRefs.length === 0
                ? <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>Brak obligacji w portfelu</span>
                : <>
                    {activeBonds.map(p => (
                      <span key={p.productId} style={{
                        display: 'inline-block', padding: '2px 7px', borderRadius: '4px',
                        fontSize: '0.65rem', fontWeight: 600,
                        background: (PRODUCT_COLORS[p.productId] || 'var(--border)') + '22',
                        color: PRODUCT_COLORS[p.productId] || 'var(--text-3)',
                        border: '1px solid ' + (PRODUCT_COLORS[p.productId] || 'var(--border)') + '44',
                      }}>
                        {PRODUCT_SHORT[p.productId]}{'\u00D7'}{p.count}
                      </span>
                    ))}
                    {activeRefs.map(p => (
                      <span key={p.productId} style={{
                        display: 'inline-block', padding: '2px 7px', borderRadius: '4px',
                        fontSize: '0.65rem', fontWeight: 500,
                        background: 'var(--surface-2)',
                        color: 'var(--text-3)',
                        border: '1px solid var(--border)',
                      }}>
                        {PRODUCT_SHORT[p.productId]}
                      </span>
                    ))}
                  </>
              }
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', background: 'var(--border)', flexShrink: 0, alignSelf: 'stretch' }} />

          {/* RIGHT — horizon */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.3rem', fontWeight: 500 }}>
              Okres oszczędzania
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--navy)', lineHeight: 1, marginBottom: '0.6rem' }}>
              {pluralYears(horizon)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>1</span>
              <input type="range" min={1} max={50} step={1} value={horizon}
                onChange={e => setState(prev => ({ ...prev, horizon: parseInt(e.target.value) }))}
                style={{ flex: 1, height: '6px', appearance: 'none', background: 'var(--border)', borderRadius: '3px', outline: 'none', cursor: 'pointer', accentColor: 'var(--accent)' }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>50 lat</span>
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════
           PHASE: PRODUCTS
         ═══════════════════════════════════════════ */}
      {phase === 'products' && (
        <>
          {/* --- Bond products table --- */}
          {(() => {
            const KEY_COL_KEYS = ['maturityMonths', 'initialRate', 'indexLabel', 'margin', 'earlyRedemptionFee'];
            const tableExpanded = state.portfolioWide;
            const visibleCols = tableExpanded
              ? PRODUCT_TABLE_COLUMNS
              : PRODUCT_TABLE_COLUMNS.filter(c => KEY_COL_KEYS.includes(c.key));

            return (
              <div style={{ ...cardStyle, padding: '1.5rem 0 1.5rem 1.25rem', position: 'relative', overflow: 'hidden' }}>
                {/* Card header */}
                <div style={{ marginBottom: '1rem', paddingRight: '3.5rem' }}>
                  <SectionLabel>Obligacje skarbowe</SectionLabel>
                </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: '1rem', lineHeight: 1.5, paddingRight: '3.5rem' }}>
  
  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
    Czym są obligacje skarbowe?
  </div>

  <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.7 }}>
    Obligacje skarbowe to papiery wartościowe emitowane przez Skarb Państwa. Kupujesz je po 100 zł za sztukę.
    Państwo pożycza od Ciebie pieniądze i oddaje je z odsetkami po określonym czasie.
    Są uważane za jedną z najbezpieczniejszych form oszczędzania — gwarantem jest budżet państwa.
    Dostępne typy różnią się oprocentowaniem, długością trwania i sposobem naliczania odsetek.
  </div>

  <div style={{ 
    fontSize: '0.85rem',
    fontWeight: 600,
    marginTop: '1rem',
    marginBottom: '1rem'
  }}>
    Wybierz obligacje do swojego portfela:
  </div>

</div>

                {/* Table */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginRight: '3.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 2, minWidth: '120px', padding: '10px 6px' }}>
                          Obligacja
                        </th>
                        <th style={{ ...thStyle, minWidth: '80px', textAlign: 'center', padding: '10px 4px' }}>Ile szt.</th>
                        {visibleCols.map(col => (
                          <th key={col.key} style={{ ...thStyle, whiteSpace: 'nowrap', padding: '10px 5px', fontSize: '0.72rem' }}>
                            <span>{col.label}</span>
                            {col.tooltip && <TooltipInfo text={col.tooltip} />}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bonds.map(product => {
                        const idx = state.products.findIndex(p => p.productId === product.productId);
                        const warning = getEarlyRedemptionWarning(product);
                        const color = PRODUCT_COLORS[product.productId] || 'var(--text-3)';
                        const hasCount = (product.count || 0) > 0;
                        return (
                          <tr key={product.productId} style={{
                            background: hasCount ? 'var(--surface)' : 'var(--surface-2)',
                            opacity: hasCount ? 1 : 0.7, transition: 'all 0.2s ease',
                          }}>
                            <td style={{
                              ...tdStyle, position: 'sticky', left: 0, zIndex: 1, padding: '8px 6px',
                              background: hasCount ? 'var(--surface)' : 'var(--surface-2)',
                              borderLeft: `3px solid ${hasCount ? color : 'var(--border)'}`,
                            }}>
                              <div style={{ fontWeight: 600, color, fontSize: '0.82rem' }}>
                                {PRODUCT_SHORT[product.productId]}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', lineHeight: 1.3 }}>
                                {PRODUCT_DESCRIPTIONS[product.productId]?.split('.')[0]}.
                              </div>
                              {['ROS', 'ROD'].includes(product.productId) && (
                                <div style={{ fontSize: '0.6rem', color: 'var(--success)', fontWeight: 500 }}>Rodzina 800+</div>
                              )}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center', padding: '8px 4px' }}>
                              <input type="number" value={product.count || 0} min={0} max={100000}
                                onChange={e => { const v = parseInt(e.target.value); updateCount(idx, isNaN(v) ? 0 : v); }}
                                onFocus={e => e.target.select()}
                                style={{
                                  ...inputBaseStyle, width: '66px', textAlign: 'center', padding: '5px 4px',
                                  fontSize: '0.82rem', fontWeight: hasCount ? 700 : 400,
                                  borderColor: hasCount ? color : 'var(--border)',
                                }} />
                              {hasCount && (
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-3)', marginTop: '2px' }}>
                                  {formatPLN(product.count * 100)}
                                </div>
                              )}
                            </td>
                            {visibleCols.map(col => {
                              const isEarlyFee = col.key === 'earlyRedemptionFee' && warning && hasCount;
                              return (
                                <td key={col.key} style={{
                                  ...tdStyle, whiteSpace: 'nowrap', padding: '8px 5px', fontSize: '0.75rem',
                                  color: isEarlyFee ? 'var(--warning)' : undefined,
                                  fontWeight: isEarlyFee ? 600 : undefined,
                                }}>
                                  {getCellValue(product, col.key)}
                                  {isEarlyFee && <TooltipInfo text={warning} variant="warning" />}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ─── Expand / Collapse handle on right edge ─── */}
                <button
                  onClick={() => setState(prev => ({ ...prev, portfolioWide: !tableExpanded }))}
                  title={tableExpanded ? 'Zwiń kolumny' : 'Rozwiń wszystkie parametry'}
                  style={{
                    position: 'absolute', top: 0, right: 0, bottom: 0, width: '3rem',
                    background: tableExpanded ? 'var(--accent-light)' : 'var(--surface-2)',
                    borderLeft: '1px solid var(--border)',
                    borderRadius: '0 var(--radius) var(--radius) 0',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    transition: 'background 0.2s ease',
                    padding: '1rem 0',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = tableExpanded ? '#f0e4dc' : 'var(--border)'}
                  onMouseOut={e => e.currentTarget.style.background = tableExpanded ? 'var(--accent-light)' : 'var(--surface-2)'}
                >
                  {/* Arrow icon */}
                  <span style={{
                    fontSize: '0.8rem', color: tableExpanded ? 'var(--accent)' : 'var(--text-3)',
                    transition: 'transform 0.2s ease',
                    transform: tableExpanded ? 'rotate(0deg)' : 'rotate(0deg)',
                  }}>
                    {tableExpanded ? '\u00AB' : '\u00BB'}
                  </span>
                  {/* Vertical label */}
                  <span style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    transform: 'rotate(180deg)',
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: tableExpanded ? 'var(--accent)' : 'var(--text-3)',
                    textTransform: 'uppercase',
                    fontFamily: 'inherit',
                  }}>
                    {tableExpanded ? 'Zwiń' : 'Wszystkie parametry'}
                  </span>
                </button>
              </div>
            );
          })()}

          {/* --- Reference products (AFTER bonds) --- */}
          <div style={cardStyle}>
            <SectionLabel>Produkty referencyjne</SectionLabel>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Pozwalają porównać obligacje z popularnymi formami oszczędzania w banku. 
              Po aktywacji kwota jest automatycznie taka sama jak w portfelu obligacji,
              a oprocentowanie możesz dostosować do własnej oferty.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {refs.map(product => {
                const idx = state.products.findIndex(p => p.productId === product.productId);
                const isOn = (product.count || 0) > 0;
                const color = PRODUCT_COLORS[product.productId] || 'var(--text-3)';
                return (
                  <div key={product.productId} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem',
                    background: isOn ? 'var(--surface)' : 'var(--surface-2)',
                    borderRadius: 'var(--radius-sm)',
                    border: isOn ? '1.5px solid ' + color + '40' : '1.5px solid var(--border)',
                    opacity: isOn ? 1 : 0.7, transition: 'all 0.2s ease',
                  }}>
                    <ToggleSwitch checked={isOn} onChange={v => toggleRef(product.productId, v)} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color }}>{PRODUCT_SHORT[product.productId]}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', lineHeight: 1.3 }}>
                        {PRODUCT_DESCRIPTIONS[product.productId]?.split('.')[0]}.
                      </div>
                    </div>
                    {isOn && (
                      <div style={{ flexShrink: 0 }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginBottom: '2px' }}>Oprocentowanie</div>
                        <PercentageInput compact value={product.fixedRate || product.initialRate}
                          onChange={v => updateFixedRate(idx, v)} min={0} max={20} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation */}
          {bondsTotal === 0 && (
            <div style={{ ...cardStyle, background: 'var(--warning-light)', borderColor: 'var(--warning)', textAlign: 'center', padding: '1rem' }}>
              <p style={{ color: 'var(--warning)', fontWeight: 500, fontSize: '0.85rem' }}>
                Wpisz liczbę obligacji przy co najmniej jednym produkcie żeby kontynuować.
              </p>
            </div>
          )}

          {/* Products → Indicators button */}
          <div className="btn-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
            <button onClick={onBack} style={btnSecondaryStyle}>{'\u2190'} Wróć</button>
            <button onClick={() => setPhase('indicators')} disabled={bondsTotal === 0}
              style={{ ...btnPrimaryStyle, opacity: bondsTotal === 0 ? 0.5 : 1, cursor: bondsTotal === 0 ? 'not-allowed' : 'pointer' }}
              onMouseOver={e => { if (bondsTotal > 0) e.currentTarget.style.opacity = '0.9'; }}
              onMouseOut={e => { if (bondsTotal > 0) e.currentTarget.style.opacity = '1'; }}>
              {'Przejdź do wskaźników \u2192'}
            </button>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════
           PHASE: INDICATORS
         ═══════════════════════════════════════════ */}
      {phase === 'indicators' && (
        <>
          {/* Collapsed products */}
          <div style={{
            ...cardStyle, padding: '0.75rem 1.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginRight: '0.25rem' }}>Produkty:</span>
              {activeBonds.map(p => (
                <span key={p.productId} style={{
                  padding: '1px 6px', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 600,
                  background: (PRODUCT_COLORS[p.productId] || 'var(--border)') + '18',
                  color: PRODUCT_COLORS[p.productId] || 'var(--text-3)',
                }}>
                  {PRODUCT_SHORT[p.productId]}{'\u00D7'}{p.count}
                </span>
              ))}
              {activeRefs.map(p => (
                <span key={p.productId} style={{
                  padding: '1px 6px', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 600,
                  background: (PRODUCT_COLORS[p.productId] || 'var(--border)') + '18',
                  color: PRODUCT_COLORS[p.productId] || 'var(--text-3)',
                }}>
                  {PRODUCT_SHORT[p.productId]}
                </span>
              ))}
            </div>
            <button onClick={() => setPhase('products')}
              style={{ ...btnSecondaryStyle, padding: '4px 12px', fontSize: '0.75rem' }}>
              Edytuj produkty
            </button>
          </div>

          {/* Indicator mode selector */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <SectionLabel>Scenariusz makroekonomiczny</SectionLabel>
              <SegmentedControl
                options={[
                  { value: 'simple', label: 'Uproszczona' },
                  { value: 'scenario', label: 'Scenariusze' },
                  { value: 'advanced', label: 'Zaawansowana' },
                ]}
                value={state.indicatorMode}
                onChange={switchIndicatorMode}
                helpTexts={{
                  simple: 'Jedna wartość każdego wskaźnika na wszystkie lata.',
                  scenario: 'Gotowe scenariusze — wartości narzucone, bez edycji.',
                  advanced: 'Pełna kontrola — wpisz wartości na każdy rok osobno.',
                }}
              />
            </div>

            {/* --- SCENARIO MODE --- */}
            {state.indicatorMode === 'scenario' && (
              <>
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
                {state.preset && PRESET_DESCRIPTIONS[state.preset] && (
                  <div style={{
                    background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--accent-dark)', lineHeight: 1.5,
                    borderLeft: '3px solid var(--accent)', marginBottom: '1rem',
                  }}>
                    {PRESET_DESCRIPTIONS[state.preset]}
                  </div>
                )}

                {/* Read-only scenario values summary */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {indicatorItems.map(item => {
                    const first = state[item.arrayKey][0];
                    const last = state[item.arrayKey][Math.min(11, horizon - 1)];
                    const after = state.indicatorAfterYear12[item.key];
                    const relevance = getIndicatorRelevance(item.key);
                    return (
                      <div key={item.key} style={{
                        padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
                        borderLeft: relevance ? '3px solid var(--success)' : '3px solid var(--border)',
                      }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                          {item.label}
                          <TooltipInfo text={item.tooltip} />
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--navy)' }}>
                          {formatPct(first)}{first !== last ? ` ${'\u2192'} ${formatPct(last)}` : ''}
                          {horizon > 12 && <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 400 }}> (po 12: {formatPct(after)})</span>}
                        </div>
                        {relevance && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '0.25rem' }}>
                            {'Wpływa na: '}{relevance.names}{' \u2014 '}{relevance.desc}
                          </div>
                        )}
                        {!relevance && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
                            Brak produktów w portfelu opartych o ten wskaźnik
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* --- SIMPLE MODE --- */}
            {state.indicatorMode === 'simple' && (
              <div className="assumptions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {indicatorItems.map(item => {
                  const relevance = getIndicatorRelevance(item.key);
                  return (
                    <div key={item.key}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                        {item.label}
                        <TooltipInfo text={item.tooltip} />
                      </div>
                      <PercentageInput value={state[item.arrayKey][0]} onChange={v => setSimpleValue(item.key, item.arrayKey, v)} />
                      {relevance && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '0.35rem' }}>
                          {'Wpływa na: '}{relevance.names}{' \u2014 '}{relevance.desc}
                        </div>
                      )}
                      {!relevance && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '0.35rem' }}>
                          Brak produktów w portfelu opartych o ten wskaźnik
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* --- ADVANCED MODE --- */}
            {state.indicatorMode === 'advanced' && (
              <>
                {/* Relevance summary */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {indicatorItems.map(item => {
                    const relevance = getIndicatorRelevance(item.key);
                    return relevance ? (
                      <span key={item.key} style={{
                        padding: '3px 10px', borderRadius: '4px', fontSize: '0.7rem',
                        background: 'var(--success-light)', color: 'var(--success)',
                        border: '1px solid var(--success)',
                      }}>
                        {item.label} {'\u2192'} {relevance.names}
                      </span>
                    ) : null;
                  })}
                </div>
                <AdvancedIndicatorTable state={state} setState={setState} />
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="btn-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
            <button onClick={() => setPhase('products')} style={btnSecondaryStyle}>
              {'\u2190 Wróć do produktów'}
            </button>
            <button onClick={onNext} style={btnPrimaryStyle}
              onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}>
              {'Dalej \u2192'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// ADVANCED INDICATOR TABLE (per-year editable)
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
