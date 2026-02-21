import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Custom_Text from "@assets/elements/text/Custom_Text";
import { Eye, EyeOff } from "lucide-react-native";
import Delphys_Logo from "@assets/images/delphys-sidebar-logo.png";

const Login = ({ app_version }) => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handle_login = () => {
    navigation.navigate("Welcome");
  };

  return (
    <React.Fragment>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        // behavior="padding"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        {/* Full Page Container */}
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 30,
            backgroundColor: "#f3f4f6",
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card Container */}
          <View className="w-full bg-white rounded-2xl py-6 px-8 shadow-lg shadow-gray-400 dark:bg-gray-200">
            <View className="flex justify-center items-center w-full py-5">
              <View className="h-[120] w-[120] bg-sky-100/50 rounded-lg overflow-hidden">
                <Image
                  source={Delphys_Logo} // online image
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover" // can also use 'contain' or 'stretch'
                />
              </View>
            </View>
            {/* App Title */}
            <Custom_Text className="text-2xl font-bold text-sky-600 mb-8 text-center mt-5">
              MERCH APP SOLUTION
            </Custom_Text>

            {/* Email Input */}
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Username"
              placeholderTextColor="#9ca3af"
              className="w-full border border-gray-300 rounded-lg p-4 mb-4 text-base"
              style={{ fontFamily: "Outfit-Regular" }}
            />

            {/* Password Input */}
            {/* Password Input with visibility toggle */}
            <View className="w-full relative">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry={!showPassword}
                placeholderTextColor="#9ca3af"
                className="w-full border border-gray-300 rounded-lg p-4 text-base pr-12"
                style={{ fontFamily: "Outfit-Regular" }}
              />
              <TouchableOpacity
                className="absolute right-4 top-1/2 -translate-y-1/2"
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <Eye color="#9ca3af" size={20} />
                ) : (
                  <EyeOff color="#9ca3af" size={20} />
                )}
              </TouchableOpacity>
            </View>
            <View className="flex justify-end h-[24]">
              {/* <Custom_Text className="text-red-500 text-sm">
                Invalid credentials. Please try again.
              </Custom_Text> */}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              className="w-full bg-sky-600 py-4 rounded-lg active:bg-sky-700 mt-[40] mb-[10]"
              onPress={handle_login}
            >
              <Custom_Text className="text-white text-center text-base font-bold tracking-[2px]">
                LOGIN
              </Custom_Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View className="absolute bottom-[5] left-[5]">
        <Custom_Text className="text-gray-300 text-xs">
          {app_version}
        </Custom_Text>
      </View>
    </React.Fragment>
  );
};

export default Login;
