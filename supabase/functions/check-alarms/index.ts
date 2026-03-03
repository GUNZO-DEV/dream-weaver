import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    // JS: 0=Sun. Our DB uses 1=Mon..7=Sun
    const jsDay = now.getDay(); // 0=Sun
    const dbDay = jsDay === 0 ? 7 : jsDay; // 1=Mon..7=Sun

    const currentTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

    console.log(`[check-alarms] Checking at ${currentTime}, day=${dbDay}`);

    // Get all enabled alarms matching current time
    const { data: alarms, error: alarmsError } = await supabase
      .from("alarms")
      .select("*")
      .eq("enabled", true)
      .eq("time", currentTime);

    if (alarmsError) {
      console.error("[check-alarms] Error fetching alarms:", alarmsError);
      return new Response(JSON.stringify({ error: alarmsError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!alarms || alarms.length === 0) {
      return new Response(JSON.stringify({ triggered: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let triggeredCount = 0;

    for (const alarm of alarms) {
      const days = alarm.days_of_week || [1, 2, 3, 4, 5]; // Default Mon-Fri
      if (!days.includes(dbDay)) continue;

      // Check if already triggered in the last 2 minutes (avoid duplicates)
      const { data: existing } = await supabase
        .from("alarm_triggers")
        .select("id")
        .eq("alarm_id", alarm.id)
        .gte("triggered_at", new Date(now.getTime() - 2 * 60 * 1000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Insert trigger
      const { error: insertError } = await supabase
        .from("alarm_triggers")
        .insert({
          alarm_id: alarm.id,
          user_id: alarm.user_id,
          label: alarm.label,
          sound_id: alarm.sound_id,
          captcha_type: alarm.captcha_type,
          captcha_difficulty: alarm.captcha_difficulty,
          gradual_volume: alarm.gradual_volume,
          vibration: alarm.vibration,
        });

      if (insertError) {
        console.error(`[check-alarms] Failed to trigger alarm ${alarm.id}:`, insertError);
      } else {
        triggeredCount++;
        console.log(`[check-alarms] Triggered alarm ${alarm.id} for user ${alarm.user_id}`);
      }
    }

    // Cleanup old triggers
    await supabase.rpc("cleanup_old_alarm_triggers");

    return new Response(
      JSON.stringify({ triggered: triggeredCount, checked: alarms.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[check-alarms] Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
