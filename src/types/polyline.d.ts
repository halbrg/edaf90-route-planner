declare module '@mapbox/polyline' {
  const polyline: {
    encode(points: [number, number][]): string;
    decode(encoded: string): [number, number][];
  };
  export default polyline;
}
