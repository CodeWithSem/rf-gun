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
  FileText,
  ShieldCheck,
  Database,
} from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";
import { APP_VERSION } from "../../../constants/variable";

const LPN_Production = ({ navigation, route }) => {
  const { user_data } = route.params || {};
  const isFocused = useIsFocused();
  const dummyInputRef = useRef(null);
  const [is_alerting, set_is_alerting] = useState(false);

  // Auto-focus logic para sa hardware scanner interception
  useEffect(() => {
    let focusTimer;

    if (isFocused) {
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

  // Stray scan handler - kapag nag-scan si user nang walang pinipiling sub-module
  const handle_stray_scan = (text) => {
    if (!text || is_alerting) return;

    set_is_alerting(true);
    Vibration.vibrate(50);

    Alert.alert(
      "Invalid Action",
      "Please select a production menu before scanning.",
      [
        {
          text: "OK",
          onPress: () => {
            dummyInputRef.current?.clear();
            set_is_alerting(false);
            setTimeout(() => dummyInputRef.current?.focus(), 100);
          },
        },
      ],
    );
  };

  // Reusable Menu Button Component
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
          Finish Goods
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 pt-2">
        {/* Instruction Label */}
        <View className="px-8 mb-6">
          <Text
            style={{ fontFamily: "Outfit-Medium" }}
            className="text-slate-400 text-sm uppercase tracking-widest"
          >
            Select Production Task
          </Text>
        </View>

        {/* 1st Sub-module: LPN Generation */}
        <MenuButton
          title="FG Registration"
          description="Register finished goods output to a new LPN"
          icon={PlusCircle}
          colorClass="bg-emerald-500"
          onPress={() =>
            navigation.navigate("fg_registration", {
              user_data: user_data,
            })
          }
        />
        <MenuButton
          title="Registration Database"
          description="View FG Registration database"
          icon={Database}
          colorClass="bg-sky-500"
          onPress={() =>
            navigation.navigate("registration_database", {
              user_data: user_data,
            })
          }
        />

        {/* 2nd Sub-module: LPN Correction */}
        {/* <MenuButton
          title="LPN Correction"
          description="Modify or correct recently registered production LPN"
          icon={FileText}
          colorClass="bg-orange-500"
          onPress={() =>
            navigation.navigate("lpn_correction", {
              user_data: user_data,
            })
          }
        /> */}
      </ScrollView>

      {/* Footer / Guard Label */}
      <View className="py-6 items-center">
        <View className="flex-row items-center bg-slate-200/50 px-4 py-1.5 rounded-full">
          <ShieldCheck size={12} color="#64748b" />
          <Text
            style={{ fontFamily: "Outfit-Medium" }}
            className="text-slate-500 text-[10px] ml-1.5"
          >
            Production Floor Access Only {APP_VERSION}
          </Text>
        </View>
      </View>

      {/* Hidden input field for catching physical hardware scans */}
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

export default LPN_Production;
