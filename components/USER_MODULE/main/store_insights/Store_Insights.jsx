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
  MessageSquare,
  ClipboardList,
  AlertTriangle,
  ChevronRight,
  Info,
  Users,
} from "lucide-react-native";

const Store_Insights = ({ route, navigation }) => {
  const { user, storeData } = route.params || {};

  const subModules = [
    {
      id: 1,
      title: "Personnel Feedback",
      description: "Notes from Manager or Category Buyer",
      icon: <Users size={24} color="#0284c7" />, // Indigo
      screen: "PersonFeedback",
      color: "bg-sky-50",
    },
    {
      id: 2,
      title: "SOS Survey",
      description: "Rate cleanliness & staff cooperation",
      icon: <ClipboardList size={24} color="#0d9488" />, // Teal
      screen: "SOSSurvey",
      color: "bg-teal-50",
    },
    {
      id: 3,
      title: "Incident Reporting",
      description: "Power outages, floods, or renovations",
      icon: <AlertTriangle size={24} color="#e11d48" />, // Rose
      screen: "IncidentReport",
      color: "bg-rose-50",
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
            Store Insights
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs"
          >
            {storeData?.name || "Communication & Feedback"}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-slate-50 px-6 pt-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Instruction Card - Themed in Indigo for Insights */}
        <View className="bg-sky-600 rounded-xl p-5 mb-6 shadow-sm">
          <View className="flex-row items-center mb-2">
            <MessageSquare size={18} color="white" />
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-white ml-2 text-sm uppercase tracking-wider"
            >
              Auditor Insight
            </Text>
          </View>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-white text-xs leading-relaxed"
          >
            Use this module to document environmental factors affecting sales.
            Accurate reporting of incidents or manager feedback provides
            critical context for head office analysis.
          </Text>
        </View>

        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-slate-400 text-[11px] uppercase tracking-widest mb-4"
        >
          Communication Tasks
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
            Tasks Progress
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-sky-600 text-sm"
          >
            0 / 3 Reports
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Store_Insights;
