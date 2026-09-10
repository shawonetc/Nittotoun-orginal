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

export async function GET() {
  try {
    const res = await fetch(`${STEADFAST_BASE_URL}/user_balance`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Steadfast balance error:', error.message || error);
    // Return friendly JSON response on network/DNS or server failure without throwing 500 exception
    return NextResponse.json(
      { status: 503, message: 'Steadfast server unreachable or network error', current_balance: 0 },
      { status: 200 }
    );
  }
}
