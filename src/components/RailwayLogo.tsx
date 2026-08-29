import React from 'react';

interface RailwayLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RailwayLogo: React.FC<RailwayLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}>
      {/* Outer Crimson / Red Emblem Circle */}
      <div className="w-full h-full rounded-full bg-[#c1121f] p-0.5 shadow-xs flex items-center justify-center border-2 border-white">
        <div className="w-full h-full rounded-full border border-amber-300/80 flex items-center justify-center bg-gradient-to-b from-[#b91c1c] to-[#991b1b]">
          {/* Emblem Train & Chakra Vector */}
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-4/5 h-4/5 text-amber-200"
          >
            {/* Center Ashoka / Rail Wheel */}
            <circle cx="24" cy="24" r="18" stroke="#fef08a" strokeWidth="1.8" strokeDasharray="2 1.5" />
            <circle cx="24" cy="24" r="14" stroke="#ffffff" strokeWidth="1.2" />
            <circle cx="24" cy="24" r="3" fill="#ffffff" />
            
            {/* Train Engine Front Silhouette */}
            <path
              d="M16 16C16 14.5 17.5 13 24 13C30.5 13 32 14.5 32 16V28C32 29.5 30.5 31 24 31C17.5 31 16 29.5 16 28V16Z"
              fill="#ffffff"
            />
            {/* Cab Windshield */}
            <path d="M18 17H30V21H18V17Z" fill="#991b1b" />
            {/* Headlights */}
            <circle cx="19" cy="26" r="1.5" fill="#facc15" />
            <circle cx="29" cy="26" r="1.5" fill="#facc15" />
            {/* Cowcatcher / Pilot */}
            <path d="M15 32L19 29H29L33 32H15Z" fill="#fef08a" />
            {/* Tracks */}
            <line x1="12" y1="35" x2="36" y2="35" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="17" y1="35" x2="15" y2="38" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="24" y1="35" x2="24" y2="38" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="31" y1="35" x2="33" y2="38" stroke="#ffffff" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
};
