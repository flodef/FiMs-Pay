import { createTransferCheckedInstruction, getAccount, getAssociatedTokenAddress, getMint } from '@solana/spl-token';
import { AccountInfo, Commitment, Connection, PublicKey } from '@solana/web3.js';
import { LAMPORTS_PER_SOL, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
// import { MEMO_PROGRAM_ID, SOL_DECIMALS, TEN } from "./constants.js";
// import type { Amount, Memo, Recipient, References, SPLToken } from './types.js';

export const SOLANA_PROTOCOL = 'solana:';
export const HTTPS_PROTOCOL = 'https:';
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
export const SOL_DECIMALS = 9;
export const TEN = new BigNumber(10);

/** `recipient` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#recipient). */
export type Recipient = PublicKey;

/** `amount` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#amount). */
export type Amount = BigNumber;

/** `spl-token` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#spl-token). */
export type SPLToken = PublicKey;

/** `reference` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#reference). */
export type Reference = PublicKey;

/** `reference` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#reference). */
export type References = Reference | Reference[];

/** `label` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#label). */
export type Label = string;

/** `message` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#message). */
export type Message = string;

/** `memo` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#memo). */
export type Memo = string;

/** `link` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#link). */
export type Link = URL;

/**
 * Thrown when a Solana Pay transfer transaction can't be created from the fields provided.
 */
export class CreateTransferError extends Error {
    name = 'CreateTransferError';
}

/**
 * Fields of a Solana Pay transfer request URL.
 */
export interface CreateTransferFields {
    /** `recipient` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#recipient). */
    recipient: Recipient;
    /** `amount` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#amount). */
    amount: Amount;
    /** `spl-token` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#spl-token). */
    splToken?: SPLToken;
    /** `reference` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#reference). */
    reference?: References;
    /** `memo` in the [Solana Pay spec](https://github.com/solana-labs/solana-pay/blob/master/SPEC.md#memo). */
    memo?: Memo;
}

/**
 * Create a Solana Pay transfer transaction.
 *
 * @param connection - A connection to the cluster.
 * @param sender - Account that will send the transfer.
 * @param fields - Fields of a Solana Pay transfer request URL.
 * @param options - Options for `getRecentBlockhash`.
 *
 * @throws {CreateTransferError}
 */
export async function createTransfer(
    connection: Connection,
    sender: PublicKey,
    { recipient, amount, splToken, reference, memo }: CreateTransferFields,
    { commitment }: { commitment?: Commitment } = {}
): Promise<Transaction> {
    // Check that the sender is not the recipitent and that the sender accounts exist
    if (sender === recipient) throw new CreateTransferError('sender is also recipient');
    const senderInfo = await connection.getAccountInfo(sender);
    if (!senderInfo) throw new CreateTransferError('sender not found');

    // A native SOL or SPL token transfer instruction
    const instruction = splToken
        ? await createSPLTokenInstruction(recipient, amount, splToken, sender, connection)
        : await createSystemInstruction(recipient, amount, senderInfo, connection);

    // If reference accounts are provided, add them to the transfer instruction
    if (reference) {
        if (!Array.isArray(reference)) {
            reference = [reference];
        }

        for (const pubkey of reference) {
            instruction.keys.push({ pubkey, isWritable: false, isSigner: false });
        }
    }

    // Create the transaction
    const transaction = new Transaction();
    transaction.feePayer = sender;
    transaction.recentBlockhash = (await connection.getLatestBlockhash(commitment)).blockhash;

    // Check whether sender can pay for transaction fee
    const response = await connection.getFeeForMessage(transaction.compileMessage(), commitment);
    const feeInLamports = response.value || 5000; // Set the minimal transaction fee in case it was not fetch
    const lamportsNeeded = feeInLamports + (splToken ? 0 : convertAmountToLamports(amount));
    if (lamportsNeeded > senderInfo.lamports)
        throw new CreateTransferError('insufficient SOL funds to pay for transaction fee');

    // If a memo is provided, add it to the transaction before adding the transfer instruction
    if (memo != null) {
        transaction.add(
            new TransactionInstruction({
                programId: MEMO_PROGRAM_ID,
                keys: [],
                data: Buffer.from(memo, 'utf8'),
            })
        );
    }

    // Add the transfer instruction to the transaction
    transaction.add(instruction);

    return transaction;
}

async function createSystemInstruction(
    recipient: PublicKey,
    amount: BigNumber,
    senderInfo: AccountInfo<Buffer>,
    connection: Connection
): Promise<TransactionInstruction> {
    // Check that the sender is valid native accounts
    if (!senderInfo.owner.equals(SystemProgram.programId)) throw new CreateTransferError('sender owner invalid');
    if (senderInfo.executable) throw new CreateTransferError('sender executable');

    // Check that the recipient is valid native accounts
    const recipientInfo = await connection.getAccountInfo(recipient);
    if (!recipientInfo) throw new CreateTransferError('recipient not found');
    if (!recipientInfo.owner.equals(SystemProgram.programId)) throw new CreateTransferError('recipient owner invalid');
    if (recipientInfo.executable) throw new CreateTransferError('recipient executable');

    // Check that the amount provided doesn't have greater precision than SOL
    if ((amount.decimalPlaces() ?? 0) > SOL_DECIMALS) throw new CreateTransferError('amount decimals invalid');

    // Check that the sender has enough lamports
    const lamports = convertAmountToLamports(amount);
    if (lamports > senderInfo.lamports) throw new CreateTransferError('insufficient funds');

    // Create an instruction to transfer native SOL
    return SystemProgram.transfer({
        fromPubkey: senderInfo.owner,
        toPubkey: recipient,
        lamports,
    });
}

async function createSPLTokenInstruction(
    recipient: PublicKey,
    amount: BigNumber,
    splToken: PublicKey,
    sender: PublicKey,
    connection: Connection
): Promise<TransactionInstruction> {
    // Check that the token provided is an initialized mint
    const mint = await getMint(connection, splToken);
    if (!mint.isInitialized) throw new CreateTransferError('mint not initialized');

    // Check that the amount provided doesn't have greater precision than the mint
    if ((amount.decimalPlaces() ?? 0) > mint.decimals) throw new CreateTransferError('amount decimals invalid');

    // Convert input decimal amount to integer tokens according to the mint decimals
    amount = amount.times(TEN.pow(mint.decimals)).integerValue(BigNumber.ROUND_FLOOR);

    // Get the sender's ATA and check that the account exists and can send tokens
    const senderATA = await getAssociatedTokenAddress(splToken, sender);
    const senderAccount = await getAccount(connection, senderATA);
    if (!senderAccount.isInitialized) throw new CreateTransferError('sender not initialized');
    if (senderAccount.isFrozen) throw new CreateTransferError('sender frozen');

    // Get the recipient's ATA and check that the account exists and can receive tokens
    const recipientATA = await getAssociatedTokenAddress(splToken, recipient);
    const recipientAccount = await getAccount(connection, recipientATA);
    if (!recipientAccount.isInitialized) throw new CreateTransferError('recipient not initialized');
    if (recipientAccount.isFrozen) throw new CreateTransferError('recipient frozen');

    // Check that the sender has enough tokens
    const tokens = BigInt(String(amount));
    if (tokens > senderAccount.amount) throw new CreateTransferError('insufficient funds');

    // Create an instruction to transfer SPL tokens, asserting the mint and decimals match
    return createTransferCheckedInstruction(senderATA, splToken, recipientATA, sender, tokens, mint.decimals);
}

/**
 * Convert input decimal amount to integer lamports.
 *
 * @param amount - The decimal amount to convert.
 *
 * @return - The converted amount in integer lamports.
 */
function convertAmountToLamports(amount: BigNumber) {
    return amount.times(LAMPORTS_PER_SOL).integerValue(BigNumber.ROUND_FLOOR).toNumber();
}