// ============================================================
// SHARED STYLES
// ============================================================

const cardStyle = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '1.75rem 2rem',
};

const btnPrimaryStyle = {
  background: 'var(--accent)', color: '#fff', border: 'none',
  borderRadius: 'var(--radius-sm)', padding: '12px 28px', fontSize: '0.95rem',
  fontWeight: 500, cursor: 'pointer', minHeight: '44px', fontFamily: 'inherit',
  transition: 'opacity 0.2s ease',
};

const btnSecondaryStyle = {
  background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', padding: '12px 20px', cursor: 'pointer',
  fontFamily: 'inherit', transition: 'all 0.2s ease', fontSize: '0.95rem',
};

const btnCircleStyle = {
  width: '40px', height: '40px', borderRadius: '50%', border: '1.5px solid var(--border)',
  background: 'var(--surface)', cursor: 'pointer', fontSize: '1.25rem', display: 'flex',
  alignItems: 'center', justifyContent: 'center', color: 'var(--text)', fontFamily: 'inherit',
  transition: 'all 0.2s ease',
};

const inputBaseStyle = {
  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
  padding: '10px 14px', fontSize: '1rem', fontFamily: 'inherit',
  background: 'var(--surface)', outline: 'none', width: '100%',
  transition: 'border-color 0.2s ease',
};

const thStyle = { textAlign: 'left', padding: '8px 4px', borderBottom: '2px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-3)', fontWeight: 500 };
const tdStyle = { padding: '6px 4px', borderBottom: '1px solid var(--border)' };

// ============================================================
// TOOLTIP — popup chmurka (click to open/close)
// ============================================================

function TooltipInfo({ text, variant }) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef(null);
  const tipRef = React.useRef(null);
  const [tipStyle, setTipStyle] = React.useState(null);
  const isWarning = variant === 'warning';

  React.useEffect(() => {
    if (!open) return;
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const tipW = 280;
      let left = rect.left + rect.width / 2 - tipW / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - tipW - 8));
      const spaceAbove = rect.top;
      const showBelow = spaceAbove < 120;
      setTipStyle({
        position: 'fixed',
        left: left + 'px',
        width: tipW + 'px',
        ...(showBelow
          ? { top: (rect.bottom + 8) + 'px' }
          : { top: (rect.top - 8) + 'px', transform: 'translateY(-100%)' }),
        zIndex: 10000,
      });
    }
    const handleClickOutside = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target) &&
          tipRef.current && !tipRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const bgClosed = isWarning ? 'var(--warning-light)' : 'var(--surface-2)';
  const borderClosed = isWarning ? '1px solid var(--warning)' : '1px solid var(--border)';
  const colorClosed = isWarning ? 'var(--warning)' : 'var(--text-3)';

  return (
    <span style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle' }}>
      <button ref={btnRef} onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '16px', height: '16px', borderRadius: '50%',
          background: open ? (isWarning ? 'var(--warning)' : 'var(--accent)') : bgClosed,
          border: open ? (isWarning ? '1px solid var(--warning)' : '1px solid var(--accent)') : borderClosed,
          fontSize: '0.6rem', color: open ? '#fff' : colorClosed,
          cursor: 'pointer', marginLeft: '4px', fontWeight: 700,
          fontFamily: 'inherit', padding: 0, lineHeight: 1,
          transition: 'all 0.15s ease',
        }}>
        {isWarning ? '!' : '?'}
      </button>
      {open && tipStyle && (
        <div ref={tipRef} style={{
          ...tipStyle,
          background: isWarning ? 'var(--warning)' : 'var(--text)', color: '#fff',
          padding: '10px 14px', borderRadius: 'var(--radius-sm)',
          fontSize: '0.78rem', lineHeight: 1.55,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontWeight: 400,
          pointerEvents: 'auto', wordBreak: 'break-word', overflowWrap: 'break-word',
          whiteSpace: 'normal', boxSizing: 'border-box',
        }}>
          {text}
        </div>
      )}
    </span>
  );
}

// ============================================================
// PRIMITIVE COMPONENTS
// ============================================================

function NumericInput({ value, onChange, min = 1, max = 1000000, step = 1, label }) {
  const handleDec = () => onChange(Math.max(min, value - step));
  const handleInc = () => onChange(Math.min(max, value + step));
  const handleChange = (e) => {
    const v = parseInt(e.target.value);
    if (!isNaN(v)) onChange(clamp(v, min, max));
    else if (e.target.value === '') onChange(min);
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {label && <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginRight: '0.5rem' }}>{label}</span>}
      <button onClick={handleDec} style={btnCircleStyle} title="Zmniejsz">{'\u2212'}</button>
      <input type="number" value={value} onChange={handleChange} min={min} max={max} step={step}
        style={{ ...inputBaseStyle, width: '100px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 600 }} />
      <button onClick={handleInc} style={btnCircleStyle} title="Zwiększ">+</button>
    </div>
  );
}

