import React from 'react';

// Em um projeto maior, você pode usar uma biblioteca como 'cva' (class-variance-authority)
const getButtonClasses = (variant = 'default', size = 'default') => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 hover:text-blue-600',
  };

  const sizes = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md',
  };

  return `${baseClasses} ${variants[variant]} ${sizes[size]}`;
};

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  const classes = getButtonClasses(variant, size);
  return (
    <button className={`${classes} ${className || ''}`} ref={ref} {...props} />
  );
});
Button.displayName = 'Button';

export { Button };