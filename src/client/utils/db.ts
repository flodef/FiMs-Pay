import Dexie, { Table } from 'dexie';
import { MerchantInfo } from '../components/sections/Merchant';

export class FiMsDb extends Dexie {
    // 'merchants' is added by dexie when declaring the stores()
    // We just tell the typing system this is the case
    merchants!: Table<MerchantInfo>;

    constructor() {
        super('FiMsDb');
        this.version(1).stores({
            merchants: 'index, address, company', // Primary key and indexed props
        });
    }
}

export const db = new FiMsDb();
