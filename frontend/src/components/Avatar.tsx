interface AvatarProps {
    name: string;
    photoUrl?: string;
    avatarColor: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
  }
  
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-32 h-32 text-5xl',
  };
  
  export default function Avatar({ name, photoUrl, avatarColor, size = 'md', className = '' }: AvatarProps) {
    const initial = name.trim().charAt(0).toUpperCase();
    const sizeClass = sizes[size];
  
    if (photoUrl) {
      return (
        <img
          src={photoUrl}
          alt={name}
          className={`${sizeClass} rounded-full object-cover ring-2 ring-white/10 ${className}`}
        />
      );
    }
  
    return (
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center font-bold ring-2 ring-white/10 flex-shrink-0 ${className}`}
        style={{ backgroundColor: avatarColor }}
      >
        <span className="text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
          {initial}
        </span>
      </div>
    );
  }
  
  // Deterministic color palette — each player always gets the same color for their name
  const AVATAR_COLORS = [
    '#c0392b', '#e74c3c', '#d35400', '#e67e22',
    '#16a085', '#1abc9c', '#2980b9', '#3498db',
    '#8e44ad', '#9b59b6', '#2c3e50', '#7f8c8d',
  ];
  
  export function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }