
'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

declare global {
    interface Window {
        adsbygoogle: any;
    }
}

interface AdsenseProps {
    className?: string;
    style?: React.CSSProperties;
    client: string;
    slot: string;
    format?: 'auto' | 'fluid' | 'display';
    responsive?: boolean;
}

const Adsense: React.FC<AdsenseProps> = ({ 
    className, 
    style = { display: 'block' },
    client, 
    slot, 
    format = 'auto', 
    responsive = true 
}) => {

    const isDevMode = process.env.NODE_ENV === 'development';
    const adClient = isDevMode ? "ca-google-test" : client;
    const adSlot = isDevMode ? "3986429555" : slot;

    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error(err);
        }
    }, [adClient, adSlot]); // Re-run if client/slot changes, e.g., in dev mode

    if (!adClient || !adSlot || (!isDevMode && (adClient.includes("YOUR_") || adSlot.includes("YOUR_")))) {
        return (
            <div className="text-center p-4 bg-muted text-muted-foreground rounded-lg border border-dashed">
                Ad space. Please provide a valid AdSense client and slot ID in your .env file for production.
            </div>
        );
    }

    return (
        <div className={cn('relative', className)}>
            <ins
                className="adsbygoogle"
                style={style}
                data-ad-client={adClient}
                data-ad-slot={adSlot}
                data-ad-format={format}
                data-full-width-responsive={responsive ? "true" : "false"}
                data-ad-status="unfilled"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground rounded-lg border border-dashed text-center p-4 ad-placeholder">
                Advertisement
            </div>
            <style jsx>{`
              .adsbygoogle[data-ad-status='filled'] + .ad-placeholder {
                display: none;
              }
            `}</style>
        </div>
    );
};

export default Adsense;
