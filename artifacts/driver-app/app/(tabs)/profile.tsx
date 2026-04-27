import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import { DRIVER_PROFILE } from "@/constants/mockData";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();

  const settingsItems = [
    { id: "lang", icon: "globe", label: "Language", value: "English" },
    { id: "notif", icon: "bell", label: "Notifications", value: "On" },
    { id: "bio", icon: "shield", label: "Biometric Login", value: "Enabled" },
    { id: "support", icon: "help-circle", label: "Support", value: "" },
    { id: "terms", icon: "file-text", label: "Terms & Conditions", value: "" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, Platform.OS === "web" ? 67 : 0) + 16,
          paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.avatarLg, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.avatarTextLg, { color: colors.secondaryForeground }]}>
              {DRIVER_PROFILE.name.split(" ").map(n => n[0]).join("")}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>{DRIVER_PROFILE.name}</Text>
          <Text style={[styles.empId, { color: colors.mutedForeground }]}>
            {DRIVER_PROFILE.id} • {DRIVER_PROFILE.company}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Assigned Vehicle</Text>
          <View style={[styles.vehicleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.vehicleIcon}>
              <MaterialCommunityIcons name="truck-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.vehicleDetails}>
              <Text style={[styles.vehicleMake, { color: colors.foreground }]}>{DRIVER_PROFILE.vehicle.makeModel}</Text>
              <Text style={[styles.vehiclePlate, { color: colors.mutedForeground }]}>{DRIVER_PROFILE.vehicle.plate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Settings</Text>
          <View style={[styles.settingsGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {settingsItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.settingItem,
                  index !== settingsItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                ]}
              >
                <View style={styles.settingLeft}>
                  <Feather name={item.icon as any} size={20} color={colors.foreground} />
                  <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
                </View>
                <View style={styles.settingRight}>
                  {item.value ? <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{item.value}</Text> : null}
                  <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.logoutBtn, { backgroundColor: "transparent", borderColor: colors.destructive }]}
          onPress={() => logout()}
        >
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.mutedForeground }]}>Version 1.0.0</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  avatarLg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarTextLg: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    marginBottom: 4,
  },
  empId: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    textTransform: "uppercase",
    marginBottom: 12,
    marginLeft: 8,
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
  settingsGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginRight: 8,
  },
  logoutBtn: {
    marginHorizontal: 16,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoutText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  versionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
});
