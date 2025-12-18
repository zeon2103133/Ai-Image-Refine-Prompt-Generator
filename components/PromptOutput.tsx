import React from 'react';
import { AnalysisOption, ImageAnalysisResult } from '../types';

interface PromptOutputProps {
  rawAnalysisResult: ImageAnalysisResult | null; // Changed prop name and type to ImageAnalysisResult
  isLoading: boolean;
  error: string | null;
  selectedOptions: AnalysisOption[]; // Added to determine prefix
  otherAnalysisText: string; // Added for context if 'OTHER' is used, though primarily using rawAnalysisResult now
  onRefineDetailRequest: () => void; // New prop for detailed request button
}

const PromptOutput: React.FC<PromptOutputProps> = ({ rawAnalysisResult, isLoading, error, selectedOptions, onRefineDetailRequest }) => {
  const generateFullRefinePrompt = (analysisData: ImageAnalysisResult | null, options: AnalysisOption[]): string => {
    if (!analysisData) return ''; // Return empty if no analysis result yet

    let prefix = '';
    const descriptionParts: string[] = [];

    const isSingleOptionSelected = options.length === 1 && options[0] !== AnalysisOption.OTHER;
    const isOtherSelectedAlone = options.length === 1 && options[0] === AnalysisOption.OTHER;
    const isMultipleOptionsSelected = options.length > 1;
    const isNoOptionSelected = options.length === 0;

    if (isSingleOptionSelected) {
      const singleOption = options[0];
      switch (singleOption) {
        case AnalysisOption.CHARACTER_ATTIRE:
          prefix = "把圖中人物的裝束換成";
          if (analysisData.characterAttire) descriptionParts.push(analysisData.characterAttire);
          break;
        case AnalysisOption.CHARACTER_POSE:
          prefix = "把圖中人物的姿勢/動態換成";
          if (analysisData.characterPose) descriptionParts.push(analysisData.characterPose);
          break;
        case AnalysisOption.CHARACTER_EXPRESSION:
          prefix = "把圖中人物的表情換成";
          if (analysisData.characterExpression) descriptionParts.push(analysisData.characterExpression);
          break;
        case AnalysisOption.PHOTO_BACKGROUND:
          prefix = "把照片背景換成";
          if (analysisData.photoBackground) descriptionParts.push(analysisData.photoBackground);
          break;
        case AnalysisOption.CAMERA_ANGLE: // New case for CAMERA_ANGLE
          prefix = "把圖中鏡頭角度換成";
          if (analysisData.cameraAngle) descriptionParts.push(analysisData.cameraAngle);
          break;
        default:
          prefix = "將圖中內容修改為以下描述："; // Fallback for unexpected single options
          break;
      }
    } else if (isOtherSelectedAlone) {
      // If 'OTHER' is the only option, use a general prefix and its specific analysis
      prefix = "將圖中內容修改為以下描述：";
      if (analysisData.otherAnalysis) descriptionParts.push(analysisData.otherAnalysis);
    } else {
      // Multiple options selected or no options selected (analyze all standard items by default)
      prefix = "將圖中內容修改為以下描述：";

      // Determine which options to display based on user selection or default (all standard)
      const optionsToConsider = isNoOptionSelected
        ? [AnalysisOption.CHARACTER_ATTIRE, AnalysisOption.CHARACTER_POSE, AnalysisOption.CHARACTER_EXPRESSION, AnalysisOption.PHOTO_BACKGROUND, AnalysisOption.CAMERA_ANGLE] // Added CAMERA_ANGLE
        : options;

      if (optionsToConsider.includes(AnalysisOption.CHARACTER_ATTIRE) && analysisData.characterAttire) descriptionParts.push(analysisData.characterAttire);
      if (optionsToConsider.includes(AnalysisOption.CHARACTER_POSE) && analysisData.characterPose) descriptionParts.push(analysisData.characterPose);
      if (optionsToConsider.includes(AnalysisOption.CHARACTER_EXPRESSION) && analysisData.characterExpression) descriptionParts.push(analysisData.characterExpression);
      if (optionsToConsider.includes(AnalysisOption.PHOTO_BACKGROUND) && analysisData.photoBackground) descriptionParts.push(analysisData.photoBackground);
      if (optionsToConsider.includes(AnalysisOption.CAMERA_ANGLE) && analysisData.cameraAngle) descriptionParts.push(analysisData.cameraAngle); // Added CAMERA_ANGLE

      // Always include 'OTHER' if it was selected and an analysis was returned
      if (optionsToConsider.includes(AnalysisOption.OTHER) && analysisData.otherAnalysis) descriptionParts.push(analysisData.otherAnalysis);
    }

    // Filter out any empty strings and join the descriptions
    const combinedDescription = descriptionParts.filter(Boolean).join('。');
    return `${prefix} ${combinedDescription.trim()}`;
  };

  const displayPromptContent = React.useMemo(() => {
    if (isLoading) {
      return '分析中，請稍候...';
    }
    if (error) {
      return `錯誤: ${error}`;
    }
    if (rawAnalysisResult) { // Check for rawAnalysisResult existence
      return generateFullRefinePrompt(rawAnalysisResult, selectedOptions);
    }
    return '分析結果將在此處顯示...';
  }, [isLoading, error, rawAnalysisResult, selectedOptions]); // Update dependencies

  const showActionButtons = rawAnalysisResult && !isLoading && !error;

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-md mt-6 flex-grow flex flex-col">
      <h3 className="text-xl font-semibold mb-3 text-gray-100">AI 改圖指令 (Refine Prompt)</h3>
      <textarea
        className="w-full flex-grow p-3 border border-gray-600 rounded-md bg-gray-700 text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none custom-scrollbar"
        value={displayPromptContent}
        readOnly
        placeholder="分析結果將在此處顯示..."
        // Removed rows={6} to allow flex-grow to work properly for scrolling content
        aria-label="AI 改圖指令輸出"
      ></textarea>
      {showActionButtons && (
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={onRefineDetailRequest}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md font-semibold transition-colors duration-200
                        ${isLoading ? 'bg-indigo-700 cursor-not-allowed text-gray-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
            aria-label="要求更細緻的描述"
          >
            要求更細緻的描述
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(displayPromptContent)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold transition-colors duration-200"
            aria-label="複製指令"
          >
            複製指令
          </button>
        </div>
      )}
    </div>
  );
};

export default PromptOutput;