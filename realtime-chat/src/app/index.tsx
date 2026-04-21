import { useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import { registerForPushNotificationsAsync } from "../utlis/registerpushnotifications";
export default function Index() {

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [expoPushToken, setExpoPushToken] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fun() {
      const token = await registerForPushNotificationsAsync();
      console.log(token);
      setExpoPushToken(token);
    }
    fun();
  }, [])

  useEffect(() => {
    async function fun() {
      const user = await AsyncStorage.getItem("user");
      if (user) {
        router.push("/chat");
      }
    }
    fun()
  }, [])
  async function handleLogin() {
    console.log("pressed")
    setLoading(true);
    const response = await fetch(`${process.env.EXPO_PUBLIC_BASEURL}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, phoneNumber, expoPushToken }),
    });

    const data = await response.json();
    console.log(data);

    if (data.user) {
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      router.push("/chat");
      setLoading(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 10
      }}
    >
      <Text className="text-lg font-bold text-center">Welcome..</Text>
      <View className="mt-4">
        <TextInput className="border border-gray-300 rounded-md p-2 py-5" placeholder="Enter your name" value={name} onChangeText={setName} />

        <TextInput className="border border-gray-300 rounded-md p-2 py-5 my-3" maxLength={10} placeholder="Enter your phone number" value={phoneNumber} onChangeText={setPhoneNumber} />

        <Button title={loading ? "Loading..." : "Login"} color="#000" onPress={handleLogin} disabled={loading} />
      </View>
    </View>
  );
}


