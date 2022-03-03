import { createTransferCheckedInstruction, getAccount, getAssociatedTokenAddress, getMint } from '@solana/spl-token';
import {
    Commitment,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { MEMO_PROGRAM_ID, SOL_DECIMALS, TEN } from './constants';
import { Amount, Memo, Recipient, References, SPLToken } from './types';

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
    // A native SOL or SPL token transfer instruction
    const instruction = splToken
        ? await createSPLTokenInstruction(connection, sender, recipient, amount, splToken)
        : await createSystemInstruction(connection, sender, recipient, amount);

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
    transaction.recentBlockhash = (await connection.getRecentBlockhash(commitment)).blockhash;

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
    connection: Connection,
    sender: PublicKey,
    recipient: PublicKey,
    amount: BigNumber
): Promise<TransactionInstruction> {
    // Check that the amount provided doesn't have greater precision than SOL
    if (amount.decimalPlaces() > SOL_DECIMALS) throw new CreateTransferError('amount decimals invalid');

    // Convert input decimal amount to integer lamports
    amount = amount.times(LAMPORTS_PER_SOL).integerValue(BigNumber.ROUND_FLOOR);

    // Create an instruction to transfer native SOL
    return SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: recipient,
        lamports: amount.toNumber(),
    });
}

async function createSPLTokenInstruction(
    connection: Connection,
    sender: PublicKey,
    recipient: PublicKey,
    amount: BigNumber,
    splToken: PublicKey
): Promise<TransactionInstruction> {
    // Check that the token provided is an initialized mint
    const mint = await getMint(connection, splToken);
    if (!mint.isInitialized) throw new CreateTransferError('mint not initialized');

    // Check that the amount provided doesn't have greater precision than the mint
    if (amount.decimalPlaces() > mint.decimals) throw new CreateTransferError('amount decimals invalid');

    // Convert input decimal amount to integer tokens according to the mint decimals
    amount = amount.times(TEN.pow(mint.decimals)).integerValue(BigNumber.ROUND_FLOOR);
    const tokens = BigInt(String(amount));

    // Get the sender and recipient ATAs
    const senderATA = await getAssociatedTokenAddress(splToken, sender);
    const recipientATA = await getAssociatedTokenAddress(splToken, recipient);

    // Create an instruction to transfer SPL tokens, asserting the mint and decimals match
    return createTransferCheckedInstruction(senderATA, splToken, recipientATA, sender, tokens, mint.decimals);
}
