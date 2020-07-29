
export const earthRadius = 6371008.8;

const earthCircumfrence = 2 * Math.PI * earthRadius; // meters

export function mercatorXfromLng(lng: number) {
    return (180 + lng) / 360;
}

export function mercatorYfromLat(lat: number) {
    return (180 - (180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)))) / 360;
}

function circumferenceAtLatitude(latitude: number) {
    return earthCircumfrence * Math.cos(latitude * Math.PI / 180);
}
export function mercatorZfromAltitude(altitude: number, lat: number) {
    return altitude / circumferenceAtLatitude(lat);
}