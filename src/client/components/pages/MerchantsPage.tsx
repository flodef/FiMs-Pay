import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { ABOUT_LINK } from '../../utils/env';
import { LoadMerchantData } from '../../utils/merchant';
import { MerchantCarousel } from '../sections/Carousel';
import { MerchantInfo } from '../sections/Merchant';
import css from './MerchantsPage.module.css';

const MerchantsPage: NextPage = () => {
    const [merchantInfoList, setMerchantInfoList] = useState<MerchantInfo[]>();
    const { query } = useRouter();
    const { id } = query;

    const isLoaded = useRef(false);
    useEffect(() => {
        if (!isLoaded.current) {
            isLoaded.current = true;
            LoadMerchantData().then(setMerchantInfoList);
        }
    }, []);

    const merchants = useMemo(
        () =>
            merchantInfoList
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

    return merchants && Object.keys(merchants).length > 0 ? (
        <div className={css.root}>
            <div className={css.top}>
                <FormattedMessage id="merchants" />
            </div>
            <div className={css.main}>
                {Object.entries(merchants).map(([location, merchant]) => (
                    <div key={location}>
                        <div className={css.location}>{location}</div>
                        <MerchantCarousel merchants={merchant} id={Number(id)} />
                    </div>
                ))}
            </div>
            <div className={css.bottom}>
                <a className={css.link} href={ABOUT_LINK} target="_blank" rel="noreferrer">
                    <FormattedMessage id="about" />
                </a>
            </div>
        </div>
    ) : null;
};

export default MerchantsPage;
