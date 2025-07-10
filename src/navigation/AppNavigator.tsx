import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import NoteEditorScreen from '../screens/NoteEditorScreen';

// Define the types for your navigation parameters
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  NoteEditor: { noteId?: string; initialContent?: string }; 
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login" 
        screenOptions={{
          headerShown: false, 
          cardStyle: { backgroundColor: '#121212' },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NoteEditor" component={NoteEditorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;