import React, { FC, MouseEvent, useCallback, useState } from 'react';
import css from './MerchantInfoMenu.module.css';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import classNames from 'classnames';
import { CaretDownIcon } from '@radix-ui/react-icons';
import { FormattedMessage, useIntl } from "react-intl";
import { CURRENCY_LIST } from "../../utils/constants";
import { APP_TITLE, IS_CUSTOMER_POS, MAX_VALUE, POS_USE_WALLET } from "../../utils/env";
import { merchantImageSrc, MerchantInfo } from "./Merchant";
import { createURLWithParams } from "../../utils/createURLWithQuery";
import { useNavigateWithQuery } from "../../hooks/useNavigateWithQuery";
import { SelectImage } from "./SelectImage";
import Image from "next/image";

export interface MerchantInfoMenuProps {
    merchantInfoList: MerchantInfo[];
}

export const MerchantInfoMenu: FC<MerchantInfoMenuProps> = ({ merchantInfoList }) => {
    const useTranslate = (id: string) => useIntl().formatMessage({ id: id });
    const myShopWalletAddress = useTranslate("myShopWalletAddress");
    const myShopName = useTranslate("myShopName");
    const maximumReceivableValue = useTranslate("maximumReceivableValue");

    const labelRef = React.createRef<HTMLInputElement>();
    const recipientRef = React.createRef<HTMLInputElement>();
    const maxValueRef = React.createRef<HTMLInputElement>();

    const [index, setIndex] = useState(merchantInfoList.length > 0 ? merchantInfoList[0].index.toString() : '');
    const [currency, setCurrency] = useState(Object.keys(CURRENCY_LIST).length > 0 ? Object.keys(CURRENCY_LIST)[0] : '');
    const [label, setLabel] = useState('');
    const [recipient, setRecipient] = useState('');
    const [maxValue, setMaxValue] = useState('');

    const navigate = useNavigateWithQuery();
    const handleClick = useCallback((event: MouseEvent) => {
        const urlParams = new URLSearchParams();
        const a = (ref: React.RefObject<HTMLInputElement>) => {
            const element = ref.current;
            if (element) {
                const pattern = element.pattern;
                const value = element.value;
                const isValid = pattern ? new RegExp(pattern).test(value) : true;
                if (isValid) {
                    if (value) {
                        b(element.id, value);
                    }
                } else {
                    element.focus();
                }
                return isValid;
            } else {
                return true;
            }
        };
        const b = (id: string, value: string) => { urlParams.append(id, value); return true; };

        const go = event.currentTarget.id === "selectMerchant"
            ? b("id", index)
            : event.currentTarget.id === "unregisteredMerchant"
                ? a(labelRef)
                && a(recipientRef)
                && a(maxValueRef)
                && b("currency", currency)
                : undefined;
        if (go) {
            const url = createURLWithParams("new", urlParams);
            navigate(url.toString());
        } else if (go === undefined) {
            throw new Error("Unhandled button click");
        }

    }, [labelRef, maxValueRef, recipientRef, index, currency, navigate]);

    const onInput = useCallback<React.FormEventHandler<HTMLInputElement>>((event) => {
        const a = (x: string) => {
            switch (event.currentTarget.id) {
                case 'label':
                    return () => setLabel(x);
                case 'recipient':
                    return () => setRecipient(x);
                case 'maxValue':
                    return () => setMaxValue(x);
                default:
                    return () => { };
            }
        };
        a(event.currentTarget.value)();
    }, []);

    const getMerchantData = (item: MerchantInfo) => { return { key: item.index, value: item.index.toString(), text: item.company }; };
    const getMerchantImage = (value: string) => <Image className={css.image} src={merchantImageSrc(value)} alt={value} height={32} width={32} priority={true} />;
    const getCurrencyImage = (value: string) => React.createElement(CURRENCY_LIST[value].icon);

    return (
        <NavigationMenu.Root className={css.NavigationMenuRoot}>
            <NavigationMenu.List className={css.NavigationMenuList}>
                <NavigationMenu.Item>
                    <NavigationMenu.Trigger className={css.NavigationMenuTrigger} disabled={merchantInfoList.length === 0}>
                        <FormattedMessage id="registeredMerchant" />
                        <CaretDownIcon id="test" className={css.CaretDown} aria-hidden />
                    </NavigationMenu.Trigger>
                    <NavigationMenu.Content className={css.NavigationMenuContent}>
                        <div className={classNames(css.List, css.one)}>
                            <p className={css.Text}>
                                <FormattedMessage id="selectMerchant" />
                            </p>
                            <fieldset className={css.Fieldset}>
                                <label className={css.Label} htmlFor="id">
                                    <FormattedMessage id="merchant" />
                                </label>
                                <SelectImage id="id" value={index} onValueChange={setIndex} options={merchantInfoList} getData={getMerchantData} getImage={getMerchantImage} />
                            </fieldset>
                            <div className={css.Validation}>
                                <button id="selectMerchant" className={classNames(css.Button, css.green)} onClick={handleClick}><FormattedMessage id="letsgo" /></button>
                            </div>
                        </div>
                    </NavigationMenu.Content >
                </NavigationMenu.Item >

                <NavigationMenu.Item>
                    <NavigationMenu.Trigger className={css.NavigationMenuTrigger}>
                        <FormattedMessage id="unregisteredMerchant" />
                        <CaretDownIcon className={css.CaretDown} aria-hidden />
                    </NavigationMenu.Trigger>
                    <NavigationMenu.Content className={css.NavigationMenuContent}>
                        <div className={classNames(css.List, css.two)}>
                            <p className={css.Text}>
                                <FormattedMessage id="enterMerchantInfo" />
                            </p>
                            <fieldset className={css.Fieldset}>
                                <label className={css.Label} htmlFor="label">
                                    <FormattedMessage id="merchant" />
                                </label>
                                <input className={css.Input} id="label" value={label} onInput={onInput} ref={labelRef} placeholder={myShopName} pattern=".{0,50}" />
                            </fieldset>
                            {IS_CUSTOMER_POS || !POS_USE_WALLET
                                ? <fieldset className={css.Fieldset}>
                                    <label className={css.Label} htmlFor="recipient">
                                        <FormattedMessage id="address" />
                                    </label>
                                    <input className={css.Input} id="recipient" value={recipient} onInput={onInput} ref={recipientRef} placeholder={myShopWalletAddress} pattern="^[1-9A-HJ-NP-Za-km-z]{32,44}$" />
                                </fieldset>
                                : null
                            }
                            <fieldset className={css.Fieldset}>
                                <label className={css.Label} htmlFor="currency">
                                    <FormattedMessage id="currency" />
                                </label>
                                <SelectImage id="currency" value={currency} onValueChange={setCurrency} options={Object.keys(CURRENCY_LIST)} getImage={getCurrencyImage} />
                            </fieldset>
                            <fieldset className={css.Fieldset}>
                                <label className={css.Label} htmlFor="maxValue">
                                    <FormattedMessage id="maxValue" />
                                </label>
                                <input className={css.Input} id="maxValue" value={maxValue} onInput={onInput} ref={maxValueRef} placeholder={maximumReceivableValue} pattern="^$|^[1-9]\d{0,4}(\.\d{1,2})?\s*$" />
                            </fieldset>
                            <div className={css.Validation}>
                                <button id="unregisteredMerchant" className={classNames(css.Button, css.green)} onClick={handleClick}><FormattedMessage id="letsgo" /></button>
                            </div>
                        </div>
                    </NavigationMenu.Content >
                </NavigationMenu.Item >

                <NavigationMenu.Item>
                    <NavigationMenu.Trigger className={css.NavigationMenuTrigger} disabled>
                        <FormattedMessage id="register" />
                        {/* <CaretDownIcon className={css.CaretDown} aria-hidden /> */}
                    </NavigationMenu.Trigger>
                </NavigationMenu.Item >

                <NavigationMenu.Indicator className={css.NavigationMenuIndicator}>
                    <div className={css.Arrow} />
                </NavigationMenu.Indicator >
            </NavigationMenu.List >

            <div className={css.ViewportPosition}>
                <NavigationMenu.Viewport className={css.NavigationMenuViewport} />
            </div>
        </NavigationMenu.Root >
    );
};

