import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { SOLANA_PAY } from '../../utils/constants';
import { ABOUT_LINK, APP_TITLE } from '../../utils/env';
import { FiMsPayLogo } from '../images/FiMsPayLogo';
import { SolanaPayLogo } from '../images/SolanaPayLogo';
import css from './PoweredBy.module.css';

export const PoweredBy: FC = () => {
    return (
        <div className={css.root}>
            <a className={css.link} href={ABOUT_LINK} target="_blank" rel="noreferrer">
                <div className={css.text}>
                    <FormattedMessage id="poweredBy" />
                    &nbsp;
                </div>
                {APP_TITLE === SOLANA_PAY ? <SolanaPayLogo /> : <FiMsPayLogo />}
            </a>
        </div>
    );
};
