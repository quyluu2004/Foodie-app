import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { authAPI, recipesAPI } from '../services/api';

export default function APITestScreen() {
  const [status, setStatus] = useState('Testing...');
  const [token, setToken] = useState<string | null>(null);

  const testConnection = async () => {
    try {
      setStatus('Testing connection...');
      
      // Test basic connection
  // Use resolved API base so tests work on device
  const apiBase = require('../config/api').getDefaultApiBase();
  const response = await fetch(apiBase.replace(/\/api\/?$/, '/') );
      const data = await response.json();
      
      if (data.ok) {
        setStatus('✅ Backend connected successfully!');
      } else {
        setStatus('❌ Backend response error');
      }
    } catch (error) {
      setStatus(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testRegister = async () => {
    try {
      setStatus('Testing registration...');
      
      const response = await authAPI.register(
        `test${Date.now()}@example.com`,
        '123456',
        'Test User'
      );
      
      setToken(response.token);
      setStatus('✅ Registration successful!');
    } catch (error) {
      setStatus(`❌ Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testLogin = async () => {
    try {
      setStatus('Testing login...');
      
      const response = await authAPI.login('test@example.com', '123456');
      
      setToken(response.token);
      setStatus('✅ Login successful!');
    } catch (error) {
      setStatus(`❌ Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testRecipes = async () => {
    if (!token) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    try {
      setStatus('Testing recipes API...');
      
      const response = await recipesAPI.getAll(1, 5);
      
      setStatus(`✅ Recipes loaded: ${response.items.length} items`);
    } catch (error) {
      setStatus(`❌ Recipes failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testConnection}>
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testRegister}>
          <Text style={styles.buttonText}>Test Register</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testLogin}>
          <Text style={styles.buttonText}>Test Login</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, !token && styles.buttonDisabled]} 
          onPress={testRecipes}
          disabled={!token}
        >
          <Text style={styles.buttonText}>Test Recipes</Text>
        </TouchableOpacity>
      </View>

      {token && (
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenLabel}>Token:</Text>
          <Text style={styles.tokenText}>{token.substring(0, 50)}...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1A1A1A',
  },
  statusContainer: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#374151',
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    backgroundColor: '#FF8C42',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tokenContainer: {
    marginTop: 30,
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 8,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
  },
  tokenText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
});




