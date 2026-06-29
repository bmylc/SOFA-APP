const CLOUD_NAME = 'qe897fh1';
const UPLOAD_PRESET = 'fleamarket_preset';

export async function uploadImage(base64) { // ← 引数をbase64に変更
  const filename = `product_${Date.now()}`;
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: `data:image/jpeg;base64,${base64}`, // ← そのまま使える
        upload_preset: UPLOAD_PRESET,
      }),
    }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.secure_url;
}
