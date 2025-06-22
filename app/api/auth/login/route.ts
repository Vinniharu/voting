import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase login error:', error);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Login failed' },
        { status: 401 }
      );
    }

    // Get user profile from our users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      // If profile doesn't exist, create it
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            full_name: data.user.user_metadata?.full_name || 'User',
            email: data.user.email!,
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating user profile:', createError);
      }
    }

    // Create response with session token
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: userProfile?.full_name || data.user.user_metadata?.full_name || 'User',
      },
    });

    // Set session token as HTTP-only cookie
    if (data.session?.access_token) {
      response.cookies.set('token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 