import { NextPage } from 'next';
import React, { useCallback } from 'react';
import { IS_CUSTOMER_POS, SHOW_MERCHANT_LIST } from '../../utils/env';
import { useConfig } from '../../hooks/useConfig';
import { GenerateButton } from '../buttons/GenerateButton';
import { NumPad } from '../sections/NumPad';
import { PoweredBy } from '../sections/PoweredBy';
import { Summary } from '../sections/Summary';
import css from './NewPage.module.css';
import { useIsMobileSize } from "../../utils/mobile";
import { TopBar } from "../sections/TopBar";

const NewPage: NextPage = () => {
    const phone = useIsMobileSize() || IS_CUSTOMER_POS;
    const generateId = IS_CUSTOMER_POS ? 'pay' : 'generateCode';

    return phone ? (
        <div className={css.root}>
            <div className={css.main}>
                <TopBar />
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
                <TopBar />
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
