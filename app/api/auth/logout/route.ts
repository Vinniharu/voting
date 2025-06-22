import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get the token from the cookie
    const token = request.cookies.get('token')?.value

    if (token) {
      // Sign out from Supabase (this invalidates the token)
      await supabase.auth.signOut()
    }

    // Create response
    const response = NextResponse.json({
      message: 'Logged out successfully'
    })

    // Clear the token cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
    })

    return response

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 