// utils/handleAxiosError.ts
import axios from 'axios';

export function handleAxiosError(error: unknown, fallbackMessage = 'An error occurred'): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallbackMessage;
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return fallbackMessage;
  }
}
