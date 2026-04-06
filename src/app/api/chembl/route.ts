export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const drug = searchParams.get('drug');
  if (!drug) return Response.json({ error: 'No drug' }, { status: 400 });

  try {
    const molRes = await fetch(
      `https://www.ebi.ac.uk/chembl/api/data/molecule/search?q=${encodeURIComponent(drug)}&limit=1&format=json`
    );
    const molData = await molRes.json();
    const chemblId = molData.molecules?.[0]?.molecule_chembl_id;
    if (!chemblId) return Response.json({ results: [], drug });

    const actRes = await fetch(
      `https://www.ebi.ac.uk/chembl/api/data/activity?molecule_chembl_id=${chemblId}&standard_type=Ki&limit=50&format=json`
    );
    const actData = await actRes.json();

    const results = (actData.activities || []).map((a: Record<string, string>) => ({
      target: a.target_pref_name || '',
      ki: a.standard_value ? parseFloat(a.standard_value) : null,
      units: a.standard_units || 'nM',
      assay: a.assay_description || '',
      doc: a.document_chembl_id || '',
    }));

    return Response.json({ drug, chemblId, results });
  } catch {
    return Response.json({ error: 'ChEMBL fetch failed' }, { status: 500 });
  }
}
