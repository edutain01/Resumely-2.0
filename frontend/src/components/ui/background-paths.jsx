import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { useSelector } from "react-redux"

function FloatingPaths({ position }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    color: `rgba(15,23,42,${0.1 + i * 0.03})`,
    width: 0.5 + i * 0.03,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="#0ea5e9"
            strokeWidth={path.width}
            strokeOpacity={0.15 + path.id * 0.02}
            initial={{ pathLength: 0.3, opacity: 0.4 }}
            animate={{
              pathLength: 1,
              opacity: [0.2, 0.5, 0.2],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  )
}

export function BackgroundPaths({ title = "Background Paths", showButtons = true }) {
  const words = title.split(" ")
  const { user } = useSelector((state) => state.auth)

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white">
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-8 tracking-tighter">
            {words.map((word, wordIndex) => (
              <span
                key={wordIndex}
                className="inline-block mr-4 last:mr-0"
              >
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay:
                        wordIndex * 0.1 +
                        letterIndex * 0.03,
                      type: "spring",
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="inline-block text-transparent bg-clip-text 
                    bg-gradient-to-r from-primary-600 to-primary-500"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <Button
                  className="rounded-lg px-8 py-4 bg-primary-600 text-white text-lg font-semibold 
                  hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl
                  flex items-center gap-2"
                >
                  <span>Get Started Free</span>
                  <span className="opacity-80 group-hover:opacity-100 group-hover:translate-x-1 
                  transition-all duration-300">
                    →
                  </span>
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  className="rounded-lg px-8 py-4 text-lg font-semibold 
                  border-2 border-primary-600 text-primary-600 hover:bg-primary-50
                  transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

