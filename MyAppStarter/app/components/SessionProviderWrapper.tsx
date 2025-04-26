"use client";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const SessionProviderWrapper = ({ children }: Props) => (
  <SessionProvider>{children}</SessionProvider>
);

export default SessionProviderWrapper; 