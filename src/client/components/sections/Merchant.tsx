import Image from 'next/image';
import { FC } from 'react';
import { useIntl } from 'react-intl';
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
    alt?: string;
}

export function merchantImageSrc(index: number | string) {
    return MERCHANT_IMAGE_PATH + index + '.png';
}

function fileExists(url: string) {
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status != 404;
}

export const Merchant: FC<MerchantProps> = ({ index, company, alt }) => {
    const useTranslate = (id: string) => useIntl().formatMessage({ id: id });
    const merchantLogo = useTranslate('merchantLogo');

    return (
        <div className={css.body}>
            {index > 0 && fileExists(merchantImageSrc(index)) && (
                <div className={css.row}>
                    <Image
                        className={css.image}
                        src={merchantImageSrc(index)}
                        alt={alt || merchantLogo}
                        height={250}
                        width={250}
                        priority={true}
                    />
                </div>
            )}
            <div className={css.row}>
                <div className={css.label}>{company}</div>
            </div>
        </div>
    );
};
