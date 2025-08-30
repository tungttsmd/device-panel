<?php

use GuzzleHttp\Client;

class Tenant
{
    private $tenants = [];

    public function __construct()
    {
        // Lấy thông tin máy mua
        $client = new Client(['verify' => false]);

        $response = $client->get(SHEET_BASE_API . '?sheet=' . SHEET_TENANT);

        $body = $response->getBody();
        $data = json_decode($body, true);

        foreach ($data as $item) {
            $this->tenants[] = $this->parseTenantLine($item['tenants']);
        }
    }

    // Getter methods
    public function fetch()
    {
        return $this->tenants;
    }
    public function parseTenantLine($line)
    {
        $parts = explode('%', $line);

        $cart_raw = $parts[2] ?? '';
        $cart = [];
        if (!empty($cart_raw)) {
            $cart_str = str_replace(['.', ' '], ',', $cart_raw);
            $cart_arr = array_filter(array_map('trim', explode(',', $cart_str)));
            $cart = array_values($cart_arr);
        }

        return [
            'username' => trim($parts[0] ?? ''),
            'display_name' => trim($parts[1] ?? ''),
            'cart' => $cart,
            'cart_count' => trim($parts[3] ?? ''),
            'vps' => trim($parts[4] ?? ''),
            'password' => trim($parts[5] ?? ''),
            'expired_hour_at' => trim($parts[6] ?? ''),
            'expired_day_at' => trim($parts[7] ?? ''),
            'status' => trim($parts[8] ?? ''),
            'note' => trim($parts[9] ?? ''),
        ];
    }
    public function table()
    {
        $data = $this->tenants;
        if (empty($data)) {
            return "No data to display.";
        }
        $html = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">';
        $html .= '<thead>
                <tr>
                    <th>#</th>
                    <th>Username</th>
                    <th>Display Name</th>
                    <th>Cart (Locations)</th>
                    <th>Password</th>
                    <th>Expired Hour At</th>
                    <th>Expired Day At</th>
                </tr>
              </thead>';
        $html .= '<tbody>';

        foreach ($data as $index => $line) {
            $html .= '<tr>';
            $html .= '<td>' . ($index + 1) . '</td>';
            $html .= '<td>' . htmlspecialchars($line['username']) . '</td>';
            $html .= '<td>' . htmlspecialchars($line['display_name']) . '</td>';
            $html .= '<td>' . htmlspecialchars(implode(', ', $line['cart'])) . '</td>';
            $html .= '<td>' . htmlspecialchars($line['password']) . '</td>';
            $html .= '<td>' . htmlspecialchars($line['expired_hour_at']) . '</td>';
            $html .= '<td>' . htmlspecialchars($line['expired_day_at']) . '</td>';
            $html .= '</tr>';
        }

        $html .= '</tbody></table>';

        return $html;
    }
}
