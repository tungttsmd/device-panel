<?php

use GuzzleHttp\Client;

class Buyer
{
    private $bought_devices;

    public function __construct()
    {
        // // Lấy thông tin máy mua
        $client = new Client(['verify' => false]);

        $response = $client->get(SHEET_BASE_API . '?sheet=' . SHEET_BUYER);

        $body = $response->getBody();
        $data = json_decode($body, true);

        $this->bought_devices = [];

        foreach ($data as $item) {
            $this->bought_devices[] = $this->parseBuyerInfoLine($item['bought_devices']);
        }
    }

    // Getter methods
    public function fetch()
    {
        return $this->bought_devices;
    }
    public function parseBuyerInfoLine($line)
    {
        $parts = explode('|', $line);

        $result = [
            'username' => trim($parts[0] ?? ''),
            'display_name' => trim($parts[1] ?? ''),
            'cart' => [],
            'cart_count' => trim($parts[3] ?? ''),
            'vps' => trim($parts[4] ?? ''),
            'password' => trim($parts[5] ?? ''),
            'expired_hour_at' => "",
            'expired_day_at' => "",
            'status' => "Máy mua",
            'note' => trim($parts[9] ?? ''),
        ];

        // Tách cart (list thiết bị)
        if (!empty($parts[2])) {
            $cartStr = str_replace(['.', ' '], ',', $parts[2]);
            $cartArray = array_filter(array_map('trim', explode(',', $cartStr)));
            $result['cart'] = array_values($cartArray);
        }

        return $result;
    }
    public function table()
    {
        $data = $this->bought_devices;
        if (empty($data)) {
            return "No data to display.";
        }
        $html = '<table border="1" cellpadding="5" cellspacing="0">';
        $html .= '<thead>
                <tr>
                    <th>#</th>
                    <th>username</th>
                    <th>display_name</th>
                    <th>cart (Locations)</th>
                    <th>password</th>
                    <th>bought_at</th>
                </tr>
              </thead>';
        $html .= '<tbody>';

        foreach ($data as $index => $line) {

            $html .= '<tr>';
            $html .= '<td>' . ($index + 1) . '</td>';
            $html .= '<td>' . htmlspecialchars(string: $line['username']) . '</td>';
            $html .= '<td>' . htmlspecialchars(string: $line['display_name']) . '</td>';
            $html .= '<td>' . implode(', ', $line['cart']) . '</td>';
            $html .= '<td>' . htmlspecialchars(string: $line['password']) . '</td>';
            $html .= '<td>' . htmlspecialchars(string: $line['bought_at']) . '</td>';
            $html .= '</tr>';
        }

        $html .= '</tbody></table>';

        return $html;
    }
}
