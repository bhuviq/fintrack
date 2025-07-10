'use client';

import { useEffect } from 'react';

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
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error(err);
        }
    }, []);

    if (!client || !slot) {
        return (
            <div className="text-center p-4 bg-muted text-muted-foreground rounded-lg">
                Ad space. Please provide a valid AdSense client and slot ID.
            </div>
        );
    }

    return (
        <div className={className}>
            <ins
                className="adsbygoogle"
                style={style}
                data-ad-client={client}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive ? "true" : "false"}
            />
        </div>
    );
};

export default Adsense;
