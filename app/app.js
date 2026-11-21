import { load, save, exportFile, parseImport } from './store.js';
const doc = await (await fetch('data/trophies.json')).json();
const T = doc.trophies;
const state = load();
// Deep links: ?kind=missable&spoil=1&open=1&done=1,2,3 (open = expand all guides; done = preview ticks without saving).
const q = new URLSearchParams(location.search);
let kind = q.get('kind') ?? 'all';
if (q.has('spoil')) state.spoil = true;
if (q.get('done')) state.earned = new Set(q.get('done').split(',').map(Number));
const $ = (id) => document.getElementById(id);
const KINDS = [['all', 'All'], ['story', 'Story'], ['missable', 'Missable'], ['collectibles', 'Collectibles'], ['activities', 'Activities'], ['other', 'Crime & other'], ['online', 'Online (none)']];
const match = (t) => kind === 'all' || (kind === 'missable' ? t.missable : t.kind === kind);

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

function renderKinds() {
  $('kinds').replaceChildren(...KINDS.map(([k, label]) => {
    const n = k === 'online' ? 0 : T.filter((t) => k === 'all' || (k === 'missable' ? t.missable : t.kind === k)).length;
    const b = el('button', 'chip' + (k === kind ? ' on' : ''), `${label} ${n}`);
    b.type = 'button';
    b.onclick = () => { kind = k; render(); };
    return b;
  }));
}

function renderRoadmap() {
  $('stages').replaceChildren(...doc.roadmap.map((s) => {
    const ts = T.filter((t) => t.roadmapStage === s.n);
    const li = el('li');
    const done = ts.filter((t) => state.earned.has(t.id)).length;
    li.append(el('b', '', `${s.n}. ${s.title} (${done}/${ts.length})`), el('span', '', s.note));
    const m = ts.filter((t) => t.missable).map((t) => t.name);
    if (m.length) li.append(el('span', 'miss', `Missable: ${m.join(', ')}`));
    return li;
  }));
}

function row(t) {
  const hide = state.spoil && t.kind === 'story' && !state.earned.has(t.id);
  const li = el('li', `t ${t.grade}` + (state.earned.has(t.id) ? ' done' : ''));
  const top = el('div', 'top');
  const box = el('input'); box.type = 'checkbox'; box.checked = state.earned.has(t.id);
  box.setAttribute('aria-label', `Earned: ${hide ? 'hidden story trophy' : t.name}`);
  box.onchange = () => { box.checked ? state.earned.add(t.id) : state.earned.delete(t.id); save(state); render(); };
  const info = el('div');
  const name = el('div', 'name', hide ? `Story trophy #${t.id} (hidden)` : t.name);
  name.append(el('span', 'tag g', t.grade), el('span', 'tag', t.kind === 'other' ? 'crime/other' : t.kind), el('span', 'tag', `stage ${t.roadmapStage}`));
  if (t.missable) name.append(el('span', 'tag m', 'MISSABLE'));
  info.append(name, el('div', 'desc', hide ? 'Hidden by the spoiler setting. Tick it when earned to reveal.' : t.description));
  top.append(box, info);
  li.append(top);
  if (!hide) {
    const d = el('details'); d.open = q.has('open'); d.append(el('summary', '', 'Guide and sources'), el('p', '', t.guide));
    const ol = el('ol'); t.steps.forEach((s) => ol.append(el('li', '', s))); d.append(ol);
    const src = el('p', 'src', 'Sources: ');
    t.sources.forEach((s, i) => { if (i) src.append('; '); const a = el('a', '', s.name); a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; src.append(a); });
    d.append(src); li.append(d);
  }
  return li;
}

function render() {
  const g = $('grade').value, hd = $('hideDone').checked;
  const shown = T.filter((t) => match(t) && (g === 'all' || t.grade === g) && !(hd && state.earned.has(t.id)));
  $('rows').replaceChildren(...shown.map(row));
  if (kind === 'online') $('rows').replaceChildren(el('li', 't', doc.onlineNote));
  $('count').textContent = `(${shown.length} shown)`;
  const n = state.earned.size;
  $('progress').textContent = `${n} of ${T.length} earned (${Math.round(100 * n / T.length)}%)`;
  $('barfill').style.width = `${100 * n / T.length}%`;
  $('spoil').checked = state.spoil;
  renderKinds(); renderRoadmap();
}

$('spoil').onchange = (e) => { state.spoil = e.target.checked; save(state); render(); };
$('grade').onchange = $('hideDone').onchange = render;
$('export').onclick = () => exportFile(state);
$('import').onchange = async (e) => {
  try {
    const f = e.target.files[0]; if (!f) return;
    const s = parseImport(await f.text());
    state.earned = s.earned; state.spoil = s.spoil; save(state); render();
  } catch (err) { alert('Import failed: ' + err.message); }
};
render();
