import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  ChevronRight,
  Truck,
  LogOut,
  PackageCheck,
  Move,
  AlertCircle,
  ClipboardList,
  PackageSearch,
} from "lucide-react-native";

const Dashboard = ({ route, navigation }) => {
  const { user } = route.params;
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Updated modules with unique colors and icons
  const modules = [
    {
      id: "transfer_order",
      name: "Transfer Order",
      desc: "View and process assigned tasks",
      icon: <ClipboardList size={24} color="#0284c7" />,
      color: "bg-sky-50",
      borderColor: "border-sky-100",
    },
    {
      id: "user_direct",
      name: "User Directed Transfer",
      desc: "Manual LPN movement",
      icon: <Move size={24} color="#0284c7" />,
      color: "bg-sky-50",
      borderColor: "border-sky-100",
    },
    {
      id: "lpn_allocation",
      name: "LPN Allocation",
      desc: "Assign LPNs",
      icon: <PackageCheck size={24} color="#0284c7" />,
      color: "bg-sky-50",
      borderColor: "border-sky-100",
    },
    // {
    //   id: "inventory",
    //   name: "Inventory Control",
    //   desc: "Cycle count & stock check",
    //   icon: <PackageCheck size={24} color="#0284c7" />,
    //   color: "bg-sky-50",
    //   borderColor: "border-sky-100",
    // },
    // {
    //   id: "picking",
    //   name: "Picking",
    //   desc: "Order fulfillment",
    //   icon: <PackageSearch size={24} color="#0284c7" />,
    //   color: "bg-sky-50",
    //   borderColor: "border-sky-100",
    // },
    // {
    //   id: "dispatch",
    //   name: "Dispatch",
    //   desc: "Loading & shipping",
    //   icon: <Truck size={24} color="#0284c7" />,
    //   color: "bg-sky-50",
    //   borderColor: "border-sky-100",
    // },
  ];

  const handleLogout = () => {
    setShowLogoutModal(false);
    navigation.replace("Login");
  };

  const navigate_module = (module_id) => {
    if (module_id === "transfer_order") {
      navigation.navigate(module_id, { user_data: user });
    } else if (module_id === "user_direct") {
      navigation.navigate(module_id, { user_data: user });
    } else if (module_id === "lpn_allocation") {
      navigation.navigate(module_id, { user_data: user });
    } else {
      // Custom Alert style could be added later
      alert("Under Maintenance: This module will be available soon.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* 1. Header Section */}
        <View className="flex-row items-center justify-between mt-8 mb-8">
          <View className="flex-row items-center">
            <View className="bg-white p-3 rounded-xl border border-slate-200">
              <User size={28} color="#64748b" />
            </View>
            <View className="ml-4">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-2xl text-slate-900"
              >
                {user.first_name} {user.last_name}
              </Text>
              <View className="flex-row items-center mt-1">
                {/* <View className="bg-sky-500 w-2 h-2 rounded-full mr-2" /> */}
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-slate-500 uppercase text-[10px] tracking-[2px]"
                >
                  {user.username}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. Operational Modules List */}
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-slate-400 text-[11px] uppercase tracking-widest mb-4 ml-1"
        >
          WMS Operations Menu
        </Text>

        <View className="pb-10">
          {modules.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => navigate_module(item.id)}
              className="bg-white p-4 rounded-xl mb-4 flex-row items-center border border-slate-200"
            >
              {/* Colored Icon Box */}
              <View
                className={`${item.color} w-14 h-14 rounded-xl items-center justify-center border ${item.borderColor}`}
              >
                {item.icon}
              </View>

              <View className="flex-1 ml-4">
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-900 text-base"
                >
                  {item.name}
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-slate-500 text-xs mt-0.5"
                >
                  {item.desc}
                </Text>
              </View>

              <View className="bg-slate-50 p-2 rounded-full">
                <ChevronRight size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          ))}

          {/* LOGOUT BUTTON */}
          <TouchableOpacity
            onPress={() => setShowLogoutModal(true)}
            className="mt-4 flex-row items-center justify-center py-5 border border-red-200 rounded-xl bg-red-50/50"
          >
            <LogOut size={18} color="#ef4444" />
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-red-500 text-base tracking-[1px] ml-2"
            >
              LOGOUT
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View className="flex-1 bg-slate-900/60 justify-center items-center px-8">
          <View className="bg-white w-full rounded-[40px] p-8 items-center">
            <View className="bg-red-50 p-5 rounded-full mb-4">
              <AlertCircle size={44} color="#ef4444" />
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
              Are you sure you want to end your session?
            </Text>
            <View className="w-full">
              <TouchableOpacity
                onPress={handleLogout}
                className="bg-red-500 w-full py-5 rounded-xl items-center shadow-lg shadow-red-200"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-lg"
                >
                  Confirm Logout
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowLogoutModal(false)}
                className="w-full py-4 rounded-xl items-center mt-2"
              >
                <Text
                  style={{ fontFamily: "Outfit-SemiBold" }}
                  className="text-slate-400 text-lg"
                >
                  Cancel
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
