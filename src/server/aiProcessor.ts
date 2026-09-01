import { GoogleGenAI, Type } from '@google/genai';
import { PostCategory, PostType } from '../types';

export interface AIPostOutput {
  category: PostCategory;
  postType: PostType;
  exam: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  importantPoints: string[];
  tags: string[];
  sourceText: string;
  sourceUrl?: string;
  officialReference?: string;
  confidence: number;
}

const AI_SYSTEM_PROMPT = `You are an exam-news content processing assistant.
Analyze the supplied Telegram post.

Determine:
- category: One of ["Latest News", "Exam Update", "Admit Card", "Answer Key", "Result", "Cut Off", "Vacancy", "Recruitment", "Government Job", "Scholarship", "Current Affairs", "Education", "Important Notice", "Other"]
- postType: One of ["NEWS", "RESULT", "ADMIT_CARD", "ANSWER_KEY", "CUT_OFF", "VACANCY", "NOTICE", "ARTICLE", "CURRENT_AFFAIRS"]
- exam: Name of the exam (e.g., "RRB Technician CEN 02/2024", "RRB NTPC CEN 05/2024", "RRB ALP CEN 01/2024", "RRB Group D CEN 08/2024", "RRB JE CEN 03/2024", or general exam name)
- title: A clear, factual headline in Hindi/English (e.g. "RRB Technician Answer Key 2026 जारी - Direct Download Link & Objection Rules")
- summary: 2-3 sentences concise factual summary of the update
- content: Full, well-structured markdown article including headings, instructions for candidates, official steps, and schedules
- importantPoints: Array of key bullet points extracted directly from the post
- tags: Array of 4-6 relevant keywords/tags
- slug: SEO-friendly lowercase alphanumeric hyphenated slug (e.g., "rrb-technician-answer-key-2026")
- sourceUrl: Any official URL extracted from the post (e.g. "https://rrbcdg.gov.in", "https://rrb.digialm.com")
- officialReference: Notification or CEN number mentioned (e.g., "CEN 02/2024")
- confidence: Float from 0.0 to 1.0 indicating how complete and reliable the post source information is

CRITICAL SAFETY RULES:
1. Do NOT invent facts.
2. Do NOT change dates, numbers, vacancies, exam names, official notices, URLs or eligibility information.
3. Preserve important factual information from the source.
4. If information is missing, leave the field empty or blank string/array.
5. Return valid JSON only adhering strictly to the schema.`;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sanitizeSlug(rawSlug: string, titleFallback: string): string {
  const target = rawSlug || titleFallback || 'exam-update';
  return target
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || 'exam-update-' + Date.now().toString(36);
}

const RETRYABLE_STATUS_CODES = [503, 429, 500, 502, 504];

