export const fetchTeamSizes = async (): Promise<
  { _id: string; name: number }[]
> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/team-sizes`
  );
  if (!res.ok) throw new Error("Failed to fetch team sizes");
  const data = await res.json();
  return data.data;
};
