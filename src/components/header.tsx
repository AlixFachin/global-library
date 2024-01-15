import { useMemo } from "react";
import Link from "next/link";
import { useUser, SignInButton, SignOutButton } from "@clerk/nextjs";

const NavButton: React.FC<{
  label: string;
  link?: string;
  child?: React.ReactNode;
}> = ({ label, link, child }) => {
  const innerComponent = useMemo(() => {
    if (child) return child;
    if (link) return <Link href={link}>{label}</Link>;
    return label;
  }, [child, link, label]);

  return (
    <div className="mr-2 rounded-md bg-[#CCD5AE] px-4 py-2 text-xl">
      {innerComponent}
    </div>
  );
};

export const Header: React.FC = () => {
  const user = useUser();

  return (
    <header className="fixed top-0 flex h-20 w-full bg-[#FEFAE0] p-4 text-xl">
      <div className="text-4xl">The Global Library</div>
      <div className="flex-grow"></div>

      <NavButton label="Feed" link="/" />
      <NavButton label="Search" />
      {!!user.isSignedIn ? <NavButton label="My Books" link="/myfeed" /> : null}
      {!!user.isSignedIn ? <NavButton label="Profile" link="/profile" /> : null}
      {!user.isSignedIn ? <NavButton label="Sign Up" /> : null}
      <NavButton
        label=""
        child={
          <div>
            {!user.isSignedIn && <SignInButton />}
            {!!user.isSignedIn && <SignOutButton />}
          </div>
        }
      />
    </header>
  );
};
