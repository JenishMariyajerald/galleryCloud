import React from 'react';
import RootNavigator from './components/RootNavigator';
import {realmContext} from './realm';

const {RealmProvider} = realmContext;

const App = () => {
  return (
    <RealmProvider>
      <RootNavigator />
    </RealmProvider>
  );
};

export default App;
