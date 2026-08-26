// Kailangan ko gumawa ng Stock Transport na process sa RF Gun app (React native)
// Kailangan ko ngayon ng 3 page stacks.

// 1. Stock_Transport.jsx = Ito yung list ng mga STO na ni-create ni user. Dapat meron iton search bar at date picker. Pwede mong gayahin yung UI design
// ko Downtime_Report.jsx
// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   ActivityIndicator,
//   TextInput,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import {
//   Plus,
//   ChevronLeft,
//   Clock,
//   FileText,
//   Calendar,
//   Cpu,
//   Search,
//   XCircle,
// } from "lucide-react-native";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { firestore_db } from "@assets/scripts/firebase";
// import {
//   collection,
//   onSnapshot,
//   query,
//   where,
//   orderBy,
// } from "firebase/firestore";

// const formatDate = (dateStr) => {
//   if (!dateStr) return "N/A";
//   const date = new Date(dateStr);
//   if (isNaN(date.getTime())) return dateStr;

//   return date.toLocaleDateString("en-US", {
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   });
// };

// const getFormattedSortDate = (dateObj) => {
//   const year = dateObj.getFullYear();
//   const month = String(dateObj.getMonth() + 1).padStart(2, "0");
//   const day = String(dateObj.getDate()).padStart(2, "0");
//   return `${year}-${month}-${day}`;
// };

// const Downtime_Report = ({ navigation, route }) => {
//   const { user_data } = route.params || {};
//   const [reports, set_reports] = useState([]);
//   const [loading, set_loading] = useState(true);

//   // SEARCH & DATE PICKER STATES
//   const [search_query, set_search_query] = useState("");
//   const [selected_date, set_selected_date] = useState(new Date());
//   const [show_date_picker, set_show_date_picker] = useState(false);

//   // Firestore Listener with User Reference and Date Filtering
//   useEffect(() => {
//     set_loading(true);
//     const date_sort_string = getFormattedSortDate(selected_date);
//     const username = user_data?.username || "";

//     // Query na nagfi-filter sa specific user at specific creation_date_sort
//     const q = query(
//       collection(firestore_db, "DB1_ERP_SYSTEM", "TBL_DOWNTIME_REPORT", "DATA"),
//       where("username_ref", "==", username),
//       where("creation_date_sort", "==", date_sort_string),
//     );

//     const unsubscribe = onSnapshot(
//       q,
//       (snapshot) => {
//         const data = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         set_reports(data);
//         set_loading(false);
//       },
//       (error) => {
//         console.error(error);
//         set_loading(false);
//       },
//     );

//     return () => unsubscribe();
//   }, [selected_date, user_data?.username]);

//   // Local UI Filter for Search Bar
//   const filtered_reports = reports.filter((item) => {
//     const q = search_query.toLowerCase().trim();
//     const doc_code = (item.doc_code || "").toLowerCase();
//     const product = (item.product || "").toLowerCase();
//     const machine_no = (item.machine_no || "").toLowerCase();

//     return (
//       doc_code.includes(q) || product.includes(q) || machine_no.includes(q)
//     );
//   });

//   return (
//     <SafeAreaView className="flex-1 bg-slate-50 relative" edges={["top"]}>
//       {loading && (
//         <View className="absolute inset-0 z-50 bg-white/60 justify-center items-center">
//           <ActivityIndicator size="large" color="#e11d48" />
//         </View>
//       )}

//       {/* HEADER */}
//       <View className="px-6 pb-4 pt-2 flex-row items-center bg-white border-b border-slate-100 shadow-sm">
//         <TouchableOpacity
//           onPress={() => navigation.goBack()}
//           className="p-2 -ml-2 rounded-full active:bg-slate-100"
//         >
//           <ChevronLeft size={24} color="#0f172a" />
//         </TouchableOpacity>
//         <View className="ml-2 flex-1">
//           <Text
//             style={{ fontFamily: "Outfit-Bold" }}
//             className="text-xl text-slate-900"
//           >
//             Downtime Report
//           </Text>
//           <Text className="text-slate-500 text-xs font-medium">
//             Production Records & Logs
//           </Text>
//         </View>
//       </View>

