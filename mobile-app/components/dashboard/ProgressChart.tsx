import React from 'react';
import { View, Text, StyleSheet, Image } from "react-native";

const ProgressCircle = ({ progress, size, strokeWidth }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: "#e5e7eb",
          opacity: 0.6,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: "#FF6F00",
          transform: [{ rotateZ: "-90deg" }],
        }}
      />
      <Text style={styles.goalProgressText}>{`${Math.round(
        progress * 100
      )}%`}</Text>
    </View>
  );
};

interface ProgressChartProps {
  completed: number;
  total: number;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ completed, total }) => {
  const progress = completed / total;

  return (
    <View style={styles.card}>
      <View style={styles.chartContainer}>
        <ProgressCircle progress={progress} size={80} strokeWidth={8} />
      </View>
      <Text style={styles.goalLabel}>Weekly Goal</Text>
      <Text style={styles.goalStatusText}>
        <Text style={styles.goalCompletedText}>{completed}</Text>/{total}{" "}
        Completed
      </Text>
      <View style={styles.workoutIconContainer}>
        <Image
          source={{ uri: "https://placehold.co/80x80/png" }}
          style={styles.workoutIcon}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    width: "100%",
  },
  chartContainer: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  goalProgressText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
  },
  goalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  goalStatusText: {
    fontSize: 14,
    color: "#6b7280",
  },
  goalCompletedText: {
    color: "#FF6F00",
    fontWeight: "bold",
  },
  workoutIconContainer: {
    position: "absolute",
    right: 24,
    top: 24,
    backgroundColor: "#f3f4f6",
    borderRadius: 50,
    padding: 8,
  },
  workoutIcon: {
    width: 40,
    height: 40,
  },
});

export default ProgressChart;
