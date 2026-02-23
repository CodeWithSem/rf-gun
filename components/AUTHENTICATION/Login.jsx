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
  Alert,
  ActivityIndicator,
} from "react-native";
import { Eye, EyeOff, Lock, ChevronRight, User } from "lucide-react-native";
// Firebase Imports
import { db } from "../../assets/scripts/firebaseConfig";
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

    setErrorMessage(""); // Clear error on new attempt
    setLoading(true);
    try {
      // Query Firestore for a user with matching username
      const usersRef = collection(db, "AUTHENTICATION", "TBL_USER", "DATA");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErrorMessage("User not found. Please try again.");
      } else {
        const userData = querySnapshot.docs[0].data();
        // Plain text check (Note: For production, use hashed passwords!)
        if (userData.password === password) {
          setErrorMessage("");
          navigation.navigate("Dashboard", { user: userData }); // use replace so they can't go back to login
        } else {
          setErrorMessage("Incorrect credentials. Please try again.");
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong connectng to the database");
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
        {/* Header Section */}
        <View className="mt-28 mb-12">
          <View className="bg-sky-100 w-16 h-16 rounded-xl items-center justify-center mb-6">
            <Image
              source={require("../../assets/images/delphys-sidebar-logo.png")}
              className="w-10 h-10"
              resizeMode="contain"
            />
          </View>
          <Text
            style={{ fontFamily: "Outfit-Bold" }}
            className="text-4xl text-slate-600 tracking-tight"
          >
            Welcome
          </Text>
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-lg text-slate-500 mt-2"
          >
            Enter your credentials for{" "}
            <Text className="text-sky-600 font-semibold">
              Delphys7 Merch App
            </Text>
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-5">
          <View>
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className={`mb-2 ml-1 ${isFocused === "user" ? "text-sky-600" : "text-slate-600"}`}
            >
              Username
            </Text>
            <View
              className={`flex-row items-center bg-slate-50 border rounded-xl px-5 py-4 ${isFocused === "user" ? "border-sky-500 bg-white" : "border-slate-200"}`}
            >
              <User
                size={20}
                color={isFocused === "user" ? "#0284c7" : "#94a3b8"}
              />
              <TextInput
                placeholder="Enter username"
                style={{ fontFamily: "Outfit-Regular" }}
                className="flex-1 text-slate-900 ml-3"
                value={username}
                onFocus={() => setIsFocused("user")}
                onBlur={() => setIsFocused(null)}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View className="mt-4">
            <Text
              style={{ fontFamily: "Outfit-Medium" }}
              className={`mb-2 ml-1 ${isFocused === "pass" ? "text-sky-600" : "text-slate-600"}`}
            >
              Password
            </Text>
            <View
              className={`flex-row items-center bg-slate-50 border rounded-xl px-5 py-4 ${isFocused === "pass" ? "border-sky-500 bg-white" : "border-slate-200"}`}
            >
              <Lock
                size={20}
                color={isFocused === "pass" ? "#0284c7" : "#94a3b8"}
              />
              <TextInput
                placeholder="Enter password"
                style={{ fontFamily: "Outfit-Regular" }}
                className="flex-1 text-slate-900 ml-3"
                value={password}
                onFocus={() => setIsFocused("pass")}
                onBlur={() => setIsFocused(null)}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
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
          {/* Error Message Display */}
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
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
            className={`mt-10 flex-row items-center justify-center py-5 rounded-xl bg-sky-600`}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text
                style={{ fontFamily: "Outfit-Bold" }}
                className="text-white text-lg mr-2 tracking-[2px]"
              >
                LOGIN
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Registration Section */}
        <View className="mt-auto mb-10 items-center">
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-400 text-xs uppercase tracking-widest"
          >
            System Version {app_version}
          </Text>
          {/* <TouchableOpacity
            onPress={() => navigation.navigate("Register")} // This does the redirect
            className="mt-3 py-2 px-6 border border-sky-100 bg-sky-50 rounded-full"
          >
            <Text
              style={{ fontFamily: "Outfit-SemiBold" }}
              className="text-sky-600 text-sm"
            >
              Don't have an account?{" "}
              <Text className="font-bold underline">Register</Text>
            </Text>
          </TouchableOpacity> */}
          <Text
            style={{ fontFamily: "Outfit-Regular" }}
            className="text-slate-400 text-xs mt-2"
          >
            Powered by QS IT Services
            {/* System Version {app_version} */}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;
