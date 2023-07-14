import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

interface CustomDialogProps {
  visible?: boolean;
  onClose?: () => void;
  title?: string;
  onCameraSelect?: () => void;
  onLibrarySelect?: () => void;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  visible = false,
  title,
  onClose,
  onCameraSelect,
  onLibrarySelect,
}) => {
  return (
    <Modal visible={visible}>
      <View style={styles.container}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: 'white',
            },
          ]}>
          <View style={styles.titleView}>
            <Text style={[styles.title]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Image
                source={require('../../assests/disabled.png')}
                style={[styles.closeIcon]}
              />
            </TouchableOpacity>
          </View>
          <View style={{flexDirection: 'column'}}>
            <TouchableOpacity onPress={onCameraSelect}>
              <Text style={{padding: 10}}>Select Camera</Text>
            </TouchableOpacity>
            <View
              style={{height: 1, backgroundColor: 'black', width: '100%'}}
            />
            <TouchableOpacity onPress={onLibrarySelect}>
              <Text style={{padding: 10}}>Select from library</Text>
            </TouchableOpacity>
          </View>
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
});
