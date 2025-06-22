import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  console.log('=== REGISTRATION API CALLED ===');
  
  try {
    const body = await request.json();
    const { fullName, email, password } = body;

    console.log('Registration attempt for:', { fullName, email });
    console.log('Request body received:', { ...body, password: '[REDACTED]' });
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // Validate required fields
    if (!fullName || !email || !password) {
      console.log('Missing required fields:', { fullName: !!fullName, email: !!email, password: !!password });
      const errorResponse = { error: 'Full name, email, and password are required' };
      console.log('Returning error response:', errorResponse);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate email format
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      const errorResponse = { error: 'Please enter a valid email address' };
      console.log('Returning error response:', errorResponse);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      console.log('Password too short:', password.length);
      const errorResponse = { error: 'Password must be at least 8 characters long' };
      console.log('Returning error response:', errorResponse);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      console.log('Password does not meet complexity requirements');
      const errorResponse = { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' };
      console.log('Returning error response:', errorResponse);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check if Supabase is properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id')) {
      console.error('Supabase URL not configured properly');
      const errorResponse = { error: 'Server configuration error - Supabase not configured' };
      console.log('Returning error response:', errorResponse);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your_actual_anon_key')) {
      console.error('Supabase Anon Key not configured properly');
      const errorResponse = { error: 'Server configuration error - Supabase credentials not configured' };
      console.log('Returning error response:', errorResponse);
      return NextResponse.json(errorResponse, { status: 500 });
    }

    console.log('Attempting Supabase signup...');

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    console.log('Supabase response received');
    console.log('Supabase data:', data);
    console.log('Supabase error:', error);

    if (error) {
      console.error('Supabase signup error:', error);
      const errorResponse = { error: error.message || 'Failed to create account', supabaseError: error };
      console.log('Returning Supabase error response:', errorResponse);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!data.user) {
      console.error('No user data returned from Supabase');
      const errorResponse = { error: 'Failed to create account - no user data returned' };
      console.log('Returning error response:', errorResponse);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    console.log('Supabase signup successful:', data.user.id);

    const successResponse = {
      message: 'Account created successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.user_metadata?.full_name || fullName,
      },
    };
    
    console.log('Returning success response:', successResponse);
    return NextResponse.json(successResponse);

  } catch (error) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    
    const errorResponse = { 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
    console.log('Returning internal error response:', errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 