import Head from 'next/head';
import { FC } from 'react';
import { APP_TITLE } from '../../utils/env';

export interface HeaderProps {
    label?: string;
}

export const Header: FC<HeaderProps> = ({ label }) => {
    return (
        <Head>
            <title>{(label && label !== APP_TITLE ? label + ' @ ' : '') + APP_TITLE}</title>
        </Head>
    );
};
