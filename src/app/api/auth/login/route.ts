import { NextRequest, NextResponse } from 'next/server'
import { floraAPI } from '../../../../lib/woocommerce'

export async function POST(request: NextRequest) {
  try {
    const { email, password, storeId, terminalId } = await request.json()



    // Authenticate with Addify MLI plugin
    const authResult = await floraAPI.login(email, password, storeId, terminalId)

    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      token: authResult.token,
      user: authResult.user,
      store: authResult.store,
      terminal: authResult.terminal
    })

    // Set authentication cookie
    if (authResult.token) {
      response.cookies.set('flora_auth_token', authResult.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
    }

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
} 