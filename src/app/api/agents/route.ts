import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://31.97.128.136:18789';
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || '';

const gatewayHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${GATEWAY_TOKEN}`,
};

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${GATEWAY_URL}/agents`, {
      headers: gatewayHeaders,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents from gateway' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, agentId } = body;

    if (!action || !agentId) {
      return NextResponse.json(
        { error: 'Missing action or agentId' },
        { status: 400 }
      );
    }

    const actionMap: Record<string, string> = {
      pause: 'pause',
      resume: 'resume',
      stop: 'stop',
      kill: 'kill',
    };

    const endpoint = actionMap[action];
    if (!endpoint) {
      return NextResponse.json(
        { error: `Invalid action: ${action}` },
        { status: 400 }
      );
    }

    const response = await fetch(`${GATEWAY_URL}/agents/${agentId}/${endpoint}`, {
      method: 'POST',
      headers: gatewayHeaders,
    });

    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to control agent:', error);
    return NextResponse.json(
      { error: 'Failed to control agent' },
      { status: 500 }
    );
  }
}
