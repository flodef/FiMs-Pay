import { useWallet } from "@solana/wallet-adapter-react";
import BigNumber from "bignumber.js";
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from "react-intl";
import { useConfig } from '../../hooks/useConfig';
import { usePayment } from '../../hooks/usePayment';
import { Digits } from '../../types';
import { PRIV_KEY, ZERO } from "../../utils/constants";
import { IS_CUSTOMER_POS } from '../../utils/env';
import { isFullscreen, requestFullscreen } from "../../utils/fullscreen";
import { useIsMobileSize } from "../../utils/mobile";
import { getMultiplierInfo } from "../../utils/multiplier";
import { BackspaceIcon } from '../images/BackspaceIcon';
import { Theme } from "./ActionMenu";
import { Amount } from "./Amount";
import css from './NumPad.module.css';

interface NumPadInputButton {
    input: Digits | '.';
    onInput(key: Digits | '.'): void;
}

const NumPadButton: FC<NumPadInputButton> = ({ input, onInput }) => {
    const { theme } = useConfig();

    const onClick = useCallback(() => {
        if (IS_CUSTOMER_POS && !isFullscreen()) {
            requestFullscreen();
        }
        onInput(input);
    }, [onInput, input]);
    return (
        <div>
            <input className={theme === Theme.Color ? css.inputColor : theme === Theme.BlackWhite ? css.inputBW : css.input} type="checkbox" onClick={onClick} />
            <div className={theme === Theme.Color ? css.divColor : theme === Theme.BlackWhite ? css.divBW : css.div}>{input}</div>
        </div>
    );
};

export const NumPad: FC = () => {
    const { maxDecimals, maxValue, multiplier, theme } = useConfig();
    const { balance, hasSufficientBalance } = usePayment();
    const { publicKey } = useWallet();
    const phone = useIsMobileSize();

    const regExp = useMemo(() => new RegExp('^\\d*([.,]\\d{0,' + maxDecimals + '})?$'), [maxDecimals]);

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
    useEffect(() => setAmount(value ? getMultiplierInfo(value, multiplier).amount : undefined), [setAmount, value, multiplier]);

    const hasBalance = useMemo(() => balance !== undefined && balance.gte(ZERO), [balance]);

    return (
        <div className={css.root}>
            {(phone || IS_CUSTOMER_POS) && (publicKey || PRIV_KEY)
                ? <div className={hasSufficientBalance ? css.bold : css.red}>
                    {balance !== undefined
                        ? balance.gt(ZERO)
                            ? <div>
                                <FormattedMessage id="yourBalance" />:&nbsp;
                                <Amount value={balance} />
                                {!hasSufficientBalance ? <FormattedMessage id="insufficient" /> : null}
                            </div>
                            : balance.lt(ZERO) 
                                ? <FormattedMessage id="balanceLoadingError" />
                                : <FormattedMessage id="emptyBalance" />
                        : <FormattedMessage id="balanceLoading" />}
                </div>
                : null
            }
            {!IS_CUSTOMER_POS || hasBalance
                ? <div>
                    <div className={css.text}><FormattedMessage id="toPay" /></div>
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
                            <button className={theme === Theme.Color ? css.buttonColor : theme === Theme.BlackWhite ? css.buttonBW : css.button} type="button" onClick={onBackspace}>
                                <BackspaceIcon />
                            </button>
                        </div>
                    </div>
                </div>
                : null
            }
        </div>
    );
};
