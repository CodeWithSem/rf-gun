import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import bcrypt from "bcryptjs";
import { Eye, EyeOff, Lock, User, ShieldCheck } from "lucide-react-native";
import { firestore_db } from "../../assets/scripts/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const Login = ({ navigation, app_version }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMessage("Please enter both username and password");
      return;
    }
    setErrorMessage("");
    setLoading(true);
    try {
      const users_ref = collection(
        firestore_db,
        "DB1_ERP_SYSTEM",
        "TBL_AUTHENTICATION",
        "DATA",
      );
      const q = query(users_ref, where("username", "==", username));
      const query_snapshot = await getDocs(q);

      if (query_snapshot.empty) {
        setErrorMessage("User not found. Please try again.");
        return;
      }

      const user_doc = query_snapshot.docs[0];
      const user_data = user_doc.data();
      // const is_match = await bcrypt.compare(password, user_data.password);
      const is_match = password === user_data.username;

      if (!is_match) {
        setErrorMessage("Incorrect credentials. Please try again.");
        return;
      }
      navigation.replace("dashboard", { user: user_data });
    } catch (error) {
      setErrorMessage("Connection error. Check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-100">
      <StatusBar barStyle="dark-content" />

      {/* Ginagamit ang behavior 'padding' para sa iOS at 'height' o default sa Android */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          className="px-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View className="flex-row items-center justify-center mb-5 mt-20 px-2 mr-4">
            {/* Left: Icon/Logo */}
            <View className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
              <Image
                source={require("../../assets/images/delphys-sidebar-logo.png")}
                className="w-10 h-10"
                resizeMode="contain"
              />
            </View>

            {/* Right: Brand Texts */}
            <View className="ml-3">
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-3xl text-slate-800 leading-none"
              >
                Delphys<Text className="text-sky-600">7</Text>
              </Text>
              <Text
                style={{ fontFamily: "Outfit-Regular" }}
                className="text-slate-500 text-[11px] tracking-[2px] uppercase mt-1"
              >
                RF Gun System
              </Text>
            </View>
          </View>

          {/* Input Card Container */}
          <View className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-300 border border-white">
            <Text
              style={{ fontFamily: "Outfit-SemiBold" }}
              className="text-slate-800 text-lg mb-5"
            >
              Sign In
            </Text>

            {/* Username Box */}
            <View className="mb-4">
              <Text
                style={{ fontFamily: "Outfit-Medium" }}
                className="text-slate-600 mb-2 ml-1"
              >
                Username
              </Text>
              <View
                className={`flex-row items-center border-2 rounded-xl px-4 h-14 ${
                  isFocused === "user"
                    ? "border-sky-500 bg-sky-50/30"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <User
                  size={20}
                  color={isFocused === "user" ? "#0284c7" : "#94a3b8"}
                />
                <TextInput
                  placeholder="Enter username"
                  placeholderTextColor="#94a3b8"
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="flex-1 text-slate-900 ml-3 h-full"
                  value={username}
                  onFocus={() => setIsFocused("user")}
                  onBlur={() => setIsFocused(null)}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoComplete="off"
                />
              </View>
            </View>

            {/* Password Box */}
            <View className="mb-2">
              <Text
                style={{ fontFamily: "Outfit-Medium" }}
                className="text-slate-600 mb-2 ml-1"
              >
                Password
              </Text>
              <View
                className={`flex-row items-center border-2 rounded-xl px-4 h-14 ${
                  isFocused === "pass"
                    ? "border-sky-500 bg-sky-50/30"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <Lock
                  size={20}
                  color={isFocused === "pass" ? "#0284c7" : "#94a3b8"}
                />
                <TextInput
                  placeholder="Enter password"
                  placeholderTextColor="#94a3b8"
                  style={{ fontFamily: "Outfit-Regular" }}
                  className="flex-1 text-slate-900 ml-3 h-full"
                  value={password}
                  onFocus={() => setIsFocused("pass")}
                  onBlur={() => setIsFocused(null)}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="off"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="px-2"
                >
                  {showPassword ? (
                    <Eye size={22} color="#94a3b8" />
                  ) : (
                    <EyeOff size={22} color="#94a3b8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message Space */}
            <View className="h-5 mt-1">
              {errorMessage ? (
                <Text
                  style={{ fontFamily: "Outfit-Medium" }}
                  className="text-red-500 text-xs"
                >
                  {errorMessage}
                </Text>
              ) : null}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
              className={`mt-4 flex-row items-center justify-center h-16 rounded-xl ${
                loading ? "bg-sky-200" : "bg-sky-600"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text
                  style={{ fontFamily: "Outfit-Bold" }}
                  className="text-white text-lg tracking-[2px]"
                >
                  LOGIN
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Information */}
          <View className="mt-8 items-center">
            <View className="flex-row items-center bg-slate-200/50 px-4 py-1.5 rounded-full">
              <ShieldCheck size={12} color="#64748b" />
              <Text
                style={{ fontFamily: "Outfit-Medium" }}
                className="text-slate-500 text-[10px] ml-1.5"
              >
                Authorized Access Only {app_version}
              </Text>
            </View>
            <Text
              style={{ fontFamily: "Outfit-Regular" }}
              className="text-slate-400 text-[10px] mt-4"
            >
              Powered by QS IT Services
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Login;
