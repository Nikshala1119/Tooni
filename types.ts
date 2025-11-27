export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

// Error types for user-friendly messaging
export enum ErrorType {
  NONE = 'NONE',
  MIC_PERMISSION_DENIED = 'MIC_PERMISSION_DENIED',
  MIC_NOT_FOUND = 'MIC_NOT_FOUND',
  BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED',
  API_KEY_MISSING = 'API_KEY_MISSING',
  API_CONNECTION_FAILED = 'API_CONNECTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SESSION_ENDED = 'SESSION_ENDED',
  UNKNOWN = 'UNKNOWN',
}

// Child-friendly error messages with emojis and simple language
export const ERROR_MESSAGES: Record<ErrorType, { title: string; message: string; emoji: string; action: string }> = {
  [ErrorType.NONE]: {
    title: '',
    message: '',
    emoji: '',
    action: '',
  },
  [ErrorType.MIC_PERMISSION_DENIED]: {
    title: 'Microphone Blocked',
    message: "I can't hear you! Please ask a grown-up to allow microphone access.",
    emoji: '🎤🚫',
    action: 'Allow Microphone',
  },
  [ErrorType.MIC_NOT_FOUND]: {
    title: 'No Microphone Found',
    message: "I can't find your microphone! Please plug one in or ask a grown-up for help.",
    emoji: '🔌',
    action: 'Try Again',
  },
  [ErrorType.BROWSER_NOT_SUPPORTED]: {
    title: 'Browser Not Supported',
    message: 'This browser is too old! Please ask a grown-up to use Chrome or Safari.',
    emoji: '🌐',
    action: 'OK',
  },
  [ErrorType.API_KEY_MISSING]: {
    title: 'Setup Needed',
    message: 'The app needs to be set up! Please ask a grown-up for help.',
    emoji: '🔧',
    action: 'OK',
  },
  [ErrorType.API_CONNECTION_FAILED]: {
    title: 'Connection Problem',
    message: "I couldn't connect to my brain! Let's try again.",
    emoji: '🧠💭',
    action: 'Try Again',
  },
  [ErrorType.NETWORK_ERROR]: {
    title: 'No Internet',
    message: "I can't reach the internet! Please check your connection.",
    emoji: '📡',
    action: 'Try Again',
  },
  [ErrorType.SESSION_ENDED]: {
    title: 'Call Ended',
    message: 'Our call got disconnected. Want to call again?',
    emoji: '📞',
    action: 'Call Again',
  },
  [ErrorType.UNKNOWN]: {
    title: 'Oops!',
    message: 'Something went wrong. Let\'s try again!',
    emoji: '😅',
    action: 'Try Again',
  },
};

export interface AudioVisualizerState {
  volume: number; // 0 to 1
  isTalking: boolean;
}