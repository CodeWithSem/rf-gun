import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  X,
  AlertTriangle,
  PackagePlus,
  ClipboardCheck,
  Package,
  Warehouse,
  CheckCircle2,
  XCircle,
  Save,
} from "lucide-react-native";

// API Imports
import {
  save_osa_api,
  fetch_osa_api,
  save_osa_history_api,
} from "@assets/scripts/api/inventory_stock/osa_api";

const OSA_DATA = [
  { id: "1", name: "Coke Regular 1.5L", sku: "CK-001", category: "Sodas" },
  { id: "2", name: "Sprite 500ml", sku: "SP-002", category: "Sodas" },
  { id: "3", name: "Lay's Classic XL", sku: "LY-003", category: "Snacks" },
  { id: "4", name: "Pringles Sour Cream", sku: "PR-004", category: "Snacks" },
];

const REASONS = [
  "Warehouse OOS",
  "Delivery Delayed",
  "Not in Planogram",
  "Expired",
];

const OSA = ({ navigation, route }) => {
  const { storeData, user } = route?.params || {
    storeData: { name: "Store Front" },
  };

  // MAIN STATE
  const [products, setProducts] = useState(
    OSA_DATA.map((p) => ({ ...p, status: null, remarks: null, qty: "" })),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // NOTIFICATION MODAL STATE
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifType, setNotifType] = useState("saved"); // "saved" | "submitted"

  // INPUT MODAL STATE
  const [modalVisible, setModalVisible] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [tempQty, setTempQty] = useState("");

  // CALCULATIONS
  const completedCount = products.filter((p) => p.status).length;
  const progressPercent = (completedCount / products.length) * 100;

  // FETCH DATA ON LOAD
  useEffect(() => {
    const loadSavedProgress = async () => {
      setLoading(true);
      const result = await fetch_osa_api(storeData.id, user.username);
      if (result.success && result.data?.inventory) {
        setProducts(result.data.inventory);
      }
      setLoading(false);
    };
    loadSavedProgress();
  }, []);

  // API SYNC ACTION
  const handleCloudAction = async (isFinal = false) => {
    if (isFinal) {
      const incompleteOOS = products.some(
        (p) => p.status === "oos" && !p.remarks,
      );
      if (incompleteOOS) {
        // Fallback to simple alert for validation only
        alert("Please select a reason for all Out of Stock items.");
        return;
      }
    }

    setSyncing(true);
    const [res1, res2] = await Promise.all([
      save_osa_api(storeData.id, user.username, products, isFinal),
      save_osa_history_api(storeData.id, user.username, products, isFinal),
    ]);
    setSyncing(false);

    if (res1.success && res2.success) {
      setNotifType(isFinal ? "submitted" : "saved");
      setNotifVisible(true);
    } else {
      alert("Sync Error: Could not reach database.");
    }
  };

  const toggleStatus = (id, status) => {
    const product = products.find((p) => p.id === id);
    if (status === "critical" || status === "overstock") {
      setActiveItem({ id, status, name: product.name });
      setTempQty(product.qty || "");
      setModalVisible(true);
    } else {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status,
                qty: "",
                remarks: status === "available" ? null : p.remarks,
              }
            : p,
        ),
      );
    }
  };

  const handleSaveModalData = () => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === activeItem.id
          ? { ...p, status: activeItem.status, qty: tempQty, remarks: null }
          : p,
      ),
    );
    setModalVisible(false);
  };

  const StatusButton = ({
    label,
    icon,
    active,
    activeBg, // e.g., 'bg-emerald-50'
    activeBorder, // e.g., 'border-emerald-500'
    activeText, // e.g., 'text-emerald-700'
    onPress,
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      // Replaced solid background with the hollow/tinted logic
      className={`flex-1 min-w-[48%] h-14 flex-col items-center justify-center rounded-xl border ${
        active ? `${activeBg} ${activeBorder}` : "bg-white border-slate-200"
      }`}
    >
      <View className="mb-1">{icon}</View>
      <Text
        style={{ fontFamily: "Outfit-Bold" }}
        className={`text-[11px] uppercase tracking-tight text-center ${
          active ? activeText : "text-slate-500"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // LOADING SCREEN
  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0284c7" />
        <Text className="mt-4 font-[Outfit-Medium] text-slate-500">
          Syncing with Cloud...
        </Text>
      </View>
    );
  }

  // RETURN ORIGIN
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* HEADER */}
      <View className="bg-white px-6 py-4 flex-row items-center border-b border-slate-100">
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
            On-Shelf Availability
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs"
          >
            {storeData?.description || "Store Front"}
          </Text>
        </View>
      </View>

      {/* SEARCH */}
      <View className="px-6 py-4 bg-white border-b border-slate-200">
        <View className="bg-slate-50 flex-row items-center px-4 rounded-lg border border-slate-200 shadow-sm">
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search SKU..."
            className="flex-1 py-3 ml-2 font-[Outfit-Regular]"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={products.filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )}
        renderItem={({ item }) => (
          <View className="bg-white p-5 rounded-xl mt-4 border border-slate-200">
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-base text-slate-700"
                >
                  {item.name}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Text
                    style={{ fontFamily: "Outfit-Regular" }}
                    className="text-slate-400 text-[10px]"
                  >
                    {item.sku}
                  </Text>
                  {item.qty ? (
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="ml-2 text-orange-400 text-[10px] uppercase bg-orange-50 px-1 rounded"
                    >
                      Quantity: {item.qty}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2">
              <StatusButton
                label="Available"
                icon={
                  <CheckCircle2
                    size={16}
                    color={item.status === "available" ? "#10b981" : "#94a3b8"}
                  />
                }
                active={item.status === "available"}
                activeBg="bg-emerald-50"
                activeBorder="border-emerald-500"
                activeText="text-emerald-700"
                onPress={() => toggleStatus(item.id, "available")}
              />

              <StatusButton
                label="Critical"
                icon={
                  <AlertTriangle
                    size={16}
                    color={item.status === "critical" ? "#f59e0b" : "#94a3b8"}
                  />
                }
                active={item.status === "critical"}
                activeBg="bg-amber-50"
                activeBorder="border-amber-500"
                activeText="text-amber-700"
                onPress={() => toggleStatus(item.id, "critical")}
              />

              <StatusButton
                label="Overstock"
                icon={
                  <PackagePlus
                    size={16}
                    color={item.status === "overstock" ? "#f59e0b" : "#94a3b8"}
                  />
                }
                active={item.status === "overstock"}
                activeBg="bg-amber-50"
                activeBorder="border-amber-500"
                activeText="text-amber-700"
                onPress={() => toggleStatus(item.id, "overstock")}
              />

              <StatusButton
                label="Out of Stock"
                icon={
                  <XCircle
                    size={16}
                    color={item.status === "oos" ? "#ef4444" : "#94a3b8"}
                  />
                }
                active={item.status === "oos"}
                activeBg="bg-rose-50"
                activeBorder="border-rose-500"
                activeText="text-rose-700"
                onPress={() => toggleStatus(item.id, "oos")}
              />
            </View>

            {item.status === "oos" && (
              <View className="mt-4 pt-4 border-t border-slate-50">
                <View className="flex-row items-center mb-3">
                  <View className="w-1 h-3 bg-red-500 rounded-full mr-2" />
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-[10px] text-slate-400 uppercase tracking-widest"
                  >
                    Select Remarks
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {REASONS.map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() =>
                        setProducts(
                          products.map((p) =>
                            p.id === item.id ? { ...p, remarks: r } : p,
                          ),
                        )
                      }
                      className={`px-3 py-2 rounded-lg border ${item.remarks === r ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}
                    >
                      <Text
                        style={{
                          fontFamily:
                            item.remarks === r
                              ? "Outfit-Bold"
                              : "Outfit-Regular",
                        }}
                        className={`text-[11px] ${item.remarks === r ? "text-red-600" : "text-slate-500"}`}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 180 }}
      />

      {/* FOOTER */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 flex-row gap-3">
        {syncing ? (
          <View className="w-full py-4 items-center justify-center">
            <ActivityIndicator color="#0284c7" />
          </View>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => handleCloudAction(false)}
              className="flex-1 bg-slate-100 py-4 rounded-xl border border-slate-200 items-center justify-center"
            >
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-600"
              >
                Save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleCloudAction(true)}
              className="flex-[2] bg-sky-600 py-4 rounded-xl flex-row items-center justify-center"
            >
              <ClipboardCheck size={18} color="white" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white ml-2"
              >
                Submit OSA
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* NOTIFICATION MODAL */}
      <Modal visible={notifVisible} transparent animationType="fade">
        <View className="flex-1 bg-slate-900/60 justify-center items-center px-10">
          <View className="bg-white w-full rounded-[30px] p-8 items-center shadow-2xl">
            <View
              className={`p-4 rounded-full mb-4 ${notifType === "submitted" ? "bg-green-100" : "bg-sky-100"}`}
            >
              {notifType === "submitted" ? (
                <CheckCircle2 size={40} color="#16a34a" />
              ) : (
                <Save size={40} color="#0284c7" />
              )}
            </View>

            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-xl text-slate-900 mb-2"
            >
              {notifType === "submitted" ? "OSA Submitted!" : "Progress Saved"}
            </Text>

            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-center mb-8"
            >
              {notifType === "submitted"
                ? "The OSA audit has been sent to the server successfully."
                : "Your draft has been updated. You can finish this later."}
            </Text>

            <TouchableOpacity
              onPress={() => {
                setNotifVisible(false);
                if (notifType === "submitted") navigation.goBack();
              }}
              className={`w-full py-4 rounded-2xl items-center ${notifType === "submitted" ? "bg-green-600" : "bg-sky-600"}`}
            >
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white text-base"
              >
                Okay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QUANTITY MODAL */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-slate-900/60 justify-end"
        >
          <View className="bg-white rounded-t-[40px] px-8 pt-8 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <View className="bg-orange-100 p-2 rounded-lg mr-3">
                  <Package size={20} color="#f59e0b" />
                </View>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-xl text-slate-900 capitalize"
                >
                  {activeItem?.status} Count
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-slate-100 p-2 rounded-full"
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-800 text-lg mb-1"
            >
              {activeItem?.name}
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-400 text-sm mb-8"
            >
              Update existing stock count.
            </Text>
            <View className="flex-row items-center mb-2">
              <Warehouse size={16} color="#f59e0b" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-orange-400 ml-2 text-xs uppercase"
              >
                Stock Quantity
              </Text>
            </View>
            <TextInput
              autoFocus
              keyboardType="numeric"
              value={tempQty}
              onChangeText={setTempQty}
              placeholder="0"
              className="bg-orange-50 border border-orange-100 rounded-xl p-5 font-[Outfit-Bold] text-2xl text-slate-700 mb-8"
            />
            <TouchableOpacity
              onPress={handleSaveModalData}
              className="bg-orange-400 w-full py-5 rounded-xl items-center shadow-lg shadow-sky-200"
            >
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white text-lg"
              >
                Confirm Count
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default OSA;
