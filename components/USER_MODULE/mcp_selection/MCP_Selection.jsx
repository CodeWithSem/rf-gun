import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Switch,
  StatusBar,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  Calendar,
  Filter,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// Dummy Data
const DUMMY_MCP = [
  {
    id: "1",
    code: "S00001",
    description: "SM NORTH EDSA",
    planDate: "2026-02-22",
    actualDate: "2026-02-22",
    status: "complete",
  },
  {
    id: "2",
    code: "S00002",
    description: "ROBINSONS GALLERIA",
    planDate: "2026-02-20",
    actualDate: null,
    status: "not complete",
  },
  {
    id: "3",
    code: "S00005",
    description: "PUREGOLD MONUMENTO",
    planDate: "2026-02-21",
    actualDate: "2026-02-21",
    status: "partially complete",
  },
  {
    id: "4",
    code: "S00010",
    description: "AYALA MALLS CLOVERLEAF",
    planDate: "2026-02-23",
    actualDate: null,
    status: "not complete",
  },
];

// Diversion Remarks List
const DIVERSION_REASONS = [
  "Store was closed",
  "Emergency store concern",
  "Area accessibility issues",
  "Priority store requested by supervisor",
  "Rescheduled from previous date",
];

const MCP_Selection = ({ route, navigation }) => {
  const { user } = route.params;
  const [searchQuery, setSearchQuery] = useState("");
  const [isTodayOnly, setIsTodayOnly] = useState(false);
  const [filteredData, setFilteredData] = useState(DUMMY_MCP);

  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [pickingDate, setPickingDate] = useState("start");
  const [showNativePicker, setShowNativePicker] = useState(false);

  // New states for Diversion logic
  const [showDiversionModal, setShowDiversionModal] = useState(false);
  const [selectedMCP, setSelectedMCP] = useState(null);

  useEffect(() => {
    let data = DUMMY_MCP;
    if (isTodayOnly) {
      const today = new Date().toISOString().split("T")[0];
      data = data.filter((item) => item.planDate === today);
    }
    if (isFilterActive && !isTodayOnly) {
      const start = startDate.toISOString().split("T")[0];
      const end = endDate.toISOString().split("T")[0];
      data = data.filter(
        (item) => item.planDate >= start && item.planDate <= end,
      );
    }
    if (searchQuery) {
      data = data.filter(
        (item) =>
          item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    setFilteredData(data);
  }, [searchQuery, isTodayOnly, isFilterActive, startDate, endDate]);

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowNativePicker(false);
    if (event.type === "set" && selectedDate) {
      if (pickingDate === "start") setStartDate(selectedDate);
      else setEndDate(selectedDate);
    } else {
      setShowNativePicker(false);
    }
  };

  const getStatusConfig = (status, planDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const plan = new Date(planDate);
    plan.setHours(0, 0, 0, 0);

    const isOverdue = today > plan && status === "not complete";

    if (isOverdue) {
      return {
        color: "#ef4444",
        icon: <AlertCircle size={16} color="#ef4444" />,
        bg: "bg-red-50",
        badge: "bg-red-500",
        border: "border-red-200",
        text: "text-red-800",
        label: "OVERDUE",
      };
    }

    switch (status) {
      case "complete":
        return {
          color: "#16a34a",
          icon: <CheckCircle2 size={16} color="#16a34a" />,
          bg: "bg-green-50",
          badge: "bg-green-500",
          border: "border-green-200",
          text: "text-green-800",
          label: "Complete",
        };
      case "partially complete":
        return {
          color: "#facc15",
          icon: <Clock size={16} color="#facc15" />,
          bg: "bg-yellow-50",
          badge: "bg-yellow-400",
          border: "border-yellow-300",
          text: "text-yellow-800",
          label: "Partially Complete",
        };
      default:
        return {
          color: "#64748b",
          icon: <AlertCircle size={16} color="#64748b" />,
          bg: "bg-white",
          badge: "bg-slate-500",
          border: "border-slate-200",
          text: "text-slate-600",
          label: "Pending",
        };
    }
  };

  const formatToMMDDYYYY = (date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  // Selection Logic Handler
  const handleMCPPress = (item) => {
    const todayStr = new Date().toISOString().split("T")[0];

    if (item.planDate === todayStr) {
      // EQUAL DATE: Proceed to Capture
      console.log("Normal Visit: Proceeding to Capture Image");
      navigation.navigate("CaptureStoreImage", {
        user,
        mcp: item,
        isDiversion: false,
        visitType: "mcp",
      });
    } else {
      // NOT EQUAL: Trigger Diversion Modal
      setSelectedMCP(item);
      setShowDiversionModal(true);
    }
  };

  const renderItem = ({ item }) => {
    const config = getStatusConfig(item.status, item.planDate);
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleMCPPress(item)} // Trigger logic on press
        className={`${config.bg} ${config.border} border border-b border-r mb-5 p-5 rounded-xl shadow-sm`}
      >
        <View>
          <View className="flex-row items-center justify-between mb-3">
            <View className={`${config.badge} px-3 py-1 rounded`}>
              <Text
                style={{ fontFamily: "Outfit" }}
                className="text-white text-xs tracking-[1px]"
              >
                {item.code}
              </Text>
            </View>
            <View className="flex-row items-center bg-white px-2.5 py-1 rounded-full border border-white/20">
              {config.icon}
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className={`${config.text} ml-1.5 text-[9px] uppercase tracking-[0.5px]`}
              >
                {config.label || item.status}
              </Text>
            </View>
          </View>
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-700 text-base leading-6 mb-4"
          >
            {item.description}
          </Text>
          <View className="flex-row gap-2.5">
            <View className="flex-1 bg-white p-2.5 rounded-xl border border-white/40">
              <Text
                style={{ fontFamily: "Outfit-Medium" }}
                className="text-slate-400 text-[9px] uppercase mb-1"
              >
                PLAN VISIT
              </Text>
              <View className="flex-row items-center">
                <Calendar size={12} color="#64748b" />
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-700 text-[11px] ml-1.5"
                >
                  {item.planDate}
                </Text>
              </View>
            </View>
            <View
              className={`flex-1 p-2.5 rounded-xl border ${item.actualDate ? "bg-white/80 border-white" : "bg-slate-200/30 border-dashed border-slate-300"}`}
            >
              <Text
                style={{ fontFamily: "Outfit-Medium" }}
                className="text-slate-400 text-[9px] uppercase mb-1"
              >
                Actual Visit
              </Text>
              <View className="flex-row items-center">
                <Clock
                  size={12}
                  color={item.actualDate ? config.color : "#cbd5e1"}
                />
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className={`text-[11px] ml-1.5 ${item.actualDate ? "text-slate-700" : "text-slate-300 italic"}`}
                >
                  {item.actualDate || "No visit"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header & Search Section (Design Unchanged) */}
      <View className="bg-white border-b border-slate-200 pb-6 z-10">
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
                MCP Selection
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-500 text-xs"
              >
                Filter and select your store
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 mt-4">
          <View className="bg-slate-50 rounded-xl px-5 py-2 flex-row items-center border border-slate-200">
            <Search size={20} color="#64748b" />
            <TextInput
              placeholder="Search store code or name..."
              className="flex-1 ml-3 text-slate-900 text-base"
              style={{ fontFamily: "Outfit-Regular" }}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View className="flex-row items-center justify-between mt-4">
            <View className="flex-row items-center bg-slate-50 px-4 py-1 rounded-xl border border-slate-200">
              <Text
                style={{ fontFamily: "Outfit-SemiBold" }}
                className="mr-3 text-slate-500"
              >
                Today MCP
              </Text>
              <Switch
                value={isTodayOnly}
                onValueChange={setIsTodayOnly}
                trackColor={{ false: "#cbd5e1", true: "#bae6fd" }}
                thumbColor={isTodayOnly ? "#0284c7" : "#f1f5f9"}
              />
            </View>
            <TouchableOpacity
              onPress={() => setShowModal(true)}
              className={`flex-row items-center px-5 py-3 rounded-xl ${isFilterActive ? "bg-green-600" : "bg-sky-600"}`}
            >
              <Filter size={18} color="white" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white ml-2"
              >
                {isFilterActive ? "Range Active" : "Date Range"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* List Section */}
      <View className="flex-1 bg-slate-50">
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center mt-20 p-10 rounded-3xl mx-6">
              <Search size={48} color="#cbd5e1" />
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

      {/* Date Range Modal (Original) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setShowModal(false)}
          />
          <View className="bg-white rounded-t-[40px] p-8 pb-12 shadow-2xl">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mb-6" />
            <View className="flex-row justify-between items-center mb-2">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-xl text-slate-900"
              >
                Date Range
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text
                  style={{ fontFamily: "Outfit-Medium" }}
                  className="text-sky-600"
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-4 mb-10">
              <TouchableOpacity
                onPress={() => {
                  setPickingDate("start");
                  setShowNativePicker(true);
                }}
                className={`flex-1 p-4 rounded-xl border ${pickingDate === "start" ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-slate-50"}`}
              >
                <Text className="text-slate-400 text-[9px] uppercase mb-1">
                  Start Date
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-700 text-xs"
                >
                  {formatToMMDDYYYY(startDate)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setPickingDate("end");
                  setShowNativePicker(true);
                }}
                className={`flex-1 p-4 rounded-xl border ${pickingDate === "end" ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-slate-50"}`}
              >
                <Text className="text-slate-400 text-[9px] uppercase mb-1">
                  End Date
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-700 text-xs"
                >
                  {formatToMMDDYYYY(endDate)}
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setIsFilterActive(false);
                  setShowModal(false);
                }}
                className="flex-1 bg-slate-50 py-4 border border-slate-200 rounded-xl"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-500 text-center"
                >
                  Reset
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setIsFilterActive(true);
                  setIsTodayOnly(false);
                  setShowModal(false);
                }}
                className="flex-2 grow-[2] bg-sky-600 py-4 rounded-xl"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-center"
                >
                  Apply Filter
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DIVERSION REMARKS MODAL (New Logic) */}
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
              <View className="bg-orange-100 p-2 rounded-lg mr-3">
                <AlertCircle size={20} color="#ea580c" />
              </View>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-xl text-slate-900"
              >
                Select Diversion Remark
              </Text>
            </View>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 mb-6"
            >
              You are visiting a store not scheduled for today. Please provide a
              reason.
            </Text>
            <View className="mb-4">
              {DIVERSION_REASONS.map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setShowDiversionModal(false);
                    navigation.navigate("CaptureStoreImage", {
                      user,
                      mcp: selectedMCP,
                      isDiversion: true,
                      remarks: reason,
                      visitType: "mcp",
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
              className="bg-slate-50 py-4 rounded-xl border border-slate-200"
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

      {showNativePicker && (
        <DateTimePicker
          value={pickingDate === "start" ? startDate : endDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
        />
      )}
    </SafeAreaView>
  );
};

export default MCP_Selection;
