import React, { useState, useCallback, useRef, useEffect } from 'react';
import Cropper from 'react-easy-crop';

// Utility function to get a cropped image from a canvas
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // Needed for cross-origin images
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0, // Keep rotation parameter, default to 0
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context for canvas');
  }

  const rotRad = rotation * (Math.PI / 180);

  // calculate bounding box for the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas origin to the center of the image
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(1, 1); // Maintain original scale
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image on canvas
  ctx.drawImage(image, 0, 0);

  // extract cropped area
  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

  // set canvas size to the cropped dimensions
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // put the cropped data into the new canvas
  ctx.putImageData(data, 0, 0);

  // return the cropped image as a base64 string
  return new Promise((resolve) => {
    // `toDataURL` returns the data URL directly and does not accept a callback.
    resolve(canvas.toDataURL('image/jpeg', 0.95));
  });
}

// Rotates a size around its center
const rotateSize = (width: number, height: number, rotation: number) => {
  const rotRad = rotation * (Math.PI / 180);

  return {
    width:
      Math.abs(width * Math.cos(rotRad)) + Math.abs(height * Math.sin(rotRad)),
    height:
      Math.abs(width * Math.sin(rotRad)) + Math.abs(height * Math.cos(rotRad)),
  };
};


interface ImageCropperModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedImageBase64: string) => void;
  onSetError: (error: string | null) => void;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ imageSrc, onClose, onCropComplete, onSetError }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  // Removed rotation state and related functionality as requested
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropAspect, setCropAspect] = useState<number | undefined>(undefined); // New state for aspect ratio control

  // Removed states to display current crop dimensions as requested
  // const [displayCropWidth, setDisplayCropWidth] = useState<number | null>(null);
  // const [displayCropHeight, setDisplayCropHeight] = useState<number | null>(null);

  // Reset crop/zoom/rotation when imageSrc changes
  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropAspect(undefined); // Reset aspect ratio as well
    // Removed display crop dimensions reset
    // setDisplayCropWidth(null);
    // setDisplayCropHeight(null);
  }, [imageSrc]);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  // Removed onRotationChange as requested
  // const onRotationChange = useCallback((rotation: number) => {
  //   setRotation(rotation);
  // }, []);

  const onCropAreaChange = useCallback((_croppedArea: any, newCroppedAreaPixels: any) => {
    setCroppedAreaPixels(newCroppedAreaPixels);
    // Removed display logic as requested
    // if (newCroppedAreaPixels) {
    //   setDisplayCropWidth(Math.round(newCroppedAreaPixels.width));
    //   setDisplayCropHeight(Math.round(newCroppedAreaPixels.height));
    // }
  }, []);

  const handleCropClick = async () => {
    if (!croppedAreaPixels || !imageSrc || croppedAreaPixels.width === 0 || croppedAreaPixels.height === 0) {
      onSetError('請選擇裁剪區域。');
      return;
    }
    setIsCropping(true);
    onSetError(null);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, 0); // Pass 0 for rotation since control is removed
      onCropComplete(croppedImage);
      onClose();
    } catch (e: any) {
      console.error('裁剪圖片失敗:', e);
      onSetError(`裁剪圖片失敗: ${e.message || '未知錯誤'}`);
    } finally {
      setIsCropping(false);
    }
  };

  const handleAspectChange = useCallback((aspect: number | undefined) => {
    setCropAspect(aspect);
  }, []);

  // Removed currentAspectRatio calculation as requested
  // const currentAspectRatio =
  //   displayCropWidth && displayCropHeight
  //     ? (displayCropWidth / displayCropHeight).toFixed(2)
  //     : 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100">裁剪圖片</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 transition-colors duration-200"
            aria-label="關閉裁剪"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative flex-grow bg-gray-900 min-h-[300px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            // Removed rotation prop as requested
            // rotation={rotation}
            aspect={cropAspect} // Use the new cropAspect state
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            // Removed onRotationChange as requested
            // onRotationChange={onRotationChange}
            onCropComplete={onCropAreaChange}
            restrictPosition={false} // Explicitly set to false to allow cropping outside image boundaries
            showGrid={true}
            cropShape="rect" // 'rect' or 'round'
            classes={{
              containerClassName: 'bg-gray-900',
              mediaClassName: 'object-contain',
              cropAreaClassName: 'border-white border-2 border-dashed',
            }}
          />
        </div>

        <div className="flex flex-col p-4 border-t border-gray-700 space-y-3">
          {/* Display Zoom Ratio */}
          <div className="flex items-center space-x-4">
            <span className="text-gray-300 w-20 shrink-0 text-right">縮放:</span>
            <span className="text-gray-100 font-medium">{Math.round(zoom * 100)}%</span>
            {/* Zoom slider removed as requested */}
          </div>

          {/* Removed Display Crop Dimensions and Aspect Ratio as requested */}
          {/* <div className="flex items-center space-x-4">
            <span className="text-gray-300 w-20 shrink-0 text-right">裁剪區域:</span>
            <span className="text-gray-100 font-medium">
              {displayCropWidth !== null && displayCropHeight !== null
                ? `${displayCropWidth}x${displayCropHeight} (寬高比: ${currentAspectRatio})`
                : '請選擇區域'}
            </span>
          </div> */}

          {/* Removed Rotation Slider as requested */}
          {/* <div className="flex items-center space-x-4">
            <label htmlFor="rotation-slider" className="text-gray-300 w-20 shrink-0 text-right">旋轉:</label>
            <input
              id="rotation-slider"
              type="range"
              value={rotation}
              min={0}
              max={360}
              step={1}
              onChange={(e) => onRotationChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"
              aria-label="旋轉圖片"
            />
            <span className="text-gray-100 font-medium w-10 text-right">{Math.round(rotation)}°</span>
          </div> */}

          {/* Aspect Ratio Buttons (Chop Feature) */}
          <div className="flex flex-col space-y-2">
            <span className="text-gray-300 font-medium text-sm">選擇比例:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAspectChange(undefined)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200
                          ${cropAspect === undefined ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                aria-label="自由比例"
              >
                自由比例
              </button>
              <button
                onClick={() => handleAspectChange(1 / 1)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200
                          ${cropAspect === 1 / 1 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                aria-label="1比1比例"
              >
                1:1
              </button>
              <button
                onClick={() => handleAspectChange(16 / 9)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200
                          ${cropAspect === 16 / 9 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                aria-label="16比9比例"
              >
                16:9
              </button>
              <button
                onClick={() => handleAspectChange(9 / 16)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200
                          ${cropAspect === 9 / 16 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                aria-label="9比16比例"
              >
                9:16
              </button>
              <button
                onClick={() => handleAspectChange(4 / 3)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200
                          ${cropAspect === 4 / 3 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                aria-label="4比3比例"
              >
                4:3
              </button>
              <button
                onClick={() => handleAspectChange(3 / 4)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200
                          ${cropAspect === 3 / 4 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                aria-label="3比4比例"
              >
                3:4
              </button>
            </div>
          </div>

          <button
            onClick={handleCropClick}
            disabled={isCropping}
            className={`w-full px-5 py-2 rounded-md font-semibold text-white transition-colors duration-200
                        ${isCropping ? 'bg-blue-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            aria-label="確認裁剪"
          >
            {isCropping ? '裁剪中...' : '裁剪'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;