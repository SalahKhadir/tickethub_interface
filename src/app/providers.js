"use client";

import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <NotificationProvider>{children}</NotificationProvider>
      <Toaster position="bottom-right" />
    </AuthProvider>
  );
}
