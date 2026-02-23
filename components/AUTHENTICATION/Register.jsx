import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal, // Added for success popup
} from "react-native";
import {
  ArrowLeft,
  User,
  Lock,
  UserCircle,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react-native"; // Added Eye/Check icons
import { db } from "../../assets/scripts/firebaseConfig";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

const Register = ({ navigation }) => {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Password visibility
  const [isFocused, setIsFocused] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Modal state

  const handleRegister = async () => {
    setErrorMessage("");

    if (!fullName || !username || !password) {
      setErrorMessage("Please fill in all fields to register");
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, "AUTHENTICATION", "TBL_USER", "DATA");
      const q = query(usersRef, where("username", "==", username.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setErrorMessage("Username is already taken");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "AUTHENTICATION", "TBL_USER", "DATA"), {
        fullName: fullName.trim(),
        username: username.trim(),
        password: password,
        role: "merchandiser",
        createdAt: new Date().toISOString(),
      });

      // Show success modal instead of immediate navigation
      setShowSuccessModal(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("Could not connect to database");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-8">
        {/* Back Button */}
        {/* Header Section: Back Button and Title in one row */}
        <View className="mt-20 mb-2 flex-row items-center">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-12 h-12 items-center justify-center rounded-xl bg-sky-50 mr-4"
          >
            <ArrowLeft size={24} color="#0284c7" />
          </TouchableOpacity>

          {/* Title Text */}
          <View className="flex-1">
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-3xl text-slate-900 tracking-tight"
            >
              Create Account
            </Text>
          </View>
        </View>

        {/* Subtitle remains below */}
        <View className="mb-8">
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-lg text-slate-500"
          >
            Join the{" "}
            <Text className="text-sky-600 font-semibold">
              Delphys7 Merch App
            </Text>
          </Text>
        </View>

        <View className="space-y-4">
          {/* Full Name */}
          <View>
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className={`mb-2 ml-1 ${isFocused === "name" ? "text-sky-600" : "text-slate-600"}`}
            >
              Full Name
            </Text>
            <View
              className={`flex-row items-center bg-slate-50 border rounded-2xl px-4 py-4 ${isFocused === "name" ? "border-sky-500 bg-white" : "border-slate-100"}`}
            >
              <User
                size={20}
                color={isFocused === "name" ? "#0284c7" : "#94a3b8"}
              />
              <TextInput
                placeholder="Juan Dela Cruz"
                style={{ fontFamily: "Outfit-Regular" }}
                className="flex-1 text-slate-900 ml-3"
                onFocus={() => setIsFocused("name")}
                onBlur={() => setIsFocused(null)}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* Username */}
          <View className="mt-4">
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className={`mb-2 ml-1 ${isFocused === "user" ? "text-sky-600" : "text-slate-600"}`}
            >
              Username
            </Text>
            <View
              className={`flex-row items-center bg-slate-50 border rounded-2xl px-4 py-4 ${isFocused === "user" ? "border-sky-500 bg-white" : "border-slate-100"}`}
            >
              <UserCircle
                size={20}
                color={isFocused === "user" ? "#0284c7" : "#94a3b8"}
              />
              <TextInput
                placeholder="Choose a username"
                autoCapitalize="none"
                style={{ fontFamily: "Outfit-Regular" }}
                className="flex-1 text-slate-900 ml-3"
                onFocus={() => setIsFocused("user")}
                onBlur={() => setIsFocused(null)}
                onChangeText={setUsername}
              />
            </View>
          </View>

          {/* Password with Eye Toggle */}
          <View className="mt-4">
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className={`mb-2 ml-1 ${isFocused === "pass" ? "text-sky-600" : "text-slate-600"}`}
            >
              Password
            </Text>
            <View
              className={`flex-row items-center bg-slate-50 border rounded-2xl px-4 py-4 ${isFocused === "pass" ? "border-sky-500 bg-white" : "border-slate-100"}`}
            >
              <Lock
                size={20}
                color={isFocused === "pass" ? "#0284c7" : "#94a3b8"}
              />
              <TextInput
                placeholder="Create password"
                secureTextEntry={!showPassword}
                style={{ fontFamily: "Outfit-Regular" }}
                className="flex-1 text-slate-900 ml-3"
                onFocus={() => setIsFocused("pass")}
                onBlur={() => setIsFocused(null)}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="mr-2"
              >
                {showPassword ? (
                  <Eye size={20} color="#94a3b8" />
                ) : (
                  <EyeOff size={20} color="#94a3b8" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {errorMessage ? (
            <View className="mt-2 ml-1 flex-row items-center">
              <Text
                style={{ fontFamily: "Outfit-Medium" }}
                className="text-red-500 text-sm"
              >
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className={`mt-10 bg-sky-600 flex-row items-center justify-center py-5 rounded-2xl ${loading ? "bg-sky-400" : "bg-sky-600"}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white text-lg mr-2 tracking-[2px]"
              >
                REGISTER
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View className="flex-1 bg-slate-900/50 justify-center items-center px-8">
          <View className="bg-white w-full rounded-3xl p-8 items-center">
            <View className="bg-sky-100 p-4 rounded-full mb-4">
              <CheckCircle2 size={50} color="#0284c7" />
            </View>
            <Text
              style={{ fontFamily: "Outfit-Bold" }}
              className="text-2xl text-slate-900 text-center"
            >
              Registration Successful!
            </Text>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-500 text-center mt-2 mb-8"
            >
              Your account has been created. You can now sign in to your
              dashboard.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate("Login");
              }}
              className="bg-sky-600 w-full py-4 rounded-2xl items-center"
            >
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white text-lg"
              >
                Continue to Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default Register;
