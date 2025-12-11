<?php
session_start();
if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit;
}

$error = isset($_GET['error']) ? $_GET['error'] : null;
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Login — Mapeo Solar</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="login-page">
  <div class="login-card">
    <div class="login-header">
      <div>
        <div class="login-title">Mapeo Solar</div>
        <div class="login-subtitle">Panel de monitoreo</div>
      </div>
    </div>

    <?php if($error): ?>
      <div class="login-error">
        <?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?>
      </div>
    <?php endif; ?>

    <form action="procesar_login.php" method="post">
      <div class="login-form-group">
        <label class="login-label" for="email">Correo electronico</label>
        <input class="login-input" type="email" name="email" id="email"
               placeholder="ingrese el correo" required>
      </div>

      <div class="login-form-group">
        <label class="login-label" for="password">Contraseña</label>
        <input class="login-input" type="password" name="password" id="password"
               placeholder="••••••" required>
      </div>

      <div class="login-row">
        <label class="login-remember">
          <input type="checkbox" name="remember">
          <span>Recordar en este equipo</span>
        </label>
        <span>Mario Alberto Flores Montellano</span>
      </div>

      <button type="submit" class="login-submit">Ingresar al panel</button>
    </form>

  </div>
</div>
</body>
</html>
