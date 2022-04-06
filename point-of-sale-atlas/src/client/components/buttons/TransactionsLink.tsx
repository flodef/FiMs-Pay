import Link from 'next/link';
import React, { FC } from 'react';
import { useMediaQuery } from 'react-responsive';
import { useConfig } from '../../hooks/useConfig';
import { ActivityIcon } from '../images/ActivityIcon';
import css from './TransactionsLink.module.css';

export const TransactionsLink: FC = () => {
    const { baseURL } = useConfig();
    const to = new URL('/transactions', baseURL);
    const phone = useMediaQuery({ query: '(max-width: 767px)' });

    return (
        <Link href={to} passHref>
            <a className={css.link}>
                <ActivityIcon />
                {phone ? null : 'Recent Transactions'}
            </a>
        </Link>
    );
};
