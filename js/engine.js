// ============================================================
// CALCULATION ENGINE
// ============================================================

function getIndicator(array, afterYear12, year) {
  return year <= 12 ? (array[year - 1] ?? afterYear12) : afterYear12;
}

function getRate(product, year, indicators) {
  if (year === 1) return product.initialRate;
  if (product.indexType === 'fixed') return product.fixedRate || product.initialRate;
  if (product.indexType === 'inflation_benchmark') return indicators.inflation[year - 1] ?? 3.0;

  const prevYear = year - 1;
  let base = 0;
  if (product.indexType === 'inflation') base = indicators.inflation[prevYear] ?? 3.0;
  else if (product.indexType === 'nbp_ref') base = indicators.nbpRate[prevYear] ?? 3.75;
  else if (product.indexType === 'wibor6m') base = indicators.wibor6m[prevYear] ?? 3.6;
  return Math.max(0, base + product.margin);
}

function buildIndicators(state) {
  const h = state.horizon;
  const result = { inflation: [], nbpRate: [], wibor6m: [], depositRate: [] };
  for (let y = 1; y <= h; y++) {
    result.inflation.push(getIndicator(state.inflationByYear, state.indicatorAfterYear12.inflation, y));
    result.nbpRate.push(getIndicator(state.nbpRateByYear, state.indicatorAfterYear12.nbpRate, y));
    result.wibor6m.push(getIndicator(state.wibor6mByYear, state.indicatorAfterYear12.wibor6m, y));
    result.depositRate.push(getIndicator(state.depositRateByYear, state.indicatorAfterYear12.depositRate, y));
  }
  return result;
}

function calculateCumulativeInflation(indicators, horizon) {
  const cumInf = [1];
  for (let y = 1; y <= horizon; y++) {
    cumInf.push(cumInf[y - 1] * (1 + (indicators.inflation[y - 1] ?? 3.0) / 100));
  }
  return cumInf;
}

function calculateProductYearly(product, bondCount, horizon, indicators) {
  const capital = bondCount * 100;
  const yearly = [{ year: 0, value: capital, rate: 0 }];

  if (product.indexType === 'inflation_benchmark') {
    let cumInf = 1;
    for (let y = 1; y <= horizon; y++) {
      cumInf *= (1 + (indicators.inflation[y - 1] ?? 3.0) / 100);
      yearly.push({ year: y, value: capital * cumInf, rate: indicators.inflation[y - 1] ?? 3.0 });
    }
    return yearly;
  }

  if (product.couponType === 'coupon') {
    let totalCoupons = 0;
    for (let y = 1; y <= horizon; y++) {
      const rate = getRate(product, y, indicators);
      const coupon = capital * rate / 100;
      totalCoupons += coupon;
      yearly.push({ year: y, value: capital + totalCoupons, rate });
    }
    return yearly;
  }

  // Capitalization
  let value = capital;
  for (let y = 1; y <= horizon; y++) {
    const rate = getRate(product, y, indicators);
    value = value * (1 + rate / 100);
    yearly.push({ year: y, value, rate });
  }
  return yearly;
}

function applyEarlyRedemption(finalValue, product, bondCount, horizon, capital) {
  const maturityYears = product.maturityMonths ? product.maturityMonths / 12 : null;
  let redemptionCost = 0;
  if (maturityYears && horizon < maturityYears && product.earlyRedemptionFee > 0) {
    redemptionCost = product.earlyRedemptionFee * bondCount;
    finalValue -= redemptionCost;
    if (product.nominalProtection) {
      finalValue = Math.max(finalValue, capital - redemptionCost);
    }
  }
  return { finalValue, redemptionCost };
}

function calculateIkeFees(totalBonds, horizon, additionalCosts) {
  const fees = [];
  let total = 0;
  for (let y = 1; y <= horizon; y++) {
    const feeRate = IKE_FEE_RATES[y] !== undefined ? IKE_FEE_RATES[y] : IKE_FEE_RATE_DEFAULT;
    const nominal = totalBonds * 100;
    const rawFee = nominal * feeRate;
    const fee = Math.min(rawFee, IKE_FEE_CAP) + additionalCosts;
    fees.push({ year: y, contractYear: y, feeRate, rawFee, fee });
    total += fee;
  }
  return { fees, total };
}

