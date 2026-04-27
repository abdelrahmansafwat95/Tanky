import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { STATIONS } from "@/constants/mockData";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";

export default function StationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "Open Now" | "24/7">("All");

  const filteredStations = STATIONS.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.address.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || (filter === "Open Now" && s.openNow) || (filter === "24/7" && s.is24_7);
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[
        styles.header, 
        { 
          paddingTop: Math.max(insets.top, Platform.OS === "web" ? 67 : 0) + 16,
          backgroundColor: colors.card,
          borderBottomColor: colors.border
        }
      ]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Stations</Text>
        
        <View style={[styles.searchBar, { backgroundColor: colors.secondary }]}>
          <Feather name="search" size={20} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search by name or area"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filters}>
          {(["All", "Open Now", "24/7"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                { backgroundColor: filter === f ? colors.primary : colors.secondary }
              ]}
              onPress={() => setFilter(f)}
            >
              <Text style={[
                styles.filterText,
                { color: filter === f ? colors.primaryForeground : colors.foreground }
              ]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredStations}
        keyExtractor={item => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 100
        }}
        renderItem={({ item }) => (
          <Link href={`/station/${item.id}`} asChild>
            <TouchableOpacity style={[styles.stationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.stationHeader}>
                <View style={[styles.brandIcon, { backgroundColor: colors.secondary }]}>
                  <MaterialCommunityIcons name="gas-station" size={24} color={colors.primary} />
                </View>
                <View style={styles.stationInfo}>
                  <Text style={[styles.stationName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.stationAddress, { color: colors.mutedForeground }]}>{item.address}</Text>
                </View>
                <View style={styles.distanceBadge}>
                  <Text style={[styles.distanceText, { color: colors.foreground }]}>{item.distance}</Text>
                </View>
              </View>
              
              <View style={[styles.fuelPrices, { borderTopColor: colors.border }]}>
                <View style={styles.priceItem}>
                  <Text style={[styles.fuelType, { color: colors.mutedForeground }]}>Diesel</Text>
                  <Text style={[styles.priceValue, { color: colors.foreground }]}>{item.fuelPrices.diesel.toFixed(2)}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={[styles.fuelType, { color: colors.mutedForeground }]}>92</Text>
                  <Text style={[styles.priceValue, { color: colors.foreground }]}>{item.fuelPrices.octane92.toFixed(2)}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={[styles.fuelType, { color: colors.mutedForeground }]}>95</Text>
                  <Text style={[styles.priceValue, { color: colors.foreground }]}>{item.fuelPrices.octane95.toFixed(2)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    height: "100%",
  },
  filters: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  stationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  stationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginBottom: 4,
  },
  stationAddress: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  distanceBadge: {
    marginLeft: 8,
  },
  distanceText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  fuelPrices: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  priceItem: {
    alignItems: "center",
    flex: 1,
  },
  fuelType: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginBottom: 4,
  },
  priceValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
