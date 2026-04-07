import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Verify the caller is authenticated
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Use admin client to clean up data and delete user
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userId = user.id;

    // 1. Delete storage files (profile avatar)
    try {
      await adminClient.storage.from("avatars").remove([`${userId}/avatar`]);
    } catch (_) { /* ignore storage errors */ }

    // 2. Delete listing images from storage
    try {
      const { data: listings } = await adminClient
        .from("clothing_listings")
        .select("id")
        .eq("seller_id", userId);
      if (listings && listings.length > 0) {
        for (const listing of listings) {
          const { data: files } = await adminClient.storage
            .from("listing-images")
            .list(`${listing.id}`);
          if (files && files.length > 0) {
            await adminClient.storage
              .from("listing-images")
              .remove(files.map((f) => `${listing.id}/${f.name}`));
          }
        }
      }
    } catch (_) { /* ignore storage errors */ }

    // 3. Delete user data from DB (cascades should handle most, but be explicit)
    // Messages
    await adminClient.from("messages").delete().eq("sender_id", userId);
    // Conversations
    await adminClient.from("conversation_participants").delete().eq("user_id", userId);
    // Saves/wishlist
    await adminClient.from("saved_items").delete().eq("user_id", userId);
    // Follows
    await adminClient.from("follows").delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`);
    // Blocks
    await adminClient.from("blocks").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    // Reviews
    await adminClient.from("reviews").delete().or(`reviewer_id.eq.${userId},seller_id.eq.${userId}`);
    // Notifications
    await adminClient.from("notifications").delete().eq("user_id", userId);
    // Listings
    await adminClient.from("clothing_listings").delete().eq("seller_id", userId);
    // User profile
    await adminClient.from("users").delete().eq("id", userId);

    // 4. Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      return jsonResponse({ error: deleteError.message }, 500);
    }

    return jsonResponse({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return jsonResponse({ error: message }, 500);
  }
});
