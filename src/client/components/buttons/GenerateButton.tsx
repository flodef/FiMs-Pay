import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Theme, useConfig } from '../../hooks/useConfig';
import { useError } from '../../hooks/useError';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { FAUCET, FAUCET_ENCODED_KEY, IS_CUSTOMER_POS, POS_USE_WALLET } from '../../utils/env';
import { AlertDialogPopup } from '../sections/AlertDialogPopup';
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
    const { amount, status, hasSufficientBalance, balance, generate, requestAirdrop, updateBalance, connectWallet } =
        usePayment();
    const { publicKey, connecting } = useWallet();
    const { theme, currencyName } = useConfig();
    const { connection } = useConnection();
    const { processError } = useError();

    const useTranslate = (id: string) => useIntl().formatMessage({ id: id });
    const balanceIsEmpty = useTranslate('balanceIsEmpty');

    const [needRefresh, setNeedRefresh] = useState(false);

    const isInvalidAmount = useMemo(() => !amount || amount.isLessThanOrEqualTo(0), [amount]);
    const action = useMemo(
        () =>
            !publicKey || !(POS_USE_WALLET || IS_CUSTOMER_POS)
                ? connecting
                    ? State.Connecting
                    : State.Connect
                : needRefresh
                ? State.Reload
                : hasSufficientBalance
                ? id
                : State.Supply,
        [connecting, hasSufficientBalance, id, needRefresh, balance, publicKey]
    );

    // TODO Translate
    const alert = useMemo(
        () => undefined,
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
        [action, currencyName, balanceIsEmpty]
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
    }, [generate, connectWallet, action, id, updateBalance, publicKey, connection, processError]);

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
