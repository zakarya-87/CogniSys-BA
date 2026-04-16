
import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center font-black rounded-2xl focus:outline-none transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-[0.15em] text-[11px]";
  
  const sizeStyles = {
    sm: "px-4 py-2",
    md: "px-6 py-3",
    lg: "px-8 py-4 text-xs",
    xl: "px-10 py-5 text-sm"
  };

  const variants = {
    primary: "bg-accent-teal text-primary hover:shadow-[0_0_25px_rgba(0,212,170,0.4)] border border-transparent",
    secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10",
    outline: "bg-transparent text-white/60 border-2 border-white/5 hover:border-accent-teal/50 hover:text-accent-teal",
    ghost: "bg-transparent text-white/30 hover:bg-white/5 hover:text-accent-teal transition-all",
    danger: "bg-accent-red text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] border border-transparent",
    glass: "glass-card text-white border border-white/5 hover:bg-white/10 shadow-xl",
    neon: "bg-surface-darker text-accent-teal border border-accent-teal shadow-[0_0_20px_rgba(0,212,170,0.2)] hover:shadow-[0_0_35px_rgba(0,212,170,0.5)]"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      {...props}
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};
