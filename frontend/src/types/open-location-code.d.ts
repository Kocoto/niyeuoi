declare module 'open-location-code' {
  export class OpenLocationCode {
    isValid(code: string): boolean;
    isFull(code: string): boolean;
    isShort(code: string): boolean;
    encode(latitude: number, longitude: number, codeLength?: number): string;
    decode(code: string): { latitudeCenter: number; longitudeCenter: number; latitudeLo: number; latitudeHi: number; longitudeLo: number; longitudeHi: number; codeLength: number };
    recoverNearest(shortCode: string, referenceLatitude: number, referenceLongitude: number): string;
    shorten(code: string, latitude: number, longitude: number): string;
  }
}
