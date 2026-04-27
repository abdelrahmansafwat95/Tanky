import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { Feather } from "@expo/vector-icons";

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [empId, setEmpId] = useState("");
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!empId || !pin) return;
    setIsSubmitting(true);
    // Simulate network delay
    setTimeout(async () => {
      await login(empId, pin);
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: Math.max(insets.top, Platform.OS === "web" ? 67 : 0) + 40,
          paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 40,
          paddingHorizontal: 24,
          justifyContent: "space-between",
        }}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.accent }]}>
            <Feather name="droplet" size={32} color={colors.accentForeground} />
          </View>
          <Text style={[styles.title, { color: colors.primaryForeground }]}>
            FuelGo
          </Text>
          <Text style={[styles.subtitle, { color: colors.primaryForeground, opacity: 0.8 }]}>
            The trusted pocket companion for company fleets.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.primaryForeground }]}>Employee ID</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: "rgba(255,255,255,0.1)",
                color: colors.primaryForeground,
                borderColor: "rgba(255,255,255,0.2)",
              },
            ]}
            placeholder="EMP-XXXX"
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoCapitalize="characters"
            value={empId}
            onChangeText={setEmpId}
          />

          <Text style={[styles.label, { color: colors.primaryForeground }]}>PIN</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: "rgba(255,255,255,0.1)",
                color: colors.primaryForeground,
                borderColor: "rgba(255,255,255,0.2)",
              },
            ]}
            placeholder="••••"
            placeholderTextColor="rgba(255,255,255,0.4)"
            secureTextEntry
            keyboardType="number-pad"
            value={pin}
            onChangeText={setPin}
          />

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.accent, opacity: !empId || !pin ? 0.7 : 1 },
            ]}
            onPress={handleLogin}
            disabled={!empId || !pin || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.accentForeground} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.accentForeground }]}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 36,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 24,
  },
  form: {
    width: "100%",
    marginTop: 40,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  button: {
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
});
