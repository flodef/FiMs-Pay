import { NextPage } from 'next';
import React, { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { IS_CUSTOMER_POS } from '../../utils/env';
import { BackButton } from '../buttons/BackButton';
import { GenerateButton } from '../buttons/GenerateButton';
import { ErrorMessage } from '../sections/ErrorMessage';
import { PoweredBy } from '../sections/PoweredBy';
import { Progress, ProgresShape } from '../sections/Progress';
import { QRCode } from '../sections/QRCode';
import { TransactionInfo } from '../sections/TransactionInfo';
import css from './ProcessingPage.module.css';

const ProcessingPage: NextPage = () => {
    const { reset, paymentStatus, progress, isPaidStatus } = usePayment();

    const [value, text] = useMemo(() => {
        switch (paymentStatus) {
            case PaymentStatus.Pending:
                return [1 / 6, 'createTransaction'];
            case PaymentStatus.Creating:
                return [2 / 6, 'approveTransaction'];
            case PaymentStatus.Sent:
                return [3 / 6, 'sendTransaction'];
            case PaymentStatus.Confirmed:
                return [4 / 6, 'verifyTransaction'];
            case PaymentStatus.Valid:
                return [5 / 6 + Math.max(progress, 1) / 6, paymentStatus];
            case PaymentStatus.Finalized:
                return [1, PaymentStatus.Valid];
            case PaymentStatus.Error:
                return [1, paymentStatus];
            default:
                return [0, undefined];
        }
    }, [paymentStatus, progress]);

    const isNewStatus = paymentStatus === PaymentStatus.New;
    const isConfirmedStatus = paymentStatus === PaymentStatus.Confirmed;
    const isErrorStatus = paymentStatus === PaymentStatus.Error;

    return (
        <div className={css.root}>
            <div className={css.header}>
                <BackButton onClick={reset} disabled={!isPaidStatus}>
                    <FormattedMessage id="newPayment" />
                </BackButton>
            </div>
            <div className={css.main}>
                <TransactionInfo />
                {!IS_CUSTOMER_POS && !isPaidStatus && !isConfirmedStatus && !isNewStatus ? (
                    <div>
                        <div className={css.code}>
                            <QRCode />
                        </div>
                        <div className={css.scan}>
                            <FormattedMessage id="scanCode" />
                        </div>
                        <div className={css.confirm}>
                            <FormattedMessage id="approveTransaction" />
                        </div>
                    </div>
                ) : (
                    <div>
                        <Progress value={value} text={text} shape={ProgresShape.Circular} isError={isErrorStatus} />
                        {isErrorStatus ? (
                            <div>
                                <ErrorMessage />
                                <GenerateButton id="retry" />
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
            <PoweredBy />
        </div>
    );
};

export default ProcessingPage;

export function getServerSideProps() {
    // Required so getInitialProps re-runs on the server-side
    // If it runs on client-side then there's no req and the URL reading doesn't work
    // See https://nextjs.org/docs/api-reference/data-fetching/get-initial-props
    return {
        props: {},
    };
}
