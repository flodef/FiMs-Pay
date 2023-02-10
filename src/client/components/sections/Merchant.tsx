import Image from 'next/image';
import React, { FC } from 'react';
import { MERCHANT_IMAGE_PATH } from '../../utils/env';
import css from './Merchant.module.css';

export interface MerchantInfo {
    index: number;
    address: string;
    company: string;
    currency: string;
    maxValue: number;
    location: string;
}

export interface MerchantProps {
    index: number;
    company: string;
    alt: string;
}

export function merchantImageSrc(index: number | string) {
    return MERCHANT_IMAGE_PATH + index + '.png';
}

export const Merchant: FC<MerchantProps> = ({ index, company, alt }) => {
    return (
        <div className={css.body}>
            <div className={css.row}>
                <Image
                    className={css.image}
                    src={merchantImageSrc(index)}
                    alt={alt}
                    height={250}
                    width={250}
                    priority={true}
                />
            </div>
            <div className={css.row}>
                <div className={css.label}>{company}</div>
            </div>
        </div>
    );
};
