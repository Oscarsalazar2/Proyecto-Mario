const TARGET_LUX = 20000, ROWS = 3, COLS = 3, UPDATE_MS = 1000;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const formatLux = (x) => x >= 1000 ? (x / 1000).toFixed(1) + 'k lx' : Math.round(x) + ' lx';
const pctTarget = (x) => ((x / TARGET_LUX) * 100).toFixed(0) + '% del objetivo';
const heatColor = (ratio) => {
  const v = clamp(ratio, 0, 2);
  if (v <= 0.5) {
    const t = v / 0.5;
    return 'rgb(255,' + Math.round(255 * t) + ',0)';
  }
  const t = (v - 0.5) / 1.5;
  return 'rgb(' + Math.round(255 * (1 - t)) + ',' + Math.round(255 - (85 * t)) + ',0)';
};

let isLive = true, timer = null, grid = createGrid(), currentTab = 'weather', history = generateHistory(45), reportRange = 'day';
initTabs();
renderAside();
renderPanel();
startTimer();

function initTabs() {
  document.querySelectorAll('.tabs .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tabs .btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      document.getElementById('miniHeatCard')
        .classList.toggle('hidden', currentTab !== 'weather');
      renderPanel();
    });
  });

  document.getElementById('liveBtn').addEventListener('click', () => {
    isLive = !isLive;
    document.getElementById('simStatus').textContent = isLive ? 'En vivo' : 'Pausado';
    document.getElementById('liveBtn').textContent = isLive ? 'En vivo' : 'Pausado';
    if (isLive) startTimer(); else stopTimer();
  });
}

function createGrid() {
  const g = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      row.push({
        id: String.fromCharCode(65 + r) + (c + 1),
        lux: randomLux(),
        ts: new Date()
      });
    }
    g.push(row);
  }
  return g;
}

function randomLux() {
  const base = 12000 + Math.random() * 16000;
  const pulse = 2000 * Math.sin(Date.now() / 3000);
  const noise = (Math.random() - 0.5) * 1500;
  return clamp(base + pulse + noise, 100, 45000);
}

function tick() {
  grid = grid.map(row => row.map(cell => ({
    ...cell,
    lux: randomLux(),
    ts: new Date()
  })));
  renderAside();
  if (currentTab === 'sensors') renderSensors();
  if (currentTab === 'weather') renderMiniHeat();
}

function startTimer() {
  stopTimer();
  timer = setInterval(tick, UPDATE_MS);
}

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

function renderAside() {
  const flat = grid.flat(),
        vals = flat.map(x => x.lux),
        avg = vals.reduce((a, b) => a + b, 0) / vals.length,
        min = Math.min(...vals),
        max = Math.max(...vals),
        belowPct = vals.filter(v => v < TARGET_LUX).length / vals.length * 100;

  document.getElementById('kAvg').textContent = formatLux(avg);
  document.getElementById('kAvgSub').textContent = pctTarget(avg);
  document.getElementById('kMax').textContent = formatLux(max);
  document.getElementById('kMaxSub').textContent = pctTarget(max);
  document.getElementById('kMin').textContent = formatLux(min);
  document.getElementById('kMinSub').textContent = pctTarget(min);
  document.getElementById('kBelow').textContent = Math.round(belowPct) + '%';
  document.getElementById('gridSize').textContent = (ROWS * COLS);
  document.getElementById('lastTs').textContent = new Date().toLocaleTimeString();

  const alerts = document.getElementById('alerts');
  alerts.innerHTML = '';
  const issues = flat.filter(c => c.lux < TARGET_LUX * 0.5);

  if (issues.length === 0) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'Sin alertas';
    alerts.appendChild(li);
  } else {
    issues.slice(0, 5).forEach(cell => {
      const li = document.createElement('li');
      li.style.cssText = 'background:rgba(190,18,60,.2);border:1px solid rgba(190,18,60,.35);border-radius:12px;padding:10px 12px;font-size:12px';
      li.textContent = `${cell.id} bajo (${formatLux(cell.lux)}) — ${Math.round((cell.lux / TARGET_LUX) * 100)}% del objetivo`;
      alerts.appendChild(li);
    });
    if (issues.length > 5) {
      const li = document.createElement('li');
      li.className = 'muted';
      li.textContent = '+' + (issues.length - 5) + ' más…';
      alerts.appendChild(li);
    }
  }
}

