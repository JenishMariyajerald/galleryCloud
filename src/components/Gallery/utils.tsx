/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View, Text} from 'react-native';
import {ProgressView} from '@react-native-community/progress-view';
import {PhotoQuality} from 'react-native-image-picker';

interface ProgressBarProps {
  uploadProgress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({uploadProgress}) => {
  return (
    <View>
      <ProgressView
        style={{height: 40}}
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
