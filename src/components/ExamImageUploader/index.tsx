// src/components/ExamImageUploader.tsx
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react';
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';

interface ExamImageUploaderProps {
    value: string[]; // mảng URL ảnh
    onChange: (urls: string[]) => void;
}

export default function ExamImageUploader({ value = [], onChange }: ExamImageUploaderProps) {
    const { upload } = useCloudinaryUpload();

    const handleUpload = () => {
        upload(
            (newUrls) => {
                onChange([...value, ...newUrls]);
            },
            { multiple: true }
        );
    };

    const removeImage = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <Button type="button" onClick={handleUpload} variant="outline" className="w-full">
                <ImagePlus className="w-4 h-4 mr-2" />
                Tải lên ảnh bài làm (chụp từ điện thoại)
            </Button>

            {value.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {value.map((url, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border">
                            <img src={url} alt={`Bài làm ${idx + 1}`} className="w-full h-64 object-cover" />
                            <button
                                onClick={() => removeImage(idx)}
                                className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-center py-1 text-sm">
                                Ảnh {idx + 1}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {value.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <ImagePlus className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-500">Chưa có ảnh nào được tải lên</p>
                </div>
            )}
        </div>
    );
}
