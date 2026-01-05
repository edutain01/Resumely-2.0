export default function GlowButton({
    children,
    variant = 'primary',
    size = 'md',
    onClick,
    disabled = false,
    className = '',
    type = 'button',
    ...props
}) {
    const baseClasses = 'font-semibold rounded-lg transition-all duration-300 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
        primary: 'bg-gradient-green text-black hover:shadow-glow hover:scale-105 active:scale-100',
        secondary: 'bg-black-card text-green-neon border border-green-primary hover:border-green-neon hover:shadow-glow-sm',
        ghost: 'text-green-neon hover:bg-black-hover',
        danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-glow-lg',
    }

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}


