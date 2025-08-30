<?php
require_once dirname(__DIR__) . DIRECTORY_SEPARATOR . 'config.php';
require_once BASE_PATH . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
require_once MODELS_PATH . 'Device.php';

header('Content-Type: application/json');

try {
    $device = new Device();

    // Lấy dữ liệu
    $devices = $device->fetch();  // mảng device hiện có

    echo json_encode($devices, JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
