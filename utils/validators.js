import priceLimits from '../data/priceLimits.json';

// カテゴリごとの上限価格を取得
export function getPriceLimit(category) {
  return priceLimits.categories[category] || priceLimits.default;
}

// 価格バリデーション（上限チェック付き）
export function validatePrice(price, category) {
  if (!price || price.trim() === '') return '価格を入力してください';
  if (isNaN(price)) return '価格は数字で入力してください';
  if (parseInt(price) <= 0) return '価格は1円以上にしてください';

  const limit = getPriceLimit(category);
  if (parseInt(price) > limit) {
    return `${category || 'この商品'}の出品上限は¥${limit.toLocaleString()}です`;
  }

  return null;
}

// 商品名のバリデーション
export function validateProductName(name) {
  if (!name || name.trim() === '') return '商品名を入力してください';
  if (name.trim().length < 2) return '商品名は2文字以上にしてください';
  if (name.trim().length > 40) return '商品名は40文字以内にしてください';
  return null;
}

// 商品説明のバリデーション
export function validateDescription(description) {
  if (!description || description.trim() === '') return '商品説明を入力してください';
  if (description.trim().length < 10) return '商品説明は10文字以上にしてください';
  return null;
}

// チャットIDの生成
export function generateChatId(uid1, uid2, productId) {
  return [uid1, uid2].sort().join('_') + '_' + productId;
}

// 商品フィルタリング
export function filterProducts(products, keyword, category) {
  let result = products;

  if (category && category !== 'すべて') {
    result = result.filter(p => p.category === category);
  }

  if (keyword && keyword.trim() !== '') {
    result = result.filter(p =>
      p.name.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  return result;
}
