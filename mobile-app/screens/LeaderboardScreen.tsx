import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../lib/axios';
import { LeaderboardEntry, Test } from '../types/api';
import { Picker } from '@react-native-picker/picker';

const LeaderboardScreen = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTests = async () => {
    try {
      const response = await api.get("/tests");
      setTests(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedTest(response.data.data[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch tests", error);
    }
  };

  const fetchLeaderboard = async (testId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/leaderboard/${testId}`);
      setLeaderboard(response.data.data);
    } catch (error) {
      console.error("Failed to fetch leaderboard data", error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  useEffect(() => {
    if (selectedTest) {
      fetchLeaderboard(selectedTest);
    }
  }, [selectedTest]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (selectedTest) {
      fetchLeaderboard(selectedTest);
    }
  }, [selectedTest]);

  const renderBadge = (rank: number) => {
    if (rank === 1) {
      return <Text style={[styles.badge, styles.goldBadge]}>🥇</Text>;
    }
    if (rank === 2) {
      return <Text style={[styles.badge, styles.silverBadge]}>🥈</Text>;
    }
    if (rank === 3) {
      return <Text style={[styles.badge, styles.bronzeBadge]}>🥉</Text>;
    }
    return <Text style={styles.rank}>{rank}</Text>;
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: LeaderboardEntry;
    index: number;
  }) => (
    <View style={styles.row}>
      <View style={styles.rankCell}>{renderBadge(index + 1)}</View>
      <Text style={[styles.cell, styles.name]}>{item.name}</Text>
      <Text style={[styles.cell, styles.location]}>
        {item.location?.state || "N/A"}
      </Text>
      <Text style={[styles.cell, styles.score]}>{item.score.toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedTest}
          onValueChange={(itemValue) => setSelectedTest(itemValue)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {tests.map((test) => (
            <Picker.Item key={test._id} label={test.name} value={test._id} />
          ))}
        </Picker>
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.rankCell]}>Rank</Text>
        <Text style={[styles.headerCell, styles.name]}>Athlete</Text>
        <Text style={[styles.headerCell, styles.location]}>Location</Text>
        <Text style={[styles.headerCell, styles.score]}>Score</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#FF6F00"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.athleteId}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No data available for this leaderboard.
            </Text>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#eef2f3",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#8e9eab",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  pickerItem: {
    color: "#1f2937",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#8e9eab",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  headerCell: {
    fontWeight: "bold",
    color: "#ffffff",
  },
  cell: {
    fontSize: 14,
    color: "#1f2937",
  },
  rankCell: {
    flex: 0.15,
    alignItems: "center",
    justifyContent: "center",
  },
  rank: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  badge: {
    fontSize: 20,
  },
  name: { flex: 0.4 },
  location: { flex: 0.25 },
  score: {
    flex: 0.2,
    textAlign: "right",
    fontWeight: "bold",
    color: "#FF6F00",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#6b7280",
  },
});

export default LeaderboardScreen;
