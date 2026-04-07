import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { recipeAPI, authAPI } from '@/contexts/api';

export default function TestAPIScreen() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const { user, token } = useAuth();

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAuth = async () => {
    try {
      setLoading(true);
      addResult('Testing authentication...');
      
      const response = await authAPI.login('test@example.com', 'password123');
      addResult(`✅ Login successful: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      addResult(`❌ Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testRecipes = async () => {
    try {
      setLoading(true);
      addResult('Testing recipes API...');
      
      const response = await recipeAPI.getAll();
      addResult(`✅ Recipes loaded: ${response.data.length} recipes`);
    } catch (error: any) {
      addResult(`❌ Recipes failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateRecipe = async () => {
    if (!token) {
      addResult('❌ No token available for authenticated request');
      return;
    }

    try {
      setLoading(true);
      addResult('Testing create recipe...');
      
      const recipeData = {
        title: 'Test Recipe',
        description: 'This is a test recipe',
        category: 'Test',
        cookTimeMinutes: 30,
        difficulty: 'Dễ',
        servings: 4,
      };
      
      const response = await recipeAPI.create(recipeData);
      addResult(`✅ Recipe created: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      addResult(`❌ Create recipe failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            API Test Screen
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Test backend connectivity and authentication
          </ThemedText>
        </View>

        <View style={styles.statusContainer}>
          <ThemedText style={styles.statusTitle}>Current Status:</ThemedText>
          <ThemedText style={styles.statusText}>
            User: {user ? user.name : 'Not logged in'}
          </ThemedText>
          <ThemedText style={styles.statusText}>
            Token: {token ? 'Available' : 'Not available'}
          </ThemedText>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={testAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Authentication</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={testRecipes}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Get Recipes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.tertiaryButton]}
            onPress={testCreateRecipe}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Create Recipe</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearResults}
          >
            <Text style={styles.buttonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsContainer}>
          <ThemedText style={styles.resultsTitle}>Test Results:</ThemedText>
          {results.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FF8C42',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statusContainer: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    margin: 20,
    borderRadius: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  buttonContainer: {
    padding: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF8C42',
  },
  secondaryButton: {
    backgroundColor: '#10B981',
  },
  tertiaryButton: {
    backgroundColor: '#3B82F6',
  },
  clearButton: {
    backgroundColor: '#6B7280',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  resultsContainer: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    margin: 20,
    borderRadius: 12,
    maxHeight: 300,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'Inter_400Regular',
  },
});


