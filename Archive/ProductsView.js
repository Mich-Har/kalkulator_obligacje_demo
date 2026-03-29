// ============================================================
// STEP 2: PRODUCTS VIEW — table-based selection
// ============================================================

function ProductsView({ state, setState, onNext, onBack }) {
  const totalBonds = state.products.reduce((s, p) => s + (p.count || 0), 0);
  const totalCapital = totalBonds * 100;
  const horizon = state.horizon;
  const [showAllCols, setShowAllCols] = React.useState(false);

  const updateCount = (idx, count) => {
    setState(prev => {
      const prods = prev.products.map((p, i) => i === idx ? { ...p, count: Math.max(0, count) } : p);
      return { ...prev, products: prods };
    });
  };

  const updateFixedRate = (idx, rate) => {
    setState(prev => {
      const prods = prev.products.map((p, i) => i === idx ? { ...p, fixedRate: rate, initialRate: rate } : p);
      return { ...prev, products: prods };
    });
  };

  const bonds = state.products.filter(p => !['LOK', 'KOS'].includes(p.productId));
  const refs = state.products.filter(p => ['LOK', 'KOS'].includes(p.productId));

  const getEarlyRedemptionWarning = (product) => {
    if (!product.maturityMonths) return null;
    const matYears = product.maturityMonths / 12;
    if (horizon < matYears) {
      return `Horyzont ${horizon} lat < zapadalność ${matYears} lat. Wcześniejszy wykup: ${product.earlyRedemptionFee} zł/szt.`;
    }
    return null;
  };

  const getCellValue = (product, key) => {
    switch (key) {
      case 'maturityMonths': return product.maturityMonths ? product.maturityMonths + ' mc' : '\u2014';
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
        if (product.nominalProtectionMonths === 'full') return 'Pełny okres';
        return product.nominalProtectionMonths ? product.nominalProtectionMonths + ' mc' : 'Tak';
      default: return '\u2014';
    }
  };

  const visibleCols = showAllCols
    ? PRODUCT_TABLE_COLUMNS
    : PRODUCT_TABLE_COLUMNS.filter(c => ['maturityMonths', 'initialRate', 'indexLabel', 'margin', 'earlyRedemptionFee'].includes(c.key));

  const renderProductTable = (products, title, isRef) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <SectionLabel>{title}</SectionLabel>
      <div className="detail-table-wrap" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: showAllCols ? '900px' : '600px' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 2, minWidth: '140px' }}>
                Obligacja
              </th>
              <th style={{ ...thStyle, minWidth: '110px', textAlign: 'center' }}>Ile szt.</th>
              {visibleCols.map(col => (
                <th key={col.key} style={{ ...thStyle, whiteSpace: 'nowrap' }}>
                  <span>{col.label}</span>
                  {col.tooltip && <TooltipInfo text={col.tooltip} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(product => {
              const idx = state.products.findIndex(p => p.productId === product.productId);
              const warning = getEarlyRedemptionWarning(product);
              const color = PRODUCT_COLORS[product.productId] || 'var(--text-3)';
              const hasCount = (product.count || 0) > 0;

              return (
                <tr key={product.productId} style={{
                  background: hasCount ? 'var(--surface)' : 'var(--surface-2)',
                  opacity: hasCount ? 1 : 0.7,
                  transition: 'all 0.2s ease',
                }}>
                  <td style={{
                    ...tdStyle, position: 'sticky', left: 0, zIndex: 1,
                    background: hasCount ? 'var(--surface)' : 'var(--surface-2)',
                    borderLeft: `3px solid ${hasCount ? color : 'var(--border)'}`,
                  }}>
                    <div style={{ fontWeight: 600, color, fontSize: '0.85rem' }}>
                      {PRODUCT_SHORT[product.productId]}
                      {warning && (
                        <span style={{ marginLeft: '4px' }}>
                          <TooltipInfo text={warning} />
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', lineHeight: 1.3 }}>
                      {PRODUCT_DESCRIPTIONS[product.productId] ? PRODUCT_DESCRIPTIONS[product.productId].split('.')[0] + '.' : ''}
                    </div>
                    {['ROS', 'ROD'].includes(product.productId) && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 500 }}>Rodzina 800+</div>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <input type="number" value={product.count || 0} min={0} max={100000}
                      onChange={e => {
                        const v = parseInt(e.target.value);
                        updateCount(idx, isNaN(v) ? 0 : v);
                      }}
                      style={{
                        ...inputBaseStyle, width: '80px', textAlign: 'center', padding: '6px 8px',
                        fontSize: '0.85rem', fontWeight: hasCount ? 700 : 400,
                        borderColor: hasCount ? color : 'var(--border)',
                      }} />
                    {hasCount && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: '2px' }}>
                        {formatPLN(product.count * 100)}
                      </div>
                    )}
                  </td>
                  {visibleCols.map(col => {
                    const isEarlyRedemption = col.key === 'earlyRedemptionFee' && warning && hasCount;
                    return (
                      <td key={col.key} style={{
                        ...tdStyle, whiteSpace: 'nowrap',
                        color: isEarlyRedemption ? 'var(--warning)' : undefined,
                        fontWeight: isEarlyRedemption ? 600 : undefined,
                      }}>
                        {col.key === 'earlyRedemptionFee' && isRef ? '\u2014' : getCellValue(product, col.key)}
                        {isEarlyRedemption && <span style={{ marginLeft: '2px', color: 'var(--warning)' }}> !</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Summary bar */}
      <div style={{
        ...cardStyle, padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Twój portfel</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {totalBonds > 0 ? `${totalBonds} obligacji \u00B7 ${formatPLN(totalCapital)}` : 'Wybierz obligacje poniżej'}
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>
          Horyzont: <strong>{pluralYears(horizon)}</strong>
        </div>
      </div>

      {/* Column toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={() => setShowAllCols(!showAllCols)}
          style={{ ...btnSecondaryStyle, padding: '6px 12px', fontSize: '0.75rem' }}>
          {showAllCols ? 'Pokaż kluczowe kolumny' : 'Pokaż wszystkie kolumny'}
        </button>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
          {showAllCols ? '10 kolumn' : '5 kolumn'} {'\u00B7'} Wpisz liczbę sztuk żeby dodać do portfela
        </span>
      </div>

      {/* Obligacje skarbowe */}
      {renderProductTable(bonds, 'Obligacje skarbowe', false)}

      {/* Produkty referencyjne */}
      <div style={{
        background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem',
        fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '0.25rem',
      }}>
        Produkty referencyjne nie są obligacjami — służą do porównania.
        Lokata i konto mają edytowalne oprocentowanie — dostosuj je do oferty Twojego banku.
      </div>

      {/* Ref table */}
      <div style={{ marginBottom: '0.5rem' }}>
        <SectionLabel>Produkty referencyjne</SectionLabel>
        <div className="detail-table-wrap" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, minWidth: '140px' }}>Produkt</th>
                <th style={{ ...thStyle, textAlign: 'center', minWidth: '110px' }}>Ile szt.</th>
                <th style={thStyle}>Oprocentowanie stałe</th>
                <th style={thStyle}>Typ</th>
              </tr>
            </thead>
            <tbody>
              {refs.map(product => {
                const idx = state.products.findIndex(p => p.productId === product.productId);
                const hasCount = (product.count || 0) > 0;
                const color = PRODUCT_COLORS[product.productId] || 'var(--text-3)';
                return (
                  <tr key={product.productId} style={{ background: hasCount ? 'var(--surface)' : 'var(--surface-2)', opacity: hasCount ? 1 : 0.7 }}>
                    <td style={{ ...tdStyle, borderLeft: `3px solid ${hasCount ? color : 'var(--border)'}` }}>
                      <div style={{ fontWeight: 600, color, fontSize: '0.85rem' }}>{PRODUCT_SHORT[product.productId]}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{PRODUCT_DESCRIPTIONS[product.productId]?.split('.')[0]}.</div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <input type="number" value={product.count || 0} min={0} max={100000}
                        onChange={e => { const v = parseInt(e.target.value); updateCount(idx, isNaN(v) ? 0 : v); }}
                        style={{ ...inputBaseStyle, width: '80px', textAlign: 'center', padding: '6px 8px', fontSize: '0.85rem', fontWeight: hasCount ? 700 : 400, borderColor: hasCount ? color : 'var(--border)' }} />
                      {hasCount && <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: '2px' }}>{formatPLN(product.count * 100)}</div>}
                    </td>
                    <td style={tdStyle}>
                      <PercentageInput compact value={product.fixedRate || product.initialRate}
                        onChange={v => updateFixedRate(idx, v)} min={0} max={20} />
                    </td>
                    <td style={tdStyle}>Kapitalizacja roczna</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Validation */}
      {totalBonds === 0 && (
        <div style={{ ...cardStyle, background: 'var(--warning-light)', borderColor: 'var(--warning)', textAlign: 'center', padding: '1rem' }}>
          <p style={{ color: 'var(--warning)', fontWeight: 500, fontSize: '0.85rem' }}>
            Wpisz liczbę obligacji przy co najmniej jednym produkcie żeby kontynuować.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="btn-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
        <button onClick={onBack} style={btnSecondaryStyle}>{'\u2190'} Wróć</button>
        <button onClick={onNext} disabled={totalBonds === 0}
          style={{ ...btnPrimaryStyle, opacity: totalBonds === 0 ? 0.5 : 1, cursor: totalBonds === 0 ? 'not-allowed' : 'pointer' }}
          onMouseOver={e => { if (totalBonds > 0) e.currentTarget.style.opacity = '0.9'; }}
          onMouseOut={e => { if (totalBonds > 0) e.currentTarget.style.opacity = '1'; }}>
          Przejdź do IKE {'\u2192'}
        </button>
      </div>
    </div>
  );
}
