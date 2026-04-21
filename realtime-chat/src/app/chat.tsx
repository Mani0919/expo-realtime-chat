import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, router } from "expo-router";
import { useCallback, useState } from "react";
import {
    Text,
    View,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";

interface UserType {
    _id: string;
    name: string;
    phoneNumber: string;
}

export default function Chat() {
    const [currentUser, setCurrentUser] = useState<UserType | null>(null);
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            async function loadData() {
                try {
                    const storedUser = await AsyncStorage.getItem("user");
                    if (storedUser) {
                        const parsed = JSON.parse(storedUser);
                        setCurrentUser(parsed);
                        await fetchUsers(parsed._id);
                    }
                } catch (error) {
                    console.error("Error loading data:", error);
                } finally {
                    setLoading(false);
                }
            }
            loadData();
        }, [])
    );

    async function fetchUsers(currentUserId: string) {
        try {
            const res = await fetch(
                `${process.env.EXPO_PUBLIC_BASEURL}/chat/users?id=${currentUserId}`
            );
            const data = await res.json();
            if (data.users) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }

    // Create a unique room ID by sorting both user IDs
    function createRoomId(userId1: string, userId2: string) {
        return [userId1, userId2].sort().join("_");
    }

    function handleUserPress(otherUser: UserType) {
        if (!currentUser) return;

        const roomId = createRoomId(currentUser._id, otherUser._id);

        router.push({
            pathname: "/chatroom",
            params: {
                roomId,
                currentUserId: currentUser._id,
                currentUserName: currentUser.name,
                otherUserId: otherUser._id,
                otherUserName: otherUser.name,
            },
        });
    }

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6C63FF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chats</Text>
                <Text style={styles.headerSubtitle}>
                    Logged in as {currentUser?.name}
                </Text>
            </View>

            {/* User List */}
            {users.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>No other users found</Text>
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContainer}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.userCard}
                            onPress={() => handleUserPress(item)}
                            activeOpacity={0.7}
                        >
                            {/* Avatar */}
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {item.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>

                            {/* User Info */}
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{item.name}</Text>
                                <Text style={styles.userPhone}>
                                    {item.phoneNumber}
                                </Text>
                            </View>

                            {/* Arrow */}
                            <Text style={styles.arrow}>›</Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        backgroundColor: "#6C63FF",
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#fff",
    },
    headerSubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        marginTop: 4,
    },
    listContainer: {
        padding: 16,
    },
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#6C63FF",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
    },
    userInfo: {
        flex: 1,
        marginLeft: 14,
    },
    userName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1a1a2e",
    },
    userPhone: {
        fontSize: 13,
        color: "#888",
        marginTop: 2,
    },
    arrow: {
        fontSize: 24,
        color: "#ccc",
        fontWeight: "300",
    },
    emptyText: {
        fontSize: 16,
        color: "#888",
    },
});