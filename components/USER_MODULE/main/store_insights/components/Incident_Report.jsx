import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  AlertTriangle,
  Camera,
  X,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Info,
} from "lucide-react-native";

const INCIDENT_TYPES = [
  "Power Outage",
  "Store Flood",
  "System Offline",
  "Renovation",
  "Theft/Security",
];

const IMPACT_LEVELS = ["Low", "Medium", "High"];

const Incident_Report = ({ navigation, route }) => {
  const { storeData } = route.params || {};
  const [selectedType, setSelectedType] = useState("");
  const [impactLevel, setImpactLevel] = useState("");
  const [description, setDescription] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-slate-200">
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
            Incident Reporting
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs"
          >
            {storeData?.description || "Report Store Issues"}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 bg-slate-50"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24, paddingBottom: 160 }}
        >
          {/* Warning Info */}
          <View className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-6 flex-row items-start">
            <AlertTriangle size={20} color="#d97706" />
            <View className="flex-1 ml-3">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-amber-800 text-[12px] uppercase"
              >
                Critical Notification
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-amber-700 text-[11px] leading-4 mt-0.5"
              >
                Incidents reported here are immediately flagged to the regional
                operations manager. Please provide accurate details.
              </Text>
            </View>
          </View>

          {/* 1. Incident Type Chips */}
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-400 text-[11px] uppercase tracking-widest mb-3 ml-1"
          >
            Type of Incident
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {INCIDENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedType(type)}
                className={`px-4 py-3 rounded-xl border ${
                  selectedType === type
                    ? "bg-sky-50 border-sky-500"
                    : "bg-white border-slate-200"
                }`}
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className={`text-[11px] ${
                    selectedType === type ? "text-sky-700" : "text-slate-500"
                  }`}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 2. Business Impact Toggles */}
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-400 text-[11px] uppercase tracking-widest mb-3 ml-1"
          >
            Business Impact Level
          </Text>
          <View className="flex-row gap-3 mb-6">
            {IMPACT_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setImpactLevel(level)}
                className={`flex-1 py-4 rounded-xl border flex-row items-center justify-center ${
                  impactLevel === level
                    ? "bg-sky-50 border-sky-500"
                    : "bg-white border-slate-200"
                }`}
              >
                {impactLevel === level ? (
                  <CheckCircle2 size={16} color="#0284c7" />
                ) : (
                  <Circle size={16} color="#cbd5e1" />
                )}
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className={`ml-2 ${
                    impactLevel === level && "mr-2"
                  } text-[11px] uppercase ${
                    impactLevel === level ? "text-sky-700" : "text-slate-400"
                  }`}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 3. Photo Evidence */}
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-400 text-[11px] uppercase tracking-widest mb-3 ml-1"
          >
            Photo Evidence
          </Text>

          <View className="items-center mb-6">
            <TouchableOpacity
              activeOpacity={0.7}
              style={{ aspectRatio: 1 }}
              className="w-full bg-white border-2 border-dashed border-slate-200 rounded-3xl items-center justify-center"
            >
              <View className="bg-sky-50 p-6 rounded-full mb-3">
                <Camera size={32} color="#0284c7" />
              </View>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-400 text-[11px] uppercase tracking-wider"
              >
                Capture Evidence
              </Text>
            </TouchableOpacity>
          </View>

          {/* 4. Description */}
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-400 text-[11px] uppercase tracking-widest mb-3 ml-1"
          >
            Situation Details
          </Text>
          <TextInput
            multiline
            numberOfLines={5}
            placeholder="Please explain the situation and estimated time for restoration..."
            value={description}
            onChangeText={setDescription}
            className="bg-white border border-slate-200 rounded-xl p-4 text-slate-900 font-[Outfit-Regular] h-32"
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Actions */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 flex-row gap-3">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="flex-1 bg-slate-100 py-4 rounded-xl border border-slate-200 items-center justify-center"
        >
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-600"
          >
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="bg-sky-600 flex-[2] py-4 rounded-xl flex-row items-center justify-center">
          <ClipboardCheck size={18} color="white" />
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-white ml-2"
          >
            Submit Report
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Incident_Report;
