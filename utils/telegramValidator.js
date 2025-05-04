import crypto from 'crypto';

// Validates Telegram WebApp initData using HMAC-SHA256 verification
export function validateTelegramInitData(botToken, initData) {
  try {
    console.log('[TelegramValidator] Raw initData:', initData);
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    console.log('[TelegramValidator] Received hash:', hash);
    if (!hash) {
      console.log('[TelegramValidator] No hash parameter present');
      return false;
    }
    params.delete('hash');

    // Sort parameters alphabetically and build data check string
    const keys = Array.from(params.keys()).sort();
    const dataCheckString = keys.map(key => `${key}=${params.get(key)}`).join('\n');
    console.log('[TelegramValidator] DataCheckString:', dataCheckString);

    // Generate secret key using HMAC-SHA256 with constant string WebAppData
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Compute HMAC-SHA256 of data check string
    const computedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    console.log('[TelegramValidator] Computed hash:', computedHash);
    console.log('[TelegramValidator] Hash match:', computedHash === hash);

    return computedHash === hash;
  } catch (error) {
    console.error('[TelegramValidator] Error validating Telegram initData:', error);
    return false;
  }
}

// Express middleware enforcing valid Telegram WebApp initData on incoming requests
export function telegramValidatorMiddleware(req, res, next) {
  console.log('[TelegramValidator] Incoming request to', req.originalUrl);
  const initData = req.get('X-Telegram-Init-Data') || req.query.initData;
  console.log('[TelegramValidator] Extracted initData:', initData);

  let valid = false;
  let errorMsg = '';
  if (!initData) {
    errorMsg = 'missing initData';
  } else if (!validateTelegramInitData(process.env.BOT_TOKEN, initData)) {
    errorMsg = 'invalid or mismatched hash';
  } else {
    valid = true;
  }

  if (!valid) {
    console.warn('[TelegramValidator] Unauthorized request -', errorMsg);
    res.set('X-Telegram-Validator-Error', errorMsg);
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid Telegram WebApp initData', error: errorMsg });
  }

  // On success, set header so client can inspect
  res.set('X-Telegram-Validator', 'OK');
  console.log('[TelegramValidator] Request authorized');
  next();
} 