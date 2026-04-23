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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Search,
  Box,
  X,
  Plus,
  Move,
  ChevronsRight,
  History,
  FileText,
  ArrowRight,
} from "lucide-react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
} from "firebase/firestore";
import { firestore_db } from "../../../assets/scripts/firebase";
import {
  format_date,
  get_date_now,
} from "../../../assets/scripts/functions/format";

const User_Direct = ({ route, navigation }) => {
  const { user_data } = route.params;

  // State
  const [is_loading, set_is_loading] = useState(true);
  const [directed_transfers, set_directed_transfers] = useState([]);
  const [search_query, set_search_query] = useState("");

  // Modal States
  const [is_details_modal_visible, set_is_details_modal_visible] =
    useState(false);
  const [is_create_modal_visible, set_is_create_modal_visible] =
    useState(false);
  const [selected_transfer, set_selected_transfer] = useState(null);

  // New Transfer Form State
  const [remarks, set_remarks] = useState("");
  const [generated_id, set_generated_id] = useState("");

  useEffect(() => {
    const direct_ref = collection(
      firestore_db,
      "DB1_ERP_SYSTEM",
      "TBL_USER_DIRECT_TRANSFER",
      "DATA",
    );
    const q = query(direct_ref, where("created_by", "==", user_data.username));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched_data = snapshot.docs.map((doc) => ({
          doc_id: doc.id,
          ...doc.data(),
        }));
        const sorted_data = fetched_data.sort((a, b) => {
          const id_a = a.transaction_id || "";
          const id_b = b.transaction_id || "";
          return id_b.localeCompare(id_a); // Descending order (Latest first)
        });
        set_directed_transfers(sorted_data);
        set_is_loading(false);
      },
      (error) => {
        console.error("Firestore Error:", error);
        set_is_loading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Function to generate a temporary ID when opening the create modal
  const handle_open_create = () => {
    const now = new Date();
    const timestamp_base = now
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);
    set_generated_id(timestamp_base);
    set_remarks("");
    set_is_create_modal_visible(true);
  };

  const handle_confirm_header = async () => {
    if (!remarks.trim()) return;

    set_is_loading(true);

    try {
      const direct_transfer_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_USER_DIRECT_TRANSFER",
        "DATA",
        generated_id,
      );

      const new_transfer_data = {
        transaction_id: generated_id,
        ud_number: generated_id,
        remarks: remarks,
        status: "Pending",
        created_by: user_data.username,
        creation_date: format_date(get_date_now()),
        selected_lpn_list: [],
        total_lpn: 0,
      };

      await setDoc(direct_transfer_ref, new_transfer_data);

      set_is_create_modal_visible(false);

      navigation.navigate("lpn_transfer", {
        user_data,
        transaction_id: generated_id,
        existing_data: new_transfer_data, // Nag-pasa ng initial empty data
      });
    } catch (error) {
      console.error("Error creating transfer header:", error);
    } finally {
      set_is_loading(false);
    }
  };

  const render_transfer_card = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        // REVISED: Imbes na modal, navigate na sa lpn_transfer
        navigation.navigate("lpn_transfer", {
          user_data,
          transaction_id: item.transaction_id,
          existing_data: item, // Dito papasok yung selected_lpn_list
        });
      }}
      className="bg-white p-5 rounded-xl mb-4 border border-slate-200"
    >
      {/* Header Part: UD Number & Status */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <View className="bg-sky-100 p-2 rounded-lg mr-3">
            <FileText size={20} color="#0284c7" />
          </View>
          <View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-lg text-slate-900"
            >
              {item.ud_number}
            </Text>
            <Text className="text-[10px] text-slate-400 font-[Outfit-Medium]">
              {item.created_by}
            </Text>
          </View>
        </View>
        <View
          className={`px-3 py-1 rounded-full border ${item.status === "Pending" ? "bg-amber-50 border-amber-100" : "bg-green-50 border-green-100"}`}
        >
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className={`text-[10px] uppercase ${item.status === "Pending" ? "text-amber-600" : "text-green-600"}`}
          >
            {item.status || "Pending"}
          </Text>
        </View>
      </View>

      {/* Remarks Area */}
      <View className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
        <Text className="text-[9px] text-slate-400 uppercase font-[Outfit-Bold] mb-1">
          Remarks / Reason
        </Text>
        <Text
          style={{ fontFamily: "Outfit-Medium" }}
          className="text-slate-600 text-xs"
          numberOfLines={2}
        >
          {item.remarks || "No remarks provided."}
        </Text>
      </View>

      {/* Footer Part: LPN Count & Date */}
      <View className="flex-row justify-between items-center pt-3 border-t border-slate-50">
        <View className="flex-row items-center">
          <Box size={14} color="#64748b" />
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-500 text-[11px] ml-1"
          >
            {item.total_lpn || 0} LPN(s)
          </Text>
        </View>
        <Text
          style={{ fontFamily: "Outfit-Regular" }}
          className="text-slate-400 text-[10px]"
        >
          {item.creation_date}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
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
              User Directed Transfer
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-xs"
            >
              Manual LPN movement
            </Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-6 py-4 border-b border-slate-200">
        <View className="bg-slate-50 flex-row items-center px-4 rounded-lg border border-slate-200">
          <Search size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search LPN or Reference..."
            className="flex-1 py-4 ml-2 font-[Outfit-Regular] text-slate-900"
            value={search_query}
            onChangeText={set_search_query}
          />
        </View>
      </View>

      {/* List Area */}
      {is_loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <FlatList
          data={directed_transfers.filter((ud) => {
            const search = search_query.toLowerCase();
            return (
              ud.ud_number?.toLowerCase().includes(search) ||
              ud.remarks?.toLowerCase().includes(search)
            );
          })}
          className="bg-slate-50/50"
          renderItem={render_transfer_card}
          keyExtractor={(item) => item.doc_id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 100,
          }}
          ListEmptyComponent={() => (
            <View className="items-center justify-center mt-20">
              <History size={48} color="#cbd5e1" />
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-400 mt-4 text-center px-10"
              >
                No recent directed transfers found. Tap the (+) button to create
                one.
              </Text>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handle_open_create}
        className="absolute bottom-10 right-8 bg-sky-600 w-16 h-16 rounded-full items-center justify-center shadow-xl shadow-sky-200"
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>

      {/* MODAL: CREATE NEW TRANSFER HEADER */}
      <Modal visible={is_create_modal_visible} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-slate-900/60 justify-end">
            <View className="bg-white rounded-t-[40px] h-[75%]">
              <View className="px-8 pt-8 pb-6 flex-row justify-between items-center border-b border-slate-100">
                <View className="flex-row items-center">
                  <View className="bg-sky-100 p-2 rounded-lg mr-3">
                    <FileText size={24} color="#0284c7" />
                  </View>
                  <View>
                    <Text
                      style={{ fontFamily: "Outfit-Bold" }}
                      className="text-xl text-slate-900"
                    >
                      New Directed Transfer
                    </Text>
                    <Text
                      style={{ fontFamily: "Outfit-Medium" }}
                      className="text-sky-600 text-sm"
                    >
                      {generated_id}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => set_is_create_modal_visible(false)}
                  className="bg-slate-100 p-2 rounded-full"
                >
                  <X size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="px-8 pt-6"
                showsVerticalScrollIndicator={false}
              >
                <View className="mb-6">
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-slate-400 text-[11px] uppercase tracking-widest mb-2 ml-1"
                  >
                    Movement Remarks
                  </Text>
                  <View className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                    <TextInput
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                      placeholder="Indicate the reason for this manual movement (e.g., Replenishment, Damaged Area, etc.)"
                      className="font-[Outfit-Regular] text-slate-900 text-base h-40"
                      value={remarks}
                      onChangeText={set_remarks}
                    />
                  </View>
                </View>

                <View className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex-row items-start">
                  <Box size={18} color="#d97706" />
                  <Text
                    style={{ fontFamily: "Outfit-Regular" }}
                    className="text-amber-800 text-xs ml-3 flex-1 leading-5"
                  >
                    After confirming, you will proceed to the scanning screen to
                    select the LPN and Destination Bin.
                  </Text>
                </View>
              </ScrollView>

              <View className="p-8 border-t border-slate-100">
                <TouchableOpacity
                  onPress={handle_confirm_header}
                  disabled={!remarks.trim()}
                  className={`${remarks.trim() ? "bg-sky-600" : "bg-slate-300"} w-full py-5 rounded-2xl items-center flex-row justify-center`}
                >
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-white text-lg mr-2"
                  >
                    Proceed to Scan
                  </Text>
                  <ArrowRight size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Details Modal - Pwede mo na i-delete ito kung hindi na gagamitin */}
      <Modal
        visible={is_details_modal_visible}
        animationType="fade"
        transparent
      >
        <View className="flex-1 bg-slate-900/60 justify-end">
          <View className="bg-white rounded-t-[40px] h-[60%]">
            <View className="px-8 pt-8 pb-6 flex-row justify-between items-center border-b border-slate-100">
              <View className="flex-row items-center">
                <View className="bg-sky-100 p-2 rounded-lg mr-3">
                  <Box size={24} color="#0284c7" />
                </View>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-xl text-slate-900"
                >
                  Transfer Details
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => set_is_details_modal_visible(false)}
                className="bg-slate-100 p-2 rounded-full"
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View className="p-8 items-center justify-center flex-1">
              <Text
                style={{ fontFamily: "Outfit-Medium" }}
                className="text-slate-400"
              >
                Record details view under construction.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default User_Direct;
