import { NextPage } from 'next';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ABOUT, APP_TITLE, SHOW_MERCHANT_LIST } from '../../utils/env';
import css from './MerchantsPage.module.css';
import { FormattedMessage, useIntl } from 'react-intl';
import { MerchantCarousel } from '../sections/Carousel';
import { SOLANA_PAY } from '../../utils/constants';
import { TextAnimation } from '../sections/TextAnimation';
import { SolanaPayLogo } from '../images/SolanaPayLogo';
import { MerchantInfoMenu } from '../sections/MerchantInfoMenu';
import { Header } from '../sections/Header';
import { MerchantInfo } from '../sections/Merchant';
import { LoadMerchantData } from '../../utils/merchant';
import { useRouter } from 'next/router';

const MerchantsPage: NextPage = () => {
    const useTranslate = (id: string) => useIntl().formatMessage({ id: id });
    const merchantLogo = useTranslate('merchantLogo');
    const [merchantInfoList, setMerchantInfoList] = useState<MerchantInfo[]>();
    const { query } = useRouter();
    const { id } = query;

    const isLoaded = useRef(false);
    useEffect(() => {
        if (!isLoaded.current) {
            isLoaded.current = true;
            LoadMerchantData().then(setMerchantInfoList);
        }
    }, [merchantInfoList]);

    const merchants = useMemo(
        () =>
            SHOW_MERCHANT_LIST && merchantInfoList
                ? merchantInfoList.reduce<{ [key: string]: MerchantInfo[] }>((resultArray, item) => {
                      const location = item.location;
                      if (!resultArray[location]) {
                          resultArray[location] = [];
                      }
                      resultArray[location].push(item);

                      return resultArray;
                  }, {})
                : undefined,
        [merchantInfoList]
    );

    return SHOW_MERCHANT_LIST && merchants && Object.keys(merchants).length > 0 ? (
        <div className={css.root}>
            <Header />
            <div className={css.top}>
                <FormattedMessage id="merchants" />
            </div>
            <div>
                {Object.entries(merchants).map(([location, merchant]) => (
                    <div key={location}>
                        <div className={css.location}>{location}</div>
                        <MerchantCarousel merchants={merchant} id={Number(id)} alt={merchantLogo} />
                    </div>
                ))}
            </div>
            <div className={css.bottom}>
                <a className={css.link} href={ABOUT} target="_blank" rel="noreferrer">
                    <FormattedMessage id="about" />
                </a>
            </div>
        </div>
    ) : merchantInfoList ? (
        <div className={css.root}>
            <Header />
            <div className={css.logo}>
                {APP_TITLE === SOLANA_PAY ? (
                    <SolanaPayLogo width={240} height={88} />
                ) : (
                    <TextAnimation>{APP_TITLE}</TextAnimation>
                )}
            </div>
            <MerchantInfoMenu merchantInfoList={merchantInfoList} />
        </div>
    ) : null;
};

export default MerchantsPage;
