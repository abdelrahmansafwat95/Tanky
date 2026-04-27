import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";

type ScanState = "chooser" | "scanning" | "verifying" | "authorized" | "dispensing" | "receipt";

export default function ScanScreen() {
  const colors = useColors();
  const router = useRouter();
  const [currentState, setCurrentState] = useState<ScanState>("chooser");
  const [litres, setLitres] = useState(0);
  const costPerLitre = 12.50; // Diesel mock

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let interval: NodeJS.Timer;

    if (currentState === "scanning") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      timer = setTimeout(() => {
        setCurrentState("verifying");
      }, 2000);
    } else if (currentState === "verifying") {
      timer = setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCurrentState("authorized");
      }, 2000);
    } else if (currentState === "authorized") {
      timer = setTimeout(() => {
        setCurrentState("dispensing");
      }, 2000);
    } else if (currentState === "dispensing") {
      interval = setInterval(() => {
        setLitres((prev) => {
          const next = prev + 1.5;
          if (next >= 45) { // Stop at 45L
            clearInterval(interval);
            setTimeout(() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setCurrentState("receipt");
            }, 1000);
            return 45;
          }
          return next;
        });
      }, 100);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(interval as any);
    };
  }, [currentState]);

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const renderContent = () => {
    switch (currentState) {
      case "chooser":
        return (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.content}>
            <Text style={[styles.title, { color: colors.foreground }]}>Ready to Fuel</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Position your phone near the pump's NFC tag or scan the QR code.
            </Text>
            <View style={styles.chooserButtons}>
              <TouchableOpacity 
                style={[styles.chooseBtn, { backgroundColor: colors.primary }]}
                onPress={() => setCurrentState("scanning")}
              >
                <MaterialCommunityIcons name="qrcode-scan" size={32} color={colors.primaryForeground} />
                <Text style={[styles.chooseText, { color: colors.primaryForeground }]}>Scan QR</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.chooseBtn, { backgroundColor: colors.secondary }]}
                onPress={() => setCurrentState("scanning")}
              >
                <MaterialCommunityIcons name="nfc" size={32} color={colors.secondaryForeground} />
                <Text style={[styles.chooseText, { color: colors.secondaryForeground }]}>Tap NFC</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        );

      case "scanning":
        return (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.content}>
            <View style={[styles.scannerBox, { borderColor: colors.accent }]} />
            <Text style={[styles.statusText, { color: colors.foreground }]}>Scanning...</Text>
          </Animated.View>
        );

      case "verifying":
        return (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.content}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.statusText, { color: colors.foreground, marginTop: 24 }]}>Verifying vehicle...</Text>
          </Animated.View>
        );

      case "authorized":
        return (
          <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={styles.content}>
            <View style={[styles.successIcon, { backgroundColor: colors.accent }]}>
              <Feather name="check" size={48} color={colors.accentForeground} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Authorized</Text>
            <View style={[styles.authCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.authStation, { color: colors.foreground }]}>Wataniya - Maadi</Text>
              <Text style={[styles.authLimit, { color: colors.mutedForeground }]}>Approved up to 100 L</Text>
            </View>
            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>Please begin fueling</Text>
          </Animated.View>
        );

      case "dispensing":
        return (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.content}>
            <Text style={[styles.dispensingTitle, { color: colors.mutedForeground }]}>Dispensing</Text>
            <Text style={[styles.litresText, { color: colors.foreground }]}>
              {litres.toFixed(1)} <Text style={styles.litresUnit}>L</Text>
            </Text>
            <Text style={[styles.costText, { color: colors.mutedForeground }]}>
              {(litres * costPerLitre).toFixed(2)} EGP
            </Text>
          </Animated.View>
        );

      case "receipt":
        return (
          <Animated.View entering={SlideInDown} style={styles.content}>
            <View style={[styles.successIcon, { backgroundColor: colors.accent, marginBottom: 16 }]}>
              <Feather name="check" size={32} color={colors.accentForeground} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Fueling Complete</Text>
            <View style={[styles.receiptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>Volume</Text>
                <Text style={[styles.receiptValue, { color: colors.foreground }]}>45.0 L</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>Total Cost</Text>
                <Text style={[styles.receiptValue, { color: colors.foreground }]}>562.50 EGP</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.doneButton, { backgroundColor: colors.primary }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.doneText, { color: colors.primaryForeground }]}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {currentState !== "receipt" && currentState !== "dispensing" && (
          <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
            <Feather name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.main}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

import { ActivityIndicator } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
  },
  cancelBtn: {
    padding: 8,
  },
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  chooserButtons: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  chooseBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  chooseText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginTop: 12,
  },
  scannerBox: {
    width: 250,
    height: 250,
    borderWidth: 4,
    borderRadius: 24,
    borderStyle: "dashed",
    marginBottom: 40,
  },
  statusText: {
    fontFamily: "Inter_500Medium",
    fontSize: 18,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  authCard: {
    width: "100%",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    marginVertical: 32,
  },
  authStation: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    marginBottom: 8,
  },
  authLimit: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  dispensingTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 20,
    marginBottom: 16,
  },
  litresText: {
    fontFamily: "Inter_700Bold",
    fontSize: 72,
    marginBottom: 8,
  },
  litresUnit: {
    fontSize: 32,
  },
  costText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
  },
  receiptCard: {
    width: "100%",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 32,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  receiptLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
  },
  receiptValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  doneButton: {
    width: "100%",
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
});
