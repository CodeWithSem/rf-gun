import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  Store,
  ChevronRight,
  AlertCircle,
  Filter,
} from "lucide-react-native";

// Dummy Data for Chains and Stores
const CHAINS = ["All", "7-Eleven", "Uncle John's", "Lawson", "Family Mart"];
const DUMMY_STORES = [
  {
    id: "1",
    code: "S7001",
    description: "7-ELEVEN - MALABON",
    chain: "7-Eleven",
    address: "Rizal Ave, Malabon",
  },
  {
    id: "2",
    code: "UJ002",
    description: "UNCLE JOHN'S - LETRE",
    chain: "Uncle John's",
    address: "Samson Rd, Malabon",
  },
  {
    id: "3",
    code: "LW003",
    description: "LAWSON - MONUMENTO",
    chain: "Lawson",
    address: "EDSA, Caloocan",
  },
  {
    id: "4",
    code: "FM004",
    description: "FAMILY MART - VERTIS",
    chain: "Family Mart",
    address: "North Ave, QC",
  },
];

const DIVERSION_REASONS = [
  "Store was closed",
  "Emergency store concern",
  "Area accessibility issues",
  "Priority store requested by supervisor",
  "Rescheduled from previous date",
];

const Store_Selection = ({ route, navigation }) => {
  const { user } = route.params;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState("All");
  const [filteredData, setFilteredData] = useState(DUMMY_STORES);

  const [showDiversionModal, setShowDiversionModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);

  // Filter Logic
  useEffect(() => {
    let data = DUMMY_STORES;
    if (selectedChain !== "All") {
      data = data.filter((item) => item.chain === selectedChain);
    }
    if (searchQuery) {
      data = data.filter(
        (item) =>
          item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    setFilteredData(data);
  }, [searchQuery, selectedChain]);

  const handleStorePress = (item) => {
    setSelectedStore(item);
    setShowDiversionModal(true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleStorePress(item)}
      className="bg-white border border-slate-200 mb-4 p-5 rounded-xl flex-row items-center"
    >
      <View className="bg-sky-50 p-3 rounded-xl mr-4">
        <Store size={24} color="#0284c7" />
      </View>
      <View className="flex-1">
        <View className="bg-slate-100 self-start px-2 py-0.5 rounded mb-1">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-500 text-[10px] tracking-widest"
          >
            {item.code}
          </Text>
        </View>
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-slate-900 text-base"
        >
          {item.description}
        </Text>
        <Text
          style={{ fontFamily: "Outfit-Regular" }}
          className="text-slate-400 text-xs mt-1"
        >
          {item.address}
        </Text>
      </View>
      <ChevronRight size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header & Search Section (Unified with MCP Selection) */}
      <View className="bg-white border-b border-slate-200 pb-4">
        <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="bg-sky-100 p-2.5 rounded-xl mr-4"
            >
              <ArrowLeft size={24} color="#0284c7" />
            </TouchableOpacity>
            <View>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-2xl text-slate-900"
              >
                Store Selection
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-red-500 text-[10px] uppercase"
              >
                Diverted Visit Mode
              </Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-6 mt-4">
          <View className="bg-slate-50 rounded-xl px-5 py-2 flex-row items-center border border-slate-200">
            <Search size={20} color="#64748b" />
            <TextInput
              placeholder="Search store code or name..."
              className="flex-1 ml-3 text-slate-900 text-base py-2"
              style={{ fontFamily: "Outfit-Regular" }}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Chain Selection (Horizontal Scroll) */}
        <View className="mt-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {CHAINS.map((chain) => (
              <TouchableOpacity
                key={chain}
                onPress={() => setSelectedChain(chain)}
                className={`mr-3 px-5 py-2 rounded-full border ${
                  selectedChain === chain
                    ? "bg-sky-600 border-sky-600"
                    : "bg-white border-slate-200"
                }`}
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className={`text-xs ${selectedChain === chain ? "text-white" : "text-slate-500"}`}
                >
                  {chain}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* List Section */}
      <View className="flex-1 bg-slate-50">
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center mt-20 p-10">
              <Filter size={48} color="#cbd5e1" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-400 mt-4 text-lg"
              >
                No Stores Found
              </Text>
            </View>
          }
        />
      </View>

      {/* DIVERSION REMARKS MODAL (Unified with MCP logic) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDiversionModal}
        onRequestClose={() => setShowDiversionModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setShowDiversionModal(false)}
          />
          <View className="bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mb-6" />

            <View className="flex-row items-center mb-4">
              <View className="bg-sky-100 p-2 rounded-lg mr-3">
                <AlertCircle size={20} color="#0284c7" />
              </View>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-xl text-slate-900"
              >
                Confirm Diversion
              </Text>
            </View>

            <View className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-400 text-[10px] uppercase mb-1"
              >
                Target Store
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-900 text-lg"
              >
                {selectedStore?.description}
              </Text>
            </View>

            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 mb-6"
            >
              You are visiting a store not in your daily plan. This is a{" "}
              <Text className="text-sky-600 font-bold">Diverted Visit</Text>.
              Please select a reason:
            </Text>

            <View className="mb-4">
              {DIVERSION_REASONS.map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setShowDiversionModal(false);
                    navigation.navigate("CaptureStoreImage", {
                      user,
                      mcp: selectedStore, // We pass the selected store as the 'mcp' object
                      isDiversion: true,
                      remarks: reason,
                      visitType: "store", // As requested: visitType is 'store'
                    });
                  }}
                  className="flex-row items-center p-4 mb-3 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <Text
                    style={{ fontFamily: "Outfit-Medium" }}
                    className="text-slate-700 flex-1"
                  >
                    {reason}
                  </Text>
                  <ChevronRight size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setShowDiversionModal(false)}
              className="bg-slate-100 py-4 rounded-xl"
            >
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-500 text-center"
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Store_Selection;
