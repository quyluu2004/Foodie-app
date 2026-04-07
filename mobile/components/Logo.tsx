import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  showSlogan?: boolean;
  slogan?: string;
  textColor?: string;
  sloganColor?: string;
}

export default function Logo({ 
  size = 'medium', 
  showText = true, 
  showSlogan = false,
  slogan = 'Khám phá ẩm thực Việt Nam',
  textColor,
  sloganColor
}: LogoProps) {
  const sizes = {
    small: { icon: 32, text: 14, slogan: 9, bunHeight: 8, pattyHeight: 6 },
    medium: { icon: 64, text: 24, slogan: 12, bunHeight: 16, pattyHeight: 12 },
    large: { icon: 120, text: 36, slogan: 16, bunHeight: 30, pattyHeight: 20 }
  };

  const currentSize = sizes[size];
  const iconSize = currentSize.icon;
  const bunHeight = currentSize.bunHeight;
  const pattyHeight = currentSize.pattyHeight;

  return (
    <View style={styles.container}>
      {/* Burger Icon */}
      <View style={[styles.iconContainer, { width: iconSize, height: iconSize * 0.85 }]}>
        {/* Top Bun */}
        <View style={[
          styles.topBun, 
          { 
            width: iconSize * 0.9, 
            height: bunHeight * 1.5,
            borderRadius: bunHeight * 1.5
          }
        ]}>
          {/* Sesame Seeds */}
          <View style={[styles.sesameSeed, { left: iconSize * 0.25, top: bunHeight * 0.3 }]} />
          <View style={[styles.sesameSeed, { left: iconSize * 0.5, top: bunHeight * 0.5 }]} />
          <View style={[styles.sesameSeed, { left: iconSize * 0.7, top: bunHeight * 0.2 }]} />
        </View>

        {/* Middle Layer (Patty) */}
        <View style={[
          styles.patty, 
          { 
            width: iconSize * 0.85, 
            height: pattyHeight,
            borderRadius: pattyHeight / 2
          }
        ]}>
          {/* Bookmark Flag */}
          <View style={styles.bookmarkFlag}>
            <View style={styles.bookmarkTriangle} />
            <View style={styles.bookmarkRect} />
          </View>
        </View>

        {/* Bottom Bun */}
        <View style={[
          styles.bottomBun, 
          { 
            width: iconSize * 0.9, 
            height: bunHeight,
            borderRadius: bunHeight
          }
        ]}>
          {/* Cheese Drips */}
          <View style={[styles.cheeseDrip, { left: iconSize * 0.2 }]} />
          <View style={[styles.cheeseDrip, { left: iconSize * 0.45 }]} />
          <View style={[styles.cheeseDrip, { left: iconSize * 0.7 }]} />
        </View>
      </View>

      {/* Text */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[
            styles.foodieText, 
            { 
              fontSize: currentSize.text,
              color: textColor || '#D2691E'
            }
          ]}>
            FOODIE
          </Text>
          {showSlogan && slogan && (
            <Text style={[
              styles.sloganText, 
              { 
                fontSize: currentSize.slogan,
                color: sloganColor || '#FF8C42'
              }
            ]}>
              {slogan.toUpperCase()}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 8,
    position: 'relative',
  },
  topBun: {
    backgroundColor: '#FF8C42',
    position: 'relative',
    marginBottom: 2,
  },
  sesameSeed: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  patty: {
    backgroundColor: '#D2691E',
    position: 'relative',
    marginBottom: 2,
  },
  bookmarkFlag: {
    position: 'absolute',
    left: 8,
    top: -4,
    width: 12,
    height: 16,
  },
  bookmarkTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  bookmarkRect: {
    position: 'absolute',
    top: 4,
    left: 0,
    width: 4,
    height: 12,
    backgroundColor: '#FFFFFF',
  },
  bottomBun: {
    backgroundColor: '#FF8C42',
    position: 'relative',
  },
  cheeseDrip: {
    position: 'absolute',
    top: -4,
    width: 3,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  foodieText: {
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: '#D2691E',
    letterSpacing: 1,
  },
  sloganText: {
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    color: '#FF8C42',
    marginTop: 4,
    letterSpacing: 0.5,
    opacity: 0.8,
  },
});

