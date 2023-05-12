/**
 * @format
 */

import React, {useEffect, useState} from 'react';
import {View, Text} from 'react-native';
import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import {getLightspeedData} from './src/lightspeedApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  const [setLightspeedData] = useState(null);

  useEffect(() => {
    const loadLightspeedData = async () => {
      try {
        // Check if cached data exists
        const cachedData = await AsyncStorage.getItem('lightspeedData');

        if (cachedData !== null) {
          setLightspeedData(JSON.parse(cachedData));
          return;
        }

        // If cached data doesn't exist, fetch it from the API
        const data = await getLightspeedData();
        setLightspeedData(data);

        // Cache the data for future use
        await AsyncStorage.setItem('lightspeedData', JSON.stringify(data));
      } catch (error) {
        console.error(error);
      }
    };

    loadLightspeedData();
  }, []);

  return (
    <View>
      <Text>Lightspeed Data:</Text>
    </View>
  );
};

AppRegistry.registerComponent(appName, () => App);