function PercentageInput({ value, onChange, min = 0, max = 50, compact = false }) {
  const handleChange = (e) => {
    const raw = e.target.value.replace(',', '.');
    if (raw === '' || raw === '-') { onChange(0); return; }
    const v = parseFloat(raw);
    if (!isNaN(v)) onChange(clamp(v, min, max));
  };
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <input type="text" value={String(value).replace('.', ',')} onChange={handleChange}
        style={{ ...inputBaseStyle, width: compact ? '70px' : '90px', paddingRight: '24px',
          textAlign: 'right', fontSize: compact ? '0.85rem' : '1rem',
          padding: compact ? '6px 24px 6px 8px' : '10px 24px 10px 14px' }} />
      <span style={{ position: 'absolute', right: '10px', color: 'var(--text-3)', fontSize: compact ? '0.8rem' : '0.9rem', pointerEvents: 'none' }}>%</span>
    </div>
  );
}

function SegmentedControl({ options, value, onChange, helpTexts }) {
  const [hoveredHelp, setHoveredHelp] = React.useState(null);
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'inline-flex', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '3px', border: '1px solid var(--border)' }}>
        {options.map(opt => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            onMouseEnter={() => helpTexts && helpTexts[opt.value] && setHoveredHelp(opt.value)}
            onMouseLeave={() => setHoveredHelp(null)}
            style={{
              padding: '6px 14px', fontSize: '0.8rem', fontWeight: value === opt.value ? 600 : 400,
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit',
              background: value === opt.value ? 'var(--surface)' : 'transparent',
              color: value === opt.value ? 'var(--text)' : 'var(--text-3)',
              boxShadow: value === opt.value ? 'var(--shadow)' : 'none',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap',
            }}>
            {opt.label}
          </button>
        ))}
      </div>
      {hoveredHelp && helpTexts && helpTexts[hoveredHelp] && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '6px', zIndex: 50,
          background: 'var(--text)', color: '#fff', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
          fontSize: '0.78rem', lineHeight: 1.55, maxWidth: '320px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}>
          {helpTexts[hoveredHelp]}
          <div style={{
            position: 'absolute', bottom: '100%', left: '20px',
            width: 0, height: 0, borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent', borderBottom: '6px solid var(--text)',
          }} />
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', padding: '2px',
        background: checked ? 'var(--accent)' : 'var(--border)', cursor: 'pointer',
        position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
      }}>
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'transform 0.2s ease',
        transform: checked ? 'translateX(20px)' : 'translateX(0)',
      }} />
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.75rem', fontWeight: 500 }}>
      {children}
    </div>
  );
}

function Tag({ children, color }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem',
      background: color ? color + '18' : 'var(--surface-2)',
      color: color || 'var(--text-3)',
      border: '1px solid ' + (color ? color + '30' : 'var(--border)'),
    }}>
      {children}
    </span>
  );
}

function KPICard({ label, value, color, suffix, helpText }) {
  return (
    <div style={{ ...cardStyle, padding: '1rem 1.25rem', transition: 'box-shadow 0.2s ease' }}>
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '0.25rem' }}>
        {label}
        {helpText && <TooltipInfo text={helpText} />}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: color || 'var(--text)' }}>{value}</div>
      {suffix && <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{suffix}</div>}
    </div>
  );
}

// ============================================================
// STEPPER
// ============================================================

function Stepper({ step, maxReached, onStepClick }) {
  return (
    <div className="stepper-wrap" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', justifyContent: 'center' }}>
        {STEP_LABELS.map((label, i) => {
          const isActive = i === step;
          const isDone = i < step && i <= maxReached;
          const isClickable = i <= maxReached;
          return (
            <React.Fragment key={i}>
              {i > 0 && <div style={{ width: '32px', height: '2px', background: isDone || isActive ? 'var(--accent)' : 'var(--border)', flexShrink: 0 }} />}
              <button onClick={() => isClickable && onStepClick(i)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  background: 'none', border: 'none', cursor: isClickable ? 'pointer' : 'default',
                  padding: '4px 8px', fontFamily: 'inherit', opacity: isClickable ? 1 : 0.5,
                }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600,
                  background: isActive ? 'var(--accent)' : isDone ? 'var(--success)' : 'var(--surface-2)',
                  color: isActive || isDone ? '#fff' : 'var(--text-3)',
                  border: isActive ? 'none' : isDone ? 'none' : '1.5px solid var(--border)',
                  transition: 'all 0.2s ease',
                }}>
                  {isDone && !isActive ? '\u2713' : i + 1}
                </div>
                <span style={{
                  fontSize: '0.7rem', color: isActive ? 'var(--accent)' : isDone ? 'var(--success)' : 'var(--text-3)',
                  fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap',
                }}>{label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0.75rem 0' }}>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.25rem', color: 'var(--text)' }}>
        Obligacje PL
      </div>
    </div>
  );
}
