import {
  validatePrice,
  validateProductName,
  validateDescription,
  generateChatId,
  filterProducts,
  getPriceLimit
} from '../utils/validators';

// 価格バリデーションのテスト
describe('validatePrice', () => {
  test('空欄の場合エラーを返す', () => {
    expect(validatePrice('')).toBe('価格を入力してください');
    expect(validatePrice(null)).toBe('価格を入力してください');
  });

  test('数字以外の場合エラーを返す', () => {
    expect(validatePrice('abc')).toBe('価格は数字で入力してください');
    expect(validatePrice('１２３')).toBe('価格は数字で入力してください');
  });

  test('0以下の場合エラーを返す', () => {
    expect(validatePrice('0')).toBe('価格は1円以上にしてください');
    expect(validatePrice('-100')).toBe('価格は1円以上にしてください');
  });

  test('上限を超える場合エラーを返す', () => {
    expect(validatePrice('10000000')).toBe('価格は999万円以下にしてください');
  });

  test('正常な価格の場合nullを返す', () => {
    expect(validatePrice('1000')).toBeNull();
    expect(validatePrice('9999999')).toBeNull();
    expect(validatePrice('1')).toBeNull();
  });
});

// 商品名バリデーションのテスト
describe('validateProductName', () => {
  test('空欄の場合エラーを返す', () => {
    expect(validateProductName('')).toBe('商品名を入力してください');
    expect(validateProductName(null)).toBe('商品名を入力してください');
  });

  test('1文字の場合エラーを返す', () => {
    expect(validateProductName('あ')).toBe('商品名は2文字以上にしてください');
  });

  test('41文字以上の場合エラーを返す', () => {
    expect(validateProductName('あ'.repeat(41))).toBe('商品名は40文字以内にしてください');
  });

  test('正常な商品名の場合nullを返す', () => {
    expect(validateProductName('デニムジャケット')).toBeNull();
    expect(validateProductName('ab')).toBeNull();
  });
});

// チャットID生成のテスト
describe('generateChatId', () => {
  test('2つのuidとproductIdからチャットIDを生成する', () => {
    const id = generateChatId('uid_aaa', 'uid_bbb', 'product_123');
    expect(id).toBe('uid_aaa_uid_bbb_product_123');
  });

  test('uidの順番が逆でも同じIDになる', () => {
    const id1 = generateChatId('uid_aaa', 'uid_bbb', 'product_123');
    const id2 = generateChatId('uid_bbb', 'uid_aaa', 'product_123');
    expect(id1).toBe(id2);
  });
});

// フィルタリングのテスト
describe('filterProducts', () => {
  const products = [
    { id: '1', name: 'デニムジャケット', category: 'メンズ' },
    { id: '2', name: 'レザーバッグ', category: 'バッグ' },
    { id: '3', name: 'スニーカー', category: 'シューズ' },
    { id: '4', name: 'デニムスカート', category: 'レディース' },
  ];

  test('キーワードで絞り込める', () => {
    const result = filterProducts(products, 'デニム', 'すべて');
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('デニムジャケット');
    expect(result[1].name).toBe('デニムスカート');
  });

  test('カテゴリで絞り込める', () => {
    const result = filterProducts(products, '', 'バッグ');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('レザーバッグ');
  });

  test('キーワードとカテゴリを組み合わせて絞り込める', () => {
    const result = filterProducts(products, 'デニム', 'メンズ');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('デニムジャケット');
  });

  test('該当なしの場合空配列を返す', () => {
    const result = filterProducts(products, '存在しない商品', 'すべて');
    expect(result).toHaveLength(0);
  });

  test('キーワードなし・すべてカテゴリの場合全件返す', () => {
    const result = filterProducts(products, '', 'すべて');
    expect(result).toHaveLength(4);
  });
});

describe('validatePrice with category', () => {
  test('カテゴリの上限を超える場合エラーを返す', () => {
    expect(validatePrice('25000', 'シューズ')).toBe('シューズの出品上限は¥20,000です');
  });

  test('カテゴリの上限内なら通る', () => {
    expect(validatePrice('15000', 'シューズ')).toBeNull();
  });

  test('カテゴリ未指定はデフォルト上限を使う', () => {
    expect(validatePrice('60000', null)).toBe('この商品の出品上限は¥50,000です');
  });
});

describe('getPriceLimit', () => {
  test('カテゴリごとの上限を返す', () => {
    expect(getPriceLimit('アクセサリー')).toBe(10000);
    expect(getPriceLimit('バッグ')).toBe(50000);
  });

  test('未知のカテゴリはデフォルト値を返す', () => {
    expect(getPriceLimit('存在しないカテゴリ')).toBe(50000);
  });
});