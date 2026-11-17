import { useRef, useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

// 売り手側：買い手の取引完了 QR コードを読み取る
// onScanned(data) は Promise を返す。解決するまで次の読み取りは行わない
export default function QrScannerModal({ visible, onScanned, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const lockRef = useRef(false);

  useEffect(() => {
    if (visible) {
      lockRef.current = false;
      setProcessing(false);
    }
  }, [visible]);

  const handleBarcodeScanned = async ({ data }) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setProcessing(true);
    try {
      const keepScanning = await onScanned(data);
      if (keepScanning) lockRef.current = false;
    } finally {
      setProcessing(false);
    }
  };

  const renderBody = () => {
    if (!permission) {
      return <ActivityIndicator color="#fff" />;
    }
    if (!permission.granted) {
      return (
        <View style={styles.permissionBox}>
          <Text style={styles.permissionText}>QRコードを読み取るにはカメラへのアクセスが必要です</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
          >
            <Text style={styles.permissionButtonText}>
              {permission.canAskAgain ? 'カメラを許可する' : '設定を開く'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.cameraWrapper}>
        {/* モーダルを閉じるとアンマウントされ、カメラも停止する */}
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={processing ? undefined : handleBarcodeScanned}
        />
        <View style={styles.frame} pointerEvents="none" />
        {processing && (
          <View style={styles.processing}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>買い手のQRコードを読み取る</Text>
        <Text style={styles.subtitle}>買い手の画面に表示されたQRコードを枠内に合わせてください</Text>
        {visible && renderBody()}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>閉じる</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#ccc',
    fontSize: 13,
    textAlign: 'center',
  },
  cameraWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: '70%',
    aspectRatio: 1,
    borderWidth: 3,
    borderColor: '#4ECDC4',
    borderRadius: 16,
  },
  processing: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionBox: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 40,
  },
  permissionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 'auto',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 15,
  },
});
