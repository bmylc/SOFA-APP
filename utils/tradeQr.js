// 取引完了用 QR コードの生成・解析・検証
// 買い手がチェックリストを完了すると completionToken を発行し、
// 売り手がその QR を読み取ることで売買成立（status: 'sold'）にする。

const QR_TYPE = 'sofa-trade';
const QR_VERSION = 1;
const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

// 取引完了トークンを生成（QR に埋め込み、商品ドキュメントにも保存する）
export function generateCompletionToken(length = 24) {
  let token = '';
  for (let i = 0; i < length; i++) {
    token += TOKEN_CHARS[Math.floor(Math.random() * TOKEN_CHARS.length)];
  }
  return token;
}

// QR に埋め込む文字列を作る
export function buildTradeQrPayload({ productId, chatId, tradeNumber, token }) {
  return JSON.stringify({
    t: QR_TYPE,
    v: QR_VERSION,
    p: productId,
    c: chatId,
    n: tradeNumber || null,
    k: token,
  });
}

// 読み取った文字列を解析する。SOFA の取引 QR でなければ null
export function parseTradeQrPayload(data) {
  if (typeof data !== 'string') return null;
  try {
    const obj = JSON.parse(data);
    if (!obj || obj.t !== QR_TYPE || obj.v !== QR_VERSION) return null;
    if (typeof obj.p !== 'string' || typeof obj.c !== 'string' || typeof obj.k !== 'string') {
      return null;
    }
    return {
      productId: obj.p,
      chatId: obj.c,
      tradeNumber: obj.n || null,
      token: obj.k,
    };
  } catch {
    return null;
  }
}

// 読み取った QR が、このチャットの取引として有効か検証する
// 問題なければ null、問題があればエラーメッセージを返す
export function verifyTradeQr(parsed, { productId, chatId, status, completionToken }) {
  if (!parsed) return 'SOFA の取引用QRコードではありません';
  if (parsed.productId !== productId) return 'この商品の取引用QRコードではありません';
  if (parsed.chatId !== chatId) return 'このチャットの買い手のQRコードではありません';
  if (status === 'sold') return 'この取引はすでに完了しています';
  if (status !== 'reserved') return 'この商品は売約済みの状態ではありません';
  if (!completionToken) return '買い手がまだチェックリストを完了していません';
  if (parsed.token !== completionToken) {
    return 'QRコードが古いか無効です。買い手に最新のQRコードを表示してもらってください';
  }
  return null;
}
