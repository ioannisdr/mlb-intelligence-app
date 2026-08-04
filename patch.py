import re
with open('index.html', 'r', encoding='utf-8') as f:
    t = f.read()

# Emoji fixes
t = t.replace('?? PRIME', '?? PRIME')
t = t.replace('? EDGE', '? EDGE')
t = t.replace('? SKIP', '? SKIP')
t = t.replace('?? Light', '?? Light')
t = t.replace('?? Dark', '?? Dark')
t = t.replace('?? Calculator', '?? Calculator')
t = t.replace('?? Profitability Guide', '?? Profitability Guide')
t = t.replace('?? Contact', '?? Contact')
t = t.replace('?? <strong>Disclaimer', '?? <strong>Disclaimer')
t = t.replace('? not guaranteed', '— not guaranteed')
t = t.replace('\uFFFD', '·')
t = t.replace('? PRIME', '?? PRIME')
t = t.replace('? EDGE', '? EDGE')
t = t.replace('? SKIP', '? SKIP')
t = t.replace('? Dark', '?? Dark')

# Fix emojis inside getSignal
get_sig_old = '''  const PRIME = { l: 'PRIME', c: 'sig-prime', v: 3, icon: '??' };
  const EDGE  = { l: 'EDGE',  c: 'sig-edge',  v: 2, icon: '?' };
  const SKIP  = { l: 'SKIP',  c: 'sig-skip',  v: 1, icon: '?' };'''
get_sig_new = '''  const PRIME = { l: 'PRIME', c: 'sig-prime', v: 3, icon: '??' };
  const EDGE  = { l: 'EDGE',  c: 'sig-edge',  v: 2, icon: '?' };
  const SKIP  = { l: 'SKIP',  c: 'sig-skip',  v: 1, icon: '?' };'''
t = t.replace(get_sig_old, get_sig_new)

# Add ev === -99 rule in getSignal
sig_sig = 'function getSignal(market, { ev = 0, mlPickProb = 0.5, isMinus15 = true, ouAbsDiff = 0 } = {}) {'
t = t.replace(sig_sig, sig_sig + '\\n  if (ev === -99) return { l: \\'SKIP\\', c: \\'sig-skip\\', v: 1, icon: \\'?\\' };')

# Apply Zero Mock Odds fallback
calc_old = 'let mkt = overrideMkt || (ODDS[g.home] && ODDS[g.home][currentBook]) || { ml: { a: +110, h: -120 }, rl: { a: \\'+1.5\\', h: \\'-1.5\\' }, ou: 8.5 };'
calc_new = 'let mkt = overrideMkt || (ODDS[g.home] && ODDS[g.home][currentBook]) || { ml: { a: -10000, h: -10000 }, rl: { a: \\'-10000\\', h: \\'-10000\\' }, ou: 0 };'
t = t.replace(calc_old, calc_new)

# Apply ouAbsDiff fix for mock OU odds
ou_old = 'let ouAbsDiff = Math.abs(mod.projOU - mkt.ou);'
ou_new = 'let ouAbsDiff = mkt.ou === 0 ? 0 : Math.abs(mod.projOU - mkt.ou);'
t = t.replace(ou_old, ou_new)
ou_ev_old = 'let ouEV = Math.min(0.14, Math.max(0, (ouAbsDiff / 0.5) * 0.05 - 0.02));'
ou_ev_new = 'let ouEV = mkt.ou === 0 ? -99 : Math.min(0.14, Math.max(0, (ouAbsDiff / 0.5) * 0.05 - 0.02));'
t = t.replace(ou_ev_old, ou_ev_new)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(t)

