import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isUser, timestamp }) => {
  // Use useMemo to prevent re-parsing on every render unless message changes
  const parts = useMemo(() => {
    try {
      if (!message) return [{ type: 'text', content: '' }];

      // Regex clean and robust:
      // Priority:
      // 1. **[RECIPE:...]** (Bold wrapped recipe) -> Extract name
      // 2. [RECIPE:...] (Normal recipe) -> Extract name
      // 3. **...** (Normal bold)
      const regex = /(\*\*\[RECIPE:[^:]+:([^\]]+)\]\*\*|\[RECIPE:[^:]+:([^\]]+)\]|\*\*[^*]+\*\*)/g;
      const result: Array<{ type: 'text' | 'bold' | 'recipe'; content: string }> = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(message)) !== null) {
        // Text before match
        if (match.index > lastIndex) {
          let textPart = message.substring(lastIndex, match.index);
          textPart = textPart.replace(/\*/g, '');
          if (textPart) {
            result.push({ type: 'text', content: textPart });
          }
        }

        const fullMatch = match[0];

        if (fullMatch.startsWith('**[RECIPE:')) {
          // Case 1: **[RECIPE:id:Name]** - capture group 2 is name
          result.push({ type: 'recipe', content: match[2] });
        } else if (fullMatch.startsWith('[RECIPE:')) {
          // Case 2: [RECIPE:id:Name] - capture group 3 is name
          result.push({ type: 'recipe', content: match[3] });
        } else if (fullMatch.startsWith('**')) {
          // Case 3: **Bold**
          const boldContent = fullMatch.substring(2, fullMatch.length - 2);
          result.push({ type: 'bold', content: boldContent });
        }

        lastIndex = match.index + fullMatch.length;
      }

      // Remaining text
      if (lastIndex < message.length) {
        let textPart = message.substring(lastIndex);
        textPart = textPart.replace(/\*/g, '');
        if (textPart) {
          result.push({ type: 'text', content: textPart });
        }
      }

      if (result.length === 0) {
        return [{ type: 'text', content: message.replace(/\*/g, '') }];
      }

      return result;
    } catch (error) {
      console.error('Error parsing chat message:', error);
      // Fallback to raw text in case of error
      return [{ type: 'text', content: message }];
    }
  }, [message]);

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <View style={styles.messageContainer}>
          {parts.map((part, index) => (
            <Text
              key={index}
              style={[
                styles.message,
                isUser ? styles.userMessage : styles.aiMessage,
                part.type === 'bold' && styles.boldText,
                part.type === 'recipe' && styles.recipeName
              ]}
            >
              {part.content}
            </Text>
          ))}
        </View>
        {timestamp && (
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
            {timestamp}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#FF8C42',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  userMessage: {
    color: '#FFFFFF',
  },
  aiMessage: {
    color: '#1F2937',
  },
  recipeName: {
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: '#FF8C42',
  },
  boldText: {
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.6,
  },
  userTimestamp: {
    color: '#FFFFFF',
  },
  aiTimestamp: {
    color: '#6B7280',
  },
});
