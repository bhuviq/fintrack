
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
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
    const [user, setUser] = useState<User | null>(null);
    const [adStatus, setAdStatus] = useState<'unfilled' | 'filled' | 'loading'>('loading');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const isDevMode = process.env.NODE_ENV === 'development';
    const adClient = isDevMode ? "ca-google-test" : client;
    const adSlot = isDevMode ? "3986429555" : slot;

    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error(err);
        }
    }, [adClient, adSlot]);

    // Observer to check if the ad has been filled
    useEffect(() => {
        const adElement = document.querySelector(`ins[data-ad-slot='${adSlot}']`);
        if (!adElement) return;

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'data-ad-status') {
                    const newStatus = adElement.getAttribute('data-ad-status');
                    if (newStatus === 'filled') {
                        setAdStatus('filled');
                        observer.disconnect(); // Stop observing once filled
                    }
                }
            }
        });

        observer.observe(adElement, { attributes: true });

        // Fallback timeout in case the status never changes to 'filled'
        const timeout = setTimeout(() => {
            if (adElement.getAttribute('data-ad-status') !== 'filled') {
                setAdStatus('unfilled');
            }
            observer.disconnect();
        }, 3000); // 3-second timeout

        return () => {
            observer.disconnect();
            clearTimeout(timeout);
        };
    }, [adSlot]);


    const showPlaceholder = user?.email === 'bhuvnesh.pattnaik@gmail.com';
    const hideContainer = adStatus === 'unfilled' && !showPlaceholder;
    
    if (hideContainer) {
        return null;
    }

    if (!adClient || !adSlot || (!isDevMode && (adClient.includes("YOUR_") || adSlot.includes("YOUR_")))) {
        if (!showPlaceholder) return null;
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
            />
            {showPlaceholder && (
                 <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground rounded-lg border border-dashed text-center p-4 ad-placeholder">
                    Advertisement
                </div>
            )}
             <style jsx>{`
              .adsbygoogle[data-ad-status='filled'] + .ad-placeholder {
                display: none;
              }
            `}</style>
        </div>
    );
};

export default Adsense;
