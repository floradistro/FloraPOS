import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'Environment Variables Check',
    variables: {
      NEXT_PUBLIC_PRODUCTION_API_URL: process.env.NEXT_PUBLIC_PRODUCTION_API_URL || 'MISSING',
      NEXT_PUBLIC_DOCKER_API_URL: process.env.NEXT_PUBLIC_DOCKER_API_URL || 'MISSING',
      NEXT_PUBLIC_STAGING_API_URL: process.env.NEXT_PUBLIC_STAGING_API_URL || 'MISSING',
      NEXT_PUBLIC_API_ENVIRONMENT: process.env.NEXT_PUBLIC_API_ENVIRONMENT || 'MISSING',
      NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'MISSING',
    },
    credentials: {
      hasNextPublicConsumerKey: !!process.env.NEXT_PUBLIC_WC_CONSUMER_KEY,
      hasNextPublicConsumerSecret: !!process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET,
      hasServerConsumerKey: !!process.env.WC_CONSUMER_KEY,
      hasServerConsumerSecret: !!process.env.WC_CONSUMER_SECRET,
      consumerKeyPreview: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY?.substring(0, 10) + '...' || 'MISSING',
      serverConsumerKeyPreview: process.env.WC_CONSUMER_KEY?.substring(0, 10) + '...' || 'MISSING',
    },
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('WC_') || 
      key.includes('API_') || 
      key.includes('NEXT_PUBLIC')
    ),
  });
}

