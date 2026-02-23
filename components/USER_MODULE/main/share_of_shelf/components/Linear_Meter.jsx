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
  ScrollView,
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
  Layers,
} from "lucide-react-native";

// Mock Data
const CATEGORIES = [
  { id: "CAT-01", name: "Carbonated Soft Drinks" },
  { id: "CAT-02", name: "Energy Drinks" },
  { id: "CAT-03", name: "Bottled Water" },
  { id: "CAT-04", name: "Juices & Nectars" },
  { id: "CAT-05", name: "Isotonic Drinks" },
];

const Linear_Meter = ({ navigation, route }) => {
  const { storeData } = route?.params || {
    storeData: { description: "General Display" },
  };

  // Main State
  const [measurements, setMeasurements] = useState([
    {
      id: "1",
      categoryName: "Carbonated Soft Drinks",
      ourLength: 150,
      totalLength: 450,
    },
  ]);

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [modalSearch, setModalSearch] = useState("");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState(1);

  // Form States
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [ourLength, setOurLength] = useState("");
  const [totalLength, setTotalLength] = useState("");

  const handleAddMeasurement = () => {
    if (!selectedCategory || !ourLength || !totalLength) return;

    const newEntry = {
      id: Date.now().toString(),
      categoryName: selectedCategory.name,
      ourLength: parseFloat(ourLength),
      totalLength: parseFloat(totalLength),
    };

    setMeasurements([newEntry, ...measurements]);
    resetForm();
  };

  const resetForm = () => {
    setAddModalVisible(false);
    setModalStep(1);
    setSelectedCategory(null);
    setOurLength("");
    setTotalLength("");
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
            Linear Meter Tracking
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-500 text-xs"
          >
            {storeData?.description}
          </Text>
        </View>
      </View>

      {/* MAIN SEARCH */}
      <View className="px-6 py-4 bg-white border-b border-slate-200">
        <View className="bg-slate-50 flex-row items-center px-4 rounded-lg border border-slate-200">
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search added categories..."
            className="flex-1 py-3 ml-2 font-[Outfit-Regular]"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={measurements.filter((m) =>
          m.categoryName.toLowerCase().includes(searchQuery.toLowerCase()),
        )}
        contentContainerStyle={{ padding: 20, paddingBottom: 180 }}
        renderItem={({ item }) => (
          <View className="bg-white p-5 rounded-xl mb-4 border border-slate-200">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <View className="bg-sky-100 p-2 rounded-lg mr-3">
                  <Layers size={18} color="#0284c7" />
                </View>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-base text-slate-900"
                >
                  {item.categoryName}
                </Text>
              </View>
              <TouchableOpacity
                className="mb-3 mr-1"
                onPress={() =>
                  setMeasurements(measurements.filter((m) => m.id !== item.id))
                }
              >
                <Trash2 size={18} color="#f87171" />
              </TouchableOpacity>
            </View>

            <View className="flex-row bg-slate-50 rounded-xl p-4">
              <View className="flex-1 border-r border-slate-200">
                <Text className="text-[10px] text-slate-400 uppercase font-[Outfit-Bold]">
                  Our Brand
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-sky-600 text-lg"
                >
                  {item.ourLength}{" "}
                  <Text className="text-xs text-slate-400 font-[Outfit-Regular]">
                    cm
                  </Text>
                </Text>
              </View>
              <View className="flex-1 pl-4">
                <Text className="text-[10px] text-slate-400 uppercase font-[Outfit-Bold]">
                  Total Shelf
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-700 text-lg"
                >
                  {item.totalLength}{" "}
                  <Text className="text-xs text-slate-400 font-[Outfit-Regular]">
                    cm
                  </Text>
                </Text>
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
        <TouchableOpacity
          onPress={() => navigation.navigate("SOSPercent", { measurements })}
          className="flex-[2] bg-sky-600 py-4 rounded-xl flex-row items-center justify-center"
        >
          <ClipboardCheck size={18} color="white" />
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-white ml-2"
          >
            Analyze SOS %
          </Text>
        </TouchableOpacity>
      </View>

      {/* ADD CATEGORY MODAL */}
      <Modal visible={addModalVisible} animationType="fade" transparent>
        <View className="flex-1 bg-slate-900/60 justify-end">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <View className="bg-white rounded-t-[40px] px-8 pt-6 pb-12">
              {/* Drag Handle */}
              <View className="w-12 h-1 bg-slate-200 rounded-full self-center mb-6" />

              {/* MODAL HEADER */}
              <View className="flex-row justify-between items-center mb-6">
                <View>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-xl text-slate-900"
                  >
                    {modalStep === 1 ? "Select Category" : "Category Metrics"}
                  </Text>
                  {modalStep === 2 && (
                    <Text
                      style={{ fontFamily: "Outfit-Medium" }}
                      className="text-sky-600 text-xs"
                    >
                      {selectedCategory?.name}
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
                /* STEP 1: SELECTION LIST */
                <View>
                  <View className="bg-slate-50 flex-row items-center px-4 rounded-xl border border-slate-200 mb-4">
                    <Search size={18} color="#94a3b8" />
                    <TextInput
                      placeholder="Search category..."
                      className="flex-1 py-3 ml-2 font-[Outfit-Regular]"
                      value={modalSearch}
                      onChangeText={setModalSearch}
                    />
                  </View>
                  <View style={{ maxHeight: 300 }}>
                    <FlatList
                      data={CATEGORIES.filter((c) =>
                        c.name
                          .toLowerCase()
                          .includes(modalSearch.toLowerCase()),
                      )}
                      keyExtractor={(item) => item.id}
                      showsVerticalScrollIndicator={false}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedCategory(item);
                            setModalStep(2);
                          }}
                          className="p-4 rounded-xl mb-2 border bg-white border-slate-200 flex-row justify-between items-center"
                        >
                          <View className="flex-row items-center">
                            <View className="bg-slate-50 p-2 rounded-lg mr-3">
                              <Layers size={16} color="#64748b" />
                            </View>
                            <Text
                              style={{ fontFamily: "Outfit-Medium" }}
                              className="text-slate-700"
                            >
                              {item.name}
                            </Text>
                          </View>
                          <ChevronRight size={18} color="#cbd5e1" />
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </View>
              ) : (
                /* STEP 2: INPUTS */
                <View>
                  <View className="flex-row gap-4 mb-8">
                    <View className="flex-1">
                      <Text className="text-[10px] text-slate-400 uppercase font-[Outfit-Bold] mb-2 ml-1">
                        Our Space (cm)
                      </Text>
                      <TextInput
                        autoFocus
                        keyboardType="decimal-pad"
                        placeholder="0"
                        value={ourLength}
                        onChangeText={setOurLength}
                        className="bg-slate-50 p-4 rounded-xl border border-sky-100 font-[Outfit-Bold] text-sky-600 text-2xl"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] text-slate-400 uppercase font-[Outfit-Bold] mb-2 ml-1">
                        Total Shelf (cm)
                      </Text>
                      <TextInput
                        keyboardType="decimal-pad"
                        placeholder="0"
                        value={totalLength}
                        onChangeText={setTotalLength}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-[Outfit-Bold] text-slate-700 text-2xl"
                      />
                    </View>
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
                      onPress={handleAddMeasurement}
                      className="flex-[2] bg-sky-600 py-5 rounded-xl items-center justify-center"
                    >
                      <Text
                        style={{ fontFamily: "Outfit-Bold" }}
                        className="text-white text-lg"
                      >
                        Confirm Space
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

export default Linear_Meter;
