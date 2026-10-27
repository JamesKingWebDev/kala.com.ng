import { createContext, useContext, useState, ReactNode } from "react";

export type Page = string;

interface NavCtx {
  page: Page;
  navigate: (to: Page) => void;
}

const Ctx = createContext<NavCtx>({ page: "/", navigate: () => {} });

export function NavProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>("/");
  return <Ctx.Provider value={{ page, navigate: setPage }}>{children}</Ctx.Provider>;
}

export function useNav() {
  return useContext(Ctx);
}

interface LinkProps {
  to: Page;
  className?: string;
  children: ReactNode;
}

export function Link({ to, className, children }: LinkProps) {
  const { navigate } = useNav();
  return (
    <a
      href="#"
      className={className}
      onClick={(e) => { e.preventDefault(); navigate(to); }}
    >
      {children}
    </a>
  );
}
