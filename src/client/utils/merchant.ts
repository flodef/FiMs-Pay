import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { MerchantInfo } from '../components/sections/Merchant';
import { PaymentStatus } from '../hooks/usePayment';
import { createURLWithParams, getBaseURL } from './createURLWithQuery';
import { GOOGLE_API_KEY, GOOGLE_SPREADSHEET_ID } from './env';

// TODO : translate error
export async function LoadMerchantData() {
    const dataURL =
        GOOGLE_SPREADSHEET_ID && GOOGLE_API_KEY
            ? `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SPREADSHEET_ID}/values/merchant!A%3AZ?valueRenderOption=UNFORMATTED_VALUE&key=${GOOGLE_API_KEY}`
            : `${getBaseURL()}/api/fetchMerchants`;

    return await fetch(dataURL)
        .catch((error) => {
            throw new Error(
                error +
                    '\nHave you try running with HTTPS (USE_HTTP=false) and not using local proxy (see Environment settings, .env.local)?'
            );
        })
        .then(convertMerchantData);
}

// TODO : translate error
export async function convertMerchantData(response: Response) {
    return response.json().then((data: { values: (string | number)[][]; error: { message: string } }) => {
        if (!data) throw new Error('data not fetched');
        if (data.error && data.error.message)
            throw new Error(
                data.error.message +
                    '\nHave you try running with GOOGLE_SPREADSHEET_ID / GOOGLE_API_KEY with default value (see Environment settings, .env.local)?'
            );
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
}

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
