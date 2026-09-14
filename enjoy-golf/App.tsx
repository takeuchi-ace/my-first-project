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
import TitleScreen from './src/screens/TitleScreen';
import CharacterSelectScreen from './src/screens/CharacterSelectScreen';
import GameScreenSimple from './src/screens/GameScreenSimple';
import ResultScreenSimple from './src/screens/ResultScreenSimple';
import IntroScreen from './src/screens/IntroScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RunResultScreen from './src/screens/RunResultScreen';
import ItemsScreen from './src/screens/ItemsScreen';
import CompetitionScreen from './src/screens/CompetitionScreen';
import CompetitionResultScreen from './src/screens/CompetitionResultScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppInner() {
  const { hydrated } = useGameStore();

  useEffect(() => {
    // 端末やブラウザによっては拒否される（Web では必ず失敗する）。
    // 掴まないと未処理の Promise 拒否がコンソールに積まれる
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
      () => {}
    );
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
          initialRouteName="Title"
          screenOptions={{
            contentStyle: { backgroundColor: '#1a472a' },
            animation: 'slide_from_right',
            headerShown: true,
            header: () => <WoodHeader />,
          }}
        >
          {/* スプラッシュ〜タイトルは全画面（木目ヘッダーを出さない） */}
          <Stack.Screen
            name="Title"
            component={TitleScreen}
            options={{ headerShown: false, animation: 'fade' }}
          />
          <Stack.Screen name="CharacterSelect" component={CharacterSelectScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="GameSimple" component={GameScreenSimple} />
          <Stack.Screen name="ResultSimple" component={ResultScreenSimple} />
          {/* 幻想画のカットインを木目ヘッダー無しの全画面で見せる */}
          <Stack.Screen
            name="Intro"
            component={IntroScreen}
            options={{ headerShown: false, animation: 'fade' }}
          />
          <Stack.Screen name="RunResult" component={RunResultScreen} />
          <Stack.Screen name="Items" component={ItemsScreen} />
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
