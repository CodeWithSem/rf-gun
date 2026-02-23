import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Bell,
  ChevronRight,
  Store,
  ClipboardCheck,
  LogOut,
  Calendar,
  AlertCircle,
} from "lucide-react-native";

const Dashboard = ({ route, navigation }) => {
  const { user } = route.params;
  const [showLogoutModal, setShowLogoutModal] = useState(false); // State for modal visibility

  // Handle Hardware Back Press
  //   useEffect(() => {
  //     const backAction = () => {
  //       // Show the logout modal instead of exiting
  //       setShowLogoutModal(true);
  //       // Return true to prevent the default behavior (exiting the app)
  //       return true;
  //     };

  //     const backHandler = BackHandler.addEventListener(
  //       "hardwareBackPress",
  //       backAction,
  //     );

  //     // Clean up the listener when the screen is unmounted
  //     return () => backHandler.remove();
  //   }, []);

  const handleLogout = () => {
    setShowLogoutModal(false);
    navigation.replace("Login");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6">
        {/* 1. Header & User Profile Section */}
        <View className="flex-row items-center justify-between mt-8 mb-6">
          <View className="flex-row items-center">
            <View className="bg-sky-100 p-3 rounded-xl mr-4">
              <User size={28} color="#0284c7" />
            </View>
            <View>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-2xl text-slate-900"
              >
                Hi, {user.fullName.split(" ")[0]}!
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-500 uppercase text-xs tracking-widest"
              >
                {user.username} • {user.role}
              </Text>
            </View>
          </View>
          <TouchableOpacity className="bg-slate-50 p-3 rounded-full">
            <Bell size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* 2. MCP Compliance Section */}
        <View className="bg-slate-900 rounded-3xl p-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-white text-lg"
            >
              MCP Compliance
            </Text>
            <Calendar size={18} color="#bae6fd" />
          </View>
          <View className="flex-row items-end justify-between">
            <View>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-4xl text-sky-400"
              >
                85%
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-400 text-sm"
              >
                Monthly Target
              </Text>
            </View>
            <View className="bg-white/10 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-semibold">
                February 2026
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Announcement Section */}
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-slate-900 text-xl mb-4"
        >
          Announcements
        </Text>
        <View className="bg-sky-50 border border-sky-100 rounded-xl p-4 mb-5">
          <Text
            style={{ fontFamily: "Outfit-SemiBold" }}
            className="text-sky-800 text-base"
          >
            New Deployment Protocol
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-sky-700/70 text-sm mt-1"
          >
            Please ensure all store photos are uploaded before checking out of
            the store...
          </Text>
        </View>

        {/* 4. Selection Buttons */}
        <View className="space-y-4">
          <TouchableOpacity
            className="bg-sky-600 flex-row items-center p-5 rounded-xl"
            activeOpacity={0.8}
            onPress={() => navigation.navigate("MCPSelection", { user })}
          >
            <View className="bg-white/20 p-2 rounded-lg mr-4">
              <ClipboardCheck size={24} color="white" />
            </View>
            <View className="flex-1">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white text-lg"
              >
                MCP Selection
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-sky-100 text-xs"
              >
                View assigned stores
              </Text>
            </View>
            <ChevronRight size={20} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-4 bg-slate-100 border border-slate-200 flex-row items-center p-5 rounded-xl"
            activeOpacity={0.8}
            onPress={() => navigation.navigate("StoreSelection", { user })}
          >
            <View className="bg-slate-200 p-2 rounded-lg mr-4">
              <Store size={24} color="#475569" />
            </View>
            <View className="flex-1">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-800 text-lg"
              >
                Store Selection
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-500 text-xs"
              >
                Divert or find unassigned stores
              </Text>
            </View>
            <ChevronRight size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* 5. Logout Button */}
        <TouchableOpacity
          onPress={() => setShowLogoutModal(true)}
          className="mt-5 mb-10 flex-row items-center justify-center py-4 border border-red-100 rounded-xl bg-red-50/50"
        >
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-red-500 text-base tracking-[1px]"
          >
            LOGOUT
          </Text>
        </TouchableOpacity>
      </ScrollView>
      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View className="flex-1 bg-slate-900/50 justify-center items-center px-8">
          <View className="bg-white w-full rounded-3xl p-8 items-center">
            <View className="bg-red-50 p-4 rounded-full mb-4">
              <AlertCircle size={40} color="#ef4444" />
            </View>

            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-2xl text-slate-900 text-center"
            >
              Logout
            </Text>

            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-center mt-2 mb-8 text-base"
            >
              Are you sure you want to log out? You will need to sign in again
              to access your data.
            </Text>

            <View className="w-full space-y-3">
              {/* Confirm Logout */}
              <TouchableOpacity
                onPress={handleLogout}
                className="bg-red-500 w-full py-4 rounded-xl items-center"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-lg"
                >
                  Confirm
                </Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity
                onPress={() => setShowLogoutModal(false)}
                className="w-full py-4 rounded-xl items-center mt-2"
              >
                <Text
                  style={{ fontFamily: "Outfit-SemiBold" }}
                  className="text-slate-500 text-lg"
                >
                  Stay Logged In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Dashboard;
