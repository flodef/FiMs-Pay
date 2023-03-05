import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useWallet } from '@solana/wallet-adapter-react';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Theme, useConfig } from '../../hooks/useConfig';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { FAUCET, FAUCET_ENCODED_KEY, IS_CUSTOMER_POS, POS_USE_WALLET } from '../../utils/env';
import { AlertDialogPopup } from '../sections/AlertDialogPopup';
import css from './GenerateButton.module.css';
import { StandardButton } from './StandardButton';

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
    const { amount, paymentStatus, hasSufficientBalance, generate, requestAirdrop, updateBalance, connectWallet } =
        usePayment();
    const { publicKey, connecting, autoConnect } = useWallet();
    const { theme, currencyName } = useConfig();

    const [needRefresh, setNeedRefresh] = useState(false);

    const isInvalidAmount = useMemo(() => !amount || amount.isLessThanOrEqualTo(0), [amount]);
    const action = useMemo(
        () =>
            !publicKey || !(POS_USE_WALLET || IS_CUSTOMER_POS)
                ? connecting || autoConnect
                    ? State.Connecting
                    : State.Connect
                : needRefresh
                ? State.Reload
                : hasSufficientBalance
                ? id
                : State.Supply,
        [connecting, hasSufficientBalance, id, needRefresh, publicKey, autoConnect]
    );

    // TODO Translate
    const alert = useMemo(
        () => undefined,
        []
        // action === State.Supply && IS_DEV
        //     ? {
        //           title: balanceIsEmpty,
        //           description: [
        //               `A new tab will open on a Solana Faucet where you can get some free SOL (for paying transaction fee) and some ${currencyName}:`,
        //               `1. Paste your wallet address in the faucet recipient text box OR select a wallet`,
        //               `2. Airdrop some SOL to your Solana wallet on the DEVNET network`,
        //               `3. Airdrop some ${currencyName} (if possible)`,
        //           ],
        //           type: AlertType.Message,
        //       }
        //     : undefined,
        // [action, currencyName, balanceIsEmpty]
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
                        if (!publicKey) throw new WalletNotConnectedError();
                        if (!FAUCET_ENCODED_KEY) {
                            navigator.clipboard.writeText(publicKey.toString());
                            window.open(FAUCET + '/?token-name=' + currencyName, '_blank');
                            setNeedRefresh(true);
                        } else {
                            requestAirdrop();
                        }
                    };
                default:
                    return () => {};
            }
        };
        a()();
    }, [id, action, publicKey, currencyName, generate, connectWallet, updateBalance, requestAirdrop]);

    const button = useMemo(
        () =>
            action && (
                <StandardButton
                    messageId={action}
                    onClick={!alert ? handleClick : undefined}
                    styleless={action === State.Connecting}
                    disabled={
                        (!IS_CUSTOMER_POS && isInvalidAmount) ||
                        (IS_CUSTOMER_POS &&
                            publicKey !== null &&
                            !connecting &&
                            hasSufficientBalance &&
                            (isInvalidAmount || paymentStatus !== PaymentStatus.New))
                    }
                />
            ),
        [action, connecting, handleClick, hasSufficientBalance, isInvalidAmount, publicKey, paymentStatus, alert]
    );

    return <AlertDialogPopup button={button} onClick={handleClick} alert={alert} />;
};
