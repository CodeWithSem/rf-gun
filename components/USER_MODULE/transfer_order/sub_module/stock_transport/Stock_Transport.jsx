import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  ChevronLeft,
  FileText,
  Calendar,
  Search,
  XCircle,
  Truck,
  User,
  MapPin,
  PackageCheck,
  ChevronRight,
  Warehouse,
  Trash2,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { firestore_db } from "@assets/scripts/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getFormattedSortDate = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Function para sa auto generation ng STO ID
const generateSTOId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");

  return `STO-${year}${month}${day}-${hours}${minutes}${seconds}${ms}`;
};

const Stock_Transport = ({ navigation, route }) => {
  const { user_data } = route.params || {};
  const [sto_list, set_sto_list] = useState([]);
  const [loading, set_loading] = useState(true);
  const [creating, set_creating] = useState(false);

  // SEARCH & DATE PICKER STATES
  const [search_query, set_search_query] = useState("");
  const [selected_date, set_selected_date] = useState(new Date());
  const [show_date_picker, set_show_date_picker] = useState(false);

  // Firestore Listener with User Reference and Date Filtering
  useEffect(() => {
    set_loading(true);
    const date_sort_string = getFormattedSortDate(selected_date);
    const username = user_data?.username || "";

    const q = query(
      collection(firestore_db, "DB1_ERP_SYSTEM", "TBL_STOCK_TRANSPORT", "DATA"),
      where("username_ref", "==", username),
      where("creation_date_sort", "==", date_sort_string),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        set_sto_list(data);
        set_loading(false);
      },
      (error) => {
        console.error("Firestore Listener Error:", error);
        set_loading(false);
      },
    );

    return () => unsubscribe();
  }, [selected_date, user_data?.username]);

  // Local UI Filter for Search Bar
  const filtered_sto = sto_list.filter((item) => {
    const q = search_query.toLowerCase().trim();
    const id = (item.id || "").toLowerCase();
    const doc_no = (item.doc_no || "").toLowerCase();
    const truck_no = (item.truck_no || "").toLowerCase();
    const driver = (item.truck_driver || "").toLowerCase();
    const location = (item.location || "").toLowerCase();

    return (
      id.includes(q) ||
      doc_no.includes(q) ||
      truck_no.includes(q) ||
      driver.includes(q) ||
      location.includes(q)
    );
  });

  // Function kapag pinalit ni user ang mag-create ng STO (Auto-creates Draft in Firestore)
  const handleCreateSTO = async () => {
    try {
      set_creating(true);
      const new_sto_id = generateSTOId();
      const now = new Date();
      const iso_date = now.toISOString();
      const sort_date = getFormattedSortDate(now);

      const initial_sto_doc = {
        id: new_sto_id,
        control_no: "",
        creation_date: iso_date,
        creation_date_sort: sort_date,
        username_ref: user_data?.username || "",
        created_by:
          `${user_data?.first_name || ""} ${user_data?.last_name || ""}`.trim() ||
          "Unknown User",
        truck_no: "",
        truck_driver: "",
        helper: "",
        doc_no: "",
        location: "To Caloocan",
        sto_status: "Draft",
        transfer_list: [],
      };

      // Save initial draft immediately to Firestore
      await setDoc(
        doc(
          firestore_db,
          "DB1_ERP_SYSTEM",
          "TBL_STOCK_TRANSPORT",
          "DATA",
          new_sto_id,
        ),
        initial_sto_doc,
      );

      set_creating(false);

      // Navigate directly to Create_STO
      navigation.navigate("create_sto", {
        sto_data: initial_sto_doc,
        user_data: user_data,
      });
    } catch (error) {
      console.error("Error creating STO Draft:", error);
      set_creating(false);
      Alert.alert("Error", "Failed to initialize new Stock Transport record.");
    }
  };

  const handleDelete = (item) => {
    if (item.transfer_list.length > 0) {
      Alert.alert(
        "Error",
        "You cannot delete this STO. There are LPNs that are tagged in this record.",
      );
      return;
    }
    Alert.alert(
      "Delete STO",
      `Are you sure you want to delete STO: ${item.id}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              set_loading(true);

              // Firestore reference
              const sto_ref = doc(
                firestore_db,
                "DB1_ERP_SYSTEM",
                "TBL_STOCK_TRANSPORT",
                "DATA",
                item.id,
              );

              // Delete document from Firestore
              await deleteDoc(sto_ref);

              // Update local state list (kung nasa list view ka)
              set_sto_list((prev_list) =>
                prev_list.filter((sto) => sto.id !== item.id),
              );

              Alert.alert("Success", "STO record has been deleted.");
            } catch (error) {
              console.error("Error deleting STO:", error);
              Alert.alert("Error", "An error has occured. Please try again.");
            } finally {
              set_loading(false);
            }
          },
        },
      ],
    );
  };

  // RETURN ORIGIN
  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {(loading || creating) && (
        <View className="absolute inset-0 z-50 bg-white/60 justify-center items-center">
          <ActivityIndicator size="large" color="#0284c7" />
          {creating && (
            <Text className="mt-2 text-sky-800 font-bold text-sm">
              Creating STO Draft...
            </Text>
          )}
        </View>
      )}

      {/* HEADER */}
      <View className="px-6 pb-4 flex-row items-center border-b border-slate-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="ml-2 flex-1">
          <Text style={{ fontFamily: "Outfit-Bold" }} className="text-xl">
            Stock Transport
          </Text>
          <Text className="text-slate-500 text-xs">
            Manage stock transport process
          </Text>
        </View>
        <Truck size={24} color="#0284c7" />
      </View>

      {/* SEARCH BAR & DATE PICKER SECTION */}
      <View className="px-5 pt-4 pb-3 bg-white border-b border-sky-100 gap-y-2.5">
        {/* SEARCH INPUT */}
        <View className="flex-row items-center bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
          <Search size={18} color="#94a3b8" />
          <TextInput
            value={search_query}
            onChangeText={set_search_query}
            placeholder="Search..."
            placeholderTextColor="#94a3b8"
            className="flex-1 ml-2 font-semibold text-slate-800 text-sm h-[32px]"
            style={{
              includeFontPadding: false, // Prevents Android font shift
              paddingVertical: 0, // Keeps height stable
            }}
          />
          {search_query ? (
            <TouchableOpacity onPress={() => set_search_query("")}>
              <XCircle size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* DATE SELECTOR BUTTON */}
        <TouchableOpacity
          onPress={() => set_show_date_picker(true)}
          activeOpacity={0.7}
          className="flex-row items-center justify-between bg-sky-100/70 border border-sky-200 px-3.5 h-12 rounded-xl"
        >
          <View className="flex-row items-center">
            <Calendar size={16} color="#0284c7" />
            <Text className="text-xs font-bold text-slate-600 ml-2 mt-0.5">
              Filter Date:
            </Text>
            <Text className="text-xs font-bold text-sky-800 ml-1 mt-0.5">
              {formatDate(getFormattedSortDate(selected_date))}
            </Text>
          </View>
          <Text className="text-[11px] font-bold text-sky-700 uppercase">
            Change Date
          </Text>
        </TouchableOpacity>
      </View>

      {/* DATE PICKER COMPONENT */}
      {show_date_picker && (
        <DateTimePicker
          value={selected_date}
          mode="date"
          display="default"
          onChange={(e, d) => {
            set_show_date_picker(false);
            if (d) set_selected_date(d);
          }}
        />
      )}

      {/* LIST OF STO RECORDS */}
      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {filtered_sto.length === 0 && !loading ? (
          <View className="items-center justify-center py-20">
            <View className="w-16 h-16 bg-sky-100/80 rounded-full items-center justify-center mb-3">
              <FileText size={32} color="#0284c7" />
            </View>
            <Text className="text-slate-700 font-bold text-base">
              No Stock Transport Found
            </Text>
            <Text className="text-slate-400 text-xs mt-1 text-center">
              No STO created for this date or matching search.
            </Text>
          </View>
        ) : (
          filtered_sto.map((item) => {
            const lpnCount = item.transfer_list ? item.transfer_list.length : 0;
            const isDraft = item.sto_status === "Draft";

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("edit_sto", {
                    sto_data: item,
                    user_data: user_data,
                  })
                }
                className="bg-white border border-slate-200 p-4 rounded-2xl mb-3 shadow-sm"
              >
                {/* TOP ROW: STO ID, Status, Creation Date */}
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-x-2">
                    <View className="bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
                      <Text className="text-sky-800 font-bold text-[11px]">
                        {item.id}
                      </Text>
                    </View>
                    <View
                      className={`px-2.5 py-1 rounded-md ${
                        isDraft
                          ? "bg-amber-50 border border-amber-200"
                          : "bg-emerald-50 border border-emerald-200"
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          isDraft ? "text-amber-700" : "text-emerald-700"
                        }`}
                      >
                        {item.sto_status || "Draft"}
                      </Text>
                    </View>
                  </View>

                  {/* Delete / Trash Button */}
                  <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    className="p-1.5 bg-rose-50 border border-rose-100 rounded-md active:bg-rose-100"
                  >
                    <Trash2 size={15} color="#e11d48" />
                  </TouchableOpacity>
                </View>

                {/* DOC NO & LOCATION */}
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-base text-slate-900 mb-1"
                  numberOfLines={1}
                >
                  {item.doc_no ? `${item.doc_no}` : "N/A"}
                </Text>

                <View className="flex-row flex-wrap justify-between mb-3 gap-y-2">
                  {/* Location Card */}
                  <View className="w-[48%] bg-sky-50/60 border border-sky-100 p-2.5 rounded-xl flex-row items-center">
                    <View className="bg-sky-100 p-1.5 rounded-lg mr-2">
                      <Warehouse size={14} color="#0284c7" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] font-bold text-sky-800 uppercase tracking-tight">
                        Location
                      </Text>
                      <Text className="text-xs font-bold text-slate-800 numberOfLines={1}">
                        {item.location || "N/A"}
                      </Text>
                    </View>
                  </View>

                  {/* Creation Date Card */}
                  <View className="w-[48%] bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl flex-row items-center">
                    <View className="bg-slate-200/60 p-1.5 rounded-lg mr-2">
                      <Calendar size={14} color="#64748b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        Date Created
                      </Text>
                      <Text className="text-xs font-semibold text-slate-700 numberOfLines={1}">
                        {formatDate(item.creation_date)}
                      </Text>
                    </View>
                  </View>

                  {/* Truck No. Card (Conditional) */}
                  {item.truck_no ? (
                    <View className="w-[48%] bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl flex-row items-center">
                      <View className="bg-slate-200/60 p-1.5 rounded-lg mr-2">
                        <Truck size={14} color="#64748b" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          Truck No.
                        </Text>
                        <Text className="text-xs font-semibold text-slate-700 numberOfLines={1}">
                          {item.truck_no}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {/* Truck Driver Card (Conditional) */}
                  {item.truck_driver ? (
                    <View className="w-[48%] bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl flex-row items-center">
                      <View className="bg-slate-200/60 p-1.5 rounded-lg mr-2">
                        <User size={14} color="#64748b" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          Driver
                        </Text>
                        <Text className="text-xs font-semibold text-slate-700 numberOfLines={1}">
                          {item.truck_driver}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* BOTTOM METRICS */}
                <View className="flex-row items-center justify-between pt-3 border-t border-sky-50">
                  <View className="flex-row items-center bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                    <PackageCheck size={13} color="#0284c7" />
                    <Text className="text-sky-800 font-bold text-[11px] ml-1">
                      {lpnCount} {lpnCount === 1 ? "LPN Tagged" : "LPNs Tagged"}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Text className="text-xs font-bold text-sky-600 mr-1">
                      View / Edit
                    </Text>
                    <ChevronRight size={14} color="#0284c7" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <TouchableOpacity
        onPress={handleCreateSTO}
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 bg-sky-600 w-14 h-14 rounded-full justify-center items-center shadow-lg shadow-sky-600/40 elevation-5 z-40"
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Stock_Transport;
