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
  ShoppingCart,
  Package,
  Plus,
  Minus,
  X,
  ChevronRight,
  ClipboardCheck,
  TrendingUp,
} from "lucide-react-native";

const PRODUCT_DATA = [
  {
    id: "1",
    name: "Coke Regular 1.5L",
    sku: "CK-001",
    soh: 24,
    moq: 12,
    category: "Sodas",
  },
  {
    id: "2",
    name: "Sprite 500ml",
    sku: "SP-002",
    soh: 48,
    moq: 24,
    category: "Sodas",
  },
  {
    id: "3",
    name: "Lay's Classic XL",
    sku: "LY-003",
    soh: 5,
    moq: 10,
    category: "Snacks",
  },
];

const Suggested_Order = ({ navigation, route }) => {
  const { storeData } = route.params || {};
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [tempQty, setTempQty] = useState("0");

  const openOrderModal = (product) => {
    setSelectedProduct(product);
    setTempQty(orders[product.id]?.toString() || "0");
    setModalVisible(true);
  };

  const saveOrder = () => {
    setOrders((prev) => ({
      ...prev,
      [selectedProduct.id]: parseInt(tempQty) || 0,
    }));
    setModalVisible(false);
  };

  const adjustTempQty = (amount) => {
    const val = (parseInt(tempQty) || 0) + amount;
    setTempQty(val < 0 ? "0" : val.toString());
  };

  const renderProduct = ({ item }) => {
    const orderQty = orders[item.id] || 0;
    const isLowStock = item.soh <= 10;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openOrderModal(item)}
        className="bg-white p-5 rounded-xl mb-3 border border-slate-200"
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Package size={14} color="#0284c7" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="ml-2 text-[10px] uppercase tracking-wider text-sky-600"
              >
                {item.category}
              </Text>
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-900 text-base"
            >
              {item.name}
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-400 text-[10px]"
            >
              SKU: {item.sku}
            </Text>
          </View>

          {orderQty > 0 && (
            <View className="bg-sky-600 px-3 py-1 rounded-full">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white text-[10px]"
              >
                ORDER: {orderQty}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row items-center justify-between bg-slate-50 rounded-xl p-4 mt-4 border border-slate-200">
          <View>
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-slate-400 text-[9px] uppercase"
            >
              Current Stock
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className={`text-sm ${isLowStock ? "text-rose-500" : "text-slate-700"}`}
            >
              {item.soh} Units
            </Text>
          </View>
          <ChevronRight size={16} color="#cbd5e1" />
          <View className="items-end">
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-slate-400 text-[9px] uppercase"
            >
              Order Suggestion
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-sky-600 text-sm"
            >
              {orderQty > 0 ? `${orderQty} Units` : "Tap to set"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header & Search (Same as Price Audit style) */}
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
            Suggested Order
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs"
          >
            {storeData?.name || "Order Generation"}
          </Text>
        </View>
      </View>

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

      <FlatList
        data={PRODUCT_DATA.filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        className="bg-slate-50 px-6"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
      />

      {/* Input Modal */}
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
                  Set Order Qty
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
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-800 text-base"
                >
                  {selectedProduct?.name}
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-slate-400 text-xs mt-1"
                >
                  Current SOH: {selectedProduct?.soh} | MOQ:{" "}
                  {selectedProduct?.moq}
                </Text>
              </View>

              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl p-2 mb-8">
                <TouchableOpacity
                  onPress={() => adjustTempQty(-1)}
                  className="bg-white p-4 rounded-xl border border-slate-200"
                >
                  <Minus size={24} color="#0284c7" />
                </TouchableOpacity>
                <TextInput
                  keyboardType="numeric"
                  value={tempQty}
                  onChangeText={setTempQty}
                  style={{ fontFamily: "Outfit-Bold", fontSize: 28 }}
                  className="flex-1 text-center text-slate-900"
                />
                <TouchableOpacity
                  onPress={() => adjustTempQty(1)}
                  className="bg-white p-4 rounded-xl border border-slate-200"
                >
                  <Plus size={24} color="#0284c7" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={saveOrder}
                className="bg-sky-600 py-5 rounded-2xl items-center"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-lg"
                >
                  Confirm Order
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Footer Buttons */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200 flex-row gap-3">
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
            Submit Order
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Suggested_Order;
