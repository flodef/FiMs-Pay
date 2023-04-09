import Image from 'next/image';
import { FC, useEffect, useState } from 'react';
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

const convertImage = (w: number, h: number) => `
        <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <defs>
            <linearGradient id="g">
                <stop stop-color="#333" offset="20%" />
                <stop stop-color="#222" offset="50%" />
                <stop stop-color="#333" offset="70%" />
            </linearGradient>
            </defs>
            <rect width="${w}" height="${h}" fill="#333" />
            <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
            <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
        </svg>`;

const toBase64 = (str: string) =>
    typeof window === 'undefined' ? Buffer.from(str).toString('base64') : window.btoa(str);

export const Merchant: FC<MerchantProps> = ({ index, company, alt }) => {
    const useTranslate = (id: string) => useIntl().formatMessage({ id: id });
    const merchantLogo = useTranslate('merchantLogo');

    const [imageSrc, setImageSrc] = useState('');

    useEffect(() => {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (this.readyState === this.OPENED) {
                setImageSrc(merchantImageSrc(index));
            }
        };
        xhr.open('HEAD', merchantImageSrc(index));
    }, [index]);

    return (
        <div className={css.body}>
            <div className={css.row}>
                <Image
                    className={index > 0 ? css.image : css.hiddenImage}
                    src={imageSrc}
                    alt={alt || merchantLogo}
                    height={250}
                    width={250}
                    priority={true}
                    placeholder="blur"
                    blurDataURL={`data:image/svg+xml;base64,${toBase64(convertImage(250, 250))}`}
                />
            </div>

            <div className={css.row}>
                <div className={css.label}>{company}</div>
            </div>
        </div>
    );
};
