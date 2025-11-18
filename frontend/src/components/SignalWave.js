import { motion } from "framer-motion";

export default function SignalWave() {
  return (
    <div className="flex gap-1 h-10 mt-4">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-white rounded"
          animate={{
            height: ["20%", "100%", "40%"]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.07
          }}
        />
      ))}
    </div>
  );
}