// Calculate IKE fee per year for the whole portfolio, then return product's share
function getProductIkeFeeShare(totalBonds, productBonds, year, additionalCosts) {
  if (totalBonds <= 0) return 0;
  const feeRate = IKE_FEE_RATES[year] !== undefined ? IKE_FEE_RATES[year] : IKE_FEE_RATE_DEFAULT;
  const nominal = totalBonds * 100;
  const rawFee = nominal * feeRate;
  const totalFee = Math.min(rawFee, IKE_FEE_CAP) + additionalCosts;
  return totalFee * (productBonds / totalBonds);
}

function applyIkeFeesToYearly(yearly, productBonds, totalBonds, horizon, additionalCosts) {
  const result = [{ ...yearly[0] }];
  const ikeFees = [];
  for (let y = 1; y <= horizon; y++) {
    const fee = getProductIkeFeeShare(totalBonds, productBonds, y, additionalCosts);
    ikeFees.push(fee);

    let val = yearly[y].value;
    // Fee from previous year deducted at start of current year
    if (y >= 2 && ikeFees[y - 2] !== undefined) {
      val -= ikeFees[y - 2];
    }
    result.push({ ...yearly[y], value: val, ikeFee: fee });
  }
  if (horizon >= 1) {
    result[horizon].value -= ikeFees[horizon - 1];
  }
  return result;
}

function estimateIkeCost(totalBonds, horizon) {
  const { total } = calculateIkeFees(totalBonds, horizon, 0);
  return total;
}

function generateInsights(variants, state, totalCapital, cumInflation, indicators) {
  const insights = [];
  if (variants.length === 0) return insights;

  const noIkeVariants = variants.filter(v => v.variantType === 'NO_IKE');
  const ikeVariants = variants.filter(v => v.variantType === 'IKE_MET');

  if (noIkeVariants.length > 0) {
    const best = noIkeVariants[0];
    insights.push(`Najlepszy wynik bez IKE: ${PRODUCT_NAMES[best.productId] || best.label} — ${formatPLN(best.finalValue)} (${best.returnPct >= 0 ? '+' : ''}${formatPct(best.returnPct)}).`);
  }

  if (ikeVariants.length > 0 && noIkeVariants.length > 0) {
    const bestIke = ikeVariants[0];
    const bestNoIke = noIkeVariants[0];
    const totalBonds = state.products.reduce((s, p) => s + (p.count || 0), 0);
    const ikeFees = calculateIkeFees(totalBonds, state.horizon, state.ikeAdditionalCosts || 0);
    if (bestIke.finalValue > bestNoIke.finalValue) {
      const benefit = bestIke.finalValue - bestNoIke.finalValue;
      insights.push(`Z IKE zyskujesz ${formatPLN(benefit)} więcej mimo kosztów prowadzenia (${formatPLN(ikeFees.total)}).`);
    } else {
      insights.push(`Koszty IKE (${formatPLN(ikeFees.total)}) pochłaniają korzyść podatkową przy tym horyzoncie.`);
    }
  }

  if (noIkeVariants.length >= 2) {
    const first = noIkeVariants[0];
    const second = noIkeVariants[1];
    const diff = first.finalValue - second.finalValue;
    if (diff > 0) {
      insights.push(`${PRODUCT_SHORT[first.productId]} daje ${formatPLN(diff)} więcej niż ${PRODUCT_SHORT[second.productId]}.`);
    }
  }

  const lokVariant = noIkeVariants.find(v => v.productId === 'LOK');
  if (lokVariant) {
    const lokCapital = lokVariant.yearlyValues[0]?.value || 0;
    if (lokVariant.realValue >= lokCapital) {
      insights.push('Lokata utrzymuje realną wartość w tym scenariuszu.');
    } else {
      insights.push('Lokata traci realną wartość — inflacja wyprzedza oprocentowanie.');
    }
  }

  return insights;
}

