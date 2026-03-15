// Fichier : app/api/todo/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_API_TOKEN;
const TABLE_ID = 'mhoa1urs9qyy1l0'; // L'ID de ta table CRM LORTH

const headers = {
  'xc-token': NOCODB_TOKEN as string,
  'Content-Type': 'application/json',
};

// --- GET : Récupérer les leads du jour ---
export async function GET() {
  try {
    // 1. Récupérer les "Interactions" (%20 remplace les espaces pour éviter les erreurs d'URL)
    const resInt = await fetch(`${NOCODB_URL}/api/v2/tables/${TABLE_ID}/records?where=(Statut,eq,VIP à chauffer)&limit=15&sort=-Score%20via%20site`, { headers });
    const dataInt = await resInt.json();

    // 2. Récupérer les "Ajouts"
    const resAjout = await fetch(`${NOCODB_URL}/api/v2/tables/${TABLE_ID}/records?where=(Statut,eq,VIP Interagi)&limit=15&sort=-Score%20via%20site`, { headers });
    const dataAjout = await resAjout.json();

    const formatLead = (l: any) => ({
      id: l.Id,
      firstName: l['First Name'] || l.First_Name || 'Inconnu',
      lastName: l['Last Name'] || l.Last_Name || '',
      linkedinUrl: l.Person_Linkedin_Url || l['Person Linkedin Url'] || '#',
    });

    return NextResponse.json({
      interactions: (dataInt.list || []).map(formatLead),
      ajouts: (dataAjout.list || []).map(formatLead)
    });

  } catch (error) {
    console.error('Erreur GET To-Do:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des leads' }, { status: 500 });
  }
}

// --- POST : Valider les actions ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, type, selections, ids } = body;
    
    let recordsToUpdate: any[] = [];
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

    if (action === 'bulk') {
      recordsToUpdate = ids.map((id: string) => ({
        Id: id,
        Statut: type === 'interactions' ? 'VIP Interagi' : 'En chauffe LinkedIn',
        ...(type === 'ajouts' ? { 'Date Ajout LinkedIn': today } : {}) // Correction de l'espace ici
      }));
    } else if (action === 'manual') {
      for (const [id, status] of Object.entries(selections)) {
        if (status === 'success') {
          recordsToUpdate.push({
            Id: id,
            Statut: type === 'interactions' ? 'VIP Interagi' : 'En chauffe LinkedIn',
            ...(type === 'ajouts' ? { 'Date Ajout LinkedIn': today } : {}) // Correction de l'espace ici
          });
        } else if (status === 'error') {
          recordsToUpdate.push({
            Id: id,
            Statut: 'Erreur LinkedIn',
            ...(type === 'interactions' ? { 'Erreur Interaction': true } : { 'Erreur Ajout': true })
          });
        }
      }
    }

    if (recordsToUpdate.length === 0) {
      return NextResponse.json({ success: true, message: 'Rien à mettre à jour' });
    }

    // Requête PATCH NocoDB (Mise à jour en masse)
    const updateRes = await fetch(`${NOCODB_URL}/api/v2/tables/${TABLE_ID}/records`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(recordsToUpdate)
    });

    if (!updateRes.ok) {
      throw new Error(`NocoDB Error: ${updateRes.statusText}`);
    }

    return NextResponse.json({ success: true, updated: recordsToUpdate.length });

  } catch (error) {
    console.error('Erreur POST To-Do:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}