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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const consignment_id = searchParams.get('consignment_id');
    const invoice = searchParams.get('invoice');

    let endpoint = '';
    if (consignment_id) {
      endpoint = `${STEADFAST_BASE_URL}/status_by_cid/${consignment_id}`;
    } else if (invoice) {
      endpoint = `${STEADFAST_BASE_URL}/status_by_invoice/${invoice}`;
    } else {
      return NextResponse.json(
        { status: 400, message: 'consignment_id or invoice is required' },
        { status: 400 }
      );
    }

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Steadfast status error:', error.message || error);
    return NextResponse.json(
      { status: 503, message: 'Unable to connect to Steadfast server. Please check internet connection.' },
      { status: 503 }
    );
  }
}
