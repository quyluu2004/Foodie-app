import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import CreateModal from '@/components/CreateModal';

export default function CreateScreen() {
  const [modalVisible, setModalVisible] = useState(false);

  // Mở modal khi screen được focus (khi click vào tab)
  React.useEffect(() => {
    setModalVisible(true);
  }, []);

  return (
    <View style={styles.container}>
      <CreateModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          // Navigate back to previous screen
          setTimeout(() => {
            // This screen is hidden, so we just close the modal
          }, 100);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

