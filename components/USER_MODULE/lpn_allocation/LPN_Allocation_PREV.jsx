import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  ChevronLeft,
  Package,
  Barcode,
  MapPin,
  Layers,
  Warehouse,
} from "lucide-react-native";

// FIREBASE
import { firestore_db } from "@assets/scripts/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

const LPN_Allocation = ({ navigation }) => {
  const [loading, set_loading] = useState(true);
  const [allocations, set_allocations] = useState([]);

  useEffect(() => {
    // Kinukuha ang data mula sa TBL_INVENTORY_COUNT/DATA
    const q = query(
      collection(firestore_db, "DB1_ERP_SYSTEM", "TBL_INVENTORY_COUNT", "DATA"),
      orderBy("creation_date", "desc"), // Pinakabago sa taas
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        set_allocations(data);
        set_loading(false);
      },
      (error) => {
        console.error("Firestore Error:", error);
        set_loading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => (
    <View className="bg-white mx-6 mb-3 p-4 rounded-2xl border border-slate-100 shadow-sm">
      {/* TOP SECTION: LPN ID & STATUS */}
      <View className="flex-row justify-between items-start mb-2">
        <View>
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-sky-600 text-[10px] uppercase tracking-wider"
          >
            LPN: {item.lpn_id}
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-lg text-slate-900"
          >
            {item.item_code}
          </Text>
        </View>
        <View className="bg-green-100 px-3 py-1 rounded-full">
          <Text className="text-green-700 text-[10px] font-bold uppercase">
            {item.lpn_status}
          </Text>
        </View>
      </View>

      {/* MIDDLE SECTION: WAREHOUSE & BIN (NEW) */}
      <View className="flex-row items-center mt-1 space-x-4">
        <View className="flex-row items-center flex-1">
          <View className="bg-slate-100 p-1.5 rounded-lg mr-2">
            <Warehouse size={12} color="#475569" />
          </View>
          <View>
            <Text className="text-[9px] text-slate-400 font-bold uppercase">
              Warehouse
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-slate-700 text-xs"
            >
              {item.warehouse_code}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center flex-1">
          <View className="bg-slate-100 p-1.5 rounded-lg mr-2">
            <MapPin size={12} color="#475569" />
          </View>
          <View>
            <Text className="text-[9px] text-slate-400 font-bold uppercase">
              Bin Code
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-slate-700 text-xs"
            >
              {item.sbin_code}
            </Text>
          </View>
        </View>
      </View>

      {/* BOTTOM SECTION: QTY & UOM */}
      <View className="border-t border-slate-50 pt-3 mt-3">
        {/* Base Quantity Row */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Layers size={14} color="#64748b" />
            <Text className="text-slate-500 text-xs ml-1 font-medium">
              Total Quantity:
            </Text>
          </View>
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-900 text-xs"
          >
            {item.qty_base} {item.uom_base}
          </Text>
        </View>

        {/* Quantity in KG Row - Magpapakita lang kung > 0 */}
        {item.qty_in_kg > 0 && (
          <View className="flex-row justify-between items-center mt-2">
            <View className="flex-row items-center">
              <View className="w-[14px] items-center">
                {/* Empty space or another icon para pantay sa taas */}
                <Text className="text-[10px]">⚖️</Text>
              </View>
              <Text className="text-slate-500 text-xs ml-1 font-medium">
                Weight (KG):
              </Text>
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-sky-700 text-xs"
            >
              {item.qty_in_kg} KG
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-white border-b border-slate-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2"
        >
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-xl text-slate-900 ml-2"
        >
          LPN Allocation
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#0284c7" />
        </View>
      ) : (
        <FlatList
          data={allocations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 20 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-10 mt-20">
              <View className="bg-slate-100 p-6 rounded-full mb-4">
                <Package size={40} color="#94a3b8" />
              </View>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-900 text-lg"
              >
                No Allocations Yet
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-500 text-center mt-2"
              >
                Tap the plus button to assign items to an LPN.
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate("lpn_form")}
        className="absolute bottom-10 right-8 bg-sky-600 w-16 h-16 rounded-full items-center justify-center shadow-xl"
      >
        <Plus size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default LPN_Allocation;
