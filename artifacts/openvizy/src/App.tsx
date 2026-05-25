import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Nav } from "@/components/nav";
import { AuthProvider } from "@/context/auth";
import { ProtectedRoute } from "@/components/protected-route";

import Home from "@/pages/home";
import Create from "@/pages/create";
import Projects from "@/pages/projects";
import Templates from "@/pages/templates";
import Pricing from "@/pages/pricing";
import SocialKit from "@/pages/social-kit";
import Admin from "@/pages/admin";
import About from "@/pages/about";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <>
      <Nav />
      <Switch>
        {/* Public — marketing & info pages */}
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/templates" component={Templates} />
        <Route path="/admin" component={Admin} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/social-kit" component={SocialKit} />
        <Route path="/about" component={About} />

        {/* Protected — must be logged in */}
        <Route path="/create">{() => <ProtectedRoute component={Create} />}</Route>
        <Route path="/projects">{() => <ProtectedRoute component={Projects} />}</Route>

        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
