import React from 'react';
import { AnalysisOption, TabContentState, ImageAnalysisResult } from '../types';
import ImageUploader from './ImageUploader';
import AnalysisOptions from './AnalysisOptions';
import PromptOutput from './PromptOutput';
import { analyzeImage } from '../services/geminiService';

interface TabContentProps {
  tabId: string;
  contentState: TabContentState;
  onContentStateChange: (tabId: string, newState: Partial<TabContentState>) => void;
}

const TabContent: React.FC<TabContentProps> = ({ tabId, contentState, onContentStateChange }) => {
  // Destructure rawAnalysisResult instead of generatedPrompt
  const { uploadedImage, selectedOptions, rawAnalysisResult, isLoading, error, otherAnalysisText } = contentState;

  const handleImageUpload = (base64Image: string) => {
    // Clear rawAnalysisResult when new image is uploaded
    onContentStateChange(tabId, { uploadedImage: base64Image, rawAnalysisResult: null, error: null });
  };

  const handleOptionChange = (options: AnalysisOption[]) => {
    onContentStateChange(tabId, { selectedOptions: options });
  };

  const handleOtherAnalysisTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentStateChange(tabId, { otherAnalysisText: event.target.value });
  };

  const handleAnalyze = async (isDetailedRequest: boolean = false) => { // Added parameter
    if (!uploadedImage) {
      onContentStateChange(tabId, { error: '請先上傳圖片。' });
      return;
    }

    // Validate '其他' option with custom text
    if (selectedOptions.includes(AnalysisOption.OTHER) && !otherAnalysisText.trim()) {
      onContentStateChange(tabId, { error: '當選擇「其他」時，請輸入要分析的特定內容。' });
      return;
    }

    // Clear previous analysis results and set loading state
    onContentStateChange(tabId, { isLoading: true, error: null, rawAnalysisResult: null });
    try {
      const result: ImageAnalysisResult = await analyzeImage(uploadedImage, selectedOptions, otherAnalysisText, isDetailedRequest); // Pass isDetailedRequest
      // Store the structured result
      onContentStateChange(tabId, { rawAnalysisResult: result, error: null });
    } catch (e: any) {
      onContentStateChange(tabId, { error: e.message || '分析圖片時發生錯誤。' });
    } finally {
      onContentStateChange(tabId, { isLoading: false });
    }
  };

  const handleSetError = (errorMessage: string | null) => {
    onContentStateChange(tabId, { error: errorMessage });
  };

  const handleDeleteImage = () => {
    // Clear image, analysis result, and error when deleting image
    onContentStateChange(tabId, { uploadedImage: null, rawAnalysisResult: null, error: null });
  };

  const handleRefineDetailRequest = () => {
    // Trigger analyze with detailed request flag
    handleAnalyze(true);
  };

  const showOtherAnalysisInput = selectedOptions.includes(AnalysisOption.OTHER);

  return (
    <div className="p-6 bg-gray-900 rounded-b-lg shadow-xl border border-gray-700 flex flex-col flex-grow min-h-0" role="tabpanel" id={`panel-${tabId}`} aria-labelledby={`tab-${tabId}`}>
      {error && (
        <div className="bg-red-800 text-white p-3 rounded-md mb-4 flex items-center" role="alert">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-7-9a1 1 0 112 0 1 1 0 01-2 0zm5-3a1 1 0 112 0 1 1 0 01-2 0zM7 9a1 1 0 112 0 1 1 0 01-2 0zm5 3a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
          </svg>
          <p>{error}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
        <div className="flex flex-col space-y-4">
          <ImageUploader
            onImageUpload={handleImageUpload}
            imagePreview={uploadedImage}
            isLoading={isLoading}
            onSetError={handleSetError} // Pass error setter
            onDeleteImage={handleDeleteImage} // Pass delete handler
          />
          <AnalysisOptions
            selectedOptions={selectedOptions}
            onOptionChange={handleOptionChange}
            onAnalyze={() => handleAnalyze(false)} // Original analyze call (not detailed)
            isLoading={isLoading}
            imageUploaded={!!uploadedImage}
          />
          {showOtherAnalysisInput && (
            <div className="p-4 bg-gray-800 rounded-lg shadow-md">
              <label htmlFor="other-analysis-text" className="block text-sm font-medium text-gray-100 mb-2">
                其他分析內容
              </label>
              <textarea
                id="other-analysis-text"
                className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-gray-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-y custom-scrollbar"
                rows={3}
                placeholder="請輸入您想要模型分析的特定內容..."
                value={otherAnalysisText}
                onChange={handleOtherAnalysisTextChange}
                disabled={isLoading}
                aria-label="自定義分析內容輸入框"
              ></textarea>
            </div>
          )}
        </div>
        <PromptOutput
          rawAnalysisResult={rawAnalysisResult} // Pass structured analysis result
          isLoading={isLoading}
          error={error} // Pass error down to PromptOutput
          selectedOptions={selectedOptions} // Pass selected options
          otherAnalysisText={otherAnalysisText} // Pass other analysis text (for context if needed)
          onRefineDetailRequest={handleRefineDetailRequest} // Pass the new detailed request handler
        />
      </div>
    </div>
  );
};

export default TabContent;