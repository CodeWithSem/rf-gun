import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Vibration,
  Alert,
  FlatList,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Barcode,
  Keyboard,
  X,
  Trash2,
  CheckCircle2,
  SquareArrowDown,
  SquareArrowLeft,
} from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";

import { firestore_db } from "@assets/scripts/firebase";
import { doc, getDoc, writeBatch, deleteField } from "firebase/firestore";

const Receive_STO = ({ navigation, route }) => {
  const scanner_input_ref = useRef(null);
  const modal_input_ref = useRef(null);
  const isFocused = useIsFocused();

  // User data mula sa navigation params o default
  const user_data = route?.params?.user_data || {
    first_name: "John",
    last_name: "Doe",
  };

  const [loading, set_loading] = useState(false);
  const [received_items, set_received_items] = useState([]);

  // MODAL STATES
  const [modal_visible, set_modal_visible] = useState(false);
  const [manual_lpn_id, set_manual_lpn_id] = useState("");

  // CONTINUOUS AUTO-FOCUS
  useEffect(() => {
    let focus_interval = null;

    if (isFocused && !modal_visible) {
      focus_interval = setInterval(() => {
        scanner_input_ref.current?.focus();
      }, 1000);
    }

    return () => {
      if (focus_interval) clearInterval(focus_interval);
    };
  }, [isFocused, modal_visible]);

  useEffect(() => {
    if (modal_visible) {
      setTimeout(() => {
        modal_input_ref.current?.focus();
      }, 150);
    }
  }, [modal_visible]);

  const handle_search = async (val) => {
    const clean_id = val.trim();
    if (!clean_id) return;

    const is_duplicate = received_items.some(
      (item) => item.lpn_id === clean_id,
    );
    if (is_duplicate) {
      Vibration.vibrate([100, 50, 100]);
      Alert.alert("Duplicate Scan", `LPN ${clean_id} is already in the list.`);
      return;
    }

    set_loading(true);
    Vibration.vibrate(50);

    try {
      const doc_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_COUNT",
        "DATA",
        clean_id,
      );
      const doc_snap = await getDoc(doc_ref);

      if (doc_snap.exists()) {
        const data = doc_snap.data();

        // 1. VALIDATION: Check kung may valid na Stock Transport Order Reference
        if (data?.sto_number_ref && data.sto_number_ref.trim() !== "") {
          set_received_items((prev_items) => [
            { ...data, lpn_id: clean_id },
            ...prev_items,
          ]);
          set_modal_visible(false);
          set_manual_lpn_id("");
        } else {
          Vibration.vibrate([100, 50, 100]);
          Alert.alert(
            "Invalid LPN",
            `LPN ${clean_id} does not have an active STO reference or may have already been received.`,
          );
        }
      } else {
        Vibration.vibrate([100, 50, 100]);
        Alert.alert(
          "Not Found",
          `LPN ${clean_id} does not exist in the inventory records.`,
        );
      }
    } catch (e) {
      console.error("Receive STO Scan Error: ", e);
      Alert.alert("Error", "Failed to fetch LPN information.");
    } finally {
      set_loading(false);
    }
  };

  const handle_manual_submit = () => {
    const clean_id = manual_lpn_id.trim();
    if (!clean_id) {
      Alert.alert("Validation Error", "Please enter a valid LPN ID.");
      return;
    }
    handle_search(clean_id);
  };

  const remove_item = (lpn_id) => {
    set_received_items((prev) => prev.filter((item) => item.lpn_id !== lpn_id));
    Vibration.vibrate(30);
  };

  // MAIN STO RECEIVE PROCESS FUNCTION
  const handle_process_receive = async () => {
    if (received_items.length === 0) return;

    set_loading(true);
    const receiver_fullname =
      `${user_data.first_name} ${user_data.last_name}`.trim();
    const current_timestamp = new Date().toISOString();

    try {
      const batch = writeBatch(firestore_db);

      // Group LPNs by their `sto_number_ref`
      const items_by_sto = received_items.reduce((acc, item) => {
        const sto_num = item.sto_number_ref;
        if (sto_num) {
          if (!acc[sto_num]) acc[sto_num] = [];
          acc[sto_num].push(item);
        }
        return acc;
      }, {});

      // 1. UPDATE TBL_INVENTORY_COUNT: Remove STO reference fields
      for (const item of received_items) {
        const lpn_ref = doc(
          firestore_db,
          "DB1_ERP_SYSTEM",
          "TBL_INVENTORY_COUNT",
          "DATA",
          item.lpn_id,
        );

        batch.update(lpn_ref, {
          sto_number_ref: deleteField(),
          sto_picked_by: deleteField(),
          sto_picked_date: deleteField(),
          sto_qty_roll: deleteField(),
        });
      }

      // 2. UPDATE TBL_STOCK_TRANSPORT FOR EACH AFFECTED STO ID
      for (const sto_number of Object.keys(items_by_sto)) {
        const sto_ref = doc(
          firestore_db,
          "DB1_ERP_SYSTEM",
          "TBL_STOCK_TRANSPORT",
          "DATA",
          sto_number,
        );

        const sto_snap = await getDoc(sto_ref);

        if (sto_snap.exists()) {
          const sto_data = sto_snap.data();
          const scanned_lpns_in_this_sto = items_by_sto[sto_number];
          const scanned_lpn_ids = scanned_lpns_in_this_sto.map((i) => i.lpn_id);

          // Update nested transfer_list items
          const updated_transfer_list = (sto_data.transfer_list || []).map(
            (t_item) => {
              if (scanned_lpn_ids.includes(t_item.lpn_id)) {
                return {
                  ...t_item,
                  sto_received_by: receiver_fullname,
                  sto_received_date: current_timestamp,
                };
              }
              return t_item;
            },
          );

          // Check kung Lahat ng LPNs sa transfer_list ay may sto_received_by na
          const has_lpns = updated_transfer_list.length > 0;
          const all_lpns_received =
            has_lpns &&
            updated_transfer_list.every((item) => !!item.sto_received_by);

          batch.update(sto_ref, {
            transfer_list: updated_transfer_list,
            // sto_status: all_lpns_received ? "Received" : sto_data.sto_status,
          });
        }
      }

      // COMMIT BATCH TO FIRESTORE
      await batch.commit();

      Vibration.vibrate([50, 100, 50]);
      Alert.alert(
        "Success",
        `${received_items.length} STO LPN(s) successfully received into inventory.`,
      );
      set_received_items([]);
    } catch (error) {
      console.error("Error processing STO receive: ", error);
      Alert.alert(
        "Transaction Error",
        "Failed to update database. Please check connection and try again.",
      );
    } finally {
      set_loading(false);
    }
  };

  const render_item = ({ item, index }) => (
    <View className="bg-white mx-6 rounded-xl border border-slate-200 mb-2 shadow-sm overflow-hidden">
      {/* TOP SECTION: CODE, DESC & TRASH BUTTON */}
      <View className="p-3.5 pb-2.5 flex-row items-start">
        {/* INDEX NUMBER */}
        <View className="bg-slate-50 w-7 h-7 rounded-md items-center justify-center mr-3 border border-slate-200/60 mt-0.5">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-[11px] text-slate-400"
          >
            {index + 1}
          </Text>
        </View>

        {/* CODE & DESC CONTAINER */}
        <View className="flex-1 pr-2">
          {/* item_code */}
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-emerald-600 text-[14px] uppercase tracking-wide"
          >
            {item?.item_code || "-"}
          </Text>

          {/* item_desc */}
          <Text
            style={{ fontFamily: "Outfit-Medium" }}
            className="text-slate-600 text-xs mt-0.5"
            numberOfLines={2}
          >
            {item?.item_desc || "No Description"}
          </Text>
        </View>

        {/* TRASH BUTTON */}
        <TouchableOpacity
          onPress={() => remove_item(item.lpn_id)}
          className="p-2 bg-rose-50 rounded-lg border border-rose-100"
          activeOpacity={0.7}
        >
          <Trash2 size={14} color="#e11d48" />
        </TouchableOpacity>
      </View>

      {/* HORIZONTAL DIVIDER LINE */}
      <View className="border-t border-slate-100 mx-3.5" />

      {/* BOTTOM SECTION: LOCATION/STORAGE & QUANTITY */}
      <View className="px-3.5 py-2.5 flex-row items-center justify-between bg-slate-50/50">
        {/* WAREHOUSE & SBIN */}
        <View className="flex-row items-center bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-700 text-[10px] uppercase tracking-wide"
          >
            {item?.warehouse_code || "-"} {item?.sbin_code || "-"}
          </Text>
        </View>

        {/* QUANTITY */}
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100"
        >
          {item?.qty_base?.toLocaleString()} {item?.uom_base || ""}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {loading && (
        <View className="absolute inset-0 z-50 bg-white/60 justify-center items-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      )}

      {/* HIDDEN SCANNER INPUT */}
      <TextInput
        ref={scanner_input_ref}
        showSoftInputOnFocus={false}
        style={{ opacity: 0, height: 0, position: "absolute" }}
        onSubmitEditing={(e) => {
          const code = e.nativeEvent.text;
          if (code) {
            handle_search(code);
            scanner_input_ref.current?.clear();
          }
        }}
        blurOnSubmit={false}
        autoFocus={true}
      />

      {/* HEADER DESIGN */}
      <View className="px-6 pb-4 flex-row items-center border-b border-slate-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="ml-2 flex-1">
          <Text style={{ fontFamily: "Outfit-Bold" }} className="text-xl">
            Receive Material
          </Text>
          <Text className="text-slate-500 text-xs">
            Continuous scanning mode enabled
          </Text>
        </View>
        <SquareArrowLeft size={24} color="#059669" />
      </View>

      {/* MAIN CONTENT AREA */}
      <View className="flex-1 bg-slate-50">
        {received_items.length === 0 ? (
          /* EMPTY STATE */
          <View className="flex-1 justify-center items-center px-10">
            <View className="bg-emerald-100 border-2 border-emerald-500 p-10 rounded-full shadow-sm mb-6">
              <Barcode size={100} color="#059669" />
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-xl text-slate-900"
            >
              READY TO SCAN
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-400 text-center mt-2 leading-5"
            >
              Scan LPN QR code. System will continuously validate and append
              materials to the list.
            </Text>

            <TouchableOpacity
              onPress={() => set_modal_visible(true)}
              activeOpacity={0.7}
              className="mt-8 bg-emerald-50 border border-emerald-200 px-6 py-3.5 rounded-2xl flex-row items-center"
            >
              <Keyboard size={18} color="#059669" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-emerald-700 text-sm ml-2"
              >
                Manual Entry
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* LIST VIEW WITH COMPACT CARDS */
          <View className="flex-1 pt-4">
            <View className="px-6 pb-2 flex-row justify-between items-center">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-500 text-xs uppercase tracking-[1px]"
              >
                Scanned Manifest ({received_items.length})
              </Text>
              <TouchableOpacity
                onPress={() => set_modal_visible(true)}
                className="flex-row items-center bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100"
              >
                <Keyboard size={14} color="#059669" />
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-emerald-700 text-[11px] ml-1"
                >
                  Manual
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={received_items}
              keyExtractor={(item) => item.lpn_id}
              renderItem={render_item}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            />

            {/* FLOATING ACTION BOTTOM BAR */}
            <View className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-200 px-6 py-4 flex-row items-center space-x-3 gap-3">
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Clear List",
                    "Are you sure you want to drop all currently scanned materials?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Yes, Clear All",
                        style: "destructive",
                        onPress: () => set_received_items([]),
                      },
                    ],
                  );
                }}
                className="flex-1 bg-slate-100 py-4 rounded-2xl items-center"
              >
                <Text className="text-slate-600 font-bold">Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handle_process_receive}
                className="flex-[2] bg-emerald-600 py-4 rounded-2xl flex-row items-center justify-center"
              >
                <CheckCircle2 size={18} color="#ffffff" />
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white ml-2"
                >
                  Receive STO ({received_items.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* MANUAL INPUT MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modal_visible}
        onRequestClose={() => set_modal_visible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/50 justify-center p-6"
        >
          <View className="bg-white rounded-[24px] p-6 shadow-xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-lg text-slate-900"
              >
                Manual STO Entry
              </Text>
              <TouchableOpacity
                onPress={() => {
                  set_modal_visible(false);
                  set_manual_lpn_id("");
                }}
                className="p-1 bg-slate-100 rounded-full"
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-slate-500 mb-4">
              Manually type the exact License Plate Number (LPN) for STO
              receiving validation.
            </Text>

            <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6 flex-row items-center">
              <Barcode size={20} color="#94a3b8" />
              <TextInput
                ref={modal_input_ref}
                placeholder="Enter LPN ID..."
                placeholderTextColor="#94a3b8"
                value={manual_lpn_id}
                onChangeText={set_manual_lpn_id}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handle_manual_submit}
                className="flex-1 ml-3 text-slate-900 font-medium p-0"
              />
            </View>

            <View className="flex-row space-x-3 gap-3">
              <TouchableOpacity
                onPress={() => {
                  set_modal_visible(false);
                  set_manual_lpn_id("");
                }}
                className="flex-1 bg-slate-100 py-3.5 rounded-xl items-center"
              >
                <Text className="text-slate-600 font-bold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handle_manual_submit}
                disabled={loading || !manual_lpn_id.trim()}
                className={`flex-1 py-3.5 rounded-xl items-center justify-center flex-row ${
                  loading ? "bg-emerald-400" : "bg-emerald-600"
                }`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-white"
                  >
                    Validate LPN
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default Receive_STO;