function isRetryableError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.code || err.statusCode;
  const message = (err.message || '').toLowerCase();
  if (status && RETRYABLE_STATUS_CODES.includes(Number(status))) return true;
  if (message.includes('503') || message.includes('unavailable') || message.includes('high demand') || message.includes('resource_exhausted') || message.includes('rate limit') || message.includes('quota')) {
    return true;
  }
  return false;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function processTelegramWithAI(
  rawText: string,
  caption?: string,
  mediaUrl?: string,
  modelName: string = 'gemini-3.7-flash'
): Promise<{ result: AIPostOutput; rawResponse: string; durationMs: number }> {
  const startTime = Date.now();
  const fullInput = [
    rawText ? `Message Text:\n${rawText}` : '',
    caption ? `Media Caption:\n${caption}` : '',
    mediaUrl ? `Media Reference: ${mediaUrl}` : '',
  ].filter(Boolean).join('\n\n');

  const ai = getGenAI();

  if (!ai) {
    // Graceful intelligent local parser fallback if GEMINI_API_KEY is not configured
    const localResult = generateLocalAIFallback(fullInput);
    return {
      result: localResult,
      rawResponse: JSON.stringify(localResult),
      durationMs: Date.now() - startTime,
    };
  }

  // Model fallback chain: user requested model -> gemini-flash-latest -> gemini-3.1-flash-lite
  const candidateModels: string[] = Array.from(
    new Set([modelName || 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'])
  );

  let lastError: any = null;

  for (const currentModel of candidateModels) {
    // Try up to 2 attempts per model for transient errors
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: `Process this Telegram post into structured exam article JSON:\n\n${fullInput}`,
          config: {
            systemInstruction: AI_SYSTEM_PROMPT,
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  description: 'Category of the exam update',
                },
                postType: {
                  type: Type.STRING,
                  description: 'Type of post e.g. ANSWER_KEY, RESULT, ADMIT_CARD, NOTICE, VACANCY',
                },
                exam: {
                  type: Type.STRING,
                  description: 'Name of the exam or recruitment cycle',
                },
                title: {
                  type: Type.STRING,
                  description: 'Clear, engaging and factual article title',
                },
                slug: {
                  type: Type.STRING,
                  description: 'SEO-friendly slug',
                },
                summary: {
                  type: Type.STRING,
                  description: 'Short summary of the update',
                },
                content: {
                  type: Type.STRING,
                  description: 'Full markdown formatted article body',
                },
                importantPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Key takeaways and facts',
                },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of keywords and tags',
                },
                sourceUrl: {
                  type: Type.STRING,
                  description: 'Official link found in the post if any',
                },
                officialReference: {
                  type: Type.STRING,
                  description: 'CEN number or notification ref if any',
                },
                confidence: {
                  type: Type.NUMBER,
                  description: 'Confidence score between 0.0 and 1.0',
                },
              },
              required: [
                'category',
                'postType',
                'exam',
                'title',
                'slug',
                'summary',
                'content',
                'importantPoints',
                'tags',
                'confidence',
              ],
            },
          },
        });

        const responseText = response.text?.trim() || '{}';
        let parsed: any = {};
        try {
          parsed = JSON.parse(responseText);
        } catch {
          // In case of any wrapping markdown blocks
          const cleanJson = responseText.replace(/```json|```/g, '').trim();
          parsed = JSON.parse(cleanJson);
        }

        const output: AIPostOutput = {
          category: validateCategory(parsed.category),
          postType: validatePostType(parsed.postType),
          exam: parsed.exam || 'Railway Recruitment Board Exam',
          title: parsed.title || 'Railway Recruitment Board Official Update',
          slug: sanitizeSlug(parsed.slug, parsed.title || 'rrb-exam-update'),
          summary: parsed.summary || (rawText ? rawText.slice(0, 150) + '...' : 'Official railway exam update.'),
          content: parsed.content || rawText || 'Official announcement details.',
          importantPoints: Array.isArray(parsed.importantPoints) ? parsed.importantPoints : [],
          tags: Array.isArray(parsed.tags) ? parsed.tags : ['RRB', 'Railway Exam', 'Official Update'],
          sourceText: rawText || caption || '',
          sourceUrl: parsed.sourceUrl || extractUrlFromText(fullInput),
          officialReference: parsed.officialReference || extractCenFromText(fullInput),
          confidence: typeof parsed.confidence === 'number' ? Math.min(1.0, Math.max(0.1, parsed.confidence)) : 0.90,
        };

        return {
          result: output,
          rawResponse: responseText,
          durationMs: Date.now() - startTime,
        };
      } catch (err: any) {
        lastError = err;
        if (isRetryableError(err) && attempt === 1) {
          // Wait 800ms before attempt 2 on the same model
          await delay(800);
          continue;
        }
        // If not retryable or attempt 2 failed, break out to try next candidate model
        break;
      }
    }
  }

  console.warn('Gemini models unavailable, fallback to local parser:', lastError?.message || lastError);
  const localFallback = generateLocalAIFallback(fullInput);
  return {
    result: localFallback,
    rawResponse: JSON.stringify({ error: lastError?.message || 'Model fallback used', fallback: localFallback }),
    durationMs: Date.now() - startTime,
  };
}

function extractUrlFromText(text: string): string | undefined {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : undefined;
}

function extractCenFromText(text: string): string | undefined {
  const match = text.match(/CEN\s*\d+\/\d+/i);
  return match ? match[0].toUpperCase() : undefined;
}

