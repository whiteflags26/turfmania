export async function verifyEmail(token: string, userId: string) {
  const response = await fetch(
    `/api/v1/auth/verify-email?token=${token}&id=${userId}`,
    {
      method: "GET",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ?? "Email verification failed. Please try again."
    );
  }

  return data;
}
