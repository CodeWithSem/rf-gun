import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  Warehouse,
  Store,
  CheckCircle2,
  X,
  Package,
  ClipboardCheck,
  Save,
} from "lucide-react-native";

// API IMPORTS
import {
  save_stock_audit_api,
  fetch_stock_audit_api,
  save_audit_history_api,
} from "@assets/scripts/api/inventory_stock/stock_audit_api";

// MASTER DATA (The source of truth)
const MASTER_PRODUCTS = [
  {
    id: "1",
    name: "Coke Regular 1.5L",
    sku: "CK-001",
    backroom: "0",
    selling: "0",
    category: "Sodas",
  },
  {
    id: "2",
    name: "Sprite 500ml",
    sku: "SP-002",
    backroom: "0",
    selling: "0",
    category: "Sodas",
  },
  {
    id: "3",
    name: "Lay's Classic XL",
    sku: "LY-003",
    backroom: "0",
    selling: "0",
    category: "Snacks",
  },
  {
    id: "4",
    name: "Pringles Sour Cream",
    sku: "PR-004",
    backroom: "0",
    selling: "0",
    category: "Snacks",
  },
];

const Stock_Audit = ({ navigation, route }) => {
  const { user, storeData } = route.params;

  // State
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifType, setNotifType] = useState("saved");

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [tempBackroom, setTempBackroom] = useState("");
  const [tempSelling, setTempSelling] = useState("");

  // 1. INITIAL FETCH & MERGE
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const result = await fetch_stock_audit_api(storeData.id, user.username);

      if (result.success && result.data.inventory) {
        const savedData = result.data.inventory;
        // Merge saved values into the Master List
        const merged = MASTER_PRODUCTS.map((mItem) => {
          const savedItem = savedData.find((sItem) => sItem.id === mItem.id);
          return savedItem ? savedItem : mItem;
        });
        setProducts(merged);
      } else {
        setProducts(MASTER_PRODUCTS);
      }
      setLoading(false);
    };
    loadData();
  }, [storeData.id]);

  // 2. CLOUD SAVE HANDLER
  const handleCloudAction = async (isFinal) => {
    setSyncing(true);

    try {
      // We run both the active state save and the history save together
      const [activeResult, historyResult] = await Promise.all([
        save_stock_audit_api(storeData.id, user.username, products, isFinal),
        save_audit_history_api(storeData.id, user.username, products, isFinal),
      ]);

      setSyncing(false);

      if (activeResult.success && historyResult.success) {
        setNotifType(isFinal ? "submitted" : "saved");
        setNotifVisible(true);
      } else {
        Alert.alert(
          "Partial Sync Error",
          "Data was saved but history log failed. Please check your connection.",
        );
      }
    } catch (error) {
      setSyncing(false);
      Alert.alert("Sync Error", "Critical failure connecting to Firestore.");
    }
  };

  // Open Modal
  const openAuditModal = (product) => {
    setSelectedProduct(product);
    setTempBackroom(product.backroom);
    setTempSelling(product.selling);
    setIsModalVisible(true);
  };

  // Save changes from Modal to Local State
  const handleSaveModalData = () => {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === selectedProduct.id
          ? {
              ...item,
              backroom: tempBackroom,
              selling: tempSelling,
              audited: true,
            }
          : item,
      ),
    );
    setIsModalVisible(false);
  };

  const renderProduct = ({ item }) => {
    // Logic for green indication
    const isAudited =
      item.audited || item.backroom !== "0" || item.selling !== "0";

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openAuditModal(item)}
        className={`bg-white p-5 rounded-2xl mb-3 border ${
          isAudited ? "border-green-500" : "border-slate-200"
        }`}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className={`text-base ${isAudited ? "text-green-700" : "text-slate-900"}`}
              >
                {item.name}
              </Text>
              {isAudited && (
                <View className="ml-2">
                  <CheckCircle2 size={16} color="#16a34a" />
                </View>
              )}
            </View>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-400 text-[10px] uppercase tracking-tighter"
            >
              SKU: {item.sku}
            </Text>
          </View>

          <View
            className={`${isAudited ? "bg-green-50" : "bg-slate-50"} px-3 py-1 rounded-full`}
          >
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className={`${isAudited ? "text-green-600" : "text-slate-500"} text-[10px]`}
            >
              {item.category}
            </Text>
          </View>
        </View>

        <View
          className={`flex-row mt-4 pt-4 border-t ${isAudited ? "border-green-50" : "border-slate-50"} justify-between`}
        >
          <View className="flex-row items-center">
            <Warehouse size={14} color={isAudited ? "#16a34a" : "#64748b"} />
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-slate-500 text-xs ml-2"
            >
              Backroom:{" "}
              <Text
                className={`${isAudited ? "text-green-700" : "text-slate-900"} font-[Outfit-Bold]`}
              >
                {item.backroom || "0"}
              </Text>
            </Text>
          </View>
          <View className="flex-row items-center">
            <Store size={14} color={isAudited ? "#16a34a" : "#0284c7"} />
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-slate-500 text-xs ml-2"
            >
              Shelf:{" "}
              <Text
                className={`${isAudited ? "text-green-700" : "text-sky-600"} font-[Outfit-Bold]`}
              >
                {item.selling || "0"}
              </Text>
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
              Stock Audit
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-xs"
            >
              {storeData?.description || "Store Front"}
            </Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View className="px-6 py-4 border-b border-slate-200">
        <View className="bg-slate-50 flex-row items-center px-4 rounded-lg border border-slate-200">
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search SKU..."
            className="flex-1 py-3 ml-2 font-[Outfit-Regular] text-slate-900"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              className="p-1"
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={products.filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )}
        className="bg-slate-50"
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 120,
        }}
      />

      {/* Modal */}
      <Modal visible={isModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-slate-900/60 justify-end"
        >
          <View className="bg-white rounded-t-[40px] px-8 pt-8 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <View className="bg-sky-100 p-2 rounded-lg mr-3">
                  <Package size={20} color="#0284c7" />
                </View>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-xl text-slate-900"
                >
                  Audit Count
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="bg-slate-100 p-2 rounded-full"
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-800 text-lg mb-1"
            >
              {selectedProduct?.name}
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-400 text-sm mb-8"
            >
              Update physical stock for this location.
            </Text>

            <View className="flex-row gap-4 mb-8">
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <Warehouse size={16} color="#64748b" />
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-500 ml-2 text-xs"
                  >
                    BACKROOM
                  </Text>
                </View>
                <TextInput
                  autoFocus
                  keyboardType="numeric"
                  value={tempBackroom}
                  onChangeText={setTempBackroom}
                  placeholder="0"
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 font-[Outfit-Bold] text-2xl text-slate-900"
                />
              </View>

              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <Store size={16} color="#0284c7" />
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-sky-600 ml-2 text-xs"
                  >
                    SELLING AREA
                  </Text>
                </View>
                <TextInput
                  keyboardType="numeric"
                  value={tempSelling}
                  onChangeText={setTempSelling}
                  placeholder="0"
                  className="bg-sky-50 border border-sky-100 rounded-2xl p-5 font-[Outfit-Bold] text-2xl text-sky-900"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSaveModalData}
              className="bg-sky-600 w-full py-5 rounded-2xl items-center"
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

      {/* Footer Buttons */}
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
                Submit Audit
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
              {notifType === "submitted"
                ? "Audit Submitted!"
                : "Progress Saved"}
            </Text>

            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-center mb-8"
            >
              {notifType === "submitted"
                ? "The inventory data has been sent to the server successfully."
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
                {/* {notifType === "submitted" ? "Back to Dashboard" : "Continue"} */}
                Okay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Stock_Audit;
