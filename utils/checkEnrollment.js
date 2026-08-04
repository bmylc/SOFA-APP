import NfcManager, { NfcTech } from 'react-native-nfc-manager';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwzyE_55R5mvp2yvuc4w4FSA1NDzISH1UzK-xCVIlXNskBEQvwZyl45mEYJtOaIeFme/exec';

// NFC初期化
export async function initNfc() {
  return await NfcManager.start();
}

// NFCが使えるか確認
export async function isNfcSupported() {
  return await NfcManager.isSupported();
}

// FeliCaからUIDを読み取る
export async function readStudentCardUid() {
  try {
    await NfcManager.requestTechnology(NfcTech.NfcF);
    const tag = await NfcManager.getTag();
    return tag.id; // UID
  } catch (error) {
    throw error;
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
}

// UIDをGASに送ってカスタムトークンを取得
export async function verifyStudentCard(uid) {
  try {
    console.log('GAS_URL:', GAS_URL); // ← URLを確認
    console.log('送信するUID:', uid); // ← UIDを確認

    const response = await fetch(
      GAS_URL + '?action=verify&uid=' + uid
    );

    console.log('レスポンスステータス:', response.status); // ← ステータス確認
    const text = await response.text();
    console.log('レスポンス内容:', text); // ← レスポンス内容確認

    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.error('通信エラー詳細:', error.message); // ← エラー詳細
    throw new Error('サーバーとの通信に失敗しました');
  }
}

export async function checkUserExists(firebaseUid) {
  try {
    const url = GAS_URL + '?action=checkUser&firebaseUid=' + firebaseUid;
    console.log('checkUser URL:', url); // ← 追加

    const response = await fetch(url, {
      redirect: 'follow',
    });
    const text = await response.text();
    console.log('checkUser レスポンス:', text); // ← 追加

    const data = JSON.parse(text);
    return data.exists;
  } catch (error) {
    console.error('checkUserエラー:', error);
    return false;
  }
}

// 在校生判定（Firestoreのuserデータから）
export function isEnrolledStudent(userDoc) {
  return userDoc.isEnrolled === true;
}