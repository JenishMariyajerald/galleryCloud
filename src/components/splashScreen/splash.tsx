import React, {useEffect} from 'react';
import {View, ImageBackground, StyleSheet, Text} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

type RootStackParamList = {
  Gallery: undefined;
};

type SplashScreenProps = {
  navigation: Required<
    NativeStackScreenProps<RootStackParamList>['navigation']
  >;
};

const SplashScreen: React.FC<SplashScreenProps> = ({navigation}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('Gallery');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assests/splash.jpg')}
        resizeMode="cover"
        style={styles.image}>
        <Text style={styles.text}>Gallery</Text>
      </ImageBackground>
    </View>
  );
};

export default SplashScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 42,
    lineHeight: 84,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Cochin',
  },
});
