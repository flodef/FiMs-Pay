import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Theme, useConfig } from '../../hooks/useConfig';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { TOPUP_COST, ZERO } from '../../utils/constants';
import { FAUCET, IS_CUSTOMER_POS, IS_DEV, PRIVATE_PAYMENT } from '../../utils/env';
import { AlertDialogPopup, AlertType } from '../sections/AlertDialogPopup';
import css from './GenerateButton.module.css';

enum State {
    Connecting = 'connecting',
    Connect = 'connect',
    Reload = 'reload',
    Supply = 'supply',
    Topup = 'topup',
    Withdraw = 'withdraw',
}

export interface GenerateButtonProps {
    id: string;
}

export const GenerateButton: FC<GenerateButtonProps> = ({ id }) => {
    const {
        amount,
        status,
        hasSufficientBalance,
        balance,
        publicBalance,
        updateBalance,
        generate,
        selectWallet,
        topup,
        withdraw,
    } = usePayment();
    const { publicKey, connecting } = useWallet();
    const { theme, recipient } = useConfig();

    const [needRefresh, setNeedRefresh] = useState(false);
    const isInvalidAmount = useMemo(() => !amount || amount.isLessThanOrEqualTo(0), [amount]);
    const action = useMemo(
        () =>
            hasSufficientBalance
                ? IS_CUSTOMER_POS && publicKey
                    ? PRIVATE_PAYMENT && balance?.gt(0) && amount?.lte(0)
                        ? State.Withdraw
                        : id
                    : connecting
                    ? State.Connecting
                    : State.Connect
                : needRefresh || balance?.lt(0)
                ? State.Reload
                : PRIVATE_PAYMENT &&
                  balance !== undefined &&
                  amount !== undefined &&
                  publicBalance.minus(TOPUP_COST).div(LAMPORTS_PER_SOL).plus(balance).gte(amount)
                ? State.Topup
                : State.Supply,
        [connecting, hasSufficientBalance, id, needRefresh, publicKey, balance, publicBalance, amount]
    );

    const alert = useMemo(
        () =>
            action === State.Topup && PRIVATE_PAYMENT
                ? {
                      title: 'Your private wallet balance is empty!',
                      description: [
                          `You need to top it up with some SOL:`,
                          `It's an automatic process but BE AWARE THAT MOST OF YOUR FUND (${publicBalance
                              .minus(TOPUP_COST)
                              .div(LAMPORTS_PER_SOL)
                              .toNumber()}) will be transfered to this private wallet!`,
                          `To keep some fund in your public wallet, transfer it first to another account before toping up.`,
                          `For privacy reason, it's recommended that you topup a different amount to your private wallet than the what you are going to pay!`,
                      ],
                      type: AlertType.Alert,
                  }
                : action === State.Withdraw && PRIVATE_PAYMENT
                ? {
                      title: 'Withdraw private fund to your wallet!',
                      description: [
                          `This action will withdraw ALL OF YOUR PRIVATE FUND to your wallet.`,
                          ``,
                          `Do you still want to proceed?`,
                      ],
                      type: AlertType.Alert,
                  }
                : action === State.Supply && IS_DEV
                ? {
                      title: 'Your public wallet balance is empty!',
                      description: [
                          `A new tab will open on a Solana Faucet where you can get some SOL:`,
                          `1. Copy your wallet address: ${publicKey}`,
                          `2. Paste it in the faucet recipient text box`,
                          `3. Airdrop some SOL to your wallet on the DEVNET network`,
                      ],
                      type: AlertType.Message,
                  }
                : undefined,
        [publicBalance, action, publicKey]
    );

    const handleClick = useCallback(() => {
        const a = () => {
            switch (action) {
                case id:
                    return () => generate();
                case State.Connect:
                    return () => selectWallet();
                case State.Reload:
                    return () => {
                        updateBalance();
                        setNeedRefresh(false);
                    };
                case State.Supply:
                    return () => {
                        window.open(FAUCET, '_blank');
                        setNeedRefresh(true);
                    };
                case State.Topup:
                    return () => topup();
                case State.Withdraw:
                    return () => withdraw();
                default:
                    return () => {};
            }
        };
        a()();
    }, [generate, selectWallet, action, id, topup, withdraw, updateBalance]);

    const button = useMemo(
        () => (
            <button
                className={theme === Theme.Color ? css.rootColor : theme === Theme.BlackWhite ? css.rootBW : css.root}
                type="button"
                onClick={!alert ? handleClick : undefined}
                disabled={
                    (!IS_CUSTOMER_POS && isInvalidAmount) ||
                    (IS_CUSTOMER_POS &&
                        publicKey !== null &&
                        !connecting &&
                        hasSufficientBalance &&
                        (isInvalidAmount || (status !== PaymentStatus.New && status !== PaymentStatus.Error)) &&
                        PRIVATE_PAYMENT &&
                        (balance === undefined || (balance !== undefined && balance.eq(ZERO)))) ||
                    !PRIVATE_PAYMENT
                }
            >
                <FormattedMessage id={action} />
            </button>
        ),
        [
            action,
            connecting,
            handleClick,
            hasSufficientBalance,
            isInvalidAmount,
            publicKey,
            status,
            theme,
            alert,
            balance,
        ]
    );

    return <AlertDialogPopup button={button} onClick={handleClick} alert={alert} />;
};
