import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  Box,
  X,
  ClipboardList,
  PackageSearch,
  MoveRight,
  ChevronsRight,
  PackageX,
  ClipboardX,
} from "lucide-react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { firestore_db } from "../../../assets/scripts/firebase";

// IMPORT LOCAL MASTER DATA
import { qty_unit_conversion } from "@assets/scripts/functions/item_unit_conversion";
import { item_master_list } from "@assets/data/item_master/item_master_list";

const Transfer_Order = ({ route, navigation }) => {
  const { user_data } = route.params;

  // State
  const [is_loading, set_is_loading] = useState(true);
  const [transfer_orders, set_transfer_orders] = useState([]);
  const [search_query, set_search_query] = useState("");

  // Modal State
  const [is_modal_visible, set_is_modal_visible] = useState(false);
  const [selected_to, set_selected_to] = useState(null);

  useEffect(() => {
    // Real-time Listener para sa Transfer Orders lang
    const to_ref = collection(
      firestore_db,
      "DB1_ERP_SYSTEM",
      "TBL_TRANSFER_ORDER",
      "DATA",
    );
    const q = query(to_ref, where("to_status", "==", "Posted"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched_orders = snapshot.docs.map((doc) => ({
          doc_id: doc.id,
          ...doc.data(),
        }));

        // Sort by TO Number Descending
        const sorted_orders = fetched_orders.sort((a, b) =>
          b.to_number.localeCompare(a.to_number),
        );

        set_transfer_orders(sorted_orders);
        set_is_loading(false);
      },
      (error) => {
        console.error("Firestore Error:", error);
        set_is_loading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const render_lpn_row = (lpn_data) => {
    // Gamitin ang local item_master_list para sa conversion
    const display_qty = qty_unit_conversion(
      lpn_data.qty_base_transfer,
      lpn_data.uom_display,
      lpn_data.item_code,
      item_master_list,
    );

    return (
      <View
        key={lpn_data.lpn_id}
        className="bg-slate-50 p-5 rounded-xl mb-4 border border-slate-200"
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-800 text-base"
            >
              LPN: {lpn_data.lpn_id}
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-xs mt-1"
            >
              {lpn_data.item_code}
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-xs"
            >
              {lpn_data.item_desc}
            </Text>
          </View>
          <View className="bg-sky-100 px-3 py-1 rounded-full">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-sky-700 text-[11px]"
            >
              {display_qty} {lpn_data.uom_display}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
          <View>
            <Text className="text-[9px] text-slate-400 uppercase font-[Outfit-Bold]">
              From Bin
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-600 text-xs"
            >
              {lpn_data.sbin_code}
            </Text>
          </View>
          <ChevronsRight size={16} color="#0284c7" />
          <View className="items-end">
            <Text className="text-[9px] text-slate-400 uppercase font-[Outfit-Bold]">
              To Bin
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-sky-600 text-xs"
            >
              {lpn_data.to_sbin_code}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // ... (render_to_card remains the same as previous)
  const render_to_card = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        set_selected_to(item);
        set_is_modal_visible(true);
      }}
      className="bg-white p-5 rounded-xl mb-4 border border-slate-200"
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <View className="bg-slate-100 p-2 rounded-lg mr-3">
            <ClipboardList size={20} color="#475569" />
          </View>
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-lg text-slate-900"
          >
            {item.to_number}
          </Text>
        </View>
        <View className="bg-green-50 px-3 py-1 rounded-full border border-green-100">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-green-600 text-[10px] uppercase"
          >
            {item.to_status}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center pt-4 border-t border-slate-50">
        <View className="flex-row items-center">
          <PackageSearch size={14} color="#64748b" />
          <Text
            style={{ fontFamily: "Outfit-Medium" }}
            className="text-slate-500 text-xs ml-2"
          >
            Items:{" "}
            <Text className="text-slate-900 font-[Outfit-Bold]">
              {item.selected_lpn_list.length}
            </Text>
          </Text>
        </View>
        <Text
          style={{ fontFamily: "Outfit-Regular" }}
          className="text-slate-400 text-[10px]"
        >
          {item.post_date}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header & Search */}
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
              Transfer Order
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-xs"
            >
              View and process assigned tasks
            </Text>
          </View>
        </View>
      </View>

      <View className="px-6 py-4 border-b border-slate-200">
        <View className="bg-slate-50 flex-row items-center px-4 rounded-lg border border-slate-200">
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search TO Number..."
            className="flex-1 py-4 ml-2 font-[Outfit-Regular] text-slate-900"
            value={search_query}
            onChangeText={set_search_query}
          />
        </View>
      </View>

      {is_loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <FlatList
          data={transfer_orders.filter((to) =>
            to.to_number.toLowerCase().includes(search_query.toLowerCase()),
          )}
          className="bg-slate-50/50"
          renderItem={render_to_card}
          keyExtractor={(item) => item.doc_id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 100,
          }}
          ListEmptyComponent={() => (
            <View className="items-center justify-center mt-20">
              <ClipboardX size={48} color="#cbd5e1" />
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-400 mt-4"
              >
                No record found.
              </Text>
            </View>
          )}
        />
      )}

      {/* Details Modal */}
      <Modal visible={is_modal_visible} animationType="fade" transparent>
        <View className="flex-1 bg-slate-900/60 justify-end">
          <View className="bg-white rounded-t-[40px] h-[85%]">
            <View className="px-8 pt-8 pb-6 flex-row justify-between items-center border-b border-slate-100">
              <View className="flex-row items-center">
                <View className="bg-sky-100 p-2 rounded-lg mr-3">
                  <Box size={24} color="#0284c7" />
                </View>
                <View>
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-xl text-slate-900"
                  >
                    Transfer Order Details
                  </Text>
                  {/* Eto yung TO Number as Subtitle */}
                  <Text
                    style={{ fontFamily: "Outfit-Medium" }}
                    className="text-sky-600 text-sm"
                  >
                    {selected_to?.to_number}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => set_is_modal_visible(false)}
                className="bg-slate-100 p-2 rounded-full"
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="px-8 pt-6"
              showsVerticalScrollIndicator={false}
            >
              {selected_to?.selected_lpn_list.map((lpn) => render_lpn_row(lpn))}
              <View className="h-10" />
            </ScrollView>

            <View className="p-5 border-t border-slate-100">
              <TouchableOpacity
                onPress={() => {
                  set_is_modal_visible(false);
                  navigation.navigate("to_process", {
                    to_data: selected_to,
                    user_data,
                  });
                }}
                className="bg-sky-600 w-full py-5 rounded-xl items-center justify-center"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-lg"
                >
                  Start Transfer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Transfer_Order;
