import { Loader2, Compass } from "lucide-react";

export function AuthLoadingSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#11110F] text-[#F3F0E8]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1A1916] border border-[#302E29] flex items-center justify-center text-[#315CFF] shadow-lg shadow-black/40">
          <Compass className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-xs text-[#A8A49A]">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#315CFF]" />
          <span>Loading CareerOS workspace...</span>
        </div>
      </div>
    </div>
  );
}
