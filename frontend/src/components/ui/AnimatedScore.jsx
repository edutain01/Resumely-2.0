import { useEffect, useState } from 'react'

export default function AnimatedScore({ score, size = 'md', label = 'Score' }) {
    const [displayScore, setDisplayScore] = useState(0)

    useEffect(() => {
        let start = 0
        const end = score
        const duration = 1500
        const increment = end / (duration / 16)

        const timer = setInterval(() => {
            start += increment
            if (start >= end) {
                setDisplayScore(end)
                clearInterval(timer)
            } else {
                setDisplayScore(Math.floor(start))
            }
        }, 16)

        return () => clearInterval(timer)
    }, [score])

    const getColor = (score) => {
        if (score >= 80) return { stroke: '#22c55e', text: 'text-success-700' } // Green
        if (score >= 60) return { stroke: '#eab308', text: 'text-warning-700' } // Yellow
        return { stroke: '#ef4444', text: 'text-error-700' } // Red
    }

    const sizes = {
        sm: { circle: 80, strokeWidth: 6, fontSize: 'text-2xl' },
        md: { circle: 120, strokeWidth: 8, fontSize: 'text-4xl' },
        lg: { circle: 160, strokeWidth: 10, fontSize: 'text-5xl' }
    }

    const config = sizes[size]
    const radius = (config.circle - config.strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (displayScore / 100) * circumference
    const colors = getColor(displayScore)

    return (
        <div className="flex flex-col items-center">
            <div className="relative" style={{ width: config.circle, height: config.circle }}>
                <svg width={config.circle} height={config.circle} className="transform -rotate-90">
                    <circle
                        cx={config.circle / 2}
                        cy={config.circle / 2}
                        r={radius}
                        stroke="#e5e5e5"
                        strokeWidth={config.strokeWidth}
                        fill="none"
                    />
                    <circle
                        cx={config.circle / 2}
                        cy={config.circle / 2}
                        r={radius}
                        stroke={colors.stroke}
                        strokeWidth={config.strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-bold ${config.fontSize} ${colors.text}`}>{displayScore}</span>
                    {label && <span className="text-sm text-neutral-600 font-medium mt-1">{label}</span>}
                </div>
            </div>
        </div>
    )
}
