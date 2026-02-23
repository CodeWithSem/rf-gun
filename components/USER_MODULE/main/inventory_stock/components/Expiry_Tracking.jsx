import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ChevronLeft,
  Search,
  Calendar as CalendarIcon,
  Trash2,
  Plus,
  X,
  Clock,
  CalendarDays,
  FileText,
  ArrowLeft,
  ChevronRight,
  Pencil,
  PackagePlus,
  AlertCircle,
  ClipboardCheck,
  Package,
  CheckCircle2,
  PackageX,
  Save,
} from "lucide-react-native";
import {
  fetch_expiry_api,
  save_expiry_api,
  pull_out_item_api,
} from "@assets/scripts/api/inventory_stock/expiry_tracking";

const MASTER_PRODUCTS = [
  { id: "CK-001", name: "Coke Regular 1.5L", sku: "CK-001" },
  { id: "SP-002", name: "Sprite 500ml", sku: "SP-002" },
  { id: "LY-003", name: "Lay's Classic XL", sku: "LY-003" },
];

const EXPIRY_DATA = [
  {
    id: "1",
    name: "Coke Regular 1.5L",
    sku: "CK-001",
    expiryDate: new Date(2026, 2, 1),
    status: "critical",
    qty: "10",
    batchDesc: "Front Aisle",
  },
  {
    id: "2",
    name: "Sprite 500ml",
    sku: "SP-002",
    expiryDate: new Date(2026, 1, 15),
    status: "expired",
    qty: "5",
    batchDesc: "Back Storage",
  },
];

