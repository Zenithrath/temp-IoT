'use client'
import { useEffect, useState } from 'react';
import createSupabaseClientClient from "@/lib/supabase/client";

export function useGetUserSB() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = await createSupabaseClientClient();
        const { error, data } = await supabase.auth.getSession();
        setUserInfo(data);
      } catch (err) {
        setError(err as any);
        console.log('error', err);
      }
    };
    fetchData();
  }, []);

  return { userInfo, error };
}
