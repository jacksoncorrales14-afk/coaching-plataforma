"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProgramasPage() {
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem("coach_email");
    const auth = localStorage.getItem("coach_auth");
    if (email && auth === "true") {
      router.replace("/mi-cuenta/dashboard");
    } else {
      router.replace("/membresia");
    }
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-wine-600" />
    </div>
  );
}
