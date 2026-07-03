import { Alert } from 'react-native';

// Firebaseのエラーコードを日本語に変換
export function getErrorMessage(error) {
  const code = error?.code || error?.message || '';

  if (code.includes('network')) return 'ネットワークエラーが発生しました。接続を確認してください。';
  if (code.includes('permission-denied')) return 'アクセス権限がありません。';
  if (code.includes('not-found')) return 'データが見つかりませんでした。';
  if (code.includes('already-exists')) return 'すでに存在するデータです。';
  if (code.includes('unavailable')) return 'サービスが一時的に利用できません。しばらくしてから再試行してください。';
  if (code.includes('auth/user-not-found')) return 'メールアドレスまたはパスワードが違います。';
  if (code.includes('auth/wrong-password')) return 'メールアドレスまたはパスワードが違います。';
  if (code.includes('auth/email-already-in-use')) return 'このメールアドレスはすでに使われています。';
  if (code.includes('auth/weak-password')) return 'パスワードは6文字以上にしてください。';
  if (code.includes('auth/invalid-email')) return 'メールアドレスの形式が正しくありません。';

  return 'エラーが発生しました。しばらくしてから再試行してください。';
}

// エラーアラートを表示
export function showError(error, retry = null) {
  const message = getErrorMessage(error);
  
  if (retry) {
    Alert.alert(
      'エラー',
      message,
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '再試行', onPress: retry },
      ]
    );
  } else {
    Alert.alert('エラー', message);
  }
}