import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Image as ImageIcon,
  Info,
  X,
} from "lucide-react-native";

const PLANOGRAM_LIST = [
  {
    id: "POG-01",
    name: "Main Soda Aisle - Shelf A",
    version: "v2.4",
    lastUpdated: "Feb 2026",
    status: "Complied",
  },
  {
    id: "POG-02",
    name: "Energy Drink Chiller",
    version: "v1.0",
    lastUpdated: "Jan 2026",
    status: "Pending",
  },
  {
    id: "POG-03",
    name: "Checkout Counter Rack",
    version: "v3.1",
    lastUpdated: "Dec 2025",
    status: "Non-Compliant",
  },
  {
    id: "POG-04",
    name: "Promotional Island Display",
    version: "v1.2",
    lastUpdated: "Feb 2026",
    status: "Complied",
  },
];

const Planogram_Select = ({ navigation, route }) => {
  const [step, setStep] = useState(1);
  const [selectedPog, setSelectedPog] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleConfirm = () => {
    if (selectedPog) {
      // 1. Send data back via the callback
      route.params?.onSelect(selectedPog);
      // 2. Go back (Pops the screen, prevents stacking)
      navigation.goBack();
    }
  };

  const renderStatus = (status) => {
    const styles = {
      Complied: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        icon: <CheckCircle2 size={10} color="#047857" />,
      },
      "Non-Compliant": {
        bg: "bg-rose-100",
        text: "text-rose-700",
        icon: <XCircle size={10} color="#be123c" />,
      },
      default: { bg: "bg-slate-100", text: "text-slate-500", icon: null },
    };
    const s = styles[status] || styles.default;
    return (
      <View
        className={`${s.bg} px-2 py-1 rounded-md flex-row items-center mb-2 self-start`}
      >
        {s.icon && <View className="mr-1">{s.icon}</View>}
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className={`${s.text} text-[10px] uppercase tracking-wider`}
        >
          {status}
        </Text>
      </View>
    );
  };

  // --- PREVIEW STEP (Full Page) ---
  if (step === 2) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <View className="px-6 py-4 flex-row justify-between items-center border-b border-slate-100">
          <TouchableOpacity onPress={() => setStep(1)} className="p-2 -ml-2">
            <ChevronLeft color="#0f172a" size={24} />
          </TouchableOpacity>
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-lg text-slate-900"
          >
            Reference Image
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View className="flex-1">
          <View
            className="bg-slate-100 items-center justify-center"
            style={{ aspectRatio: 1, width: "100%" }}
          >
            <ImageIcon size={64} color="#cbd5e1" />
            <Text
              className="text-slate-400 mt-4"
              style={{ fontFamily: "Outfit-Bold" }}
            >
              POG: {selectedPog?.name}
            </Text>
          </View>

          <View className="p-8">
            <View className="flex-row items-start mb-8 bg-sky-50 p-5 rounded-xl border border-sky-100">
              <Info size={20} color="#0284c7" />
              <Text
                style={{ fontFamily: "Outfit-Medium" }}
                className="text-sky-800 text-xs ml-3 flex-1 leading-5"
              >
                Ensure current shelf matches Version {selectedPog?.version}.
                This will be used as the audit baseline.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleConfirm}
              className="bg-sky-600 py-5 rounded-xl items-center shadow-lg shadow-sky-100"
            >
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white text-lg"
              >
                Confirm Selection
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- LIST STEP (Matching Stock_Audit style) ---
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-slate-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2"
        >
          <ChevronLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-xl ml-2 text-slate-900"
        >
          Select Planogram
        </Text>
      </View>

      {/* Search Bar Container */}
      <View className="px-6 py-4 border-b border-slate-200">
        <View className="bg-slate-50 flex-row items-center px-4 rounded-lg border border-slate-200">
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search planograms..."
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

      {/* The List with bg-slate-50 */}
      <FlatList
        data={PLANOGRAM_LIST.filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )}
        className="bg-slate-50"
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 100,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedPog(item);
              setStep(2);
            }}
            activeOpacity={0.7}
            className="bg-white p-5 rounded-xl mb-3 border border-slate-200 shadow-sm flex-row justify-between items-center"
          >
            <View className="flex-1">
              {renderStatus(item.status)}
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-700 text-base"
              >
                {item.name}
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-400 text-[10px] uppercase mt-1"
              >
                Version {item.version} • {item.lastUpdated}
              </Text>
            </View>
            <ChevronRight size={18} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default Planogram_Select;
