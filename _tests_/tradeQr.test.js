import {
  generateCompletionToken,
  buildTradeQrPayload,
  parseTradeQrPayload,
  verifyTradeQr,
} from '../utils/tradeQr';

const base = { productId: 'prod1', chatId: 'chat1', tradeNumber: 'SOFA-20261112-0001', token: 'tok123' };
const reservedState = { productId: 'prod1', chatId: 'chat1', status: 'reserved', completionToken: 'tok123' };

describe('generateCompletionToken', () => {
  test('指定した長さの英数字を返す', () => {
    const token = generateCompletionToken();
    expect(token).toMatch(/^[A-Za-z0-9]{24}$/);
    expect(generateCompletionToken(8)).toHaveLength(8);
  });

  test('毎回異なる値を返す', () => {
    expect(generateCompletionToken()).not.toBe(generateCompletionToken());
  });
});

describe('buildTradeQrPayload / parseTradeQrPayload', () => {
  test('生成した文字列を元に戻せる', () => {
    expect(parseTradeQrPayload(buildTradeQrPayload(base))).toEqual(base);
  });

  test('SOFA の取引QR以外は null', () => {
    expect(parseTradeQrPayload('https://example.com')).toBeNull();
    expect(parseTradeQrPayload('{"t":"other","v":1}')).toBeNull();
    expect(parseTradeQrPayload(JSON.stringify({ t: 'sofa-trade', v: 1, p: 'x' }))).toBeNull();
    expect(parseTradeQrPayload(undefined)).toBeNull();
  });
});

describe('verifyTradeQr', () => {
  const parsed = parseTradeQrPayload(buildTradeQrPayload(base));

  test('正しいQRなら null', () => {
    expect(verifyTradeQr(parsed, reservedState)).toBeNull();
  });

  test('無効なQRはエラー', () => {
    expect(verifyTradeQr(null, reservedState)).toBe('SOFA の取引用QRコードではありません');
  });

  test('別の商品・別のチャットはエラー', () => {
    expect(verifyTradeQr(parsed, { ...reservedState, productId: 'prod2' }))
      .toBe('この商品の取引用QRコードではありません');
    expect(verifyTradeQr(parsed, { ...reservedState, chatId: 'chat2' }))
      .toBe('このチャットの買い手のQRコードではありません');
  });

  test('状態が売約済みでなければエラー', () => {
    expect(verifyTradeQr(parsed, { ...reservedState, status: 'sold' }))
      .toBe('この取引はすでに完了しています');
    expect(verifyTradeQr(parsed, { ...reservedState, status: 'available' }))
      .toBe('この商品は売約済みの状態ではありません');
  });

  test('トークン未発行・不一致はエラー', () => {
    expect(verifyTradeQr(parsed, { ...reservedState, completionToken: null }))
      .toBe('買い手がまだチェックリストを完了していません');
    expect(verifyTradeQr(parsed, { ...reservedState, completionToken: 'other' }))
      .toMatch(/QRコードが古いか無効です/);
  });
});
