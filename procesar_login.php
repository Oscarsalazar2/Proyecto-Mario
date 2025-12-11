<?php
session_start();
require 'config.php';

$email    = $_POST['email']    ?? '';
$password = $_POST['password'] ?? '';

$email = trim($email);
$password = trim($password);

if ($email === '' || $password === '') {
    header('Location: login.php?error=' . urlencode('Por favor completa todos los campos.'));
    exit;
}

$stmt = $pdo->prepare("SELECT id, nombre, email, password_hash FROM usuarios WHERE email = :email LIMIT 1");
$stmt->execute([':email' => $email]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password_hash'])) {
    $_SESSION['user_id']   = $user['id'];
    $_SESSION['user_name'] = $user['nombre'];
    $_SESSION['user_email']= $user['email'];

    header('Location: dashboard.php');
    exit;
} else {
    header('Location: login.php?error=' . urlencode('Credenciales incorrectas.'));
    exit;
}
