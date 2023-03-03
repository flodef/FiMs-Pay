import { CRYPTO_SECRET, GOOGLE_API_KEY, GOOGLE_SPREADSHEET_ID } from './env';

// TODO : translate error
export async function LoadKey(index = 0) {
    const dataURL =
        GOOGLE_SPREADSHEET_ID && GOOGLE_API_KEY
            ? `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SPREADSHEET_ID}/values/key!A${
                  index + 2
              }?valueRenderOption=UNFORMATTED_VALUE&key=${GOOGLE_API_KEY}`
            : CRYPTO_SECRET;

    return await fetch(dataURL)
        .catch((error) => {
            throw new Error(
                error +
                    '\nHave you try running with HTTPS (USE_HTTP=false) and not using local proxy (see Environment settings, .env.local)?'
            );
        })
        .then(convertKeyData);
}

// TODO : translate error
export async function convertKeyData(response: Response) {
    return response.json().then((data: { values: (string | number)[][]; error: { message: string } }) => {
        if (!data) throw new Error('data not fetched');
        if (data.error && data.error.message)
            throw new Error(
                data.error.message +
                    '\nHave you try running with GOOGLE_SPREADSHEET_ID / GOOGLE_API_KEY with default value (see Environment settings, .env.local)?'
            );
        if (!data.values || data.values.length === 0) throw new Error('missing data pattern');
        return data.values[0][0].toString();
    });
}
