import BigNumber from 'bignumber.js';
import { FC, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { CURRENCY_LIST, NON_BREAKING_SPACE } from '../../utils/constants';
import { CURRENCY, DEFAULT_LANGUAGE, SHOW_SYMBOL } from '../../utils/env';
import css from './Amount.module.css';

export interface AmountProps {
    value: BigNumber | number | string | undefined;
    currency?: string;
    showZero?: boolean;
}

export const Amount: FC<AmountProps> = ({ value, currency, showZero }) => {
    const keys = Object.keys(CURRENCY_LIST);
    const currencyName = currency && keys.includes(currency) ? currency : keys.includes(CURRENCY) ? CURRENCY : 'SOL';
    const { minDecimals, symbol } = CURRENCY_LIST[currencyName];

    const amount = useMemo(() => {
        const num = value ? parseFloat(value.toString()) : NaN;
        if (isNaN(num) || (num <= 0 && !showZero)) return NON_BREAKING_SPACE;
        if (typeof value === 'string') return value;
        const bignumber = new BigNumber(value ? value : 0);
        const decimals = bignumber.decimalPlaces() ?? 0;
        return bignumber.toFormat(decimals < minDecimals ? minDecimals : decimals);
    }, [value, minDecimals, showZero]);

    const displayCurrency = useMemo(() => {
        if (SHOW_SYMBOL) {
            const language = navigator ? navigator.language : DEFAULT_LANGUAGE;
            const text = Number(1).toLocaleString(language, { style: 'currency', currency: 'EUR' });
            const onlyDecimal = text.replaceAll('1', '');
            const empty = onlyDecimal.replaceAll('0', '');
            const isCurrencyFirst = text[0] !== '1';
            const decimal = !isCurrencyFirst ? empty[0] : empty[empty.length - 1];
            try {
                return Number(0)
                    .toLocaleString(language, { style: 'currency', currency: symbol })
                    .replaceAll('0', '')
                    .replaceAll(decimal, '')
                    .trim();
            } catch {
                return symbol;
            }
        } else {
            return currency;
        }
    }, [currency, symbol]);

    return (
        <span>
            {amount !== NON_BREAKING_SPACE ? (
                <FormattedMessage
                    id="currencyPattern"
                    values={{
                        span: (chunks) => <span className={css.currency}>{chunks}</span>,
                        value: amount,
                        currency: displayCurrency,
                    }}
                />
            ) : (
                amount
            )}
        </span>
    );
};
