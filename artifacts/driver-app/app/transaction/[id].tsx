import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { TRANSACTIONS, STATIONS, DRIVER_PROFILE } from "@/constants/mockData";
import { Feather } from "@expo/vector-icons";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const transaction = TRANSACTIONS.find(t => t.id === id);
  const station = transaction ? STATIONS.find(s => s.id === transaction.stationId) : null;

  if (!transaction || !station) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: colors.foreground }}>Transaction not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleReport = () => {
    if (Platform.OS === "web") {
      alert("Support team will be notified about " + transaction.id);
    } else {
      Alert.alert("Report Issue", "Support team will be notified about " + transaction.id);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === "web" ? 67 : 0) + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="x" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Receipt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.receiptContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.receiptHeader}>
            <View style={[styles.successIcon, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
              <Feather name="check" size={24} color="#10B981" />
            </View>
            <Text style={[styles.stationName, { color: colors.foreground }]}>{station.name}</Text>
            <Text style={[styles.dateTime, { color: colors.mutedForeground }]}>
              {new Date(transaction.date).toLocaleDateString('en-US', { 
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' 
              })}
            </Text>
          </View>

          <View style={[styles.divider, { borderTopColor: colors.border }]} />

          <View style={styles.detailsList}>
            <DetailRow label="Vehicle" value={DRIVER_PROFILE.vehicle.plate} colors={colors} />
            <DetailRow label="Driver" value={DRIVER_PROFILE.name} colors={colors} />
            <DetailRow label="Fuel Type" value={transaction.fuelType} colors={colors} />
            <DetailRow label="Volume" value={`${transaction.litres.toFixed(1)} L`} colors={colors} />
            <DetailRow label="Price per Litre" value={`${transaction.pricePerLitre.toFixed(2)} EGP`} colors={colors} />
          </View>

          <View style={[styles.divider, { borderTopColor: colors.border }]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: colors.foreground }]}>{transaction.amount.toFixed(2)} EGP</Text>
          </View>

          <View style={[styles.divider, { borderTopColor: colors.border, borderStyle: "dashed" }]} />
          
          <View style={styles.footerDetails}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Auth Code: AUTH-74892A</Text>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>TXN ID: {transaction.id}</Text>
          </View>

        </View>

        <TouchableOpacity 
          style={[styles.reportBtn, { backgroundColor: colors.secondary }]}
          onPress={handleReport}
        >
          <Feather name="flag" size={20} color={colors.foreground} />
          <Text style={[styles.reportText, { color: colors.foreground }]}>Report a problem</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value, colors }: { label: string, value: string, colors: any }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
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
  receiptContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    marginBottom: 24,
  },
  receiptHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  stationName: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  dateTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  divider: {
    borderTopWidth: 1,
    marginVertical: 16,
  },
  detailsList: {
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  detailValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
  },
  totalValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  footerDetails: {
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  reportBtn: {
    flexDirection: "row",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  reportText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginLeft: 8,
  },
});
