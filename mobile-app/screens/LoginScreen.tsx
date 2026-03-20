import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import Toast from "react-native-toast-message";
import { useAuth } from "../hooks/useAuth";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { RootStackParamList } from "../types/navigation";
import { LinearGradient } from "expo-linear-gradient";

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) {
      Toast.show({ type: "error", text1: "Please fill in all fields." });
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      Toast.show({ type: "success", text1: "Logged in successfully!" });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2:
          error.response?.data?.message || "Please check your credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#2C5364", "#203A43", "#0F2027"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Sign in to your account</Text>
          <Input
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          <Button
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Sign in
          </Button>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.link}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 32,
    color: "#9d1a1aff", // Changed to white for better contrast
  },
  button: {
    backgroundColor: "#FF6F00",
  },
  linkText: {
    marginTop: 20,
    textAlign: "center",
    color: "#0046afff", // Changed to a lighter color for visibility
  },
  link: {
    color: "#FF6F00",
    fontWeight: "600",
  },
});

export default LoginScreen;
