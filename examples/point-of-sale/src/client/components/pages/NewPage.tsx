import { NextPage } from 'next';
import React from 'react';
import { IS_CUSTOMER_POS, SHOW_MERCHANT_LIST } from '../../utils/env';
import { useConfig } from '../../hooks/useConfig';
import { FullscreenButton } from '../buttons/FullscreenButton';
import { GenerateButton } from '../buttons/GenerateButton';
import { TransactionsLink } from '../buttons/TransactionsLink';
import { ConnectionButton } from '../buttons/ConnectionButton';
import { NumPad } from '../sections/NumPad';
import { PoweredBy } from '../sections/PoweredBy';
import { Summary } from '../sections/Summary';
import css from './NewPage.module.css';
import { BackButton } from '../buttons/BackButton';
import { FormattedMessage } from "react-intl";
import { useIsMobileSize } from "../../utils/mobile";
import { ActionMenu } from "../sections/ActionMenu";

const NewPage: NextPage = () => {
    const { reset } = useConfig();
    const phone = useIsMobileSize() || IS_CUSTOMER_POS;
    const generateId = IS_CUSTOMER_POS ? 'pay' : 'generateCode';

    return phone ? (
        <div className={css.root}>
            <div className={css.main}>
                <div className={css.top}>
                    <BackButton onClick={reset}><FormattedMessage id={SHOW_MERCHANT_LIST ? "merchants" : "back"} /></BackButton>
                    <ActionMenu />
                </div>
                <div className={css.body}>
                    <NumPad />
                    <GenerateButton id={generateId} />
                </div>
                <PoweredBy />
            </div >
        </div >
    ) : (
        <div className={css.root}>
            <div className={css.main}>
                <div className={css.top}>
                    <BackButton onClick={reset}><FormattedMessage id={SHOW_MERCHANT_LIST ? "merchants" : "back"} /></BackButton>
                    <ActionMenu />
                </div>
                <div className={css.body}>
                    <NumPad />
                </div>
                <PoweredBy />
            </div>
            <div className={css.side}>
                <div className={css.summary}>
                    <Summary />
                    <GenerateButton id={generateId} />
                </div>
            </div>
        </div>
    );
};

export default NewPage;

export function getServerSideProps() {
    // Required so getInitialProps re-runs on the server-side
    // If it runs on client-side then there's no req and the URL reading doesn't work
    // See https://nextjs.org/docs/api-reference/data-fetching/get-initial-props
    return {
        props: {},
    };
}
