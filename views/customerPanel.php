<?php
require_once dirname(__DIR__) . DIRECTORY_SEPARATOR . 'config.php';
require_once BASE_PATH . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
require_once MODELS_PATH . 'Tenant.php';
require_once MODELS_PATH . 'Buyer.php';
require_once MODELS_PATH . 'Device.php';
$device = new Device();
$tenant = new Tenant();
$buyer = new Buyer();

// Lấy dữ liệu
$buyers = $buyer->fetch();    // mảng buyer
$tenants = $tenant->fetch();  // mảng tenant hiện có
$devices = $device->fetch();  // mảng device hiện có

// Thêm toàn bộ buyer sang tenant
foreach ($buyers as $b) {
    // thêm vào tenant
    $tenants[] = $b;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Search Cart Tool</title>
    <link rel="stylesheet" href="<?php echo PUBLIC_PATH ?>/assets/css/customerPanel.css">
</head>

<body>

    <div class="container">
        <div id="filterBar">
            <div id="fetchBtnContainer">
                <button id="fetchBtn" class="fetch-btn">🔄 Làm mới</button>
            </div>
            <div id="filterControls">
                <input type="text" id="searchInput" placeholder="Nhập số máy, username hoặc tên hiển thị...">
                <button id="noteToggle" aria-pressed="false"><span class="toggle" aria-hidden="true"></span>Lọc ghi chú</button>
            </div>
        </div>

        <div id="resultContainer">
            <p><em>Không có kết quả</em></p>
        </div>
    </div>

    <!-- Modal chính cho hiển thị thông tin mua thuê -->
    <div id="detailModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="document.getElementById('detailModal').style.display='none'">&times;</span>
            <div id="modalContent"></div>
        </div>
    </div>

    <!-- Modal phụ cho cấu hình device -->
    <div id="deviceModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="document.getElementById('deviceModal').style.display='none'">&times;</span>
            <div id="deviceContent"></div>
        </div>
    </div>

    <script>
        window.bootstrapCustomer = {
            data: <?php echo json_encode($tenants, JSON_UNESCAPED_UNICODE); ?>,
            devices: <?php echo json_encode($devices, JSON_UNESCAPED_UNICODE); ?>,
            fetchDatabasePath: <?php echo json_encode(DATABASE_FETCH_PATH); ?>
        };
        </script>
    <script src="<?php echo PUBLIC_PATH ?>/assets/js/customerPanel.js"></script>

</body>

</html>