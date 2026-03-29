// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatPLN(n) {
  if (n == null || isNaN(n)) return '0 zł';
  const neg = n < 0;
  const abs = Math.abs(Math.round(n * 100) / 100);
  const parts = abs.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const dec = parts[1];
  const str = dec === '00' ? intPart : intPart + ',' + dec;
  return (neg ? '-' : '') + str + ' zł';
}

function formatPct(n, decimals = 2) {
  if (n == null || isNaN(n)) return '0%';
  return n.toFixed(decimals).replace('.', ',') + '%';
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function interpolateLinear(start, end, count) {
  if (count <= 1) return [start];
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(Math.round((start + (end - start) * i / (count - 1)) * 100) / 100);
  }
  return result;
}

function pluralYears(n) {
  if (n === 1) return '1 rok';
  if (n >= 2 && n <= 4) return n + ' lata';
  return n + ' lat';
}
