import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ClipboardCheck,
  Star,
  CheckCircle2,
  Circle,
  Info,
} from "lucide-react-native";

const QUESTIONS = [
  {
    id: "q1",
    title: "Store Cleanliness",
    subtitle: "Aisles, floors, and shelves",
    type: "rating",
  },
  {
    id: "q2",
    title: "Staff Cooperation",
    subtitle: "Responsiveness of store personnel",
    type: "rating",
  },
  {
    id: "q3",
    title: "Planogram Compliance",
    subtitle: "Products follow display guidelines",
    type: "toggle",
  },
  {
    id: "q4",
    title: "Backroom Orderliness",
    subtitle: "Inventory accessibility",
    type: "rating",
  },
  {
    id: "q5",
    title: "Pricing Accuracy",
    subtitle: "Tags match system price",
    type: "toggle",
  },
];

const SOS_Survey = ({ navigation, route }) => {
  const { storeData } = route.params || {};
  const [answers, setAnswers] = useState({});
  const [additionalNotes, setAdditionalNotes] = useState("");

  const handleSelect = (id, value) => {
    setAnswers({ ...answers, [id]: value });
  };

  const renderRating = (id) => (
    <View className="flex-row justify-between mt-3 px-1">
      {[1, 2, 3, 4, 5].map((num) => (
        <TouchableOpacity
          key={num}
          onPress={() => handleSelect(id, num)}
          className={`w-12 h-12 rounded-full items-center justify-center border ${
            answers[id] === num
              ? "bg-sky-600 border-sky-600"
              : "bg-white border-slate-200"
          }`}
        >
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className={answers[id] === num ? "text-white" : "text-slate-400"}
          >
            {num}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderToggle = (id) => (
    <View className="flex-row gap-3 mt-3">
      {["Compliant", "Non-Compliant"].map((option) => (
        <TouchableOpacity
          key={option}
          onPress={() => handleSelect(id, option)}
          className={`flex-1 py-4 rounded-xl border flex-row items-center justify-center ${
            answers[id] === option
              ? "bg-sky-50 border-sky-500"
              : "bg-white border-slate-200"
          }`}
        >
          {answers[id] === option ? (
            <CheckCircle2 size={16} color="#0284c7" />
          ) : (
            <Circle size={16} color="#cbd5e1" />
          )}
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className={`ml-2 text-[11px] uppercase ${answers[id] === option ? "text-sky-700" : "text-slate-400"}`}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar barStyle="dark-content" />

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
            SOS Survey
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs"
          >
            {storeData?.description || "Service Quality"}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-slate-50"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 160 }}
      >
        {/* Context Alert */}
        <View className="bg-sky-50 border border-sky-100 p-4 rounded-xl mb-6 flex-row">
          <Info size={20} color="#0284c7" />
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-sky-800 text-[11px] ml-3 flex-1 leading-4"
          >
            Rating: 1 (Poor) to 5 (Excellent). Surveys help track store-level
            execution and operational compliance.
          </Text>
        </View>

        {QUESTIONS.map((q) => (
          <View
            key={q.id}
            className="bg-white p-5 rounded-xl border border-slate-200 mb-4"
          >
            <View>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-900 text-base"
              >
                {q.title}
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-400 text-xs"
              >
                {q.subtitle}
              </Text>
            </View>

            {q.type === "rating" ? renderRating(q.id) : renderToggle(q.id)}
          </View>
        ))}

        {/* Notes Section */}
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-slate-400 text-[11px] uppercase tracking-widest mt-4 mb-3 ml-1"
        >
          Survey Remarks
        </Text>
        <TextInput
          multiline
          placeholder="Describe any critical issues observed..."
          value={additionalNotes}
          onChangeText={setAdditionalNotes}
          className="bg-white border border-slate-200 rounded-xl p-4 text-slate-900 font-[Outfit-Regular] h-32"
          textAlignVertical="top"
        />
      </ScrollView>

      {/* Unified Action Footer */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 flex-row gap-3">
        <TouchableOpacity className="flex-1 bg-slate-100 py-4 rounded-xl border border-slate-200 items-center justify-center">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-600"
          >
            Save
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="bg-sky-600 flex-[2] py-4 rounded-xl flex-row items-center justify-center shadow-lg shadow-sky-100">
          <ClipboardCheck size={18} color="white" />
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-white ml-2"
          >
            Submit Survey
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SOS_Survey;
