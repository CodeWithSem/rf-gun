import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Ruler,
  PieChart,
  TrendingUp,
  LayoutTemplate,
  ChevronRight,
  Info,
} from "lucide-react-native";

const Share_Of_Shelf = ({ route, navigation }) => {
  const { user, storeData } = route.params || {};

  const subModules = [
    {
      id: 1,
      title: "Linear Meter Tracking",
      description: "Measure actual shelf space (cm/m)",
      icon: <Ruler size={24} color="#0284c7" />,
      screen: "LinearMeter",
      color: "bg-sky-50",
    },
    {
      id: 2,
      title: "SOS Percentage",
      description: "Brand share vs. Category total",
      icon: <PieChart size={24} color="#0d9488" />,
      screen: "SOSPercent",
      color: "bg-teal-50",
    },
    {
      id: 3,
      title: "Competitor Tracking",
      description: "Price monitoring & new launches",
      icon: <TrendingUp size={24} color="#ca8a04" />,
      screen: "CompetitorTrack",
      color: "bg-amber-50",
    },
    {
      id: 4,
      title: "Planogram Compliance",
      description: "Verify 'Picture of Success' layout",
      icon: <LayoutTemplate size={24} color="#f59e0b" />,
      screen: "PlanogramComp",
      color: "bg-orange-50",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-slate-200">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2 rounded-full active:bg-slate-100"
        >
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="ml-2">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-xl text-slate-900"
          >
            Share of Shelf
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs mr-10"
          >
            {storeData?.description || "Manage category share"}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-slate-50 px-6 pt-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Instruction Card */}
        <View className="bg-sky-600 rounded-xl p-5 mb-6">
          <View className="flex-row items-center mb-2">
            <Info size={18} color="white" />
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-white ml-2 text-sm uppercase tracking-wider"
            >
              Visibility Guidelines
            </Text>
          </View>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-white text-xs leading-relaxed"
          >
            Ensure measurements are taken from the left edge of the shelf. Take
            clear photos of the full shelf for Planogram verification and
            competitor price tags.
          </Text>
        </View>

        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-slate-400 text-[11px] uppercase tracking-widest mb-4"
        >
          SOS Sub-Modules
        </Text>

        {/* Task List */}
        {subModules.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate(item.screen, { user, storeData })
            }
            className="bg-white p-4 rounded-xl mb-4 flex-row items-center border border-slate-200"
          >
            <View
              className={`${item.color} w-14 h-14 rounded-xl items-center justify-center`}
            >
              {item.icon}
            </View>

            <View className="flex-1 ml-4">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-900 text-base"
              >
                {item.title}
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-500 text-xs"
              >
                {item.description}
              </Text>
            </View>

            <View className="bg-slate-50 p-2 rounded-full">
              <ChevronRight size={18} color="#cbd5e1" />
            </View>
          </TouchableOpacity>
        ))}

        {/* Space for bottom scroll */}
        <View className="h-10" />
      </ScrollView>

      {/* Summary Footer */}
      <View className="px-6 py-5 bg-white border-t border-slate-100">
        <View className="flex-row justify-between items-center mb-4">
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-sm"
          >
            Task Progress
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-sky-600 text-sm"
          >
            0 / 4 Tasks
          </Text>
        </View>
        <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <View className="h-full bg-sky-500 w-[0%]" />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Share_Of_Shelf;
