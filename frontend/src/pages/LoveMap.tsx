import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api/api';
import { Heart, Loader2 } from 'lucide-react';

// Sửa lỗi hiển thị icon của Leaflet trong React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface IPlace {
  _id: string;
  name: string;
  address: string;
  location: {
    coordinates: number[];
  };
}

const LoveMap: React.FC = () => {
  const [places, setPlaces] = useState<IPlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const res = await api.get('/places');
        setPlaces(res.data.data.filter((p: IPlace) => p.location && p.location.coordinates[0] !== 0));
      } catch (err) {
        console.error('Lỗi khi tải bản đồ');
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-2 md:px-4 py-6 md:py-8 h-[calc(100vh-180px)] min-h-[500px]">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Bản đồ Tình yêu</h1>
        <p className="text-gray-600 text-sm italic">Những nơi chúng ta đã cùng nhau đi qua... 🗺️❤️</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="h-full rounded-[2rem] overflow-hidden shadow-lg border-4 border-white">
          <MapContainer 
            center={[10.762622, 106.660172] as any} // Tọa độ mặc định (ví dụ TP.HCM)
            zoom={13} 
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {places.map((place) => (
              <Marker 
                key={place._id} 
                position={[place.location.coordinates[1], place.location.coordinates[0]] as any}
              >
                <Popup>
                  <div className="text-center p-2">
                    <Heart size={16} className="text-primary fill-primary mx-auto mb-1" />
                    <strong className="text-gray-800 block">{place.name}</strong>
                    <span className="text-xs text-gray-500">{place.address}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default LoveMap;
