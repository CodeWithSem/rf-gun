import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Camera as CameraIcon,
  RefreshCw,
  MapPin,
  AlertTriangle,
  Info,
} from "lucide-react-native";

const Capture_Store_Image = ({ route, navigation }) => {
  // Destructure with fallbacks to handle both MCP and Store Selection
  // mcp: from MCP List
  // store: from Store Selection List
  const {
    user,
    mcp,
    store,
    isDiversion,
    remarks,
    visitType = "mcp",
  } = route.params;

  // Consolidate the data so the UI only cares about "targetStore"
  const targetStore = mcp || store;
  const isUnplanned = visitType === "store_selection";

  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission || !permission.granted) {
      requestPermission();
    }
  }, []);

  if (!permission)
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );

  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      try {
        setIsCapturing(true);
        const options = { quality: 0.8, base64: false };
        const data = await cameraRef.current.takePictureAsync(options);
        setPhoto(data);
      } catch (e) {
        Alert.alert("Error", "Could not capture image.");
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const handleProceed = () => {
    navigation.reset({
      index: 2, // Focus on the 3rd item (Main)
      routes: [
        { name: "Login" }, // Index 0
        {
          name: "Dashboard",
          params: { user },
        }, // Index 1
        {
          name: "Main",
          params: {
            user,
            storeData: targetStore,
            imageUri: photo.uri,
            isDiversion,
            remarks,
            visitType,
          },
        }, // Index 2 (Active)
      ],
    });
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      {!photo ? (
        <View className="flex-1">
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            mode="picture"
          />

          <SafeAreaView className="flex-1 justify-between">
            {/* Top Bar Overlay */}
            <View className="flex-row items-center justify-between px-6 pt-4">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="bg-black/40 p-3 rounded-xl border border-white/20"
              >
                <ArrowLeft size={24} color="white" />
              </TouchableOpacity>

              <View className="bg-black/40 px-4 py-2 rounded-xl border border-white/20 items-end">
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-xs tracking-wider"
                >
                  {targetStore?.code}
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-white/70 text-[10px]"
                >
                  {targetStore?.description}
                </Text>
              </View>
            </View>

            {/* Status Badges */}
            <View className="items-center pb-12">
              {/* Case 1: Diversion (Planned but different day) */}
              {isDiversion && (
                <View className="bg-orange-500/90 flex-row items-center px-4 py-3 rounded-full mb-8 border border-white/20 shadow-lg">
                  <AlertTriangle size={14} color="white" />
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-white text-[10px] ml-2 mt-[1px] uppercase"
                  >
                    Diversion: {remarks}
                  </Text>
                </View>
              )}

              {/* Case 2: Unplanned (Ad-hoc Store Selection) */}
              {isUnplanned && (
                <View className="bg-sky-500/90 flex-row items-center px-4 py-3 rounded-full mb-8 border border-white/20 shadow-lg">
                  <Info size={14} color="white" />
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-white text-[10px] ml-2 mt-[1px] uppercase"
                  >
                    Unplanned Visit
                  </Text>
                </View>
              )}

              <View className="bg-white/10 p-2 rounded-full border border-white/20">
                <TouchableOpacity
                  onPress={takePicture}
                  disabled={isCapturing}
                  className="bg-white w-20 h-20 rounded-full items-center justify-center"
                >
                  {isCapturing ? (
                    <ActivityIndicator color="#0284c7" />
                  ) : (
                    <CameraIcon size={32} color="#0284c7" />
                  )}
                </TouchableOpacity>
              </View>
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white mt-4 text-[10px] tracking-[2px] uppercase opacity-80"
              >
                Capture Store Front
              </Text>
            </View>
          </SafeAreaView>
        </View>
      ) : (
        /* --- REVIEW MODE --- */
        <View className="flex-1">
          <Image source={{ uri: photo.uri }} className="flex-1" />

          <SafeAreaView className="absolute inset-0 justify-between">
            <View className="px-6 pt-4">
              <View className="bg-black/50 p-4 rounded-xl border border-white/10">
                <View className="flex-row items-center mb-1">
                  <MapPin size={12} color="#38bdf8" />
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-sky-400 text-[10px] ml-1 uppercase"
                  >
                    Visit Verification
                  </Text>
                </View>
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-lg leading-tight"
                >
                  {targetStore?.description}
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-white/60 text-xs mt-1"
                >
                  Store Code: {targetStore?.code}
                </Text>
                <Text
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="text-white/60 text-xs"
                >
                  {isUnplanned ? "Ad-hoc Selection" : `MCP Planned Visit`}
                </Text>
              </View>
            </View>

            <View className="p-8 bg-black/40">
              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={() => setPhoto(null)}
                  className="flex-1 bg-white/10 border border-white/20 py-4 rounded-xl flex-row items-center justify-center"
                >
                  <RefreshCw size={18} color="white" />
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-white ml-2"
                  >
                    Retake
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleProceed}
                  className="flex-1 grow-[2] bg-sky-600 py-4 rounded-xl flex-row items-center justify-center"
                >
                  <Text
                    style={{ fontFamily: "Outfit-Bold" }}
                    className="text-white ml-2"
                  >
                    Confirm Visit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
};

export default Capture_Store_Image;
