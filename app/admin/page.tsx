"use client";

import { useEffect } from "react";
import AuthPage from "@/components/ttc/auth-page";

export default function AdminLoginPage() {
  useEffect(() => {
    document.title = "Admin Portal Login | Total Transformation Center";
  }, []);

  return <AuthPage mode="admin" />;
}
