// Simple user-agent parser — no external dependencies
export function parseUserAgent(ua: string) {
  let browser = "Unknown";
  let os = "Unknown";
  let device = "Desktop";

  // Browser detection (order matters — check specific tokens before generic Chrome/Safari)
  if (/curl\//i.test(ua)) browser = "curl";
  else if (/PostmanRuntime\//i.test(ua)) browser = "Postman";
  else if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Brave\//i.test(ua)) browser = "Brave";
  else if (/SamsungBrowser\//i.test(ua)) browser = "Samsung Internet";
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Trident/i.test(ua) || /MSIE/i.test(ua)) browser = "IE";

  // OS detection (check iOS before macOS — iOS UAs contain "like Mac OS X")
  if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X|macOS/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  // Device type
  if (/iPad|Tablet/i.test(ua)) device = "Tablet";
  else if (/Mobile|Android|iPhone|iPod/i.test(ua)) device = "Mobile";

  return { browser, os, device };
}
