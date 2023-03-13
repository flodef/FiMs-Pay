import { NextPage } from 'next';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { PaymentStatus, usePayment } from '../../hooks/usePayment';
import { IS_CUSTOMER_POS } from '../../utils/env';
import { BackButton, StandardButton } from '../buttons/StandardButton';
import { ErrorMessage } from '../sections/ErrorMessage';
import { PoweredBy } from '../sections/PoweredBy';
import { Progress, ProgresShape } from '../sections/Progress';
import { QRCode } from '../sections/QRCode';
import { TransactionInfo } from '../sections/TransactionInfo';
import css from './ProcessingPage.module.css';

const ProcessingPage: NextPage = () => {
    const { reset, generate, paymentStatus, confirmationProgress, isPaidStatus } = usePayment();

    const [value, text] = useMemo(() => {
        const count = 6;
        switch (paymentStatus) {
            case PaymentStatus.Pending:
                return [1 / count, 'createTransaction'];
            case PaymentStatus.Creating:
                return [2 / count, 'approveTransaction'];
            case PaymentStatus.Sent:
                return [3 / count, 'sendTransaction'];
            case PaymentStatus.Confirmed:
                return [4 / count, 'verifyTransaction'];
            case PaymentStatus.Valid:
                return [5 / count + Math.max(confirmationProgress, 1) / 6, paymentStatus];
            case PaymentStatus.Finalized:
                return [6 / count, PaymentStatus.Valid];
            case PaymentStatus.Error:
                return [6 / count, paymentStatus];
            default:
                return [0, undefined];
        }
    }, [paymentStatus, confirmationProgress]);

    const isNewStatus = paymentStatus === PaymentStatus.New;
    const isConfirmedStatus = paymentStatus === PaymentStatus.Confirmed;
    const isErrorStatus = paymentStatus === PaymentStatus.Error;

    return (
        <div className={css.root}>
            <div className={css.header}>
                <BackButton messageId="newPayment" onClick={reset} disabled={!isPaidStatus} />
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
                        <Progress
                            value={value}
                            messageId={text}
                            shape={ProgresShape.Circular}
                            isError={isErrorStatus}
                        />
                        {isErrorStatus && (
                            <div className={css.error}>
                                <ErrorMessage />
                                <StandardButton messageId="retry" onClick={generate} />
                            </div>
                        )}
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
