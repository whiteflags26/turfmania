export const fetchSports = async (): Promise<
  { _id: string; name: string }[]
> => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sports`);
  if (!res.ok) throw new Error("Failed to fetch sports");
  const data = await res.json();
  return data.data;
};
