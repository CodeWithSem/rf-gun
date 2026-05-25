import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Vibration,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Barcode, PlusCircle } from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";

// ASSETS & CONFIG
import { firestore_db } from "@assets/scripts/firebase";
import { doc, getDoc } from "firebase/firestore";

const LPN_Register = ({ navigation, route }) => {
  const { user_data } = route.params || {};
  const scanner_input_ref = useRef(null);
  const isFocused = useIsFocused(); // tinitiyak na active lang ang focus kung nandito sa screen na to

  const [loading, set_loading] = useState(false);

  // AUTO-FOCUS PARA SA EXTERNAL SCANNER (MAY TIMEOUT DELAY UPANG MAKA-IWAN SA GBOARD CRASH)
  useEffect(() => {
    let focus_interval = null;
    let delay_timeout = null;

    if (isFocused) {
      // Bibigyan muna natin ng 300ms na hininga ang Android para tuluyang maisara
      // ang soft keyboard mula sa nakaraang screen bago natin puwersahin ang focus.
      delay_timeout = setTimeout(() => {
        scanner_input_ref.current?.focus();

        // Pagkatapos ng delay, doon lang natin uumpisahan ang 1-second loop
        focus_interval = setInterval(() => {
          scanner_input_ref.current?.focus();
        }, 1000);
      }, 300); // 300ms transition buffer
    }

    return () => {
      if (delay_timeout) clearTimeout(delay_timeout);
      if (focus_interval) clearInterval(focus_interval);
    };
  }, [isFocused]);

  const handle_qr_scan = async (qr_text) => {
    if (!qr_text) return;

    const clean_id = qr_text.trim();

    // VALIDATION: Check if length is at least 14 chars AND contains a dash
    if (clean_id.length < 14 || !clean_id.includes("-")) {
      Vibration.vibrate([100, 50, 100]); // Error vibration pattern

      let error_message = "The LPN ID must be at least 14 characters long.";
      if (!clean_id.includes("-")) {
        error_message = "Invalid format: LPN ID must contain a dash.";
      }

      Alert.alert("Invalid LPN", error_message);
      return;
    }

    Vibration.vibrate(50);
    set_loading(true);

    try {
      // VERIFY IF LPN ALREADY EXISTS IN FIRESTORE
      const doc_ref = doc(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_INVENTORY_COUNT",
        "DATA",
        clean_id,
      );
      const doc_snap = await getDoc(doc_ref);

      if (doc_snap.exists()) {
        Vibration.vibrate([100, 50, 100]);
        Alert.alert(
          "Already Registered",
          `LPN ID: ${clean_id} is already registered in the system.`,
        );
      } else {
        // KUNG WALA PA, LIPAT SA BAGONG STACK SCREEN
        navigation.navigate("lpn_register_input", {
          current_lpn_id: clean_id,
          user_data: user_data,
        });
      }
    } catch (error) {
      console.error("Firestore Check Error: ", error);
      Alert.alert("Error", "Failed to verify LPN existence. Please try again.");
    } finally {
      set_loading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {loading && (
        <View className="absolute inset-0 z-50 bg-white/60 justify-center items-center">
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      )}

      {/* INVISIBLE TEXT INPUT FOR RF GUN */}
      <TextInput
        ref={scanner_input_ref}
        showSoftInputOnFocus={false}
        style={{ opacity: 0, height: 0, position: "absolute" }}
        onSubmitEditing={(e) => {
          const code = e.nativeEvent.text;
          if (code) {
            handle_qr_scan(code);
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
            Register New LPN
          </Text>
          <Text className="text-slate-500 text-xs">
            Ready to capture QR code data
          </Text>
        </View>
        <PlusCircle size={24} color="#10b981" />
      </View>

      {/* MAIN VIEW */}
      <View className="flex-1 justify-center items-center px-10 bg-slate-50">
        <View className="bg-emerald-100 border-2 border-emerald-500 p-10 rounded-full shadow-sm mb-6">
          <Barcode size={100} color="#10b981" />
        </View>
        <Text
          style={{ fontFamily: "Outfit-Bold" }}
          className="text-2xl text-slate-900"
        >
          READY TO SCAN
        </Text>
        <Text
          style={{ fontFamily: "Outfit-Regular" }}
          className="text-slate-500 text-center mt-2 leading-5"
        >
          Please point your handheld scanner at the LPN QR code to proceed.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default LPN_Register;
