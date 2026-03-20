import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import api from "../lib/axios";
import { Submission, Test } from "../types/api";
import { RootStackParamList } from "../types/navigation";
import ProgressChart from "../components/dashboard/ProgressChart";
import TestCard from "../components/tests/TestCard";
import Spinner from "../components/common/Spinner";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/common/Button";

type DashboardScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Main"
>;

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { user, logout } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [submissionsRes, testsRes] = await Promise.all([
        api.get("/submissions"),
        api.get("/tests"),
      ]);
      setSubmissions(submissionsRes.data.data);
      setTests(testsRes.data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Handler for the "Start Test" button
  const handleStartTest = (testId: string, testName: string) => {
    navigation.navigate("Test", { testId, testName });
  };

  if (loading && !refreshing) {
    return <Spinner />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with User Info */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.saiFitText}>SAI Fit</Text>
          <Text style={styles.greetingText}>Hi, {user?.name || "Rohan"}!</Text>
        </View>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: "https://placehold.co/40x40/png" }} // Placeholder image
            style={styles.profileImage}
          />
        </View>
      </View>

      {/* Weekly Goal Card */}
      <View style={styles.weeklyGoalCard}>
        <View style={styles.goalInfo}>
          <Text style={styles.goalLabel}>Weekly Goal</Text>
          <Text style={styles.goalProgress}>
            <Text style={styles.goalCompleted}>2</Text>/4
            <Text style={styles.goalStatusText}> Completed</Text>
          </Text>
        </View>
        <ProgressChart completed={2} total={4} />
      </View>

      {/* Badges Section */}
      <Text style={styles.sectionTitle}>Your Badges</Text>
      <View style={styles.badgesContainer}>
        <View style={styles.badgeItem}>
          <Image
            source={{ uri: "https://placehold.co/50x50/png" }}
            style={styles.badgeImage}
          />
          <Text style={styles.badgeText}>First Test</Text>
        </View>
        <View style={styles.badgeItem}>
          <Image
            source={{ uri: "https://placehold.co/50x50/png" }}
            style={styles.badgeImage}
          />
          <Text style={styles.badgeText}>Shuttle Run</Text>
        </View>
      </View>

      {/* Standard Tests Section */}
      <Text style={styles.sectionTitle}>Standard Tests</Text>
      <View style={styles.testsSection}>
        {tests.map((test) => (
          <TestCard
            key={test._id}
            test={test}
            onPress={() => handleStartTest(test._id, test.name)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef2f3",
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "column",
  },
  saiFitText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6F00",
  },
  greetingText: {
    fontSize: 16,
    color: "#1f2937",
  },
  profileImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#FF6F00",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  weeklyGoalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  goalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  goalProgress: {
    fontSize: 16,
    color: "#6b7280",
  },
  goalCompleted: {
    color: "#FF6F00",
    fontWeight: "bold",
  },
  goalStatusText: {
    color: "#6b7280",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
    marginTop: 16,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  badgeItem: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    width: 150, // Fixed width for badges
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginRight: 10,
  },
  badgeImage: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  testsSection: {
    marginTop: 24,
  },
});

export default DashboardScreen;
