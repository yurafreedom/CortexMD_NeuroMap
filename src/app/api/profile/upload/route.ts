import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const fileType = formData.get('fileType') as string | null; // 'apple_health' | 'lab_pdf'

  if (!file || !fileType) {
    return NextResponse.json({ error: 'Missing file or fileType' }, { status: 400 });
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  // Validate file content via magic bytes (don't trust client-provided MIME or extension)
  const buffer = Buffer.from(await file.arrayBuffer());
  const header = buffer.slice(0, 5).toString('utf-8');
  const isXml = header.startsWith('<?xml') || header.startsWith('<');
  const isPdf = buffer.slice(0, 4).toString('utf-8') === '%PDF';

  if (!isXml && !isPdf) {
    return NextResponse.json({
      error: 'File type not allowed. Only XML (Apple Health) and PDF (lab reports) are accepted.',
    }, { status: 400 });
  }

  const ext = isPdf ? 'pdf' : 'xml';
  const contentType = isPdf ? 'application/pdf' : 'application/xml';
  const path = `${user.id}/${fileType}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('user-uploads')
    .upload(path, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    path,
    message: `File uploaded. Parsing will be available in a future update.`,
  });
}
