import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { fetchDataError, googleAuthenticatorError } from '../components/pages/App';
import { MerchantInfo } from '../components/sections/Merchant';
import { PaymentStatus } from '../hooks/usePayment';
import { createURLWithParams, getBaseURL } from './createURLWithQuery';
import { db } from './db';
import { GOOGLE_API_KEY, GOOGLE_SPREADSHEET_ID } from './env';

/**
 * Load merchant data from Google Spreadsheet or local file
 * @returns : MerchantInfo[]
 * @throws : Error
 * @example
 * const merchantInfoList = await LoadMerchantData();
 * @example
 */
export async function LoadMerchantData() {
    // TODO : add cache + image
    const dataURL =
        GOOGLE_SPREADSHEET_ID && GOOGLE_API_KEY
            ? `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SPREADSHEET_ID}/values/merchant!A%3AZ?valueRenderOption=UNFORMATTED_VALUE&key=${GOOGLE_API_KEY}`
            : `${getBaseURL()}/api/fetchMerchants`;

    return await fetch(dataURL)
        .catch((error) => {
            throw new Error(error + '\n' + fetchDataError);
        })
        .then(ConvertMerchantData);
}

/**
 *  Convert merchant data from Google Spreadsheet or local file to MerchantInfo
 *  @param response : Response from Google Spreadsheet or local file
 * @returns : MerchantInfo[]
 * @throws : Error
 * @example
 * const merchantInfoList = await fetch(dataURL)
 *     .catch((error) => {
 *         throw new Error(error + '\n' + fetchDataError);
 *     })
 *  .then(ConvertMerchantData);
 * @example
 */
async function ConvertMerchantData(response: Response) {
    const merchantInfoList = await response
        .json()
        .then((data: { values: (string | number)[][]; error: { message: string } }) => {
            if (!data) throw new Error('data not fetched');
            if (data.error && data.error.message) throw new Error(data.error.message + '\n' + googleAuthenticatorError);
            if (!data.values || data.values.length === 0) throw new Error('missing data pattern');
            const labels = data.values[0];
            return data.values
                .filter((merchant, i) => i !== 0)
                .map((merchant) => {
                    const merchantInfo: MerchantInfo = {} as MerchantInfo;
                    merchantInfo.index = Number(merchant[labels.indexOf('index')]);
                    merchantInfo.address = String(merchant[labels.indexOf('address')]);
                    merchantInfo.company = String(merchant[labels.indexOf('company')]);
                    merchantInfo.currency = String(merchant[labels.indexOf('currency')]);
                    merchantInfo.maxValue = Number(merchant[labels.indexOf('maxValue')]);
                    merchantInfo.location = String(merchant[labels.indexOf('location')]);

                    return merchantInfo;
                });
        });

    if (db.isOpen()) {
        await db.merchants.bulkPut(merchantInfoList);
    }

    return merchantInfoList;
}

/**
 * Navigate to "new" page with merchant info
 * @param postNav  callback after navigation
 * @returns  callback
 */
export function useNavigateToMerchant(postNav: any) {
    const router = useRouter();

    return useCallback(
        (merchant: MerchantInfo) => {
            const { index: id, address: recipient, company: label, currency, maxValue } = merchant;
            const urlParams = new URLSearchParams();
            urlParams.append('id', id.toString());
            urlParams.append('label', label.toString());
            urlParams.append('recipient', recipient.toString());
            urlParams.append('currency', currency.toString());
            urlParams.append('maxValue', maxValue.toString());
            const url = createURLWithParams(PaymentStatus.New, urlParams);
            router.push(url).then(postNav);
        },
        [router, postNav]
    );
}
