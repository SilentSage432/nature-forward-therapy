import { StudioSubnav } from "@/components/admin/studio/StudioSubnav";

type StudioShellHeaderProps = {
  title: string;
  description: string;
};

export function StudioShellHeader({
  title,
  description,
}: StudioShellHeaderProps) {
  return (
    <header className="space-y-5">
      <div>
        <p className="text-xs font-semibold tracking-wide text-gold uppercase">
          Website Studio
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-white">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sage-light">{description}</p>
      </div>
      <StudioSubnav />
    </header>
  );
}
