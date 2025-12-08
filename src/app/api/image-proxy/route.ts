import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ message: 'Missing url param' }, { status: 400 });
  }

  try {
    const upstream = await fetch(targetUrl, {
      // Подменяем UA, чтобы не ловить простые блокировки
      headers: {
        'User-Agent': 'DimkasvistProxy/1.0',
      },
    });

    if (!upstream.ok) {
      return NextResponse.json({ message: `Upstream error: ${upstream.status}` }, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Image proxy failed', error);
    return NextResponse.json({ message: 'Proxy error' }, { status: 500 });
  }
}
