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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  AlertCircle,
  CheckCircle2,
  Tag,
  X,
  Edit3,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react-native";

const PRODUCT_DATA = [
  { id: "1", name: "Classic Cola 500ml", srp: 25.0, category: "Soda" },
  { id: "2", name: "Diet Cola 500ml", srp: 27.5, category: "Soda" },
  { id: "3", name: "Lemon Lime 1L", srp: 45.0, category: "Soda" },
  { id: "4", name: "Orange Fizz 330ml Can", srp: 18.0, category: "Juice" },
];

const Price_Audit = ({ navigation, route }) => {
  const { user, storeData } = route.params;
  const [searchQuery, setSearchQuery] = useState("");
  const [auditData, setAuditData] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [tempPrice, setTempPrice] = useState("");
  const [syncing, setSyncing] = useState(false);

  const openAuditModal = (product) => {
    setSelectedProduct(product);
    setTempPrice(auditData[product.id]?.actualPrice || "");
    setModalVisible(true);
  };

  const saveModalPrice = () => {
    setAuditData((prev) => ({
      ...prev,
      [selectedProduct.id]: {
        ...prev[selectedProduct.id],
        actualPrice: tempPrice,
        tagPresent: prev[selectedProduct.id]?.tagPresent ?? true,
      },
    }));
    setModalVisible(false);
    setSelectedProduct(null);
  };

  const toggleTag = (id) => {
    setAuditData((prev) => ({
      ...prev,
      [id]: { ...prev[id], tagPresent: !(prev[id]?.tagPresent ?? true) },
    }));
  };

  const renderProduct = ({ item }) => {
    const data = auditData[item.id] || { actualPrice: "", tagPresent: true };
    const isDiscrepancy =
      data.actualPrice && parseFloat(data.actualPrice) !== item.srp;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openAuditModal(item)}
        className="bg-white p-5 rounded-xl mb-3 border border-slate-200"
      >
        {/* Top Row: Name and Tag Status */}
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 mr-2">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-900 text-base leading-5"
            >
              {item.name}
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-400 text-[10px] uppercase tracking-tighter mt-1"
            >
              {item.category}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => toggleTag(item.id)}
            className={`px-3 py-1.5 rounded-full border ${data.tagPresent ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}
          >
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className={`text-[9px] ${data.tagPresent ? "text-emerald-600" : "text-rose-600"}`}
            >
              {data.tagPresent ? "TAG PRESENT" : "TAG MISSING"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Comparison Row: SRP vs Actual */}
        <View className="flex-row items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-200">
          {/* Left Side: Master SRP */}
          <View className="flex-1">
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-slate-400 text-[10px] uppercase mb-1"
            >
              Master SRP
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-600 text-base"
            >
              ₱ {item.srp.toFixed(2)}
            </Text>
          </View>

          {/* Center Divider/Icon */}
          <View className="px-4">
            <ChevronRight size={16} color="#cbd5e1" />
          </View>

          {/* Right Side: Shelf Price */}
          <View className="flex-1 items-end">
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-slate-400 text-[10px] uppercase mb-1"
            >
              Shelf Price
            </Text>
            <View className="flex-row items-center">
              {isDiscrepancy && (
                <AlertCircle
                  size={14}
                  color="#d97706"
                  style={{ marginRight: 6 }}
                />
              )}
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className={`text-lg ${data.actualPrice ? (isDiscrepancy ? "text-amber-600" : "text-emerald-600") : "text-slate-300"}`}
              >
                {data.actualPrice
                  ? `₱ ${parseFloat(data.actualPrice).toFixed(2)}`
                  : "₱ 0.00"}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Hint */}
        {!data.actualPrice && (
          <View className="flex-row items-center mt-3 justify-center">
            <Edit3 size={12} color="#94a3b8" />
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-slate-400 text-[11px] ml-1.5"
            >
              Tap to input shelf price
            </Text>
          </View>
        )}
      </TouchableOpacity>
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
              Price Audit
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
      <View className="px-6 py-3 bg-white border-b border-slate-200">
        <View className="bg-slate-50 flex-row items-center px-4 rounded-lg border border-slate-200">
          <Search size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search SKU..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 py-3 ml-2 font-[Outfit-Regular]"
          />
        </View>
      </View>

      {/* Product List */}
      <FlatList
        data={PRODUCT_DATA.filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        className="bg-slate-50 px-6"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Audit Modal */}
      <Modal
        animationType="fade"
        transparent={true}
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
                  Update Price
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="bg-slate-100 p-2 rounded-full"
                >
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View className="mb-6">
                <Text
                  style={{ fontFamily: "Outfit-Medium" }}
                  className="text-slate-500 mb-1"
                >
                  {selectedProduct?.name}
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-slate-400 text-xs"
                >
                  Standard SRP: ₱{selectedProduct?.srp.toFixed(2)}
                </Text>
              </View>

              <View className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex-row items-center mb-8">
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-2xl text-slate-400 mr-2"
                >
                  ₱
                </Text>
                <TextInput
                  autoFocus
                  keyboardType="numeric"
                  placeholder="0.00"
                  value={tempPrice}
                  onChangeText={setTempPrice}
                  style={{ fontFamily: "Outfit-Bold", fontSize: 24 }}
                  className="flex-1 text-slate-900"
                />
              </View>

              <TouchableOpacity
                onPress={saveModalPrice}
                className="bg-sky-600 py-5 rounded-xl items-center"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-lg"
                >
                  Confirm Price
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
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
              //   onPress={() => handleCloudAction(false)}
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
              //   onPress={() => handleCloudAction(true)}
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
    </SafeAreaView>
  );
};

export default Price_Audit;
