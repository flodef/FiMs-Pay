import React, { FC, useCallback, useEffect, useRef } from 'react';
import css from './TextAnimation.module.css';
import classNames from "classnames";
import { Rubik_Mono_One } from "@next/font/google";

const rubik = Rubik_Mono_One({
    subsets: ['latin'],
    weight: ['400'],
});
const className = process.env.NEXT_PUBLIC_VERCEL_ENV ? rubik.className : css.bodyLocal;

export interface TextAnimationProps {
    children: string;
}

export const TextAnimation: FC<TextAnimationProps> = ({ children }) => {
    const inputRef = Array();
    for (let i = 0; i < children.length; ++i) {
        inputRef.push(React.createRef<HTMLInputElement>());
    }

    const index = useRef(0);
    useEffect(() => {
        let changed = false;
        const run = () => {
            if (!changed) {
                if (inputRef[index.current] && inputRef[index.current].current) {
                    inputRef[index.current++].current.checked = true;
                }

                if (inputRef[index.current]) {
                    setTimeout(run, 3000 / inputRef.length);
                }
            }
        };
        const timeout = setTimeout(run, 3000);
        return () => {
            changed = true;
            clearTimeout(timeout);
        };
    }, [inputRef]);

    return (
        <div className={classNames(css.body, className)}>
            <ul className={css.ul}>
                {children.split('').map((item, index) => (
                    <li key={index} className={css.li}>
                        <input className={css.input} type="checkbox" ref={inputRef[index]} />
                        <div className={css.div}>{item}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
};