//     <Popover.Root>
//         <Popover.Trigger asChild>
//             <button className={css.IconButton" aria-label="Update dimensions">
//                 Test
//             </button>
//         </Popover.Trigger>
//         <Popover.Portal>
//             <Popover.Content className={css.PopoverContent" sideOffset={5}>
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
//                     <p className={css.Text" style={{ marginBottom: 10 }}>
//                         Dimensions
//                     </p>
//                     <fieldset className={css.Fieldset}>
//                         <label className={css.Label" htmlFor="width">
//                             Width
//                         </label>
//                         <input className={css.Input" id="width" defaultValue="100%" />
//                     </fieldset>
//                     <fieldset className={css.Fieldset}>
//                         <label className={css.Label" htmlFor="maxWidth">
//                             Max. width
//                         </label>
//                         <input className={css.Input" id="maxWidth" defaultValue="300px" />
//                     </fieldset>
//                     <fieldset className={css.Fieldset}>
//                         <label className={css.Label" htmlFor="height">
//                             Height
//                         </label>
//                         <input className={css.Input" id="height" defaultValue="25px" />
//                     </fieldset>
//                     <fieldset className={css.Fieldset}>
//                         <label className={css.Label" htmlFor="maxHeight">
//                             Max. height
//                         </label>
//                         <input className={css.Input" id="maxHeight" defaultValue="none" />
//                     </fieldset>
//                 </div>
//                 <Popover.Close className={css.PopoverClose" aria-label="Close">
//                     <Cross2Icon />
//                 </Popover.Close>
//                 <Popover.Arrow className={css.PopoverArrow" />
//             </Popover.Content>
//         </Popover.Portal>
//     </Popover.Root>
// );

