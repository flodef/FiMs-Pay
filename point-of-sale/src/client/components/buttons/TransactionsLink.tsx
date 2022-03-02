import { FC } from 'react';
import { useMediaQuery } from 'react-responsive';
import Link from 'next/link';
import { ActivityIcon } from '../images/ActivityIcon';
import css from './TransactionsLink.module.css';

export const TransactionsLink: FC = () => {
    const phone = useMediaQuery({ query: '(max-width: 767px)' });

    return (
        <Link href="/transactions" passHref>
            <a className={css.link}>
                <ActivityIcon />
                {phone ? null : 'Recent Transactions'}
            </a>
        </Link>
    );
};
