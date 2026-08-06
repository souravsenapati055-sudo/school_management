-- Execute this script in MySQL Workbench to configure root & school_db

ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Sourav@9002249524';
ALTER USER 'root'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY 'Sourav@9002249524';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'Sourav@9002249524';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;

CREATE DATABASE IF NOT EXISTS school_db;
USE school_db;
