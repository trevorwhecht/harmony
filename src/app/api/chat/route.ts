import { NextResponse } from "next/server"
import { client } from "../../lib/openai"

export async function POST(req: Request) {
  const { messages } = await req.json()

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 })
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant for a couples counseling app. Your responses should be supportive and constructive.",
        },
        ...messages,
      ],
      temperature: 1,
      max_tokens: 4096,
      top_p: 1,
    })

    return NextResponse.json(response.choices[0].message)
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ error: "An error occurred while processing your request." }, { status: 500 })
  }
}

