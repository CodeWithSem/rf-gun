import React, { useRef, useState, useEffect } from "react";
import Custom_Text from "@assets/elements/text/Custom_Text";
import {
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Linking from "expo-linking";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { Camera, SwitchCamera } from "lucide-react-native";

const Camera_Overlay = ({ selected_store_data, set_captured_store_image }) => {
  const navigation = useNavigation();

  const cameraRef = useRef(null);
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [btn_camera_disable, set_btn_camera_disable] = useState(false);

  const handle_go_back = () => navigation.goBack();

  // Get screen width for dynamic square box
  const screenWidth = Dimensions.get("window").width;
  const boxWidth = screenWidth - 40;

  // ✅ Handle Proceed button correctly
  const handleProceed = async () => {
    if (!permission) return;

    if (permission.canAskAgain) {
      await requestPermission();
    } else {
      await Linking.openSettings();
    }
  };

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  const takePicture = async () => {
    set_btn_camera_disable(true);
    if (!cameraRef.current) {
      console.log("Camera ref is null");
      set_btn_camera_disable(false);
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        androidCaptureSound: false,
      });
      if (!photo?.uri) {
        console.log("Failed to take picture");
        return;
      }

      // Optional
      // const resizedImage = await ImageManipulator.manipulateAsync(
      //   photo.uri,
      //   [{ resize: { width: 1000, height: 1000 } }],
      //   { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      // );

      // const fileInfo = await FileSystem.getInfoAsync(resizedImage.uri);
      // if (fileInfo.exists && !fileInfo.isDirectory) {
      //   const fileSizeInMB = fileInfo.size / (1024 * 1024);
      //   console.log("Resized image URI:", resizedImage.uri);
      //   console.log("File size (MB):", fileSizeInMB);
      // } else {
      //   console.error("Resized image file does not exist or is a directory");
      // }

      set_captured_store_image(photo.uri);
      // set_captured_store_image(resizedImage.uri);
      handle_go_back();
    } catch (error) {
      console.error("Error taking picture:", error);
    } finally {
      set_btn_camera_disable(false);
    }
  };

  // ✅ Loading state – permission object not ready yet
  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Custom_Text className="text-gray-500">
          Loading camera permissions...
        </Custom_Text>
      </View>
    );
  }

  // ✅ Permission not granted UI
  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-10">
        <View className="mb-4">
          <Camera color={"#0284C7"} size={60} />
        </View>
        <View>
          <Custom_Text className="text-gray-700 text-base mb-4">
            {permission.canAskAgain
              ? "To proceed, the app needs access to your camera."
              : "Camera permission was denied. Please enable it in your device Settings."}
          </Custom_Text>
        </View>
        <View className="flex flex-row gap-2 mt-4">
          <TouchableOpacity
            className="flex-1 bg-sky-600 rounded-md px-4 py-3"
            onPress={handleProceed}
          >
            <Custom_Text className="text-white text-center text-base">
              {permission.canAskAgain ? "Grant Access" : "Open Settings"}
            </Custom_Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-white border border-gray-400 rounded-md px-4 py-3"
            onPress={handle_go_back}
          >
            <Custom_Text className="text-gray-700 text-center text-base">
              Close
            </Custom_Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ✅ Camera UI when permission IS granted
  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="w-full pt-[60] pb-5 justify-center items-center bg-sky-600">
        <Custom_Text className="text-white text-xl tracking-[1]" weight="bold">
          Capture Image
        </Custom_Text>
      </View>

      <View className="flex-1 px-5 bg-gray-100">
        <View className="items-center my-[20]">
          <View
            className="p-2 border border-sky-600 rounded-lg justify-center items-center"
            style={{ width: boxWidth, height: boxWidth }}
          >
            <CameraView
              style={{
                width: boxWidth - 8,
                height: boxWidth - 8,
                borderRadius: 5,
              }}
              facing={facing}
              ref={cameraRef}
            />
          </View>
        </View>
        <View className="flex-row items-center justify-between px-10 my-6">
          {/* Spacer (keeps capture button centered) */}
          <View className="w-[55]" />
          {/* Rotate Camera Button */}

          {/* Capture Button (CIRCLE) */}
          <TouchableOpacity
            onPress={takePicture}
            disabled={btn_camera_disable}
            activeOpacity={0.8}
            className="w-[80] h-[80] rounded-full border-4 border-sky-600 justify-center items-center"
          >
            {btn_camera_disable ? (
              <ActivityIndicator size="large" />
            ) : (
              <View className="w-[60] h-[60] rounded-full bg-sky-600" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleCameraFacing}
            activeOpacity={0.7}
            className="w-[55] h-[55] rounded-full bg-gray-700 justify-center items-center"
          >
            <SwitchCamera color="white" size={26} />
          </TouchableOpacity>
        </View>
      </View>

      {/* CANCEL BUTTON */}
      <View className="w-full p-5 bg-white border-t border-gray-200">
        <TouchableOpacity
          className="w-full h-[50] bg-white border border-gray-400 justify-center items-center rounded-lg"
          activeOpacity={0.8}
          onPress={handle_go_back}
        >
          <Custom_Text className="text-gray-500 text-center text-base tracking-[0.4]">
            Cancel
          </Custom_Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Camera_Overlay;