function renderPanel() {
  const panel = document.getElementById('panel');
  panel.innerHTML = '';

  if (currentTab === 'weather') {
    renderWeather(panel);
    renderMiniHeat();
  } else if (currentTab === 'sensors') {
    renderSensors(panel);
  } else {
    renderReports(panel);
  }
}

// --- Clima (Open-Meteo) Matamoros ---
async function fetchWeather(lat = 25.869, lon = -97.504) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,is_day&daily=sunrise,sunset,uv_index_max,precipitation_sum&timezone=America%2FMatamoros`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('No se pudo obtener el clima');
  return res.json();
}

function renderWeather(panel) {
  const wrap = document.createElement('div');
  wrap.className = 'grid';
  wrap.style.gap = '16px';
  wrap.innerHTML = `
    <div class="row" style="justify-content:space-between">
      <h2 style="margin:0;font-size:18px">Clima de hoy</h2>
      <div class="row" style="gap:8px">
        <input id="lat" class="input" placeholder="lat" value="25.869" style="width:90px" />
        <input id="lon" class="input" placeholder="lon" value="-97.504" style="width:90px" />
        <button id="wBtn" class="btn">Actualizar</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card">
        <div class="muted">Ahora — <span id="nowTime"></span></div>
        <div id="wLoading" class="muted" style="margin-top:8px; display:none">Cargando…</div>
        <div id="wError" class="muted" style="margin-top:8px; display:none; color:#fda4af">Error</div>
        <div id="wNow" style="margin-top:8px"></div>
      </div>
      <div class="card">
        <div style="font-weight:600; margin-bottom:8px">Hoy</div>
        <ul id="wDay" class="muted" style="list-style:none;padding-left:16px; margin:0"></ul>
      </div>
    </div>
    <div class="card">
      <div style="font-weight:600; margin-bottom:8px">Resumen intradía</div>
      <div id="wHourly" class="row" style="gap:8px; flex-wrap:wrap"></div>
    </div>`;

  panel.appendChild(wrap);

  document.getElementById('nowTime').textContent = new Date().toLocaleTimeString();
  const btn = document.getElementById('wBtn'),
    latI = document.getElementById('lat'),
    lonI = document.getElementById('lon'),
    load = document.getElementById('wLoading'),
    err = document.getElementById('wError'),
    nowDiv = document.getElementById('wNow'),
    dayUl = document.getElementById('wDay'),
    hourly = document.getElementById('wHourly');

  async function loadWeather() {
    try {
      load.style.display = 'block';
      err.style.display = 'none';
      nowDiv.innerHTML = '';
      dayUl.innerHTML = '';
      hourly.innerHTML = '';

      const data = await fetchWeather(
        parseFloat(latI.value) || 25.869,
        parseFloat(lonI.value) || -97.504
      );

      const cur = data.current, d = data.daily;

      if (cur) {
        nowDiv.innerHTML = `
          <div style="font-size:36px;font-weight:700">${Math.round(cur.temperature_2m)}°C</div>
          <div class="muted">Sensación: ${Math.round(cur.apparent_temperature)}°C · Viento: ${Math.round(cur.wind_speed_10m)} km/h</div>
          <div class="muted">Humedad: ${Math.round(cur.relative_humidity_2m)}%</div>`;
      }

      if (d) {
        dayUl.innerHTML =
          '<li>Salida del sol: ' + new Date(d.sunrise[0]).toLocaleTimeString() + '</li>' +
          '<li>Puesta del sol: ' + new Date(d.sunset[0]).toLocaleTimeString() + '</li>' +
          '<li>UV máx: ' + d.uv_index_max[0] + '</li>' +
          '<li>Precipitación (mm): ' + d.precipitation_sum[0] + '</li>';
      }

      if (data.hourly) {
        const now = Date.now();
        const items = data.hourly.time.map((t, i) => ({
          t: new Date(t),
          temp: data.hourly.temperature_2m[i],
          hum: data.hourly.relative_humidity_2m[i],
          wind: data.hourly.wind_speed_10m[i],
          precip: data.hourly.precipitation[i],
          cloud: data.hourly.cloud_cover[i]
        }))
          .filter(x => x.t.getTime() >= now)
          .slice(0, 6);

        items.forEach(x => {
          const card = document.createElement('div');
          card.className = 'card';
          card.style.padding = '8px';
          card.style.minWidth = '140px';
          card.innerHTML =
            '<div style="font-weight:600">' +
            x.t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</div>' +
            '<div class="muted">Temp: ' + Math.round(x.temp) + '°C</div>' +
            '<div class="muted">Hum: ' + Math.round(x.hum) + '%</div>' +
            '<div class="muted">Viento: ' + Math.round(x.wind) + ' km/h</div>' +
            '<div class="muted">Lluvia: ' + x.precip + ' mm</div>' +
            '<div class="muted">Nubes: ' + x.cloud + '%</div>';
          hourly.appendChild(card);
        });
      }
    } catch (e) {
      err.style.display = 'block';
      err.textContent = e.message || 'Error de red';
    } finally {
      load.style.display = 'none';
    }
  }

  btn.addEventListener('click', loadWeather);
  loadWeather();
}

function renderMiniHeat() {
  const mini = document.getElementById('miniHeat');
  mini.innerHTML = '';
  mini.className = 'heatmap';
  mini.style.gridTemplateColumns = `repeat(${COLS},1fr)`;

  grid.forEach(row => row.forEach(cell => {
    const ratio = cell.lux / TARGET_LUX,
      bg = heatColor(ratio);
    const d = document.createElement('div');
    d.className = 'cell';
    d.style.borderRadius = '10px';
    d.style.background = bg;
    d.innerHTML =
      '<div class="id" style="font-size:10px">' + cell.id + '</div>' +
      '<div class="val" style="font-size:11px">' + Math.round(cell.lux) + '</div>';
    mini.appendChild(d);
  }));
}

function renderSensors(panel) {
  panel = panel || document.getElementById('panel');
  panel.innerHTML =
    '<div class="row" style="justify-content:space-between">' +
    '<h2 style="margin:0;font-size:18px">Heatmap de iluminación</h2>' +
    '<span class="muted">Objetivo: <b style="color:#e5e7eb">' + formatLux(TARGET_LUX) + '</b></span>' +
    '</div>' +
    '<div id="heat" class="heatmap"></div>' +
    '<div class="legend">' +
    '<span class="dot" style="background:' + heatColor(.2) + '"></span> Bajo ' +
    '<span class="dot" style="background:' + heatColor(.6) + '"></span> Medio ' +
    '<span class="dot" style="background:' + heatColor(1.1) + '"></span> Óptimo' +
    '</div>';

  const heat = document.getElementById('heat');
  heat.style.gridTemplateColumns = `repeat(${COLS},1fr)`;

  grid.forEach(row => row.forEach(cell => {
    const ratio = cell.lux / TARGET_LUX,
      bg = heatColor(ratio),
      strong = ratio >= 1;
    const el = document.createElement('div');
    el.className = 'cell';
    el.style.background = bg;
    el.title =
      cell.id + ' — ' + formatLux(cell.lux) + ' (' + Math.round(ratio * 100) +
      '% del objetivo)\n' + cell.ts.toLocaleTimeString();
    el.innerHTML =
      '<div class="id">' + cell.id + '</div>' +
      '<div class="pct" style="color:' + (strong ? '#bbf7d0' : '#ffe4e6') +
      '">' + Math.round(ratio * 100) + '% del objetivo</div>' +
      '<div class="val">' + formatLux(cell.lux) + '</div>';
    heat.appendChild(el);
  }));
}

// -------- Reportes --------
function renderReports(panel) {
  panel = panel || document.getElementById('panel');
  const wrap = document.createElement('div');
  wrap.className = 'grid';
  wrap.style.gap = '16px';
  wrap.innerHTML =
    '<div class="row" style="justify-content:space-between">' +
    '<h2 style="margin:0;font-size:18px">Reportes</h2>' +
    '<div class="row" style="gap:8px">' +
    '<button class="pill" data-range="day">Día</button>' +
    '<button class="pill" data-range="week">Semana</button>' +
    '<button class="pill" data-range="month">Mes</button>' +
    '<button id="openReport" class="btn">Ver reporte</button>' +
    '</div></div>' +
    '<div class="card">' +
    '<div class="muted" style="margin-bottom:8px">Vista rápida</div>' +
    '<div id="kpis" class="row" style="gap:12px; flex-wrap:wrap"></div>' +
    '<div id="bars" class="barrow" style="margin-top:12px"></div>' +
    '<div style="margin-top:12px"><button id="csvQuick" class="btn">Descargar CSV</button></div>' +
    '</div>';

  panel.innerHTML = '';
  panel.appendChild(wrap);

  wrap.querySelectorAll('[data-range]').forEach(b =>
    b.addEventListener('click', () => {
      reportRange = b.dataset.range;
      updateReportQuick();
    })
  );

  document.getElementById('openReport').addEventListener('click', openModal);
  document.getElementById('csvQuick').addEventListener(
    'click',
    () => downloadCSV(aggregateHistory(history, reportRange), 'reporte_' + reportRange + '.csv')
  );

  updateReportQuick();
}

function generateHistory(days = 30) {
  const out = [], now = Date.now();
  for (let d = days - 1; d >= 0; d--) {
    const dayTs = new Date(now - d * 86400000);
    const base = 16000 + 6000 * Math.sin((Math.PI * 2 * (days - d)) / days);
    const noise = (Math.random() - 0.5) * 3000;
    out.push({
      ts: new Date(dayTs.getFullYear(), dayTs.getMonth(), dayTs.getDate()),
      avgLux: clamp(base + noise, 3000, 42000)
    });
  }
  return out;
}

function aggregateHistory(history, range) {
  const byKey = new Map();
  const fmt = (d) => {
    const dt = new Date(d);
    if (range === 'day') return dt.toISOString().slice(0, 10);
    if (range === 'week') {
      const t = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
      const dayNum = (t.getUTCDay() || 7);
      t.setUTCDate(t.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
      const wk = Math.ceil((((t - yearStart) / 86400000) + 1) / 7);
      return t.getUTCFullYear() + '-W' + String(wk).padStart(2, '0');
    }
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
  };

  for (const item of history) {
    const k = fmt(item.ts);
    if (!byKey.has(k)) byKey.set(k, { key: k, sum: 0, n: 0, max: 0, min: Infinity });
    const acc = byKey.get(k);
    acc.sum += item.avgLux;
    acc.n++;
    acc.max = Math.max(acc.max, item.avgLux);
    acc.min = Math.min(acc.min, item.avgLux);
  }

  return Array.from(byKey.values())
    .map(x => ({ key: x.key, avg: x.sum / x.n, max: x.max, min: x.min }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function updateReportQuick() {
  const rows = aggregateHistory(history, reportRange),
        kpis = document.getElementById('kpis');
  kpis.innerHTML = '';

  const avg = rows.reduce((a, b) => a + b.avg, 0) / rows.length;
  addKPI(kpis, 'Promedio', formatLux(avg));
  addKPI(kpis, 'Máximo periodo', formatLux(Math.max(...rows.map(r => r.max), 0)));
  addKPI(kpis, 'Mínimo periodo', formatLux(Math.min(...rows.map(r => r.min), Infinity)));
  addKPI(kpis, 'Periodos', rows.length);

  const bars = document.getElementById('bars');
  bars.innerHTML = '';
  rows.forEach(r => {
    const h = Math.max(4, Math.round((r.avg / 40000) * 100));
    const div = document.createElement('div');
    div.className = 'bar';
    div.style.height = h + '%';
    div.title = r.key + ' — ' + Math.round(r.avg) + ' lx';
    bars.appendChild(div);
  });
}

function addKPI(parent, label, value) {
  const d = document.createElement('div');
  d.className = 'kpi';
  d.innerHTML =
    '<div class="label">' + label + '</div>' +
    '<div class="value">' + value + '</div>';
  parent.appendChild(d);
}

function downloadCSV(rows, filename) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(','),
    ...rows.map(r => header.map(h => r[h]).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ----- Modal -----
function openModal() {
  const rows = aggregateHistory(history, reportRange);
  document.getElementById('mAvg').textContent =
    formatLux(rows.reduce((a, b) => a + b.avg, 0) / rows.length);
  document.getElementById('mMax').textContent =
    formatLux(Math.max(...rows.map(r => r.max), 0));
  document.getElementById('mMin').textContent =
    formatLux(Math.min(...rows.map(r => r.min), Infinity));

  const tbody = document.getElementById('mRows');
  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + r.key + '</td>' +
      '<td>' + Math.round(r.avg) + '</td>' +
      '<td>' + Math.round(r.max) + '</td>' +
      '<td>' + Math.round(r.min) + '</td>';
    tbody.appendChild(tr);
  });

  document.getElementById('csvBtn').onclick =
    () => downloadCSV(rows, 'reporte_detallado_' + reportRange + '.csv');

  document.getElementById('modal').style.display = 'flex';
}

document.getElementById('modalClose').onclick =
  () => document.getElementById('modal').style.display = 'none';
document.getElementById('modalClose2').onclick =
  () => document.getElementById('modal').style.display = 'none';
