import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
    xl: 'px-6 py-3.5 text-base gap-3'
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-dark-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 active:scale-[0.98]',
    secondary:
      'bg-dark-800 hover:bg-dark-700 text-slate-200 border border-dark-700 hover:border-amber-500/30 hover:text-white',
    orange:
      'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-lg shadow-orange-500/20 active:scale-[0.98]',
    outline:
      'bg-transparent border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:border-amber-400',
    danger:
      'bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white',
    ghost:
      'bg-transparent hover:bg-dark-800 text-slate-400 hover:text-slate-100'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};
