import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Vibration,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  PlusCircle,
  Search,
  RefreshCw,
  PackageMinus,
  ShieldCheck,
  FileText,
} from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";
import { APP_VERSION } from "../../../constants/variable";

const Mach_Management = ({ navigation, route }) => {
  const { user_data } = route.params || {};
  const isFocused = useIsFocused();
  const dummyInputRef = useRef(null);

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
          Machine Management
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
        <MenuButton
          title="Downtime Report"
          description="Production machine downtime report"
          icon={FileText}
          colorClass="bg-red-500"
          onPress={() =>
            navigation.navigate("downtime_report", {
              user_data: user_data,
            })
          }
        />
      </ScrollView>
      {/* Footer / Version Info (Optional) */}
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
      <TextInput
        ref={dummyInputRef}
        showSoftInputOnFocus={false}
        style={{ opacity: 0, height: 0, position: "absolute" }}
        value=""
        // Sa halip na onChangeText, dito natin ilalagay:
        onSubmitEditing={(e) => {
          handle_stray_scan(e.nativeEvent.text);
        }}
        blurOnSubmit={false}
      />
    </SafeAreaView>
  );
};

export default Mach_Management;
