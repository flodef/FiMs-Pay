import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(request: NextApiRequest, response: NextApiResponse) {
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/xml');

    // Instructing the Vercel edge to cache the file
    response.setHeader('Cache-control', 'stale-while-revalidate, s-maxage=3600');

    // generate sitemap here
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"> 
        <url>
            <loc>https://pay.fims.fi/new</loc>
            <lastmod>2023-02-18T21:03:30+00:00</lastmod>
        </url>
        <url>
            <loc>https://pay.fims.fi/processing</loc>
            <lastmod>2023-02-18T21:03:30+00:00</lastmod>
        </url>
        <url>
            <loc>https://pay.fims.fi/transactions</loc>
            <lastmod>2023-02-18T21:03:30+00:00</lastmod>
        </url>
    </urlset>`;

    response.end(xml);
}
