import React, { FC } from 'react';
import { FormattedMessage } from "react-intl";
import { SOLANA_PAY } from "../../utils/constants";
import { APP_TITLE } from "../../utils/env";
import { FiMsPayLogo } from '../images/FiMsPayLogo';
import { SolanaPayLogo } from "../images/SolanaPayLogo";
import css from './PoweredBy.module.css';

export const PoweredBy: FC = () => {
    return (
        <div className={css.root}>
            <FormattedMessage id="poweredBy" />
            {APP_TITLE === SOLANA_PAY
                ? <SolanaPayLogo />
                : <FiMsPayLogo />
            }
        </div>
    );
};
