
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Colors, farmGreen } from '@/constants/Colors';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:3000';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AdviceScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { token } = useAuth();
  
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }

    const userMessage: Message = { role: 'user', content: question };
    setMessages([...messages, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      console.log('Asking AI for farming advice:', question);
      const response = await fetch(`${BACKEND_URL}/api/ai/farming-advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ question: userMessage.content }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Received AI farming advice');
        const assistantMessage: Message = { role: 'assistant', content: data.advice };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get advice');
      }
    } catch (error: any) {
      console.error('Error getting advice:', error);
      Alert.alert('Error', error.message || 'Could not get advice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Farming Advice',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol
                  ios_icon_name="message.fill"
                  android_material_icon_name="chat"
                  size={64}
                  color={colors.icon}
                />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Ask Me Anything
                </Text>
                <Text style={[styles.emptyDescription, { color: colors.icon }]}>
                  Get expert advice on growing crops, selling produce, managing your farm, and more
                </Text>
              </View>
            ) : (
              <>
                {messages.map((message, index) => (
                  <View
                    key={index}
                    style={[
                      styles.messageBubble,
                      {
                        backgroundColor: message.role === 'user' ? farmGreen : colors.card,
                        alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        { color: message.role === 'user' ? '#fff' : colors.text },
                      ]}
                    >
                      {message.content}
                    </Text>
                  </View>
                ))}
                {loading && (
                  <View style={[styles.messageBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ActivityIndicator color={farmGreen} />
                  </View>
                )}
              </>
            )}
          </ScrollView>

          <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Ask a farming question..."
              placeholderTextColor={colors.icon}
              value={question}
              onChangeText={setQuestion}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: farmGreen }]}
              onPress={askQuestion}
              disabled={loading || !question.trim()}
            >
              <IconSymbol
                ios_icon_name="arrow.up"
                android_material_icon_name="send"
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
