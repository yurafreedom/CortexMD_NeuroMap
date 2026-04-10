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

  const allowedTypes = ['application/xml', 'text/xml', 'application/pdf'];
  if (!allowedTypes.includes(file.type) && !file.name.endsWith('.xml') && !file.name.endsWith('.pdf')) {
    return NextResponse.json({ error: 'Only XML and PDF files are accepted' }, { status: 400 });
  }

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${user.id}/${fileType}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('user-uploads')
    .upload(path, file, {
      contentType: file.type,
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
