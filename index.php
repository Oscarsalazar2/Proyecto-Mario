<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mapeo Solar — HTML</title>

  <link rel="stylesheet" href="styles.css">
</head>
<body>
<header>
  <div class="container">
    <div class="row" style="padding:12px 0">
      <h1>Mapeo Solar</h1>
      <button id="liveBtn" class="btn">En vivo</button>
    </div>
    <div class="tabs">
      <button class="btn active" data-tab="weather">Clima</button>
      <button class="btn" data-tab="sensors">Sensores</button>
      <button class="btn" data-tab="reports">Reportes</button>
    </div>
  </div>
</header>

<main class="container">
  <section id="panel" class="grid"></section>
  <aside class="grid" id="aside">
    <div class="grid" style="grid-template-columns:1fr 1fr; gap:12px">
      <div class="kpi">
        <div class="label">Promedio</div>
        <div id="kAvg" class="value">--</div>
        <div id="kAvgSub" class="muted"></div>
      </div>
      <div class="kpi">
        <div class="label">Máximo</div>
        <div id="kMax" class="value">--</div>
        <div id="kMaxSub" class="muted"></div>
      </div>
      <div class="kpi">
        <div class="label">Mínimo</div>
        <div id="kMin" class="value">--</div>
        <div id="kMinSub" class="muted"></div>
      </div>
      <div class="kpi">
        <div class="label">Bajo objetivo</div>
        <div id="kBelow" class="value">--</div>
        <div class="muted">de celdas</div>
      </div>
    </div>
    <div class="card">
      <h3 style="margin:0 0 8px;font-size:14px">Estado del sistema</h3>
      <ul class="muted" style="margin:0; padding-left:16px">
        <li>Simulación: <span id="simStatus">En vivo</span></li>
        <li>Grid: <span id="gridSize">--</span> sensores</li>
        <li>Última actualización: <span id="lastTs">--:--:--</span></li>
      </ul>
    </div>
    <div class="card">
      <h3 style="margin:0 0 8px;font-size:14px">Alertas rápidas (demo)</h3>
      <p class="muted">Se activa si alguna celda cae &lt; 50% del objetivo.</p>
      <ul id="alerts" style="list-style:none;margin:8px 0 0;padding:0"></ul>
    </div>
    <div class="card hidden" id="miniHeatCard">
      <h3 style="margin:0 0 8px;font-size:14px">Mini heatmap (sensores)</h3>
      <div id="miniHeat" class="heatmap"></div>
    </div>
  </aside>
</main>

<div id="modal" class="modal-backdrop">
  <div class="modal">
    <div class="modal-head">
      <div style="font-size:14px;font-weight:600">Reporte detallado</div>
      <button id="modalClose" class="btn">Cerrar</button>
    </div>
    <div class="card" style="border:none;border-radius:0">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
        <div class="kpi">
          <div class="label">Promedio</div>
          <div id="mAvg" class="value">--</div>
        </div>
        <div class="kpi">
          <div class="label">Máximo</div>
          <div id="mMax" class="value">--</div>
        </div>
        <div class="kpi">
          <div class="label">Mínimo</div>
          <div id="mMin" class="value">--</div>
        </div>
      </div>
      <div style="overflow:auto;margin-top:12px">
        <table class="table">
          <thead>
            <tr>
              <th>Periodo</th>
              <th>Lux promedio</th>
              <th>Lux máx</th>
              <th>Lux mín</th>
            </tr>
          </thead>
          <tbody id="mRows"></tbody>
        </table>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button id="csvBtn" class="btn">Descargar CSV</button>
        <button id="modalClose2" class="btn">Cerrar</button>
      </div>
    </div>
  </div>
</div>

<footer class="container">
  Mapeo Solar
</footer>

<script src="app.js"></script>
</body>
</html>
