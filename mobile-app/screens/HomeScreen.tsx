import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import Button from '../components/common/Button';

// Define the navigation type for this screen
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const windowWidth = Dimensions.get("window").width;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to SAI Fit</Text>
          <Text style={styles.subtitle}>
            Your journey to better fitness starts here. Track your performance,{" "}
            compete with others, and reach your full potential.
          </Text>
          <Image
            source={{
              uri: "https://res.cloudinary.com/your-cloud-name/image/upload/v123456789/your-image.jpg",
            }}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Sign In"
            onPress={() => navigation.navigate("Login")}
            style={styles.button}
          />
          <Button
            title="Get Started"
            onPress={() => navigation.navigate("Register")}
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eef2f3",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  heroImage: {
    width: windowWidth * 0.85,
    height: windowWidth * 0.6,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    backgroundColor: "#FF6F00",
  },
});

export default HomeScreen;
