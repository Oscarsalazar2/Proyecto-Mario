CREATE DATABASE mapeo_solar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mapeo_solar;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);
