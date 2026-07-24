import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const Route = createRootRoute({
	component: Root,
});

function Root() {
	// Re-key the outlet by pathname so each route replays a soft fade-in on mount.
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return (
		<div className="flex flex-col min-h-screen">
			<ErrorBoundary tagName="main" className="flex-1">
				<div key={pathname} className="lp-page">
					<Outlet />
				</div>
			</ErrorBoundary>
			<TanStackRouterDevtools position="bottom-right" />
		</div>
	);
}
