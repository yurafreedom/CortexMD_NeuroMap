export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const drug = searchParams.get('drug');
  if (!drug) return Response.json({ error: 'No drug' }, { status: 400 });

  try {
    const res = await fetch(
      `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(drug)}"&limit=1`
    );
    const data = await res.json();
    const label = data.results?.[0];
    if (!label) return Response.json({ drug, found: false });

    return Response.json({
      drug,
      found: true,
      brandName: label.openfda?.brand_name?.[0] || '',
      warnings: label.warnings?.[0]?.substring(0, 500) || '',
      interactions: label.drug_interactions?.[0]?.substring(0, 500) || '',
      adverseReactions: label.adverse_reactions?.[0]?.substring(0, 500) || '',
      contraindications: label.contraindications?.[0]?.substring(0, 500) || '',
      boxedWarning: label.boxed_warning?.[0]?.substring(0, 300) || '',
    });
  } catch {
    return Response.json({ error: 'OpenFDA fetch failed' }, { status: 500 });
  }
}
