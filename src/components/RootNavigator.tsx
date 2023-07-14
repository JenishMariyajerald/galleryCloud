import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SplashScreen from './splashScreen/splash';
import Gallery from './Gallery/galleryDashboard';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SplashScreen">
        <Stack.Screen
          options={{
            headerShown: false,
          }}
          name="SplashScreen"
          component={SplashScreen}
        />
        <Stack.Screen
          options={{
            headerShown: false,
          }}
          name="Gallery"
          component={Gallery}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
