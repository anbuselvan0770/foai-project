// AI Provider Abstraction — supports Google Gemini, OpenAI, and Groq
// API keys are ONLY read from environment variables, never exposed to the frontend

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIResponse {
  content: string
  tokensUsed?: number
}

async function callGemini(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  // Combine system prompt + messages into Gemini format
  const formattedMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: systemPrompt
          ? { parts: [{ text: systemPrompt }] }
          : undefined,
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error: ${err}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return { content }
}

async function callOpenAI(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const allMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API error: ${err}`)
  }

  const data = await response.json()
  return {
    content: data.choices?.[0]?.message?.content || '',
    tokensUsed: data.usage?.total_tokens,
  }
}

async function callGroq(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not configured')

  const allMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error: ${err}`)
  }

  const data = await response.json()
  return {
    content: data.choices?.[0]?.message?.content || '',
    tokensUsed: data.usage?.total_tokens,
  }
}

export async function callAI(messages: AIMessage[], systemPrompt?: string): Promise<AIResponse> {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || 'gemini'
  const isDemoMode = process.env.DEMO_MODE === 'true'

  if (isDemoMode) {
    throw new Error('DEMO_MODE')
  }

  if (provider === 'openai') {
    return await callOpenAI(messages, systemPrompt)
  }

  if (provider === 'groq') {
    return await callGroq(messages, systemPrompt)
  }

  // Default: Gemini
  return await callGemini(messages, systemPrompt)
}

export function isAIConfigured(): boolean {
  if (process.env.DEMO_MODE === 'true') return false
  const provider = process.env.AI_PROVIDER?.toLowerCase() || 'gemini'
  if (provider === 'openai') return !!process.env.OPENAI_API_KEY
  if (provider === 'groq') return !!process.env.GROQ_API_KEY
  return !!process.env.GEMINI_API_KEY
}