//       {/* SEARCH BAR & DATE PICKER SECTION */}
//       <View className="px-5 pt-4 pb-2 bg-white border-b border-slate-100 gap-y-2.5">
//         {/* SEARCH INPUT */}
//         <View className="flex-row items-center bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200">
//           <Search size={18} color="#94a3b8" />
//           <TextInput
//             value={search_query}
//             onChangeText={set_search_query}
//             placeholder="Search code, product, machine..."
//             placeholderTextColor="#94a3b8"
//             className="flex-1 ml-2 font-semibold text-slate-800 text-sm h-[32px]"
//             style={{
//               includeFontPadding: false, // Prevents Android font shift
//               paddingVertical: 0, // Keeps height stable
//             }}
//           />
//           {search_query ? (
//             <TouchableOpacity onPress={() => set_search_query("")}>
//               <XCircle size={18} color="#94a3b8" />
//             </TouchableOpacity>
//           ) : null}
//         </View>

//         {/* DATE SELECTOR BUTTON */}
//         <TouchableOpacity
//           onPress={() => set_show_date_picker(true)}
//           activeOpacity={0.7}
//           className="flex-row items-center justify-between bg-rose-50 border border-rose-100 px-3.5 py-2.5 rounded-xl"
//         >
//           <View className="flex-row items-center">
//             <Calendar size={16} color="#e11d48" />
//             <Text className="text-xs font-bold text-slate-600 ml-2">
//               Filter Date:
//             </Text>
//             <Text className="text-xs font-bold text-rose-700 ml-1">
//               {formatDate(getFormattedSortDate(selected_date))}
//             </Text>
//           </View>
//           <Text className="text-[11px] font-bold text-rose-600 uppercase">
//             Change Date
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {/* DATE PICKER COMPONENT */}
//       {show_date_picker && (
//         <DateTimePicker
//           value={selected_date}
//           mode="date"
//           display="default"
//           onChange={(e, d) => {
//             set_show_date_picker(false);
//             if (d) set_selected_date(d);
//           }}
//         />
//       )}

//       {/* LIST OF REPORTS */}
//       <ScrollView
//         className="flex-1 px-5 pt-4"
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 100 }}
//       >
//         {filtered_reports.length === 0 && !loading ? (
//           <View className="items-center justify-center py-20">
//             <View className="w-16 h-16 bg-slate-100 rounded-full items-center justify-center mb-3">
//               <FileText size={32} color="#94a3b8" />
//             </View>
//             <Text className="text-slate-600 font-bold text-base">
//               No Downtime Reports Found
//             </Text>
//             <Text className="text-slate-400 text-xs mt-1 text-center">
//               No records for this date or matching query.
//             </Text>
//           </View>
//         ) : (
//           filtered_reports.map((item) => {
//             // Kunin ang bilang ng downtime items
//             const downtimeCount = item.downtime_list
//               ? item.downtime_list.length
//               : 0;

//             return (
//               <TouchableOpacity
//                 key={item.id}
//                 activeOpacity={0.7}
//                 onPress={() =>
//                   navigation.navigate("edit_downtime", { report_data: item })
//                 }
//                 className="bg-white border border-slate-200/80 p-4 rounded-2xl mb-3 shadow-sm flex-row items-center justify-between"
//               >
//                 <View className="flex-1 pr-2">
//                   {/* TOP ROW: Document Code, Creation Date & Shift */}
//                   <View className="flex-row items-center justify-between mb-2">
//                     <View className="bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">
//                       <Text className="text-rose-700 font-bold text-[11px]">
//                         {item.doc_code || "NO CODE"}
//                       </Text>
//                     </View>

