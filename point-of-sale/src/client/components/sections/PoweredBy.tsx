import { FC } from 'react';
import { SolanaPayLogo } from '../images/SolanaPayLogo';
import * as css from './PoweredBy.module.css';

export const PoweredBy: FC = () => {
    return (
        <div className={css.root}>
            Powered by <SolanaPayLogo />
        </div>
    );
};
