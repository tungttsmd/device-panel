<?php
require_once dirname(__DIR__) . DIRECTORY_SEPARATOR . 'config.php';
require_once BASE_PATH . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
require_once MODELS_PATH . 'Tenant.php';
require_once MODELS_PATH . 'Buyer.php';
require_once MODELS_PATH . 'Device.php';

header('Content-Type: application/json');

try {
    $tenant = new Tenant();
    $buyer = new Buyer();
    $device = new Device();

    // Lấy dữ liệu
    $buyers = $buyer->fetch();    // mảng buyer
    $tenants = $tenant->fetch();  // mảng tenant hiện có

    // Thêm toàn bộ buyer sang tenant
    foreach ($buyers as $b) {
        // thêm vào tenant
        $tenants[] = $b;
    }
    echo json_encode($tenants, JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>