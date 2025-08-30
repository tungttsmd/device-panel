<?php
require_once dirname(__DIR__) . DIRECTORY_SEPARATOR . 'config.php';

switch ($_GET['page'] ?? 'customerPanel') {
    case 'devicePanel':
        require_once VIEWS_PATH . 'devicePanel.php';
        break;
    case 'customerPanel':
        require_once VIEWS_PATH . 'customerPanel.php';
        break;
    default:
        require_once VIEWS_PATH . 'customerPanel.php';
        break;
}
