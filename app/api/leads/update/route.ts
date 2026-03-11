import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    
    // NocoDB accepte un tableau d'objets pour mettre à jour plusieurs lignes d'un coup
    const recordsToUpdate = Array.isArray(body) ? body : [body];

    const url = `https://crm.lorth-solutions.fr/api/v2/tables/mhoa1urs9qyy1l0/records`;
    
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'xc-token': process.env.NOCODB_API_TOKEN || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(recordsToUpdate)
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("NocoDB Update Error:", errorData);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour NocoDB' }, { status: res.status });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erreur API Update:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}