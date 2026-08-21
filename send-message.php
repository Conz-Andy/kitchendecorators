<?php
// ============================================================
// Kitchen Decorators — contact form handler
// Runs on the Namecheap server only (inert on the GitHub Pages preview).
// Sends submissions to $TO using PHP mail(). If deliverability is poor,
// switch to authenticated SMTP via Namecheap Private Email (see go-live notes).
// ============================================================

$TO   = 'info@kitchendecorators.co.uk';
$FROM = 'noreply@kitchendecorators.co.uk'; // must be a domain address for SPF

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Location: contact.html'); exit; }

// Honeypot — bots fill the hidden "website" field
if (!empty($_POST['website'])) { header('Location: thank-you.html'); exit; }

function clean($v) { return trim(str_replace(array("\r", "\n"), ' ', $v ?? '')); }

$name    = clean($_POST['name'] ?? '');
$email   = clean($_POST['email'] ?? '');
$phone   = clean($_POST['phone'] ?? '');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo 'Please go back and complete the required fields.';
  exit;
}
if (strlen($message) > 5000) { $message = substr($message, 0, 5000); }

$subject = 'Website enquiry from ' . $name;
$body    = "New message from the kitchendecorators.co.uk contact form\n\n"
         . "Name:  $name\n"
         . "Email: $email\n"
         . "Phone: $phone\n\n"
         . "Message:\n$message\n";

$headers = "From: Kitchen Decorators Website <$FROM>\r\n"
         . "Reply-To: $name <$email>\r\n"
         . "X-Mailer: PHP/" . phpversion();

mail($TO, $subject, $body, $headers);
header('Location: thank-you.html');
exit;
