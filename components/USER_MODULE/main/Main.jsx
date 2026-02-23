import React, { useEffect, useState } from "react"; // Added useEffect, useState
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  BackHandler, // Added BackHandler
  Modal, // Added Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import {
  Package,
  BarChart3,
  Tag,
  ShoppingCart,
  MessageSquare,
  LogOut,
  MapPin,
  ChevronRight,
  Clock,
  User as UserIcon,
  AlertCircle, // Added for Modal icon
} from "lucide-react-native";

const Main = ({ route, navigation }) => {
  const { user, storeData, visitType, isDiversion, remarks } = route.params;

  // 1. State for the confirmation modal
  const [showExitModal, setShowExitModal] = useState(false);
  const isFocused = useIsFocused();
  // 2. Handle Back Button Logic
  useEffect(() => {
    // ONLY run this logic if the user is physically on the Main screen
    if (!isFocused) return;

    const backAction = () => {
      setShowExitModal(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // If we are navigating "forward" to a module, don't show the modal
      // 'push' or 'navigate' usually triggers 'beforeRemove' in some stack configs
      if (e.data.action.type === "NAVIGATE" || e.data.action.type === "PUSH") {
        return;
      }

      if (!showExitModal) {
        e.preventDefault();
        setShowExitModal(true);
      }
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [navigation, showExitModal, isFocused]);

  const modules = [
    {
      id: 1,
      title: "Inventory & Stock",
      subtitle: "Audit & Expiry",
      icon: <Package size={28} color="#0284c7" />,
      screen: "InventoryStock",
    },
    {
      id: 2,
      title: "Share of Shelf",
      subtitle: "SOS & Visibility",
      icon: <BarChart3 size={28} color="#0284c7" />,
      screen: "SOS",
    },
    {
      id: 3,
      title: "Pricing & Promos",
      subtitle: "Compliance Check",
      icon: <Tag size={28} color="#0284c7" />,
      screen: "PricingPromo",
    },
    {
      id: 4,
      title: "Ordering",
      subtitle: "Replenishment",
      icon: <ShoppingCart size={28} color="#0284c7" />,
      screen: "Ordering",
    },
    {
      id: 5,
      title: "Store Insights",
      subtitle: "Communication",
      icon: <MessageSquare size={28} color="#0284c7" />,
      screen: "StoreInsights",
    },
  ];

  const handleLogout = () => {
    setShowExitModal(false);
    navigation.reset({
      index: 1,
      routes: [
        { name: "Login" },
        { name: "Dashboard", params: { user: user } },
      ],
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="white"
        translucent={false}
      />

      {/* Profile Header */}
      <View className="bg-white px-6 pt-2 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center mt-5">
          <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center border border-slate-200">
            <UserIcon size={20} color="#64748b" />
          </View>
          <View className="ml-3">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-900 text-sm"
            >
              {user?.fullName || "Merchandiser"}
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-[10px] uppercase tracking-tighter"
            >
              {user?.role || "Field Personnel"}
            </Text>
          </View>
        </View>
      </View>

      {/* 1. Header: Store Context */}
      <View className="bg-white px-6 pt-4 pb-6 border-b border-slate-200">
        <View className="flex-row items-center mb-4">
          <View className="bg-sky-100 p-2 rounded-xl mr-3">
            <MapPin size={20} color="#0284c7" />
          </View>
          <View className="flex-1">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-slate-900 text-lg leading-tight"
            >
              {storeData?.description}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-500 text-xs"
              >
                Store Code: {storeData?.code}
              </Text>
              {storeData?.planDate && (
                <>
                  <View className="w-1 h-1 rounded-full bg-slate-300 mx-2" />
                  <Text
                    style={{ fontFamily: "Outfit-Medium" }}
                    className="text-slate-500 text-xs"
                  >
                    {storeData.planDate}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Badges Container */}
          <View className="items-end">
            {/* Visit Type Badge */}
            <View
              className={`px-3 py-1 rounded-full mb-1 ${visitType === "mcp" ? "bg-green-100" : "bg-sky-100"}`}
            >
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className={`text-[9px] uppercase ${visitType === "mcp" ? "text-green-700" : "text-sky-700"}`}
              >
                {visitType === "mcp" ? "Planned" : "Ad-hoc"}
              </Text>
            </View>
          </View>
        </View>

        {/* Diversion Remarks */}
        {isDiversion && (
          <View className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex-row items-center">
            <Clock size={14} color="#ea580c" />
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className="text-orange-700 text-[11px] ml-2"
            >
              Diversion Remark: {remarks}
            </Text>
          </View>
        )}
      </View>

      {/* Modules Grid */}
      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-slate-400 text-[11px] uppercase tracking-widest mb-4"
        >
          Merchandising Process
        </Text>
        <View className="flex-row flex-wrap justify-between mb-7">
          {modules.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate(item.screen, { user, storeData })
              }
              className="w-[48%] bg-white p-5 rounded-xl mb-4 border border-slate-200 shadow-sm shadow-slate-200"
            >
              <View className="bg-sky-50 w-12 h-12 rounded-xl items-center justify-center mb-4">
                {item.icon}
              </View>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-slate-800 text-[15px] leading-tight"
              >
                {item.title}
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-400 text-[11px] mt-1"
              >
                {item.subtitle}
              </Text>
              <View className="flex-row items-center mt-4">
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-sky-600 text-[10px] uppercase"
                >
                  Start Task
                </Text>
                <ChevronRight size={12} color="#0284c7" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="px-6 py-6 bg-white border-t border-slate-100">
        <TouchableOpacity
          onPress={() => setShowExitModal(true)}
          className="flex-row items-center justify-center bg-slate-100 py-4 rounded-2xl"
        >
          <LogOut size={20} color="#64748b" />
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-slate-500 ml-3 text-base"
          >
            End Visit & Logout
          </Text>
        </TouchableOpacity>
        <Text
          style={{ fontFamily: "Outfit-Regular" }}
          className="text-center text-slate-400 text-[10px] mt-3"
        >
          Logging out will reset your current store session.
        </Text>
      </View>

      {/* EXIT CONFIRMATION MODAL */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View className="flex-1 bg-slate-900/50 justify-center items-center px-8">
          <View className="bg-white w-full rounded-3xl p-8 items-center">
            <View className="bg-red-50 p-4 rounded-full mb-4">
              <AlertCircle size={40} color="#ef4444" />
            </View>

            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-2xl text-slate-900 text-center"
            >
              End Visit?
            </Text>

            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-center mt-2 mb-8 text-base"
            >
              Are you sure you want to end this visit? Unsaved progress in
              modules may be lost.
            </Text>

            <View className="w-full">
              <TouchableOpacity
                onPress={handleLogout}
                className="bg-red-500 w-full py-4 rounded-2xl items-center mb-3"
              >
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-lg"
                >
                  Confirm & End
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowExitModal(false)}
                className="w-full py-4 rounded-2xl items-center"
              >
                <Text
                  style={{ fontFamily: "Outfit-SemiBold" }}
                  className="text-slate-500 text-lg"
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Main;
