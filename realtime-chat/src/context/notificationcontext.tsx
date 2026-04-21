import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { Platform } from "react-native";


// ✅ Define Context Type
type NotificationContextType = {
    notification: number;
    index: string;
    HandleIndex: () => Promise<void>;
    Notify: () => Promise<void>;
};

// ✅ Create Context
const NotificationContext = createContext<NotificationContextType | undefined>(
    undefined
);

// ✅ Custom Hook
export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error(
            "useNotification must be used within a NotificationProvider"
        );
    }
    return context;
};

// ✅ Props Type
type NotificationProviderProps = {
    children: ReactNode;
};

// ✅ Provider
export const NotificationProvider = ({
    children,
}: NotificationProviderProps) => {
    const [notification, setNotification] = useState<number>(0);
    const [index, setIndex] = useState<string>("");
    const [badgeCount, setBadgeCount] = useState<number>(0);

    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    useEffect(() => {
        // 📩 When notification received
        notificationListener.current =
            Notifications.addNotificationReceivedListener((notification) => {
                console.log("Notification Received:", notification);

                setBadgeCount((prev) => {
                    const updated = prev + 1;
                    Notifications.setBadgeCountAsync(updated);
                    return updated;
                });
            });

        // 👆 When user taps notification
        responseListener.current =
            Notifications.addNotificationResponseReceivedListener(
                async (response) => {
                    const data = response?.notification?.request?.content?.data;

                    console.log("🔔 Click Data:", data);

                    if (!data?.roomId) return;

                    router.push({
                        pathname: "/chatroom",
                        params: {
                            roomId: data.roomId,

                            // current user (receiver)
                            currentUserId: data.userId,
                            currentUserName: data.userName,

                            // other user (sender)
                            otherUserId: data.senderId,
                            otherUserName: data.senderName,
                        },
                    });
                }
            );

        // 🧹 Cleanup
        return () => {
            if (notificationListener.current) {
                notificationListener.current?.remove();

            }
            if (responseListener.current) {
                responseListener.current?.remove();
            }
        };
    }, []);

    // 🔄 Reset everything
    const HandleIndex = async (): Promise<void> => {
        setIndex("");
        setBadgeCount(0);
        setNotification(0);
        await Notifications.setBadgeCountAsync(0);
    };

    // 🔔 Increment notification count
    const Notify = async (): Promise<void> => {
        setNotification((prev) => prev + 1);
    };

    return (
        <NotificationContext.Provider
            value={{ notification, index, HandleIndex, Notify }}
        >
            {children}
        </NotificationContext.Provider>
    );
};