//                     <View className="flex-row items-center">
//                       <Calendar size={12} color="#64748b" />
//                       <Text className="text-slate-500 font-semibold text-[11px] ml-1">
//                         {formatDate(item.creation_date)}
//                       </Text>
//                     </View>
//                   </View>

//                   {/* PRODUCT NAME */}
//                   <Text
//                     style={{ fontFamily: "Outfit-Bold" }}
//                     className="text-base text-slate-900 mb-1"
//                     numberOfLines={1}
//                   >
//                     {item.product || "Unnamed Product"}
//                   </Text>

//                   {/* MACHINE NO */}
//                   <View className="flex-row items-center mb-3">
//                     <Cpu size={13} color="#64748b" />
//                     <Text className="text-xs font-semibold text-slate-500 ml-1">
//                       Machine No. {item.machine_no || "N/A"}
//                     </Text>
//                   </View>

//                   {/* BOTTOM METRICS: Downtime Count & Total Minutes */}
//                   <View className="flex-row items-center justify-between gap-2 pt-4 border-t border-slate-100">
//                     {/* No. of Downtime */}
//                     <View className="flex-row items-center bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
//                       <FileText size={12} color="#e11d48" />
//                       <Text className="text-rose-700 font-bold text-[11px] ml-1">
//                         {downtimeCount}{" "}
//                         {downtimeCount === 1 ? "Downtime" : "Downtimes"}
//                       </Text>
//                     </View>

//                     {/* Total Minutes */}
//                     <View className="flex-row items-center bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
//                       <Clock size={12} color="#e11d48" />
//                       <Text className="text-rose-700 font-bold text-[11px] ml-1">
//                         {item.total_minutes || 0} mins
//                       </Text>
//                     </View>
//                   </View>
//                 </View>
//               </TouchableOpacity>
//             );
//           })
//         )}
//       </ScrollView>

//       {/* FLOATING ACTION BUTTON (FAB) */}
//       <TouchableOpacity
//         onPress={() =>
//           navigation.navigate("create_downtime", {
//             user_data: user_data,
//           })
//         }
//         activeOpacity={0.8}
//         className="absolute bottom-6 right-6 bg-rose-600 w-14 h-14 rounded-full justify-center items-center shadow-lg shadow-rose-600/40 elevation-5 z-40"
//       >
//         <Plus size={28} color="white" />
//       </TouchableOpacity>
//     </SafeAreaView>
//   );
// };

// export default Downtime_Report;

// 2. Create_STO.jsx = Ito naman yung page sa pag create ng STO. Pero dito, upon creation palang dapat, may id na dapat agad yung STO. Kaya yung 

// 3. Edit_STO.jsx = Ito naman yung page sa pag edit ng STO. Mapupunta lang sa page na ito kapag clinick ni user yung specific STO sa Stock_Transport.jsx

// Pero unahin muna natin gawin yung Stock_Transport.jsx, mamaya na natin gawin yung 2 page stacks. Gawin mong Sky yung color theme ng Stock_Transport.jsx





