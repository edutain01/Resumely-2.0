export default function LoadingSpinner({ size = 'md', color = 'primary' }) {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    }

    const colors = {
        primary: 'border-primary-200 border-t-primary-500',
        accent: 'border-accent-200 border-t-accent-500',
        white: 'border-white/20 border-t-white',
        success: 'border-success-200 border-t-success-500'
    }

    return (
        <div className={`${sizes[size]} border-4 ${colors[color]} rounded-full animate-spin`}></div>
    )
}
