import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { STATIONS } from "@/constants/mockData";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

export default function StationDetailScreen() {
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const station = STATIONS.find(s => s.id === id);

  if (!station) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: colors.foreground }}>Station not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDirections = () => {
    if (Platform.OS === "web") {
      alert("Opening Maps for " + station.name);
    } else {
      Alert.alert("Directions", "Opening Maps for " + station.name);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === "web" ? 67 : 0) + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Station Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="gas-station" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{station.name}</Text>
          <Text style={[styles.address, { color: colors.mutedForeground }]}>{station.address}</Text>
          
          <View style={styles.badges}>
            {station.openNow && (
              <View style={[styles.badge, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                <View style={[styles.dot, { backgroundColor: "#10B981" }]} />
                <Text style={[styles.badgeText, { color: "#10B981" }]}>Open Now</Text>
              </View>
            )}
            {station.is24_7 && (
              <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                <Feather name="clock" size={12} color={colors.foreground} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: colors.foreground }]}>24/7</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
              <Feather name="map-pin" size={12} color={colors.foreground} style={{ marginRight: 4 }} />
              <Text style={[styles.badgeText, { color: colors.foreground }]}>{station.distance}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.directionsBtn, { backgroundColor: colors.primary }]}
          onPress={handleDirections}
        >
          <Feather name="navigation" size={20} color={colors.primaryForeground} />
          <Text style={[styles.directionsText, { color: colors.primaryForeground }]}>Get Directions</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Fuel Prices</Text>
        <View style={[styles.pricesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.priceRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fuelLabel, { color: colors.foreground }]}>Diesel</Text>
            <Text style={[styles.priceValue, { color: colors.foreground }]}>
              {station.fuelPrices.diesel.toFixed(2)} <Text style={styles.currency}>EGP/L</Text>
            </Text>
          </View>
          <View style={[styles.priceRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fuelLabel, { color: colors.foreground }]}>Octane 92</Text>
            <Text style={[styles.priceValue, { color: colors.foreground }]}>
              {station.fuelPrices.octane92.toFixed(2)} <Text style={styles.currency}>EGP/L</Text>
            </Text>
          </View>
          <View style={[styles.priceRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.fuelLabel, { color: colors.foreground }]}>Octane 95</Text>
            <Text style={[styles.priceValue, { color: colors.foreground }]}>
              {station.fuelPrices.octane95.toFixed(2)} <Text style={styles.currency}>EGP/L</Text>
            </Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
  },
  scrollContent: {
    padding: 24,
  },
  hero: {
    alignItems: "center",
    marginBottom: 32,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  address: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  directionsBtn: {
    flexDirection: "row",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  directionsText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginLeft: 8,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    marginBottom: 16,
  },
  pricesCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  fuelLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
  },
  priceValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  currency: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  }
});
