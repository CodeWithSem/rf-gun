import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Calendar,
  Layers,
  Clock,
  Search,
  X,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

// ASSETS & CONFIG
import { firestore_db } from "@assets/scripts/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { format_date } from "@assets/scripts/functions/format";

const Registration_Database = ({ navigation, route }) => {
  const { user_data } = route.params || {};

  const [loading, set_loading] = useState(false);
  const [fg_list, set_fg_list] = useState([]);
  const [selected_date, set_selected_date] = useState(new Date());
  const [show_datepicker, set_show_datepicker] = useState(false);

  // LOCAL SEARCH STATE
  const [search_query, set_search_query] = useState("");

  // DISPLAY DATE FORMATTER (MM-DD-YYYY)
  const format_display_date = (date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  };

  // FETCH REGISTERED FG FROM FIRESTORE (DATE FILTER ONLY)
  const fetch_registered_fg = async (date_target) => {
    // 1. Agarang i-clear ang list at search para gumaan ang thread memory
    set_fg_list([]);
    set_search_query("");
    set_loading(true);

    const db_date_str = format_date(date_target);

    // 2. Bigyan ng kaunting space ang UI thread na i-render ang loading spinner nang walang interference
    setTimeout(async () => {
      try {
        const q = query(
          collection(firestore_db, "DB1_ERP_SYSTEM/TBL_FG_REGISTRATION/DATA"),
          where("creation_date", "==", db_date_str),
        );

        const querySnapshot = await getDocs(q);
        const temp_list = [];

        querySnapshot.forEach((doc) => {
          temp_list.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        // Huling input ang mapunta sa pinakataas.
        temp_list.reverse();

        set_fg_list(temp_list);
      } catch (error) {
        console.error("Error fetching FG registration database: ", error);
      } finally {
        set_loading(false);
      }
    }, 100); // 100ms macro-task delay para maiwasan ang UI freezing/hanging
  };

  // LOCAL FILTERING LOGIC (BATCH CODE, LOT NUMBER, STACKER ID)
  const filtered_fg_list = useMemo(() => {
    if (!search_query.trim()) return fg_list;

    const target_search = search_query.toLowerCase().trim();

    return fg_list.filter((item) => {
      const batch_code = String(item.batch_code || "").toLowerCase();
      const lot_number = String(item.lot_number || "").toLowerCase();
      const stacker_id = String(item.stacker_id || "").toLowerCase();
      const item_code = String(item.item_code || "").toLowerCase();

      return (
        batch_code.includes(target_search) ||
        lot_number.includes(target_search) ||
        stacker_id.includes(target_search) ||
        item_code.includes(target_search)
      );
    });
  }, [search_query, fg_list]);

  // Trigger data fetch on date change
  useEffect(() => {
    fetch_registered_fg(selected_date);
  }, [selected_date]);

  const handle_date_change = (event, date) => {
    if (Platform.OS === "android") {
      set_show_datepicker(false);
    }
    if (date) {
      set_selected_date(date);
    }
  };

  // HIGHLY OPTIMIZED CARD COMPONENT FOR VIEWING ONLY
  const FG_Card = React.memo(({ item }) => {
    const isPending = String(item.lpn_status || "").toUpperCase() === "PENDING";

    return (
      <View className="bg-white mx-4 mb-2.5 p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* MAIN BODY: LEFT CONTENT */}
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-3">
            {/* ITEM CODE & STATUS */}
            <View className="flex-row items-center space-x-2 mb-0.5">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-base text-slate-900"
              >
                {item.item_code || "No Item Code"}
              </Text>
              <View
                className={`ml-2 px-2 py-0.5 rounded-md border ${isPending ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100"}`}
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className={`text-[8px] uppercase tracking-wide ${isPending ? "text-amber-600" : "text-emerald-600"}`}
                >
                  {item.lpn_status || "PENDING"}
                </Text>
              </View>
            </View>

            {/* LPN ID */}
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-xs text-sky-600 mb-3"
            >
              LPN: {item.lpn_id}
            </Text>

            {/* SEPARATED ROWS FOR BATCH, LOT, STACKER */}
            <View className="space-y-1.5">
              <Text className="text-xs text-slate-600">
                <Text className="text-slate-400 font-bold tracking-wide uppercase text-[10px]">
                  Batch:{" "}
                </Text>
                {item.batch_code || "-"}
              </Text>
              <Text className="text-xs text-slate-600">
                <Text className="text-slate-400 font-bold tracking-wide uppercase text-[10px]">
                  Lot No:{" "}
                </Text>
                {item.lot_number || "-"}
              </Text>
              <Text className="text-xs text-slate-600">
                <Text className="text-slate-400 font-bold tracking-wide uppercase text-[10px]">
                  Stacker ID:{" "}
                </Text>
                {item.stacker_id || "-"}
              </Text>
            </View>

            {/* SYSTEM TIMESTAMPS SECTION */}
            <View className="mt-3 pt-2 border-t border-dashed border-slate-100 flex-row items-center space-x-3">
              <View className="flex-row items-center opacity-70">
                <Calendar size={11} color="#94a3b8" />
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-[10px] text-slate-400 ml-1"
                >
                  {item.creation_date || "-"}
                </Text>
              </View>
              <View className="ml-2 flex-row items-center opacity-70">
                <Clock size={11} color="#94a3b8" />
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-[10px] text-slate-400 ml-1"
                >
                  {item.creation_time || "-"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* BOTTOM SECTION: REGISTERED QUANTITY BANNER */}
        <View className="mt-4 pt-3 border-t border-slate-100 flex-row justify-between items-center">
          <Text
            style={{ fontFamily: "Outfit-Medium" }}
            className="text-xs text-slate-400 uppercase tracking-wider"
          >
            Registered Qty
          </Text>
          <View className="flex-row items-baseline space-x-1">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-lg text-slate-900 leading-none"
            >
              {item.qty_base}
            </Text>
            <Text className="text-xs text-slate-400 uppercase font-medium ml-1">
              {item.uom_base || "PCS"}
            </Text>
          </View>
        </View>
      </View>
    );
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* HEADER */}
      <View className="px-6 pb-4 flex-row items-center bg-white border-b border-slate-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 -ml-2"
        >
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <View className="ml-2 flex-1">
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-xl text-slate-900"
          >
            Registration Database
          </Text>
          <Text className="text-slate-500 text-xs">
            View registered finished goods logs
          </Text>
        </View>
      </View>

      {/* DATE FILTER */}
      <View className="bg-white px-6 py-3 border-b border-slate-100 flex-row items-center justify-between">
        <View>
          <Text
            style={{ fontFamily: "Outfit-Medium" }}
            className="text-slate-400 text-[10px] uppercase tracking-wider"
          >
            Filter Production Date
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-800 text-base mt-0.5"
          >
            {format_display_date(selected_date)}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => set_show_datepicker(true)}
          className="bg-sky-50 border border-sky-100 px-4 py-3 rounded-xl flex-row items-center"
        >
          <Calendar size={15} color="#0284c7" />
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-sky-600 text-xs ml-2"
          >
            Change Date
          </Text>
        </TouchableOpacity>
      </View>

      {/* LOCAL SEARCH INPUT */}
      <View className="bg-white px-4 pb-3 pt-2 border-b border-slate-200">
        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
          <Search size={16} color="#94a3b8" />
          <TextInput
            style={{ fontFamily: "Outfit-Regular" }}
            className="flex-1 ml-1 text-sm text-slate-800 p-2"
            placeholder="Search Batch, Lot, or Stacker ID..."
            placeholderTextColor="#94a3b8"
            value={search_query}
            onChangeText={set_search_query}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading} // I-disable ang search kapag naglo-load
          />
          {search_query.length > 0 && (
            <TouchableOpacity onPress={() => set_search_query("")}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {show_datepicker && (
        <DateTimePicker
          value={selected_date}
          mode="date"
          display="default"
          onChange={handle_date_change}
          maximumDate={new Date()}
        />
      )}

      {/* RENDER LIST O LOADING STATE */}
      {loading ? (
        <View className="flex-1 justify-center items-center bg-slate-50">
          <ActivityIndicator size="large" color="#0284c7" />
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-400 text-xs mt-3"
          >
            Fetching master logs...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered_fg_list}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FG_Card item={item} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center pt-20 px-10">
              <Layers size={44} color="#cbd5e1" />
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-400 text-base mt-4"
              >
                {search_query ? "No Match Found" : "No Records Found"}
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-400 text-xs text-center mt-1 leading-4"
              >
                {search_query
                  ? "Subukang baguhin ang iyong keyword o i-check ang spelling."
                  : "There are no production logs registered under this specific date."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Registration_Database;
