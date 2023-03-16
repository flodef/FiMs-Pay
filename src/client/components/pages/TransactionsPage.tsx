import { NextPage } from 'next';
import { useState } from 'react';
import { BackButton } from '../buttons/StandardButton';
import { PoweredBy } from '../sections/PoweredBy';
import { Transactions } from '../sections/Transactions';
import css from './TransactionsPage.module.css';

const TransactionsPage: NextPage = () => {
    const [disabled, setDisabled] = useState(false);

    return (
        <div className={css.root}>
            <div className={css.header}>
                <BackButton messageId="back" disabled={disabled} setDisabled={setDisabled} />
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
