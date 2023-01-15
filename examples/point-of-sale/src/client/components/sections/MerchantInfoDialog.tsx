import React, { FC, FormEvent, MouseEvent, MouseEventHandler, PointerEventHandler, ReactNode, useCallback, useRef } from 'react';
import css from './MerchantInfoDialog.module.css';
// import { Cross2Icon } from '@radix-ui/react-icons';
// import * as Dialog from '@radix-ui/react-dialog';
// import * as Popover from '@radix-ui/react-popover';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import classNames from 'classnames';
import { CaretDownIcon } from '@radix-ui/react-icons';
import { FormattedMessage, useIntl } from "react-intl";
import { CURRENCY_LIST } from "../../utils/constants";
import { MAX_VALUE } from "../../utils/env";
import { MerchantInfo } from "./Merchant";
import { createURLWithParams } from "../../utils/createURLWithQuery";
import { useNavigateWithQuery } from "../../hooks/useNavigateWithQuery";

export interface MerchantInfoDialogProps {
    merchantInfoList: MerchantInfo[];
}

export const MerchantInfoDialog: FC<MerchantInfoDialogProps> = ({ merchantInfoList }) => {
    const useTranslate = (id: string) => useIntl().formatMessage({ id: id });

    const indexRef = React.createRef<HTMLSelectElement>();
    const labelRef = React.createRef<HTMLInputElement>();
    const recipientRef = React.createRef<HTMLInputElement>();
    const currencyRef = React.createRef<HTMLSelectElement>();
    const maxValueRef = React.createRef<HTMLInputElement>();

    const navigate = useNavigateWithQuery();
    const handleClick = useCallback((event: MouseEvent) => {
        const urlParams = new URLSearchParams();

        const a = (ref: React.RefObject<HTMLInputElement | HTMLSelectElement>) => {
            const element = ref.current;
            if (element) {
                const pattern = element.localName === 'input' ? (element as HTMLInputElement).pattern : '';
                const value = element.localName === 'select' ? (element as HTMLSelectElement).selectedOptions[0].id : element.value;
                const isValid = pattern ? new RegExp(pattern).test(value) : true;
                if (isValid) {
                    urlParams.append(element.id, value);
                    return true;
                } else {
                    element.focus();
                    return false;
                }
            } else {
                return false;
            }
        };

        const go = event.currentTarget.id === "selectMerchant" ?
            a(indexRef) :
            event.currentTarget.id === "unregisteredMerchant" ?
                a(labelRef) &&
                a(recipientRef) &&
                a(currencyRef) &&
                a(maxValueRef) :
                undefined;
        if (go) {
            const url = createURLWithParams("new", urlParams);
            navigate(url.toString());
        } else if (go === undefined) {
            throw new Error("Unhandled button click");
        }

    }, [currencyRef, indexRef, labelRef, maxValueRef, recipientRef, navigate]);

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
                                <select className={css.Input} id="id" ref={indexRef}>
                                    {merchantInfoList.map(m => <option id={m.index.toString()} key={m.index}>{m.company}</option>)}
                                </select>
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
                                <input className={css.Input} id="label" ref={labelRef} placeholder={useTranslate("myShopName")} defaultValue={''} pattern=".{5,50}" />
                            </fieldset>
                            <fieldset className={css.Fieldset}>
                                <label className={css.Label} htmlFor="recipient">
                                    <FormattedMessage id="address" />
                                </label>
                                <input className={css.Input} id="recipient" ref={recipientRef} placeholder={useTranslate("myShopWalletAddress")} defaultValue={''} pattern="^[1-9A-HJ-NP-Za-km-z]{32,44}$" />
                            </fieldset>
                            <fieldset className={css.Fieldset}>
                                <label className={css.Label} htmlFor="currency">
                                    <FormattedMessage id="currency" />
                                </label>
                                <select className={css.Input} id="currency" ref={currencyRef}>
                                    {Object.keys(CURRENCY_LIST).map(currency => <option id={currency} key={currency}>{currency}</option>)}
                                </select>
                            </fieldset>
                            <fieldset className={css.Fieldset}>
                                <label className={css.Label} htmlFor="maxValue">
                                    <FormattedMessage id="maxValue" />
                                </label>
                                <input className={css.Input} id="maxValue" ref={maxValueRef} placeholder={useTranslate("maximumReceivableValue")} defaultValue={MAX_VALUE} pattern="^[1-9]\d{0,4}(\.\d{1,2})?\s*$" />
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
