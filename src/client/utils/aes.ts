export async function encrypt(message: string, password: string, iterations = 500000) {
    const iterationsHash = btoa(iterations.toString());

    const msg = new TextEncoder().encode(message);

    const pass = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        {
            name: 'PBKDF2',
        },
        false,
        ['deriveBits']
    );

    const salt = crypto.getRandomValues(new Uint8Array(32));
    const saltHash = btoa(
        Array.from(new Uint8Array(salt))
            .map((val) => {
                return String.fromCharCode(val);
            })
            .join('')
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ivHash = btoa(
        Array.from(new Uint8Array(iv))
            .map((val) => {
                return String.fromCharCode(val);
            })
            .join('')
    );

    const bits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: iterations,
            hash: {
                name: 'SHA-256',
            },
        },
        pass,
        512
    );

    const aesBits = bits.slice(32, 64);
    const aesKey = await crypto.subtle.importKey(
        'raw',
        aesBits,
        {
            name: 'AES-GCM',
        },
        false,
        ['encrypt']
    );

    const hmacBits = bits.slice(0, 32);
    const hmacKey = await crypto.subtle.importKey(
        'raw',
        hmacBits,
        {
            name: 'HMAC',
            hash: {
                name: 'SHA-256',
            },
        },
        false,
        ['sign']
    );

    const enc = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        aesKey,
        msg
    );

    const encHash = btoa(
        Array.from(new Uint8Array(enc))
            .map((val) => {
                return String.fromCharCode(val);
            })
            .join('')
    );

    const encrypted = iterationsHash + '.' + saltHash + '.' + ivHash + '.' + encHash;

    const sigData = new TextEncoder().encode(encrypted);
    const signature = await crypto.subtle.sign(
        {
            name: 'HMAC',
        },
        hmacKey,
        sigData
    );

    const sigHash = btoa(
        Array.from(new Uint8Array(signature))
            .map((val) => {
                return String.fromCharCode(val);
            })
            .join('')
    );

    return encrypted + '.' + sigHash;
}

export async function decrypt(encrypted: string, password: string) {
    const parts = encrypted.split('.');

    const rounds = parseInt(atob(parts[0]));

    const salt = new Uint8Array(
        atob(parts[1])
            .split('')
            .map((val) => {
                return val.charCodeAt(0);
            })
    );

    const iv = new Uint8Array(
        atob(parts[2])
            .split('')
            .map((val) => {
                return val.charCodeAt(0);
            })
    );

    const enc = new Uint8Array(
        atob(parts[3])
            .split('')
            .map((val) => {
                return val.charCodeAt(0);
            })
    );

    const sig = new Uint8Array(
        atob(parts[4])
            .split('')
            .map((val) => {
                return val.charCodeAt(0);
            })
    );

    const pass = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        {
            name: 'PBKDF2',
        },
        false,
        ['deriveBits']
    );

    const bits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: rounds,
            hash: {
                name: 'SHA-256',
            },
        },
        pass,
        512
    );

    const aesBits = bits.slice(32, 64);
    const aesKey = await crypto.subtle.importKey(
        'raw',
        aesBits,
        {
            name: 'AES-GCM',
        },
        false,
        ['decrypt']
    );

    const hmacBits = bits.slice(0, 32);
    const hmacKey = await crypto.subtle.importKey(
        'raw',
        hmacBits,
        {
            name: 'HMAC',
            hash: {
                name: 'SHA-256',
            },
        },
        false,
        ['verify']
    );

    const sigData = new TextEncoder().encode(encrypted.split('.').slice(0, 4).join('.'));
    const verified = await crypto.subtle.verify(
        {
            name: 'HMAC',
        },
        hmacKey,
        sig,
        sigData
    );

    if (!verified) {
        return Promise.reject({
            error: 'Signature does not match.',
        });
    }

    const dec = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        aesKey,
        enc
    );
    return new TextDecoder().decode(dec);
}
