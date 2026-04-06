import Anthropic from '@anthropic-ai/sdk';
import { DRUGS } from '@/data/drugs';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

// PubMed search helper
async function searchPubMed(query: string, maxResults: number = 3) {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const pmids: string[] = searchData.esearchresult?.idlist || [];
    if (pmids.length === 0) return { results: [], query };

    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`;
    const fetchRes = await fetch(fetchUrl);
    const xml = await fetchRes.text();

    const articles = parseArticlesFromXML(xml);
    return {
      results: articles.map(a => ({
        pmid: a.pmid,
        title: a.title,
        journal: a.journal,
        year: a.year,
        abstract: a.abstract?.substring(0, 500),
        url: `https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/`,
      })),
      query,
    };
  } catch {
    return { results: [], query, error: 'PubMed fetch failed' };
  }
}

function parseArticlesFromXML(xml: string) {
  const articles: { pmid: string; title: string; journal: string; year: string; abstract: string }[] = [];
  const blocks = xml.split('<PubmedArticle>').slice(1);
  for (const block of blocks) {
    articles.push({
      pmid: block.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1] || '',
      title: block.match(/<ArticleTitle>([^<]+)<\/ArticleTitle>/)?.[1] || '',
      journal: block.match(/<Title>([^<]+)<\/Title>/)?.[1] || '',
      year: block.match(/<Year>(\d{4})<\/Year>/)?.[1] || '',
      abstract: block.match(/<AbstractText[^>]*>([^<]+)<\/AbstractText>/)?.[1] || '',
    });
  }
  return articles;
}

// Drug Ki lookup from local database
function lookupDrugKi(drugName: string) {
  const lower = drugName.toLowerCase();
  const entry = Object.entries(DRUGS).find(([key, d]) =>
    key.toLowerCase() === lower || d.n.toLowerCase() === lower || d.s.toLowerCase() === lower
  );
  if (!entry) return { error: `Drug "${drugName}" not found in CortexMD database` };
  const [key, d] = entry;
  return { id: key, name: d.n, shortCode: d.s, ki: d.ki, sigma1Type: d.s1t || null, doses: d.doses, unit: d.u };
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const { message, activeScheme, deficits, zoneContext } = await req.json();

  const systemPrompt = `Ты — фармакологический ассистент CortexMD.
Отвечай ТОЛЬКО на вопросы о психотропных препаратах, рецепторах, нейромедиаторах, взаимодействиях, дозировках и механизмах.

ПРАВИЛА:
1. Каждое утверждение подкрепляй источником (PMID, название исследования, или "учебник Stahl's")
2. Если не знаешь источник — скажи "источник не найден, рекомендую проверить в PubMed"
3. Не давай медицинских советов. Говори "обсудите с врачом" при вопросах о конкретных решениях
4. Используй данные из tools (PubMed, DrugBank) когда нужны конкретные цифры
5. Отвечай на русском языке
6. Будь конкретным — Ki значения, проценты окупации, названия зон мозга

КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:
Активная схема: ${JSON.stringify(activeScheme || {})}
Дефициты: ${JSON.stringify((deficits || []).map((d: { title: string }) => d.title))}
${zoneContext ? `Вопрос о зоне мозга: ${zoneContext}` : ''}

ДИСКЛЕЙМЕР (добавляй в конце если ответ касается изменения схемы):
"⚕️ Это образовательная информация, не медицинский совет. Обсудите любые изменения с вашим врачом."`;

  const tools: Anthropic.Tool[] = [
    {
      name: 'search_pubmed',
      description: 'Поиск статей в PubMed по запросу. Используй для подтверждения фактов.',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: { type: 'string', description: 'Поисковый запрос (на английском)' },
          max_results: { type: 'number', description: 'Кол-во результатов (1-5)' },
        },
        required: ['query'],
      },
    },
    {
      name: 'lookup_drug_ki',
      description: 'Ki-значения и рецепторный профиль препарата из базы CortexMD',
      input_schema: {
        type: 'object' as const,
        properties: {
          drug_name: { type: 'string', description: 'Название препарата' },
        },
        required: ['drug_name'],
      },
    },
  ];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      tools,
    });

    // Handle tool use
    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.MessageParam['content'] = [];

      for (const block of response.content) {
        if (block.type === 'tool_use') {
          let result: unknown;
          const input = block.input as Record<string, unknown>;
          if (block.name === 'search_pubmed') {
            result = await searchPubMed(input.query as string, (input.max_results as number) || 3);
          } else if (block.name === 'lookup_drug_ki') {
            result = lookupDrugKi(input.drug_name as string);
          }
          (toolResults as Anthropic.ToolResultBlockParam[]).push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }
      }

      const finalResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          { role: 'user', content: message },
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults as Anthropic.ToolResultBlockParam[] },
        ],
        tools,
      });

      const text = finalResponse.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('');
      return Response.json({ response: text });
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');
    return Response.json({ response: text });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
