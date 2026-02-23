import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  CheckCircle2,
  XCircle,
  BadgePercent,
  X,
  Camera,
  ClipboardCheck,
  ChevronRight,
} from "lucide-react-native";

const PROMO_DATA = [
  {
    id: "1",
    campaign: "Summer Refresh B1T1",
    type: "Buy 1 Take 1",
    material: "Shelf Talker",
    validUntil: "2026-03-01",
    status: "Active",
  },
  {
    id: "2",
    campaign: "Bundle Pack: 3 for ₱100",
    type: "Price Bundle",
    material: "Wobbler",
    validUntil: "2026-03-01",
    status: "Active",
  },
  {
    id: "3",
    campaign: "New Year Loyalty Discount",
    type: "Membership Perk",
    material: "Aisle Fin",
    validUntil: "2026-02-01",
    status: "Expired",
  },
];

const Promo_Compliance = ({ navigation, route }) => {
  const { storeData } = route.params || {};
  const [searchQuery, setSearchQuery] = useState("");
  const [auditData, setAuditData] = useState({});
  const [syncing, setSyncing] = useState(false);

  const handleStatus = (id, status) => {
    setAuditData((prev) => ({
      ...prev,
      [id]: { ...prev[id], compliance: status },
    }));
  };

  const renderPromo = ({ item }) => {
    const auditStatus = auditData[item.id]?.compliance;
    const isExpired = item.status === "Expired";

    return (
      <View
        className={`bg-white p-5 rounded-xl mb-3 border ${isExpired ? "border-red-600" : "border-slate-200"} ${isExpired ? "opacity-70 bg-red-50" : ""}`}
      >
        {/* Campaign Header */}
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <BadgePercent
                size={14}
                color={isExpired ? "#e11d48" : "#0284c7"}
              />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className={`ml-2 text-[10px] uppercase tracking-wider ${isExpired ? "text-rose-600" : "text-sky-600"}`}
              >
                {item.type}
              </Text>
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className={`text-base leading-5 ${isExpired ? "text-rose-900" : "text-slate-900"}`}
            >
              {item.campaign}
            </Text>
          </View>

          {/* Status Badge - Dynamic Red for Expired */}
          <View
            className={`px-2 py-1 rounded-md ${isExpired ? "bg-rose-100" : "bg-emerald-50"}`}
          >
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className={`text-[9px] ${isExpired ? "text-rose-700" : "text-emerald-600"}`}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Requirements Box - Dynamic Red Border for Expired */}
        <View
          className={`rounded-xl p-4 flex-row items-center mb-5 border ${isExpired ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-200"}`}
        >
          <View className="flex-1">
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className={`text-[10px] uppercase ${isExpired ? "text-rose-400" : "text-slate-400"}`}
            >
              Material
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className={`${isExpired ? "text-rose-800" : "text-slate-700"} text-sm mt-0.5`}
            >
              {item.material}
            </Text>
          </View>
          <View
            className={`w-[1px] h-6 mx-4 ${isExpired ? "bg-rose-200" : "bg-slate-300"}`}
          />
          <View className="flex-1">
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className={`text-[10px] uppercase ${isExpired ? "text-rose-400" : "text-slate-400"}`}
            >
              Valid Until
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className={`${isExpired ? "text-rose-800" : "text-slate-700"} text-sm mt-0.5`}
            >
              {item.validUntil}
            </Text>
          </View>
        </View>

        {/* Verification Actions */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleStatus(item.id, "Pass")}
            disabled={isExpired} // Optional: Disable if you don't want audits on expired items
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
              Compliant
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
              className={`ml-2 mr-1 text-xs ${auditStatus === "Fail" ? "text-rose-700" : "text-slate-500"}`}
            >
              Non-Comp
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
              Promo Compliance
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-xs"
            >
              {storeData?.description || "Campaign Audit"}
            </Text>
          </View>
        </View>
      </View>

      {/* Search Input - Matched to Price Audit Style */}
      <View className="px-6 py-3 bg-white border-b border-slate-200">
        <View className="bg-slate-50 flex-row items-center px-4 rounded-lg border border-slate-200">
          <Search size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search promo..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 py-3 ml-2 font-[Outfit-Regular]"
          />
        </View>
      </View>

      {/* Campaign List */}
      <FlatList
        data={PROMO_DATA.filter((p) =>
          p.campaign.toLowerCase().includes(searchQuery.toLowerCase()),
        )}
        renderItem={renderPromo}
        keyExtractor={(item) => item.id}
        className="bg-slate-50 px-6"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer Buttons - Matched to Price Audit Style */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 flex-row gap-3">
        {syncing ? (
          <View className="w-full py-4 items-center justify-center">
            <ActivityIndicator color="#0d9488" />
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

            <TouchableOpacity className="flex-[2] bg-sky-600 py-4 rounded-xl flex-row items-center justify-center">
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

export default Promo_Compliance;
