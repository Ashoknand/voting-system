// Simple in-memory captcha store with expiration
const captchaStore = new Map();

// Clean up expired captchas every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of captchaStore.entries()) {
    if (data.expiresAt < now) {
      captchaStore.delete(token);
    }
  }
}, 5 * 60 * 1000);

// Generate a random 5-6 character alphanumeric code
const generateCaptchaCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars: 0, O, I, 1
  const length = 5 + Math.floor(Math.random() * 2); // 5 or 6 characters
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Generate a new captcha and return it with a token
const generateCaptcha = () => {
  const code = generateCaptchaCode();
  const token = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiration

  captchaStore.set(token, {
    code: code.toUpperCase(),
    expiresAt,
  });

  return { code: code.toUpperCase(), token };
};

// Verify a captcha code
const verifyCaptcha = (token, code) => {
  if (!token || !code) {
    return false;
  }

  const data = captchaStore.get(token);
  if (!data) {
    return false;
  }

  // Check expiration
  if (data.expiresAt < Date.now()) {
    captchaStore.delete(token);
    return false;
  }

  // Case-insensitive comparison
  const isValid = data.code.toUpperCase() === code.toUpperCase().trim();

  // Delete after verification (one-time use)
  if (isValid) {
    captchaStore.delete(token);
  }

  return isValid;
};

// Get captcha code by token (for display)
const getCaptchaCode = (token) => {
  const data = captchaStore.get(token);
  if (!data || data.expiresAt < Date.now()) {
    return null;
  }
  return data.code;
};

module.exports = {
  generateCaptcha,
  verifyCaptcha,
  getCaptchaCode,
};

