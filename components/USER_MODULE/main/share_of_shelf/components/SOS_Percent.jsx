import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  PieChart,
  TrendingUp,
  Info,
  CheckCircle2,
  Share2,
  Layers,
  Target,
} from "lucide-react-native";

// Mock Aggregated Data from the previous module
const SOS_RESULTS = [
  {
    id: "1",
    category: "Carbonated Soft Drinks",
    totalShelf: 1200, // cm
    ourBrand: 450, // cm
    competitors: 750, // cm
    target: 40, // 40% target
  },
  {
    id: "2",
    category: "Energy Drinks",
    totalShelf: 800,
    ourBrand: 320,
    competitors: 480,
    target: 35,
  },
];

const SOS_Percent = ({ navigation, route }) => {
  const { storeData } = route?.params || {
    storeData: { description: "General Display" },
  };

  const calculatePercent = (part, total) => ((part / total) * 100).toFixed(1);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* HEADER */}
      <View className="bg-white px-6 py-4 flex-row items-center border-b border-slate-200">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2"
        >
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="ml-2">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-xl text-slate-900"
          >
            SOS Percentage
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs"
          >
            Analysis
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* SUMMARY OVERVIEW */}
        <View className="bg-sky-600 rounded-xl p-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <View className="bg-white/20 p-2 rounded-lg">
              <TrendingUp size={20} color="white" />
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-white/70 text-[10px] uppercase"
            >
              Average Performance
            </Text>
          </View>
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-white text-4xl mb-1"
          >
            38.5%
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-sky-100 text-xs"
          >
            Average Share of Shelf across all categories
          </Text>
        </View>

        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-slate-900 text-lg mb-4"
        >
          Category Breakdown
        </Text>

        {SOS_RESULTS.map((item) => {
          const ourPercent = calculatePercent(item.ourBrand, item.totalShelf);
          const isHittingTarget = parseFloat(ourPercent) >= item.target;

          return (
            <View
              key={item.id}
              className="bg-white rounded-xl p-5 mb-4 border border-slate-200"
            >
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-1">
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-900 text-base"
                  >
                    {item.category}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Layers size={12} color="#94a3b8" />
                    <Text
                      style={{ fontFamily: "Outfit-Regular" }}
                      className="text-slate-400 text-[10px] ml-1"
                    >
                      Total Space: {item.totalShelf}cm
                    </Text>
                  </View>
                </View>
                <View
                  className={`px-3 py-1 rounded-full ${isHittingTarget ? "bg-green-50" : "bg-orange-50"}`}
                >
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className={`text-[10px] ${isHittingTarget ? "text-green-600" : "text-orange-600"}`}
                  >
                    {isHittingTarget ? "ON TARGET" : "BELOW TARGET"}
                  </Text>
                </View>
              </View>

              {/* PROGRESS BAR COMPONENT */}
              <View className="h-4 bg-slate-100 rounded-full flex-row overflow-hidden mb-4">
                <View
                  style={{ width: `${ourPercent}%` }}
                  className="bg-sky-600 h-full"
                />
              </View>

              <View className="flex-row justify-between items-center bg-slate-50 p-4 rounded-xl">
                <View className="items-center flex-1 border-r border-slate-200">
                  <Text
                    style={{ fontFamily: "Outfit-Regular" }}
                    className="text-slate-400 text-[10px] uppercase"
                  >
                    Our Brand
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-sky-600 text-lg"
                  >
                    {ourPercent}%
                  </Text>
                </View>
                <View className="items-center flex-1 border-r border-slate-200">
                  <Text
                    style={{ fontFamily: "Outfit-Regular" }}
                    className="text-slate-400 text-[10px] uppercase"
                  >
                    Target
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-700 text-lg"
                  >
                    {item.target}%
                  </Text>
                </View>
                <View className="items-center flex-1">
                  <Text
                    style={{ fontFamily: "Outfit-Regular" }}
                    className="text-slate-400 text-[10px] uppercase"
                  >
                    Gap
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-red-500 text-lg"
                  >
                    {Math.max(0, item.target - ourPercent).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* INSIGHT CARD */}
        <View className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex-row">
          <Info size={20} color="#d97706" />
          <View className="ml-3 flex-1">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-amber-900 text-xs"
            >
              Improvement Tip
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-amber-700 text-[11px] mt-1"
            >
              You are 5% away from your target in "Energy Drinks". Consider
              expanding 2 more facings of your top SKU to close the gap.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* FOOTER ACTIONS */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200">
        <TouchableOpacity
          onPress={() => navigation.navigate("Dashboard")}
          className="bg-sky-600 py-4 rounded-xl flex-row items-center justify-center"
        >
          <CheckCircle2 size={20} color="white" />
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-white ml-2 text-base"
          >
            Complete Audit
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SOS_Percent;
