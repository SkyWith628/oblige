FROM php:8.2-apache

# PDO MySQL 확장 설치
RUN docker-php-ext-install pdo pdo_mysql

# Apache mod_rewrite 활성화
RUN a2enmod rewrite

# Apache 설정: api 폴더 .htaccess 허용
RUN echo '<Directory /var/www/html/api>\n\
    Options -Indexes\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>\n\
<Directory /var/www/html>\n\
    Options -Indexes\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/oblige.conf \
 && a2enconf oblige

# 소스 복사 (db.php 제외 - 환경변수로 대체)
COPY . /var/www/html/
RUN rm -f /var/www/html/api/config/db.php

# db.php는 환경변수를 읽도록 동적 생성
RUN echo '<?php\n\
define("DB_HOST", getenv("DB_HOST") ?: "localhost");\n\
define("DB_NAME", getenv("DB_NAME") ?: "oblige");\n\
define("DB_USER", getenv("DB_USER") ?: "root");\n\
define("DB_PASS", getenv("DB_PASS") ?: "");\n\
define("DB_CHAR", "utf8mb4");\n\
define("JWT_SECRET", getenv("JWT_SECRET") ?: "change_me");\n\
define("JWT_EXPIRE", 3600 * 24 * 7);\n\
function db(): PDO {\n\
    static $pdo = null;\n\
    if ($pdo === null) {\n\
        try {\n\
            $dsn = "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=".DB_CHAR;\n\
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [\n\
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,\n\
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,\n\
                PDO::ATTR_EMULATE_PREPARES => false,\n\
            ]);\n\
        } catch (PDOException $e) {\n\
            http_response_code(500);\n\
            header("Content-Type: application/json");\n\
            echo json_encode(["error" => "DB connection failed"]);\n\
            exit;\n\
        }\n\
    }\n\
    return $pdo;\n\
}' > /var/www/html/api/config/db.php

RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
