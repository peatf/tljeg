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
      boxShadow: node.isVoid && useVoidGlow ? '0 0 0 rgba(31, 41, 55, 0)' : undefined
    },
    hover: {
      scale: motionPrefs.shouldAnimate('scale') ? 1.02 : 1,
      opacity: 1
    },
    active: {
      scale: motionPrefs.shouldAnimate('breathing') && shouldAnimateThisNode
        ? [0.98, 1.02, 0.98] 
        : 1,
      opacity: motionPrefs.shouldAnimate('breathing') && shouldAnimateThisNode
        ? [0.8, 1, 0.8]
        : 1,
      boxShadow: node.isVoid && useVoidGlow && motionPrefs.shouldAnimate('glow')
        ? [
            '0 0 20px rgba(31, 41, 55, 0.3)',
            '0 0 40px rgba(31, 41, 55, 0.6)', 
            '0 0 20px rgba(31, 41, 55, 0.3)'
          ]
        : undefined
    }
  };

  const transition = {
    duration: motionPrefs.shouldAnimate('breathing') || motionPrefs.shouldAnimate('glow') ? 4 : 0,
    repeat: (motionPrefs.shouldAnimate('breathing') || motionPrefs.shouldAnimate('glow')) && shouldAnimateThisNode ? Infinity : 0,
    ease: 'easeInOut'
  };

  return (
    <motion.div
      variants={nodeVariants}
      initial="default"
      animate={isActive ? 'active' : 'default'}
      whileHover="hover"
      whileFocus="hover"
      transition={transition}
      className={className}
    >
      <Link
        to={node.to}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={node.ariaLabel}
        className={`
          inline-flex flex-col items-center justify-center p-4 transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-600 focus-visible:ring-offset-2
          hover:scale-105 active:scale-95
          ${node.isVoid ? 'text-bone-50' : 'text-ink-800'}
        `}
      >
        {assetMap[node.id] && (
          <img
            src={assetMap[node.id]}
            alt={node.label}
            className={`artifact-icon ${
              node.isVoid ? 'void-icon' : ''
            }`}
          />
        )}
        <span className={`mt-2 font-medium text-center ${
          node.isVoid ? 'text-sm md:text-base' : 'text-xs md:text-sm'
        }`}>
          {node.label}
        </span>
      </Link>
    </motion.div>
  );
}