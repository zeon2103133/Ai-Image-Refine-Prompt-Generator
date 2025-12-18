export enum AnalysisOption {
  CHARACTER_ATTIRE = '角色裝束',
  CHARACTER_POSE = '角色姿勢/動態',
  CHARACTER_EXPRESSION = '角色表情',
  PHOTO_BACKGROUND = '照片背景',
  CAMERA_ANGLE = '鏡頭角度', // 新增 '鏡頭角度' 選項
  OTHER = '其他', // 新增 '其他' 選項
}

export interface ImageAnalysisResult {
  characterAttire?: string;
  characterPose?: string;
  characterExpression?: string;
  photoBackground?: string;
  cameraAngle?: string; // For the '鏡頭角度' option
  otherAnalysis?: string; // For the '其他' option
}

export interface TabContentState {
  uploadedImage: string | null; // Base64 image data
  selectedOptions: AnalysisOption[];
  rawAnalysisResult: ImageAnalysisResult | null; // New structured analysis result
  isLoading: boolean;
  error: string | null;
  otherAnalysisText: string; // 新增自定義分析文本
}

export interface Tab {
  id: string;
  name: string;
  contentState: TabContentState;
}

// Function to decode base64 string to Uint8Array
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Function to encode Uint8Array to base64 string
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}