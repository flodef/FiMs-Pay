import { CRYPTO_SECRET, GOOGLE_API_KEY, GOOGLE_SPREADSHEET_ID } from './env';

// TODO : translate error
export async function LoadKey(time = 0) {
    const index = getIndexFromTime(time);
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
    return response
        .json()
        .then((data: { values: (string | number)[][]; error: { message: string; status: string } }) => {
            if (!data) throw new Error('data not fetched');
            if (data.error && data.error.message && data.error.status !== 'INVALID_ARGUMENT')
                throw new Error(
                    data.error.message +
                        '\nHave you try running with GOOGLE_SPREADSHEET_ID / GOOGLE_API_KEY with default value (see Environment settings, .env.local)?'
                );

            return data.values ? data.values[0][0].toString() : CRYPTO_SECRET;
        });
}

function getIndexFromTime(time: number) {
    const d = new Date();
    d.setTime(time);
    if (d.getUTCFullYear() >= 2023) {
        const x = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).getTime();
        const n = Date.now();
        return Math.floor((n - x) / (1000 * 3600 * 24));
    } else {
        return time;
    }
}
