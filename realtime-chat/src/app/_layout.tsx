import "../../global.css";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationProvider } from "../context/notificationcontext";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="chatroom" />
        </Stack>
      </NotificationProvider>
    </QueryClientProvider>
  );
}
