/**
 * Generates a link to BariKoi Maps for a specific location
 * @param lat Latitude of the location
 * @param lon Longitude of the location
 * @returns URL to BariKoi Maps with the specified location marker
 */
export const generateBariKoiMapLink = (lat: number, lon: number): string => {
  return `https://maps.barikoi.com/#18/${lat}/${lon}?setMarker=true`;
};