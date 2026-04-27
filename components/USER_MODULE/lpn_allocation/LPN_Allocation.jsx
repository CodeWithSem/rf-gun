import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  PlusCircle,
  Search,
  RefreshCw,
} from "lucide-react-native";

const LPN_Allocation = ({ navigation }) => {
  // Helper component para sa mga Buttons/Cards
  const MenuButton = ({
    title,
    description,
    icon: Icon,
    onPress,
    colorClass,
  }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="bg-white mx-6 mb-4 p-5 rounded-3xl border border-slate-100 shadow-sm flex-row items-center"
    >
      <View className={`p-4 rounded-2xl ${colorClass} mr-4`}>
        <Icon size={28} color="white" />
      </View>
      <View className="flex-1">
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-slate-900 text-lg"
        >
          {title}
        </Text>
        <Text
          style={{ fontFamily: "Outfit-Regular" }}
          className="text-slate-500 text-xs"
        >
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-white border-b border-slate-100 mb-6">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2"
        >
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-xl text-slate-900 ml-2"
        >
          LPN Allocation
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pt-2">
        {/* Instruction Text */}
        <View className="px-8 mb-6">
          <Text
            style={{ fontFamily: "Outfit-Medium" }}
            className="text-slate-400 text-sm uppercase tracking-widest"
          >
            Select Action
          </Text>
        </View>

        {/* 1st Button: Search LPN */}
        <MenuButton
          title="Search LPN"
          description="Find and view current LPN details"
          icon={Search}
          colorClass="bg-blue-500"
          onPress={() => navigation.navigate("lpn_search")}
        />

        {/* 2nd Button: Register New LPN */}
        <MenuButton
          title="Register New LPN"
          description="Assign items to a new License Plate Number"
          icon={PlusCircle}
          colorClass="bg-emerald-500"
          onPress={() => navigation.navigate("lpn_form")}
        />

        {/* 3rd Button: Update LPN */}
        <MenuButton
          title="Update LPN"
          description="Replace or transfer current LPN data"
          icon={RefreshCw}
          colorClass="bg-orange-500"
          onPress={() => navigation.navigate("lpn_update")} // Palitan ang name base sa stack name mo
        />
      </ScrollView>

      {/* Footer / Version Info (Optional) */}
      <View className="py-6 items-center">
        <Text className="text-slate-300 text-[10px] uppercase tracking-tighter">
          Inventory Control System v1.0
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default LPN_Allocation;
