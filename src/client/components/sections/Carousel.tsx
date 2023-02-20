import React, { FC, useCallback } from 'react';
import 'react-responsive-carousel/lib/styles/carousel.min.css'; // requires a loader
import { Carousel } from 'react-responsive-carousel';
import { Merchant, MerchantInfo } from './Merchant';
import css from './Carousel.module.css';
import { useNavigateWithQuery } from '../../hooks/useNavigateWithQuery';
import { createURLWithParams } from '../../utils/createURLWithQuery';
import { PaymentStatus } from '../../hooks/usePayment';
import { useNavigateToMerchant } from '../../utils/merchant';

export interface MerchantsProps {
    merchants: MerchantInfo[];
    id?: number;
    alt: string;
}

export const MerchantCarousel: FC<MerchantsProps> = ({ merchants, id, alt }) => {
    const navigate = useNavigateToMerchant();
    const selectedItem = id && merchants.length > 0 ? parseInt(id.toString()) - merchants[0].index : 0;

    return (
        <Carousel
            className={css.body}
            infiniteLoop={true}
            showThumbs={false}
            statusFormatter={(c, t) => c + ' / ' + t}
            onClickItem={(index) => navigate(merchants[index])}
            selectedItem={selectedItem}
        >
            {merchants.map((merchant) => (
                <Merchant key={merchant.index} index={merchant.index} company={merchant.company} alt={alt} />
            ))}
        </Carousel>
    );
};
