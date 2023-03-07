import { useWallet } from '@solana/wallet-adapter-react';
import { NextPage } from 'next';
import { useEffect, useMemo } from 'react';
import { AirdropStatus, usePayment } from '../../hooks/usePayment';
import { DEFAULT_WALLET, IS_CUSTOMER_POS } from '../../utils/env';
import { useIsMobileSize } from '../../utils/mobile';
import { GenerateButton } from '../buttons/GenerateButton';
import { NumPad } from '../sections/NumPad';
import { PoweredBy } from '../sections/PoweredBy';
import { Progress, ProgresShape } from '../sections/Progress';
import { Summary } from '../sections/Summary';
import { TopBar } from '../sections/TopBar';
import css from './NewPage.module.css';

const NewPage: NextPage = () => {
    const { airdropStatus, connectWallet } = usePayment();
    const phone = useIsMobileSize() || IS_CUSTOMER_POS;
    const generateId = IS_CUSTOMER_POS ? 'pay' : 'generateCode';

    // Adding default wallet to localstorage if not already set by user ==> automatically connect to the wallet set in the settings
    useEffect(() => {
        const walletNameLabel = 'walletName';
        if (!localStorage.getItem(walletNameLabel) && DEFAULT_WALLET) {
            connectWallet();
        }
    }, [connectWallet]);

    const value = useMemo(() => {
        const count = 7;
        switch (airdropStatus) {
            case AirdropStatus.DecryptingAccount:
                return 1 / count;
            case AirdropStatus.RetrievingRecipient:
                return 2 / count;
            case AirdropStatus.TransferingSOL:
                return 3 / count;
            case AirdropStatus.ConfirmingSOLTransfer:
                return 4 / count;
            case AirdropStatus.RetrievingTokenAccount:
                return 5 / count;
            case AirdropStatus.TransferingToken:
                return 6 / count;
            case AirdropStatus.ConfirmingTokenTransfer:
                return 7 / count;
            default:
                return 0;
        }
    }, [airdropStatus]);

    return airdropStatus ? (
        <div className={css.root}>
            <Progress value={value} text={airdropStatus} shape={ProgresShape.Linear} />
        </div>
    ) : phone ? (
        <div className={css.root}>
            <div className={css.main}>
                <TopBar />
                <div className={css.body}>
                    <NumPad />
                    <GenerateButton id={generateId} />
                </div>
                <PoweredBy />
            </div>
        </div>
    ) : (
        <div className={css.root}>
            <div className={css.main}>
                <TopBar />
                <div className={css.body}>
                    <NumPad />
                </div>
                <PoweredBy />
            </div>
            <div className={css.side}>
                <div className={css.summary}>
                    <Summary />
                    <GenerateButton id={generateId} />
                </div>
            </div>
        </div>
    );
};

export default NewPage;

export function getServerSideProps() {
    // Required so getInitialProps re-runs on the server-side
    // If it runs on client-side then there's no req and the URL reading doesn't work
    // See https://nextjs.org/docs/api-reference/data-fetching/get-initial-props
    return {
        props: {},
    };
}
