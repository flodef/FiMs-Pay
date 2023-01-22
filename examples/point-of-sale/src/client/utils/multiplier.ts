import BigNumber from "bignumber.js";

export enum Multiplier {
    u = 0.000001,
    m = 0.001,
    K = 1000,
    M = 1000000,
    G = 1000000000
}

export function getMultiplierInfo(amount: number | string | BigNumber | undefined, multiplier?: Multiplier) {
    let num = 0;
    let info;
    if (amount && multiplier) {
        const operator = multiplier < 0 ? '/' : 'x';
        const operation = multiplier < 0 ? (x: number) => 1 / x : (x: number) => 1 * x;
        info = operator + ' ' + operation(multiplier).toLocaleString(undefined, { style: "decimal" });
        num = parseFloat(amount.toString().replaceAll(",", ""));
    } else {
        multiplier = 1;
    }
    
    return { amount: new BigNumber(num * multiplier), info: info };
}
