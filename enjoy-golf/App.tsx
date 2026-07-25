import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/types';
import { GameStoreProvider, useGameStore } from './src/store/useGameStore';
import WoodHeader from './src/components/WoodHeader';
import CharacterSelectScreen from './src/screens/CharacterSelectScreen';
import GameScreenSimple from './src/screens/GameScreenSimple';
import ResultScreenSimple from './src/screens/ResultScreenSimple';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import ResultScreen from './src/screens/ResultScreen';
import IntroScreen from './src/screens/IntroScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CompetitionScreen from './src/screens/CompetitionScreen';
import CompetitionResultScreen from './src/screens/CompetitionResultScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppInner() {
  const { hydrated } = useGameStore();

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a472a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F5E6C8" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="CharacterSelect"
          screenOptions={{
            contentStyle: { backgroundColor: '#1a472a' },
            animation: 'slide_from_right',
            headerShown: true,
            header: () => <WoodHeader />,
          }}
        >
          <Stack.Screen name="CharacterSelect" component={CharacterSelectScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="GameSimple" component={GameScreenSimple} />
          <Stack.Screen name="ResultSimple" component={ResultScreenSimple} />
          {/* Legacy screens — kept for compatibility */}
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Game" component={GameScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Result" component={ResultScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Intro" component={IntroScreen} />
          <Stack.Screen name="Competition" component={CompetitionScreen} />
          <Stack.Screen name="CompetitionResult" component={CompetitionResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <GameStoreProvider>
      <AppInner />
    </GameStoreProvider>
  );
}
