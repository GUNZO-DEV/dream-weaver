import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useMissedAlarms = () => {
  const { user } = useAuth();
  const [missedCount, setMissedCount] = useState(0);
  const [missedAlarms, setMissedAlarms] = useState<any[]>([]);

  const fetchMissed = async () => {
    if (!user) {
      setMissedCount(0);
      setMissedAlarms([]);
      return;
    }

    const { data, error } = await supabase
      .from("alarm_triggers")
      .select("*")
      .eq("user_id", user.id)
      .eq("dismissed", false)
      .order("triggered_at", { ascending: false });

    if (!error && data) {
      setMissedCount(data.length);
      setMissedAlarms(data);
    }
  };

  const dismissAll = async () => {
    if (!user) return;
    await supabase
      .from("alarm_triggers")
      .update({ dismissed: true })
      .eq("user_id", user.id)
      .eq("dismissed", false);
    setMissedCount(0);
    setMissedAlarms([]);
  };

  const dismissOne = async (id: string) => {
    await supabase
      .from("alarm_triggers")
      .update({ dismissed: true })
      .eq("id", id);
    setMissedAlarms((prev) => prev.filter((a) => a.id !== id));
    setMissedCount((prev) => Math.max(0, prev - 1));
  };

  useEffect(() => {
    fetchMissed();
  }, [user]);

  // Listen for new triggers in realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("missed-alarms-badge")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alarm_triggers",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchMissed()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { missedCount, missedAlarms, dismissAll, dismissOne, refetch: fetchMissed };
};
