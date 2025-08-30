<?php
// Base paths
define('BASE_PATH', __DIR__ . DIRECTORY_SEPARATOR);
define('MODELS_PATH', BASE_PATH . 'models' . DIRECTORY_SEPARATOR);
define('VIEWS_PATH', BASE_PATH . 'views' . DIRECTORY_SEPARATOR);
define('DATABASE_PATH', BASE_PATH . 'database' . DIRECTORY_SEPARATOR);

// External services
define('SHEET_BASE_API', 'https://sheetdb.io/api/v1/2j9dlha6wwzh5');
define('SHEET_BUYER', 'fetch_bought_devices');
define('SHEET_TENANT', 'fetch_tenants');
define('SHEET_DEVICE', 'fetch_devices');

// Deploy paths
define('PUBLIC_PATH', '../public'); 
define('DATABASE_FETCH_PATH', '../database'); 
# Nếu thư mục đặt public của hosting ví dụ là httpdocs/dist/device-panel/public/... thì nên để PUBLIC_PATH = 'device-panel/public' 