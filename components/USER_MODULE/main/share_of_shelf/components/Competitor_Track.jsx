import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  Plus,
  X,
  ClipboardCheck,
  Tag,
  TrendingDown,
} from "lucide-react-native";

// Mock Data: Competitor Products found in the store
const COMPETITOR_CATALOG = [
  { id: "CP-01", name: "Pepsi 500ml", brand: "PepsiCo" },
  { id: "CP-02", name: "Coke 500ml", brand: "Coca-Cola" },
  { id: "CP-03", name: "Red Bull 250ml", brand: "Red Bull" },
  { id: "CP-04", name: "Monster Energy 500ml", brand: "Monster" },
  { id: "CP-05", name: "Sprite 500ml", brand: "Coca-Cola" },
];

const Competitor_Tracking = ({ navigation, route }) => {
  const { storeData } = route?.params || {
    storeData: { description: "General Display" },
  };

  // Main List State
  const [trackedItems, setTrackedItems] = useState([
    {
      id: "1",
      name: "Pepsi 500ml",
      brand: "PepsiCo",
      price: "1.50",
      isPromo: true,
    },
  ]);

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [modalSearch, setModalSearch] = useState("");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState(1);

  // Form States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shelfPrice, setShelfPrice] = useState("");
  const [hasPromo, setHasPromo] = useState(false);

  const handleAddTrack = () => {
    if (!selectedProduct || !shelfPrice) return;

    const newEntry = {
      id: Date.now().toString(),
      name: selectedProduct.name,
      brand: selectedProduct.brand,
      price: shelfPrice,
      isPromo: hasPromo,
    };

    setTrackedItems([newEntry, ...trackedItems]);
    resetForm();
  };

  const resetForm = () => {
    setAddModalVisible(false);
    setModalStep(1);
    setSelectedProduct(null);
    setShelfPrice("");
    setHasPromo(false);
    setModalSearch("");
  };

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
            Competitor Tracking
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs"
          >
            {storeData?.description}
          </Text>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View className="px-6 py-4 bg-white border-b border-slate-200">
        <View className="bg-slate-50 flex-row items-center px-4 rounded-lg border border-slate-200">
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search tracked competitors..."
            className="flex-1 py-3 ml-2 font-[Outfit-Regular]"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={trackedItems.filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )}
        contentContainerStyle={{ padding: 20, paddingBottom: 180 }}
        renderItem={({ item }) => (
          <View className="bg-white p-5 rounded-xl mb-4 border border-slate-200">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <View className="bg-sky-100 p-2 rounded-lg mr-3">
                  <Tag size={18} color="#0284c7" />
                </View>
                <View>
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
                    {item.brand}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                className="mb-3 mr-1"
                onPress={() =>
                  setTrackedItems(trackedItems.filter((i) => i.id !== item.id))
                }
              >
                <Trash2 size={18} color="#f87171" />
              </TouchableOpacity>
            </View>

            <View className="flex-row bg-slate-50 rounded-xl p-4 items-center">
              <View className="flex-1 border-r border-slate-200">
                <Text className="text-[10px] text-slate-400 uppercase font-[Outfit-Bold]">
                  Shelf Price
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-900 text-lg"
                >
                  {item.price}
                </Text>
              </View>
              <View className="flex-1 pl-4 flex-row items-center">
                <View
                  className={`px-2 py-1 rounded-md ${item.isPromo ? "bg-emerald-100" : "bg-slate-200"}`}
                >
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className={`text-[10px] ${item.isPromo ? "text-emerald-700" : "text-slate-500"}`}
                  >
                    {item.isPromo ? "ON PROMO" : "REGULAR"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setAddModalVisible(true)}
        className="absolute bottom-32 right-6 bg-sky-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Plus size={24} color="white" />
      </TouchableOpacity>

      {/* FOOTER */}
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
            Submit Audit
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL */}
      <Modal visible={addModalVisible} animationType="fade" transparent>
        <View className="flex-1 bg-slate-900/60 justify-end">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View className="bg-white rounded-t-[40px] px-8 pt-6 pb-12">
              <View className="w-12 h-1 bg-slate-200 rounded-full self-center mb-6" />

              <View className="flex-row justify-between items-center mb-6">
                <View>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-xl text-slate-900"
                  >
                    {modalStep === 1 ? "Select Competitor" : "Pricing Details"}
                  </Text>
                  {modalStep === 2 && (
                    <Text
                      style={{ fontFamily: "Outfit-Medium" }}
                      className="text-sky-600 text-xs"
                    >
                      {selectedProduct?.name}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={resetForm}
                  className="bg-slate-100 p-2 rounded-full"
                >
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {modalStep === 1 ? (
                <View>
                  <View className="bg-slate-50 flex-row items-center px-4 rounded-xl border border-slate-200 mb-4">
                    <Search size={18} color="#94a3b8" />
                    <TextInput
                      placeholder="Search competitor product..."
                      className="flex-1 py-3 ml-2 font-[Outfit-Regular]"
                      value={modalSearch}
                      onChangeText={setModalSearch}
                    />
                  </View>
                  <View style={{ maxHeight: 300 }}>
                    <FlatList
                      data={COMPETITOR_CATALOG.filter((p) =>
                        p.name
                          .toLowerCase()
                          .includes(modalSearch.toLowerCase()),
                      )}
                      showsVerticalScrollIndicator={false}
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
                              style={{ fontFamily: "Outfit-Medium" }}
                              className="text-slate-700"
                            >
                              {item.name}
                            </Text>
                            <Text
                              style={{ fontFamily: "Outfit-Regular" }}
                              className="text-slate-400 text-xs"
                            >
                              {item.brand}
                            </Text>
                          </View>
                          <ChevronRight size={18} color="#cbd5e1" />
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </View>
              ) : (
                <View>
                  <View className="mb-6">
                    <Text className="text-[10px] text-slate-400 uppercase font-[Outfit-Bold] mb-2 ml-1">
                      Shelf Price
                    </Text>
                    <TextInput
                      autoFocus
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      value={shelfPrice}
                      onChangeText={setShelfPrice}
                      className="flex h-16 px-4 bg-slate-50 rounded-xl border border-slate-200 font-[Outfit-Bold] text-slate-700 text-2xl"
                    />
                  </View>

                  <Text className="text-[10px] text-slate-400 uppercase font-[Outfit-Bold] mb-2 ml-1">
                    Current Status
                  </Text>
                  <View className="flex-row gap-3 mb-8">
                    <TouchableOpacity
                      onPress={() => setHasPromo(false)}
                      className={`flex-1 py-4 rounded-xl border items-center ${!hasPromo ? "bg-slate-900 border-slate-900" : "bg-white border-slate-200"}`}
                    >
                      <Text
                        style={{ fontFamily: "Outfit-Bold" }}
                        className={!hasPromo ? "text-white" : "text-slate-500"}
                      >
                        Regular
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setHasPromo(true)}
                      className={`flex-1 py-4 rounded-xl border flex-row items-center justify-center ${hasPromo ? "bg-emerald-600 border-emerald-600" : "bg-white border-slate-200"}`}
                    >
                      <TrendingDown
                        size={16}
                        color={hasPromo ? "white" : "#94a3b8"}
                      />
                      <Text
                        style={{ fontFamily: "Outfit-Bold" }}
                        className={`ml-2 ${hasPromo ? "text-white" : "text-slate-500"}`}
                      >
                        On Promo
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => setModalStep(1)}
                      className="flex-1 bg-slate-50 py-5 rounded-xl items-center justify-center border border-slate-200"
                    >
                      <Text
                        style={{ fontFamily: "Outfit-Bold" }}
                        className="text-slate-500"
                      >
                        Back
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleAddTrack}
                      className="flex-[2] bg-sky-600 py-5 rounded-xl items-center justify-center"
                    >
                      <Text
                        style={{ fontFamily: "Outfit-Bold" }}
                        className="text-white text-lg"
                      >
                        Confirm Audit
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Competitor_Tracking;
