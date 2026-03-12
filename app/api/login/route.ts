import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const validPassword = process.env.ADMIN_PASSWORD;

    if (password === validPassword) {
      // 🚨 La correction est ici : on ajoute "await" devant cookies()
      const cookieStore = await cookies();
      
      cookieStore.set('lorth_auth', 'authenticated', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365 * 10, // 10 ans !
        path: '/'
      });
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Mot de passe incorrect' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}