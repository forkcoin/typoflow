import { ArrowLeft, Heart, MoreHorizontal } from "lucide-react";

interface TopBarProps {
  title: string;
  favorite: boolean;
  progress: number;
  onBack: () => void;
  onFavorite: () => void;
}

export default function TopBar({ title, favorite, progress, onBack, onFavorite }: TopBarProps) {
  return (
    <header className="reader-topbar">
      <button className="icon-text-button reader-back-button" aria-label="返回书架" onClick={onBack}>
        <ArrowLeft size={18} />
        返回书架
      </button>
      <div className="reader-status">
        <strong>{title}</strong>
        <span>{progress}%</span>
      </div>
      <div className="reader-actions">
        <button className="icon-button" aria-label={favorite ? "取消收藏" : "收藏"} onClick={onFavorite}>
          <Heart size={18} fill={favorite ? "currentColor" : "none"} />
        </button>
        <button className="icon-button" aria-label="更多操作">
          <MoreHorizontal size={18} />
        </button>
      </div>
    </header>
  );
}
