import { useWallet } from '@solana/wallet-adapter-react';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Theme, useConfig } from '../../hooks/useConfig';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { FAUCET, IS_CUSTOMER_POS, IS_DEV, POS_USE_WALLET } from '../../utils/env';
import { AlertDialogPopup, AlertType } from '../sections/AlertDialogPopup';
import css from './GenerateButton.module.css';

enum State {
    Connecting = 'connecting',
    Connect = 'connect',
    Reload = 'reload',
    Supply = 'supply',
}

export interface GenerateButtonProps {
    id: string;
}

export const GenerateButton: FC<GenerateButtonProps> = ({ id }) => {
    const { amount, status, hasSufficientBalance, balance, generate, updateBalance, connectWallet } = usePayment();
    const { publicKey, connecting } = useWallet();
    const { theme } = useConfig();

    const [needRefresh, setNeedRefresh] = useState(false);

    const isInvalidAmount = useMemo(() => !amount || amount.isLessThanOrEqualTo(0), [amount]);
    const action = useMemo(
        () =>
            hasSufficientBalance
                ? publicKey || !(POS_USE_WALLET || IS_CUSTOMER_POS)
                    ? connecting
                        ? State.Connecting
                        : id
                    : State.Connect
                : needRefresh || balance === undefined
                ? publicKey
                    ? State.Reload
                    : State.Connect
                : hasSufficientBalance
                ? State.Supply
                : status === PaymentStatus.Error
                ? id
                : null,
        [connecting, hasSufficientBalance, id, needRefresh, balance, publicKey, status]
    );

    const alert = useMemo(
        () =>
            action === State.Supply && IS_DEV
                ? {
                      title: 'Your public wallet balance is empty!',
                      description: [
                          `A new tab will open on a Solana Faucet where you can get some SOL/USDC:`,
                          `1. Copy your wallet address: ${publicKey}`,
                          `2. Paste it in the faucet recipient text box`,
                          `3. Airdrop some SOL to your wallet on the DEVNET network`,
                      ],
                      type: AlertType.Message,
                  }
                : undefined,
        [action, publicKey]
    );

    const handleClick = useCallback(() => {
        const a = () => {
            switch (action) {
                case id:
                    return () => generate();
                case 'connect':
                    return () => connectWallet();
                case 'reload':
                    return () => {
                        updateBalance();
                        setNeedRefresh(false);
                    };
                case 'supply':
                    return () => {
                        window.open(FAUCET, '_blank');
                        setNeedRefresh(true);
                    };
                default:
                    return () => {};
            }
        };
        a()();
    }, [generate, connectWallet, action, id, updateBalance]);

    const button = useMemo(
        () =>
            action ? (
                <button
                    className={
                        theme === Theme.Color ? css.rootColor : theme === Theme.BlackWhite ? css.rootBW : css.root
                    }
                    type="button"
                    onClick={!alert ? handleClick : undefined}
                    disabled={
                        (!IS_CUSTOMER_POS && isInvalidAmount) ||
                        (IS_CUSTOMER_POS &&
                            publicKey !== null &&
                            !connecting &&
                            hasSufficientBalance &&
                            (isInvalidAmount || status !== PaymentStatus.New))
                    }
                >
                    <FormattedMessage id={action} />
                </button>
            ) : null,
        [action, connecting, handleClick, hasSufficientBalance, isInvalidAmount, publicKey, status, theme, alert]
    );

    return <AlertDialogPopup button={button} onClick={handleClick} alert={alert} />;
};
