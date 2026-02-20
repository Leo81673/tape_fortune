import React, { useState, useEffect } from 'react';

const TAPE_LOCATION = {
  lat: 37.5340,
  lng: 126.9948,
  radius: 100 // meters
};

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function LocationGate({ onLocationVerified, config, bypassLocationCheck = false }) {
  const [status, setStatus] = useState('checking'); // checking, verified, denied, error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const locationCheckEnabled = config?.location_check_enabled !== false;

    if (bypassLocationCheck || !locationCheckEnabled) {
      setStatus('verified');
      onLocationVerified();
      return;
    }

    checkLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bypassLocationCheck]);

  const checkLocation = () => {
    const locationCheckEnabled = config?.location_check_enabled !== false;

    if (bypassLocationCheck || !locationCheckEnabled) {
      setStatus('verified');
      onLocationVerified();
      return;
    }

    setStatus('checking');

    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMsg('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = config?.location_lat || TAPE_LOCATION.lat;
        const lng = config?.location_lng || TAPE_LOCATION.lng;
        const radius = config?.location_radius || TAPE_LOCATION.radius;

        const distance = getDistance(
          position.coords.latitude,
          position.coords.longitude,
          lat,
          lng
        );

        if (distance <= radius) {
          setStatus('verified');
          onLocationVerified();
        } else {
          setStatus('denied');
        }
      },
      (error) => {
        setStatus('error');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrorMsg('위치 접근 권한을 허용해주세요.');
            break;
          case error.POSITION_UNAVAILABLE:
            setErrorMsg('위치 정보를 가져올 수 없습니다.');
            break;
          case error.TIMEOUT:
            setErrorMsg('위치 확인 시간이 초과되었습니다.');
            break;
          default:
            setErrorMsg('위치를 확인할 수 없습니다.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  if (status === 'checking') {
    return (
      <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="text-center">
          <div style={{ fontSize: 48, marginBottom: 24 }}>📍</div>
          <p className="text-dim">위치를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (status === 'verified') {
    return null; // Will be handled by parent
  }

  return (
    <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="text-center">
        <div style={{ fontSize: 48, marginBottom: 24 }}>
          {status === 'denied' ? '🚫' : '⚠️'}
        </div>
        <h2 style={{ color: 'var(--color-gold)', marginBottom: 12, fontSize: 18 }}>
          {status === 'denied'
            ? 'TAPE Seoul에서만 이용 가능합니다'
            : '위치 확인 오류'
          }
        </h2>
        <p className="text-dim text-sm" style={{ lineHeight: 1.6, marginBottom: 24 }}>
          {status === 'denied'
            ? '이 서비스는 TAPE Seoul 현장에서만 이용하실 수 있습니다. 매장을 방문해주세요!'
            : errorMsg
          }
        </p>
        <button className="btn-secondary" onClick={checkLocation}>
          다시 확인하기
        </button>
      </div>
    </div>
  );
}