// <Dialog.Root>
//     <Dialog.Trigger asChild>
//         <button className={css.Button}>
//             {children}
//         </button>
//     </Dialog.Trigger>
//     <Dialog.Portal>
//         <Dialog.Overlay className={css.DialogOverlay} />
//         <Dialog.Content className={css.DialogContent}>
//             <Dialog.Title className={css.DialogTitle}>Edit profile</Dialog.Title>
//             <Dialog.Description className={css.DialogDescription}>
//                 Make changes to your profile here. Click save when you're done.
//             </Dialog.Description>
//             <fieldset className={css.Fieldset}>
//                 <label className={css.Label} htmlFor="name">
//                     Name
//                 </label>
//                 <input className={css.Input} id="name" defaultValue="Pedro Duarte" />
//             </fieldset>
//             <fieldset className={css.Fieldset}>
//                 <label className={css.Label} htmlFor="username">
//                     Username
//                 </label>
//                 <input className={css.Input} id="username" defaultValue="@peduarte" />
//             </fieldset >
//             <div style={{ display: 'flex', marginTop: 25, justifyContent: 'flex-end' }}>
//                 <Dialog.Close asChild>
//                     <button className={css.Button}>Save changes</button>
//                 </Dialog.Close>
//             </div >
//             {/* <Dialog.Close asChild>
//             <button className={css.IconButton" aria-label="Close">
//                 <Cross2Icon />
//             </button>
//         </Dialog.Close> */}
//         </Dialog.Content >
//     </Dialog.Portal >
// </Dialog.Root >
//     );
// };
