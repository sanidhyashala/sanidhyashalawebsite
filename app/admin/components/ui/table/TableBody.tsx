import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function TableBody({
  children,
}: Props) {
  return <tbody>{children}</tbody>;
}