import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Test } from '../../types/api';
import Button from '../common/Button';

interface TestCardProps {
  test: Test;
  onPress: () => void;
}

const TestCard: React.FC<TestCardProps> = ({ test, onPress }) => {
    return (
      <View style={styles.card}>
        <View>
          <Text style={styles.name}>{test.name}</Text>
          <Text style={styles.description}>{test.description}</Text>
        </View>
        <Button onPress={onPress}>Start Test</Button>
      </View>
    );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 16,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#8e9eab",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    marginBottom: 16,
  },
});

export default TestCard;
