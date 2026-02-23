import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Truck,
  Calendar,
  PackageCheck,
  PackageX,
  ChevronRight,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react-native";

const SHIPMENT_DATA = [
  {
    id: "DR-9901",
    date: "2026-02-28",
    items: 14,
    status: "pending", // pending, received, discrepancy
    driver: "Juan Dela Cruz",
    plate: "NUX-1234",
  },
  {
    id: "DR-9845",
    date: "2026-02-20",
    items: 22,
    status: "received",
    driver: "Dudong",
    plate: "ABC-5678",
  },
  {
    id: "DR-9788",
    date: "2026-02-01",
    items: 8,
    status: "discrepancy",
    driver: "Buknoy",
    plate: "XYZ-9012",
  },
];

const Delivery_Track = ({ navigation, route }) => {
  const { storeData } = route.params || {};
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [remarks, setRemarks] = useState("");

  const getStatusStyle = (status) => {
    switch (status) {
      case "received":
        return "bg-emerald-50 border-emerald-100 text-emerald-600";
      case "discrepancy":
        return "bg-rose-50 border-rose-100 text-rose-600";
      default:
        return "bg-amber-50 border-amber-100 text-amber-600";
    }
  };

  const openTrackingModal = (shipment) => {
    setSelectedShipment(shipment);
    setModalVisible(true);
  };

  const renderShipment = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openTrackingModal(item)}
        className="bg-white p-5 rounded-2xl mb-4 border border-slate-200"
      >
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <View className="flex-row items-center mb-1">
              <Truck size={14} color="#0284c7" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="ml-2 text-[10px] uppercase tracking-wider text-sky-600"
              >
                Shipment ID: {item.id}
              </Text>
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-900 text-base"
            >
              {item.items} Items Delivered
            </Text>
          </View>
          <View
            className={`px-3 py-1 rounded-full border ${statusStyle.split(" ").slice(0, 2).join(" ")}`}
          >
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className={`text-[9px] uppercase ${statusStyle.split(" ").pop()}`}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
          <View className="flex-row items-center">
            <Calendar size={14} color="#94a3b8" />
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-slate-500 text-xs ml-2"
            >
              {item.date}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-slate-400 text-[10px] mr-2"
            >
              DRIVER:
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-700 text-xs"
            >
              {item.driver}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-slate-100">
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
            Delivery Tracking
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs"
          >
            {storeData?.description || "Inbound Logistics"}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View className="px-6 py-3 bg-white border-b border-slate-200">
        <View className="bg-slate-50 flex-row items-center px-4 rounded-lg border border-slate-200">
          <Search size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search DR Number..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 py-3 ml-2 font-[Outfit-Regular]"
          />
        </View>
      </View>

      <FlatList
        data={SHIPMENT_DATA.filter((s) =>
          s.id.toLowerCase().includes(searchQuery.toLowerCase()),
        )}
        renderItem={renderShipment}
        keyExtractor={(item) => item.id}
        className="bg-slate-50 px-6"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
      />

      {/* Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-[32px] p-8">
              <View className="flex-row justify-between items-center mb-6">
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-xl text-slate-900"
                >
                  Confirm Delivery
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="bg-slate-100 p-2 rounded-full"
                >
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View className="bg-sky-50 p-4 rounded-2xl mb-6 border border-sky-100">
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-sky-700 text-base"
                >
                  {selectedShipment?.id}
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-sky-600 text-xs"
                >
                  Assigned Driver: {selectedShipment?.driver} (
                  {selectedShipment?.plate})
                </Text>
              </View>

              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-400 text-[11px] uppercase mb-3 ml-1"
              >
                Logistics Remarks
              </Text>
              <TextInput
                multiline
                numberOfLines={4}
                placeholder="Enter any discrepancies or notes (e.g. 2 boxes damaged)..."
                value={remarks}
                onChangeText={setRemarks}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-8 text-slate-900"
                textAlignVertical="top"
                style={{ fontFamily: "Outfit-Regular", height: 100 }}
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="flex-1 bg-rose-50 py-5 rounded-2xl flex-row items-center justify-center border border-rose-100"
                >
                  <PackageX size={18} color="#ef4444" />
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-rose-600 ml-2"
                  >
                    Shortage
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="flex-[2] bg-emerald-600 py-5 rounded-2xl flex-row items-center justify-center"
                >
                  <PackageCheck size={18} color="white" />
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-white ml-2 mr-2"
                  >
                    Confirm All
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Footer Info */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200">
        <View className="flex-row items-center justify-center">
          <AlertCircle size={14} color="#64748b" />
          <Text
            style={{ fontFamily: "Outfit-Medium" }}
            className="text-slate-500 text-xs ml-2"
          >
            Confirming will update the store's SOH immediately.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Delivery_Track;
