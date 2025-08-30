<?php
require_once dirname(__DIR__) . DIRECTORY_SEPARATOR . 'config.php';
require_once BASE_PATH . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
require_once MODELS_PATH . 'Device.php';
require_once MODELS_PATH . 'Buyer.php';

$device = new Device();
$buyer = new Buyer();

// Lấy dữ liệu
$devices = $device->fetch();  // mảng device hiện có
$buyers = $buyer->fetch();  // mảng device hiện có
?>

<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="<?php echo PUBLIC_PATH ?>/assets/css/devicePanel.css">
</head>


<div class="container">
    <div id="filterContainer">
        <div id="filterBar">
            <div id="filterControls">
                <input type="text" id="searchInput" placeholder="Tìm máy theo location..." />
            </div>
            <div id="noteToggleContainer">
                <select id="serverSelect">
                    <option value="all">Tất cả</option>
                    <option value="1">server 1</option>
                    <option value="2">server 2</option>
                    <option value="3">server 3</option>
                    <option value="4">server 4</option>
                    <option value="5">server 5</option>
                    <option value="6">server 6</option>
                    <option value="7">server 7</option>
                </select>
                <button id="noteToggle" aria-pressed="false"><span class="toggle" aria-hidden="true"></span>Lọc ghi chú</button>
            </div>
        </div>
    </div>
    <div class="device-table">
        <div id="resultContainer"></div>
    </div>
</div>
<script>
    window.bootstrapDevice = {
        devices: <?php echo json_encode($devices, JSON_UNESCAPED_UNICODE); ?>,
        buyers: <?php echo json_encode($buyers, JSON_UNESCAPED_UNICODE); ?>
    };
</script>
<script src="<?php echo PUBLIC_PATH ?>/assets/js/devicePanel.js"></script>