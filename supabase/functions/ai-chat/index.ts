import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

const SYSTEM_PROMPT = `You are a helpful support assistant for BD Trading, a virtual trading and lottery gaming platform.
The platform has:
- Virtual lottery games: Win Go (color prediction), K3 (dice sum), 5D Lottery (multi-digit), TRX Win (blockchain-based)
- Trading Simulator: trade crypto/forex with virtual coins
- Virtual wallet with Main Balance, Winning Balance, and Bonus Balance
- Referral program: earn 200 coins per invite
- No real money is involved — this is a virtual entertainment platform

Be concise, friendly, and helpful. Answer questions about games, wallet, trading, and platform features.
If asked about real money or withdrawal, remind users this is virtual only.`

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { message } = await req.json()

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ reply: "Please send a valid message." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY")

    if (!apiKey) {
      const fallbackReplies: Record<string, string> = {
        "balance": "You have 3 types of balances: Main (for betting), Winning (from game wins), and Bonus (from referrals). Check your Wallet page!",
        "game": "We have 4 lottery games: Win Go (color prediction), K3 (dice), 5D Lottery, and TRX Win. All are provably fair!",
        "wingo": "Win Go is a color prediction game. Bet on Red, Green, Violet, or numbers 0-9. Results every 60 seconds!",
        "referral": "Share your unique referral code and earn 200 bonus coins for each friend who joins!",
        "trading": "The Trading Simulator lets you buy/sell crypto with virtual coins. Try BTC, ETH, SOL and more with up to 50x leverage!",
        "withdraw": "BD Trading is a virtual platform — no real money or withdrawals. It's for entertainment only!",
        "real money": "This is a 100% virtual platform. No real money is used or can be withdrawn.",
      }

      const lower = message.toLowerCase()
      let reply = "I'm here to help! You can ask about games, your wallet, referrals, or trading. How can I assist you?"

      for (const [key, val] of Object.entries(fallbackReplies)) {
        if (lower.includes(key)) {
          reply = val
          break
        }
      }

      return new Response(
        JSON.stringify({ reply }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't process that. Please try again."

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ reply: "I'm having trouble right now. Please try again later." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
