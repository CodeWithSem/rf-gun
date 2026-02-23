import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Plus,
  X,
  ScanBarcode,
  ClipboardCheck,
  AlertCircle,
} from "lucide-react-native";

const REASON_CODES = [
  "Stockroom Issue",
  "Misplaced in Aisle",
  "Damage/Expired",
  "Potential Shrinkage",
  "Delivery Shortage",
  "System Error",
];

const Gap_Analysis = ({ navigation, route }) => {
  const { storeData } = route.params || {};
  const [reportedGaps, setReportedGaps] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Form State
  const [newItemName, setNewItemName] = useState("");
  const [newSysQty, setNewSysQty] = useState("");
  const [selectedReason, setSelectedReason] = useState("");

  const handleAddGap = () => {
    if (!newItemName || !newSysQty || !selectedReason) return;
    const newEntry = {
      id: Date.now().toString(),
      name: newItemName,
      sysQty: newSysQty,
      reason: selectedReason,
    };
    setReportedGaps([newEntry, ...reportedGaps]);
    setNewItemName("");
    setNewSysQty("");
    setSelectedReason("");
    setModalVisible(false);
  };

  const renderGapItem = ({ item }) => (
    <View className="bg-white p-5 rounded-xl mb-4 border border-slate-200 shadow-sm">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-900 text-base"
          >
            {item.name}
          </Text>
          <View className="flex-row items-center mt-1">
            <AlertCircle size={12} color="#f59e0b" />
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-amber-600 text-[10px] ml-1 uppercase"
            >
              Manual Report
            </Text>
          </View>
        </View>
        <View className="bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-sky-700 text-[10px]"
          >
            SOH: {item.sysQty}
          </Text>
        </View>
      </View>
      <View className="bg-slate-50 rounded-xl p-3 border border-slate-200">
        <Text
          style={{ fontFamily: "Outfit-Medium" }}
          className="text-slate-400 text-[9px] uppercase"
        >
          Detected Root Cause
        </Text>
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-slate-700 text-xs mt-0.5"
        >
          {item.reason}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
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
            Gap Analysis
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs"
          >
            {storeData?.description || "Manual Discovery Mode"}
          </Text>
        </View>
      </View>

      <FlatList
        data={reportedGaps}
        renderItem={renderGapItem}
        keyExtractor={(item) => item.id}
        className="bg-slate-50 px-6"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 160 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <View className="bg-white p-6 rounded-full mb-4 border border-slate-200">
              <ScanBarcode size={40} color="#cbd5e1" />
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-400 text-center px-10"
            >
              No voids reported yet.{"\n"}Tap the button to add a gap.
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => {
          setModalVisible(true);
        }}
        className="absolute bottom-32 right-6 bg-sky-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>

      {/* Manual Input Modal */}
      <Modal animationType="fade" transparent visible={modalVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-[32px] p-8 max-h-[85%] shadow-2xl">
              <View className="flex-row justify-between items-center mb-6">
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-xl text-slate-900"
                >
                  Report Empty Shelf
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="bg-slate-100 p-2 rounded-full"
                >
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-400 text-[11px] uppercase mb-2"
                >
                  Item Details
                </Text>
                <TextInput
                  placeholder="Product Name or SKU"
                  value={newItemName}
                  onChangeText={setNewItemName}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-slate-900 font-[Outfit-Medium]"
                />

                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-400 text-[11px] uppercase mb-2"
                >
                  System SOH (Ask Staff)
                </Text>
                <TextInput
                  placeholder="e.g. 15"
                  keyboardType="numeric"
                  value={newSysQty}
                  onChangeText={setNewSysQty}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-slate-900 font-[Outfit-Medium]"
                />

                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-400 text-[11px] uppercase mb-3"
                >
                  Root Cause Reason
                </Text>
                <View className="flex-row flex-wrap gap-2 mb-8">
                  {REASON_CODES.map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      onPress={() => setSelectedReason(reason)}
                      className={`px-4 py-3 rounded-xl border ${
                        selectedReason === reason
                          ? "bg-sky-50 border-sky-500"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <Text
                        style={{ fontFamily: "Outfit-Bold" }}
                        className={`text-[11px] ${selectedReason === reason ? "text-sky-700" : "text-slate-500"}`}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleAddGap}
                  className="bg-sky-600 py-5 rounded-xl items-center"
                >
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-white text-lg"
                  >
                    Add to Gap Report
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Footer Submit Button */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 flex-row gap-3">
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

            <TouchableOpacity
              disabled={reportedGaps.length === 0}
              className={`${reportedGaps.length > 0 ? "bg-sky-600" : "bg-slate-200"} flex-[2] py-4 rounded-xl flex-row items-center justify-center`}
            >
              <ClipboardCheck
                size={18}
                color={reportedGaps.length > 0 ? "white" : "#94a3b8"}
              />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className={`${reportedGaps.length > 0 ? "text-white" : "text-slate-400"} ml-2 mr-2`}
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

export default Gap_Analysis;
