"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

interface User {
  name?: string;
  email?: string;
  role?: string;
  token?: string;
}

export function useUserOrRedirect(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !hasRedirected.current) {
      const stored = localStorage.getItem("user");
      if (!stored) {
        hasRedirected.current = true;
        router.replace("/login");
        setLoading(false);
      } else {
        try {
          const parsedUser = JSON.parse(stored);
          if (!parsedUser.token) {
            hasRedirected.current = true;
            router.replace("/login");
            setLoading(false);
          } else {
            setUser(parsedUser);
            setLoading(false);
          }
        } catch {
          hasRedirected.current = true;
          setUser(null);
          router.replace("/login");
          setLoading(false);
        }
      }
    }
  }, [router]);

  return { user, loading };
}

export function useUser(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      }
    }
  }, []);

  return user;
}
