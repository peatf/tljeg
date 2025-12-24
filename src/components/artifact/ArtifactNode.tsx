import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ArtifactNode as NodeConfig } from '../../config/artifactFlow';
import { useMotionPrefs } from './useMotionPrefs';
import { trackArtifactMapNavigate } from '../../lib/analytics';

// Import assets
import safetySvg from '../../assets/safety.svg';
import claritySvg from '../../assets/clarity.svg';
import calibrationSvg from '../../assets/calibration.svg';
import implementationSvg from '../../assets/implementation.svg';
import breathingSvg from '../../assets/breathing.svg';
import voidImage from '../../assets/VOID_1.webp';

interface ArtifactNodeProps {
  node: NodeConfig;
  isActive?: boolean;
  isHighlighted?: boolean;
  className?: string;
  onNavigate?: (from: string | null, to: string) => void;
}

// Asset mapping
const assetMap: Record<string, string> = {
  'safety': safetySvg,
  'clarity': claritySvg,
  'calibration': calibrationSvg,
  'implementation': implementationSvg,
  'resets': breathingSvg,
  'void': voidImage
};

export function ArtifactNode({
  node,
  isActive = false,
  isHighlighted = false,
  className = '',
  onNavigate
}: ArtifactNodeProps) {
  const location = useLocation();
  const motionPrefs = useMotionPrefs();

  const handleClick = () => {
    const fromRoute = location.pathname;
    const fromNodeId = fromRoute.split('/').pop() || null;

    onNavigate?.(fromNodeId, node.id);

    trackArtifactMapNavigate({
      from: fromNodeId,
      to: node.id,
      step_index: node.stepIndex,
      source: 'node'
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Check motion style preference from environment
  const motionStyle = import.meta.env.SITE_MOTION_STYLE || 'node_breath';
  const useVoidGlow = motionStyle === 'void_glow';
  const useNodeBreath = motionStyle === 'node_breath';

  // For VOID glow mode, only VOID node gets animation
  const shouldAnimateThisNode = useNodeBreath
    ? isActive
    : (useVoidGlow && node.isVoid);

  const nodeVariants = {
    default: {
      scale: 1,
      opacity: 1,
      filter: 'grayscale(0%)',
    },
    hover: {
      scale: motionPrefs.shouldAnimate('scale') ? 1.05 : 1,
      opacity: 1,
      filter: 'grayscale(0%)',
    },
    active: {
      scale: (motionPrefs.shouldAnimate('breathing') || motionPrefs.shouldAnimate('glow')) && shouldAnimateThisNode
        ? [0.98, 1.02, 0.98]
        : 1.02,
      opacity: (motionPrefs.shouldAnimate('breathing') || motionPrefs.shouldAnimate('glow')) && shouldAnimateThisNode
        ? [0.9, 1, 0.9]
        : 1,
    },
    highlighted: {
      scale: 1.05,
      opacity: 1,
      filter: 'grayscale(0%)',
      transition: { duration: 0.2 }
    }
  };

  const currentVariant = isActive ? 'active' : (isHighlighted ? 'highlighted' : 'default');

  const transition = {
    scale: {
      duration: (motionPrefs.shouldAnimate('breathing') || motionPrefs.shouldAnimate('glow')) && shouldAnimateThisNode ? 4 : 0.3,
      repeat: (motionPrefs.shouldAnimate('breathing') || motionPrefs.shouldAnimate('glow')) && shouldAnimateThisNode ? Infinity : 0,
      ease: 'easeInOut'
    },
    opacity: {
      duration: (motionPrefs.shouldAnimate('breathing') || motionPrefs.shouldAnimate('glow')) && shouldAnimateThisNode ? 4 : 0.3,
      repeat: (motionPrefs.shouldAnimate('breathing') || motionPrefs.shouldAnimate('glow')) && shouldAnimateThisNode ? Infinity : 0,
      ease: 'easeInOut'
    }
  };

  return (
    <motion.div
      variants={nodeVariants}
      initial="default"
      animate={currentVariant}
      whileHover="hover"
      whileFocus="hover"
      transition={transition}
      className={`${className} z-10`}
    >
      <Link
        to={node.to}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={node.ariaLabel}
        className={`
          flex flex-col items-center justify-center p-2 transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-600 focus-visible:ring-offset-4
          rounded-xl
          ${node.isVoid ? 'text-ink-900' : 'text-ink-800'}
        `}
      >
        <div className={`
          relative flex items-center justify-center
          ${node.isVoid ? 'w-24 h-24 md:w-32 md:h-32' : 'w-16 h-16 md:w-20 md:h-20'}
          ${node.isVoid ? '' : 'rounded-full bg-bone-100 shadow-sm border border-bone-200 overflow-hidden'}
          transition-shadow duration-300
          ${isHighlighted && !node.isVoid ? 'ring-2 ring-ink-400 ring-offset-2 shadow-md' : 'group-hover:shadow-md'}
        `}>
          {/* Safety node "Start here" breathing indicator */}
          {node.id === 'safety' && motionPrefs.shouldAnimate('glow') && (
            <motion.div
              className="absolute -inset-2 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(123, 158, 135, 0.4) 0%, rgba(123, 158, 135, 0) 70%)',
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
          {node.isVoid && useVoidGlow && motionPrefs.shouldAnimate('glow') && (
            <motion.div
              className="absolute inset-0 rounded-full bg-ink-600/10"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}

          {assetMap[node.id] && (
            <img
              src={assetMap[node.id]}
              alt=""
              aria-hidden="true"
              className={`
                ${node.isVoid ? 'w-full h-full object-contain' : 'w-10 h-10 md:w-12 md:h-12 object-contain'}
                transition-transform duration-300 group-hover:scale-110
              `}
            />
          )}
        </div>
        <span className={`mt-3 font-semibold text-center tracking-tight ${node.isVoid ? 'text-sm md:text-base uppercase tracking-widest' : 'text-xs md:text-sm'
          }`}>
          {node.label}
        </span>
        {/* "Start here" hint for Safety node */}
        {node.id === 'safety' && (
          <motion.span
            className="text-[10px] md:text-xs text-[#7B9E87] font-medium mt-1"
            animate={motionPrefs.shouldAnimate('opacity') ? {
              opacity: [0.5, 1, 0.5],
            } : {}}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Start here
          </motion.span>
        )}
      </Link>
    </motion.div>
  );
}