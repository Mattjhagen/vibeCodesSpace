import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { SiteContent } from './site-generation'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function fetchLinkedInProfile(url: string): Promise<string> {
  try {
    const readerUrl = `https://r.jina.ai/${url}`
    const res = await fetch(readerUrl, {
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'text',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return url
    const text = await res.text()
    return text.slice(0, 6000)
  } catch {
    return url
  }
}

const SYSTEM_PROMPT = `You are an expert personal branding and web design AI. You generate professional website content as JSON. Return ONLY valid JSON with no markdown fences or extra text.`

function buildPrompt(goal: string, resolvedContext: string): string {
  return `Generate a professional website structure for a user whose goal is: "${goal}".

Context about the user (extracted from their LinkedIn profile or provided directly):
"${resolvedContext}"

Return ONLY a JSON object with this structure:
{
  "sections": [
    { "id": "hero", "type": "hero", "content": { "title": "...", "subtitle": "...", "cta": "..." } },
    { "id": "about", "type": "about", "content": { "title": "...", "text": "..." } },
    { "id": "experience", "type": "experience", "content": { "title": "...", "jobs": [{ "role": "...", "company": "...", "years": "...", "desc": "..." }] } },
    { "id": "skills", "type": "skills", "content": { "title": "...", "items": ["...", "..."] } },
    { "id": "contact", "type": "contact", "content": { "title": "...", "email": "...", "description": "..." } }
  ]
}

Make the copy professional, engaging, and highly specific to the user's context. If context is sparse, use creative expertise to fill in high-quality professional placeholders.`
}

async function generateWithClaude(goal: string, resolvedContext: string): Promise<SiteContent> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-5-20251101',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildPrompt(goal, resolvedContext) }],
  })
  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text) as SiteContent
}

async function generateWithOpenAI(goal: string, resolvedContext: string): Promise<SiteContent> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildPrompt(goal, resolvedContext) },
    ],
    response_format: { type: 'json_object' },
  })
  return JSON.parse(response.choices[0].message.content || '{}') as SiteContent
}

export async function generateSiteWithAI(goal: string, profileContext: string): Promise<SiteContent> {
  let resolvedContext = profileContext
  if (profileContext.includes('linkedin.com/in/')) {
    resolvedContext = await fetchLinkedInProfile(profileContext)
  }

  // Try Claude first, fall back to OpenAI, then static template
  try {
    return await generateWithClaude(goal, resolvedContext)
  } catch (claudeErr) {
    console.error('Claude generation failed, trying OpenAI:', claudeErr)
    try {
      return await generateWithOpenAI(goal, resolvedContext)
    } catch (openaiErr) {
      console.error('OpenAI generation failed, using template:', openaiErr)
      const { generateInitialContent } = await import('./site-generation')
      return generateInitialContent(goal, 'minimal')
    }
  }
}
