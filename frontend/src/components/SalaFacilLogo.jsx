import React from 'react';
import { Box } from '@mui/material';

const SalaFacilLogo = ({ 
  size = 'medium', 
  variant = 'full', 
  onClick,
  sx = {},
  ...props 
}) => {
  const sizes = {
    small: { width: 120, height: 48 },
    medium: { width: 200, height: 80 },
    large: { width: 400, height: 150 }
  };

  const logoSrc = variant === 'small' || size === 'small' 
    ? '/images/logo-sala-facil-small.svg'
    : '/images/logo-sala-facil.svg';

  return (
    <Box
      component="img"
      src={logoSrc}
      alt="SalaFácil - Gestão de Salas"
      onClick={onClick}
      sx={{
        width: sizes[size].width,
        height: sizes[size].height,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick ? {
          transform: 'scale(1.05)',
          filter: 'brightness(1.1)'
        } : {},
        ...sx
      }}
      {...props}
    />
  );
};

// Componente apenas do ícone
export const SalaFacilIcon = ({ size = 40, color = '#4a4a7a', ...props }) => (
  <Box
    component="div"
    sx={{
      width: size,
      height: size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...props.sx
    }}
    {...props}
  >
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 80 80" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer rounded rectangle */}
      <rect 
        x="4" y="4" width="72" height="72" 
        rx="12" ry="12" 
        fill="none" 
        stroke={color} 
        strokeWidth="4"
      />
      
      {/* Inner rectangle (tablet/screen) */}
      <rect 
        x="16" y="12" width="45" height="54" 
        rx="4" ry="4" 
        fill="#8b7db8"
      />
      
      {/* Checkmark */}
      <path 
        d="M 65 35 L 72 42 L 85 25" 
        fill="none" 
        stroke="#4a9eff" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Small dot on screen */}
      <circle cx="38.5" cy="55" r="2" fill={color} />
    </svg>
  </Box>
);

export default SalaFacilLogo;
