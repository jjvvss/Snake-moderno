import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { setLocale, getSystemLanguage } from './src/i18n';
import { getLanguage } from './src/utils/storage';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#000', padding: 20, justifyContent: 'center' }}>
          <Text style={{ color: '#FF0066', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            ERROR:
          </Text>
          <ScrollView>
            <Text style={{ color: '#FFF', fontSize: 12 }}>
              {this.state.error.toString()}
              {'\n\n'}
              {this.state.error.stack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const savedLang = await getLanguage();
        const lang = savedLang || getSystemLanguage();
        setLocale(lang);
      } catch {
        setLocale('en');
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) return null;

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor="#000000" />
          <AppNavigator />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
