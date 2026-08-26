import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Vibration,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  PlusCircle,
  Search,
  RefreshCw,
  PackageMinus,
  ShieldCheck,
  SquareArrowUp,
  SquareArrowDown,
  Truck,
  X,
  SquareArrowRight,
  SquareArrowLeft,
  FileText,
} from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";
import { APP_VERSION } from "../../../constants/variable";

const Transfer_Order = ({ navigation, route }) => {
  const { user_data } = route.params || {};
  const isFocused = useIsFocused();
  const dummyInputRef = useRef(null);

  // State para sa Modal ng Stock Transport
  const [is_transport_modal_visible, set_is_transport_modal_visible] =
    useState(false);

  useEffect(() => {
    let focusTimer;

    if (isFocused) {
      // Nilalagyan ng maikling delay para siguradong tapos na ang screen transition
      focusTimer = setTimeout(() => {
        dummyInputRef.current?.focus();
      }, 300);
    } else {
      dummyInputRef.current?.blur();
    }

    return () => {
      if (focusTimer) clearTimeout(focusTimer);
    };
  }, [isFocused]);

  // Helper component para sa mga Buttons/Cards
  const MenuButton = ({
    title,
    description,
    icon: Icon,
    onPress,
    colorClass,
  }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="bg-white mx-6 mb-4 p-5 rounded-3xl border border-slate-200 flex-row items-center"
    >
      <View className={`p-4 rounded-2xl ${colorClass} mr-4`}>
        <Icon size={28} color="white" />
      </View>
      <View className="flex-1">
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-slate-900 text-lg"
        >
          {title}
        </Text>
        <Text
          style={{ fontFamily: "Outfit-Regular" }}
          className="text-slate-500 text-xs"
        >
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const [is_alerting, set_is_alerting] = useState(false);

  const handle_stray_scan = (text) => {
    // Kung wala pang text o may alert na nakabukas, huwag gawin ang logic
    if (!text || is_alerting) return;

    // I-set ang flag na "may alert na"
    set_is_alerting(true);
    Vibration.vibrate(50);

    Alert.alert("Invalid Action", "Please select a menu before scanning.", [
      {
        text: "OK",
        onPress: () => {
          dummyInputRef.current?.clear();
          // I-reset ang flag pagkapindot ng OK
          set_is_alerting(false);
          // I-focus ulit para sa susunod na scan
          setTimeout(() => dummyInputRef.current?.focus(), 100);
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-white border-b border-slate-100 mb-6">
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
          Transfer Order
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pt-2">
        {/* Instruction Text */}
        <View className="px-8 mb-6">
          <Text
            style={{ fontFamily: "Outfit-Medium" }}
            className="text-slate-400 text-sm uppercase tracking-widest"
          >
            Select Action
          </Text>
        </View>

        {/* 1st Button: Production Supply */}
        <MenuButton
          title="Production Supply"
          description="Picking Process for Transfer Order"
          icon={SquareArrowUp}
          colorClass="bg-sky-600"
          onPress={() =>
            navigation.navigate("production_supply", {
              user_data: user_data,
            })
          }
        />

        {/* 2nd Button: Stock Transport */}
        <MenuButton
          title="Stock Transport"
          description="Material transport Process"
          icon={Truck}
          colorClass="bg-sky-600"
          onPress={() => set_is_transport_modal_visible(true)}
        />

        {/* 3rd Button: View Report */}
        <MenuButton
          title="View Report"
          description="View transfer order report"
          icon={FileText}
          colorClass="bg-sky-600"
          onPress={() =>
            navigation.navigate("view_to_report", {
              user_data: user_data,
            })
          }
        />
      </ScrollView>

      {/* Footer / Version Info */}
      <View className="py-6 items-center">
        <View className="flex-row items-center bg-slate-200/50 px-4 py-1.5 rounded-full">
          <ShieldCheck size={12} color="#64748b" />
          <Text
            style={{ fontFamily: "Outfit-Medium" }}
            className="text-slate-500 text-[10px] ml-1.5"
          >
            Authorized Access Only {APP_VERSION}
          </Text>
        </View>
      </View>

      {/* Modal para sa Stock Transport Options */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={is_transport_modal_visible}
        onRequestClose={() => set_is_transport_modal_visible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center sm:justify-center items-center p-4">
          <View className="bg-white w-full rounded-3xl p-6 border border-slate-100">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-xl text-slate-900"
              >
                Stock Transport
              </Text>
              <TouchableOpacity
                onPress={() => set_is_transport_modal_visible(false)}
                className="p-1"
              >
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Option 1: Transfer Material */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                set_is_transport_modal_visible(false);
                navigation.navigate("stock_transport", {
                  user_data: user_data,
                });
              }}
              className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex-row items-center mb-3 active:bg-slate-100"
            >
              <View className="p-3 rounded-xl bg-sky-600 mr-4">
                <SquareArrowRight size={22} color="white" />
              </View>
              <View className="flex-1">
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-900 text-base"
                >
                  Transfer Material
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-slate-500 text-xs"
                >
                  Stock transport creation
                </Text>
              </View>
            </TouchableOpacity>

            {/* Option 2: Receive Material */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                set_is_transport_modal_visible(false);
                navigation.navigate("receive_sto", {
                  user_data: user_data,
                });
              }}
              className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex-row items-center active:bg-slate-100"
            >
              <View className="p-3 rounded-xl bg-emerald-600 mr-4">
                <SquareArrowLeft size={22} color="white" />
              </View>
              <View className="flex-1">
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-slate-900 text-base"
                >
                  Receive Material
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-slate-500 text-xs"
                >
                  Receive incoming material
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TextInput
        ref={dummyInputRef}
        showSoftInputOnFocus={false}
        style={{ opacity: 0, height: 0, position: "absolute" }}
        value=""
        onSubmitEditing={(e) => {
          handle_stray_scan(e.nativeEvent.text);
        }}
        blurOnSubmit={false}
      />
    </SafeAreaView>
  );
};

export default Transfer_Order;
