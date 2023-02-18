import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html style={{ visibility: 'hidden' }}>
            <Head>
                <meta name="google-site-verification" content="MsiwZHuFSJ2SGGT-MzDAiPwWZmK2F0PiLWwOsHb78Ck" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
