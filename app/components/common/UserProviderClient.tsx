"use client";
import { useEffect } from "react";
import { useUserStore, User } from "@/store/userStore";

interface Props {
  serverUser: User | null;
  children?: React.ReactNode;
}

export default function UserProviderClient({ serverUser, children }: Props) {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    if (serverUser) setUser(serverUser);
  }, [serverUser, setUser]);

  return <>{children}</>;
}
