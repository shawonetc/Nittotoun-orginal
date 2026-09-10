import { NextResponse } from 'next/server';

const STEADFAST_BASE_URL = process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1';

const getHeaders = () => {
  const apiKey = process.env.STEADFAST_API_KEY || 'n5s6zniryso0gtbrr3xxvdfrnwi3jsh8';
  const secretKey = process.env.STEADFAST_SECRET_KEY || 'biczwggkkh5w3ux3g5jvngqi';
  return {
    'Api-Key': apiKey,
    'Secret-Key': secretKey,
    'Content-Type': 'application/json',
  };
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invoice, recipient_name, recipient_phone, recipient_address, cod_amount, note } = body;

    if (!invoice || !recipient_name || !recipient_phone || !recipient_address) {
      return NextResponse.json(
        { status: 400, message: 'Missing required order details' },
        { status: 400 }
      );
    }

    const payload = {
      invoice,
      recipient_name,
      recipient_phone,
      recipient_address,
      cod_amount: Number(cod_amount) || 0,
      note: note || '',
    };

    const res = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Steadfast order creation error:', error.message || error);
    return NextResponse.json(
      { status: 503, message: 'Unable to connect to Steadfast server. Please check internet connection.' },
      { status: 503 }
    );
  }
}
