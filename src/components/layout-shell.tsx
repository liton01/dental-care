import Sidebar from "./sidebar";
import Topbar from "./topbar";

export default function LayoutShell({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Sidebar />

            <Topbar />

            <main className="min-h-screen pt-20 lg:ml-64">
                <div className="mx-auto max-w-7xl p-4 md:p-6">
                    {children}
                </div>
            </main>
        </>
    );
}