function validateCategory(cat: string): PostCategory {
  const valid: PostCategory[] = [
    'Latest News',
    'Exam Update',
    'Admit Card',
    'Answer Key',
    'Result',
    'Cut Off',
    'Vacancy',
    'Recruitment',
    'Government Job',
    'Scholarship',
    'Current Affairs',
    'Education',
    'Important Notice',
    'Other',
  ];
  if (valid.includes(cat as PostCategory)) {
    return cat as PostCategory;
  }
  const lower = (cat || '').toLowerCase();
  if (lower.includes('answer') || lower.includes('key') || lower.includes('objection')) return 'Answer Key';
  if (lower.includes('result') || lower.includes('merit') || lower.includes('panel')) return 'Result';
  if (lower.includes('cut') || lower.includes('cutoff') || lower.includes('marks')) return 'Cut Off';
  if (lower.includes('admit') || lower.includes('hall ticket') || lower.includes('city')) return 'Admit Card';
  if (lower.includes('vacancy') || lower.includes('recruitment') || lower.includes('notification')) return 'Vacancy';
  if (lower.includes('current') || lower.includes('affairs')) return 'Current Affairs';
  return 'Important Notice';
}

function validatePostType(type: string): PostType {
  const valid: PostType[] = [
    'NEWS',
    'RESULT',
    'ADMIT_CARD',
    'ANSWER_KEY',
    'CUT_OFF',
    'VACANCY',
    'NOTICE',
    'ARTICLE',
    'CURRENT_AFFAIRS',
  ];
  if (valid.includes(type as PostType)) {
    return type as PostType;
  }
  const lower = (type || '').toLowerCase();
  if (lower.includes('answer') || lower.includes('key')) return 'ANSWER_KEY';
  if (lower.includes('result')) return 'RESULT';
  if (lower.includes('cut')) return 'CUT_OFF';
  if (lower.includes('admit')) return 'ADMIT_CARD';
  if (lower.includes('vacancy') || lower.includes('job')) return 'VACANCY';
  if (lower.includes('affair')) return 'CURRENT_AFFAIRS';
  if (lower.includes('notice')) return 'NOTICE';
  return 'NEWS';
}

function generateLocalAIFallback(text: string): AIPostOutput {
  const lower = text.toLowerCase();
  let category: PostCategory = 'Important Notice';
  let postType: PostType = 'NOTICE';
  let exam = 'Railway Recruitment Board';

  if (lower.includes('technician')) exam = 'RRB Technician CEN 02/2024';
  else if (lower.includes('ntpc')) exam = 'RRB NTPC CEN 05/2024';
  else if (lower.includes('alp')) exam = 'RRB ALP CEN 01/2024';
  else if (lower.includes('group d') || lower.includes('level 1')) exam = 'RRB Group D CEN 08/2024';
  else if (lower.includes('je') || lower.includes('junior engineer')) exam = 'RRB JE CEN 03/2024';

  if (lower.includes('answer key') || lower.includes('उत्तर कुंजी') || lower.includes('objection')) {
    category = 'Answer Key';
    postType = 'ANSWER_KEY';
  } else if (lower.includes('result') || lower.includes('परिणाम') || lower.includes('merit list') || lower.includes('cut off') || lower.includes('कट ऑफ')) {
    if (lower.includes('cut off') || lower.includes('कट ऑफ')) {
      category = 'Cut Off';
      postType = 'CUT_OFF';
    } else {
      category = 'Result';
      postType = 'RESULT';
    }
  } else if (lower.includes('admit card') || lower.includes('प्रवेश पत्र') || lower.includes('city intimation')) {
    category = 'Admit Card';
    postType = 'ADMIT_CARD';
  } else if (lower.includes('vacancy') || lower.includes('bharti') || lower.includes('भर्ती')) {
    category = 'Vacancy';
    postType = 'VACANCY';
  }

  const firstLine = text.split('\n')[0].trim() || 'RRB Official Notification Update';
  const title = firstLine.length > 80 ? firstLine.slice(0, 77) + '...' : firstLine;
  const slug = sanitizeSlug('', title);

  return {
    category,
    postType,
    exam,
    title,
    slug,
    summary: text.slice(0, 160) + (text.length > 160 ? '...' : ''),
    content: `## ${title}\n\n${text}\n\n### Important Details\n* All candidates are advised to verify details from official regional board portals.\n* Stay tuned for further official notifications.`,
    importantPoints: [
      'Official update released by Railway Recruitment Board.',
      'Check official website link for full candidate schedule and guidelines.',
    ],
    tags: ['RRB', 'Indian Railways', exam, category],
    sourceText: text,
    sourceUrl: extractUrlFromText(text) || 'https://rrbcdg.gov.in',
    officialReference: extractCenFromText(text) || 'Official Gateway',
    confidence: 0.88,
  };
}
