// products.js
const baseProducts = [
  { name: 'デニムジャケット', price: '¥3,800' },
  { name: 'レザーバッグ', price: '¥5,200' },
  { name: 'スニーカー', price: '¥2,100' },
  { name: 'ウールコート', price: '¥8,900' },
];

// 5倍に複製して20件にする
const products = Array.from({ length: 20 }, (_, i) => ({
  ...baseProducts[i % baseProducts.length],
  id: i + 1,
  description: '商品説明文がここに入ります。',
  seller: '出品者' + (i + 1),
  condition: '目立った傷や汚れなし',
}));

export default products;