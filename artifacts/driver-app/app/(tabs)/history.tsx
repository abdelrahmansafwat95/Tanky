import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { TRANSACTIONS, STATIONS } from "@/constants/mockData";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
        <Text style={[styles.title, { color: colors.foreground }]}>History</Text>
      </View>

      <FlatList
        data={TRANSACTIONS}
        keyExtractor={item => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 100
        }}
        renderItem={({ item }) => {
          const station = STATIONS.find(s => s.id === item.stationId);
          return (
            <TouchableOpacity
              onPress={() => router.push(`/transaction/${item.id}`)}
              style={[styles.transactionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
                <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
                  <Feather name="droplet" size={24} color={colors.primary} />
                </View>
                <View style={styles.infoContainer}>
                  <Text style={[styles.stationName, { color: colors.foreground }]}>{station?.name}</Text>
                  <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                    {new Date(item.date).toLocaleDateString('en-US', { 
                      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                    })}
                  </Text>
                </View>
                <View style={styles.amountContainer}>
                  <Text style={[styles.amountText, { color: colors.foreground }]}>-{item.amount} EGP</Text>
                  <Text style={[styles.litresText, { color: colors.mutedForeground }]}>{item.litres} L</Text>
                </View>
              </TouchableOpacity>
          );
        }}
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
  },
  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  stationName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginBottom: 4,
  },
  dateText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amountText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginBottom: 4,
  },
  litresText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
});
