import { ACTIVE_CITIES } from '../../lib/constants';

export type { ActiveCity } from '../../lib/constants';

export { ACTIVE_CITIES };

export type CourtType = 'indoor' | 'outdoor' | 'hybrid' | 'private';

export interface Court {
  id: string;
  name: string;
  city: ActiveCity;
  type: CourtType;
  lat: number;
  lng: number;
  hasAdmin: boolean;
  qrCode: string;
}

export const COURTS: Court[] = [
  { id: 'usd-wellness', name: 'USD Wellness Center Gym', city: 'San Diego', type: 'indoor', lat: 32.7157, lng: -117.1611, hasAdmin: true, qrCode: 'USD-WELLNESS-QR' },
  { id: 'linda-vista', name: 'Linda Vista Basketball Court', city: 'San Diego', type: 'outdoor', lat: 32.7689, lng: -117.1902, hasAdmin: false, qrCode: 'LINDA-VISTA-QR' },
  { id: 'mission-valley-ymca', name: 'Mission Valley YMCA', city: 'San Diego', type: 'hybrid', lat: 32.7653, lng: -117.1578, hasAdmin: true, qrCode: 'MISSION-VALLEY-YMCA-QR' },
  { id: 'brian-piccolo', name: 'Brian Piccolo Basketball Court', city: 'Broward', type: 'outdoor', lat: 26.1224, lng: -80.1373, hasAdmin: false, qrCode: 'BRIAN-PICCOLO-QR' },
  { id: 'flamingo-park', name: 'Flamingo Park', city: 'Miami', type: 'outdoor', lat: 25.7825, lng: -80.1396, hasAdmin: false, qrCode: 'FLAMINGO-PARK-QR' },
  { id: 'miami-hoop-culture', name: 'Miami Hoop Culture Park', city: 'Miami', type: 'private', lat: 25.7742, lng: -80.1936, hasAdmin: true, qrCode: 'MIAMI-HOOP-CULTURE-QR' },
];
