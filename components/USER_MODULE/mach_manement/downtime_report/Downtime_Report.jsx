import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  ChevronLeft,
  Clock,
  FileText,
  Calendar,
  Cpu,
  Search,
  XCircle,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { firestore_db } from "@assets/scripts/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
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

const Downtime_Report = ({ navigation, route }) => {
  const { user_data } = route.params || {};
  const [reports, set_reports] = useState([]);
  const [loading, set_loading] = useState(true);

  // SEARCH & DATE PICKER STATES
  const [search_query, set_search_query] = useState("");
  const [selected_date, set_selected_date] = useState(new Date());
  const [show_date_picker, set_show_date_picker] = useState(false);

  // Firestore Listener with User Reference and Date Filtering
  useEffect(() => {
    set_loading(true);
    const date_sort_string = getFormattedSortDate(selected_date);
    const username = user_data?.username || "";

    // Query na nagfi-filter sa specific user at specific creation_date_sort
    const q = query(
      collection(firestore_db, "DB1_ERP_SYSTEM", "TBL_DOWNTIME_REPORT", "DATA"),
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
        set_reports(data);
        set_loading(false);
      },
      (error) => {
        console.error(error);
        set_loading(false);
      },
    );

    return () => unsubscribe();
  }, [selected_date, user_data?.username]);

  // Local UI Filter for Search Bar
  const filtered_reports = reports.filter((item) => {
    const q = search_query.toLowerCase().trim();
    const doc_code = (item.doc_code || "").toLowerCase();
    const product = (item.product || "").toLowerCase();
    const machine_no = (item.machine_no || "").toLowerCase();

    return (
      doc_code.includes(q) || product.includes(q) || machine_no.includes(q)
    );
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50 relative" edges={["top"]}>
      {loading && (
        <View className="absolute inset-0 z-50 bg-white/60 justify-center items-center">
          <ActivityIndicator size="large" color="#e11d48" />
        </View>
      )}

      {/* HEADER */}
      <View className="px-6 pb-4 pt-2 flex-row items-center bg-white border-b border-slate-100 shadow-sm">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2 rounded-full active:bg-slate-100"
        >
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="ml-2 flex-1">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-xl text-slate-900"
          >
            Downtime Report
          </Text>
          <Text className="text-slate-500 text-xs font-medium">
            Production Records & Logs
          </Text>
        </View>
      </View>

      {/* SEARCH BAR & DATE PICKER SECTION */}
      <View className="px-5 pt-4 pb-2 bg-white border-b border-slate-100 gap-y-2.5">
        {/* SEARCH INPUT */}
        <View className="flex-row items-center bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
          <Search size={18} color="#94a3b8" />
          <TextInput
            value={search_query}
            onChangeText={set_search_query}
            placeholder="Search code, product, machine..."
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
          className="flex-row items-center justify-between bg-rose-50 border border-rose-100 px-3.5 py-2.5 rounded-xl"
        >
          <View className="flex-row items-center">
            <Calendar size={16} color="#e11d48" />
            <Text className="text-xs font-bold text-slate-600 ml-2">
              Filter Date:
            </Text>
            <Text className="text-xs font-bold text-rose-700 ml-1">
              {formatDate(getFormattedSortDate(selected_date))}
            </Text>
          </View>
          <Text className="text-[11px] font-bold text-rose-600 uppercase">
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

      {/* LIST OF REPORTS */}
      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {filtered_reports.length === 0 && !loading ? (
          <View className="items-center justify-center py-20">
            <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-3">
              <FileText size={32} color="#94a3b8" />
            </View>
            <Text className="text-slate-600 font-bold text-base">
              No Downtime Reports Found
            </Text>
            <Text className="text-slate-400 text-xs mt-1 text-center">
              No records for this date or matching query.
            </Text>
          </View>
        ) : (
          filtered_reports.map((item) => {
            // Kunin ang bilang ng downtime items
            const downtimeCount = item.downtime_list
              ? item.downtime_list.length
              : 0;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("edit_downtime", { report_data: item })
                }
                className="bg-white border border-slate-200/80 p-4 rounded-2xl mb-3 shadow-sm flex-row items-center justify-between"
              >
                <View className="flex-1 pr-2">
                  {/* TOP ROW: Document Code, Creation Date & Shift */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
                      <Text className="text-rose-700 font-bold text-[11px]">
                        {item.doc_code || "NO CODE"}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Calendar size={12} color="#64748b" />
                      <Text className="text-slate-500 font-semibold text-[11px] ml-1">
                        {formatDate(item.creation_date)}
                      </Text>
                    </View>
                  </View>

                  {/* PRODUCT NAME */}
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-base text-slate-900 mb-1"
                    numberOfLines={1}
                  >
                    {item.product || "Unnamed Product"}
                  </Text>

                  {/* MACHINE NO */}
                  <View className="flex-row items-center mb-3">
                    <Cpu size={13} color="#64748b" />
                    <Text className="text-xs font-semibold text-slate-500 ml-1">
                      Machine No. {item.machine_no || "N/A"}
                    </Text>
                  </View>

                  {/* BOTTOM METRICS: Downtime Count & Total Minutes */}
                  <View className="flex-row items-center justify-between gap-2 pt-4 border-t border-slate-100">
                    {/* No. of Downtime */}
                    <View className="flex-row items-center bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                      <FileText size={12} color="#e11d48" />
                      <Text className="text-rose-700 font-bold text-[11px] ml-1">
                        {downtimeCount}{" "}
                        {downtimeCount === 1 ? "Downtime" : "Downtimes"}
                      </Text>
                    </View>

                    {/* Total Minutes */}
                    <View className="flex-row items-center bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                      <Clock size={12} color="#e11d48" />
                      <Text className="text-rose-700 font-bold text-[11px] ml-1">
                        {item.total_minutes || 0} mins
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("create_downtime", {
            user_data: user_data,
          })
        }
        activeOpacity={0.8}
        className="absolute bottom-6 right-6 bg-rose-600 w-14 h-14 rounded-full justify-center items-center shadow-lg shadow-rose-600/40 elevation-5 z-40"
      >
        <Plus size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Downtime_Report;
