export const inr = (n, dp = 2) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp });

export const inr0 = (n) => inr(n, 0);

export const time = (ms) =>
  new Date(ms).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

export const date = (ms) =>
  new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const dateTime = (ms) => `${date(ms)}, ${time(ms)}`;

export const tallyDate = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

export const mins = (ms) => {
  if (ms == null || !isFinite(ms)) return '—';
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

// "₹1,876.20 less" style amounts keep the sign before the rupee symbol: −₹1,876.20
export const inrSigned = (n, dp = 2) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${inr(Math.abs(n), dp)}`;

// Day-aware clock time: "today 17:00", "tomorrow 11:00", "yesterday 10:31", else "10 Nov 17:00"
export const when = (ms, now = Date.now()) => {
  const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
  const days = Math.floor((ms - d0.getTime()) / 86400000);
  const label = days === 0 ? 'today' : days === 1 ? 'tomorrow' : days === -1 ? 'yesterday' : new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  return `${label} ${time(ms)}`;
};

// "3h 20m", "45m"
export const duration = (ms) => {
  const m = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
};