// Upon creation palang ng STO, dapat magkakaroon agad ng data sa firestore iyon. Ibig sabihin mag eexist na dapat agad
// yung sto data, kahit wala pang input si user. Kailangan yon para makapag generate agad ng sto_data.id at may sto_status: "Draft"
// Ngayon Everytime na nagtatag si user ng LPN sa sto_data na iyon. update na yung function na gumagana doon. Kada dagdag sa transfer_list, update sa database (based sa sto_data.id)
// Firestore path: /DB1_ERP_SYSTEM/TBL_STOCK_TRANSPORT/DATA
const sto_data = [
  {
    id: "STO-20260807-193152308", // Auto Generated ito. At nasa baba kung paano ang pagkuha non
    // Kunin ang components ng local time
    //   const year = now.getFullYear();
    //   const month = String(now.getMonth() + 1).padStart(2, "0");
    //   const day = String(now.getDate()).padStart(2, "0");
    //   const hours = String(now.getHours()).padStart(2, "0");
    //   const minutes = String(now.getMinutes()).padStart(2, "0");
    //   const seconds = String(now.getSeconds()).padStart(2, "0");

    // Kunin ang Milliseconds (3 digits, e.g., 125, 005, 999)
    //   const ms = String(now.getMilliseconds()).padStart(3, "0");

    // Format: YYYYMMDDHHMMSS + MS
    //   const unique_id = `STO-${year}${month}${day}-${hours}${minutes}${seconds}${ms}`; // Ito na ngayon yung magiging sto_data.id
    control_no: "", // Naka blank lang ito by default. Magkakalaman lang ito kapag ipiprint na.
    creation_date: "2026-08-04T00:17:26.265Z", // Automatic ito... Kung kailan ginawa yung data (iso format).
    truck_no: "AZR 1234", // Manual Input
    truck_driver: "John", // Manual Input
    helper: "Extra", // Manual Input
    doc_no: "DOC-0001", // Manual Input (For reference lang ito ni user, pwede siya mag input dito ng kahit ano)
    location: "To Caloocan", // Selection ito (To Caloocan or To Filspin)
    sto_status: "Draft", // By default, upon creation ng STO, naka draft lang ito. Mag uupdate lang ito to "Printed" kapag na print na yung STO.
    // Ito naman yung mga list of LPN na itatag sa sto data na ito.
    transfer_list: [
      {
        batch_code: "",
        created_by: "Sem Sianghio",
        creation_date: "08-01-2026",
        expiry_date: "",
        gr_number: "",
        item_code: "R-FP",
        item_desc: "FLUFF PULP",
        lpn_id: "20260801-024044698-4",
        lpn_status: "Available",
        mfg_date: "",
        plant_code: "PL01",
        po_number: "",
        qty_base: 500,
        qty_in_kg: 0,
        remarks: "",
        sbin_code: "A-1",
        sloc_code: "",
        stype_code: "BULK",
        to_sbin_code: "M1",
        to_warehouse_code: "MS-CAL-PROD",
        uom_base: "KGS",
        uom_display: "KGS",
        warehouse_code: "MS-CAL-TEST",
        // Everytime na magtatag si user ng lpn sa specific STO. Automatic na magkakaroon ng ganito...
        // sto_number_ref: "STO-20260807-193152308", // ito yung sto_data.id
        // sto_picked_by: `${user_data.first_name} ${user_data.last_name}` // magkakaroon lang nito upon tagging na lpn, makikita kung sinong user yung nag tag.
        // sto_qty_roll: 0
      },
    ],
  },
];

// Ngayon... everytime na nag tatag si user ng lpn sa STO, nag uupdate din dapat yung database table ng lpn master list
// Ang path na iuupdate sa firestore: /DB1_ERP_SYSTEM/TBL_INVENTORY_COUNT/20260801-024044698-4 (ito yung lpn_data.lpn_id)

const lpn_data = {
        batch_code: "",
        created_by: "Sem Sianghio",
        creation_date: "08-01-2026",
        expiry_date: "",
        gr_number: "",
        item_code: "R-FP",
        item_desc: "FLUFF PULP",
        lpn_id: "20260801-024044698-4",
        lpn_status: "Available",
        mfg_date: "",
        plant_code: "PL01",
        po_number: "",
        qty_base: 500,
        qty_in_kg: 0,
        remarks: "",
        sbin_code: "A-1",
        sloc_code: "",
        stype_code: "BULK",
        to_sbin_code: "M1",
        to_warehouse_code: "MS-CAL-PROD",
        uom_base: "KGS",
        uom_display: "KGS",
        warehouse_code: "MS-CAL-TEST",
        // Magkakaroon din iyon ng ganito.
        // sto_number_ref: "STO-20260807-193152308", // ito yung sto_data.id
        // sto_picked_by: `${user_data.first_name} ${user_data.last_name}` // magkakaroon lang nito upon tagging na lpn, makikita kung sinong user yung nag tag.
      },