const Expiry_Tracking = ({ navigation, route }) => {
  const { user, storeData } = route?.params || {
    storeData: { description: "Store Front" },
  };

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // MODAL STATES
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [syncing, setSyncing] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifType, setNotifType] = useState("saved");
  const [pullModalVisible, setPullModalVisible] = useState(false);
  const [selectedPullItem, setSelectedPullItem] = useState(null);

  // SHARED FORM STATES
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [qty, setQty] = useState("");
  const [batchDesc, setBatchDesc] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // DELETE MODAL STATES
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [loading, setLoading] = useState(true);

  const loadInitialData = async () => {
    // Ensure these match the IDs used in your save function
    const storeId = storeData?.id || "default_store";
    const userId = user?.username || "SYSTEM";

    const result = await fetch_expiry_api(storeId, userId);

    if (result.success) {
      // Overwrite the default EXPIRY_DATA with what's in the cloud
      setProducts(result.data.batches);
    } else {
      // If no cloud data exists, the local 'products' stays as EXPIRY_DATA
      console.log("No previous data found:", result.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const formatDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getStatus = (expiryDate) => {
    const today = new Date();
    const diff = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "expired";
    if (diff <= 15) return "critical";
    return "healthy";
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "expired":
        return {
          bg: "bg-red-50",
          text: "text-red-600",
          border: "border-red-100",
          label: "Expired",
        };
      case "critical":
        return {
          bg: "bg-orange-50",
          text: "text-orange-600",
          border: "border-orange-100",
          label: "Critical",
        };
      default:
        return {
          bg: "bg-green-50",
          text: "text-green-600",
          border: "border-green-100",
          label: "Healthy",
        };
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  // Trigger the modal
  const handleDelete = (id) => {
    setItemToDelete(id);
    setDeleteModalVisible(true);
  };

  // Execute the deletion
  const confirmDelete = () => {
    if (itemToDelete) {
      setProducts((prev) => prev.filter((p) => p.id !== itemToDelete));
      setDeleteModalVisible(false);
      setItemToDelete(null);
    }
  };

  const handleUpdatePress = (item) => {
    setSelectedItem(item);
    setDate(new Date(item.expiryDate));
    setUpdateModalVisible(true);
  };

  const saveUpdatedDate = () => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedItem.id
          ? { ...p, expiryDate: date, status: getStatus(date) }
          : p,
      ),
    );
    setUpdateModalVisible(false);
  };

  const handleAddBatch = () => {
    if (!selectedMaster) return;
    const newBatch = {
      id: Date.now().toString(),
      name: selectedMaster.name,
      sku: selectedMaster.sku,
      expiryDate: date,
      status: getStatus(date),
      qty: qty || "0",
      batchDesc: batchDesc || "No description",
    };
    setProducts([newBatch, ...products]);
    resetAddModal();
  };

  const resetAddModal = () => {
    setAddModalVisible(false);
    setModalStep(1);
    setSelectedMaster(null);
    setQty("");
    setBatchDesc("");
    setDate(new Date());
  };

  const handleCloudAction = async (isSubmit) => {
    setSyncing(true);
    const storeId = storeData?.id || "default_store";
    const userId = user?.username || "SYSTEM";
    const response = await save_expiry_api(storeId, userId, products, isSubmit);

    if (response.success) {
      setNotifType(isSubmit ? "submitted" : "saved");
      setNotifVisible(true);
    } else {
      Alert.alert("Error", "Could not sync data. Check connection.");
    }

    setSyncing(false);
  };

  const handleConfirmPullOut = async () => {
    if (!selectedPullItem) return;
    setSyncing(true);
    const storeId = storeData?.id;
    const userId = user?.username;
    try {
      const historyRes = await pull_out_item_api(
        storeId,
        userId,
        selectedPullItem,
      );

      if (historyRes.success) {
        const updatedProducts = products.filter(
          (p) => p.id !== selectedPullItem.id,
        );
        setProducts(updatedProducts);
        await save_expiry_api(storeId, userId, updatedProducts);
        setPullModalVisible(false);
        setSelectedPullItem(null);
      } else {
        Alert.alert("Error", "Failed to record the pull-out event.");
      }
    } catch (error) {
      console.error("Pull Out Error:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setSyncing(false);
    }
  };

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
      <View className="bg-white px-6 py-4 flex-row items-center border-b border-slate-200">
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
            Expiry Tracking
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs"
          >
            {storeData?.description}
          </Text>
        </View>
      </View>

      {/* SEARCH */}
      <View className="px-6 py-4 bg-white border-b border-slate-200">
        <View className="bg-slate-50 flex-row items-center px-4 rounded-lg border border-slate-200 shadow-sm">
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search active batches..."
            className="flex-1 py-3 ml-2 font-[Outfit-Regular]"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={products
          .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))

          .filter((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()),
          )}
        contentContainerStyle={{ padding: 20, paddingBottom: 180 }}
        renderItem={({ item }) => {
          const style = getStatusStyle(item.status);
          return (
            <View className="bg-white p-5 rounded-xl mb-4 border border-slate-200 shadow-sm">
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1">
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-base text-slate-900"
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={{ fontFamily: "Outfit-Regular" }}
                    className="text-slate-400 text-xs"
                  >
                    SKU: {item.sku}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-slate-600 text-[10px] bg-slate-100 px-2 py-0.5 rounded mr-2"
                    >
                      QTY: {item.qty}
                    </Text>
                    <Text
                      style={{ fontFamily: "Outfit-Regular" }}
                      className="text-slate-400 text-[10px]"
                      numberOfLines={1}
                    >
                      {item.batchDesc}
                    </Text>
                  </View>
                </View>
                <View
                  className={`px-3 py-1 rounded-full border ${style.bg} ${style.border}`}
                >
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className={`text-[10px] uppercase ${style.text}`}
                  >
                    {style.label}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between pt-4 border-t border-slate-50">
                <View className="flex-row items-center">
                  <CalendarIcon size={16} color="#64748b" />
                  <View className="ml-2">
                    <Text
                      style={{ fontFamily: "Outfit-Regular" }}
                      className="text-slate-400 text-[10px] uppercase"
                    >
                      Expiry
                    </Text>
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-slate-700 text-sm"
                    >
                      {formatDate(item.expiryDate)}
                    </Text>
                  </View>
                </View>

                {/* ACTION BUTTONS ROW */}
                <View className="flex-row items-center gap-2">
                  {/* UPDATE BUTTON (Sky Icon) */}
                  <TouchableOpacity
                    onPress={() => handleUpdatePress(item)}
                    className="bg-sky-50 p-2.5 rounded-lg"
                  >
                    <Pencil size={18} color="#0284c7" />
                  </TouchableOpacity>

                  {/* DELETE BUTTON (Red Icon) */}
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    className="bg-red-50 p-2.5 rounded-lg"
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                  {item.status === "expired" && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedPullItem(item);
                        setPullModalVisible(true);
                      }}
                      className="bg-red-500 px-4 py-2.5 rounded-lg flex-row items-center"
                    >
                      <PackageX size={16} color="white" />
                      <Text
                        style={{ fontFamily: "Outfit-Bold" }}
                        className="text-white ml-2 text-xs"
                      >
                        Pull Out
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* UPDATE MODAL */}
      <Modal visible={updateModalVisible} animationType="fade" transparent>
        <View className="flex-1 bg-slate-900/60 justify-end">
          <View className="bg-white rounded-t-[40px] px-8 pt-8 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <View className="bg-sky-100 p-2 rounded-lg mr-3">
                  <Clock size={20} color="#0284c7" />
                </View>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-xl text-slate-900"
                >
                  Update Date
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setUpdateModalVisible(false)}
                className="bg-slate-100 p-2 rounded-full"
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 flex-row items-center justify-between"
            >
              <View>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-sky-600 text-[10px] uppercase mb-1"
                >
                  New Expiration
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-2xl text-slate-900"
                >
                  {formatDate(date)}
                </Text>
              </View>
              <CalendarDays size={28} color="#0284c7" />
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
              />
            )}
            <TouchableOpacity
              onPress={saveUpdatedDate}
              className="bg-sky-600 w-full py-5 rounded-xl items-center shadow-lg"
            >
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white text-lg"
              >
                Confirm Update
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ADD BATCH MODAL (Multi-Step) */}
      <Modal visible={addModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-slate-900/60 justify-end">
            <View className="bg-white rounded-t-[40px] px-8 pt-8 pb-10 h-[85%]">
              <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center">
                  {modalStep === 2 && (
                    <TouchableOpacity
                      onPress={() => setModalStep(1)}
                      className="mr-3 p-1"
                    >
                      <ArrowLeft size={24} color="#0f172a" />
                    </TouchableOpacity>
                  )}
                  <View className="bg-sky-600 p-2 rounded-lg mr-3">
                    <PackagePlus size={20} color="white" />
                  </View>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-xl text-slate-900"
                  >
                    {modalStep === 1 ? "Select SKU" : "Batch Details"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={resetAddModal}
                  className="bg-slate-100 p-2 rounded-full"
                >
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {modalStep === 1 ? (
                <>
                  <View className="bg-slate-50 flex-row items-center px-4 rounded-lg border border-slate-200 mb-4">
                    <Search size={18} color="#94a3b8" />
                    <TextInput
                      placeholder="Search SKU..."
                      className="flex-1 py-3 ml-2 font-[Outfit-Regular]"
                      onChangeText={(text) => setSearchQuery(text)}
                    />
                  </View>
                  <FlatList
                    data={MASTER_PRODUCTS.filter((p) =>
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()),
                    )}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedMaster(item);
                          setModalStep(2);
                        }}
                        className="p-4 rounded-xl mb-2 border bg-white border-slate-200 flex-row justify-between items-center"
                      >
                        <View>
                          <Text
                            style={{ fontFamily: "Outfit-Bold" }}
                            className="text-slate-900"
                          >
                            {item.name}
                          </Text>
                          <Text
                            style={{ fontFamily: "Outfit-Regular" }}
                            className="text-slate-400 text-xs"
                          >
                            {item.sku}
                          </Text>
                        </View>
                        <ChevronRight size={18} color="#cbd5e1" />
                      </TouchableOpacity>
                    )}
                  />
                </>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="bg-sky-50 p-4 rounded-xl mb-6">
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-sky-900"
                    >
                      {selectedMaster?.name}
                    </Text>
                    <Text
                      style={{ fontFamily: "Outfit-Regular" }}
                      className="text-sky-600 text-xs"
                    >
                      SKU: {selectedMaster?.sku}
                    </Text>
                  </View>

                  <View className="mb-4">
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-slate-400 text-[10px] uppercase mb-2 ml-1"
                    >
                      Quantity
                    </Text>
                    <View className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 flex-row items-center">
                      <TextInput
                        placeholder="0"
                        keyboardType="numeric"
                        value={qty}
                        onChangeText={setQty}
                        className="flex-1 font-[Outfit-Bold] text-slate-900"
                      />
                    </View>
                  </View>

                  <View className="mb-6">
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-slate-400 text-[10px] uppercase mb-2 ml-1"
                    >
                      Location / Description
                    </Text>
                    <View className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 flex-row items-center">
                      <FileText size={16} color="#94a3b8" className="mr-2" />
                      <TextInput
                        placeholder="e.g. Rack A-1"
                        value={batchDesc}
                        onChangeText={setBatchDesc}
                        className="flex-1 font-[Outfit-Bold] text-slate-900"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => setShowPicker(true)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 flex-row items-center justify-between"
                  >
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-2xl text-slate-900"
                    >
                      {formatDate(date)}
                    </Text>
                    <CalendarDays size={28} color="#0284c7" />
                  </TouchableOpacity>

                  {showPicker && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={onDateChange}
                    />
                  )}

                  <TouchableOpacity
                    onPress={handleAddBatch}
                    className="bg-sky-600 w-full py-5 rounded-xl items-center shadow-lg"
                  >
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-white text-lg"
                    >
                      Add to Tracking
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* DELETE CONFIRMATION MODAL */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-slate-900/50 justify-center items-center px-8">
          <View className="bg-white w-full rounded-3xl p-8 items-center">
            <View className="bg-red-50 p-4 rounded-full mb-4">
              <AlertCircle size={40} color="#ef4444" />
            </View>

            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-2xl text-slate-900 text-center"
            >
              Delete Batch?
            </Text>

            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-center mt-2 mb-8 text-base"
            >
              Are you sure you want to remove this record? This action cannot be
              undone.
            </Text>

            <View className="w-full">
              <TouchableOpacity
                onPress={confirmDelete}
                className="bg-red-500 w-full py-4 rounded-xl items-center mb-3 shadow-lg shadow-red-200"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-lg"
                >
                  Confirm & Delete
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setDeleteModalVisible(false);
                  setItemToDelete(null);
                }}
                className="w-full py-4 rounded-xl items-center"
              >
                <Text
                  style={{ fontFamily: "Outfit-SemiBold" }}
                  className="text-slate-500 text-lg"
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => {
          setDate(new Date());
          setAddModalVisible(true);
        }}
        className="absolute bottom-32 right-6 bg-sky-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>
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
              className={`p-4 rounded-full mb-4 ${
                notifType === "submitted" ? "bg-green-100" : "bg-sky-100"
              }`}
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
              className={`w-full py-4 rounded-xl items-center ${
                notifType === "submitted" ? "bg-green-600" : "bg-sky-600"
              }`}
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
      {/* PULL OUT CONFIRMATION MODAL */}
      <Modal visible={pullModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-slate-900/60 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 shadow-2xl">
            <View className="items-center mb-6">
              <View className="w-16 h-1.5 bg-slate-200 rounded-full mb-6" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-xl text-slate-900"
              >
                Confirm Pull Out
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-500"
              >
                Are you sure you want to remove this item?
              </Text>
            </View>

            {/* Item Info Card (Matches your List Style) */}
            <View className="bg-slate-50 p-5 rounded-xl border border-slate-100 mb-8">
              <View className="flex-row justify-between mb-2">
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-base text-slate-900 flex-1"
                >
                  {selectedPullItem?.name}
                </Text>
                <View className="bg-red-100 px-2 py-1 rounded-md">
                  <Text className="text-red-600 text-[10px] font-bold uppercase">
                    EXPIRED
                  </Text>
                </View>
              </View>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-400 text-xs mb-3"
              >
                SKU: {selectedPullItem?.sku}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-slate-600 text-xs font-bold mr-4">
                  QTY: {selectedPullItem?.qty}
                </Text>
                <Text className="text-slate-400 text-xs">
                  {selectedPullItem?.batchDesc}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setPullModalVisible(false)}
                className="flex-1 bg-slate-100 py-4 rounded-xl items-center justify-center"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-600"
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmPullOut}
                className="flex-[2] bg-red-600 py-4 rounded-xl items-center flex-row justify-center"
              >
                {syncing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Trash2 size={20} color="white" />
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-white ml-2"
                    >
                      Confirm & Remove
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Expiry_Tracking;
