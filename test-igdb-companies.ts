import { getIgdbToken } from './src/lib/igdbAuth';

async function run() {
    const accessToken = await getIgdbToken();
    const clientId = process.env.IGDB_CLIENT_ID;

    // test IGDB where name ~ *"Ubisoft"* syntax since "search" is unsupported
    const query = `
      fields name,logo.image_id;
      where name ~ *"Ubisoft"*;
      limit 5;
    `;

    const res = await fetch('https://api.igdb.com/v4/companies', {
        method: 'POST',
        headers: {
            'Client-ID': clientId!,
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'text/plain',
        },
        body: query,
    });

    console.log(await res.json());
}

run();
