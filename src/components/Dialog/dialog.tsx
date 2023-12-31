import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';

interface CustomDialogProps {
  visible?: boolean;
  onClose?: () => void;
  title?: string;
  onCameraSelect?: () => void;
  onLibrarySelect?: () => void;
  onDelete?: () => void;
  onCancelSelect?: () => void;
  mode?: 'selection' | 'delete';
  loading?: boolean;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  visible = false,
  title,
  onClose,
  onCameraSelect,
  onLibrarySelect,
  onDelete,
  onCancelSelect,
  mode,
  loading,
}) => {
  return (
    <Modal visible={visible}>
      <View style={styles.container}>
        <View style={[styles.dialog, styles.white]}>
          {!loading && (
            <View style={styles.titleView}>
              <Text style={[styles.title]}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Image
                  source={require('../../assets/disabled.png')}
                  style={[styles.closeIcon]}
                />
              </TouchableOpacity>
            </View>
          )}

          {mode === 'delete' && !loading ? (
            <View style={styles.buttonView}>
              {loading}
              <TouchableOpacity
                onPress={onDelete}
                style={styles.buttonContainer}>
                <Text style={styles.buttonTitle}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onCancelSelect}
                style={styles.buttonContainer}>
                <Text style={styles.buttonTitle}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : mode === 'delete' && loading ? (
            <ActivityIndicator size="large" color="blue" />
          ) : null}

          {mode === 'selection' && (
            <View style={styles.selectionView}>
              <TouchableOpacity onPress={onCameraSelect}>
                <Text style={styles.selectionPadding}>Select Camera</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity onPress={onLibrarySelect}>
                <Text style={styles.selectionPadding}>Select from library</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default CustomDialog;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    padding: 16,
    borderRadius: 8,
    width: '80%',
  },
  titleView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  buttonContainer: {
    backgroundColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    width: 80,
    height: 30,
  },
  buttonTitle: {
    color: 'white',
  },
  buttonView: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  divider: {
    height: 1,
    backgroundColor: 'black',
    width: '100%',
  },
  selectionView: {
    flexDirection: 'column',
  },
  selectionPadding: {
    padding: 10,
  },
  white: {
    backgroundColor: 'white',
  },
});
