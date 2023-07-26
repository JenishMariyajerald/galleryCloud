import React from 'react';
import {View, Text, Alert} from 'react-native';
import {ProgressView} from '@react-native-community/progress-view';
import {PhotoQuality} from 'react-native-image-picker';
import NetInfo from '@react-native-community/netinfo';
import {styles} from './styles';

interface ProgressBarProps {
  uploadProgress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({uploadProgress}) => {
  return (
    <View>
      <ProgressView
        style={{height: 20}}
        progressTintColor="green"
        trackTintColor="black"
        progress={uploadProgress}
        progressViewStyle="bar"
      />
      <Text>{`${Math.round(uploadProgress * 100)}%`}</Text>
    </View>
  );
};

export const cameraOptions = {
  mediaType: 'photo' as const,
  quality: 0.5 as PhotoQuality | undefined,
  cameraType: 'front' as const,
};

export const networkWarning = () => {
  Alert.alert(
    '\n\n\n\n',
    'No internet Connection to remove the online image. Please Try again',
  );
};

export const isNetOn = async () => {
  const netInfoState = await NetInfo.fetch();
  return netInfoState.isConnected;
};
