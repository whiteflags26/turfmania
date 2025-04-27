import axios from "axios";

export function handleAxiosError(error: unknown, customMessage = 'An error occurred') {
    if (axios.isAxiosError(error)) {
      console.error(customMessage, error.response?.data?.message);
      return error.response?.data?.message || customMessage;
    } else if (error instanceof Error) {
      console.error(customMessage, error.message);
      return error.message;
    } else {
      console.error(customMessage, 'Unknown error');
      return customMessage;
    }
  }