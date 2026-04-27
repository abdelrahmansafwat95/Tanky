import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { DRIVER_PROFILE, TRANSACTIONS, STATIONS } from "@/constants/mockData";
import { Link, useRouter } from "expo-router";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { budget } = DRIVER_PROFILE;
  const budgetPercentage = (budget.used / budget.total) * 100;
  
  const recentTransactions = TRANSACTIONS.slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, Platform.OS === "web" ? 67 : 0) + 16,
          paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 100,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good morning,</Text>
            <Text style={[styles.name, { color: colors.foreground }]}>{DRIVER_PROFILE.name}</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.avatarText, { color: colors.secondaryForeground }]}>
              {DRIVER_PROFILE.name.split(" ").map(n => n[0]).join("")}
            </Text>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={[styles.vehicleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.vehicleIcon}>
            <MaterialCommunityIcons name="truck-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.vehicleDetails}>
            <Text style={[styles.vehicleMake, { color: colors.foreground }]}>{DRIVER_PROFILE.vehicle.makeModel}</Text>
            <Text style={[styles.vehiclePlate, { color: colors.mutedForeground }]}>{DRIVER_PROFILE.vehicle.plate}</Text>
          </View>
        </View>

        {/* Budget Card */}
        <View style={[styles.budgetCard, { backgroundColor: colors.primary }]}>
          <Text style={[styles.budgetTitle, { color: "rgba(255,255,255,0.8)" }]}>Monthly Budget</Text>
          <View style={styles.budgetRow}>
            <View>
              <Text style={[styles.budgetAmount, { color: "#ffffff" }]}>
                {budget.used.toLocaleString()} <Text style={styles.currency}>EGP</Text>
              </Text>
              <Text style={[styles.budgetTotal, { color: "rgba(255,255,255,0.6)" }]}>
                of {budget.total.toLocaleString()} EGP
              </Text>
            </View>
            <View style={styles.progressCircle}>
              <View style={[styles.progressInner, { backgroundColor: colors.primary }]}>
                <Text style={[styles.progressText, { color: "#ffffff" }]}>{Math.round(budgetPercentage)}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Scan CTA */}
        <TouchableOpacity 
          style={[styles.scanButton, { backgroundColor: colors.accent }]}
          activeOpacity={0.8}
          onPress={() => router.push("/scan")}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={32} color={colors.accentForeground} />
          <Text style={[styles.scanText, { color: colors.accentForeground }]}>Scan to Fuel</Text>
        </TouchableOpacity>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Transactions</Text>
          <Link href="/(tabs)/history" asChild>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.transactionsList}>
          {recentTransactions.map((txn, index) => {
            const station = STATIONS.find(s => s.id === txn.stationId);
            return (
              <Link href={`/transaction/${txn.id}`} asChild key={txn.id}>
                <TouchableOpacity style={[
                  styles.transactionItem,
                  { borderBottomColor: colors.border },
                  index === recentTransactions.length - 1 && { borderBottomWidth: 0 }
                ]}>
                  <View style={[styles.txnIcon, { backgroundColor: colors.secondary }]}>
                    <Feather name="droplet" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.txnDetails}>
                    <Text style={[styles.txnStation, { color: colors.foreground }]}>{station?.name}</Text>
                    <Text style={[styles.txnDate, { color: colors.mutedForeground }]}>
                      {new Date(txn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.txnAmountContainer}>
                    <Text style={[styles.txnAmount, { color: colors.foreground }]}>-{txn.amount} EGP</Text>
                    <Text style={[styles.txnLitres, { color: colors.mutedForeground }]}>{txn.litres} L</Text>
                  </View>
                </TouchableOpacity>
              </Link>
            );
          })}
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginBottom: 4,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(10, 17, 40, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleMake: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginBottom: 4,
  },
  vehiclePlate: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  budgetCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
  },
  budgetTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginBottom: 12,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  budgetAmount: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    marginBottom: 4,
  },
  currency: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  budgetTotal: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.4)", // Simple representation
    borderTopColor: "#F59E0B",
  },
  progressInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderRadius: 20,
    marginBottom: 32,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scanText: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    marginLeft: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
  },
  seeAll: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  transactionsList: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  txnIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  txnDetails: {
    flex: 1,
  },
  txnStation: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginBottom: 4,
  },
  txnDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  txnAmountContainer: {
    alignItems: "flex-end",
  },
  txnAmount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginBottom: 4,
  },
  txnLitres: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
});
