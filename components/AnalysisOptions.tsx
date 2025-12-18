import React from 'react';
import { AnalysisOption } from '../types';

interface AnalysisOptionsProps {
  selectedOptions: AnalysisOption[];
  onOptionChange: (options: AnalysisOption[]) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  imageUploaded: boolean;
}

const allOptions: AnalysisOption[] = [
  AnalysisOption.CHARACTER_ATTIRE,
  AnalysisOption.CHARACTER_POSE,
  AnalysisOption.CHARACTER_EXPRESSION,
  AnalysisOption.PHOTO_BACKGROUND,
  AnalysisOption.CAMERA_ANGLE, // 新增 '鏡頭角度' 選項
  AnalysisOption.OTHER, // 新增 '其他' 選項
];

const AnalysisOptions: React.FC<AnalysisOptionsProps> = ({
  selectedOptions,
  onOptionChange,
  onAnalyze,
  isLoading,
  imageUploaded,
}) => {
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Array.from(event.target.selectedOptions, (option: HTMLOptionElement) => option.value) as AnalysisOption[];
    onOptionChange(value);
  };

  const isAnalyzeButtonDisabled = isLoading || !imageUploaded;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 bg-gray-800 rounded-lg shadow-md space-y-4 sm:space-y-0 sm:space-x-4">
      <div className="flex-grow">
        <label htmlFor="analysis-options" className="sr-only">
          選擇分析選項
        </label>
        <select
          id="analysis-options"
          multiple
          className="block w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm h-32 overflow-y-auto custom-scrollbar"
          value={selectedOptions}
          onChange={handleSelectChange}
          disabled={isLoading}
          aria-label="圖片內容分析選項"
        >
          {allOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-400">
          按住 Ctrl/Cmd 鍵可選擇多個選項。若不選擇，則分析所有選項。
        </p>
      </div>

      <button
        onClick={onAnalyze}
        disabled={isAnalyzeButtonDisabled}
        className={`px-6 py-2 rounded-md font-semibold text-white transition-colors duration-200 w-full sm:w-auto
                   ${isAnalyzeButtonDisabled
                       ? 'bg-gray-600 cursor-not-allowed'
                       : 'bg-blue-600 hover:bg-blue-700'
                   }`}
        aria-label="分析圖片"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            分析中...
          </span>
        ) : (
          '分析圖片'
        )}
      </button>
    </div>
  );
};

export default AnalysisOptions;