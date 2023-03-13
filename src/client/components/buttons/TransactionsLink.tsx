import Link from 'next/link';
import React, { FC } from 'react';
import { useLinkWithQuery } from '../../hooks/useLinkWithQuery';
import { ActivityIcon } from '../images/ActivityIcon';
import css from './TransactionsLink.module.css';
import { IS_CUSTOMER_POS } from '../../utils/env';
import { FormattedMessage } from 'react-intl';
import { useIsMobileSize } from '../../utils/mobile';

export const TransactionsLink: FC = () => {
    const to = useLinkWithQuery('/transactions');
    const isPhone = useIsMobileSize();

    return !IS_CUSTOMER_POS ? (
        <Link href={to} passHref className={css.link}>
            <ActivityIcon />
            {!isPhone ? <FormattedMessage id="recentTransactions" /> : null}
        </Link>
    ) : null;
};
