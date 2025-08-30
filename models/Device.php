<?php

use GuzzleHttp\Client;

class Device
{
    private $devices;

    public function __construct()
    {
        // Lấy thông tin thiết bị
        $client = new Client(['verify' => false]);

        $response = $client->get(SHEET_BASE_API . '?sheet=' . SHEET_DEVICE);

        $body = $response->getBody();
        $data = json_decode($body, true);

        $this->devices = [];
        foreach ($data as $item) {
            $pos = strpos($item['devices'], '|'); // tìm vị trí dấu |
            if ($pos !== false) {
                $first = substr($item['devices'], 0, $pos);
            } else {
                $first = $item['devices']; // nếu không có | thì lấy nguyên chuỗi
            }
            $this->devices[$first] = $this->parseConfigLine($item['devices']);
        }
    }

    // Getter methods

    public function fetch()
    {
        return $this->devices;
    }

    public function parseConfigLine($line)
    {
        $parts = explode("|", $line);
        if (count($parts) < 3) {
            return []; // Dữ liệu không đúng định dạng
        }

        $id = trim($parts[0]);
        $config = trim($parts[1]);
        $nguon_cot3 = trim($parts[2]);

        $result['location'] = $id;

        // Main
        if (preg_match('/Main\s+([^,]+)/i', $config, $m)) {
            $result['main'] = $m[1];
        }

        // Chip
        if (preg_match('/Chip\s+([^,]+)/i', $config, $m)) {
            $result['chip'] = $m[1];
        }

        // Vga
        if (preg_match('/Vga\s+([^,]+)/i', $config, $m)) {
            $result['vga'] = $m[1];
        }

        // Ram (lấy dung lượng + bus)
        if (preg_match('/Ram\s+(\d+)(?:g?b?)?\s*\(([\d\s]+)\)/i', $config, $m)) {
            $result['ram_capacity'] = $m[1] . 'GB';
            $result['ram_details'] = $m[2];
        } else if (preg_match('/Ram\s+(\d+)(?:g?b?)?/i', $config, $m)) {
            $result['ram_capacity'] = $m[1] . 'GB';
        }

        // Disk (có thể là disk 512 hoặc disk 1TB)
        if (preg_match('/disk\s+(\d+)(tb|gb)?/i', $config, $m)) {
            $size = $m[1];
            $unit = isset($m[2]) ? strtoupper($m[2]) : 'GB';
            $result['disk'] = $size . $unit;
        }

        // Nguồn
        if (preg_match('/ngu[oô]̀?n?\s*([\d]+[wW]?)/i', $config, $m)) {
            $result['power'] = $m[1];
        } else {
            $result['power'] = $nguon_cot3;
        }
        return $result;
    }
    public function table()
    {
        $data = $this->devices;

        if (empty($data)) {
            return "No data to display.";
        }

        $columns = array_keys(reset($data));

        $html = '<table border="1" cellpadding="5" cellspacing="0">';
        $html .= '<thead><tr>';
        $html .= '<th>#</th>'; // Thêm cột số thứ tự

        foreach ($columns as $col) {
            $html .= '<th>' . htmlspecialchars($col) . '</th>';
        }
        $html .= '</tr></thead>';

        $html .= '<tbody>';
        foreach ($data as $index => $row) {
            $html .= '<tr>';
            $html .= '<td>' . ($index + 1) . '</td>'; // Số thứ tự

            foreach ($columns as $col) {
                $val = isset($row[$col]) ? $row[$col] : '';
                if (is_array($val)) {
                    $val = implode(', ', $val); // Nếu là mảng thì nối chuỗi
                }
                $html .= '<td>' . htmlspecialchars($val) . '</td>';
            }
            $html .= '</tr>';
        }
        $html .= '</tbody></table>';

        return $html;
    }
}
