// src/hooks/useCloudinaryUpload.ts
import { useCallback } from 'react';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '@/lib/cloudinary';

declare global {
    interface Window {
        cloudinary: any;
    }
}

export const useCloudinaryUpload = () => {
    const upload = useCallback(
        (
            onSuccess: (urls: string[]) => void,
            options?: {
                multiple?: boolean;
                maxFiles?: number;
                folder?: string;
            }
        ) => {
            if (!window.cloudinary) {
                alert('Đang tải Cloudinary, vui lòng thử lại trong giây lát...');
                return;
            }

            window.cloudinary.openUploadWidget(
                {
                    cloudName: CLOUDINARY_CLOUD_NAME,
                    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
                    sources: ['local', 'camera', 'url', 'google_photos', 'dropbox'],
                    multiple: options?.multiple ?? true,
                    maxFiles: options?.maxFiles ?? 10,
                    folder: options?.folder,
                    clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp', 'pdf'],
                    cropping: false,
                    showAdvancedOptions: false,
                    showInsecurePreview: false,
                    googleApiKey: '',
                    styles: {
                        palette: {
                            window: '#FFFFFF',
                            sourceBg: '#F5F5F5',
                            windowBorder: '#90a0b3',
                            tabIcon: '#0078FF',
                            inactiveTabIcon: '#999999',
                            textDark: '#000000',
                            link: '#0078FF',
                        },
                    },
                },
                (error: any, result: any) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        return;
                    }

                    if (result.event === 'success') {
                        const newUrl = result.info.secure_url;
                        if (options?.multiple) {
                            onSuccess([newUrl]);
                        } else {
                            onSuccess([newUrl]);
                        }
                    }
                }
            );
        },
        []
    );

    return { upload };
};
