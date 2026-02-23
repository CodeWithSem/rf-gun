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
  Tag,
  BadgePercent,
  Zap,
  Megaphone,
  ChevronRight,
  Info,
} from "lucide-react-native";

const Pricing_Promo = ({ route, navigation }) => {
  const { user, storeData } = route.params || {};

  const subModules = [
    {
      id: 1,
      title: "Price Audit",
      description: "Check SRP compliance & price tags",
      icon: <Tag size={24} color="#0284c7" />,
      screen: "PriceAudit",
      color: "bg-sky-50",
    },
    {
      id: 2,
      title: "Promo Compliance",
      description: "Verify B1T1 and discount visibility",
      icon: <BadgePercent size={24} color="#0d9488" />,
      screen: "PromoComp",
      color: "bg-teal-50",
    },
    {
      id: 3,
      title: "Activation Check",
      description: "Sampling booths & island displays",
      icon: <Zap size={24} color="#ca8a04" />,
      screen: "ActivationCheck",
      color: "bg-amber-50",
    },
    {
      id: 4,
      title: "POP/POSM Audit",
      description: "Wobblers, posters & shelf talkers",
      icon: <Megaphone size={24} color="#f59e0b" />,
      screen: "POSMAudit",
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
            Pricing & Promo
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs mr-10"
          >
            {storeData?.description || "Monitor market execution"}
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
              Execution Guidelines
            </Text>
          </View>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-white text-xs leading-relaxed"
          >
            Verify that all promotional materials are within eye-level. Report
            any damaged POSMs immediately and ensure the SRP matches the system
            price.
          </Text>
        </View>

        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-slate-400 text-[11px] uppercase tracking-widest mb-4"
        >
          Audit Categories
        </Text>

        {/* Sub-Module List */}
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
                className="text-slate-500 text-xs mt-0.5"
              >
                {item.description}
              </Text>
            </View>

            <View className="bg-slate-50 p-2 rounded-full">
              <ChevronRight size={18} color="#cbd5e1" />
            </View>
          </TouchableOpacity>
        ))}

        <View className="h-10" />
      </ScrollView>

      {/* Progress Footer */}
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

export default Pricing_Promo;
