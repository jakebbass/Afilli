import { chromium, Browser, Page } from "playwright";
import { db } from "~/server/db";
import { generateObject, generateText } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevanceScore: number;
}

interface LeadData {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  sourceUrl: string;
  discoveredVia: string;
  interests: string[];
  painPoints: string[];
  buyingSignals: any[];
  metadata: any;
}

interface ContentAnalysis {
  mainTopics: string[];
  keywords: string[];
  sentiment: string;
  buyingIntent: number;
  painPoints: string[];
  interests: string[];
}

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    console.log('[WEB-SCRAPER] 🌐 Launching Playwright Chromium browser...');
    browserInstance = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('[WEB-SCRAPER] ✅ Browser launched successfully');
  }
  return browserInstance;
}

export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function searchGoogle(
  query: string,
  maxResults: number = 10
): Promise<SearchResult[]> {
  console.log(`[WEB-SCRAPER] 🔍 Starting Google search for: "${query}" (max ${maxResults} results)`);
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    // Navigate to Google
    console.log('[WEB-SCRAPER] 📡 Navigating to Google...');
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&num=${maxResults}`);
    await page.waitForLoadState('networkidle');

    // Extract search results
    const results = await page.evaluate(() => {
      const searchResults: Array<{ title: string; url: string; snippet: string }> = [];
      const resultElements = document.querySelectorAll('div.g');

      resultElements.forEach((element) => {
        const titleElement = element.querySelector('h3');
        const linkElement = element.querySelector('a');
        const snippetElement = element.querySelector('div[data-sncf]') || element.querySelector('.VwiC3b');

        if (titleElement && linkElement && snippetElement) {
          searchResults.push({
            title: titleElement.textContent || '',
            url: linkElement.href || '',
            snippet: snippetElement.textContent || '',
          });
        }
      });

      return searchResults;
    });

    await context.close();
    console.log(`[WEB-SCRAPER] ✅ Found ${results.length} search results`);

    // Score results based on relevance
    return results.map((result, index) => ({
      ...result,
      relevanceScore: 1 - (index / results.length),
    }));
  } catch (error) {
    await context.close();
    console.error('[WEB-SCRAPER] ❌ Error searching Google:', error);
    return [];
  }
}

export async function extractPageContent(url: string): Promise<{
  title: string;
  content: string;
  links: string[];
  emails: string[];
  phones: string[];
  metadata: any;
}> {
  console.log(`[WEB-SCRAPER] 📄 Extracting content from: ${url}`);
  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    const data = await page.evaluate(() => {
      // Extract title
      const title = document.title;

      // Extract main content (removing scripts, styles, etc.)
      const contentElements = document.querySelectorAll('p, h1, h2, h3, h4, article, main');
      const content = Array.from(contentElements)
        .map(el => el.textContent?.trim())
        .filter(text => text && text.length > 20)
        .join('\n');

      // Extract links
      const links = Array.from(document.querySelectorAll('a[href]'))
        .map(a => (a as HTMLAnchorElement).href)
        .filter(href => href.startsWith('http'));

      // Extract emails
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = Array.from(new Set(
        (document.body.textContent || '').match(emailRegex) || []
      ));

      // Extract phone numbers
      const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
      const phones = Array.from(new Set(
        (document.body.textContent || '').match(phoneRegex) || []
      ));

      // Extract metadata
      const metadata: any = {};
      document.querySelectorAll('meta').forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (name && content) {
          metadata[name] = content;
        }
      });

      return { title, content, links, emails, phones, metadata };
    });

    await context.close();
    console.log(`[WEB-SCRAPER] ✅ Extracted content from ${url}: ${data.emails.length} emails, ${data.phones.length} phones`);
    return data;
  } catch (error) {
    await context.close();
    console.error(`[WEB-SCRAPER] ❌ Error extracting content from ${url}:`, error);
    return {
      title: '',
      content: '',
      links: [],
      emails: [],
      phones: [],
      metadata: {},
    };
  }
}

export async function analyzeContent(
  content: string,
  personaContext?: string
): Promise<ContentAnalysis> {
  try {
    const model = openrouter('anthropic/claude-3.5-sonnet');

    const { object } = await generateObject({
      model,
      schema: z.object({
        mainTopics: z.array(z.string()).describe('Main topics discussed in the content'),
        keywords: z.array(z.string()).describe('Key keywords and phrases'),
        sentiment: z.enum(['positive', 'neutral', 'negative']).describe('Overall sentiment'),
        buyingIntent: z.number().min(0).max(100).describe('Buying intent score from 0-100'),
        painPoints: z.array(z.string()).describe('Pain points or problems mentioned'),
        interests: z.array(z.string()).describe('Topics or products the person is interested in'),
      }),
      prompt: `Analyze the following content and extract key information${personaContext ? ` in the context of targeting: ${personaContext}` : ''}:

${content.slice(0, 4000)}

Provide a structured analysis focusing on business opportunities and customer insights.`,
    });

    return object;
  } catch (error) {
    console.error('Error analyzing content:', error);
    return {
      mainTopics: [],
      keywords: [],
      sentiment: 'neutral',
      buyingIntent: 0,
      painPoints: [],
      interests: [],
    };
  }
}

export async function discoverLeads(
  searchQuery: string,
  personaId: string,
  maxLeads: number = 10
): Promise<LeadData[]> {
  console.log(`[WEB-SCRAPER] 🎯 Starting lead discovery for query: "${searchQuery}" (max ${maxLeads} leads)`);

  // Get persona context
  const persona = await db.persona.findUnique({
    where: { id: personaId },
  });

  if (!persona) {
    throw new Error('Persona not found');
  }

  // Search Google
  const searchResults = await searchGoogle(searchQuery, maxLeads * 2);
  console.log(`[WEB-SCRAPER] 📊 Processing ${searchResults.length} search results for lead qualification`);

  const leads: LeadData[] = [];

  // Process each result
  for (const result of searchResults.slice(0, maxLeads)) {
    try {
      // Extract page content
      const pageData = await extractPageContent(result.url);

      // Analyze content
      const analysis = await analyzeContent(
        pageData.content,
        `${persona.name}: ${persona.description}`
      );

      // Only create lead if buying intent is significant
      if (analysis.buyingIntent >= 30) {
        console.log(`[WEB-SCRAPER] ✅ Qualified lead found: ${result.url} (buying intent: ${analysis.buyingIntent})`);
        const lead: LeadData = {
          sourceUrl: result.url,
          discoveredVia: 'web_search',
          interests: analysis.interests,
          painPoints: analysis.painPoints,
          buyingSignals: [
            {
              type: 'content_analysis',
              score: analysis.buyingIntent,
              keywords: analysis.keywords,
            },
          ],
          metadata: {
            searchQuery,
            pageTitle: pageData.title,
            sentiment: analysis.sentiment,
            mainTopics: analysis.mainTopics,
          },
        };

        // Add contact info if found
        if (pageData.emails.length > 0) {
          lead.email = pageData.emails[0];
        }
        if (pageData.phones.length > 0) {
          lead.phone = pageData.phones[0];
        }
        if (pageData.metadata['og:site_name']) {
          lead.company = pageData.metadata['og:site_name'];
        }

        leads.push(lead);
      } else {
        console.log(`[WEB-SCRAPER] ⏭️  Skipping lead: ${result.url} (buying intent too low: ${analysis.buyingIntent})`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`[WEB-SCRAPER] ❌ Error processing ${result.url}:`, error);
    }
  }

  console.log(`[WEB-SCRAPER] 🎉 Lead discovery complete: ${leads.length} qualified leads discovered`);
  return leads;
}

export async function findSocialProfiles(
  companyName: string
): Promise<{ platform: string; url: string }[]> {
  const platforms = [
    { name: 'LinkedIn', searchUrl: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyName)}` },
    { name: 'Twitter', searchUrl: `https://twitter.com/search?q=${encodeURIComponent(companyName)}` },
    { name: 'Facebook', searchUrl: `https://www.facebook.com/search/top?q=${encodeURIComponent(companyName)}` },
  ];

  const profiles: { platform: string; url: string }[] = [];

  for (const platform of platforms) {
    try {
      const searchResults = await searchGoogle(`${companyName} ${platform.name}`);
      const relevantResult = searchResults.find(r =>
        r.url.includes(platform.name.toLowerCase())
      );

      if (relevantResult) {
        profiles.push({
          platform: platform.name,
          url: relevantResult.url,
        });
      }
    } catch (error) {
      console.error(`Error finding ${platform.name} profile:`, error);
    }
  }

  return profiles;
}
