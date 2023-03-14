import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { MouseEventHandler, useCallback, useState } from 'react';
import { BackButton } from '../buttons/StandardButton';
import { PoweredBy } from '../sections/PoweredBy';
import { Transactions } from '../sections/Transactions';
import css from './TransactionsPage.module.css';

const TransactionsPage: NextPage = () => {
    const router = useRouter();
    const [disabled, setDisabled] = useState(false);
    const handleClick: MouseEventHandler<HTMLButtonElement> = useCallback(
        (event) => {
            setDisabled(true);
            router.back();
        },
        [router]
    );

    return (
        <div className={css.root}>
            <div className={css.header}>
                <BackButton messageId="back" onClick={handleClick} disabled={disabled} />
            </div>
            {!disabled && (
                <>
                    <div className={css.main}>
                        <Transactions />
                    </div>
                    <PoweredBy />
                </>
            )}
        </div>
    );
};

export default TransactionsPage;
