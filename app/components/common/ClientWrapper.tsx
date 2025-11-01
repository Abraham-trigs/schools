"use client";
import { ReactNode, useEffect } from "react";
import { useUserStore } from "@/store/userStore";

export default function ClientWrapper({
  user,
  children,
}: {
  user: any;
  children: ReactNode;
}) {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    if (user) setUser(user);
  }, [user, setUser]);

  return <>{children}</>;
}
