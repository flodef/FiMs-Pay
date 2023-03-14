import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { createURLWithQuery, getBaseURL } from '../utils/createURLWithQuery';

export function useNavigate() {
    const router = useRouter();
    const { query } = router;

    return useCallback(
        (pathname?: string, replace = false) => {
            if (pathname?.includes('://')) {
                window.open(pathname, replace ? '' : '_blank');
            } else {
                const url = pathname ? String(createURLWithQuery(pathname, query)) : getBaseURL();
                if (replace) {
                    router.replace(url);
                } else {
                    router.push(url);
                }
            }
        },
        [query, router]
    );
}
