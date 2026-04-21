import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Set notification handler
Notifications.setNotificationHandler({
    handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Function return type (string token)
export async function registerForPushNotificationsAsync(): Promise<string> {
    // Android channel setup
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }

    // Only real device
    // if (!Device.isDevice) {
    //     throw new Error("Must use physical device for push notifications");
    // }

    // Permissions
    const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

    let finalStatus: Notifications.PermissionStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        throw new Error(
            "Permission not granted to get push token for push notification!"
        );
    }

    // Project ID
    const projectId: string | undefined =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

    console.log("Project ID:", projectId);

    if (!projectId) {
        throw new Error("Project ID not found");
    }

    try {
        // Expo push token
        const expoPushToken = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        console.log("Expo Push Token:", expoPushToken.data);

        // Native device token (FCM/APNs)
        const devicePushToken = await Notifications.getDevicePushTokenAsync();

        console.log("Device Token:", devicePushToken.data);

        return expoPushToken.data as string;
    } catch (e: unknown) {
        console.log("Push error:", e);

        if (e instanceof Error) {
            throw new Error(e.message);
        } else {
            throw new Error("Unknown push notification error");
        }
    }
}