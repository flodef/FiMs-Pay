import { NextPage } from 'next';
import React from 'react';
import css from './WaitingPage.module.css';

const WaitingPage: NextPage = () => {
    return (
        <div className={css.root}>
        </div>
    );
};

export default WaitingPage;

export function getServerSideProps() {
    // Required so getInitialProps re-runs on the server-side
    // If it runs on client-side then there's no req and the URL reading doesn't work
    // See https://nextjs.org/docs/api-reference/data-fetching/get-initial-props
    return {
        props: {},
    };
}
