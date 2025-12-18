import React from 'react';
import ImageCropperModal from './ImageCropperModal'; // Import the new Cropper Modal

interface ImageUploaderProps {
  onImageUpload: (base64Image: string) => void;
  imagePreview: string | null;
  isLoading: boolean;
  onSetError: (error: string | null) => void; // Added for error reporting
  onDeleteImage: () => void; // New prop for deleting the image
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imagePreview, isLoading, onSetError, onDeleteImage }) => {
  const [isProcessingPaste, setIsProcessingPaste] = React.useState(false); // New state for paste operations
  const [urlInput, setUrlInput] = React.useState(''); // New state for URL input box
  const [isUrlLoading, setIsUrlLoading] = React.useState(false); // New state for URL loading
  const [fileInputKey, setFileInputKey] = React.useState(Date.now()); // State to force re-render/reset file input

  // States for image cropping
  const [showCropper, setShowCropper] = React.useState(false);
  const [imageToCropUrl, setImageToCropUrl] = React.useState<string | null>(null);

  // currentLoading now only reflects actual processing, not if cropper is open
  const currentLoading = isLoading || isProcessingPaste || isUrlLoading;

  const processFile = (file: File): Promise<void> => {
    onSetError(null); // Clear previous errors
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Immediately call onImageUpload with the full image
          onImageUpload(reader.result);
          resolve();
        } else {
          reject(new Error('檔案讀取失敗，無法轉換為 Base64。'));
        }
      };
      reader.onerror = () => {
        reject(new Error('檔案讀取失敗。'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessingPaste(true); // Treat file input as a paste operation visually for consistency
      try {
        await processFile(file);
      } catch (e: any) {
        onSetError(e.message || '上傳檔案時發生錯誤。');
      } finally {
        setIsProcessingPaste(false);
      }
    }
    // Reset the input value after selection, so same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  const isValidImageUrl = (text: string): boolean => {
    try {
      const url = new URL(text);
      const path = url.pathname.toLowerCase();
      // Check for common image file extensions and ensure it's not just a domain
      return /\.(jpeg|jpg|png|gif|webp|bmp|svg)(\?.*)?$/.test(path) && url.hostname.length > 0;
    } catch {
      return false;
    }
  };

  const fetchImageFromUrl = async (url: string): Promise<void> => {
    onSetError(null);
    try {
      setIsUrlLoading(true); // Start URL specific loading
      const response = await fetch(url, { mode: 'cors' }); // Attempt CORS mode for cross-origin requests
      if (!response.ok) {
        throw new Error(`無法從 URL 載入圖片：${response.status} ${response.statusText || '網路錯誤'}`);
      }
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error('URL 指向的不是一個有效的圖片檔案。');
      }
      const blob = await response.blob();
      // Reuse processFile by creating a File object from the Blob
      await processFile(new File([blob], 'pasted_image', { type: blob.type }));
      setUrlInput(''); // Clear URL input on success
    } catch (error: any) {
      console.error('Error fetching image from URL:', error);
      throw new Error(`載入圖片失敗: ${error.message}.`);
    } finally {
      setIsUrlLoading(false); // End URL specific loading
    }
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    onSetError(null); // Clear previous errors immediately on paste attempt
    event.preventDefault(); // Always prevent default behavior for this controlled area

    // Prevent pasting if an image is already uploaded or loading
    if (currentLoading || imagePreview) {
      if (imagePreview) {
        onSetError('已有圖片上傳，請先刪除現有圖片再貼上新圖片。');
      }
      return;
    }

    setIsProcessingPaste(true); // Start general paste loading

    try {
      const clipboardText = event.clipboardData.getData('text/plain');
      const imageFileItem = Array.from(event.clipboardData.items).find(
        (item: DataTransferItem) => item.kind === 'file' && item.type.startsWith('image/')
      );

      if (imageFileItem) {
        const file = (imageFileItem as DataTransferItem).getAsFile();
        if (file) {
          await processFile(file); // This calls onImageUpload
        } else {
          throw new Error('無法從剪貼簿獲取圖片檔案。');
        }
      } else if (clipboardText && isValidImageUrl(clipboardText)) {
        // Case 2: Pasting an image URL onto the main label area
        await fetchImageFromUrl(clipboardText); // This calls onImageUpload
      } else {
        // Case 3: Neither image file nor image URL
        onSetError('剪貼簿中沒有偵測到圖片檔案或有效圖片URL。');
      }
    } catch (e: any) {
      onSetError(e.message || '貼上時發生未知錯誤。');
    } finally {
      setIsProcessingPaste(false); // End loading
    }
  };

  const handleUrlLoadClick = async () => {
    if (!urlInput.trim()) {
      onSetError('請輸入圖片 URL。');
      return;
    }
    if (!isValidImageUrl(urlInput.trim())) {
      onSetError('無效的圖片 URL 格式。請確保它指向一個圖片檔案。');
      return;
    }
    if (currentLoading) {
      return;
    }

    try {
      await fetchImageFromUrl(urlInput.trim());
    } catch (e: any) {
      onSetError(e.message || '載入 URL 圖片時發生錯誤。');
    }
  };

  const handleDeleteImageAndResetInput = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent triggering other handlers on parent elements
    onDeleteImage(); // Clears the image preview in parent
    setFileInputKey(Date.now()); // Force the file input to re-mount/reset
    // Also reset cropper states
    setShowCropper(false);
    setImageToCropUrl(null);
  };

  const handleOpenCropper = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent triggering other handlers
    if (imagePreview) {
      setImageToCropUrl(imagePreview);
      setShowCropper(true);
      onSetError(null); // Clear any existing errors before cropping
    }
  };

  const handleCropComplete = (croppedImageBase64: string) => {
    onImageUpload(croppedImageBase64); // Pass the cropped image to the parent
    setShowCropper(false);
    setImageToCropUrl(null);
  };

  const handleCropperClose = () => {
    setShowCropper(false);
    setImageToCropUrl(null);
    onSetError(null); // Clear any errors when cropper is closed
  }

  return (
    <>
      <div // Main container for uploader section
        className="flex flex-col items-center p-4 bg-gray-800 rounded-lg shadow-md"
        onPaste={handlePaste} // Move paste handler to the main container
      >
        {/* Conditional rendering based on imagePreview */}
        {imagePreview ? (
          // Display area when image is uploaded
          <div className="w-full flex flex-col items-center">
            <img src={imagePreview} alt="Uploaded preview" className="max-w-full h-auto max-h-64 object-contain rounded-md mb-4 relative" />
            <div className="flex space-x-2 justify-center mb-4"> {/* Buttons below the image */}
              <button
                onClick={handleOpenCropper}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 shadow-md transition-colors duration-200"
                aria-label="裁剪圖片"
                title="裁剪圖片"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.135a4 4 0 000-5.656l-4-4a4 4 0 00-5.656 0l-1.102 1.101zm-.757 4.135l4-4M10 13l4-4" />
                </svg>
              </button>
              <button
                onClick={handleDeleteImageAndResetInput}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md transition-colors duration-200"
                aria-label="刪除已上傳圖片"
                title="刪除圖片"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-400">圖片已上傳</p>
          </div>
        ) : (
          // Upload prompt area when no image is uploaded (wrapped by label)
          <>
            <label
              htmlFor="image-upload"
              className={`w-full cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors duration-200
                       ${currentLoading ? 'bg-gray-700 cursor-not-allowed' : 'hover:border-blue-500 hover:bg-gray-700 border-gray-600'}`}
              aria-disabled={currentLoading}
            >
              <input
                key={fileInputKey}
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={currentLoading}
                aria-label="上傳圖片文件"
              />
              <div className="text-center">
                {currentLoading ? (
                  <span className="flex items-center justify-center text-blue-400">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    處理中...
                  </span>
                ) : (
                  <svg
                    className="mx-auto h-12 w-12 text-gray-500"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                <p className="mt-2 text-sm text-gray-400">
                  <span className="font-semibold text-blue-400">點擊上傳圖片</span>, 拖放, 或貼上圖片 (Ctrl+V)
                </p>
                <p className="text-xs text-gray-500">支援 JPG, PNG, GIF, WebP, BMP, SVG 檔案格式，最大 10MB</p>
              </div>
            </label>

            {/* URL Input Box, always outside the label (when no image is present) */}
            <div className="w-full mt-4 p-2 bg-gray-700 rounded-md">
              <label htmlFor="image-url-input" className="sr-only">圖片 URL</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="image-url-input"
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="或輸入圖片 URL 並載入"
                  className="flex-grow p-2 border border-gray-600 rounded-md bg-gray-800 text-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  disabled={currentLoading}
                  aria-label="圖片 URL 輸入框"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && urlInput.trim() && !currentLoading) {
                      e.preventDefault();
                      handleUrlLoadClick();
                    }
                  }}
                />
                <button
                  onClick={handleUrlLoadClick}
                  disabled={currentLoading || !urlInput.trim()}
                  className={`px-4 py-2 rounded-md font-semibold text-white transition-colors duration-200 shrink-0
                             ${currentLoading || !urlInput.trim()
                                 ? 'bg-gray-600 cursor-not-allowed'
                                 : 'bg-blue-600 hover:bg-blue-700'
                             }`}
                  aria-label="載入 URL 圖片"
                >
                  {isUrlLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      載入中...
                    </span>
                  ) : (
                    '載入 URL 圖片'
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showCropper && imageToCropUrl && (
        <ImageCropperModal
          imageSrc={imageToCropUrl}
          onClose={handleCropperClose}
          onCropComplete={handleCropComplete}
          onSetError={onSetError}
        />
      )}
    </>
  );
};

export default ImageUploader;