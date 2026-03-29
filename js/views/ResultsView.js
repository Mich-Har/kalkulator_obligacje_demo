// ============================================================
// STEP 4: RESULTS VIEW
// ============================================================

function ResultsView({ state, setState, onDetails, onRestart }) {
  const [ikeOn, setIkeOn] = React.useState(false);
  const [chartMode, setChartMode] = React.useState('nominal');
  const [chartScenario, setChartScenario] = React.useState('obligacje');
  const [withdrawEnabled, setWithdrawEnabled] = React.useState(false);
  const [withdrawals, setWithdrawals] = React.useState({});

  const chartRef = React.useRef(null);
  const chartInstance = React.useRef(null);

  const activeProducts = state.products.filter(p => (p.count || 0) > 0);
  const activeBonds = activeProducts.filter(p => !['LOK', 'KOS'].includes(p.productId));
  const activeRefs = activeProducts.filter(p => ['LOK', 'KOS'].includes(p.productId));

  const bondTotalCount = activeBonds.reduce((s, p) => s + p.count, 0);
  const bondCapital = bondTotalCount * 100;

  const withdrawalsMap = React.useMemo(() => {
    if (!withdrawEnabled) return null;
    const map = {};
    for (const [pid, w] of Object.entries(withdrawals)) {
      if (w.year > 0 && w.count > 0) map[pid] = w;
    }
    return Object.keys(map).length > 0 ? map : null;
  }, [withdrawEnabled, withdrawals]);

  const results = calculateSimulation(state, withdrawalsMap);

  if (!results || results.variants.length === 0) {
    return <div style={cardStyle}>Brak wyników. Wróć i wybierz co najmniej jeden produkt.</div>;
  }

  const noIkeVariants = results.variants.filter(v => v.variantType === 'NO_IKE');
  const ikeVariants = results.variants.filter(v => v.variantType === 'IKE_MET');

  const bondNoIke = noIkeVariants.filter(v => !['LOK', 'KOS'].includes(v.productId));
  const bondIke = ikeVariants.filter(v => !['LOK', 'KOS'].includes(v.productId));
  const bondActiveVariants = ikeOn ? bondIke : bondNoIke;
  const refActiveVariants = noIkeVariants.filter(v => ['LOK', 'KOS'].includes(v.productId));

  const activeVariants = [...bondActiveVariants, ...refActiveVariants]
    .sort((a, b) => b.finalValue - a.finalValue);

  const kpiVariant = activeVariants[0];
  const kpiNoIke = ikeOn ? bondNoIke.find(v => v.productId === kpiVariant?.productId) : null;

  const h = results.horizon;
  const cumInf = results.cumInflation;

  // Nominal capital withdrawn early (used to correctly compute profit on remaining portfolio)
  const totalWithdrawnCapital = activeBonds.reduce((s, p) => {
    const w = withdrawalsMap?.[p.productId];
    return s + (w && w.count > 0 ? Math.min(w.count, p.count - 1) * 100 : 0);
  }, 0);
  const displayCapital = bondCapital - totalWithdrawnCapital;

  // Portfolio aggregates — subtract withdrawnGross so KPIs show remaining portfolio (matches chart)
  const pfNoIkeVal  = bondNoIke.reduce((s, v) => s + v.finalValue - (v.withdrawnGross || 0), 0);
  const pfIkeVal    = bondIke.reduce((s, v) => s + v.finalValue - (v.withdrawnGross || 0), 0);
  const pfNoIkeReal = bondNoIke.reduce((s, v) => s + v.realValue - (v.withdrawnGross || 0) / (cumInf[h] || 1), 0);
  const pfIkeReal   = bondIke.reduce((s, v) => s + v.realValue - (v.withdrawnGross || 0) / (cumInf[h] || 1), 0);
  const pfTax       = bondNoIke.reduce((s, v) => s + v.tax, 0);
  const pfIkeCost   = bondIke.reduce((s, v) => s + v.ikeCost, 0);
  const pfActiveVal  = ikeOn ? pfIkeVal  : pfNoIkeVal;
  const pfActiveReal = ikeOn ? pfIkeReal : pfNoIkeReal;
  const pfActiveProfit = pfActiveVal - displayCapital;
  const pfActiveTax    = ikeOn ? 0 : pfTax;
  const pfActiveReturnPct = displayCapital > 0 ? pfActiveProfit / displayCapital * 100 : 0;
  const pfNoIkeProfit = pfNoIkeVal - displayCapital;
  const pfNoIkeReturnPct = displayCapital > 0 ? pfNoIkeProfit / displayCapital * 100 : 0;
  const ikeBenefit = pfIkeVal - pfNoIkeVal;

  // Ranking rows: portfolio entry + sorted refs
  const sortedRefs = [...refActiveVariants].sort((a, b) => b.finalValue - a.finalValue);
  const rankingRows = [
    ...(bondActiveVariants.length > 0
      ? [{ type: 'portfolio', val: pfActiveVal, real: pfActiveReal, returnPct: pfActiveReturnPct }]
      : []),
    ...sortedRefs.map(v => ({ type: 'ref', variant: v, val: v.finalValue })),
  ].sort((a, b) => b.val - a.val);

  // Portfolio-level insights
  const portfolioInsights = [];
  if (bondActiveVariants.length > 0) {
    portfolioInsights.push(
      `Portfel obligacji (${ikeOn ? 'z IKE' : 'bez IKE'}): ${formatPLN(pfActiveVal)} — zysk ${pfActiveProfit >= 0 ? '+' : ''}${formatPLN(pfActiveProfit)} (${pfActiveReturnPct >= 0 ? '+' : ''}${formatPct(pfActiveReturnPct)}).`
    );
    if (bondIke.length > 0 && bondNoIke.length > 0) {
      if (ikeBenefit > 0) {
        portfolioInsights.push(`IKE przynosi portfelowi ${formatPLN(ikeBenefit)} więcej niż bez IKE — mimo kosztów prowadzenia (${formatPLN(pfIkeCost)}).`);
      } else if (ikeBenefit < 0) {
        portfolioInsights.push(`Koszty IKE (${formatPLN(pfIkeCost)}) przewyższają korzyść podatkową przy horyzoncie ${h} lat — bez IKE wychodzi ${formatPLN(-ikeBenefit)} lepiej.`);
      }
    }
    if (sortedRefs.length > 0) {
      const bestRef = sortedRefs[0];
      if (pfActiveVal > bestRef.finalValue) {
        portfolioInsights.push(`Portfel obligacji bije ${PRODUCT_SHORT[bestRef.productId]} o ${formatPLN(pfActiveVal - bestRef.finalValue)}.`);
      } else {
        portfolioInsights.push(`${PRODUCT_SHORT[bestRef.productId]} (${formatPLN(bestRef.finalValue)}) przewyższa portfel obligacji o ${formatPLN(bestRef.finalValue - pfActiveVal)}.`);
      }
    }
    if (pfActiveReal > bondCapital) {
      portfolioInsights.push(`Portfel realnie rośnie — po inflacji ${formatPLN(pfActiveReal)} przekracza wpłacony kapitał ${formatPLN(bondCapital)}.`);
    } else {
      portfolioInsights.push(`Portfel realnie traci — po inflacji ${formatPLN(pfActiveReal)} jest poniżej wpłaconego kapitału ${formatPLN(bondCapital)}.`);
    }
  }

  const totalWithdrawalFees = React.useMemo(() => {
    if (!withdrawalsMap) return 0;
    return [...bondActiveVariants, ...refActiveVariants].reduce((sum, v) => sum + (v.withdrawnRedemptionFee || 0), 0);
  }, [bondActiveVariants, refActiveVariants, withdrawalsMap]);

  const bondInflationData = cumInf.map(ci => bondCapital * ci);
  const bondDoNothingData = cumInf.map((ci, i) => i === 0 ? bondCapital : bondCapital / ci);

  const inflDropPct = (1 - 1 / (cumInf[h] || 1)) * 100;
  const inflDropAmt = bondCapital - bondCapital / (cumInf[h] || 1);

  // Bonds needing reinvestment note (maturity < horizon)
  const reinvestBonds = activeBonds.filter(p => p.maturityMonths && p.maturityMonths / 12 < h);

  // Whether to show "po Belce" extension column:
  // - NO_IKE: bonds + refs have tax
  // - IKE mode: refs (LOK/KOS) still pay Belka even with IKE
  const taxableInNoIke = !ikeOn ? [...bondActiveVariants, ...refActiveVariants] : [];
  const taxableAlways = refActiveVariants; // refs always pay regardless of IKE
  const allTaxable = [...taxableInNoIke, ...taxableAlways.filter(v => ikeOn)];
  // Simplified: show "po Belce" whenever any product pays tax
  const hasTaxDrop = allTaxable.some(v => v.tax > 0) ||
    (!ikeOn && bondActiveVariants.some(v => v.tax > 0)) ||
    refActiveVariants.some(v => v.tax > 0);

  // Helper: get bond bar value (remaining bonds, adjusted for withdrawal)
  const getBondBarVal = (v, i, mode) => {
    const wYear = withdrawalsMap?.[v.productId]?.year || null;
    const wGross = v.withdrawnGross || 0;
    let val = mode === 'real' ? v.yearlyValues[i].realValue : v.yearlyValues[i].value;
    if (wGross > 0 && wYear && i >= wYear) {
      val = Math.max(0, val - (mode === 'real' ? wGross / (cumInf[i] || 1) : wGross));
    }
    return val;
  };

  // Chart
  React.useEffect(() => {
    if (!chartRef.current || !results) return;
    chartInstance.current?.destroy();

    const baseLabels = Array.from({ length: h + 1 }, (_, i) => i === 0 ? 'Start' : 'Rok ' + i);
    const labels = hasTaxDrop ? [...baseLabels, 'po Belce'] : baseLabels;
    const datasets = [];

    // End-zone shading plugin (shades last 1-2 columns for "obligacje" chart)
    const endZonePlugin = {
      id: 'endZone',
      afterDraw(chart) {
        if (chartScenario !== 'obligacje') return;
        const { ctx, chartArea, scales } = chart;
        const xScale = scales.x;
        if (!xScale || !chartArea || xScale.ticks.length < 2) return;
        const colW = xScale.getPixelForTick(1) - xScale.getPixelForTick(0);
        // Shade from start of "Rok H" (index h) to right edge
        const shadeX = xScale.getPixelForTick(h) - colW / 2;
        ctx.save();
        ctx.fillStyle = 'rgba(26,25,22,0.045)';
        ctx.fillRect(shadeX, chartArea.top, chartArea.right - shadeX, chartArea.bottom - chartArea.top);
        // Thin vertical line at start of shaded zone
        ctx.strokeStyle = 'rgba(26,25,22,0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(shadeX, chartArea.top);
        ctx.lineTo(shadeX, chartArea.bottom);
        ctx.stroke();
        ctx.restore();
      },
    };

    if (chartScenario === 'gotowka') {
      datasets.push({
        type: 'line',
        label: 'Nominalna (wartość się nie zmienia)',
        data: baseLabels.map(() => bondCapital),
        borderColor: '#1E3A5F', backgroundColor: 'transparent',
        tension: 0, pointRadius: 0, borderWidth: 2.5, order: 1,
      });
      datasets.push({
        type: 'line',
        label: 'Realna siła nabywcza (spada przez inflację)',
        data: bondDoNothingData,
        borderColor: '#92400E', backgroundColor: 'rgba(146,64,14,0.07)',
        fill: true, borderDash: [5, 5], tension: 0.3,
        pointRadius: 0, borderWidth: 2, order: 2,
      });

    } else if (chartScenario === 'obligacje') {

      // -- Bond bars --
      bondActiveVariants.forEach((v, idx) => {
        const color = PRODUCT_COLORS[v.productId] || CHART_COLORS[idx % CHART_COLORS.length];
        const data = v.yearlyValues.map((_, i) => getBondBarVal(v, i, chartMode));
        // "po Belce" col: no bar — only sum line and ref lines appear there
        if (hasTaxDrop) data.push(null);
        datasets.push({
          type: 'bar', label: v.label, data,
          backgroundColor: color + '90', borderColor: color,
          borderWidth: 1, barPercentage: 0.8, categoryPercentage: 0.85, order: 2,
        });
      });

      // -- Total bonds sum line --
      if (bondActiveVariants.length > 0) {
        const totalData = baseLabels.map((_, i) =>
          bondActiveVariants.reduce((sum, v) => sum + getBondBarVal(v, i, chartMode), 0)
        );
        if (hasTaxDrop) {
          if (!ikeOn) {
            const netTotal = bondActiveVariants.reduce((sum, v) => {
              const wGross = v.withdrawnGross || 0;
              const postTax = v.finalValue - wGross;
              return sum + (chartMode === 'real' ? postTax / (cumInf[h] || 1) : postTax);
            }, 0);
            totalData.push(netTotal);
          } else {
            // IKE: bonds exempt from Belka — extend at same level as final year
            totalData.push(totalData[h]);
          }
        }
        datasets.push({
          type: 'line', label: 'Suma portfela obligacji', data: totalData,
          borderColor: '#1A1916', backgroundColor: 'transparent',
          tension: 0.3, pointRadius: 3, pointBackgroundColor: '#1A1916',
          borderWidth: 2.5, order: 0,
        });
      }

      // -- Ref product lines (always NO_IKE) — extend to "po Belce" with after-tax --
      refActiveVariants.forEach((v, idx) => {
        const color = PRODUCT_COLORS[v.productId] || CHART_COLORS[(bondActiveVariants.length + idx) % CHART_COLORS.length];
        const data = v.yearlyValues.map(y => chartMode === 'real' ? y.realValue : y.value);
        if (hasTaxDrop) {
          // Extend to "po Belce" with the after-tax final value
          const postTaxVal = chartMode === 'real'
            ? v.finalValue / (cumInf[h] || 1)
            : v.finalValue;
          data.push(postTaxVal);
        }
        datasets.push({
          type: 'line', label: PRODUCT_SHORT[v.productId] + ' (bez IKE)', data,
          borderColor: color, backgroundColor: 'transparent',
          tension: 0.3, pointRadius: 3, pointBackgroundColor: color,
          borderWidth: 2, borderDash: [6, 3], order: 1,
        });
      });

      // -- Preservation of purchasing power line (renamed) --
      const preserveLabel = chartMode === 'real'
        ? 'Próg: 0% zysku realnego (zachowanie siły nabywczej)'
        : 'Próg zachowania siły nabywczej (tyle pochłonie inflacja)';
      const preserveData = chartMode === 'real'
        ? baseLabels.map(() => bondCapital)   // flat in real terms
        : bondInflationData.slice(0, h + 1);
      if (hasTaxDrop) {
        preserveData.push(chartMode === 'real' ? bondCapital : bondInflationData[h]);
      }
      datasets.push({
        type: 'line', label: preserveLabel, data: preserveData,
        borderColor: '#92400E', backgroundColor: 'transparent',
        borderDash: [5, 5], tension: 0.3, pointRadius: 0,
        borderWidth: 1.5, order: 3,
      });
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true, pointStyleWidth: 30, padding: 14,
              font: { family: "'DM Sans', sans-serif", size: 11 },
            },
          },
          tooltip: {
            callbacks: {
              label: ctx => ctx.parsed.y != null ? ctx.dataset.label + ': ' + formatPLN(ctx.parsed.y) : null,
            },
            filter: item => item.parsed.y != null,
          },
        },
        scales: {
          y: {
            ticks: { callback: v => formatPLN(v), font: { family: "'DM Sans', sans-serif", size: 11 } },
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
          x: {
            ticks: { font: { family: "'DM Sans', sans-serif", size: 11 } },
            grid: { display: false },
          },
        },
      },
      plugins: [endZonePlugin],
    });

    return () => chartInstance.current?.destroy();
  }, [results, chartMode, chartScenario, ikeOn, withdrawalsMap]);

  const scenarioCaptions = {
    gotowka: 'Pieniądze trzymane na nieoprocentowanym koncie lub w domu — nominalna wartość stoi w miejscu, realna kurczy się każdego roku.',
    obligacje: ikeOn
      ? 'Słupki = obligacje z IKE (bez Belki) · Brązowa przerywana = próg siły nabywczej · Szare tło = strefa zakończenia inwestycji'
      : 'Słupki = obligacje · Linie przerywane = lokata/konto (bez IKE) · Kolumna "po Belce" = wartość po podatku · Szare tło = strefa zakończenia',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', marginBottom: '0.5rem' }}>
          Wyniki symulacji
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '0.95rem' }}>
          Portfel: {bondTotalCount} obligacji ({formatPLN(bondCapital)}) na {results.horizon} lat.
          {pfActiveVal > 0 && <> Wartość portfela po {results.horizon} latach: <strong>{formatPLN(pfActiveVal)}</strong>.</>}
        </p>
      </div>

      {/* IKE Toggle */}
      {activeBonds.length > 0 && (
        <div style={{
          ...cardStyle, padding: '1rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: ikeOn ? 'var(--success-light)' : 'var(--surface)',
          borderColor: ikeOn ? 'var(--success)' : 'var(--border)',
          transition: 'all 0.2s ease',
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: ikeOn ? 'var(--success)' : 'var(--text)' }}>
              Wariant IKE <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-3)' }}>(tylko obligacje)</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>
              {ikeOn
                ? 'Obligacje z IKE: brak podatku Belki, z opłatami. Lokata i konto — zawsze bez IKE.'
                : 'Obligacje bez IKE: podatek Belki 19%. Lokata i konto — zawsze bez IKE.'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 500 }}>{ikeOn ? 'ON' : 'OFF'}</span>
            <ToggleSwitch checked={ikeOn} onChange={setIkeOn} />
          </div>
        </div>
      )}

      {/* KPI — kapitał → obligacje → produkt referencyjny */}
      {bondActiveVariants.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Wpłacony kapitał */}
          <div style={{ ...cardStyle, padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.25rem' }}>Wpłacony kapitał</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{formatPLN(bondCapital)}</div>
            {totalWithdrawnCapital > 0 && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '0.15rem' }}>
                pozostaje w portfelu: {formatPLN(displayCapital)}
              </div>
            )}
          </div>

          {/* Portfel obligacji */}
          <div style={{
            ...cardStyle, padding: '1.25rem 1.5rem',
            borderColor: ikeOn ? 'var(--success)' : 'var(--border)',
            background: ikeOn ? 'var(--success-light)' : 'var(--surface)',
          }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: ikeOn ? 'var(--success)' : 'var(--text-3)', fontWeight: 600, marginBottom: '1rem' }}>
              Portfel obligacji{ikeOn ? ' · z IKE' : ' · bez IKE'}
            </div>
            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1.25rem' }}>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.2rem' }}>Wartość końcowa</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--navy)' }}>{formatPLN(pfActiveVal)}</div>
                {ikeOn && pfNoIkeVal > 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>{formatPLN(pfNoIkeVal)}</div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.2rem' }}>Zysk nominalny</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: pfActiveProfit >= 0 ? 'var(--success)' : 'var(--warning)' }}>
                  {pfActiveProfit >= 0 ? '+' : ''}{formatPLN(pfActiveProfit)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                  {pfActiveReturnPct >= 0 ? '+' : ''}{formatPct(pfActiveReturnPct)}
                </div>
                {ikeOn && pfNoIkeVal > 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>
                    {pfNoIkeProfit >= 0 ? '+' : ''}{formatPLN(pfNoIkeProfit)}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.2rem' }}>
                  Wartość realna <TooltipInfo text="Skorygowana o inflację — rzeczywista siła nabywcza." />
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{formatPLN(pfActiveReal)}</div>
                <div style={{ fontSize: '0.72rem', color: pfActiveReal >= bondCapital ? 'var(--success)' : 'var(--warning)' }}>
                  {pfActiveReal >= bondCapital ? 'realnie rośnie' : 'realnie traci'}
                </div>
                {ikeOn && pfNoIkeReal > 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>{formatPLN(pfNoIkeReal)}</div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.2rem' }}>
                  Podatek Belki <TooltipInfo text="Podatek 19% od zysku. Z IKE: 0 zł." />
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: pfActiveTax > 0 ? 'var(--warning)' : 'var(--success)' }}>
                  {formatPLN(pfActiveTax)}
                </div>
                {ikeOn && pfTax > 0 && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>{formatPLN(pfTax)}</div>
                )}
              </div>

              {ikeOn && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.2rem' }}>
                    Korzyść z IKE <TooltipInfo text="Różnica wartości portfela z IKE vs bez IKE, po kosztach prowadzenia." />
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, color: ikeBenefit > 0 ? 'var(--success)' : ikeBenefit < 0 ? 'var(--warning)' : 'var(--text-3)' }}>
                    {ikeBenefit >= 0 ? '+' : ''}{formatPLN(ikeBenefit)}
                  </div>
                  {pfIkeCost > 0 && <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>koszty: {formatPLN(pfIkeCost)}</div>}
                </div>
              )}

            </div>
          </div>

          {/* Produkty referencyjne */}
          {sortedRefs.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: sortedRefs.length > 1 ? '1fr 1fr' : '1fr', gap: '0.75rem' }}>
              {sortedRefs.map(ref => {
                const refCapital = ref.bondCount * 100;
                const refProfit = ref.finalValue - refCapital;
                return (
                  <div key={ref.productId} style={{ ...cardStyle, padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, marginBottom: '1rem' }}>
                      {PRODUCT_NAMES[ref.productId] || ref.label} <span style={{ fontWeight: 400 }}>· bez IKE</span>
                    </div>
                    <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1.25rem' }}>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.2rem' }}>Wartość końcowa</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formatPLN(ref.finalValue)}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.2rem' }}>Zysk nominalny</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: refProfit >= 0 ? 'var(--success)' : 'var(--warning)' }}>
                          {refProfit >= 0 ? '+' : ''}{formatPLN(refProfit)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                          {ref.returnPct >= 0 ? '+' : ''}{formatPct(ref.returnPct)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.2rem' }}>
                          Wartość realna <TooltipInfo text="Skorygowana o inflację — rzeczywista siła nabywcza." />
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formatPLN(ref.realValue)}</div>
                        <div style={{ fontSize: '0.72rem', color: ref.realValue >= refCapital ? 'var(--success)' : 'var(--warning)' }}>
                          {ref.realValue >= refCapital ? 'realnie rośnie' : 'realnie traci'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '0.2rem' }}>Podatek Belki</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: ref.tax > 0 ? 'var(--warning)' : 'var(--text-3)' }}>{formatPLN(ref.tax)}</div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Chart */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <SegmentedControl
            options={[
              { value: 'gotowka', label: 'Gotówka bezczynna' },
              { value: 'obligacje', label: 'Obligacje' },
            ]}
            value={chartScenario}
            onChange={setChartScenario}
          />
          {chartScenario !== 'gotowka' && (
            <SegmentedControl
              options={[{ value: 'nominal', label: 'Nominalnie' }, { value: 'real', label: 'Realnie' }]}
              value={chartMode} onChange={setChartMode}
              helpTexts={{
                nominal: 'Kwota w złotówkach bez korekty o inflację.',
                real: 'Kwota skorygowana o inflację — rzeczywista siła nabywcza.',
              }} />
          )}
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: '0.75rem' }}>
          {scenarioCaptions[chartScenario]}
        </div>

        <div className="chart-wrap" style={{ height: '400px', position: 'relative' }}>
          <canvas ref={chartRef} />

          {/* Gotówka overlay */}
          {chartScenario === 'gotowka' && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.93)',
              padding: '1rem 1.5rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)',
              maxWidth: '260px',
              pointerEvents: 'none',
              zIndex: 5,
            }}>
              <div style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '2rem', fontWeight: 700,
                color: 'var(--warning)', lineHeight: 1, marginBottom: '0.4rem',
              }}>
                -{formatPct(inflDropPct)}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.25rem' }}>
                utrata siły nabywczej
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
                Po {h} latach {formatPLN(bondCapital)} straci realnie {formatPLN(inflDropAmt)} — bez żadnej inwestycji, tylko przez inflację.
              </div>
            </div>
          )}
        </div>

        {/* Reinvestment note for bonds with maturity < horizon */}
        {chartScenario === 'obligacje' && reinvestBonds.length > 0 && (
          <div style={{
            marginTop: '0.75rem', padding: '0.6rem 0.875rem',
            background: 'var(--navy-light)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--navy)', fontSize: '0.78rem', color: 'var(--navy)',
            lineHeight: 1.55,
          }}>
            <strong>Założenie: automatyczne reinwestowanie.</strong>{' '}
            {reinvestBonds.map(p => PRODUCT_SHORT[p.productId]).join(', ')} ma{reinvestBonds.length > 1 ? 'ją' : ''} termin zapadalności krótszy niż wybrany horyzont ({h} lat).
            Symulacja zakłada, że po wykupie środki są natychmiast reinwestowane w ten sam typ obligacji na tych samych warunkach.
          </div>
        )}
      </div>

      {/* Partial withdrawal */}
      <div style={cardStyle}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1.25rem',
          paddingBottom: withdrawEnabled ? '1.25rem' : 0,
          marginBottom: withdrawEnabled ? '1.25rem' : 0,
          borderBottom: withdrawEnabled ? '1px solid var(--border)' : 'none',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Wcześniejszy wykup</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.55 }}>
              Zasymuluj wykup części obligacji przed terminem — wybierz produkt, rok i liczbę sztuk. Mogą wystąpić opłaty za przedterminowy wykup.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 500 }}>{withdrawEnabled ? 'ON' : 'OFF'}</span>
            <ToggleSwitch checked={withdrawEnabled} onChange={val => {
              setWithdrawEnabled(val);
              if (!val) setWithdrawals({});
            }} />
          </div>
        </div>

        {withdrawEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activeBonds.map(product => {
              const w = withdrawals[product.productId] || { year: 0, count: 0 };
              const color = PRODUCT_COLORS[product.productId] || 'var(--text-3)';
              const matYears = product.maturityMonths ? product.maturityMonths / 12 : null;
              const isEarly = matYears && w.year > 0 && w.year < matYears;
              return (
                <div key={product.productId} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem',
                  background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid ' + color, flexWrap: 'wrap',
                }}>
                  <div style={{ minWidth: '80px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color }}>{PRODUCT_SHORT[product.productId]}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{product.count} szt.</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '2px' }}>Rok wykupu</div>
                    <input type="number" value={w.year} min={0} max={state.horizon}
                      onFocus={e => e.target.select()}
                      onChange={e => setWithdrawals(prev => ({
                        ...prev,
                        [product.productId]: { ...prev[product.productId], year: clamp(parseInt(e.target.value) || 0, 0, state.horizon), count: prev[product.productId]?.count || 0 },
                      }))}
                      style={{ ...inputBaseStyle, width: '70px', textAlign: 'center', padding: '6px 8px', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: '2px' }}>Ile szt.</div>
                    <input type="number" value={w.count} min={0} max={product.count - 1}
                      onFocus={e => e.target.select()}
                      onChange={e => setWithdrawals(prev => ({
                        ...prev,
                        [product.productId]: { ...prev[product.productId], count: clamp(parseInt(e.target.value) || 0, 0, product.count - 1), year: prev[product.productId]?.year || 0 },
                      }))}
                      style={{ ...inputBaseStyle, width: '70px', textAlign: 'center', padding: '6px 8px', fontSize: '0.85rem' }} />
                  </div>
                  {isEarly && w.count > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 500 }}>
                      Opłata: {formatPLN(product.earlyRedemptionFee * w.count)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {withdrawEnabled && totalWithdrawalFees > 0 && (
          <div style={{
            marginTop: '1rem', background: 'var(--warning-light)',
            borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem',
            border: '1px solid var(--warning)', fontSize: '0.85rem', lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 600, color: 'var(--warning)', marginBottom: '0.25rem' }}>Koszty wcześniejszego wykupu</div>
            {activeVariants.filter(v => (v.withdrawnRedemptionFee || 0) > 0).map(v => (
              <div key={v.productId + v.variantType} style={{ color: 'var(--warning)', display: 'flex', justifyContent: 'space-between' }}>
                <span>{PRODUCT_SHORT[v.productId]}:</span>
                <span style={{ fontWeight: 600 }}>{formatPLN(v.withdrawnRedemptionFee)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--warning)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--warning)' }}>
              <span>Razem:</span><span>{formatPLN(totalWithdrawalFees)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Ranking — portfolio vs refs */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>
          Porównanie
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {rankingRows.map((row, idx) => {
            const isFirst = idx === 0;
            const rowStyle = {
              borderRadius: 'var(--radius-sm)',
              border: isFirst ? '1px solid var(--success)' : '1px solid transparent',
              background: isFirst ? 'var(--success-light)' : 'var(--surface-2)',
            };
            const badgeStyle = {
              width: '28px', height: '28px', borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700,
              flexShrink: 0,
              background: isFirst ? 'var(--success)' : 'var(--surface)',
              color: isFirst ? '#fff' : 'var(--text-3)',
              border: isFirst ? 'none' : '1px solid var(--border)',
            };

            if (row.type === 'portfolio') {
              const bondBreakdown = bondActiveVariants.map(v =>
                `${PRODUCT_SHORT[v.productId]} ${v.bondCount} szt.`
              ).join(' · ');
              return (
                <div key="portfolio" style={{ ...rowStyle, padding: '0.875rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={badgeStyle}>{idx + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        Portfel obligacji
                        <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--text-3)', marginLeft: '6px' }}>
                          {ikeOn ? '(IKE)' : '(bez IKE)'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-3)', marginTop: '2px' }}>
                        Realna: {formatPLN(pfActiveReal)}
                        {pfIkeCost > 0 && ikeOn && ' \u00B7 koszty IKE: ' + formatPLN(pfIkeCost)}
                        {pfTax > 0 && !ikeOn && ' \u00B7 Belka: ' + formatPLN(pfTax)}
                      </div>
                      {bondBreakdown && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '3px', opacity: 0.8 }}>
                          {bondBreakdown}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{formatPLN(pfActiveVal)}</div>
                      {ikeOn && pfNoIkeVal > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>{formatPLN(pfNoIkeVal)}</div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: pfActiveReturnPct >= 0 ? 'var(--success)' : 'var(--warning)' }}>
                        {pfActiveReturnPct >= 0 ? '+' : ''}{formatPct(pfActiveReturnPct)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Ref product row
            const v = row.variant;
            const refReturnPct = v.returnPct;
            return (
              <div key={v.productId} style={{ ...rowStyle, padding: '0.875rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={badgeStyle}>{idx + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {PRODUCT_NAMES[v.productId] || v.label}
                      <span style={{ fontWeight: 400, fontSize: '0.7rem', color: 'var(--text-3)', marginLeft: '6px' }}>(bez IKE · {v.bondCount} szt.)</span>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-3)', marginTop: '2px' }}>
                      Realna: {formatPLN(v.realValue)}
                      {v.tax > 0 && ' \u00B7 Belka: ' + formatPLN(v.tax)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{formatPLN(v.finalValue)}</div>
                    <div style={{ fontSize: '0.75rem', color: refReturnPct >= 0 ? 'var(--success)' : 'var(--warning)' }}>
                      {refReturnPct >= 0 ? '+' : ''}{formatPct(refReturnPct)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights — portfolio-level */}
      {portfolioInsights.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem' }}>Wnioski</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {portfolioInsights.map((ins, i) => (
              <div key={i} style={{
                display: 'flex', gap: '0.5rem', padding: '0.75rem', background: 'var(--surface-2)',
                borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', lineHeight: 1.5,
              }}>
                <span style={{ flexShrink: 0, color: 'var(--accent)', fontWeight: 700 }}>{'\u2022'}</span>
                <span>{ins}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="btn-row" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
        <button onClick={onRestart} style={btnSecondaryStyle}>Zmień ustawienia</button>
        <button onClick={onDetails} style={btnPrimaryStyle}
          onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}>
          Zobacz szczegóły {'\u2192'}
        </button>
      </div>
    </div>
  );
}
