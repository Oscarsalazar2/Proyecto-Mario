<?php
require 'config.php';

$nombre = 'Oscar';
$email = 'admin@mapeo.test';
$passwordPlano = '123456';

$hash = password_hash($passwordPlano, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("INSERT INTO usuarios (nombre, email, password_hash) VALUES (:n, :e, :p)");
$stmt->execute([
    ':n' => $nombre,
    ':e' => $email,
    ':p' => $hash
]);

echo "Usuario creado. Email: $email — Password: $passwordPlano";
