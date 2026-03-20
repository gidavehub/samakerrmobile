import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

const initStorage = () => {
  const credsStr = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!credsStr) throw new Error("Missing GCP_SERVICE_ACCOUNT_JSON");

  const cleanCredsStr = credsStr.replace(/^'|'$/g, '');
  const credentials = JSON.parse(cleanCredsStr);
  const formattedPrivateKey = credentials.private_key.replace(/\\n/g, '\n');

  return new Storage({
      projectId: credentials.project_id,
      credentials: {
          client_email: credentials.client_email,
          private_key: formattedPrivateKey,
      }
  });
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const propertyId = formData.get('propertyId') as string;
    const type = formData.get('type') as string;

    if (!file || !propertyId) {
      return NextResponse.json({ error: 'Missing file or propertyId' }, { status: 400 });        
    }

    const storage = initStorage();
    const bucketName = 'outlaw-490315-media';
    const bucket = storage.bucket(bucketName);

    const ext = file.name.split('.').pop() || 'jpg';
    const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
    const destFileName = `${propertyId}/captures/${type}_${uniqueId}.${ext}`;

    const fileObj = bucket.file(destFileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fileObj.save(buffer, {
      contentType: file.type || 'image/jpeg',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    await fileObj.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${destFileName}`;

    return NextResponse.json({ url: publicUrl, path: destFileName });

  } catch (error: any) {
    console.error('Error uploading to GCP:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload to GCP' }, { status: 500 });
  }
}