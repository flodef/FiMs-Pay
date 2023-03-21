import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { db } from '../../utils/db';
import { ABOUT_LINK } from '../../utils/env';
import { MerchantCarousel } from '../sections/Carousel';
import { MerchantInfo } from '../sections/Merchant';
import css from './MerchantsPage.module.css';

const MerchantsPage: NextPage = () => {
    const { query } = useRouter();
    const { id } = query;

    const isLoaded = useRef(false);
    const [merchants, setMerchants] = useState<{ [key: string]: MerchantInfo[] }>();
    useEffect(() => {
        if (!isLoaded.current) {
            isLoaded.current = true;
            db.merchants.toArray().then((merchantInfoList) => {
                setMerchants(
                    merchantInfoList.reduce<{ [key: string]: MerchantInfo[] }>((resultArray, item) => {
                        const location = item.location;
                        if (!resultArray[location]) {
                            resultArray[location] = [];
                        }
                        resultArray[location].push(item);

                        return resultArray;
                    }, {})
                );
            });
        }
    }, [merchants]);

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
