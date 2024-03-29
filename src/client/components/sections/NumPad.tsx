import { useWallet } from '@solana/wallet-adapter-react';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Theme, useConfig } from '../../hooks/useConfig';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { Digits } from '../../types';
import { CURRENCY_LIST } from '../../utils/constants';
import { MAX_VALUE } from '../../utils/env';
import { isFullscreen, requestFullscreen } from '../../utils/fullscreen';
import { isMobileDevice } from '../../utils/mobile';
import { getMultiplierInfo } from '../../utils/multiplier';
import { BackspaceIcon } from '../images/BackspaceIcon';
import { Amount } from './Amount';
import { ErrorMessage } from './ErrorMessage';
import css from './NumPad.module.css';
import { SelectImage } from './SelectImage';

interface NumPadInputButton {
    input: Digits | '.';
    onInput(key: Digits | '.'): void;
}

const NumPadButton: FC<NumPadInputButton> = ({ input, onInput }) => {
    const { theme } = useConfig();

    const onClick = useCallback(() => {
        if (!isFullscreen() && isMobileDevice()) {
            requestFullscreen();
        }
        onInput(input);
    }, [onInput, input]);
    return (
        <div>
            <input
                className={
                    theme === Theme.Color ? css.inputColor : theme === Theme.BlackWhite ? css.inputBW : css.input
                }
                type="checkbox"
                onClick={onClick}
            />
            <div className={theme === Theme.Color ? css.divColor : theme === Theme.BlackWhite ? css.divBW : css.div}>
                {input}
            </div>
        </div>
    );
};

export const NumPad: FC = () => {
    const { maxDecimals, maxValue: maxValueParam, multiplier, theme, currencyName } = useConfig();
    const { balance, hasSufficientBalance, paymentStatus, isRecipient } = usePayment();
    const { publicKey } = useWallet();

    const regExp = useMemo(() => new RegExp('^\\d*([.,]\\d{0,' + maxDecimals + '})?$'), [maxDecimals]);
    const maxValue = useMemo(() => (isRecipient ? MAX_VALUE : maxValueParam), [isRecipient, maxValueParam]);

    const [value, setValue] = useState('0');
    const onInput = useCallback(
        (key: Digits | '.') =>
            setValue((value) => {
                let newValue = (value + key).trim().replace(/^0{2,}/, '0');
                if (newValue) {
                    newValue = /^[.,]/.test(newValue) ? `0${newValue}` : newValue.replace(/^0+(\d)/, '$1');
                    if (regExp.test(newValue)) return parseFloat(newValue) <= maxValue ? newValue : maxValue.toString();
                }
                return value;
            }),
        [regExp, maxValue]
    );
    const onBackspace = useCallback(() => setValue((value) => (value.length ? value.slice(0, -1) || '0' : value)), []);

    const { setAmount } = usePayment();
    useEffect(
        () => setAmount(value ? getMultiplierInfo(value, multiplier).amount : undefined),
        [setAmount, value, multiplier]
    );

    const [currency, setCurrency] = useState(currencyName);
    const getCurrencyImage = (value: string) => React.createElement(CURRENCY_LIST[value].icon);

    return (
        <div className={css.root}>
            {publicKey && paymentStatus !== PaymentStatus.Error && (
                <div className={hasSufficientBalance ? css.bold : css.red}>
                    {balance !== undefined ? (
                        balance.gt(0) ? (
                            <div>
                                <FormattedMessage id="yourBalance" />
                                :&nbsp;
                                <Amount value={balance} />
                                {!hasSufficientBalance && <FormattedMessage id="insufficient" />}
                            </div>
                        ) : balance.eq(0) ? (
                            <FormattedMessage id="emptyBalance" />
                        ) : (
                            <FormattedMessage id="balanceLoading" />
                        )
                    ) : null}
                </div>
            )}
            {publicKey && paymentStatus !== PaymentStatus.Error && (
                <div>
                    <div className={css.icon}>
                        <SelectImage
                            id="currency"
                            value={currency}
                            size={48}
                            onValueChange={setCurrency}
                            // options={isRecipient ? Object.keys(CURRENCY_LIST) : [currencyName]}
                            options={[currencyName]}
                            getImage={getCurrencyImage}
                            imageOnly
                        />
                    </div>
                    <div className={css.value}>
                        <Amount value={value} showZero />
                    </div>
                    <div className={css.multiplier}>{getMultiplierInfo(value, multiplier).info}</div>
                    <div className={css.buttons}>
                        <div className={css.row}>
                            <NumPadButton input={7} onInput={onInput} />
                            <NumPadButton input={8} onInput={onInput} />
                            <NumPadButton input={9} onInput={onInput} />
                        </div>
                        <div className={css.row}>
                            <NumPadButton input={4} onInput={onInput} />
                            <NumPadButton input={5} onInput={onInput} />
                            <NumPadButton input={6} onInput={onInput} />
                        </div>
                        <div className={css.row}>
                            <NumPadButton input={1} onInput={onInput} />
                            <NumPadButton input={2} onInput={onInput} />
                            <NumPadButton input={3} onInput={onInput} />
                        </div>
                        <div className={css.row}>
                            <NumPadButton input="." onInput={onInput} />
                            <NumPadButton input={0} onInput={onInput} />
                            <button
                                className={
                                    theme === Theme.Color
                                        ? css.buttonColor
                                        : theme === Theme.BlackWhite
                                        ? css.buttonBW
                                        : css.button
                                }
                                type="button"
                                onClick={onBackspace}
                            >
                                <BackspaceIcon />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ErrorMessage />
        </div>
    );
};
