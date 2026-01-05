export default function FloatingCard({
    children,
    className = '',
    hover = false,
    gradient = false,
    glass = false,
    ...props
}) {
    let cardClasses = 'bg-black-card rounded-xl p-6 border border-gray-dark shadow-dark-lg'

    if (hover) {
        cardClasses += ' transition-all duration-300 hover:border-green-primary hover:shadow-glow-sm hover:-translate-y-1 cursor-pointer'
    }

    if (gradient) {
        cardClasses = 'relative bg-black-card rounded-xl p-6 shadow-dark-lg'
        return (
            <div
                className={`${cardClasses} ${className}`}
                style={{
                    background: 'linear-gradient(#121212, #121212) padding-box, linear-gradient(135deg, #00dd77, #00ff88) border-box',
                    border: '1px solid transparent'
                }}
                {...props}
            >
                {children}
            </div>
        )
    }

    if (glass) {
        cardClasses = 'bg-black-card bg-opacity-40 backdrop-blur-md border border-gray-dark rounded-xl p-6 shadow-dark-lg'
    }

    return (
        <div className={`${cardClasses} ${className}`} {...props}>
            {children}
        </div>
    )
}


