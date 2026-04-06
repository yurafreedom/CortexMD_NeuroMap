export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const max = parseInt(searchParams.get('max') || '3', 10);

  if (!query) return Response.json({ error: 'Missing q param' }, { status: 400 });

  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${max}&retmode=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const pmids: string[] = searchData.esearchresult?.idlist || [];

    if (pmids.length === 0) return Response.json({ results: [], query });

    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`;
    const fetchRes = await fetch(fetchUrl);
    const xml = await fetchRes.text();

    const articles: { pmid: string; title: string; journal: string; year: string; abstract: string; url: string }[] = [];
    const blocks = xml.split('<PubmedArticle>').slice(1);
    for (const block of blocks) {
      const pmid = block.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1] || '';
      articles.push({
        pmid,
        title: block.match(/<ArticleTitle>([^<]+)<\/ArticleTitle>/)?.[1] || '',
        journal: block.match(/<Title>([^<]+)<\/Title>/)?.[1] || '',
        year: block.match(/<Year>(\d{4})<\/Year>/)?.[1] || '',
        abstract: (block.match(/<AbstractText[^>]*>([^<]+)<\/AbstractText>/)?.[1] || '').substring(0, 500),
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      });
    }

    return Response.json({ results: articles, query });
  } catch {
    return Response.json({ error: 'PubMed fetch failed' }, { status: 500 });
  }
}
