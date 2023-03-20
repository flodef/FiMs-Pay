import { FC, useCallback } from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css'; // requires a loader
import { usePayment } from '../../hooks/usePayment';
import { isFullscreen, requestFullscreen } from '../../utils/fullscreen';
import { useNavigateToMerchant } from '../../utils/merchant';
import { isMobileDevice } from '../../utils/mobile';
import css from './Carousel.module.css';
import { Merchant, MerchantInfo } from './Merchant';

export interface MerchantsProps {
    merchants: MerchantInfo[];
    id?: number;
    alt?: string;
}

export const MerchantCarousel: FC<MerchantsProps> = ({ merchants, id, alt }) => {
    const { updateBalance, setIsRecipient } = usePayment();
    const navigate = useNavigateToMerchant(updateBalance);
    const handleClick = useCallback(
        (index: number) => {
            if (!isFullscreen() && isMobileDevice()) {
                requestFullscreen();
            }
            setIsRecipient(false);
            navigate(merchants[index]);
        },
        [merchants, navigate, setIsRecipient]
    );
    const selectedItem = id && merchants.length > 0 ? parseInt(id.toString()) - merchants[0].index : 0;

    return (
        <Carousel
            className={css.body}
            infiniteLoop={true}
            showThumbs={false}
            statusFormatter={(c, t) => c + ' / ' + t}
            onClickItem={handleClick}
            selectedItem={selectedItem}
        >
            {merchants.map((merchant) => (
                <Merchant key={merchant.index} index={merchant.index} company={merchant.company} alt={alt} />
            ))}
        </Carousel>
    );
};
