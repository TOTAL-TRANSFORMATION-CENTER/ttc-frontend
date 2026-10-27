"use client";

import { useEffect } from "react";
import AuthPage from "@/components/ttc/auth-page";

export default function LoginPage() {
  useEffect(() => {
    document.title = "Member Portal Login | Total Transformation Center";
  }, []);

  return <AuthPage mode="member" />;
}
