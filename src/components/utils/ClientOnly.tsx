import { ComponentProps, useEffect, useState } from "react";

type ClientOnlyProps = ComponentProps<"div"> & {
  skeleton?: React.ReactNode;
};

export function ClientOnly({ children, skeleton, ...rest }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return skeleton;
  }

  return <div {...rest}>{children}</div>;
}
