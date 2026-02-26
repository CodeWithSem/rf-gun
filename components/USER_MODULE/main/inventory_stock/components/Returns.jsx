import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StatusBar,
  Image,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  Plus,
  Trash2,
  Camera,
  Image as ImageIcon,
  X,
  CheckCircle2,
  PackageX,
  ArrowLeft,
  ChevronRight,
  Package,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

// Mock Data for SKU Selection
const MASTER_PRODUCTS = [
  { id: "1", name: "Coke Regular 1.5L", sku: "CK-001" },
  { id: "2", name: "Sprite 500ml", sku: "SP-002" },
  { id: "3", name: "Royal Can 330ml", sku: "RY-003" },
  { id: "4", name: "Mineral Water 1L", sku: "MW-004" },
];

const REASONS = [
  "Dented / Damaged Packaging",
  "Leaking / Broken Seal",
  "Factory Defect",
  "Pest Damage",
  "Product Recall",
];

const Returns = ({ navigation, route }) => {
  const { storeData } = route?.params || {};

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [modalSearch, setModalSearch] = useState(""); // For SKU selection search
  const [returns, setReturns] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: Select SKU, 2: Fill Details

  // Form State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera access is needed.");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const addEntry = () => {
    if (!qty) return Alert.alert("Error", "Please enter quantity");
    const newEntry = {
      id: Date.now().toString(),
      name: selectedProduct.name,
      sku: selectedProduct.sku,
      qty,
      reason,
      image,
      timestamp: new Date(),
    };
    setReturns([newEntry, ...returns]);
    closeAndResetModal();
  };

  const closeAndResetModal = () => {
    setIsModalVisible(false);
    setModalStep(1);
    setSelectedProduct(null);
    setQty("");
    setImage(null);
    setReason(REASONS[0]);
    setModalSearch("");
  };

  const handleCloudAction = (isSubmit) => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      Alert.alert(
        "Success",
        isSubmit ? "Returns submitted successfully" : "Draft saved",
      );
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <StatusBar barStyle="dark-content" />

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
            Returns / Bad Orders
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs"
          >
            {storeData?.description || "Document damaged stock"}
          </Text>
        </View>
      </View>

      {/* SEARCH */}
      <View className="px-6 py-4 bg-white border-b border-slate-200">
        <View className="bg-slate-50 flex-row items-center px-4 rounded-lg border border-slate-200">
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search documented returns..."
            className="flex-1 py-3 ml-2 font-[Outfit-Regular] text-slate-900"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* MAIN LIST */}
      <View className="flex-1">
        <FlatList
          data={returns.filter((r) =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase()),
          )}
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl mb-4 border border-slate-200 flex-row items-center">
              <View className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden mr-4 items-center justify-center border border-slate-100">
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <ImageIcon size={20} color="#cbd5e1" />
                )}
              </View>
              <View className="flex-1">
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-900 text-sm"
                >
                  {item.name}
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-slate-500 text-[10px] mb-1"
                >
                  SKU: {item.sku}
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-red-600 text-xs"
                >
                  QTY: {item.qty} • {item.reason.split(" ")[0]}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setReturns(returns.filter((r) => r.id !== item.id))
                }
                className="p-2 bg-red-50 rounded-full mr-2"
              >
                <Trash2 size={18} color="#f87171" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={() => (
            <View className="items-center justify-center mt-20">
              <PackageX size={48} color="#cbd5e1" />
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-400 mt-4"
              >
                No bad orders recorded yet.
              </Text>
            </View>
          )}
        />
      </View>

      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 flex-row gap-3">
        {isSyncing ? (
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
              className="flex-[1.5] bg-red-600 py-4 rounded-xl items-center justify-center flex-row"
            >
              <CheckCircle2 size={18} color="white" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white ml-2"
              >
                Submit Returns
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setIsModalVisible(true)}
        className="absolute bottom-32 right-6 bg-red-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={isModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          enabled
        >
          <View className="flex-1 bg-slate-900/50 justify-end">
            <View className="bg-white rounded-t-[40px] p-8 shadow-2xl h-[85%]">
              {/* Modal Header */}
              <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center">
                  {modalStep === 2 && (
                    <TouchableOpacity
                      onPress={() => setModalStep(1)}
                      className="mr-3"
                    >
                      <ArrowLeft size={20} color="#0f172a" />
                    </TouchableOpacity>
                  )}
                  <View className="bg-red-600 p-2 rounded-lg mr-3">
                    <Package size={20} color="white" />
                  </View>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-xl text-slate-900"
                  >
                    {modalStep === 1 ? "Select SKU" : "Add Details"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closeAndResetModal}
                  className="bg-slate-100 p-2 rounded-full"
                >
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {modalStep === 1 ? (
                /* STEP 1: SKU SELECTION LIST */
                <View className="flex-1">
                  <View className="bg-slate-50 flex-row items-center px-4 rounded-lg border border-slate-200 mb-4">
                    <Search size={18} color="#94a3b8" />
                    <TextInput
                      placeholder="Search SKU..."
                      className="flex-1 py-3 ml-2 font-[Outfit-Regular]"
                      value={modalSearch}
                      onChangeText={setModalSearch}
                    />
                  </View>
                  <FlatList
                    data={MASTER_PRODUCTS.filter(
                      (p) =>
                        p.name
                          .toLowerCase()
                          .includes(modalSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(modalSearch.toLowerCase()),
                    )}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedProduct(item);
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
                </View>
              ) : (
                /* STEP 2: FORM DETAILS (Original UI) */
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-200">
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-slate-900"
                    >
                      {selectedProduct?.name}
                    </Text>
                    <Text
                      style={{ fontFamily: "Outfit-Regular" }}
                      className="text-slate-500 text-xs"
                    >
                      SKU: {selectedProduct?.sku}
                    </Text>
                  </View>

                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-500 text-[10px] uppercase mb-2 ml-1"
                  >
                    Quantity
                  </Text>
                  <TextInput
                    value={qty}
                    onChangeText={setQty}
                    keyboardType="numeric"
                    className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 font-[Outfit-Bold] text-slate-900"
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                  />

                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-500 text-[10px] uppercase mb-2 ml-1"
                  >
                    Reason for Return
                  </Text>
                  <View className="flex-row flex-wrap gap-2 mb-6">
                    {REASONS.map((r) => (
                      <TouchableOpacity
                        key={r}
                        onPress={() => setReason(r)}
                        className={`px-3 py-2 rounded-lg border ${reason === r ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}
                      >
                        <Text
                          style={{ fontFamily: "Outfit-Medium" }}
                          className={`text-[11px] ${reason === r ? "text-red-600" : "text-slate-600"}`}
                        >
                          {r}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-500 text-[10px] uppercase mb-2 ml-1"
                  >
                    Damage Documentation (1x1)
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={pickImage}
                    className="w-full aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 items-center justify-center mb-8 overflow-hidden"
                  >
                    {image ? (
                      <Image
                        source={{ uri: image }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="items-center">
                        <Camera size={36} color="#94a3b8" />
                        <Text
                          style={{ fontFamily: "Outfit-Regular" }}
                          className="text-slate-400 mt-2"
                        >
                          Take 1x1 Photo
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={addEntry}
                    className="bg-red-600 py-5 rounded-xl items-center mb-4"
                  >
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-white text-base"
                    >
                      Add to List
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default Returns;
