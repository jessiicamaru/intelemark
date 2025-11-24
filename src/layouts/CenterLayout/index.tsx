import type { ReactNode } from 'react';

const CenterLayout = ({ children }: { children: ReactNode }) => {
    return <div className="flex items-center justify-center min-h-screen w-full">{children}</div>;
};

export default CenterLayout;
