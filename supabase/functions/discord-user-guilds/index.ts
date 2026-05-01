// Lista os servidores Discord do usuário onde ele é DONO ou ADMIN.
// Marca quais já têm o nosso bot dentro (consultando discord_servers).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID")!;
const DISCORD_CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET")!;

// Permission flag for ADMINISTRATOR
const ADMIN = 0x8n; // ADMINISTRATOR permission flag

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile } = await admin.from("profiles")
      .select("discord_access_token, discord_refresh_token, discord_token_expires_at")
      .eq("id", userId).single();

    if (!profile?.discord_access_token) {
      return new Response(JSON.stringify({ error: "no_discord_connection" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = profile.discord_access_token;

    // Refresh se expirado
    const exp = profile.discord_token_expires_at ? new Date(profile.discord_token_expires_at).getTime() : 0;
    if (exp - Date.now() < 60_000 && profile.discord_refresh_token) {
      const r = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token: profile.discord_refresh_token,
        }),
      });
      if (r.ok) {
        const t = await r.json();
        accessToken = t.access_token;
        await admin.from("profiles").update({
          discord_access_token: t.access_token,
          discord_refresh_token: t.refresh_token,
          discord_token_expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
        }).eq("id", userId);
      }
    }

    // Busca guilds do usuário
    const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!guildsRes.ok) {
      const txt = await guildsRes.text();
      console.error("guilds fetch failed:", guildsRes.status, txt);
      return new Response(JSON.stringify({ error: "discord_api_error", status: guildsRes.status }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const guilds = await guildsRes.json();

    // Filtra só onde é dono OU tem permissão de ADMIN
    const ownedOrAdmin = (guilds as any[]).filter((g) => {
      if (g.owner) return true;
      try {
        const perms = BigInt(g.permissions);
        return (perms & ADMIN) === ADMIN;
      } catch { return false; }
    });

    // Verifica quais já têm nosso bot
    const guildIds = ownedOrAdmin.map((g) => g.id);
    const { data: known } = await admin.from("discord_servers")
      .select("guild_id, bot_in_server")
      .in("guild_id", guildIds.length ? guildIds : ["__none__"]);
    const botMap = new Map((known ?? []).map((s: any) => [s.guild_id, s.bot_in_server]));

    const result = ownedOrAdmin.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon
        ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${g.icon.startsWith("a_") ? "gif" : "png"}`
        : null,
      owner: !!g.owner,
      bot_in_server: botMap.get(g.id) === true,
    }));

    return new Response(JSON.stringify({ guilds: result }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error("discord-user-guilds error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
