import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Vibration,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Barcode,
  Warehouse,
  MapPin,
  Layers,
  PackageMinus,
} from "lucide-react-native";

// ASSETS & CONFIG
import { firestore_db } from "@assets/scripts/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  runTransaction,
} from "firebase/firestore";

const Dispatch_Material = ({ navigation, route }) => {
  const { user_data } = route.params || {};
  const scanner_input_ref = useRef(null);

  const [loading, set_loading] = useState(false);
  const [scanned_value, set_scanned_value] = useState("");
  const [lpn_data, set_lpn_data] = useState(null);

  // Auto-focus para sa external scanner
  useEffect(() => {
    const focus_interval = setInterval(() => {
      scanner_input_ref.current?.focus();
    }, 1000);
    return () => clearInterval(focus_interval);
  }, []);

  // SEARCH / SCAN LPN
  const handle_scan = async (val) => {
    const clean_id = val.trim();
    if (!clean_id) return;
    set_scanned_value("");
    Vibration.vibrate(50);

    set_loading(true);
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
        set_lpn_data(doc_snap.data());
      } else {
        Alert.alert("Not Found", "This LPN is not in active inventory.");
        set_lpn_data(null);
      }
    } catch (e) {
      console.error("Fetch LPN Error:", e);
      Alert.alert("Error", "Failed to fetch LPN data.");
    } finally {
      set_loading(false);
    }
  };

  // DIRECT DISPATCH HANDLER (NO CONFIRMATION ALERT & KEEPS PAGE OPEN)
  const handle_dispatch = async () => {
    if (!lpn_data) return;

    set_loading(true);

    const date_now = new Date();
    const iso_dispatch_date = date_now.toISOString();
    const unix_timestamp = Math.floor(Date.now() / 1000);
    const current_user = String(user_data?.username || "ADMIN");
    const dispatched_by_fullname =
      `${user_data?.first_name || ""} ${user_data?.last_name || ""}`.trim() ||
      "ADMIN";

    try {
      await runTransaction(firestore_db, async (transaction) => {
        // ----------------------------------------------------
        // STEP 1: UPDATE TRANSFER ORDER (IF to_number_ref EXISTS)
        // ----------------------------------------------------
        if (lpn_data.to_number_ref) {
          const to_collection_ref = collection(
            firestore_db,
            "DB1_ERP_SYSTEM",
            "TBL_TRANSFER_ORDER",
            "DATA",
          );
          const to_query = query(
            to_collection_ref,
            where("to_number", "==", lpn_data.to_number_ref),
          );
          const to_snapshot = await getDocs(to_query);

          if (!to_snapshot.empty) {
            const to_doc_doc = to_snapshot.docs[0];
            const to_doc_ref = doc(
              firestore_db,
              "DB1_ERP_SYSTEM",
              "TBL_TRANSFER_ORDER",
              "DATA",
              to_doc_doc.id,
            );

            const to_doc_snap = await transaction.get(to_doc_ref);

            if (to_doc_snap.exists()) {
              const current_to_data = to_doc_snap.data();

              // Traverse and update specific lpn_id in transfer_list -> lpn_list
              const updated_transfer_list = (
                current_to_data.transfer_list || []
              ).map((transfer_item) => {
                const updated_lpn_list = (transfer_item.lpn_list || []).map(
                  (lpn_item) => {
                    if (lpn_item.lpn_id === lpn_data.lpn_id) {
                      return {
                        ...lpn_item,
                        to_dispatched_by: dispatched_by_fullname,
                      };
                    }
                    return lpn_item;
                  },
                );

                return {
                  ...transfer_item,
                  lpn_list: updated_lpn_list,
                };
              });

              transaction.update(to_doc_ref, {
                transfer_list: updated_transfer_list,
              });
            }
          }
        }

        // ----------------------------------------------------
        // STEP 2: DELETE LPN FROM ACTIVE INVENTORY
        // ----------------------------------------------------
        const active_inv_ref = doc(
          firestore_db,
          "DB1_ERP_SYSTEM",
          "TBL_INVENTORY_COUNT",
          "DATA",
          lpn_data.lpn_id,
        );
        transaction.delete(active_inv_ref);

        // ----------------------------------------------------
        // STEP 3: ADD RECORD TO TBL_PRODUCTION_CONSUMPTION
        // ----------------------------------------------------
        const consumption_ref = doc(
          firestore_db,
          "DB1_ERP_SYSTEM",
          "TBL_PRODUCTION_CONSUMPTION",
          "DATA",
          `${unix_timestamp}_${lpn_data.lpn_id}_${current_user}`,
        );

        transaction.set(consumption_ref, {
          ...lpn_data,
          dispatched_by: dispatched_by_fullname,
          dispatched_date: iso_dispatch_date,
        });
      });

      Vibration.vibrate([0, 50, 100, 50]); // Success double vibration

      Alert.alert("Success", `LPN successfully dispatched.`, [
        {
          text: "OK",
          onPress: () => {
            set_lpn_data(null); // Clear scanned LPN data
            setTimeout(() => scanner_input_ref.current?.focus(), 100); // Re-focus hidden scanner input
          },
        },
      ]);
    } catch (error) {
      console.error("Dispatch Transaction Error: ", error);
      Alert.alert(
        "Dispatch Failed",
        error.message || "Failed to process dispatch transaction.",
      );
    } finally {
      set_loading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {loading && (
        <View className="absolute inset-0 z-50 bg-white/60 justify-center items-center">
          <ActivityIndicator size="large" color="#ef4444" />
        </View>
      )}

      {/* Hidden input for continuous scanner reads */}
      <TextInput
        ref={scanner_input_ref}
        showSoftInputOnFocus={false}
        style={{ opacity: 0, height: 0, position: "absolute" }}
        onSubmitEditing={(e) => {
          const code = e.nativeEvent.text;
          if (code) {
            handle_scan(code);
            scanner_input_ref.current?.clear();
          }
        }}
        blurOnSubmit={false}
        autoFocus={true}
      />

      {/* HEADER */}
      <View className="px-6 pb-4 flex-row items-center border-b border-slate-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="ml-2 flex-1">
          <Text style={{ fontFamily: "Outfit-Bold" }} className="text-xl">
            Dispatch
          </Text>
          <Text className="text-slate-500 text-xs">
            Scan LPN to dispatch material
          </Text>
        </View>
        <PackageMinus size={24} color="#ef4444" />
      </View>

      <View className="flex-1 bg-slate-50">
        {!lpn_data ? (
          <View className="flex-1 justify-center items-center px-10">
            <View className="bg-red-100 border-2 border-red-500 p-10 rounded-full shadow-sm mb-6">
              <Barcode size={100} color="#ef4444" />
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-2xl text-slate-900"
            >
              READY TO SCAN
            </Text>
            <Text className="text-slate-500 text-center mt-2">
              Please scan the LPN sticker that will be dispatched to production.
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 py-6">
            <View className="bg-white mx-6 p-6 rounded-2xl border border-slate-100 shadow-sm">
              <Text className="text-red-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                LPN ID: {lpn_data.lpn_id}
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-2xl text-slate-900 mb-4"
              >
                {lpn_data.item_code}
              </Text>

              <View className="space-y-3">
                <View className="flex-row items-center justify-between py-2 border-b border-slate-50">
                  <View className="flex-row items-center">
                    <Warehouse size={16} color="#64748b" />
                    <Text className="text-slate-500 ml-2">Warehouse</Text>
                  </View>
                  <Text className="font-bold text-slate-800">
                    {lpn_data.warehouse_code}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-2 border-b border-slate-50">
                  <View className="flex-row items-center">
                    <MapPin size={16} color="#64748b" />
                    <Text className="text-slate-500 ml-2">Bin Location</Text>
                  </View>
                  <Text className="font-bold text-slate-800">
                    {lpn_data.sbin_code}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between py-2 border-b border-slate-50">
                  <View className="flex-row items-center">
                    <Layers size={16} color="#64748b" />
                    <Text className="text-slate-500 ml-2">Total Quantity</Text>
                  </View>
                  <Text className="font-bold text-slate-800">
                    {lpn_data.qty_base} {lpn_data.uom_base}
                  </Text>
                </View>
              </View>

              {/* DIRECT DISPATCH BUTTON */}
              <TouchableOpacity
                onPress={handle_dispatch}
                className="bg-red-500 py-5 rounded-2xl items-center mt-8 shadow-lg"
                activeOpacity={0.8}
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-lg tracking-[1px]"
                >
                  Dispatch
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => set_lpn_data(null)}
                className="mt-4 py-2 items-center"
              >
                <Text className="text-slate-400 font-bold">
                  Cancel / Scan Another
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Dispatch_Material;
