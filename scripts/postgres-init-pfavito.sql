-- Полный сброс пароля postgres + пересоздание роли/БД из .env на Windows:
--   см. scripts/reset-postgres-windows.ps1 (запуск от администратора).
--
-- Выполнить от суперпользователя PostgreSQL (обычно postgres) на Windows Server.
-- Пример (путь к psql зависит от версии, 16 — пример):
--   "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -f postgres-init-pfavito.sql
-- Или интерактивно: psql -U postgres, затем вставить команды ниже.
--
-- Значения должны совпадать с .env: DB_USERNAME, DB_PASSWORD, DB_DATABASE
-- Если роль или БД уже есть: см. комментарии в конце файла.

CREATE USER pfavito WITH PASSWORD 'pfavito_secret';

CREATE DATABASE pfavito OWNER pfavito;

GRANT ALL PRIVILEGES ON DATABASE pfavito TO pfavito;

-- Схема public (для TypeORM / миграций)
\c pfavito
GRANT ALL ON SCHEMA public TO pfavito;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pfavito;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pfavito;

-- --- Если пользователь уже существует, пароль не подходит: ---
-- ALTER USER pfavito WITH PASSWORD 'pfavito_secret';
-- --- Если база уже есть, но другой владелец: ---
-- ALTER DATABASE pfavito OWNER TO pfavito;
