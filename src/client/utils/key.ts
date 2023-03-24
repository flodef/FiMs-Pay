import { fetchDataError, googleAuthenticatorError } from '../components/pages/App';
import { CRYPTO_SECRET, GOOGLE_API_KEY, GOOGLE_SPREADSHEET_ID } from './env';

/**
 * Load key from Google Spreadsheet or local file
 * @param time : time in milliseconds
 * @returns : string
 * @throws : Error
 * @example
 * await LoadKey(time);
 * @example
 */
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
            throw new Error(error + '\n' + fetchDataError);
        })
        .then(ConvertKeyData);
}

/**
 * Convert key data from Google Spreadsheet or local file to string
 * @param response : Response from Google Spreadsheet or local file
 * @returns : string
 * @throws : Error
 * @example
 * const key = await fetch(dataURL)
 *    .catch((error) => {
 *        throw new Error(error + '\n' + fetchDataError);
 *     });
 * })
 * .then(ConvertKeyData);
 * @example
 */
export async function ConvertKeyData(response: Response) {
    return response
        .json()
        .then((data: { values: (string | number)[][]; error: { message: string; status: string } }) => {
            if (!data) throw new Error('data not fetched');
            if (data.error && data.error.message && data.error.status !== 'INVALID_ARGUMENT')
                throw new Error(data.error.message + '\n' + googleAuthenticatorError);

            return data.values ? data.values[0][0].toString() : CRYPTO_SECRET;
        });
}

/**
 * Get index from time
 * @param time : time in milliseconds
 * @returns : number
 * @example
 * const index = getIndexFromTime(time);
 * @example
 */
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
