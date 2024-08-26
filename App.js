import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Button, Platform } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync(isFcm) {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  //if (Device.isDevice) {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    alert("Failed to get push token for push notification!");
    return;
  }
  try {
    if (isFcm) {
      token = (
        await Notifications.getDevicePushTokenAsync({
          projectId: "3e136aba-12fe-4987-9638-042689572bbd",
        })
      ).data;
    } else {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: "3e136aba-12fe-4987-9638-042689572bbd",
        })
      ).data;
    }
  } catch (e) {
    console.log(e);
    expoPushToken(e);
  }

  // } //else {
  //   alert("Must use physical device for Push Notifications");
  //}

  return token;
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [fcmToken, setFcmToken] = useState("");
  const [firebaseFcmToken, setFirebaseFcmToken] = useState("");

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync(true).then((token) => {
      setFcmToken(token);
      console.log(token);
    });

    registerForPushNotificationsAsync(false).then((token) => {
      setExpoPushToken(token);
      console.log(token);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setFirebaseFcmToken;
        notification.JSON;
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
        setFirebaseFcmToken(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  function sendPushNotificationHandler() {
    //send a notification to the device bu using the expo REST API
    console.log("sending push to id" + expoPushToken);
    fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: expoPushToken,
        title: "Standup Meeting Confirmed",
        body: "This is a reminder that our weekly is scheduled for tomorrow, 25, at 08:00. We will be meeting at Google meet, and our agenda includes:",
      }),
    });
  }

  return (
    <View style={styles.container}>
      <Text style={{ fontWeight: "bold" }}>Expo Token</Text>
      <Text style={{ margin: 16 }}>{expoPushToken}</Text>

      <Button
        title=" Send Push Notification"
        onPress={sendPushNotificationHandler}
      ></Button>

      <Text style={{ margin: 6 }}>
        (Sending a test push niotification by using the expo token)
      </Text>

      <Text style={{ margin: 16, fontWeight: "bold" }}>
        FCM/Device Token [Token used to send firebase push]
      </Text>
      <Text style={{ margin: 16 }}>{fcmToken}</Text>

      <Text>
        You can sent test fcm push message from firebase admin or directly
        calling the fcm rest api
      </Text>

      <Text style={{ margin: 16 }}>{firebaseFcmToken}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    fontSize: "bold",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
