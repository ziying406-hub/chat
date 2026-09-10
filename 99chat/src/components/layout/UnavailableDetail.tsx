import MobileBackButton from "./MobileBackButton";

export default function UnavailableDetail({ children, to, label }: { children: React.ReactNode; to: string; label: string }) {
  return <div className="flex-1 flex flex-col items-center justify-center text-sm text-gray-300">
    <MobileBackButton to={to} label={label} />
    <span>{children}</span>
  </div>;
}
