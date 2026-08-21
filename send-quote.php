<?php
// ============================================================
// Kitchen Decorators — online quote form handler (with photo uploads)
// Runs on the Namecheap server only (inert on the GitHub Pages preview).
// Emails the quote request to $TO with the kitchen photos attached.
// ============================================================

$TO   = 'info@kitchendecorators.co.uk';
$FROM = 'noreply@kitchendecorators.co.uk'; // must be a domain address for SPF
$MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB per photo

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Location: quote.html'); exit; }

// Honeypot — bots fill the hidden "website" field
if (!empty($_POST['website'])) { header('Location: thank-you.html'); exit; }

function clean($v) { return trim(str_replace(array("\r", "\n"), ' ', $v ?? '')); }

$name    = clean($_POST['name'] ?? '');
$email   = clean($_POST['email'] ?? '');
$phone   = clean($_POST['phone'] ?? '');
$address = clean($_POST['address'] ?? '');
$colour  = clean($_POST['colour'] ?? '');
$colour_details = clean($_POST['colour_details'] ?? '');
$handles = clean($_POST['handles'] ?? '');

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo 'Please go back and complete the required fields.';
  exit;
}

// Collect photo attachments
$allowed = array('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif');
$attachments = array();
foreach (array('photo_front' => 'Front view', 'photo_side' => 'Side view') as $field => $label) {
  if (!isset($_FILES[$field]) || $_FILES[$field]['error'] !== UPLOAD_ERR_OK) continue;
  $f = $_FILES[$field];
  if ($f['size'] > $MAX_FILE_BYTES) continue;
  $mime = function_exists('mime_content_type') ? mime_content_type($f['tmp_name']) : $f['type'];
  if (!in_array($mime, $allowed, true)) continue;
  $safe = preg_replace('/[^A-Za-z0-9._-]/', '_', basename($f['name']));
  $attachments[] = array('name' => $safe, 'mime' => $mime, 'data' => file_get_contents($f['tmp_name']), 'label' => $label);
}

$subject = 'Online quote request from ' . $name;
$text    = "New quote request from kitchendecorators.co.uk\n\n"
         . "Name:    $name\n"
         . "Email:   $email\n"
         . "Phone:   $phone\n"
         . "Address: $address\n\n"
         . "Colour option:  $colour\n"
         . "Colour details: $colour_details\n"
         . "Handles:        $handles\n\n"
         . "Photos attached: " . count($attachments) . "\n";

$boundary = 'kd_' . md5(uniqid((string)mt_rand(), true));
$headers  = "From: Kitchen Decorators Website <$FROM>\r\n"
          . "Reply-To: $name <$email>\r\n"
          . "MIME-Version: 1.0\r\n"
          . "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n"
          . "X-Mailer: PHP/" . phpversion();

$body  = "--$boundary\r\n"
       . "Content-Type: text/plain; charset=UTF-8\r\n"
       . "Content-Transfer-Encoding: 8bit\r\n\r\n"
       . $text . "\r\n";

foreach ($attachments as $a) {
  $body .= "--$boundary\r\n"
         . "Content-Type: {$a['mime']}; name=\"{$a['name']}\"\r\n"
         . "Content-Disposition: attachment; filename=\"{$a['name']}\"\r\n"
         . "Content-Transfer-Encoding: base64\r\n\r\n"
         . chunk_split(base64_encode($a['data'])) . "\r\n";
}
$body .= "--$boundary--\r\n";

mail($TO, $subject, $body, $headers);
header('Location: thank-you.html');
exit;
