import { TEN } from '@solana/pay/src/constants';
import { CreateTransferError } from '@solana/pay/src/createTransfer';
import {
    Account,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    createTransferCheckedInstruction,
    getAccount,
    getAssociatedTokenAddress,
    getMint,
    TokenAccountNotFoundError,
} from '@solana/spl-token';
import { PublicKey, Transaction } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { NextApiHandler } from 'next';
import { connection, FEE_PAYER, NFT_MINT, RECIPIENT, SECRET_KEYPAIR, SPL_TOKEN } from '../../../core';
import { cors, rateLimit } from '../../../middleware';

interface GetResponse {
    label: string;
    icon: string;
}

const get: NextApiHandler<GetResponse> = async (request, response) => {
    response.status(200).send({
        label: 'Atlas Cafe',
        // FIXME: get this icon, maybe a PNG
        icon: `https://${request.headers.host}/atlas-cafe.svg`,
    });
};

interface PostResponse {
    transaction: string;
    message?: string;
}

const post: NextApiHandler<PostResponse> = async (request, response) => {
    // Amount provided in the transaction request URL
    const amountField = request.query.amount;
    if (!amountField) throw new Error('missing amount');
    if (typeof amountField !== 'string') throw new Error('invalid amount');
    if (!/^\d+(\.\d+)?$/.test(amountField)) throw new Error('invalid amount');
    let amount = new BigNumber(amountField);

    // Account provided in the transaction request body by the wallet
    const accountField = request.body?.account;
    if (!accountField) throw new Error('missing account');
    if (typeof accountField !== 'string') throw new Error('invalid account');
    const account = new PublicKey(accountField);

    // 1. Check for existence of NFT, add mint instruction if not found
    // 2. Discount the amount, set message to note discount
    // 3. Push message to the client
    // 4. Add transfer instruction
    // 5. Serialize the transaction
    // 6. Sign the transaction

    // Check that the token provided is an initialized mint
    const mint = await getMint(connection, SPL_TOKEN);
    if (!mint.isInitialized) throw new CreateTransferError('mint not initialized');

    // Check that the amount provided doesn't have greater precision than the mint
    if (amount.decimalPlaces() > mint.decimals) throw new CreateTransferError('amount decimals invalid');

    // Get the sender's ATA and check that the account exists and can send tokens
    const senderATA = await getAssociatedTokenAddress(SPL_TOKEN, account);
    const senderAccount = await getAccount(connection, senderATA);
    if (!senderAccount.isInitialized) throw new CreateTransferError('sender not initialized');
    if (senderAccount.isFrozen) throw new CreateTransferError('sender frozen');

    // Get the recipient's ATA and check that the account exists and can receive tokens
    const recipientATA = await getAssociatedTokenAddress(SPL_TOKEN, RECIPIENT);
    const recipientAccount = await getAccount(connection, recipientATA);
    if (!recipientAccount.isInitialized) throw new CreateTransferError('recipient not initialized');
    if (recipientAccount.isFrozen) throw new CreateTransferError('recipient frozen');

    // Calculate the decimal amount of the discount
    const discount = amount.times('0.20');
    const message = `You saved $${discount.toFormat(2)}!`;

    // Discount the decimal amount and convert to integer tokens according to the mint decimals
    amount = amount.minus(discount).times(TEN.pow(mint.decimals)).integerValue(BigNumber.ROUND_FLOOR);

    // Check that the sender has enough tokens
    const tokens = BigInt(String(amount));
    if (tokens > senderAccount.amount) throw new CreateTransferError('insufficient funds');

    // I am an empty vessel.
    let transaction = new Transaction();

    // Check if the account has an ATA for the NFT.
    const nftATA = await getAssociatedTokenAddress(SPL_TOKEN, NFT_MINT);
    let nftAccount: Account | undefined;
    try {
        nftAccount = await getAccount(connection, nftATA);
    }
    catch (error) {
        // If the ATA doesn't exist, we're going to create it.
        if (!(error instanceof TokenAccountNotFoundError)) throw error;
    }

    // If the account has no ATA for the NFT, create it and mint to it.
    if (!nftAccount) {
        transaction.add(
            createAssociatedTokenAccountInstruction(
                FEE_PAYER,
                nftATA,
                account,
                NFT_MINT,
            ),
            createMintToInstruction(NFT_MINT, nftATA, FEE_PAYER, 1),
        );
    }
    else {
        // If the ATA exists, check that it can receive tokens.
        if (!nftAccount.isInitialized) throw new CreateTransferError('nft account not initialized');
        if (nftAccount.isFrozen) throw new CreateTransferError('nft account frozen');

        // If the account has the ATA but has transferred the NFT, mint another one to it.
        if (!nftAccount.amount) {
            transaction.add(createMintToInstruction(NFT_MINT, nftATA, FEE_PAYER, 1));
        }
    }

    // Create an instruction to transfer SPL tokens, asserting the mint and decimals match
    transaction.add(createTransferCheckedInstruction(senderATA, SPL_TOKEN, recipientATA, account, tokens, mint.decimals));

    // Set the fee payer and recent blockhash before serialization. Getting the blockhash should be the last async operation.
    transaction.feePayer = FEE_PAYER;
    transaction.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash;

    // Serialize and deserialize the transaction. This ensures consistent ordering of the account keys for signing.
    transaction = Transaction.from(
        transaction.serialize({
            verifySignatures: false,
            requireAllSignatures: false,
        })
    );

    // Sign the transaction to pay the fees, authorize the NFT mint, and pay for the NFT.
    transaction.partialSign(SECRET_KEYPAIR);

    const signature = transaction.signatures[0].signature;
    if (!signature) throw new Error('signature missing');
    // FIXME: push signature to client

    // Serialize and return the signed transaction.
    const serialized = transaction.serialize({
        verifySignatures: false,
        requireAllSignatures: false,
    });
    const base64 = serialized.toString('base64');

    response.status(200).send({ transaction: base64, message });
};

const pay: NextApiHandler<GetResponse | PostResponse> = async (request, response) => {
    await cors(request, response);
    await rateLimit(request, response);

    if (request.method === 'GET') return get(request, response);
    if (request.method === 'POST') return post(request, response);

    response.status(405);
    throw new Error(`Unexpected method ${request.method}`);
};

export default pay;
