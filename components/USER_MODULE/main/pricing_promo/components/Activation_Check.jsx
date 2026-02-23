import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  CheckCircle2,
  XCircle,
  Camera,
  ClipboardCheck,
  MapPin,
  Zap,
} from "lucide-react-native";

const ACTIVATION_DATA = [
  {
    id: "1",
    title: "Summer Drink Island",
    type: "Island Display",
    location: "Aisle 4 Entrance",
    requirement: "Full Stock + Header Board",
    status: "priority",
  },
  {
    id: "2",
    title: "Weekend Sampling Booth",
    type: "Sampling",
    location: "Near Dairy Section",
    requirement: "1 Promoter + Sampling Cups",
    status: "standard",
  },
  {
    id: "3",
    title: "Snack Combo End-Cap",
    type: "End-Cap",
    location: "Checkout Lane 5",
    requirement: "Cross-merchandised with Chips",
    status: "priority",
  },
];

const Activation_Check = ({ navigation, route }) => {
  const { storeData } = route.params || {};
  const [searchQuery, setSearchQuery] = useState("");
  const [auditData, setAuditData] = useState({});
  const [syncing, setSyncing] = useState(false);

  const handleStatus = (id, status) => {
    setAuditData((prev) => ({
      ...prev,
      [id]: { ...prev[id], execution: status },
    }));
  };

  const renderActivation = ({ item }) => {
    const auditStatus = auditData[item.id]?.execution;
    const isPriority = item.status === "priority";

    return (
      <View className="bg-white p-5 rounded-xl mb-3 border border-slate-200 shadow-sm">
        {/* Header: Title & Priority */}
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Zap size={14} color={isPriority ? "#0284c7" : "#64748b"} />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className={`ml-2 text-[10px] uppercase tracking-wider ${isPriority ? "text-sky-600" : "text-slate-500"}`}
              >
                {item.type}
              </Text>
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-900 text-base leading-5"
            >
              {item.title}
            </Text>
          </View>
          <View
            className={`px-2 py-1 rounded-md ${isPriority ? "bg-sky-50" : "bg-slate-50"}`}
          >
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className={`text-[9px] ${isPriority ? "text-sky-600" : "text-slate-500"}`}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Location & Requirement Box */}
        <View className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-200">
          <View className="flex-row items-center mb-3">
            <MapPin size={14} color="#64748b" />
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-slate-500 text-xs ml-2"
            >
              {item.location}
            </Text>
          </View>
          <View className="h-[1px] bg-slate-200 mb-3" />
          <View>
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-slate-400 text-[10px] uppercase"
            >
              Requirement
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-700 text-sm mt-0.5"
            >
              {item.requirement}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleStatus(item.id, "Pass")}
            className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${auditStatus === "Pass" ? "bg-emerald-50 border-emerald-500" : "bg-white border-slate-200"}`}
          >
            <CheckCircle2
              size={16}
              color={auditStatus === "Pass" ? "#10b981" : "#94a3b8"}
            />
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className={`ml-2 mr-2 text-xs ${auditStatus === "Pass" ? "text-emerald-700" : "text-slate-500"}`}
            >
              Present
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleStatus(item.id, "Fail")}
            className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${auditStatus === "Fail" ? "bg-rose-50 border-rose-500" : "bg-white border-slate-200"}`}
          >
            <XCircle
              size={16}
              color={auditStatus === "Fail" ? "#f43f5e" : "#94a3b8"}
            />
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className={`ml-2 mr-2 text-xs ${auditStatus === "Fail" ? "text-rose-700" : "text-slate-500"}`}
            >
              Missing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-slate-100 px-4 rounded-xl items-center justify-center border border-slate-200">
            <Camera size={18} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-100">
        <View className="flex-row items-center">
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
              Activation Check
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-xs"
            >
              {storeData?.description || "Secondary Displays"}
            </Text>
          </View>
        </View>
      </View>

      {/* Search Bar Container */}
      <View className="px-6 py-3 bg-white border-b border-slate-200">
        <View className="bg-slate-50 flex-row items-center px-4 rounded-lg border border-slate-200">
          <Search size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search activations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 py-3 ml-2 font-[Outfit-Regular]"
          />
        </View>
      </View>

      {/* Activation List */}
      <FlatList
        data={ACTIVATION_DATA.filter((p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()),
        )}
        renderItem={renderActivation}
        keyExtractor={(item) => item.id}
        className="bg-slate-50 px-6"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Unified Footer */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 flex-row gap-3 shadow-2xl">
        {syncing ? (
          <View className="w-full py-4 items-center justify-center">
            <ActivityIndicator color="#0284c7" />
          </View>
        ) : (
          <>
            <TouchableOpacity className="flex-1 bg-slate-100 py-4 rounded-xl border border-slate-200 items-center justify-center">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-600"
              >
                Save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-[2] bg-sky-600 py-4 rounded-xl flex-row items-center justify-center shadow-sm">
              <ClipboardCheck size={18} color="white" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white ml-2"
              >
                Submit Audit
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Activation_Check;
