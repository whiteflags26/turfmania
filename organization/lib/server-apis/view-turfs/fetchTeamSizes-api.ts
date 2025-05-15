export const fetchTeamSizes = async (): Promise<
  { _id: string; name: number }[]
> => {
  const res = await fetch(
    `/api/v1/team-sizes`
  );
  if (!res.ok) throw new Error("Failed to fetch team sizes");
  const data = await res.json();
  return data.data;
};
