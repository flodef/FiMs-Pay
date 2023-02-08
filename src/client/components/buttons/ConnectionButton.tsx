import React, { FC, useCallback } from 'react';
import { ConnectIcon } from '../images/ConnectIcon';
import { DisconnectIcon } from '../images/DisconnectIcon';
import css from './ConnectionButton.module.css';
import { IS_CUSTOMER_POS, POS_USE_WALLET } from '../../utils/env';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePayment } from '../../hooks/usePayment';

export const ConnectionButton: FC = () => {
    const { connected } = useWallet();
    const { connectWallet } = usePayment();

    return POS_USE_WALLET || IS_CUSTOMER_POS ? (
        <button className={css.button} type="button" onClick={connectWallet}>
            {connected ? <ConnectIcon /> : <DisconnectIcon />}
        </button>
    ) : null;
};
