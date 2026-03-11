export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const limit = 1000;
    // On lance 5 requêtes en parallèle pour aspirer 5000 leads en 1 seconde chrono
    const offsets = [0, 1000, 2000, 3000, 4000]; 
    
    const fetchPromises = offsets.map(offset => 
      fetch(`https://crm.lorth-solutions.fr/api/v2/tables/mhoa1urs9qyy1l0/records?limit=${limit}&offset=${offset}`, {
        headers: { 'xc-token': process.env.NOCODB_API_TOKEN || '' },
        cache: 'no-store'
      }).then(res => res.ok ? res.json() : { list: [] })
    );

    const results = await Promise.all(fetchPromises);
    
    let allRecords: any[] = [];
    results.forEach(data => {
      if (data && data.list) {
        allRecords = allRecords.concat(data.list);
      }
    });

    // LE FILTRE QUI A TOUJOURS MARCHÉ : On veut juste une date d'envoi valide
    const formattedLeads = allRecords
      .filter((l: any) => l["Date d'envoi du 1er cold email"] && l["Date d'envoi du 1er cold email"].trim() !== "")
      .map((l: any) => {
        let conversation = [];

        if (l.Historique) {
          try { conversation = JSON.parse(l.Historique); } catch (e) { }
        }

        if (conversation.length === 0) {
          const outreachDate = new Date(l["Date d'envoi du 1er cold email"]);
          conversation.push({ 
            id: `msg-1-${l.Id}`, 
            senderName: "Kilian Lorth", 
            isMe: true, 
            text: l["Mail d'outreach"] || "Message d'approche...", 
            date: outreachDate.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' }),
            timestamp: outreachDate.getTime()
          });

          if (l['Dernière réponse reçue']) {
            const replyDate = l["UpdatedAt"] ? new Date(l["UpdatedAt"]) : new Date(outreachDate.getTime() + 3600000); // Fallback
            conversation.push({ 
              id: `msg-2-${l.Id}`, 
              senderName: `${l['First Name'] || 'Client'}`, 
              isMe: false, 
              text: l['Dernière réponse reçue'], 
              date: replyDate.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' }),
              timestamp: replyDate.getTime()
            });
          }
        }

        return {
          id: l.Id,
          name: `${l['First Name'] || 'Inconnu'} ${l['Last Name'] || ''}`.trim(),
          company: l['Company Name'] || 'Entreprise',
          email: l.Email || 'email@inconnu.fr',
          status: l.Statut || 'Inconnu',
          subject: l['Objet d\'outreach'] ? "Re: " + l['Objet d\'outreach'] : "Conversation en cours",
          sender: l['Mail utilisé pour l\'envoi'] || "contact@lorth-digital.fr",
          conversation: conversation,
          folder: l.Dossier || null,
          isArchived: (l.Archive === true || l.Archive === 1 || l.Archive === 'true' || l.Archive === '1'),
          rawDate: new Date(l["Date d'envoi du 1er cold email"]).getTime(),
          Brouillon_IA: l['Brouillon_IA'] || null,
          Type_Objection: l['Type_Objection'] || null,
        };
    });

    // TRI PARFAIT : Du plus récent (Date la plus grande) au plus ancien
    formattedLeads.sort((a: any, b: any) => b.rawDate - a.rawDate);

    return NextResponse.json({ leads: formattedLeads });

  } catch (error) {
    console.error("Erreur API Leads:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}