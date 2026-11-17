import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

// 買い手側：売り手に読み取ってもらう取引完了 QR コード
export default function TradeQrModal({ visible, value, tradeNumber, onClose }) {
  return (
    <Modal visible={visible && !!value} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>取引完了QRコード</Text>
          <Text style={styles.subtitle}>
            売り手にこの画面を見せて、QRコードを読み取ってもらってください
          </Text>

          <View style={styles.qrWrapper}>
            {value ? <QRCode value={value} size={220} color="#06534B" backgroundColor="#fff" /> : null}
          </View>

          {tradeNumber ? (
            <View style={styles.tradeNumberBox}>
              <Text style={styles.tradeNumberLabel}>取引番号</Text>
              <Text style={styles.tradeNumber}>{tradeNumber}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 19,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  tradeNumberBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#06534B',
    alignItems: 'center',
  },
  tradeNumberLabel: {
    fontSize: 11,
    color: '#06534B',
    fontWeight: 'bold',
  },
  tradeNumber: {
    fontSize: 16,
    color: '#06534B',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  closeButtonText: {
    color: '#999',
    fontSize: 14,
  },
});
