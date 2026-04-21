import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Text,
    View,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from "react-native";
import { io, Socket } from "socket.io-client";
import Feather from '@expo/vector-icons/Feather';

interface MessageType {
    _id: string;
    roomId: string;
    senderId: string;
    receiverId: string;
    text: string;
    createdAt: string;
}

const SOCKET_URL = process.env.EXPO_PUBLIC_BASEURL || "http://localhost:3000";

export default function ChatRoom() {
    const { roomId, currentUserId, currentUserName, otherUserId, otherUserName } =
        useLocalSearchParams<{
            roomId: string;
            currentUserId: string;
            currentUserName: string;
            otherUserId: string;
            otherUserName: string;
        }>();

    const [messages, setMessages] = useState<MessageType[]>([]);
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Connect socket + join room
    useEffect(() => {
        const socket = io(SOCKET_URL, {
            transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("✅ Socket connected:", socket.id);
            socket.emit("joinRoom", roomId);
            socket.emit("inChat", { roomId, userId: currentUserId });
        });

        // Listen for new messages
        socket.on("receiveMessage", (message: MessageType) => {
            setMessages((prev) => [...prev, message]);
        });

        // Typing indicators
        socket.on("userTyping", () => {
            setIsTyping(true);
        });

        socket.on("userStopTyping", () => {
            setIsTyping(false);
        });

        // Fetch existing messages
        fetchMessages();

        return () => {
            socket.emit("leaveChat", { roomId, userId: currentUserId });
            socket.disconnect();
        };
    }, [roomId]);

    async function fetchMessages() {
        try {
            const res = await fetch(
                `${SOCKET_URL}/chat/messages?roomId=${roomId}`
            );
            const data = await res.json();
            if (data.messages) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    }

    function handleSend() {
        if (!inputText.trim() || !socketRef.current) return;

        socketRef.current.emit("sendMessage", {
            roomId,
            senderId: currentUserId,
            receiverId: otherUserId,
            text: inputText.trim(),
        });

        // Stop typing
        socketRef.current.emit("stopTyping", { roomId, userId: currentUserId });

        setInputText("");
    }

    function handleTyping(text: string) {
        setInputText(text);

        if (!socketRef.current) return;

        socketRef.current.emit("typing", { roomId, userId: currentUserId });

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 1.5s of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current?.emit("stopTyping", {
                roomId,
                userId: currentUserId,
            });
        }, 1500);
    }

    function formatTime(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    const renderMessage = useCallback(
        ({ item }: { item: MessageType }) => {
            const isMe = item.senderId === currentUserId;

            return (
                <View
                    style={[
                        styles.messageBubble,
                        isMe ? styles.myMessage : styles.otherMessage,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            isMe ? styles.myMessageText : styles.otherMessageText,
                        ]}
                    >
                        {item.text}
                    </Text>
                    <Text
                        style={[
                            styles.messageTime,
                            isMe ? styles.myMessageTime : styles.otherMessageTime,
                        ]}
                    >
                        {formatTime(item.createdAt)}
                    </Text>
                </View>
            );
        },
        [currentUserId, isTyping]
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#6C63FF" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 10}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} className="mr-2">
                    <Feather name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerAvatar}>
                    <Text style={styles.headerAvatarText}>
                        {(otherUserName || "U").charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View>
                    <Text style={styles.headerName}>{otherUserName}</Text>

                </View>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesContainer}
                onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: true })
                }
                onLayout={() =>
                    flatListRef.current?.scrollToEnd({ animated: false })
                }
            />

            {isTyping && (
                <View style={[styles.messageBubble, styles.otherMessage, { paddingLeft: 10, marginLeft: 14 }]}>
                    <Text style={styles.otherMessageText}>typing...</Text>
                </View>
            )}

            {/* Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Type a message..."
                    placeholderTextColor="#999"
                    value={inputText}
                    onChangeText={handleTyping}
                    multiline
                    maxLength={1000}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        !inputText.trim() && styles.sendButtonDisabled,
                    ]}
                    onPress={handleSend}
                    disabled={!inputText.trim()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.sendButtonText}>➤</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ECE5DD",
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ECE5DD",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#6C63FF",
        paddingTop: 55,
        paddingBottom: 15,
        paddingHorizontal: 16,
    },
    backButton: {
        fontSize: 24,
        color: "#fff",
        marginRight: 12,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.25)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    headerAvatarText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    headerName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    typingText: {
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
        fontStyle: "italic",
    },
    messagesContainer: {
        padding: 16,
        paddingBottom: 8,
    },
    messageBubble: {
        maxWidth: "78%",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 8,
    },
    myMessage: {
        alignSelf: "flex-end",
        backgroundColor: "#6C63FF",
        borderBottomRightRadius: 4,
    },
    otherMessage: {
        alignSelf: "flex-start",
        backgroundColor: "#fff",
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: "#fff",
    },
    otherMessageText: {
        color: "#1a1a2e",
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: "flex-end",
    },
    myMessageTime: {
        color: "rgba(255,255,255,0.7)",
    },
    otherMessageTime: {
        color: "#999",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        padding: 10,
        paddingBottom: Platform.OS === "ios" ? 30 : 10,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
    },
    textInput: {
        flex: 1,
        backgroundColor: "#F0F0F0",
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 12,
        fontSize: 15,
        maxHeight: 100,
        color: "#1a1a2e",
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#6C63FF",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
    },
    sendButtonDisabled: {
        backgroundColor: "#ccc",
    },
    sendButtonText: {
        fontSize: 20,
        color: "#fff",
    },
});