// ============================================================
// MAIN SIMULATION — always computes NO_IKE + IKE_MET per product
// Optional withdrawals: { [productId]: { year, count } }
// ============================================================

function calculateSimulation(state, withdrawals) {
  const horizon = state.horizon;
  const indicators = buildIndicators(state);
  const cumInflation = calculateCumulativeInflation(indicators, horizon);
  const activeProducts = state.products.filter(p => (p.count || 0) > 0);
  const totalBonds = activeProducts.reduce((s, p) => s + p.count, 0);
  const totalCapital = totalBonds * 100;

  const variants = [];

  for (const product of activeProducts) {
    const bondCount = product.count;
    const capital = bondCount * 100;
    const yearly = calculateProductYearly(product, bondCount, horizon, indicators);

    // Withdrawal calculations for this product
    const w = withdrawals && withdrawals[product.productId]
      && withdrawals[product.productId].year >= 1
      && withdrawals[product.productId].year <= horizon
      && withdrawals[product.productId].count > 0
      ? withdrawals[product.productId] : null;

    let withdrawnGross = 0;
    let withdrawnRedemptionFee = 0;
    let remainingBonds = bondCount;
    let scaleFactor = 1;

    if (w && w.count < bondCount) {
      const wCount = Math.min(w.count, bondCount - 1);
      remainingBonds = bondCount - wCount;
      scaleFactor = remainingBonds / bondCount;

      const valueAtW = yearly[w.year].value;
      let wValue = valueAtW * (wCount / bondCount);

      const matYears = product.maturityMonths ? product.maturityMonths / 12 : null;
      if (matYears && w.year < matYears && product.earlyRedemptionFee > 0) {
        withdrawnRedemptionFee = product.earlyRedemptionFee * wCount;
        wValue -= withdrawnRedemptionFee;
        if (product.nominalProtection) {
          wValue = Math.max(wValue, wCount * 100 - withdrawnRedemptionFee);
        }
      }
      withdrawnGross = wValue;
    }

    // --- NO_IKE variant ---
    const noIkeYearly = yearly.map(y => ({ ...y }));
    if (scaleFactor < 1 && w) {
      for (let y = w.year; y <= horizon; y++) {
        noIkeYearly[y] = { ...noIkeYearly[y], value: noIkeYearly[y].value * scaleFactor };
      }
    }

    let noIkeFinalRaw = noIkeYearly[horizon].value;
    const { finalValue: noIkeAfterRedemption, redemptionCost: noIkeRedemption } = applyEarlyRedemption(
      noIkeFinalRaw, product, remainingBonds, horizon, remainingBonds * 100
    );

    const noIkeTotalGross = noIkeAfterRedemption + withdrawnGross;
    const noIkeProfit = noIkeTotalGross - capital;
    const noIkeTax = Math.max(0, noIkeProfit) * 0.19;
    const noIkeAfterTax = noIkeTotalGross - noIkeTax;
    const noIkeReal = noIkeAfterTax / cumInflation[horizon];

    const noIkeYearlyFinal = noIkeYearly.map((y, i) => {
      let val = y.value;
      if (w && i >= w.year) val += withdrawnGross;
      return { ...y, value: val, realValue: val / cumInflation[i] };
    });

    variants.push({
      productId: product.productId,
      variantType: 'NO_IKE',
      label: PRODUCT_SHORT[product.productId],
      bondCount,
      yearlyValues: noIkeYearlyFinal,
      finalValueGross: noIkeTotalGross,
      finalValue: noIkeAfterTax,
      realValue: noIkeReal,
      tax: noIkeTax,
      redemptionCost: noIkeRedemption + withdrawnRedemptionFee,
      withdrawnRedemptionFee,
      withdrawnGross,
      ikeCost: 0,
      profit: noIkeAfterTax - capital,
      returnPct: ((noIkeAfterTax - capital) / capital) * 100,
    });

    // --- IKE_MET variant ---
    const ikeBaseYearly = yearly.map(y => ({ ...y }));
    if (scaleFactor < 1 && w) {
      for (let y = w.year; y <= horizon; y++) {
        ikeBaseYearly[y] = { ...ikeBaseYearly[y], value: ikeBaseYearly[y].value * scaleFactor };
      }
    }

    // IKE fees distributed proportionally based on total portfolio
    const totalBondsForIke = activeProducts.reduce((s, p) => {
      const pw = withdrawals && withdrawals[p.productId];
      if (pw && pw.count > 0) return s + Math.max(0, p.count - pw.count);
      return s + p.count;
    }, 0);

    const ikeYearly = applyIkeFeesToYearly(ikeBaseYearly, remainingBonds, totalBondsForIke, horizon, state.ikeAdditionalCosts || 0);
    let ikeFinalRaw = ikeYearly[horizon].value;
    const { finalValue: ikeAfterRedemption, redemptionCost: ikeRedemption } = applyEarlyRedemption(
      ikeFinalRaw, product, remainingBonds, horizon, remainingBonds * 100
    );

    const ikeTotalGross = ikeAfterRedemption + withdrawnGross;
    const productIkeCost = calculateIkeFees(totalBondsForIke, horizon, state.ikeAdditionalCosts || 0).total * (remainingBonds / Math.max(1, totalBondsForIke));

    const ikeYearlyFinal = ikeYearly.map((y, i) => {
      let val = y.value;
      if (w && i >= w.year) val += withdrawnGross;
      return { ...y, value: val, realValue: val / cumInflation[i] };
    });

    variants.push({
      productId: product.productId,
      variantType: 'IKE_MET',
      label: PRODUCT_SHORT[product.productId] + ' (IKE)',
      bondCount,
      yearlyValues: ikeYearlyFinal,
      finalValueGross: ikeTotalGross,
      finalValue: ikeTotalGross,
      realValue: ikeTotalGross / cumInflation[horizon],
      tax: 0,
      redemptionCost: ikeRedemption + withdrawnRedemptionFee,
      withdrawnRedemptionFee,
      withdrawnGross,
      ikeCost: productIkeCost,
      profit: ikeTotalGross - capital,
      returnPct: ((ikeTotalGross - capital) / capital) * 100,
    });
  }

  variants.sort((a, b) => b.finalValue - a.finalValue);

  // "Do nothing" line — purchasing power decline
  const doNothingLine = [{ year: 0, value: totalCapital }];
  for (let y = 1; y <= horizon; y++) {
    doNothingLine.push({ year: y, value: totalCapital / cumInflation[y] });
  }

  // Inflation accumulation line (how much you need to keep up)
  const inflationLine = [{ year: 0, value: totalCapital }];
  let cumI = 1;
  for (let y = 1; y <= horizon; y++) {
    cumI *= (1 + (indicators.inflation[y - 1] ?? 3.0) / 100);
    inflationLine.push({ year: y, value: totalCapital * cumI });
  }

  const insights = generateInsights(variants, state, totalCapital, cumInflation, indicators);

  const noIkeVariants = variants.filter(v => v.variantType === 'NO_IKE');
  const ikeVariants = variants.filter(v => v.variantType === 'IKE_MET');
  const bestNoIke = noIkeVariants[0];
  const bestIke = ikeVariants[0];
  const best = variants[0];

  const summary = {
    totalCapital,
    totalBonds,
    bestVariant: best,
    bestFinalValue: best ? best.finalValue : totalCapital,
    bestRealValue: best ? best.realValue : totalCapital,
    bestProfit: best ? best.profit : 0,
    bestTax: best ? best.tax : 0,
    ikeBenefit: (bestIke && bestNoIke) ? bestIke.finalValue - bestNoIke.finalValue : 0,
  };

  return { summary, variants, inflationLine, doNothingLine, cumInflation, indicators, insights, horizon };
}
