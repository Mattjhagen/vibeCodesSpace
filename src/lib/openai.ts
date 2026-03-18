import OpenAI from 'openai'
import { SiteContent } from './site-generation'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateSiteWithAI(goal: string, profileContext: string): Promise<SiteContent> {
  const prompt = `
    You are an expert personal branding and web design AI.
    Your goal is to generate a professional website structure for a user whose goal is: "${goal}".
    
    Context about the user:
    "${profileContext}"
    
    Return ONLY a JSON object with the following structure:
    {
      "sections": [
        {
          "id": "hero",
          "type": "hero",
          "content": { "title": "...", "subtitle": "...", "cta": "..." }
        },
        {
          "id": "about",
          "type": "about",
          "content": { "title": "...", "text": "..." }
        },
        {
          "id": "experience",
          "type": "experience",
          "content": { "title": "...", "jobs": [{ "role": "...", "company": "...", "years": "...", "desc": "..." }] }
        },
        {
          "id": "skills",
          "type": "skills",
          "content": { "title": "...", "items": ["...", "..."] }
        },
        {
          "id": "contact",
          "type": "contact",
          "content": { "title": "...", "email": "...", "description": "..." }
        }
      ]
    }
    
    Make the copy professional, engaging, and highly specific to the user's provided context.
    If the context is sparse, use your creative expertise to fill in high-quality professional placeholders.
  `

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result as SiteContent
  } catch (error) {
    console.error('OpenAI Generation Error:', error)
    // Fallback to basic content
    const { generateInitialContent } = await import('./site-generation')
    return generateInitialContent(goal, 'minimal')
  }
}
